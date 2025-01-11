import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Prolog/Lexer/Token";

export class Constant extends ASTNode{
  public readonly name: string;
  constructor(public readonly token: Token) {
    super(NodeType.Constant)
    this.name = this.token.value;
  }

  public to_string(): string {
    return this.name;
  }
}