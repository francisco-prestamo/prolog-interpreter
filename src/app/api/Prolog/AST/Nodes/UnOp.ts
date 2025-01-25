import { ASTNode } from "./ASTNode";
import { NodeType } from "../NodeTypes";
import { Token } from "../../Lexer/Token";
import { LiteralValue, isLiteralValue } from "../../Interpreter/LiteralValue";

export class UnOp extends ASTNode{
  constructor(public readonly operatorToken: Token, public readonly operand: ASTNode | LiteralValue) {
    super(NodeType.UnOp)
  }

  public to_string_debug(): string {
    if (isLiteralValue(this.operand)) {
      return `${this.operatorToken.value}(${this.operand})`;
    }
    const operand = this.operand as ASTNode;
    return `${this.operatorToken.value}(${operand.to_string_debug()})`;
  }

  public copy(identifier?: string, introducedBy?: string): UnOp {
    if (isLiteralValue(this.operand)) {
      return new UnOp(this.operatorToken, this.operand);
    }
    const operand = this.operand as ASTNode;
    return new UnOp(this.operatorToken, operand.copy(identifier, introducedBy));
  }

  public to_string_display(): string {
    if (isLiteralValue(this.operand)) {
      return `${this.operatorToken.value}${this.operand}`;
    }
    const operand = this.operand as ASTNode;
    return `${this.operatorToken.value}${operand.to_string_display()}`;
  }
  public setIntroducedBy(introducedBy: string): void {
    if (!isLiteralValue(this.operand)) {
      (this.operand as ASTNode).setIntroducedBy(introducedBy);
    }
  }
}