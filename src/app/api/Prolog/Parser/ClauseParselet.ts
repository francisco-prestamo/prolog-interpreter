import { ASTNode } from "../AST/Nodes/ASTNode";
import { BinOp } from "../AST/Nodes/BinOp";
import { Clause } from "../AST/Nodes/Clause";
import { Cut } from "../AST/Nodes/Cut";
import { Functor } from "../AST/Nodes/Functor";
import { NodeType } from "../AST/NodeTypes";
import { Subclause } from "../AST/Nodes/Subclause";
import { Token, TokenType } from "../Lexer/Token";
import { SyntaxError } from "./SyntaxError";

const functor_like_operators = new Set<TokenType>();
functor_like_operators.add(TokenType.IS);
functor_like_operators.add(TokenType.LITERAL_EQUAL);
functor_like_operators.add(TokenType.SAME_VALUE_EQUAL);
functor_like_operators.add(TokenType.UNIFY);

functor_like_operators.add(TokenType.LESS_OR_EQUAL);
functor_like_operators.add(TokenType.GREATER_OR_EQUAL);
functor_like_operators.add(TokenType.GREATER_THAN);
functor_like_operators.add(TokenType.LESS_THAN);

function is_functor(token: Token){
  return functor_like_operators.has(token.type)
}

export function extractClause(node: ASTNode): Clause{
  if (node.type == NodeType.BinOp){
    const binOp = node as BinOp;
  
    if (binOp.operatorToken.type != TokenType.IMPLIES)
      throw new SyntaxError(`Expected outermost operator to be ${TokenType.IMPLIES}`,binOp.operatorToken);

    if (binOp.left.type != NodeType.Functor)
      throw new SyntaxError("Expected left side of clause to be a functor", binOp.operatorToken);

    if (binOp.right.type == NodeType.Functor){
      return new Clause(binOp.left as Functor, [binOp.right as Functor]);
    }
    else if (binOp.right.type == NodeType.BinOp){
      const subclauses = extractSubclauses(binOp.right as BinOp);
      return new Clause(binOp.left as Functor, subclauses);
    }
    else {
      throw new SyntaxError("Expected right side of clause to be a functor or a conjunction of functors", (node as BinOp).operatorToken);
    }
  }
  else if (node.type == NodeType.Functor){
    return new Clause(node as Functor, []);
  }
  else {
    throw new SyntaxError("Expected clause to be a functor or a rule", null);
  }
}

export function extractSubclauses(node: BinOp): Subclause[]{
  if (node.operatorToken.type != TokenType.COMMA && node.type != NodeType.Functor)
    throw new SyntaxError("Expected operator to be functor-like or comma", node.operatorToken);
  if (node.type == NodeType.Functor)
    return [node];

  let subclauses: Subclause[] = [];

  if (node.left.type == NodeType.Functor){
    subclauses.push(node.left as Functor);
  }
  else if (node.left.type == NodeType.Cut){
    subclauses.push(node.left as Cut);
  }
  else if (node.left.type == NodeType.BinOp){
    subclauses.push(...extractSubclauses(node.left as BinOp));
  }
  else {
    throw new SyntaxError("Expected left side of conjunction to be a functor or a conjunction of functors", node.operatorToken);
  }

  if (node.right.type == NodeType.Functor){
    subclauses.push(node.right as Functor);
  }
  else if (node.right.type == NodeType.Cut){
    subclauses.push(node.right as Cut);
  }
  else if (node.right.type == NodeType.BinOp){
    subclauses.push(...extractSubclauses(node.right as BinOp));
  }
  else {
    throw new SyntaxError("Expected right side of conjunction to be a functor or a conjunction of functors", node.operatorToken);
  }

  return subclauses;
}