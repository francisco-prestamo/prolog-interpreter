import { ALIAS_SEPARATOR, ASTNode } from "../../AST/Nodes/ASTNode";
import { NodeType } from "../../AST/NodeTypes";
import { Variable } from "../../AST/Nodes/Variable";
import { resolve } from "./Resolver";
import { isLiteralValue, LiteralValue } from "../LiteralValue";
import { DSU } from "../../Utils/dsu";
import { getUnifier } from "./GetUnifier";



export type VariableClass = DSU<string>;
export class Unifier {
  /**
   * Maps variable names to the AST nodes where they were first mentioned
   */
  private variableNodes = new Map<string, Variable>();
  /**
   * Represents sets of variables that have been successfully unified with each other
   */
  private variableClasses: VariableClass = new DSU<string>();
  /**
   * Maps variable class representatives to the variable name with the highest precedence in the class
   */
  private highestPrecedenceVariableOfClass: Map<string, string> = new Map<string, string>();
  /**
   * Maps variable names with the highest precedence in each class to the resolution of that class
   */
  private assignments = new Map<string, ASTNode | LiteralValue>();

  constructor(){
  }
  
  /**
   * 
   * @throws {Error} If unification fails
   */
  public assign(variable: Variable, value: ASTNode | LiteralValue){
    if (isLiteralValue(value)){
      this.assignToLiteral(variable, value);
    }
    else if (value.type == NodeType.Variable){
      this.assignToVariable(variable, value as Variable);
    }
    else {
      this.assignToNeitherVariableNorLiteral(variable, value);
    }
  }

  /**
   * 
   * @returns True if the assignment was successful, False otherwise
   */
  public tryAssign(variable: Variable, value: ASTNode | LiteralValue): boolean {
    try {
      this.assign(variable, value);
      return true;
    }
    catch (e){
      return false;
    }
  }

  /**
   * 
   * @throws {Error} If unification fails
   */
  private assignToVariable(a: Variable, b: Variable){
    let aClass = this.variableClasses.find(a.name);
    let bClass = this.variableClasses.find(b.name);

    // if they are not represented in the unifier, add them

    if (aClass === null){
      this.variableClasses.addElement(a.name);
      this.variableNodes.set(a.name, a);
      this.highestPrecedenceVariableOfClass.set(a.name, a.name);
      aClass = a.name;
    }

    if (bClass === null){
      this.variableClasses.addElement(b.name);
      this.variableNodes.set(b.name, b);
      this.highestPrecedenceVariableOfClass.set(b.name, b.name);
      bClass = b.name;
    }

    // if they are in the same class, return
    if (aClass == bClass) return;

    // if they are not in the same class, check if the classes have assignments
    // if both of the classes have assignments, unify the assignments
    if (this.assignments.has(aClass) && this.assignments.has(bClass)){
      const aAssignment = this.assignments.get(aClass)!;
      const bAssignment = this.assignments.get(bClass)!;

      const unifier = getUnifier(this.apply(aAssignment), this.apply(bAssignment));
      if (unifier === null){
        throw new Error("Cannot Unify " + aAssignment.to_string_display() + " and " + bAssignment.to_string_display());
      }

      this.joinVariableClasses(aClass, bClass, unifier.apply(aAssignment));
    }
    else {
      this.joinVariableClasses(aClass, bClass, null);
    }
  }

  /**
   * 
   * @summary Takes the representatives of two classes, joins them and maintains 
   * the highest precedence variable of the resulting class assigned to the previous 
   * resolution of whichever one is resolved, or a new one if provided, behaviour 
   * undefined if both variables are resolved
   * @param aClassRepresentative Representative of the first class
   * @param bClassRepresentative Representative of the second class
   * @param resolution Optional resolution to be assigned to the resulting class
   */
  private joinVariableClasses(
      aClassRepresentative: string, 
      bClassRepresentative: string, 
      resolution: ASTNode | LiteralValue | null)
    {

    const aClassHighestPrecedence = this.highestPrecedenceVariableOfClass.get(aClassRepresentative)!;
    this.highestPrecedenceVariableOfClass.delete(aClassRepresentative);
    
    const bClassHighestPrecedence = this.highestPrecedenceVariableOfClass.get(bClassRepresentative)!;
    this.highestPrecedenceVariableOfClass.delete(bClassRepresentative);

    if (resolution == null){
      resolution =
        this.assignments.get(aClassRepresentative) ?? 
        this.assignments.get(bClassRepresentative) ?? 
        null;
    }

    this.assignments.delete(bClassHighestPrecedence);
    this.assignments.delete(aClassHighestPrecedence);


    const highestPrecedenceVariable = 
      firstHasHigherPrecedence(aClassHighestPrecedence, bClassHighestPrecedence) ? 
      aClassHighestPrecedence : 
      bClassHighestPrecedence;

    const resultingClass = this.variableClasses.union(aClassRepresentative, bClassRepresentative);

    this.highestPrecedenceVariableOfClass.set(resultingClass, highestPrecedenceVariable);
    if (resolution !== null){
      this.assignments.set(resultingClass, resolution);
    }

  }

  /**
   * 
   * @throws {Error} If unification fails
   */
  private assignToLiteral(a: Variable, b: LiteralValue){
    let aClass = this.variableClasses.find(a.name);
    if (aClass === null){
      this.variableClasses.addElement(a.name);
      this.variableNodes.set(a.name, a);
      this.highestPrecedenceVariableOfClass.set(a.name, a.name);
      aClass = a.name;
    }

    const aClassHighestPrecedence = this.highestPrecedenceVariableOfClass.get(aClass)!;
    if (this.assignments.has(aClassHighestPrecedence)){
      const aAssignment = this.assignments.get(aClassHighestPrecedence)!;

      const unifier = getUnifier(this.apply(aAssignment), b);

      if (unifier === null){
        throw new Error("Cannot Unify " + aAssignment.to_string_display() + " and " + b.to_string());
      }

      // aAssignment can only be StringLiteral, NumberLiteral or LiteralValue with equal value to the one we're unifying
      // no need to do anything then
    }
    else {
      this.assignments.set(aClassHighestPrecedence, b);
    }
  }

  /**
   * 
   * @throws {Error} If unification fails
   */
  private assignToNeitherVariableNorLiteral(a: Variable, b: ASTNode){
    let aClass = this.variableClasses.find(a.name);

    if (aClass === null){
      this.variableClasses.addElement(a.name);
      this.variableNodes.set(a.name, a);
      this.highestPrecedenceVariableOfClass.set(a.name, a.name);
      aClass = a.name;
    }

    const aClassHighestPrecedence = this.highestPrecedenceVariableOfClass.get(aClass)!;
    const resolved_b = this.apply(b);

    if (this.assignments.has(aClassHighestPrecedence)){
      const aAssignment = this.assignments.get(aClassHighestPrecedence)!;

      const unifier = getUnifier(this.apply(aAssignment), resolved_b);

      if (unifier === null){
        throw new Error("Cannot Unify " + aAssignment.to_string_display() + " and " + resolved_b.to_string_display());
      }

      this.assignments.set(aClassHighestPrecedence, unifier.apply(aAssignment));
    }
    else {
      this.assignments.set(aClassHighestPrecedence, resolved_b);
    }
  }
  
  public apply(node: ASTNode | LiteralValue): ASTNode | LiteralValue {
    if (typeof node == "string"){
      const variable = this.variableNodes.get(node);
      if (variable === undefined) return node;
      return this.apply(variable);
    }
    if (isLiteralValue(node)) return node;
    if (node.type == NodeType.Variable){
      const variable = node as Variable;
      const variableClass = this.variableClasses.find(variable.name);

      if (variableClass === null) return variable;

      const highestPrecedenceVariable = this.highestPrecedenceVariableOfClass.get(variableClass)!;
      const resolution = this.assignments.get(highestPrecedenceVariable);
      if (resolution === undefined) return this.variableNodes.get(highestPrecedenceVariable)!;
      return resolution;
    }
    return resolve(node, this);
  }

  public resolveVariableName(variableName: string): ASTNode | LiteralValue | string {
    const variable = this.variableNodes.get(variableName);
    if (variable === undefined) return variableName;
    return this.apply(variable);
  }

  public has(variableName: string | Variable): boolean {
    if (typeof variableName != "string") 
      return this.variableClasses.hasElement(variableName.name);

    return this.variableClasses.hasElement(variableName);
  }

  public is_empty() {
    return this.assignments.size == 0 && this.variableClasses.fullyDisjoint;
  }

  public to_record(): Record<string, string> {
    const answ: Record<string, string> = {};
    for (const variableClassSet of this.variableClasses.getComponents()){
      const someVariable: string = variableClassSet.values().next().value!;
      const variableClassRepresentative = this.variableClasses.find(someVariable)!;
      const higherPrecedenceVariable = this.highestPrecedenceVariableOfClass.get(variableClassRepresentative)!;

      const isResolved = this.assignments.has(higherPrecedenceVariable);

      for (const variable of variableClassSet){
        if (!isResolved && variable === higherPrecedenceVariable) continue;

        answ[variable] = (isResolved ? this.assignments.get(higherPrecedenceVariable)!.to_string_display() : higherPrecedenceVariable);
      }
    }
    return answ;
  }
}

export function firstHasHigherPrecedence(a: string, b: string): boolean{
  if (a.includes(ALIAS_SEPARATOR) && !b.includes(ALIAS_SEPARATOR)){
    return false;
  }
  if (!a.includes(ALIAS_SEPARATOR) && b.includes(ALIAS_SEPARATOR)){
    return true;
  }
  return a < b ? true : false;
}

