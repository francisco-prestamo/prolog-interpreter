import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Term } from "./Term";
import { Variable } from "./Variable";
import { LiteralValue, isLiteralValue } from "../../Interpreter/LiteralValue";

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
    const {head, tail} = flattenList(this);  
    
    const headRepresentation = head.map((h) => isLiteralValue(h) ? h : h.to_string_display()).join(', ');

    if (tail === null)
      return `[${headRepresentation}]`;

    const tailRepresentation = isLiteralValue(tail) ? tail : tail.to_string_display();

    return `[${headRepresentation} | ${tailRepresentation}]`;
  }

  public copy(identifier?: string, introducedBy?: string): NonEmptyList {
    const head = isLiteralValue(this.head) ? this.head : this.head.copy(identifier, introducedBy) as Term;
    return new NonEmptyList(head, this.tail.copy(identifier, introducedBy));
  }
}

function flattenList(list: List | Variable): {head: (Term | LiteralValue)[], tail: Term | LiteralValue | null} {
  if (list.type === NodeType.EmptyList) 
    return {
      head: [],
      tail: null
    }
  if (list.type === NodeType.NonEmptyList) {
    const nonEmptyList = list as NonEmptyList;
    if (nonEmptyList.tail.type === NodeType.EmptyList)
      return {
        head: [nonEmptyList.head],
        tail: null
      }
    
    const {head: restHead, tail} = flattenList(nonEmptyList.tail);
    
    return {
      head: [nonEmptyList.head, ...restHead],
      tail
    };
  }
  if (list.type === NodeType.Variable)
    return {
      head: [],
      tail: list as Variable
    };
  throw new Error('Unreachable');
}