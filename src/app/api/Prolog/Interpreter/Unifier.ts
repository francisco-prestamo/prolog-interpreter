import { ALIAS_SEPARATOR, ASTNode } from "../AST/Nodes/ASTNode";
import { BinOp } from "../AST/Nodes/BinOp";
import { NodeType } from "../AST/NodeTypes";
import { ParallelASTVisitor } from "./ASTVisitors/ParallelVisitor";
import { Variable } from "../AST/Nodes/Variable";
import { Constant } from "../AST/Nodes/Constant";
import { Cut } from "../AST/Nodes/Cut";
import { Functor } from "../AST/Nodes/Functor";
import { EmptyList, NonEmptyList } from "../AST/Nodes/List";
import { NumberLiteral } from "../AST/Nodes/NumberLiteral";
import { StringLiteral } from "../AST/Nodes/StringLiteral";
import { UnOp } from "../AST/Nodes/UnOp";
import { RecursiveTypeError, resolve } from "./Resolver";
import { Clause } from "../AST/Nodes/Clause";
import { isLiteralValue, LiteralValue } from "./LiteralValue";
import { DSU } from "../Utils/dsu";


/**
 * @returns {Unifier | null} The unifier if the nodes can be unified, null otherwise
 */
export function unify(nodeA: ASTNode | LiteralValue, nodeB: ASTNode | LiteralValue): Unifier | null {
  let unifierBuilder: UnifierBuilder;
  
  try {
    unifierBuilder = new UnifierBuilder(nodeA, nodeB);
  }
  catch (error){
    if (error instanceof RecursiveTypeError){
      return null;
    }
    else{
      throw error;
    }
  }

  if (!unifierBuilder.could_unify){
    return null;
  }
  return unifierBuilder.unifier;
}

export function emptyUnifier(): Unifier{
  return new Unifier();
}

type VariableClass = DSU<string>;
export class Unifier {
  private variableClasses: VariableClass = new DSU<string>();
  private lessPrecedenceVariableOfClass: Map<string, string> = new Map<string, string>();
  private assignments = new Map<string, ASTNode>();

  constructor(){
  }

  public apply(node: ASTNode): ASTNode | LiteralValue {
    return resolve(node, this);
  }

  public has(variableName: string): boolean {
    return this.variableClasses.hasElement(variableName);
  }

  public getResolved(name: string): ASTNode | LiteralValue | string | null {
    if (!this.variableClasses.hasElement(name)){
      return null;
    }
    const variableClass = this.variableClasses.find(name);

    if (!this.assignments.has(variableClass)){
      return this.lessPrecedenceVariableOfClass.get(variableClass)!;
    }

    return this.assignments.get(variableClass)!;
  }

  public compose(other: Unifier): Unifier{
    // create new mapping for resulting unifier
    const newMapping = new Map<string, ASTNode | LiteralValue>();
    
    for (const [key, value] of this.mapping){
      newMapping.set(key, value)
    }

    // after resolving variables in this unifier with resolutions of the other,
    // we must add the variables that are not resolved in this unifier and are
    // in the other to the resulting unifier, this set facilitates that
    const variablesInThisMapping = new Set<string>();

    for (const key in newMapping){
      const resolved = newMapping.get(key)!
      if (!isLiteralValue(resolved) && resolved.type == NodeType.Variable){
        const resolvedVariable = resolved as Variable
        variablesInThisMapping.add(resolvedVariable.name);

        newMapping.set(key, other.apply(resolved));
      }
    }

    for (const key in other.mapping){
      if (variablesInThisMapping.has(key)) continue;
      newMapping.set(key, other.mapping.get(key)!);
    }

    return new Unifier(newMapping);
  }

  public restrict(variables: Set<string>): Unifier{
    console.log("restricting unifier " + this.to_string() + " with " + Array.from(variables).join(", "));
    const newMapping = new Map<string, ASTNode | LiteralValue>();

    for (const [key, value] of this.mapping){
      if (variables.has(key)){
        newMapping.set(key, value);
      }
    }

    return new Unifier(newMapping);
  }

  public is_empty() {
    return this.mapping.size == 0;
  }

  public to_string(): string {
    let str = '';
    for (const [key, value] of this.mapping){
      const valueRepresentation = isLiteralValue(value) ? value : value.to_string_debug();
      str += `${key}=${valueRepresentation}, `;
    }
    str = str.slice(0, -2);
    str += '';
    return str;
  }
}

class UnifierBuilder extends ParallelASTVisitor<void> {
  public mapping = new Map<string, ASTNode | LiteralValue>();
  public could_unify: boolean;
  public unifier: Unifier | null;

  constructor(nodeA: ASTNode | LiteralValue, nodeB: ASTNode | LiteralValue){
    super();
    this.could_unify = true;
    this.unify(nodeA, nodeB)
    this.unifier = (this.could_unify) ? new Unifier(this.mapping) : null;
  }

  private unify(nodeA: ASTNode | LiteralValue, nodeB: ASTNode | LiteralValue){
    if (isLiteralValue(nodeA)){
      this.visitLiteralValue(nodeA, nodeB);
      return;
    }
    if (isLiteralValue(nodeB)){
      this.visitLiteralValue(nodeB, nodeA);
      return;
    }
    this.visit(nodeA, nodeB);


  }

  visitLiteralValue(a: LiteralValue, b: ASTNode | LiteralValue): void {
    if (isLiteralValue(b)){
      if (a != b){
        this.could_unify = false;
      }
      return;
    }

    if (b.type == NodeType.Variable){
      const variable_b = b as Variable;
      const resolved = resolve(variable_b, this.mapping);

      if (isLiteralValue(resolved)){
        if (a != resolved){
          this.could_unify = false;
        }
        return;
      }

      switch(resolved.type){
        case NodeType.Variable:
          const variable_resolved = resolved as Variable;
          this.unify(a, variable_resolved);
          return;
        case NodeType.NumberLiteral:
          const numberliteral_resolved = resolved as NumberLiteral;
          if (a != numberliteral_resolved.value){
            this.could_unify = false;
          }
          return;
        case NodeType.StringLiteral:
          const stringliteral_resolved = resolved as StringLiteral;
          if (a != stringliteral_resolved.value){
            this.could_unify = false;
          }
          return;
        default:
          this.could_unify = false;
          return;
      }


    }
  }

  visitBinOp(a: BinOp, b: ASTNode): void {
    switch(b.type){
      case NodeType.BinOp:
        const binop_b = b as BinOp
        if (a.operatorToken.value != binop_b.operatorToken.value){
          this.could_unify = false;
          return;
        }
        this.unify(a.left, binop_b.left);
        if (!this.could_unify) return;
        this.unify(a.right, binop_b.right);
        return;
      
      case NodeType.Variable:
        const variable_b = b as Variable;
        this.unify(resolve(variable_b, this.mapping), a);
        this.mapping.set(variable_b.name, resolve(variable_b, this.mapping));
        return;
      default:
        this.could_unify = false;
        return;
    }
  }

  visitClause(_a: Clause, _b: ASTNode): void {
    this.could_unify = false;
  }

  visitConstant(a: Constant, b: ASTNode): void {
    switch(b.type){
      case NodeType.Constant:
        const constant_b = b as Constant;
        if (a.name != constant_b.name){
          this.could_unify = false;
          return;
        }
        return;
      
      case NodeType.Variable:
        const variable_b = b as Variable;
        this.unify(resolve(variable_b, this.mapping), a);
        this.mapping.set(variable_b.name, resolve(variable_b, this.mapping));
        return;
      
      default:
        this.could_unify = false;
        return;
    }
  }

  visitCut(_a: Cut, _b: ASTNode): void {
    this.could_unify = false;
  }

  visitEmptyList(a: EmptyList, b: ASTNode): void {
    // console.log("Unifying empty list " + a.to_string_debug() + " with " + b.to_string_debug());

    switch(b.type){
      case NodeType.EmptyList:
        return;
      
      case NodeType.Variable:
        const variable_b = b as Variable;
        this.unify(resolve(variable_b, this.mapping), a);
        this.mapping.set(variable_b.name, resolve(variable_b, this.mapping));
        return;
      
      default:
        this.could_unify = false;
        return;
    }
  }

  visitFunctor(a: Functor, b: ASTNode): void {
    switch(b.type){
      case NodeType.Functor:
        const functor_b = b as Functor;
        if (a.name != functor_b.name || a.args.length != functor_b.args.length){
          this.could_unify = false;
          return;
        }
        for (let i = 0; i < a.args.length; i++){
          this.unify(a.args[i], functor_b.args[i]);
          if (!this.could_unify) return;
        }
        return;
      
      case NodeType.Variable:
        const variable_b = b as Variable;
        this.unify(resolve(variable_b, this.mapping), a);
        this.mapping.set(variable_b.name, resolve(variable_b, this.mapping));
        return;
      
      default:
        this.could_unify = false;
        return;
    }
  }

  visitNonEmptyList(a: NonEmptyList, b: ASTNode): void {
    // console.log("Unifying nonEmpty list " + a.to_string_debug() + " with " + b.to_string_debug());
  
    switch(b.type){
      case NodeType.NonEmptyList:
        const nonemptylist_b = b as NonEmptyList;
        this.unify(a.head, nonemptylist_b.head);
        if (!this.could_unify) return;
        this.unify(a.tail, nonemptylist_b.tail);
        return;
      
      case NodeType.Variable:
        const variable_b = b as Variable;
        this.unify(resolve(variable_b, this.mapping), a);
        this.mapping.set(variable_b.name, resolve(variable_b, this.mapping));
        return;
      
      default:
        this.could_unify = false;
        return;
    }
  }

  visitNumberLiteral(a: NumberLiteral, b: ASTNode): void {
    // console.log("Unifying number literal " + a.to_string_debug() + " with " + b.to_string_debug());
    switch(b.type){
      case NodeType.NumberLiteral:
        const numberliteral_b = b as NumberLiteral;
        if (a.value != numberliteral_b.value){
          this.could_unify = false;
          return;
        }
        return;
      
      case NodeType.Variable:
        const variable_b = b as Variable;
        const resolved = resolve(variable_b, this.mapping);
        if (isLiteralValue(resolved)){
          if (a.value != resolved){
            this.could_unify = false;
          }
          return;
        }
        if (resolved.type == NodeType.Variable){
          this.mapping.set((resolved as Variable).name, a);
          return;
        }
        if (resolved.type == NodeType.NumberLiteral){
          if (a.value != (resolved as NumberLiteral).value){
            this.could_unify = false;
          }
          return;
        }
        this.could_unify = false;
        return;      
      default:
        this.could_unify = false;
        return;
    }
  }

  visitStringLiteral(a: StringLiteral, b: ASTNode): void {
    switch(b.type){
      case NodeType.StringLiteral:
        const stringliteral_b = b as StringLiteral;
        if (a.value != stringliteral_b.value){
          this.could_unify = false;
          return;
        }
        return;
      
      case NodeType.Variable:
        const variable_b = b as Variable;
        const resolved = resolve(variable_b, this.mapping);
        if (isLiteralValue(resolved)){
          if (a.value != resolved){
            this.could_unify = false;
          }
          return;
        }
        if (resolved.type == NodeType.Variable){
          this.mapping.set((resolved as Variable).name, a);
          return;
        }
        if (resolved.type == NodeType.StringLiteral){
          if (a.value != (resolved as StringLiteral).value){
            this.could_unify = false;
          }
          return;
        }
        this.could_unify = false;
        return;
      default:
        this.could_unify = false;
        return;
    }
  }

  visitUnOp(a: UnOp, b: ASTNode): void {
    switch(b.type){
      case NodeType.UnOp:
        const unop_b = b as UnOp;
        if (a.operatorToken.value != unop_b.operatorToken.value){
          this.could_unify = false;
          return;
        }
        this.unify(a.operand, unop_b.operand);
        return;
      
      case NodeType.Variable:
        const variable_b = b as Variable;
        this.unify(resolve(variable_b, this.mapping), a);
        this.mapping.set(variable_b.name, resolve(variable_b, this.mapping));
        return;
      
      default:
        this.could_unify = false;
        return;
    }
  }

  visitVariable(a: Variable, b: ASTNode): void {
    // console.log("Unifying variable " + a.to_string_debug() + " with " + b.to_string_debug())
    if (this.mapping.has(a.name)){
      this.unify(resolve(a, this.mapping), b);
      return;
    }
    // a has no mapping
    switch(b.type){
      case NodeType.Variable:
        const variable_b = b as Variable;
        if (a.name == variable_b.name){
          return
        }
        if (this.mapping.has(variable_b.name)){
          this.unify(a, resolve(variable_b, this.mapping));
          return;
        }
        // b has no mapping
        if (firstHasHigherPrecedence(a, variable_b)){
          this.mapping.set(variable_b.name, a);
        }
        else{
          this.mapping.set(a.name, variable_b);
        }
        return;
      default:
        return this.unify(b, a);
    }
  }
}

function firstHasHigherPrecedence(a: Variable, b: Variable): boolean{
  const aName = a.name;
  const bName = b.name;

  if (aName.includes(ALIAS_SEPARATOR) && !bName.includes(ALIAS_SEPARATOR)){
    return false;
  }
  if (!aName.includes(ALIAS_SEPARATOR) && bName.includes(ALIAS_SEPARATOR)){
    return true;
  }
  return aName < bName ? true : false;
}