import { ALIAS_SEPARATOR, ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Lexer/Token";

export class Variable extends ASTNode{

  public readonly name: string;

  constructor(public readonly token: Token, name?: string) {
    super(NodeType.Variable)
    this.name = name ?? this.token.value;
  }

  public to_string_debug(): string {
    return this.name;
  }

  public copy(alias: string): Variable {
    return new Variable(this.token, this.name + ALIAS_SEPARATOR + alias);
  }
}