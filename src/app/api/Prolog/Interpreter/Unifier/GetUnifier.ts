import { ASTNode } from "../../AST/Nodes/ASTNode";
import { UnifierBuilder } from "./UnifierBuilder";
import { LiteralValue } from "../LiteralValue";
import { Unifier } from "./Unifier";
import { RecursiveTypeError } from "./Resolver";

/**
 * @returns {Unifier | null} The unifier if the nodes can be unified, null otherwise
 */
export function getUnifier(nodeA: ASTNode | LiteralValue, nodeB: ASTNode | LiteralValue): Unifier | null {
  
  try {
    const unifierBuilder = new UnifierBuilder(nodeA, nodeB);
    if (!unifierBuilder.could_unify){
      return null;
    }
    return unifierBuilder.unifier;
  }
  catch (error){
    if (error instanceof RecursiveTypeError){
      return null;
    }
    else{
      throw error;
    }
  }

  
}

export function emptyUnifier(): Unifier{
  return new Unifier();
}