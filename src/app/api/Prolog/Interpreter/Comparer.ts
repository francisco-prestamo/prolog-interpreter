import { ASTNode } from "../AST/Nodes/ASTNode";
import { BinOp } from "../AST/Nodes/BinOp";
import { Clause } from "../AST/Nodes/Clause";
import { Constant } from "../AST/Nodes/Constant";
import { Cut } from "../AST/Nodes/Cut";
import { Functor } from "../AST/Nodes/Functor";
import { EmptyList, NonEmptyList } from "../AST/Nodes/List";
import { NumberLiteral } from "../AST/Nodes/NumberLiteral";
import { StringLiteral } from "../AST/Nodes/StringLiteral";
import { UnOp } from "../AST/Nodes/UnOp";
import { Variable } from "../AST/Nodes/Variable";
import { NodeType } from "../AST/NodeTypes";
import { ParallelASTVisitor } from "./ASTVisitors/ParallelVisitor";
import { LiteralValue, isLiteralValue } from "./LiteralValue";

/**
 * 
 * @returns True if the nodes are exactly equal, no resolution is done, False otherwise
 */
export function compare(nodeA: ASTNode | LiteralValue, nodeB: ASTNode | LiteralValue): boolean{
  if (isLiteralValue(nodeA)){
    return isLiteralValue(nodeB) && nodeA == nodeB;
  }
  else if (isLiteralValue(nodeB)){
    return false;
  }
  return new Comparer(nodeA, nodeB).isEqual();
}

class Comparer extends ParallelASTVisitor<void>{
  private equal: boolean = true;
  public isEqual(): boolean{
    return this.equal;
  }

  constructor(private readonly nodeA: ASTNode, private readonly nodeB: ASTNode){
    super();
    this.compare(this.nodeA, this.nodeB);
  }

  private compare(nodeA: ASTNode | LiteralValue, nodeB: ASTNode | LiteralValue){
    if (isLiteralValue(nodeA)){
      this.visitLiteralValue(nodeA, nodeB);
      return;
    }
    if (isLiteralValue(nodeB)){
      this.visitLiteralValue(nodeB, nodeA);
      return;
    }
    this.visit(nodeA as ASTNode, this.nodeB);
  }

  visitLiteralValue(a: LiteralValue, b: ASTNode | LiteralValue): void {
    if (isLiteralValue(b)){
      if (!a.equals(b)){
        this.equal = false;
      }
      return;
    }
    
    switch(b.type){
      case NodeType.NumberLiteral:
        if (a.value != (b as NumberLiteral).value){
          this.equal = false;
        }
        return;
      case NodeType.StringLiteral:
        if (a.value != (b as StringLiteral).value){
          this.equal = false;
        }
        return;
      default:
        this.equal = false;
        return;
    }
  }

  visitBinOp(a: BinOp, b: ASTNode): void {
    switch(b.type){
      case NodeType.BinOp:
        const binop_b = b as BinOp
        if (a.operatorToken.value != binop_b.operatorToken.value){
          this.equal = false;
          return;
        }
        if (isLiteralValue(a.left)){
          if (!isLiteralValue(binop_b.left)){
            this.equal = false;
            return;
          }
          if (!a.left.equals(binop_b.left)){
            this.equal = false;
            return;
          }
        }
        else {
          this.visit(a.left as ASTNode, binop_b.left as ASTNode);
          if (!this.equal) return;
        }

        if (isLiteralValue(a.right)){
          if (!isLiteralValue(binop_b.right)){
            this.equal = false;
            return;
          }
          if (a.right != binop_b.right){
            this.equal = false;
            return;
          }
        }
        else {
          this.visit(a.right as ASTNode, binop_b.right as ASTNode);
          // if (!this.equal) return;
        }
        return;    
      default:
        this.equal = false;
        return;
    }
  }

  visitClause(a: Clause, b: ASTNode): void {
    this.equal = false;
  }

  visitConstant(a: Constant, b: ASTNode): void {
    switch(b.type){
      case NodeType.Constant:
        const constant_b = b as Constant;
        if (a.name != constant_b.name){
          this.equal = false;
          return;
        }
        return;
    
      default:
        this.equal = false;
        return;
    }
  }

  visitCut(a: Cut, b: ASTNode): void {
    this.equal = false;
  }

  visitEmptyList(a: EmptyList, b: ASTNode): void {
    switch(b.type){
      case NodeType.EmptyList:
        return;
      default:
        this.equal = false;
        return;
    }
  }

  visitFunctor(a: Functor, b: ASTNode): void {
    switch(b.type){
      case NodeType.Functor:
        const functor_b = b as Functor;
        if (a.nameToken.value != functor_b.nameToken.value){
          this.equal = false;
          return;
        }
        if (a.args.length != functor_b.args.length){
          this.equal = false;
          return;
        }
        for (let i = 0; i < a.args.length; i++){
          this.compare(a.args[i], functor_b.args[i]);
          if (!this.equal) return;
        }
        return;
      default:
        this.equal = false;
        return;
    }
  }

  visitNonEmptyList(a: NonEmptyList, b: ASTNode): void {
    switch(b.type){
      case NodeType.NonEmptyList:
        const nonemptylist_b = b as NonEmptyList;
        this.compare(a.head, nonemptylist_b.head);
        if (!this.equal) return;
        this.compare(a.tail, nonemptylist_b.tail);
        return;
      default:
        this.equal = false;
        return;
    }
  }

  visitNumberLiteral(a: NumberLiteral, b: ASTNode): void {
    switch(b.type){
      case NodeType.NumberLiteral:
        const numberliteral_b = b as NumberLiteral;
        if (a.value != numberliteral_b.value){
          this.equal = false;
          return;
        }
        return;
      default:
        this.equal = false;
        return;
    }
  }

  visitStringLiteral(a: StringLiteral, b: ASTNode): void {
    switch(b.type){
      case NodeType.StringLiteral:
        const stringliteral_b = b as StringLiteral;
        if (a.value != stringliteral_b.value){
          this.equal = false;
          return;
        }
        return;
      default:
        this.equal = false;
        return;
    }
  }

  visitUnOp(a: UnOp, b: ASTNode): void {
    switch(b.type){
      case NodeType.UnOp:
        const unop_b = b as UnOp;
        if (a.operatorToken.value != unop_b.operatorToken.value){
          this.equal = false;
          return;
        }
        this.compare(a.operand, unop_b.operand);
        return;
      default:
        this.equal = false;
        return;
    }
  }

  visitVariable(a: Variable, b: ASTNode): void {
    switch(b.type){
      case NodeType.Variable:
        const variable_b = b as Variable;
        if (a.name != variable_b.name){
          this.equal = false;
          return;
        }
        return;
      default:
        this.equal = false;
        return;
    }
  }
}