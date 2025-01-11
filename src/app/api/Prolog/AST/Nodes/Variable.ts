import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Prolog/Lexer/Token";

export class Variable extends ASTNode{

  public readonly name: string;

  constructor(public readonly token: Token) {
    super(NodeType.Variable)
    this.name = this.token.value;
  }

  public to_string(): string {
    return this.name;
  }
}