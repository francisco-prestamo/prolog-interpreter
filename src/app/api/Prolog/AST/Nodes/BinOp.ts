import { Token } from "../../Prolog/Lexer/Token";
import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";

export class BinOp extends ASTNode {
  constructor(
    public readonly left: ASTNode,
    public readonly operatorToken: Token,
    public readonly right: ASTNode
  ) {
    super(NodeType.BinOp);
  }

  public to_string(): string {
    return `${this.operatorToken.value}(${this.left.to_string()}, ${this.right.to_string()})`;
  }
}