export interface NodePL{
  id: string,
  parentId?: string,
  type: PLNodeType,
  appliedClause: string | null;
  objective: string;
  unifier?: Record<string, string>;
  // unifierText: string;
  children: NodePL[];
}

export enum PLNodeType {
  InteriorNode = "InteriorNode",
  SuccessNode = "SuccessNode",
  FailureNode = "FailureNode",
  RootNode = "RootNode"
}