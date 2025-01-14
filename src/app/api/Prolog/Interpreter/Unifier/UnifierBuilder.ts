import { ParallelASTVisitor } from "../ASTVisitors/ParallelVisitor";
import { Unifier } from "./Unifier";
import { isLiteralValue, LiteralValue } from "../LiteralValue";
import { ASTNode } from "../../AST/Nodes/ASTNode";
import { Variable } from "../../AST/Nodes/Variable";
import { NodeType } from "../../AST/NodeTypes";
import { BinOp } from "../../AST/Nodes/BinOp";
import { Clause } from "../../AST/Nodes/Clause";
import { Constant } from "../../AST/Nodes/Constant";
import { Cut } from "../../AST/Nodes/Cut";
import { Functor } from "../../AST/Nodes/Functor";
import { EmptyList, NonEmptyList } from "../../AST/Nodes/List";
import { NumberLiteral } from "../../AST/Nodes/NumberLiteral";
import { StringLiteral } from "../../AST/Nodes/StringLiteral";
import { UnOp } from "../../AST/Nodes/UnOp";


export class UnifierBuilder extends ParallelASTVisitor<void> {
  public could_unify: boolean;
  public unifier: Unifier;

  constructor(nodeA: ASTNode | LiteralValue, nodeB: ASTNode | LiteralValue){
    super();
    this.could_unify = true;
    this.unifier = new Unifier();
    this.unify(nodeA, nodeB)
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
      if (!a.equals(b)){
        this.could_unify = false;
      }
      return;
    }

    if (b.type == NodeType.Variable){
      this.could_unify = this.unifier.tryAssign(b as Variable, a);
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
        this.could_unify = this.unifier.tryAssign(b as Variable, a);
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
        this.could_unify = this.unifier.tryAssign(b as Variable, a);
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
        this.could_unify = this.unifier.tryAssign(b as Variable, a);
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
        this.could_unify = this.unifier.tryAssign(b as Variable, a);
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
        this.could_unify = this.unifier.tryAssign(b as Variable, a);
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
        this.could_unify = this.unifier.tryAssign(b as Variable, a);
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
        this.could_unify = this.unifier.tryAssign(b as Variable, a);
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
        this.could_unify = this.unifier.tryAssign(b as Variable, a);
        return;
      
      default:
        this.could_unify = false;
        return;
    }
  }

  visitVariable(a: Variable, b: ASTNode): void {
    switch(b.type){
      case NodeType.Variable:
        this.could_unify = this.unifier.tryAssign(b as Variable, a);
        return;
      default:
        return this.unify(b, a);
    }
  }
}

