import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Term } from "./Term";
import { isLiteralValue, LiteralValue } from "../../Interpreter/Evaluator";
import { Variable } from "./Variable";

export type List = EmptyList | NonEmptyList;

export class EmptyList extends ASTNode {
  constructor() {
    super(NodeType.EmptyList)
  }

  public to_string_debug(): string {
    return '[]';
  }

  public to_string_display(): string {
    return '[]';
  }

  public copy(): EmptyList {
    return new EmptyList();
  }
}

export class NonEmptyList extends ASTNode {
  constructor(public readonly head : Term | LiteralValue, public readonly tail : List | Variable) {
    super(NodeType.NonEmptyList)
  }

  public to_string_debug(): string {
    const headRepresentation = isLiteralValue(this.head) ? this.head : this.head.to_string_debug();
    return `[${headRepresentation} | ${this.tail.to_string_debug()}]`;
  }

  public to_string_display(): string {
    const list = flattenList(this);
    const tail = list[list.length - 1];
    return `[${list.slice(0, list.length - 1).map(term => {
      if (isLiteralValue(term)) return term;
      return term.to_string_display();
    })} | ${isLiteralValue(tail) ? tail : tail.to_string_display()}]`;
  
  }

  public copy(identifier?: string, introducedBy?: string): NonEmptyList {
    const head = isLiteralValue(this.head) ? this.head : this.head.copy(identifier, introducedBy) as Term;
    return new NonEmptyList(head, this.tail.copy(identifier, introducedBy));
  }
}

function flattenList(list: List | Variable): (Term | LiteralValue)[] {
  if (list.type === NodeType.EmptyList) return [];
  if (list.type === NodeType.NonEmptyList) {
    const nonEmptyList = list as NonEmptyList;
    return [nonEmptyList.head, ...flattenList(nonEmptyList.tail)];
  }
  if (list.type === NodeType.Variable) return [list];
  throw new Error('Unreachable');
}