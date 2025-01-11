import { Token } from "../../Lexer/Token";
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

  public to_string_debug(): string {
    return `${this.operatorToken.value}(${this.left.to_string_debug()}, ${this.right.to_string_debug()})`;
  }

  public copy(alias: string): BinOp {
    return new BinOp(this.left.copy(alias), this.operatorToken, this.right.copy(alias));
  }
}