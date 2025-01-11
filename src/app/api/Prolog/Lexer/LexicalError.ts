export default class LexicalError extends Error {
    constructor(message: string, public readonly line: number, public readonly column: number) {
      super(message + " at line " + line + " column " + column + ".");
      this.name = "LexicalError";
    }
}