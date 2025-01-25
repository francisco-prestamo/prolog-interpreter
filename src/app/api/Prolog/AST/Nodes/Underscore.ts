import { Token } from "../../Lexer/Token";
import { NodeType } from "../NodeTypes";
import { ASTNode } from "./ASTNode";

export class Underscore extends ASTNode{
  constructor(public readonly token: Token){
    super(NodeType.Underscore);
  }

  public to_string_debug(): string {
    return "_";
  } 

  public to_string_display(): string {
    return "_";
  }

  public copy(identifier?: string, introducedBy?: string): ASTNode {
    return new Underscore(this.token);
  }

  public setIntroducedBy(introducedBy: string): void {
    return;
  }
}