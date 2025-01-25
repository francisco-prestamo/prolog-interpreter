import { ASTNode } from "../AST/Nodes/ASTNode";
import { Clause } from "../AST/Nodes/Clause";
import { Cut } from "../AST/Nodes/Cut";
import { Functor } from "../AST/Nodes/Functor";
import { Variable } from "../AST/Nodes/Variable";
import { NodeType } from "../AST/NodeTypes";
import { SolveOptions } from "../Interface";
import { TokenType } from "../Lexer/Token";
import { NodePL, PLNodeType } from "../PrologTree/NodePL";
import { compare } from "./Comparer";
import { evaluate } from "./Evaluator";
import { RecursiveTypeError } from "./Unifier/Resolver";
import { extractVariableNames } from "./VariableExtractor";
import { isLiteralValue, LiteralValue } from "./LiteralValue";
import { Unifier } from "./Unifier/Unifier";
import { getUnifier, emptyUnifier } from "./Unifier/GetUnifier";

export class SemanticError extends Error {
  constructor(message: string){
    super(`Semantic Error: ` + message);
  }
}

export class Interpreter {
  private lastId = 0;
  private trees: NodePL[] = [];
  private clauseUsageCounters: number[];
  private readonly clauseNameNumbers: number[];
  private jumpingToCut: string | null = null;

  private solutions: Record<string, string>[] = [];
  
  private totalSolutions: number = 0;
  private depth: number = 0;

  private maxDepth: number | null = null;
  private maxSolutions: number | null = null;

  private queryVariables: string[];
  
  constructor(private readonly clauses: Clause[], private readonly query: ASTNode[][]){
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

    const queryVariableSet = new Set<string>();
    for (const query of this.query){
      for (const subclause of query){
        extractVariableNames(subclause).forEach(v => queryVariableSet.add(v));
      }
    }

    this.queryVariables = Array.from(queryVariableSet);
    
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

  public interpret(solveOptions: SolveOptions): {trees: NodePL[], solutions: Record<string, string>[]}{
    
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
      query.forEach(q => q.setIntroducedBy(rootId));
      const rootChildren = this.SLD_resolve(query, [], rootId);
      
      const rootNode: NodePL = {
        id: rootId,
        type: PLNodeType.RootNode,
        unifier: emptyUnifier().to_record(),
        appliedClause: null,
        objective: getObjectiveText(query),
        children: rootChildren
      }

      this.trees.push(rootNode);
    }

    return {trees: this.trees, solutions: this.solutions};
  }

  private SLD_resolve(query: (ASTNode | LiteralValue)[], unifiers: Unifier[] = [], parentId: string): NodePL[]{      
    if (query.length == 0){

      const solution: Record<string, string> = {};
      for (const variable of this.queryVariables){
        const value = applyUnifiers(unifiers, variable);
        if (value == null) continue;
        if (typeof value == "string") continue;
        if (!isLiteralValue(value) && value.type == NodeType.Variable){
          const variableNode = value as Variable;

          if (variableNode.name == variable) continue;
        }
        solution[variable] = value.to_string_display();
      }
      const answ: NodePL = {
        id: this.uniqueNodeId(),
        parentId: parentId,
        type: PLNodeType.SuccessNode,
        unifier: solution,
        appliedClause: null,
        objective: 'Success!',
        children: []
      }

      this.totalSolutions++;
      this.solutions.push(solution);

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

    if (isLiteralValue(head)){
      throw new SemanticError(`Subclause of type LiteralValue ${head.to_string_display()} cannot be evaluated`);
    }

    if (head.type == NodeType.Cut){
      const thisNodeId = this.uniqueNodeId();

      const children = this.SLD_resolve(query.slice(1), unifiers, thisNodeId);
      const tree: NodePL = {
        id: thisNodeId,
        parentId: parentId,
        type: PLNodeType.InteriorNode,
        unifier: emptyUnifier().to_record(),
        appliedClause: '!',
        objective: getObjectiveText(query.slice(1)),
        children: children
      }

      this.jumpingToCut = (head as Cut).introducedBy;

      this.depth--;
      return [tree];
    } 
    
    switch (head.type) {
      case NodeType.BinOp:
      case NodeType.EmptyList:
      case NodeType.NonEmptyList:
      case NodeType.NumberLiteral:
      case NodeType.StringLiteral:
      case NodeType.UnOp:
      case NodeType.Variable:
      case NodeType.Underscore:
        throw new SemanticError(`Subclause of type ` + head.type + ' ' + head.to_string_display() + ` cannot be evaluated`);
    }

    const functor = head as Functor;

    const builtinUnifier = this.tryBuiltinFunctor(functor);
    if (builtinUnifier === false){
      const failureNode: NodePL = {
        id: this.uniqueNodeId(),
        parentId: parentId,
        type: PLNodeType.FailureNode,
        // unifier: 'Failure',
        appliedClause: null,
        objective: 'Failure',
        children: []
      }

      this.depth--;
      return [failureNode];
    }
    else if (builtinUnifier instanceof Unifier){
      const thisNodeId = this.uniqueNodeId();
      const children = this.SLD_resolve(applyUnifier(builtinUnifier, query.slice(1)), unifiers.concat(builtinUnifier), thisNodeId);
      const tree: NodePL = {
        id: thisNodeId,
        parentId: parentId,
        type: PLNodeType.InteriorNode,
        unifier: builtinUnifier.to_record(),
        appliedClause: functor.to_string_display(),
        objective: getObjectiveText(query.slice(1)),
        children: children
      }

      this.depth--;
      return [tree];
    }

    // Builtin unifier not found, try to unify with a clause

    const trees: NodePL[] = [];
    for (let i = 0; i < this.clauses.length; i++){

      const clause = this.clauses[i];
      const thisId = this.uniqueNodeId();
      const uniqueAlias = this.uniqueAlias(i);
      const aliasedClause = clause.copy(uniqueAlias, thisId);
      const unifier = getUnifier(aliasedClause.head, functor);

      if (unifier){
        this.consumeUniqueAlias(i);
        const newUnifiers = unifiers.concat(unifier);
        
        let newQuery: (ASTNode | LiteralValue)[] = aliasedClause.body ;
        newQuery = newQuery.concat(query.slice(1));
        newQuery = applyUnifier(unifier, newQuery);

        const children = this.SLD_resolve(newQuery, newUnifiers, thisId);
        const tree: NodePL = {
          id: thisId,
          type: PLNodeType.InteriorNode,
          unifier: unifier.to_record(),
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

    if (trees.length === 0){
      trees.push({
        id: this.uniqueNodeId(),
        type: PLNodeType.FailureNode,
        objective: 'Failure',
        children: [],
        appliedClause: null
      })
    }

    return trees;
  }

  private tryBuiltinFunctor(node: Functor): Unifier | false | "Functor Not Found" {
    switch(node.name){
      case TokenType.IS:
        return this.handleIsFunctor(node);
      case TokenType.GREATER_OR_EQUAL:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for >= operator");
        return evaluate(node.args[0]).greaterThanOrEqual(evaluate(node.args[1])) ? emptyUnifier() : false;
      case TokenType.GREATER:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for > operator");
        return evaluate(node.args[0]).greaterThan(evaluate(node.args[1])) ? emptyUnifier() : false;
      case TokenType.LESS_OR_EQUAL:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for <= operator");
        return evaluate(node.args[0]).lessThanOrEqual(evaluate(node.args[1])) ? emptyUnifier() : false;
      case TokenType.LESS:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for < operator");
        return evaluate(node.args[0]).lessThan(evaluate(node.args[1])) ? emptyUnifier() : false;
      case TokenType.LITERAL_EQUAL:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for == operator");
        return compare(node.args[0], node.args[1]) ? emptyUnifier() : false;
      case TokenType.SAME_VALUE_EQUAL:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for =:= operator");
        return evaluate(node.args[0]) === evaluate(node.args[1]) ? emptyUnifier() : false;
      case TokenType.UNIFY:
        if (node.args.length != 2) throw new Error("Invalid number of arguments for = operator");
        const unifier = getUnifier(node.args[0], node.args[1]);
        return unifier ? unifier : false;
      case TokenType.CONSTANT:
        if (node.nameToken.value === 'fail')
          return false;
      default:
        return "Functor Not Found";
    }
  }

  private handleIsFunctor(node: Functor): Unifier | false {
    if (node.args.length != 2) throw new Error("Invalid number of arguments for is operator");
    const left = node.args[0];
    const right = node.args[1];


    const value = evaluate(right);
    

    try {
      const answ = getUnifier(left, value);
      if (answ === null) return false;
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


function getObjectiveText(subclauses: (ASTNode | LiteralValue)[]): string{
  return subclauses.map(s => {
    return s.to_string_display();
  }).join(", ") + '.';
}

function applyUnifiers(unifiers: Unifier[], name: string): ASTNode | LiteralValue | null{  
  let result: string | LiteralValue | ASTNode = name;
  for (const unifier of unifiers){
    if (typeof result == "string"){
      result = unifier.resolveVariableName(result);
    }
    else if (isLiteralValue(result)){
      break
    }
    else {
      result = unifier.apply(result);
    }
  }
  if (typeof result == "string") return null;
  return result;
}

function applyUnifier(unifier: Unifier, subclauses: (ASTNode | LiteralValue)[]): (ASTNode | LiteralValue)[]{
  return subclauses.map(s => {
    const representation = unifier.apply(s);
    return representation;
  });
}