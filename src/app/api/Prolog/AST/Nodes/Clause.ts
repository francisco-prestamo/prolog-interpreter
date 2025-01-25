import { ASTNode } from "./ASTNode";
import { Functor } from "./Functor";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Lexer/Token";

export class Clause extends ASTNode {
  constructor(public readonly head: Functor, public readonly impliesToken: Token, public readonly body: ASTNode[]) {
    super(NodeType.Clause)
  }

  public to_string_debug(): string {
    return `:-(${this.head.to_string_debug()}, [${(this.body.map(subclause => subclause.to_string_debug())).join(", ")}])`
  }

  public to_string_display(): string {
    return `${this.head.to_string_display()} :- ${this.body.map(subclause => subclause.to_string_display()).join(", ")}.`
  
  }

  public copy(identifier?: string, introducedBy?: string): Clause {
    return new Clause(this.head.copy(identifier, introducedBy) as Functor, this.impliesToken, this.body.map(subclause => subclause.copy(identifier, introducedBy)));
  }

  public setIntroducedBy(introducedBy: string): void {
    this.head.setIntroducedBy(introducedBy);
    this.body.forEach(subclause => subclause.setIntroducedBy(introducedBy));
  }
}