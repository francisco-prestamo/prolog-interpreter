import { ASTNode } from "../../AST/Nodes/ASTNode";
import { UnifierBuilder } from "./UnifierBuilder";
import { LiteralValue } from "../LiteralValue";
import { Unifier } from "./Unifier";
import { RecursiveTypeError } from "./Resolver";

/**
 * @returns {Unifier | null} The unifier if the nodes can be unified, null otherwise
 */
export function getUnifier(nodeA: ASTNode | LiteralValue, nodeB: ASTNode | LiteralValue): Unifier | null {
  let unifierBuilder: UnifierBuilder;
  
  try {
    unifierBuilder = new UnifierBuilder(nodeA, nodeB);
  }
  catch (error){
    if (error instanceof RecursiveTypeError){
      return null;
    }
    else{
      throw error;
    }
  }

  if (!unifierBuilder.could_unify){
    return null;
  }
  return unifierBuilder.unifier;
}

export function emptyUnifier(): Unifier{
  return new Unifier();
}