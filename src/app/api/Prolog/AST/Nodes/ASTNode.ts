import { NodeType } from "../NodeTypes";

export const ALIAS_SEPARATOR = '$';

export abstract class ASTNode {
  constructor(public readonly type: NodeType) {
  }

  public abstract to_string_debug(): string;
  public abstract to_string_display(): string;

  public abstract copy(identifier?: string, introducedBy?: string): ASTNode;
  public abstract setIntroducedBy(introducedBy: string): void;
}