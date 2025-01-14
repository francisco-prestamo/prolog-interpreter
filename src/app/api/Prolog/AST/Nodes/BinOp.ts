import { Token } from "../../Lexer/Token";
import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { LiteralValue, isLiteralValue } from "../../Interpreter/LiteralValue";

export class BinOp extends ASTNode {
  constructor(
    public readonly left: ASTNode | LiteralValue,
    public readonly operatorToken: Token,
    public readonly right: ASTNode | LiteralValue
  ) {
    super(NodeType.BinOp);
  }

  public to_string_debug(): string {
    const leftRepresentation = isLiteralValue(this.left) ? this.left : (this.left as ASTNode).to_string_debug();
    const rightRepresentation = isLiteralValue(this.right) ? this.right : (this.right as ASTNode).to_string_debug();
    return `${this.operatorToken.value}(${leftRepresentation}, ${rightRepresentation})`;
  }

  public to_string_display(): string {
    const leftRepresentation = isLiteralValue(this.left) ? this.left : (this.left as ASTNode).to_string_display();
    const rightRepresentation = isLiteralValue(this.right) ? this.right : (this.right as ASTNode).to_string_display();
    return `${leftRepresentation} ${this.operatorToken.value} ${rightRepresentation}`;
  }

  public copy(identifier?: string, introducedBy?: string): BinOp {
    const left = isLiteralValue(this.left) ? this.left : (this.left as ASTNode).copy(identifier, introducedBy);
    const right = isLiteralValue(this.right) ? this.right : (this.right as ASTNode).copy(identifier, introducedBy);

    return new BinOp(left, this.operatorToken, right);
  }
}