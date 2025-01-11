import { Clause } from "../AST/Nodes/Clause";
import { Subclause } from "../AST/Nodes/Subclause";
import { Atom } from "../AST/Nodes/Atom";
import { Term } from "../AST/Nodes/Term";

export interface NodePL {
  id: string;
  fatherId?: string;
  clause: Clause;
  unifier: Map<Atom, Term>;
  unifierText: string;
  objective: Subclause[];
  processedCut?: boolean;
  children: NodePL[];
}