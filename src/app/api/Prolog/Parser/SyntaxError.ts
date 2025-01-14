import { Token } from "../Lexer/Token";

export class SyntaxError extends Error {
    constructor(message: string, public readonly token: Token | null) {
      super(message + (
        token!=null ? 
        " at line " + token.line + " column " + token.column
        : ''
        )
      )
      this.name = "SyntaxError";
    }
}