export interface Token{
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export enum TokenType {
  COMMA = ",",
  SEMICOLON = ";",
  IS = "is",
  IMPLIES = ":-",
  LESS = "<",
  GREATER = ">",
  LESS_OR_EQUAL = "=<",
  GREATER_OR_EQUAL = ">=",
  SAME_VALUE_EQUAL = "=:=",
  LITERAL_EQUAL = "==",
  UNIFY = "=",
  PLUS = "+",
  MINUS = "-",
  TIMES = "*",
  DIVIDE = "/",
  POWER = "^",
  LOGICAL_OR = "\\/",
  LOGICAL_AND = "/\\",
  BANG = '!',

  LPAR = '(',
  RPAR = ')',
  LBRACKET = '[',
  RBRACKET = ']',

  DOT = '.',
  EOF = 'EOF',
  PIPE = '|',

  CONSTANT = 'constant',
  VARIABLE = 'variable',

  NUMBER_LITERAL = 'number_literal',
  STRING_LITERAL = 'string_literal',
}

const KeyWords = new Map<string, TokenType>()
KeyWords.set('is', TokenType.IS);

export {KeyWords}
