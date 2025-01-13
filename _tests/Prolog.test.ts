import { ASTNode } from "@/app/api/Prolog/AST/Nodes/ASTNode";
import { Constant } from "@/app/api/Prolog/AST/Nodes/Constant";
import { NumberLiteral } from "@/app/api/Prolog/AST/Nodes/NumberLiteral";
import { Prolog } from "@/app/api/Prolog/Interface"
import { isLiteralValue, LiteralValue } from "@/app/api/Prolog/Interpreter/Evaluator";
import { Unifier } from "@/app/api/Prolog/Interpreter/Unifier";

function checkVariable(name: string, unifier: Unifier, value: string){
  const node = unifier.getResolved(name);
  expect(node).not.toBeNull();
  if (isLiteralValue(node!)){
    expect(String(node as LiteralValue)).toBe(value);
  }
  expect((node as ASTNode)!.to_string_display()).toBe(value);
}

function getSingleUnifier(program: string, query: string): Unifier{
  const prolog = new Prolog(program, query);
  const solutions = prolog.solve().solutions;
  expect(solutions.length).toBe(1);
  return solutions[0];
}

describe('Full Program Handling', () => {
  it('should handle a basic program', () => {
    const unifier = getSingleUnifier(`
      a(X) :- b(X).
      b(X).
    `, `
      a(X).
    `);

    expect(unifier.is_empty()).toBe(true);
  });

  it('should find a simple substitution', () => {
    const unifier = getSingleUnifier(`
      a(1).
    `, `
      a(X).
    `);

    checkVariable('X', unifier, '1');
  });

  it('should find a correct substitution for a simple program', () => {
    const program = `
      a(X) :- b(X).
      b(1).
    `;

    const query = `
      a(X).
    `;
  
    const unifier = getSingleUnifier(program, query);

    checkVariable('X', unifier, '1');
  })
  
})