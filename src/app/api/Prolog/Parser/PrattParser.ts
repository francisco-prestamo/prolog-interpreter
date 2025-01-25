import { Token, TokenType } from "../Lexer/Token";
import { ASTNode } from "../AST/Nodes/ASTNode";
import { SyntaxError } from "./SyntaxError";
import { Term } from "../AST/Nodes/Term";
import { Functor } from "../AST/Nodes/Functor";
import { Variable } from "../AST/Nodes/Variable";
import { StringLiteral } from "../AST/Nodes/StringLiteral";
import { NumberLiteral } from "../AST/Nodes/NumberLiteral";
import { EmptyList, List, NonEmptyList } from "../AST/Nodes/List";
import { BinOp } from "../AST/Nodes/BinOp";
import { UnOp } from "../AST/Nodes/UnOp";
import LexicalError from "../Lexer/LexicalError";
import { Cut } from "../AST/Nodes/Cut";
import { Underscore } from "../AST/Nodes/Underscore";


const COMMA_PRECEDENCE = 1000;

type prefixParselet = (parser: PrattParser, operator: Token) => ASTNode;


type infixParselet = (parser: PrattParser, left: ASTNode, operator: Token) => ASTNode;


export type OperandNode = {
  node: ASTNode,
  outermostPrecedence: number,
}

export class PrattParser {
  private prefixParselets: Map<string, {precedence: number, parselet: prefixParselet}>
  private infixParselets: Map<string, {precedence: number, parselet: infixParselet}>
  private cursor: number = 0;
  private maxPrecedence: number = 0;

  public getCursor(){
    return this.cursor;
  }

  constructor(readonly tokens: Token[]) {
    this.prefixParselets = new Map<string, {precedence: number, parselet: prefixParselet}>();
    this.infixParselets =  new Map<string, {precedence: number, parselet: infixParselet}>();
  

    this.registerPrefix(
      [TokenType.PLUS, TokenType.MINUS], 
      100, 
      (parser, operator) => {
        parser.eat(operator.type);
        return new UnOp(operator, parser.parseExpression(100).node);
      }
    )

    this.registerInfix_xfx(
      [TokenType.IMPLIES],
      1200
    )

    this.registerInfix_yfx(
      [TokenType.COMMA],
      COMMA_PRECEDENCE
    );

    this.registerInfix_yfx(
      [TokenType.SEMICOLON],
      1100
    );

    this.registerInfix(
      [
        TokenType.IS,
        TokenType.GREATER,
        TokenType.GREATER_OR_EQUAL,
        TokenType.LESS,
        TokenType.LESS_OR_EQUAL,
        TokenType.UNIFY,
        TokenType.SAME_VALUE_EQUAL,
        TokenType.LITERAL_EQUAL
      ],
      700,
      (parser, left, operator) => {
        parser.eat(operator.type);

        const right = parser.parseExpression(700 - 1);

        const token = parser.currentToken();
        const infix = parser.infixParselets.get(token.type);
        if (infix === undefined || infix.precedence > 700)
          return new Functor(operator, [left, right.node], null);
  
        throw new SyntaxError("Operator " + operator.type + " is not associative", operator);
      }
    )

    this.registerInfix_yfx(
      [TokenType.PLUS, TokenType.MINUS],
      500
    )

    this.registerInfix_yfx(
      [TokenType.TIMES, TokenType.DIVIDE],
      400
    )

    this.registerInfix_xfy(
      [TokenType.POWER],
      200
    )

    this.registerPrefix(
      [TokenType.LPAR],
      0,
      (parser, parenthesis) => {
        parser.eat(TokenType.LPAR);
        const xpr = parser.parseExpression(parser.maxPrecedence + 1).node;
        parser.eat(TokenType.RPAR);
        return xpr;
      }
    )
  }

  public parse(start: number = 0): ASTNode {
    this.cursor = start;
    if (this.cursor >= this.tokens.length){
      throw new SyntaxError('Unexpected end of file', this.currentToken());
    }
    return this.parseExpression(this.maxPrecedence + 1).node
  }

  private registerPrefix(names: string[], precedence: number, parselet: prefixParselet){
    names.map(name => this.prefixParselets.set(name, {precedence, parselet}));
    this.maxPrecedence = Math.max(precedence, this.maxPrecedence);
  }

  private registerInfix(names: string[], precedence: number, parselet: infixParselet){
    names.map(name => this.infixParselets.set(name, {precedence, parselet}));
    this.maxPrecedence = Math.max(precedence, this.maxPrecedence);
  }

  private registerInfix_yfx(names: string[], precedence: number){
    this.registerInfix(names, precedence, (parser, left, operator) => {
      parser.eat(operator.type);

      const right = parser.parseExpression(precedence - 1).node;

      return new BinOp(left, operator, right);
    })
  }

  private registerInfix_xfx(names: string[], precedence: number){
    this.registerInfix(names, precedence, (parser, left, operator) => {
      parser.eat(operator.type);

      const right = parser.parseExpression(precedence - 1);
      
      const token = parser.currentToken();
      const infix = parser.infixParselets.get(token.type);
      if (infix === undefined || infix.precedence > precedence)
        return new BinOp(left, operator, right.node);

      throw new SyntaxError("Operator " + operator.type + " is not associative", operator);

    })
  }

  private registerInfix_xfy(names: string[], precedence: number){
    this.registerInfix(names, precedence, (parser, left, operator) => {
      parser.eat(operator.type);

      const right = parser.parseExpression(precedence);

      return new BinOp(left, operator, right.node);
    })
  }



  public currentToken() {
    return this.tokens[this.cursor];
  }

  private consume(){
    this.cursor++;
    if (this.cursor >= this.tokens.length){
      throw new Error('Cursor index out of range');
    }
  }

  private eat(expected: TokenType){
    if (this.currentToken().type != expected){
      throw new LexicalError('Expected ' + expected + ' got ' + this.currentToken().type + ' instead.', this.currentToken().line, this.currentToken().column);
    }
    this.consume();
  }

  private parseExpression(precedence: number): OperandNode{
    let left = this.parsePrefix(precedence);

    let token = this.currentToken();

    let infix = this.infixParselets.get(token.type)
    if (infix == undefined) return left;


    let foundOperatorPrecedence = infix.precedence;
    
    while(foundOperatorPrecedence <= precedence){
      left = {
        node: infix.parselet(this, left.node, token),
        outermostPrecedence: infix.precedence
      }
    
      token = this.currentToken();
      infix = this.infixParselets.get(token.type)
      if (infix == undefined) break;
      foundOperatorPrecedence = infix.precedence;
    }

    return left;
  }


  private parsePrefix(precedence: number): OperandNode{
    const token = this.currentToken();

    const prefix = this.prefixParselets.get(token.type);
    if (prefix == undefined){
      return {node: this.parseTermOrFunctor(), outermostPrecedence: 0};
    }

    // this.consume();

    const foundOperatorPrecedence = prefix.precedence
    if (precedence < foundOperatorPrecedence){
      throw new SyntaxError("Unexpected token", this.currentToken());
    }

    return {node: prefix.parselet(this, token), outermostPrecedence: foundOperatorPrecedence};
  }

  private parseTermOrFunctor(): Term | Functor | Cut{
    if (this.currentToken().type == TokenType.CONSTANT){
      const nameToken = this.currentToken();
      this.consume();
      if (nameToken.value == 'fail'){
        return new Functor(nameToken, [], null);
      }
      if (this.currentToken().type == TokenType.LPAR){
        this.consume();
        return this.parseFunctor(nameToken);
      }
      return new Functor(nameToken, [], null);
    }
    if (this.currentToken().type == TokenType.BANG){
      const bangToken = this.currentToken()
      this.consume();
      return new Cut(bangToken);
    }
    return this.parseTerm();
  }

  private parseTerm(): Term {
    switch (this.currentToken().type){

      case TokenType.CONSTANT:
        const nameToken = this.currentToken();
        this.consume();
        return new Functor(nameToken, [], null);

      case TokenType.VARIABLE:
        const variable = new Variable(this.currentToken());
        this.consume()
        return variable;

      case TokenType.STRING_LITERAL:
        const stringLiteral = this.currentToken();
        this.consume()
        return new StringLiteral(stringLiteral);

      case TokenType.NUMBER_LITERAL:
        const numberLiteral = new NumberLiteral(this.currentToken());
        this.consume()
        return numberLiteral;

      case TokenType.LBRACKET:
        return this.parseList();
      
      case TokenType.UNDERSCORE:
        const underscoreToken = this.currentToken();
        this.consume();
        return new Underscore(underscoreToken);

      default:
        throw new SyntaxError("Unexpected token", this.currentToken());
    }
  }

  private parseFunctor(nameToken: Token): Functor{
    const args: ASTNode[] = []
    args.push(this.parseExpression(COMMA_PRECEDENCE - 1).node);
    while (this.currentToken().type != TokenType.RPAR){
      this.eat(TokenType.COMMA);
      args.push(this.parseExpression(COMMA_PRECEDENCE - 1).node);
    }
    this.eat(TokenType.RPAR);

    return new Functor(nameToken, args, null);
  }

  private parseList(): List{
    this.eat(TokenType.LBRACKET);
    
    // empty list case
    if (this.currentToken().type == TokenType.RBRACKET){
      this.eat(TokenType.RBRACKET)
      return new EmptyList();
    }

    // non empty list
    const head_terms: Term[] = [];
    let tail: Term | undefined = undefined;

    head_terms.push(this.parseTerm());
    while(this.currentToken().type == TokenType.COMMA){
      this.eat(TokenType.COMMA);
      head_terms.push(this.parseTerm());
    }
    if (this.currentToken().type == TokenType.PIPE){
      this.eat(TokenType.PIPE);
      tail = this.parseTerm();
    }
    this.eat(TokenType.RBRACKET);

    if (tail == undefined){ // no PIPE
      return this.buildList(head_terms, new EmptyList());
    }
    else 
      return this.buildList(head_terms, tail);
  }

  private buildList(head: Term[], tail: Term): List{
    if (head.length == 0){
      throw new Error("Tried creating list with no head");
    }
    if (head.length == 1){
      return new NonEmptyList(head[0], tail);
    }
    return new NonEmptyList(head[0], this.buildList(head.slice(1), tail));
  }
}