import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Lexer/Token";

export class Constant extends ASTNode{
  public readonly name: string;
  constructor(public readonly token: Token) {
    super(NodeType.Constant)
    this.name = this.token.value;
  }

  public to_string_debug(): string {
    return this.name;
  }

  public to_string_display(): string {
    return this.name;
  }

  public copy(): Constant {
    return new Constant(this.token);
  }
}