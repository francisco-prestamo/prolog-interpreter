import { ASTNode } from "./AST/Nodes/ASTNode";
import { Clause } from "./AST/Nodes/Clause";
import { Interpreter, SemanticError } from "./Interpreter/Interpreter";
import { NonListTail, RecursiveTypeError } from "./Interpreter/Unifier/Resolver";
import LexicalError from "./Lexer/LexicalError";
import { Parser } from "./Parser/Parser";
import { SyntaxError } from "./Parser/SyntaxError";
import { NodePL } from "./PrologTree/NodePL";

export interface ReturnType {
  trees: NodePL[];
  solutions: Record<string, string>[];
  queryParsingErrors?: string[],
  programParsingErrors?: string[],
  interpreterErrors?: string[]
}

export interface SolveOptions{
  depth?: number;
  solutions?: number;
}

export class Prolog{
  constructor(private readonly bodyText: string, private readonly queryText: string){}

  public solve(options: SolveOptions = {depth: undefined, solutions: undefined}, caputureErrors: boolean = true): ReturnType{
    const qerrors: string[] = []
    const perrors: string[] = []
    const ierrors: string[] = []

    let clauses: Clause[];
    if (this.bodyText.trim() == '') clauses = [];
    else {
      try{
        const bodyParser = new Parser(this.bodyText);
        clauses = bodyParser.parseClauses();          
      }
      catch(e){
        perrors.push(this.handleError(e, caputureErrors));
      }
    }
    
    let query: ASTNode[][] = []
    try{
      const queryParser = new Parser(this.queryText);
      query = queryParser.parseQuery();        
    }
    catch(e){
      qerrors.push(this.handleError(e, caputureErrors));
    }

    if (qerrors.length > 0 || perrors.length > 0){
      return {
        trees: [],
        solutions: [],
        queryParsingErrors : qerrors.length > 0 ? qerrors : undefined,
        programParsingErrors : perrors.length > 0 ? perrors : undefined,
      };
    }

    const interpreter = new Interpreter(clauses!, query!);

    try{
      const result = interpreter.interpret(options);
      return result;
    }
    catch(e){
      ierrors.push(this.handleError(e, caputureErrors));
      return {
        trees: [],
        solutions: [],
        interpreterErrors: ierrors
      };
    }
  
  }

  private handleError(e: unknown, caputureErrors: boolean): string{
    if (!caputureErrors) throw e;
    if (e instanceof LexicalError || 
        e instanceof SemanticError || 
        e instanceof SyntaxError ||
        e instanceof NonListTail ||
        e instanceof RecursiveTypeError){
      return e.message;
    }
    else {
      throw e;
    }
  }
}