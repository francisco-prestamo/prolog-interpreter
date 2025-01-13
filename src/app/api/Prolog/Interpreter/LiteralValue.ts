import { ASTNode } from "../AST/Nodes/ASTNode";

export function isLiteralValue(node: ASTNode | LiteralValue): node is LiteralValue{
  return node instanceof LiteralValue;
}

export class LiteralValue{
  constructor(public readonly literalValue: string | number | boolean){}

  public to_string(): string{
    return this.literalValue.toString();
  }

  public add(other: LiteralValue): LiteralValue{
    if (typeof this.literalValue === "number" && typeof other.literalValue === "number"){
      return new LiteralValue(this.literalValue + other.literalValue);
    }
    if (typeof this.literalValue === "string" && typeof other.literalValue === "string"){
      return new LiteralValue(this.literalValue + other.literalValue);
    }
    throw new Error(`Cannot add ${this.literalValue} and ${other.literalValue}`);
  }

  public subtract(other: LiteralValue): LiteralValue{
    if (typeof this.literalValue === "number" && typeof other.literalValue === "number"){
      return new LiteralValue(this.literalValue - other.literalValue);
    }
    throw new Error(`Cannot subtract ${this.literalValue} and ${other.literalValue}`);
  }

  public multiply(other: LiteralValue): LiteralValue{
    if (typeof this.literalValue === "number" && typeof other.literalValue === "number"){
      return new LiteralValue(this.literalValue * other.literalValue);
    }
    throw new Error(`Cannot multiply ${this.literalValue} and ${other.literalValue}`);
  }

  public divide(other: LiteralValue): LiteralValue{
    if (typeof this.literalValue === "number" && typeof other.literalValue === "number"){
      return new LiteralValue(this.literalValue / other.literalValue);
    }
    throw new Error(`Cannot divide ${this.literalValue} and ${other.literalValue}`);
  }

  public power(other: LiteralValue): LiteralValue{
    if (typeof this.literalValue === "number" && typeof other.literalValue === "number"){
      return new LiteralValue(this.literalValue ** other.literalValue);
    }
    throw new Error(`Cannot raise ${this.literalValue} to the power of ${other.literalValue}`);
  }

  public negate(): LiteralValue{
    if (typeof this.literalValue === "number"){
      return new LiteralValue(-this.literalValue);
    }
    throw new Error(`Cannot negate ${this.literalValue}`);
  }

  public and(other: LiteralValue): LiteralValue{
    if (typeof this.literalValue === "boolean" && typeof other.literalValue === "boolean"){
      return new LiteralValue(this.literalValue && other.literalValue);
    }
    throw new Error(`Cannot perform logical AND on ${this.literalValue} and ${other.literalValue}`);
  }

  public or(other: LiteralValue): LiteralValue{
    if (typeof this.literalValue === "boolean" && typeof other.literalValue === "boolean"){
      return new LiteralValue(this.literalValue || other.literalValue);
    }
    throw new Error(`Cannot perform logical OR on ${this.literalValue} and ${other.literalValue}`);
  }

  public isNumberLiteral(): boolean{
    return typeof this.literalValue === "number";
  }

  public isStringLiteral(): boolean{
    return typeof this.literalValue === "string";
  }

  public isBooleanLiteral(): boolean{
    return typeof this.literalValue === "boolean";
  }
  
}