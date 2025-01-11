import { ASTNode } from "./ASTNode";
import { Functor } from "./Functor";
import { NodeType } from "../NodeTypes";
import { Subclause } from "./Subclause";

export class Clause extends ASTNode {
  constructor(public readonly head: Functor, public readonly body: Subclause[]) {
    super(NodeType.Clause)
  }

  public to_string(): string {
    return `:-(${this.head.to_string()}, [${(this.body.map(subclause => subclause.to_string())).join(", ")}])`
  }
}