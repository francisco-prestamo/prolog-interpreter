import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Prolog/Lexer/Token";

export class UnOp extends ASTNode{
  constructor(public readonly operatorToken: Token, public readonly operand: ASTNode) {
    super(NodeType.UnOp)
  }

  public to_string(): string {
    return `${this.operatorToken.value}(${this.operand.to_string()})`;
  }
}