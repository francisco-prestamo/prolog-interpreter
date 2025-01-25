import { ASTNode } from "../AST/Nodes/ASTNode";
import { BinOp } from "../AST/Nodes/BinOp";
import { Clause } from "../AST/Nodes/Clause";
import { Cut } from "../AST/Nodes/Cut";
import { UnOp } from "../AST/Nodes/UnOp";
import { Variable } from "../AST/Nodes/Variable";
import { ASTVisitor } from "./ASTVisitors/Visitor";
import { EmptyList, NonEmptyList } from "../AST/Nodes/List";
import { Functor } from "../AST/Nodes/Functor";
import { NumberLiteral } from "../AST/Nodes/NumberLiteral";
import { StringLiteral } from "../AST/Nodes/StringLiteral";
import { LiteralValue, isLiteralValue } from "./LiteralValue";
import { Underscore } from "../AST/Nodes/Underscore";

export function extractVariableNames(node: ASTNode | LiteralValue): Set<string> {
  const extractor = new VariableExtractor(node);
  return extractor.variables;
}

class VariableExtractor extends ASTVisitor<void> {
  public variables: Set<string>;
  
  constructor(private readonly node: ASTNode | LiteralValue) {
    super();
    this.variables = new Set();
    this.extract(node);
  }

  private extract(node: ASTNode | LiteralValue): void {
    if(isLiteralValue(node)){
      return;
    }
    this.visit(node);
  }

  visitVariable(node: Variable): void {
    this.variables.add(node.name);
  }

  visitBinOp(node: BinOp): void {
    this.extract(node.left);
    this.extract(node.right);
  }

  visitClause(node: Clause): void {
    this.extract(node.head);
    node.body.map(s => this.extract(s));
  }

  visitUnOp(node: UnOp): void {
    this.extract(node.operand);
  }


  visitCut(node: Cut): void {
    return
  }

  visitEmptyList(node: EmptyList): void {
    return
  }

  visitFunctor(node: Functor): void {
    node.args.map(arg => this.extract(arg));
  }

  visitNonEmptyList(node: NonEmptyList): void {
    this.extract(node.head);
    this.extract(node.tail);
  }

  visitNumberLiteral(node: NumberLiteral): void {
    return;
  }

  visitStringLiteral(node: StringLiteral): void {
    return;
  }

  visitUnderscore(node: Underscore): void {
    return;
  }

}