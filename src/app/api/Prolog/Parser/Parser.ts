import { BinOp } from "../AST/Nodes/BinOp";
import { Clause } from "../AST/Nodes/Clause";
import { Functor } from "../AST/Nodes/Functor";
import { Subclause } from "../AST/Nodes/Subclause";
import { NodeType } from "../AST/NodeTypes";
import { Lexer } from "../Lexer/Lexer";
import { Token, TokenType } from "../Lexer/Token";
import { extractClausePossibilities, extractSubclauses } from "./ClauseBuilder";
import { PrattParser } from "./PrattParser";
import { SyntaxError } from "./SyntaxError";

export class Parser{
  private readonly tokens: Token[] = [];
  private cursor: number = 0;
  private expressionParser: PrattParser

  constructor(text: string){
    const lexer = new Lexer(text);
    this.tokens = lexer.getTokens();
    this.expressionParser = new PrattParser(this.tokens);
  }

  private currentToken(): Token | undefined{
    return this.tokens[this.cursor];
  }

  private eat(expected: TokenType){
    if (this.currentToken() == undefined){
      throw new SyntaxError('Unexpected end of file', null);
    }
    if (expected != this.currentToken()!.type){
      throw new SyntaxError('Expected ' + expected, this.currentToken()!);
    }
    this.cursor++;
  }

  public parseClauses(): Clause[]{
    const clauses: Clause[] = []

    while(this.currentToken()!.type != TokenType.EOF){
      clauses.push(...this.parseClauseWithPossibilities());
      this.eat(TokenType.DOT);
    }
    this.eat(TokenType.EOF);

    return clauses;
  }

  public parseQuery(): Subclause[][]{
    const query = this.expressionParser.parse(this.cursor);

    this.cursor = this.expressionParser.getCursor();

    const dotToken = this.currentToken();
    this.eat(TokenType.DOT);
    
    if (query.type == NodeType.Functor) return [[query as Functor]]
    else if (query.type == NodeType.BinOp) return extractSubclauses(query as BinOp)
    throw new SyntaxError('Expected functor or binop', dotToken!);
  }

  private parseClauseWithPossibilities(): Clause[]{
    const nodes = this.expressionParser.parse(this.cursor);

    this.cursor = this.expressionParser.getCursor();

    return extractClausePossibilities(nodes);
  }
}