import { NodeType } from "../NodeTypes";

export abstract class ASTNode {
  constructor(public readonly type: NodeType) {
  }

  public abstract to_string(): string;

}