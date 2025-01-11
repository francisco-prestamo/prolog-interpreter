import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";

export class Cut extends ASTNode {
  constructor() {
    super(NodeType.Cut)
  }

  public to_string_debug(): string {
    return '!';
  }

  public copy(alias: string): Cut {
    return new Cut();
  }
}