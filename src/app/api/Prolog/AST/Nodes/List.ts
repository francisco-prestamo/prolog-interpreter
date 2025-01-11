import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Term } from "./Term";

export type List = EmptyList | NonEmptyList;

export class EmptyList extends ASTNode {
  constructor() {
    super(NodeType.EmptyList)
  }

  public to_string_debug(): string {
    return '[]';
  }

  public copy(alias: string): EmptyList {
    return new EmptyList();
  }
}

export class NonEmptyList extends ASTNode {
  constructor(public readonly head : Term, public readonly tail : List) {
    super(NodeType.NonEmptyList)
  }

  public to_string_debug(): string {
    return `[${this.head.to_string_debug()} | ${this.tail.to_string_debug()}]`;
  }

  public copy(alias: string): NonEmptyList {
    return new NonEmptyList(this.head.copy(alias) as Term, this.tail.copy(alias));
  }
}