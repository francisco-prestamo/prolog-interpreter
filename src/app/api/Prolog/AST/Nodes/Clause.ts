import { ASTNode } from "./ASTNode";
import { Functor } from "./Functor";
import { NodeType } from "../NodeTypes";
import { Subclause } from "./Subclause";

export class Clause extends ASTNode {
  constructor(public readonly head: Functor, public readonly body: Subclause[]) {
    super(NodeType.Clause)
  }

  public to_string_debug(): string {
    return `:-(${this.head.to_string_debug()}, [${(this.body.map(subclause => subclause.to_string_debug())).join(", ")}])`
  }

  public copy(alias: string): Clause {
    return new Clause(this.head.copy(alias) as Functor, this.body.map(subclause => subclause.copy(alias)));
  }
}