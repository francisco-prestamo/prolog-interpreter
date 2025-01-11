import { Clause } from "../AST/Nodes/Clause";
import { Subclause } from "../AST/Nodes/Subclause";
import { NodeType } from "../AST/NodeTypes";
import { Lexer } from "../Lexer/Lexer";
import { Token, TokenType } from "../Lexer/Token";
import { extractSubclauses } from "./ClauseParselet";
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
    let clauses: Clause[] = []

    while(this.currentToken()!.type != TokenType.EOF){
      clauses.push(this.parseClause());
      this.eat(TokenType.DOT);
    }
    this.eat(TokenType.EOF);

    return clauses;
  }

  public parseQuery(): Subclause[]{
    const query = this.expressionParser.parse(this.cursor);

    this.cursor = this.expressionParser.getCursor();

    this.eat(TokenType.DOT);

    return extractSubclauses(query);
  }

  private parseClause(): Clause{
    const node = this.expressionParser.parse(this.cursor);

    this.cursor = this.expressionParser.getCursor();

    if (node.type != NodeType.Clause){
      throw new SyntaxError('Expected clause', this.currentToken()!);
    }

    return node as Clause;
  }
}