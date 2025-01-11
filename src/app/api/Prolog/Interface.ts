import { Clause } from "./AST/Nodes/Clause";
import { Subclause } from "./AST/Nodes/Subclause";
import { Parser } from "./Parser/Parser";
import { NodePL } from "./PrologTree/NodePL";

export interface SolveOptions{
  depth?: number;
  solutions?: number;
}

export class Prolog{
  public get tree(): NodePL | undefined{
    return this._tree
  }

  private _tree?: NodePL = undefined;

  constructor(private readonly bodyText: string, private readonly queryText: string){}

  public solve(options: SolveOptions = {depth: undefined, solutions: undefined}){
    let clauses: Clause[];
    if (this.bodyText.trim() == '') clauses = [];
    else {
      const bodyParser = new Parser(this.bodyText);
      clauses = bodyParser.parseClauses();
    }

    const queryParser = new Parser(this.queryText);
    const query = queryParser.parseQuery();
  }
}