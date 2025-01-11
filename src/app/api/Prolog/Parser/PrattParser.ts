import { Token, TokenType } from "../Lexer/Token";
import { ASTNode } from "../AST/Nodes/ASTNode";
import { SyntaxError } from "./SyntaxError";
import { Term } from "../AST/Nodes/Term";
import { Functor } from "../AST/Nodes/Functor";
import { Constant } from "../AST/Nodes/Constant";
import { Variable } from "../AST/Nodes/Variable";
import { StringLiteral } from "../AST/Nodes/StringLiteral";
import { NumberLiteral } from "../AST/Nodes/NumberLiteral";
import { EmptyList, List, NonEmptyList } from "../AST/Nodes/List";
import { AssociativityType } from "./AssociativityType";
import { BinOp } from "../AST/Nodes/BinOp";
import { UnOp } from "../AST/Nodes/UnOp";
import LexicalError from "../Lexer/LexicalError";
import { extractClause } from "./ClauseParselet";
import { Cut } from "../AST/Nodes/Cut";


type prefixParselet = (operator: Token, operand: ASTNode) => ASTNode;


type infixParselet = (left: ASTNode, operator: Token, operand: ASTNode) => ASTNode;


export type OperandNode = {
  node: ASTNode,
  outermostPrecedence: number,
}

export class PrattParser {
  private prefixParselets: Map<string, {precedence: number, parselet: prefixParselet, associativityType: AssociativityType}>
  private infixParselets: Map<string, {precedence: number, parselet: infixParselet, associativityType: AssociativityType}>
  private cursor: number = 0;
  private maxPrecedence: number = 0;

  public getCursor(){
    return this.cursor;
  }

  constructor(readonly tokens: Token[]) {
    this.prefixParselets = new Map<string, {precedence: number, parselet: prefixParselet, associativityType: AssociativityType}>();
    this.infixParselets =  new Map<string, {precedence: number, parselet: infixParselet, associativityType: AssociativityType}>();
   
    this.registerPrefix(
      [TokenType.PLUS, TokenType.MINUS], 
      100, 
      AssociativityType.fy,
      (operator: Token, operand: ASTNode) => {
        return new UnOp(operator, operand);
      }
    )

    this.registerInfix(
      [TokenType.IMPLIES],
      1200,
      AssociativityType.xfx,
      (left: ASTNode, operator: Token, operand: ASTNode) => {
        return extractClause(new BinOp(left, operator, operand));
      }
    )

    this.registerInfix(
      [TokenType.COMMA],
      1100,
      AssociativityType.yfx,
      (left, operator, operand) => {
        return new BinOp(left, operator, operand);
      }
    );

    this.registerInfix(
      [
        TokenType.IS,
        TokenType.GREATER_THAN,
        TokenType.GREATER_OR_EQUAL,
        TokenType.LESS_THAN,
        TokenType.LESS_OR_EQUAL,
        TokenType.UNIFY,
        TokenType.SAME_VALUE_EQUAL,
        TokenType.LITERAL_EQUAL
      ],
      700,
      AssociativityType.xfx,
      (left, operator, right) => {
        return new Functor(operator, [left, right], null)
      }
    )

    this.registerInfix(
      [TokenType.PLUS, TokenType.MINUS],
      500,
      AssociativityType.yfx,
      (left, operator, right) => {
        return new BinOp(left, operator, right);
      }
    )

    this.registerInfix(
      [TokenType.TIMES, TokenType.DIVIDE],
      400,
      AssociativityType.yfx,
      (left, operator, right) => {
        return new BinOp(left, operator, right);
      }
    )

    this.registerInfix(
      [TokenType.POWER],
      200,
      AssociativityType.xfy,
      (left, operator, right) => {
        return new BinOp(left, operator, right);
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

  private registerPrefix(names: string[], precedence: number, associativityType: AssociativityType, parselet: prefixParselet){
    names.map(name => this.prefixParselets.set(name, {precedence, parselet, associativityType}));
    this.maxPrecedence = Math.max(precedence, this.maxPrecedence);
  }

  private registerInfix(names: string[], precedence: number, associativityType: AssociativityType, parselet: infixParselet){
    names.map(name => this.infixParselets.set(name, {precedence, parselet, associativityType}));
    this.maxPrecedence = Math.max(precedence, this.maxPrecedence);
  }



  private currentToken() {
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
      throw new LexicalError('Expected ' + expected, this.currentToken().line, this.currentToken().column);
    }
    this.consume();
  }

  private parseExpression(precedence: number): OperandNode{
    let left = this.parsePrefix(precedence);

    let token = this.currentToken();

    let infix = this.infixParselets.get(token.type)
    if (infix == undefined) return left;


    let foundOperatorPrecedence = infix.precedence;
    let foundOperatorAssociativity = infix.associativityType;
    
    while(precedence >= foundOperatorPrecedence){
      switch(foundOperatorAssociativity){
        case AssociativityType.xfx:
          if (precedence > foundOperatorPrecedence){
            this.consume();
            left = {
              node: infix.parselet(left.node, token, this.parseExpression(foundOperatorPrecedence - 1).node), 
              outermostPrecedence: foundOperatorPrecedence
            };
            return left
          }
          else
            return left
        case AssociativityType.xfy:
          if (precedence >= foundOperatorPrecedence){
            this.consume();
            left = {
              node: infix.parselet(left.node, token, this.parseExpression(foundOperatorPrecedence).node),
              outermostPrecedence: foundOperatorPrecedence
            }
            break;
          }
          else
            return left
        case AssociativityType.yfx:
          if (precedence > foundOperatorPrecedence){
            left = this.parse_yfx(left.node, foundOperatorPrecedence);
            break;
          }
          else
            return left
        default:
          throw new Error('Invalid associativity ' + foundOperatorAssociativity + ' for infix operator ' + token.value);
      }

      token = this.currentToken();

      infix = this.infixParselets.get(token.type)
      if (infix == undefined) return left;

      foundOperatorPrecedence = infix.precedence;
      foundOperatorAssociativity = infix.associativityType;
    }

    return left;
  }

  private parse_yfx(left: ASTNode, precedence: number): OperandNode{
    let token = this.currentToken();
    let infix = this.infixParselets.get(token.value);
    if (infix == undefined) return {node: left, outermostPrecedence: precedence};

    while(infix.precedence == precedence && infix.associativityType == AssociativityType.yfx){
      this.consume();
      left = infix.parselet(left, token, this.parseExpression(precedence - 1).node);

      token = this.currentToken();
      infix = this.infixParselets.get(token.value);
      if (infix == undefined) return {node: left, outermostPrecedence: precedence};
    }

    return {node: left, outermostPrecedence: precedence};
  }

  private parsePrefix(precedence: number): OperandNode{
    const token = this.currentToken();

    if (token.type == TokenType.LPAR){
      this.consume();
      const expression = this.parseExpression(this.maxPrecedence + 1);
      this.eat(TokenType.RPAR);
      return expression;
    }

    const prefix = this.prefixParselets.get(token.type);
    if (prefix == undefined){
      return {node: this.parseTermOrFunctor(), outermostPrecedence: 0};
    }

    this.consume();

    const foundOperatorPrecedence = prefix.precedence
    if (precedence < foundOperatorPrecedence){
      throw new SyntaxError("Unexpected token", this.currentToken());
    }

    let left: ASTNode

    const foundOperatorAssociativity = prefix.associativityType
    switch(foundOperatorAssociativity){
      case AssociativityType.fx:
        left = prefix.parselet(token, this.parseExpression(foundOperatorPrecedence - 1).node);
        break;
      case AssociativityType.fy:
        left = prefix.parselet(token, this.parseExpression(foundOperatorPrecedence).node);
        break;
      default:
        throw new Error('Invalid associativity ' + foundOperatorAssociativity + ' for prefix operator ' + token.value);
    }

    return {node: left, outermostPrecedence: foundOperatorPrecedence};
  }

  private parseTermOrFunctor(): Term | Functor | Cut{
    if (this.currentToken().type == TokenType.CONSTANT){
      const nameToken = this.currentToken();
      this.consume();
      if (this.currentToken().type == TokenType.LPAR){
        this.consume();
        return this.parseFunctor(nameToken);
      }
      return new Constant(nameToken);
    }
    if (this.currentToken().type == TokenType.BANG){
      this.consume();
      return new Cut();
    }
    return this.parseTerm();
  }

  private parseTerm(): Term {
    switch (this.currentToken().type){

      case TokenType.CONSTANT:
        const nameToken = this.currentToken();
        this.consume();
        return new Constant(nameToken);

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

      default:
        throw new SyntaxError("Unexpected token", this.currentToken());
    }
  }

  private parseFunctor(nameToken: Token): Functor{
    let args: ASTNode[] = []
    args.push(this.parseTerm());
    while (this.currentToken().type != TokenType.RPAR){
      this.eat(TokenType.COMMA);
      args.push(this.parseTerm());
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
    let head_terms: Term[] = [];
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