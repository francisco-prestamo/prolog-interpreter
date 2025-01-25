import { ASTNode } from "./AST/Nodes/ASTNode";
import { Clause } from "./AST/Nodes/Clause";
import { Interpreter, SemanticError } from "./Interpreter/Interpreter";
import { NonListTail, RecursiveTypeError } from "./Interpreter/Unifier/Resolver";
import LexicalError from "./Lexer/LexicalError";
import { Parser } from "./Parser/Parser";
import { NodePL } from "./PrologTree/NodePL";

export interface ReturnType {
  trees: NodePL[];
  solutions: Record<string, string>[];
  errors?: string[]
}

export interface SolveOptions{
  depth?: number;
  solutions?: number;
}

export class Prolog{
  constructor(private readonly bodyText: string, private readonly queryText: string){}

  public solve(options: SolveOptions = {depth: undefined, solutions: undefined}, caputureErrors: boolean = true): ReturnType{
    const errors: string[] = []
    
    let clauses: Clause[];
    if (this.bodyText.trim() == '') clauses = [];
    else {
      try{
        const bodyParser = new Parser(this.bodyText);
        clauses = bodyParser.parseClauses();          
      }
      catch(e){
        errors.push(this.handleError(e, caputureErrors));
      }
    }
    
    let query: ASTNode[][] = []
    try{
      const queryParser = new Parser(this.queryText);
      query = queryParser.parseQuery();        
    }
    catch(e){
      errors.push(this.handleError(e, caputureErrors));
    }

    if (errors.length > 0){
      return {
        trees: [],
        solutions: [],
        errors: errors
      };
    }

    const interpreter = new Interpreter(clauses!, query!);

    try{
      const result = interpreter.interpret(options);
      return result;
    }
    catch(e){
      errors.push(this.handleError(e, caputureErrors));
      return {
        trees: [],
        solutions: [],
        errors: errors
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