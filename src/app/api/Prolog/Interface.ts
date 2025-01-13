import { Clause } from "./AST/Nodes/Clause";
import { Interpreter } from "./Interpreter/Interpreter";
import { Unifier } from "./Interpreter/Unifier";
import { Parser } from "./Parser/Parser";
import { NodePL } from "./PrologTree/NodePL";

export interface ReturnType {
  trees: NodePL[];
  solutions: Unifier[];
}

export interface SolveOptions{
  depth?: number;
  solutions?: number;
}

export class Prolog{
  constructor(private readonly bodyText: string, private readonly queryText: string){}

  public solve(options: SolveOptions = {depth: undefined, solutions: undefined}): ReturnType{
    let clauses: Clause[];
    if (this.bodyText.trim() == '') clauses = [];
    else {
      const bodyParser = new Parser(this.bodyText);
      clauses = bodyParser.parseClauses();
    }

    const queryParser = new Parser(this.queryText);
    const query = queryParser.parseQuery();

    const interpreter = new Interpreter(clauses, query);

    return interpreter.interpret(options);
  }
}