import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Prolog/Lexer/Token";

export class StringLiteral extends ASTNode{
  public readonly value: string;

  constructor(public readonly token: Token) {
    super(NodeType.StringLiteral)
    this.value = this.token.value;
  }

  public to_string(): string {
    return `"${this.value}"`;
  }
}