import { ASTNode } from "../AST/Nodes/ASTNode";
import { BinOp } from "../AST/Nodes/BinOp";
import { Clause } from "../AST/Nodes/Clause";
import { Constant } from "../AST/Nodes/Constant";
import { Cut } from "../AST/Nodes/Cut";
import { Functor } from "../AST/Nodes/Functor";
import { EmptyList, NonEmptyList } from "../AST/Nodes/List";
import { NumberLiteral } from "../AST/Nodes/NumberLiteral";
import { StringLiteral } from "../AST/Nodes/StringLiteral";
import { UnOp } from "../AST/Nodes/UnOp";
import { Variable } from "../AST/Nodes/Variable";
import { NodeType } from "../AST/NodeTypes";
import { Token, TokenType } from "../Lexer/Token";
import { ASTVisitor } from "./ASTVisitors/Visitor";
import { isLiteralValue, LiteralValue } from "./LiteralValue";

export class UndefinedVariableError extends Error{
  constructor(variable: Variable){
    super(`Undefined Variable ${variable.name} at ${variable.token.line}:${variable.token.column}`);
  }
}

export class InvalidOperationError extends Error{
  constructor(operatorToken: Token, left: LiteralValue | null, right: LiteralValue){
    super(`Invalid operation ${left? left : ''}${operatorToken.value}${right} at ${operatorToken.line}:${operatorToken.column}`);
  }
}

export class CannotEvaluateError extends Error{
  constructor(nodeType: NodeType, token?: Token){
    super(`Cannot evaluate ${nodeType}` + ( (token)? ` at ${token.line}:${token.column}` : '' ));
  }
}


/**
 * 
 * @param node The node to evaluate
 * @throws {UndefinedVariableError} If a variable is not defined
 * @throws {InvalidOperationError} If an operation is invalid
 * @throws {CannotEvaluateError} If the node cannot be evaluated
 * @returns {string | number | boolean} The value of the node
 */
export function evaluate(node: ASTNode | LiteralValue): LiteralValue{
  if (isLiteralValue(node)){
    return node;
  }
  return new Evaluator(node).evaluate();
}

class Evaluator extends ASTVisitor<LiteralValue>{
  constructor(private readonly node: ASTNode){
    super();
  }

  public evaluate(): LiteralValue{
    return this.visit(this.node);
  }

  public visitBinOp(node: BinOp): LiteralValue {
    const left = isLiteralValue(node.left) ? node.left : this.visit(node.left);
    const right = isLiteralValue(node.right) ? node.right : this.visit(node.right);

    switch(node.operatorToken.type){
      case TokenType.PLUS:
        if (left.isNumberLiteral() && right.isNumberLiteral()){
          return left.add(right);
        }
        if (left.isStringLiteral() && right.isStringLiteral()){
          return left.add(right);
        }
      case TokenType.MINUS:
        if (left.isNumberLiteral() && right.isNumberLiteral()){
          return left.subtract(right);
        }
      case TokenType.TIMES:
        if (left.isNumberLiteral() && right.isNumberLiteral()){
          return left.multiply(right);
        }
      case TokenType.DIVIDE:
        if (left.isNumberLiteral() && right.isNumberLiteral()){
          return left.divide(right);
        }
      case TokenType.POWER:
        if (left.isNumberLiteral() && right.isNumberLiteral()){
          return left.power(right);
        }
      case TokenType.LOGICAL_AND:
        if (left.isBooleanLiteral() && right.isBooleanLiteral()){
          return left.and(right);
        }
      case TokenType.LOGICAL_OR:
        if (left.isBooleanLiteral() && right.isBooleanLiteral()){
          return left.or(right);
        }
      default:
        throw new InvalidOperationError(node.operatorToken, left, right);
    }
  }

  public visitClause(node: Clause): LiteralValue {
    throw new CannotEvaluateError(NodeType.Clause, node.impliesToken);
  }

  public visitConstant(node: Constant): LiteralValue {
    throw new CannotEvaluateError(NodeType.Constant, node.token);
  }

  public visitCut(node: Cut): LiteralValue {
    throw new CannotEvaluateError(NodeType.Cut, node.bangToken);
  }

  public visitEmptyList(_node: EmptyList): LiteralValue {
    throw new CannotEvaluateError(NodeType.EmptyList);
  }

  public visitNonEmptyList(_node: NonEmptyList): LiteralValue {
    throw new CannotEvaluateError(NodeType.NonEmptyList);
  }

  public visitFunctor(node: Functor): LiteralValue {
    throw new CannotEvaluateError(NodeType.Functor, node.nameToken);
  }

  public visitNumberLiteral(node: NumberLiteral): LiteralValue {
    return new LiteralValue(node.value);
  }

  public visitStringLiteral(node: StringLiteral): LiteralValue {
    return new LiteralValue(node.value);
  }

  public visitUnOp(node: UnOp): LiteralValue {
    const value = isLiteralValue(node.operand) ? node.operand : this.visit(node.operand);

    switch(node.operatorToken.type){
      case TokenType.PLUS:
        if (value.isNumberLiteral()){
          return value;
        }
      case TokenType.MINUS:
        if (value.isNumberLiteral()){
          return value.negate();
        }
      default:
        throw new InvalidOperationError(node.operatorToken, null, value);
    }
  }

  public visitVariable(node: Variable): LiteralValue {
    throw new UndefinedVariableError(node);
  }
}