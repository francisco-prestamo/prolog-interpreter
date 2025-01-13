import { ASTNode } from "../AST/Nodes/ASTNode";
import { Clause } from "../AST/Nodes/Clause";
import { Cut } from "../AST/Nodes/Cut";
import { Functor } from "../AST/Nodes/Functor";
import { Subclause } from "../AST/Nodes/Subclause";
import { Variable } from "../AST/Nodes/Variable";
import { NodeType } from "../AST/NodeTypes";
import { SolveOptions } from "../Interface";
import { TokenType } from "../Lexer/Token";
import { NodePL, PLNodeType } from "../PrologTree/NodePL";
import { compare } from "./Comparer";
import { evaluate } from "./Evaluator";
import { RecursiveTypeError } from "./Resolver";
import { emptyUnifier, Unifier, unify } from "./Unifier";
import { extractVariableNames } from "./VariableExtractor";
import { isLiteralValue } from "./LiteralValue";

export class SemanticError extends Error {
  constructor(message: string){
    super(message);
  }
}

export class Interpreter {
  private lastId = 0;
  private trees: NodePL[] = [];
  private clauseUsageCounters: number[];
  private readonly clauseNameNumbers: number[];
  private jumpingToCut: string | null = null;

  private solutions: Unifier[] = [];
  
  private totalSolutions: number = 0;
  private depth: number = 0;

  private maxDepth: number | null = null;
  private maxSolutions: number | null = null;

  private queryVariables: Set<string>;
  
  constructor(private readonly clauses: Clause[], private readonly query: Subclause[][]){
    this.clauseUsageCounters = new Array(clauses.length).fill(0);
    this.clauseNameNumbers = new Array(clauses.length).fill(1);
    
    const clauseNameUsages = new Map<string, number>();
    for (const i in clauses){
      const clause = clauses[i];
      const name = clause.head.name;
      if (clauseNameUsages.has(name)){
        clauseNameUsages.set(name, clauseNameUsages.get(name)! + 1);
      } else {
        clauseNameUsages.set(name, 1);
      }

      this.clauseNameNumbers[i] = clauseNameUsages.get(name)!;
    }

    this.queryVariables = new Set<string>();
    for (const query of this.query){
      for (const subclause of query){
        extractVariableNames(subclause).forEach(v => this.queryVariables.add(v));
      }
    }
    
  }

  private uniqueNodeId(){
    return String(this.lastId++);
  }
  

  private uniqueAlias(clauseNumber: number): string{
    // example_clause_1_1
    return (
      this.clauseNameWithNumber(clauseNumber) +  '_' +
      String(this.clauseUsageCounters[clauseNumber])
    );
  }

  private consumeUniqueAlias(clauseNumber: number): void{
    this.clauseUsageCounters[clauseNumber]++;
  }

  private clauseNameWithNumber(clauseNumber: number): string{
    return (
      this.clauses[clauseNumber].head.name + '_' + 
      String(this.clauseNameNumbers[clauseNumber])
    );
  }

  public interpret(solveOptions: SolveOptions): {trees: NodePL[], solutions: Unifier[]}{
    
    if (solveOptions.depth){
      this.maxDepth = solveOptions.depth;
    }
    else {
      this.maxDepth = null;
    }
    if (solveOptions.solutions){
      this.maxSolutions = solveOptions.solutions;
    }
    else {
      this.maxSolutions = null;
    }
    this.trees = [];
    
    for (const query of this.query){
      this.clauseUsageCounters = this.clauseUsageCounters.map(_ => 0);
      this.jumpingToCut = null;
      const rootId = this.uniqueNodeId();
      this.depth = 0;
      const rootChildren = this.SLD_resolve(query, [], rootId);
      
      const rootNode: NodePL = {
        id: rootId,
        type: PLNodeType.RootNode,
        unifierText: emptyUnifier().to_string(),
        appliedClause: null,
        objective: getObjectiveText(query),
        children: rootChildren
      }

      this.trees.push(rootNode);
    }

    return {trees: this.trees, solutions: this.solutions};
  }

  private SLD_resolve(query: Subclause[], unifiers: Unifier[] = [], parentId: string): NodePL[]{  
    // console.log("SLD RESOLVE: unifiers " + unifiers.map(u => u.to_string()).join(", ") + " query " + query.map(q => q.to_string_display()).join(", "));
    if (query.length == 0){
      const complete_unifier = composeUnifiers(unifiers).restrict(this.queryVariables);

      const answ: NodePL = {
        id: this.uniqueNodeId(),
        parentId: parentId,
        type: PLNodeType.SuccessNode,
        unifierText: complete_unifier.to_string(),
        appliedClause: null,
        objective: 'Success!',
        children: []
      }

      this.totalSolutions++;
      this.solutions.push(complete_unifier);

      return [answ];
    }

    const head = query[0];
    this.depth++;
    if (this.maxDepth){
      if (this.depth > this.maxDepth){
        this.depth--;
        return [];
      }
    }

    if (head.type == NodeType.Cut){
      const thisNodeId = this.uniqueNodeId();

      const children = this.SLD_resolve(query.slice(1), unifiers, thisNodeId);
      const tree: NodePL = {
        id: thisNodeId,
        parentId: parentId,
        type: PLNodeType.InteriorNode,
        unifierText: emptyUnifier().to_string(),
        appliedClause: '!',
        objective: getObjectiveText(query.slice(1)),
        children: children
      }

      this.jumpingToCut = (head as Cut).introducedBy;

      return [tree];
    } 
    
    const functor = head as Functor;

    const trees: NodePL[] = [];
    for (let i = 0; i < this.clauses.length; i++){

      const clause = this.clauses[i];
      const thisId = this.uniqueNodeId();
      const uniqueAlias = this.uniqueAlias(i);
      const aliasedClause = clause.copy(uniqueAlias, thisId);
      const unifier = unify(aliasedClause.head, functor);

      if (unifier){
        this.consumeUniqueAlias(i);
        const newUnifiers = unifiers.concat(unifier);
        const newQuery = applyUnifier(unifier, clause.body.concat(query.slice(1)));

        const children = this.SLD_resolve(newQuery, newUnifiers, thisId);
        const tree: NodePL = {
          id: thisId,
          type: PLNodeType.InteriorNode,
          unifierText: unifier.to_string(),
          appliedClause: this.clauseNameWithNumber(i),
          objective: getObjectiveText(newQuery),
          children: children
        }

        trees.push(tree);

        if (this.jumpingToCut){
          if (this.jumpingToCut == thisId){
            this.jumpingToCut = null;          
          }
          break;
        }
        if (this.maxSolutions){
          if (this.totalSolutions >= this.maxSolutions){
            break;
          }
        }
      }
    }

    return trees;
  }

  private tryBuiltinFunctor(node: Functor): Unifier | false | "Functor Not Found" {
    switch(node.name){
      case TokenType.IS:
        return this.handleIsFunctor(node);
      case TokenType.GREATER_OR_EQUAL:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for >= operator");
        return evaluate(node.args[0]) >= evaluate(node.args[1]) ? emptyUnifier() : false;
      case TokenType.GREATER:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for > operator");
        return evaluate(node.args[0]) > evaluate(node.args[1]) ? emptyUnifier() : false;
      case TokenType.LESS_OR_EQUAL:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for <= operator");
        return evaluate(node.args[0]) <= evaluate(node.args[1]) ? emptyUnifier() : false;
      case TokenType.LESS:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for < operator");
        return evaluate(node.args[0]) < evaluate(node.args[1]) ? emptyUnifier() : false;
      case TokenType.LITERAL_EQUAL:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for == operator");
        return compare(node.args[0], node.args[1]) ? emptyUnifier() : false;
      case TokenType.SAME_VALUE_EQUAL:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for =:= operator");
        return evaluate(node.args[0]) === evaluate(node.args[1]) ? emptyUnifier() : false;
      case TokenType.UNIFY:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for = operator");
        const unifier = unify(node.args[0], node.args[1]);
        return unifier ? unifier : false;
      default:
        return "Functor Not Found";
    }
  }

  private handleIsFunctor(node: Functor): Unifier | false {
    if (node.args.length != 2) throw new Error("Invalid number of arguments for is operator");
    const left = node.args[0];
    const right = node.args[1];

    if (isLiteralValue(left) || left.type != NodeType.Variable){
      throw new SemanticError("Left side of is operator must be a variable " + node.nameToken.line + ":" + node.nameToken.column);
    }

    const variable = left as Variable;

    const value = evaluate(right);
    
    try {
      const answ = unify(variable, value);
      if (answ == null) return false;
      return answ;
    }
    catch (e){
      if (e instanceof RecursiveTypeError){
        console.log(e.message);
        return false;
      }

      throw e;
    }
  }
}

function composeUnifiers(unifiers: Unifier[]): Unifier{
  let unifier = new Unifier(new Map<string, ASTNode>());

  for (const u of unifiers.reverse()){
    unifier = u.compose(unifier);
  }

  return unifier;
}

function getObjectiveText(subclauses: Subclause[]): string{
  return subclauses.map(s => {
    return s.to_string_display();
  }).join(", ") + '.';
}

function applyUnifier(unifier: Unifier, subclauses: Subclause[]): Subclause[]{
  return subclauses.map(s => {
    const representation = unifier.apply(s);
    if (isLiteralValue(representation)) throw new Error("Unreachable");
    if (representation.type != NodeType.Functor && representation.type != NodeType.Cut) 
      throw new Error("Unreachable");
    return representation;
  });
}