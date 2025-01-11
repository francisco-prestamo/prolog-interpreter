import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Lexer/Token";

export class UnOp extends ASTNode{
  constructor(public readonly operatorToken: Token, public readonly operand: ASTNode) {
    super(NodeType.UnOp)
  }

  public to_string_debug(): string {
    return `${this.operatorToken.value}(${this.operand.to_string_debug()})`;
  }

  public copy(alias: string): UnOp {
    return new UnOp(this.operatorToken, this.operand.copy(alias));
  }
}