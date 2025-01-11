import { Atom } from "./Atom";
import { List } from "./List";
import { NodeType } from "../NodeTypes";
import { NumberLiteral } from "./NumberLiteral";
import { StringLiteral } from "./StringLiteral";

export type Term = Atom | List | NumberLiteral | StringLiteral;

export const isVariable = (term: Term): boolean => term.type == NodeType.Variable

export const isList = (term: Term): boolean => term.type === NodeType.List;

export const isNumberLiteral = (term: Term): boolean => term.type === NodeType.NumberLiteral;

export const isStringLiteral = (term: Term): boolean => term.type === NodeType.StringLiteral;
