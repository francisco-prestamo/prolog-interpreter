import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Term } from "./Term";

export type List = EmptyList | NonEmptyList;

export class EmptyList extends ASTNode {
  constructor() {
    super(NodeType.EmptyList)
  }

  public to_string(): string {
    return '[]';
  }
}

export class NonEmptyList extends ASTNode {
  constructor(public readonly head : Term, public readonly tail : List) {
    super(NodeType.NonEmptyList)
  }

  public to_string(): string {
    return `[${this.head.to_string()} | ${this.tail.to_string()}]`;
  }
}