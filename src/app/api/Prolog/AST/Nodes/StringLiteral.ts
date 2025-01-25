import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Lexer/Token";

export class StringLiteral extends ASTNode{
  public readonly value: string;

  constructor(public readonly token: Token) {
    super(NodeType.StringLiteral)
    this.value = this.token.value;
  }

  public to_string_debug(): string {
    return `"${this.value}"`;
  }

  public to_string_display(): string {
    return `"${this.value}"`;
  }

  public copy(): StringLiteral {
    return new StringLiteral(this.token);
  }

  public setIntroducedBy(introducedBy: string): void {
    return;
  }
}