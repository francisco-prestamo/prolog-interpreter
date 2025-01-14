import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Lexer/Token";
import { LiteralValue, isLiteralValue } from "../../Interpreter/LiteralValue";

export class Functor extends ASTNode {

  public readonly name: string;

  constructor (public readonly nameToken: Token, public readonly args: (ASTNode | LiteralValue)[], public readonly introducedBy: string | null) {
    super(NodeType.Functor)
    this.name = this.nameToken.value;
  }

  public to_string_debug(): string {
    return `${this.name}(${this.args.map(arg => {
      if (isLiteralValue(arg)) {
        return arg;
      }
      return arg.to_string_debug()
    }).join(', ')})`;
  }

  public to_string_display(): string {
    return `${this.name}(${this.args.map(arg => {
      if (isLiteralValue(arg)) {
        return arg;
      }
      return arg.to_string_display()
    }).join(', ')})`;
  }

  public copy(identifier?: string, introducedBy?: string): Functor {
    return new Functor(this.nameToken, this.args.map(arg => {
      if(isLiteralValue(arg)) {
        return arg;
      }
      return arg.copy(identifier, introducedBy)
    }), this.introducedBy);
  }
}