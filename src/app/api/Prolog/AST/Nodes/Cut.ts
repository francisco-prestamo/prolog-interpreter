import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";

export class Cut extends ASTNode {
  constructor() {
    super(NodeType.Cut)
  }

  public to_string(): string {
    return '!';
  }
}