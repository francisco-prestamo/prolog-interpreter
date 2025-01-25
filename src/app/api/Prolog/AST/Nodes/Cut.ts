import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Lexer/Token";

export class Cut extends ASTNode {

  constructor(public readonly bangToken: Token, public introducedBy: string | null = null) {
    super(NodeType.Cut)
  }

  public to_string_debug(): string {
    return '!';
  }

  public to_string_display(): string {
    return '!';
  }

  public copy(identifier?: string, introducedBy?: string): Cut {
    return new Cut(this.bangToken, introducedBy);
  }

  public setIntroducedBy(introducedBy: string): void {
    this.introducedBy = introducedBy;
  }
}