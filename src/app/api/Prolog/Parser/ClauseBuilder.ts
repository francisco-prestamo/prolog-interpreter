import { ASTNode } from "../AST/Nodes/ASTNode";
import { BinOp } from "../AST/Nodes/BinOp";
import { Clause } from "../AST/Nodes/Clause";
import { Cut } from "../AST/Nodes/Cut";
import { Functor } from "../AST/Nodes/Functor";
import { NodeType } from "../AST/NodeTypes";
import { Subclause } from "../AST/Nodes/Subclause";
import { TokenType } from "../Lexer/Token";
import { SyntaxError } from "./SyntaxError";
import { isLiteralValue, LiteralValue } from "../Interpreter/Evaluator";

export function extractClausePossibilities(node: ASTNode): Clause[]{
  if (node.type == NodeType.BinOp){
    const binOp = node as BinOp;
  
    if (binOp.operatorToken.type != TokenType.IMPLIES)
      throw new SyntaxError(`Expected outermost operator to be ${TokenType.IMPLIES}`,binOp.operatorToken);

    if (isLiteralValue(binOp.left)){
      throw Error("Unexpected Literal");
    }
    if (binOp.left.type != NodeType.Functor)
      throw new SyntaxError("Expected left side of clause to be a functor", binOp.operatorToken);

    if (isLiteralValue(binOp.right)){
      throw Error("Unexpected Literal");
    }
    const possibilities = extractSubclauses(binOp.right);
    return possibilities.map(pos => new Clause(binOp.left as Functor, binOp.operatorToken, pos));
  }
  else if (node.type == NodeType.Functor){
    return [new Clause(node as Functor, (node as Functor).nameToken, [])];
  }
  else {
    throw new SyntaxError("Expected clause to be a functor or a rule", null);
  }
}

export function extractSubclauses(node: ASTNode | LiteralValue): Subclause[][]{
  if (isLiteralValue(node)){
    throw new Error("Unexpected Literal");
  }
  // we want functors, cuts, or conjunctions or disjunctions of functors
  
  switch(node.type){
    case NodeType.Functor:
      return [[(node as Functor)]];
    case NodeType.Cut:
      return [[(node as Cut)]];
    case NodeType.BinOp:
      const binOp = node as BinOp;
      if (binOp.operatorToken.type == TokenType.COMMA){
        const possibilities: Subclause[][] = [];
        for (const possibilityLeft of extractSubclauses(binOp.left)){
          for (const possibilityRight of extractSubclauses(binOp.right)){
            possibilities.push([...possibilityLeft, ...possibilityRight]);
          }
        }
        return possibilities;
      }
      else if (binOp.operatorToken.type == TokenType.SEMICOLON){
        const left = extractSubclauses(binOp.left);
        const right = extractSubclauses(binOp.right);

        return [...left, ...right];
      }
    default:
      throw new SyntaxError(`Expected subclause to be a functor, cut, or a conjunction or disjunction of functors, got ${node.to_string_debug()} instead`, null);
  }
}