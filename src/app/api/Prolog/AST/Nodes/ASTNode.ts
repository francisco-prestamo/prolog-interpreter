import { NodeType } from "../NodeTypes";

export const ALIAS_SEPARATOR = '$';

export abstract class ASTNode {
  constructor(public readonly type: NodeType) {
  }

  public abstract to_string_debug(): string;

  public abstract copy(alias: string): ASTNode;
}