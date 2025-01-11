import { ASTNode } from "../../AST/Nodes/ASTNode";
import { BinOp } from "../../AST/Nodes/BinOp";
import { Clause } from "../../AST/Nodes/Clause";
import { Constant } from "../../AST/Nodes/Constant";
import { Cut } from "../../AST/Nodes/Cut";
import { Functor } from "../../AST/Nodes/Functor";
import { EmptyList, NonEmptyList } from "../../AST/Nodes/List";
import { NumberLiteral } from "../../AST/Nodes/NumberLiteral";
import { StringLiteral } from "../../AST/Nodes/StringLiteral";
import { UnOp } from "../../AST/Nodes/UnOp";
import { Variable } from "../../AST/Nodes/Variable";
import { NodeType } from "../../AST/NodeTypes";

export abstract class ParallelASTVisitor<ReturnType>{
  visit(a: ASTNode, b: ASTNode){
    switch(a.type){
      case NodeType.BinOp:
        return this.visitBinOp(a as BinOp, b);
      case NodeType.Clause:
        return this.visitClause(a as Clause, b);
      case NodeType.Constant:
        return this.visitConstant(a as Constant, b);
      case NodeType.Cut:
        return this.visitCut(a as Cut, b);
      case NodeType.EmptyList:
        return this.visitEmptyList(a as EmptyList, b);
      case NodeType.Functor:
        return this.visitFunctor(a as Functor, b);
      case NodeType.NonEmptyList:
        return this.visitNonEmptyList(a as NonEmptyList, b);
      case NodeType.NumberLiteral:
        return this.visitNumberLiteral(a as NumberLiteral, b);
      case NodeType.StringLiteral:
        return this.visitStringLiteral(a as StringLiteral, b);
      case NodeType.UnOp:
        return this.visitUnOp(a as UnOp, b);
      case NodeType.Variable:
        return this.visitVariable(a as Variable, b);
      default:
          throw new Error(`Unknown node type: ${a.type}`);  
    }
  }
  abstract visitBinOp(a: BinOp, b: ASTNode): ReturnType;
  abstract visitClause(a: Clause, b: ASTNode): ReturnType;
  abstract visitConstant(a: Constant, b: ASTNode): ReturnType;
  abstract visitCut(a: Cut, b: ASTNode): ReturnType;
  abstract visitEmptyList(a: EmptyList, b: ASTNode): ReturnType;
  abstract visitFunctor(a: Functor, b: ASTNode): ReturnType;
  abstract visitNonEmptyList(a: NonEmptyList, b: ASTNode): ReturnType;
  abstract visitNumberLiteral(a: NumberLiteral, b: ASTNode): ReturnType;
  abstract visitStringLiteral(a: StringLiteral, b: ASTNode): ReturnType;
  abstract visitUnOp(a: UnOp, b: ASTNode): ReturnType;
  abstract visitVariable(a: Variable, b: ASTNode): ReturnType;
}