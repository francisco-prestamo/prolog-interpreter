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
import { ASTVisitor } from "./ASTVisitors/Visitor";

export class RecursiveTypeError extends Error {
  constructor(variableName: string){
    super(`Variable ${variableName} is involved in a recursive type definition.`);
  }
}

export function resolve(node: ASTNode, mapping: Map<string, ASTNode>): ASTNode {
  return new Resolver(mapping).resolve(node);
}

class Resolver extends ASTVisitor<ASTNode>{
  constructor(private readonly mapping: Map<string, ASTNode>){
    super();
  }

  private visitedVariables = new Set<string>();

  public resolve(node: ASTNode): ASTNode {
    if (node.type == NodeType.Variable){
      const variable = node as Variable;
      if (this.visitedVariables.has(variable.name)){
        throw new RecursiveTypeError(variable.name);
      }
      this.visitedVariables.add(variable.name);
    }
    return this.visit(node);
  }

  visitBinOp(node: BinOp): ASTNode {
    return new BinOp(this.visit(node.left), node.operatorToken, this.visit(node.right));   
  }

  visitClause(node: Clause): ASTNode {
    throw new Error("Cannot Resolve Clause");
  }

  visitVariable(node: Variable): ASTNode {
    if (this.mapping.has(node.name)){
      return this.resolve(this.mapping.get(node.name)!);
    }
    return node;
  }

  visitConstant(node: Constant): ASTNode {
    return node;
  }

  visitCut(node: Cut): ASTNode {
    return node;
  }
  
  visitEmptyList(node: EmptyList): ASTNode {
    return node;
  }

  visitFunctor(node: Functor): ASTNode {
    return new Functor(node.nameToken, node.args.map(arg => this.visit(arg)), null);
  }

  visitNonEmptyList(node: NonEmptyList): ASTNode {
    return new NonEmptyList(this.visit(node.head), this.visit(node.tail));
  }

  visitNumberLiteral(node: NumberLiteral): ASTNode {
    return node;
  }

  visitStringLiteral(node: StringLiteral): ASTNode {
    return node;
  }

  visitUnOp(node: UnOp): ASTNode {
    return new UnOp(node.operatorToken, this.visit(node.operand));
  }
}