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

export abstract class ASTVisitor<ReturnType> {
  visit(node: ASTNode): ReturnType {
    switch (node.type) {
      case NodeType.BinOp:
        return this.visitBinOp(node as BinOp);
      case NodeType.Clause:
        return this.visitClause(node as Clause);
      case NodeType.Constant:
        return this.visitConstant(node as Constant);
      case NodeType.Cut:
        return this.visitCut(node as Cut);
      case NodeType.EmptyList:
        return this.visitEmptyList(node as EmptyList);
      case NodeType.Functor:
        return this.visitFunctor(node as Functor);
      case NodeType.NonEmptyList:
        return this.visitNonEmptyList(node as NonEmptyList);
      case NodeType.NumberLiteral:
        return this.visitNumberLiteral(node as NumberLiteral);
      case NodeType.StringLiteral:
        return this.visitStringLiteral(node as StringLiteral);
      case NodeType.UnOp:
        return this.visitUnOp(node as UnOp);
      case NodeType.Variable:
        return this.visitVariable(node as Variable);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  abstract visitBinOp(node: BinOp): ReturnType;
  abstract visitClause(node: Clause): ReturnType;
  abstract visitConstant(node: Constant): ReturnType;
  abstract visitCut(node: Cut): ReturnType;
  abstract visitEmptyList(node: EmptyList): ReturnType;
  abstract visitFunctor(node: Functor): ReturnType;
  abstract visitNonEmptyList(node: NonEmptyList): ReturnType;
  abstract visitNumberLiteral(node: NumberLiteral): ReturnType;
  abstract visitStringLiteral(node: StringLiteral): ReturnType;
  abstract visitUnOp(node: UnOp): ReturnType;
  abstract visitVariable(node: Variable): ReturnType;
}