import { Token } from "../Lexer/Token";

export class SyntaxError extends Error {
    constructor(message: string, public readonly token: Token | null) {
      super(`Syntax Error: ` + message + (
        token!=null ? 
        " " + token.value + " at line " + token.line + " column " + token.column
        : ''
        )
      )
    }
}