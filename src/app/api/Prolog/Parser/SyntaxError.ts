import { Token } from "../Lexer/Token";

export class SyntaxError extends Error {
    constructor(message: string, public readonly token: Token | null) {
      super(message + (
        token!=null ? 
        (((token.type == "EOF")?" End of File":" " + token.type) + " at line " + token.line + " column " + token.column)
        : ''
        )
      )
      this.name = "SyntaxError";
    }
}