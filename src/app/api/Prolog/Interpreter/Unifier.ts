import { ALIAS_SEPARATOR, ASTNode } from "../AST/Nodes/ASTNode";
import { BinOp } from "../AST/Nodes/BinOp";
import { NodeType } from "../AST/NodeTypes";
import { ParallelASTVisitor } from "./ASTVisitors/ParallelVisitor";
import { Variable } from "../AST/Nodes/Variable";
import { Constant } from "../AST/Nodes/Constant";
import { Cut } from "../AST/Nodes/Cut";
import { Functor } from "../AST/Nodes/Functor";
import { EmptyList, List, NonEmptyList } from "../AST/Nodes/List";
import { NumberLiteral } from "../AST/Nodes/NumberLiteral";
import { StringLiteral } from "../AST/Nodes/StringLiteral";
import { Term } from "../AST/Nodes/Term";
import { UnOp } from "../AST/Nodes/UnOp";
import { resolve } from "./Resolver";
import { Clause } from "../AST/Nodes/Clause";


export function unify(nodeA: ASTNode, nodeB: ASTNode): Unifier | null {
  const unifierBuilder = new UnifierBuilder(nodeA, nodeB);
  if (!unifierBuilder.could_unify){
    return null;
  }
  return unifierBuilder.unifier;
}

class Unifier {
  constructor(private readonly mapping: Map<string, ASTNode>){
  }

  public apply(node: ASTNode): ASTNode {
    return resolve(node, this.mapping);
  }

  public is_empty() {
    return this.mapping.size == 0;
  }

  public to_string(): string {
    let str = '{ ';
    for (const [key, value] of this.mapping){
      str += `${key} -> ${value.to_string_debug()}, `;
    }
    str = str.slice(0, -2);
    str += ' }';
    return str;
  }
}

class UnifierBuilder extends ParallelASTVisitor<void> {
  public mapping = new Map<string, ASTNode>();
  public could_unify: boolean;
  public unifier: Unifier | null;

  constructor(nodeA: ASTNode, nodeB: ASTNode){
    super();
    this.could_unify = true;
    this.unify(nodeA, nodeB)
    this.unifier = (this.could_unify) ? new Unifier(this.mapping) : null;
  }

  private unify(nodeA: ASTNode, nodeB: ASTNode){
    return this.visit(nodeA, nodeB);
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

  visitClause(a: Clause, b: ASTNode): void {
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

  visitCut(a: Cut, b: ASTNode): void {
    this.could_unify = false;
  }

  visitEmptyList(a: EmptyList, b: ASTNode): void {
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
        this.unify(resolve(variable_b, this.mapping), a);
        this.mapping.set(variable_b.name, resolve(variable_b, this.mapping));
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
        this.unify(resolve(variable_b, this.mapping), a);
        this.mapping.set(variable_b.name, resolve(variable_b, this.mapping));
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