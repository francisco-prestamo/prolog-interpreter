import { ASTNode } from "../../AST/Nodes/ASTNode";
import { BinOp } from "../../AST/Nodes/BinOp";
import { Clause } from "../../AST/Nodes/Clause";
import { Cut } from "../../AST/Nodes/Cut";
import { Functor } from "../../AST/Nodes/Functor";
import { EmptyList, NonEmptyList } from "../../AST/Nodes/List";
import { NumberLiteral } from "../../AST/Nodes/NumberLiteral";
import { StringLiteral } from "../../AST/Nodes/StringLiteral";
import { Underscore } from "../../AST/Nodes/Underscore";
import { UnOp } from "../../AST/Nodes/UnOp";
import { Variable } from "../../AST/Nodes/Variable";
import { NodeType } from "../../AST/NodeTypes";
import { ASTVisitor } from "../ASTVisitors/Visitor";
import { isLiteralValue, LiteralValue } from "../LiteralValue";
import { Unifier } from "./Unifier";

export class RecursiveTypeError extends Error {
  constructor(variableName: string){
    super(`Variable ${variableName} is involved in a recursive type definition.`);
  }
}

export class NonListTail extends Error {
  constructor(){
    super(`List tails can only be lists or variables.`);
  }
}


/**
 * 
 * @param node The node to resolve
 * @param mapping The mapping of variables to their resolutions
 * @throws {RecursiveTypeError} If a variable is involved in a recursive type definition
 * @returns The resolved node
 */
export function resolve(node: ASTNode, unifier: Unifier): ASTNode | LiteralValue {
  return new Resolver(unifier).resolve(node);
}

class Resolver extends ASTVisitor<ASTNode | LiteralValue>{
  constructor(private readonly unifier: Unifier){
    super();
  }

  private visitedVariables = new Set<string>();

  public resolve(node: ASTNode | LiteralValue): ASTNode | LiteralValue {
    if (isLiteralValue(node)){
      return node;
    }
    if (node.type == NodeType.Variable){
      const variable = node as Variable;
      if (this.visitedVariables.has(variable.name)){
        throw new RecursiveTypeError(variable.name);
      }
      this.visitedVariables.add(variable.name);
    }
    return this.visit(node);
  }

  visitBinOp(node: BinOp): ASTNode | LiteralValue {
    return new BinOp(this.resolve(node.left), node.operatorToken, this.resolve(node.right));   
  }

  visitClause(_node: Clause): ASTNode | LiteralValue {
    throw new Error("Cannot Resolve Clause");
  }

  visitVariable(node: Variable): ASTNode | LiteralValue {
    if (this.unifier.has(node.name)){
      return this.unifier.apply(node);
    }
    return node;
  }


  visitCut(node: Cut): ASTNode | LiteralValue {
    return node;
  }
  
  visitEmptyList(node: EmptyList): ASTNode | LiteralValue {
    return node;
  }

  visitFunctor(node: Functor): ASTNode | LiteralValue {
    return new Functor(node.nameToken, node.args.map(arg => this.resolve(arg)), null);
  }

  visitNonEmptyList(node: NonEmptyList): ASTNode | LiteralValue {
    const tail = this.resolve(node.tail);
    if (isLiteralValue(tail) || [NodeType.EmptyList, NodeType.NonEmptyList, NodeType.Variable, NodeType.Underscore].includes(tail.type) == false){
      throw new NonListTail();
    }
    return new NonEmptyList(this.resolve(node.head), tail);
  }

  visitNumberLiteral(node: NumberLiteral): ASTNode | LiteralValue {
    return node;
  }

  visitStringLiteral(node: StringLiteral): ASTNode | LiteralValue {
    return node;
  }

  visitUnOp(node: UnOp): ASTNode | LiteralValue {
    return new UnOp(node.operatorToken, this.resolve(node.operand));
  }

  visitUnderscore(node: Underscore): ASTNode | LiteralValue {
    return node;
  }
}