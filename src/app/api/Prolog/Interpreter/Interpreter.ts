import { Clause } from "../AST/Nodes/Clause";
import { Subclause } from "../AST/Nodes/Subclause";
import { NodePL } from "../PrologTree/NodePL";


export class Interpreter {
  private readonly tree: NodePL;
  constructor(private readonly clauses: Clause[], private readonly query: Subclause[]){
    // this.tree = 
  }
}