import { ASTNode } from "../AST/Nodes/ASTNode";

export function isLiteralValue(node: ASTNode | LiteralValue): node is LiteralValue{
  return node instanceof LiteralValue;
}

export class LiteralValue{
  constructor(public readonly value: string | number | boolean){}

  public to_string(): string{
    return this.value.toString();
  }

  public to_string_display(): string{
    return this.to_string();
  }

  public to_string_debug(): string{
    return this.to_string();
  }

  public equals(other: LiteralValue): boolean{
    return this.value === other.value;
  }

  public add(other: LiteralValue): LiteralValue{
    if (typeof this.value === "number" && typeof other.value === "number"){
      return new LiteralValue(this.value + other.value);
    }
    if (typeof this.value === "string" && typeof other.value === "string"){
      return new LiteralValue(this.value + other.value);
    }
    throw new Error(`Cannot add ${this.value} and ${other.value}`);
  }

  public subtract(other: LiteralValue): LiteralValue{
    if (typeof this.value === "number" && typeof other.value === "number"){
      return new LiteralValue(this.value - other.value);
    }
    throw new Error(`Cannot subtract ${this.value} and ${other.value}`);
  }

  public multiply(other: LiteralValue): LiteralValue{
    if (typeof this.value === "number" && typeof other.value === "number"){
      return new LiteralValue(this.value * other.value);
    }
    throw new Error(`Cannot multiply ${this.value} and ${other.value}`);
  }

  public divide(other: LiteralValue): LiteralValue{
    if (typeof this.value === "number" && typeof other.value === "number"){
      return new LiteralValue(this.value / other.value);
    }
    throw new Error(`Cannot divide ${this.value} and ${other.value}`);
  }

  public power(other: LiteralValue): LiteralValue{
    if (typeof this.value === "number" && typeof other.value === "number"){
      return new LiteralValue(this.value ** other.value);
    }
    throw new Error(`Cannot raise ${this.value} to the power of ${other.value}`);
  }

  public negate(): LiteralValue{
    if (typeof this.value === "number"){
      return new LiteralValue(-this.value);
    }
    throw new Error(`Cannot negate ${this.value}`);
  }

  public and(other: LiteralValue): LiteralValue{
    if (typeof this.value === "boolean" && typeof other.value === "boolean"){
      return new LiteralValue(this.value && other.value);
    }
    throw new Error(`Cannot perform logical AND on ${this.value} and ${other.value}`);
  }

  public or(other: LiteralValue): LiteralValue{
    if (typeof this.value === "boolean" && typeof other.value === "boolean"){
      return new LiteralValue(this.value || other.value);
    }
    throw new Error(`Cannot perform logical OR on ${this.value} and ${other.value}`);
  }

  public isNumberLiteral(): boolean{
    return typeof this.value === "number";
  }

  public isStringLiteral(): boolean{
    return typeof this.value === "string";
  }

  public isBooleanLiteral(): boolean{
    return typeof this.value === "boolean";
  }

  public lessThan(other: LiteralValue): boolean {
    return this.isNumberLiteral() && other.isNumberLiteral() && this.value < other.value;
  }

  public greaterThan(other: LiteralValue): boolean {
    return this.isNumberLiteral() && other.isNumberLiteral() && this.value > other.value;
  }

  public lessThanOrEqual(other: LiteralValue): boolean {
    return this.isNumberLiteral() && other.isNumberLiteral() && this.value <= other.value;
  }

  public greaterThanOrEqual(other: LiteralValue): boolean {
    return this.isNumberLiteral() && other.isNumberLiteral() && this.value >= other.value;
  }
  
}