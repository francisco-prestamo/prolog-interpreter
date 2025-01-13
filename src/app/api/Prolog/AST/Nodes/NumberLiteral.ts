import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Lexer/Token";

export class NumberLiteral extends ASTNode{
  public readonly value: number;

  constructor(public readonly token: Token) {
    super(NodeType.NumberLiteral)
    this.value = Number(this.token.value);
  }

  public to_string_debug(): string {
    return String(this.value);
  }

  public to_string_display(): string {
    return String(this.value);
  }

  public copy(): NumberLiteral {
    return new NumberLiteral(this.token);
  }
}