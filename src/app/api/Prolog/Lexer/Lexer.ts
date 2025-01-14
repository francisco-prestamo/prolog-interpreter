import { KeyWords, Token, TokenType } from "./Token";
import LexicalError from "./LexicalError";


export class Lexer{
  constructor(private readonly text: string){}
  private tokens: Token[] = [];
  private cursor = 0;
  private line = 1;
  private column = 1;

  public getTokens(){
    this.cursor = 0;
    this.tokens = [];
    this.line = 1;
    this.column = 1;

    
    while(this.cursor < this.text.length){
      switch(this.currentChar()){
        case " ":
        case "\t":
        case "\n":
          this.advance();
          break;
        case ":":
          if (this.peek() === "-"){
            this.addToken(TokenType.IMPLIES, TokenType.IMPLIES);
            this.advance();
            this.advance();
          }
          else throw new LexicalError("Unexpected character ':'", this.line, this.column);
          break;
        case ",":
          this.addToken(TokenType.COMMA, TokenType.COMMA);
          this.advance();
          break;
        case ";":
          this.addToken(TokenType.SEMICOLON, TokenType.SEMICOLON);
          this.advance();
          break;
        case "+":
          this.addToken(TokenType.PLUS, TokenType.PLUS);
          this.advance();
          break;
        case "-":
          this.addToken(TokenType.MINUS, TokenType.MINUS);
          this.advance();
          break;
        case '/':
          this.addToken(TokenType.DIVIDE, TokenType.DIVIDE);
          this.advance();
          break;
        case "*":
          this.addToken(TokenType.TIMES, TokenType.TIMES);
          this.advance();
          break;
        case ".":
          this.addToken(TokenType.DOT, TokenType.DOT);
          this.advance();
          break;
        case "|":
          this.addToken(TokenType.PIPE, TokenType.PIPE);
          this.advance();
          break;
        case "^":
          this.addToken(TokenType.POWER, TokenType.POWER);
          this.advance();
          break;
        case "<":
          this.addToken(TokenType.LESS, TokenType.LESS);
          this.advance();
          break;
        case ">":
          if (this.peek() === "="){
            this.addToken(TokenType.GREATER_OR_EQUAL, TokenType.GREATER_OR_EQUAL);
            this.advance();
          }
          else{
            this.addToken(TokenType.GREATER, TokenType.GREATER);
          }
          this.advance();
          break;
        case "=":
          if (this.peek() === "<"){
            this.addToken(TokenType.LESS_OR_EQUAL, TokenType.LESS_OR_EQUAL);
            this.advance();
          }
          else if (this.peek() === "="){
            this.addToken(TokenType.LITERAL_EQUAL, TokenType.LITERAL_EQUAL);
            this.advance();
          }
          else if (this.peek() === ":"){
            if (this.peek(2) === "="){
              this.addToken(TokenType.SAME_VALUE_EQUAL, TokenType.SAME_VALUE_EQUAL);
              this.advance();
              this.advance();
            }
            else throw new LexicalError("Unexpected character '='", this.line, this.column);
          }
          else{
            this.addToken(TokenType.UNIFY, TokenType.UNIFY);
          }
          this.advance();
          break;
        case "\\":
          if (this.peek() === "/"){
            this.addToken(TokenType.LOGICAL_OR, TokenType.LOGICAL_OR);
            this.advance();
          }
          else throw new LexicalError("Unexpected character '\\'", this.line, this.column);
          break;
        case "/":
          if (this.peek() === "\\"){
            this.addToken(TokenType.LOGICAL_AND, TokenType.LOGICAL_AND);
            this.advance();
          }
          else throw new LexicalError("Unexpected character '/'", this.line, this.column);
          break;
        case "(":
          this.addToken(TokenType.LPAR, TokenType.LPAR);
          this.advance();
          break;
        case ")":
          this.addToken(TokenType.RPAR, TokenType.RPAR);
          this.advance();
          break;
        case "[":
          this.addToken(TokenType.LBRACKET, TokenType.LBRACKET);
          this.advance();
          break;
        case "]":
          this.addToken(TokenType.RBRACKET, TokenType.RBRACKET);
          this.advance();
          break;
        case "!":
          this.addToken(TokenType.BANG, TokenType.BANG);
          this.advance();
          break;        
        default:
          if (/[a-z]/.test(this.currentChar())){
            this.addConstantOrKeyWord();
          }
          else if (/[A-Z]/.test(this.currentChar())){
            this.addVariable();
          }
          else if (/[0-9]/.test(this.currentChar())){
            this.addToken(TokenType.NUMBER_LITERAL, this.getNumber().literal);
          }
          else if (this.currentChar() === '"'){
            this.addToken(TokenType.STRING_LITERAL, this.getStringLiteral().literal);
          }
          else throw new LexicalError("Unexpected character '" + this.currentChar() + "'", this.line, this.column);
      }
    }
    this.tokens.push({type: TokenType.EOF, value: TokenType.EOF, line: this.line, column: this.column})
    return this.tokens;
  }

  private addConstantOrKeyWord(){
    const {literal, line, column} = this.getIdentifier();
    if (KeyWords.has(literal)){
      this.addToken(KeyWords.get(literal)!, literal, line, column);
      return;
    }
    this.addToken(TokenType.CONSTANT, literal, line, column);
  }

  private addVariable(){
    const {literal, line, column} = this.getIdentifier();
    this.addToken(TokenType.VARIABLE, literal, line, column);
  }

  private getIdentifier(): {literal: string, line: number, column: number}{
    let literal = "";
    const startLine = this.line;
    const startColumn = this.column;
    while (this.cursor < this.text.length && /[a-zA-Z0-9_]/.test(this.currentChar())){
      literal += this.currentChar();
      this.advance();
    }
    return {literal, line: startLine, column: startColumn};
  }

  private getNumber(): {literal: string, line: number, column: number}{
    let literal = "";
    const startLine = this.line;
    const startColumn = this.column;
    while (this.cursor < this.text.length && /[0-9]/.test(this.currentChar())){
      literal += this.currentChar();
      this.advance();
    }
    if (this.currentChar() === "." && this.peek() != null && /[0-9]/.test(this.peek()!)){
      literal += this.currentChar();
      this.advance();
      while (this.cursor < this.text.length && /[0-9]/.test(this.currentChar())){
        literal += this.currentChar();
        this.advance();
      }
    }
    return {literal, line: startLine, column: startColumn};
  }

  private getStringLiteral(): {literal: string, line: number, column: number}{
    let literal = "";
    const startLine = this.line;
    const startColumn = this.column;
    this.advance();
    while (this.cursor < this.text.length && this.currentChar() !== '"'){
      literal += this.currentChar();
      this.advance();
    }
    if (this.currentChar() !== '"') throw new LexicalError("Unterminated string literal", startLine, startColumn);
    this.advance();
    return {literal, line: startLine, column: startColumn};
  }

  private addToken(type: Token["type"], value: string, line: number = this.line, column: number = this.column): void{
    this.tokens.push({ type, value , line, column});
  }


  private currentChar(): string{
    return this.text[this.cursor];
  } 

  private advance(): void{
    if (this.cursor < this.text.length) {
      if (this.currentChar() === "\n"){
        this.line++;
        this.column = 1;
      }
      else{
        this.column++;
      }
      this.cursor++;
    }
  }

  private peek(amount: number = 1): string | null{
    if (this.cursor + amount >= this.text.length) return null;
    return this.text[this.cursor + amount];
  }



}

