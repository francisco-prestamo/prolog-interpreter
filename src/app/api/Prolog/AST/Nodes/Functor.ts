import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Prolog/Lexer/Token";

export class Functor extends ASTNode {

  public readonly name: string;

  constructor (public readonly nameToken: Token, public readonly args: ASTNode[], public readonly introducedBy: string | null) {
    super(NodeType.Functor)
    this.name = this.nameToken.value;
  }

  public to_string(): string {
    return `${this.name}(${this.args.map(arg => arg.to_string()).join(', ')})`;
  }
}