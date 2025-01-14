import { ASTNode } from "@/app/api/Prolog/AST/Nodes/ASTNode";
import { Constant } from "@/app/api/Prolog/AST/Nodes/Constant";
import { NumberLiteral } from "@/app/api/Prolog/AST/Nodes/NumberLiteral";
import { Prolog, SolveOptions } from "@/app/api/Prolog/Interface"
import { Unifier } from "@/app/api/Prolog/Interpreter/Unifier/Unifier";
import { isLiteralValue, LiteralValue } from "@/app/api/Prolog/Interpreter/LiteralValue";


function checkVariable(name: string, unifier: Map<string, string>, value: string){
  expect(unifier.has(name)).toBe(true);
  expect(unifier.get(name)).toBe(value);
}

function expectOneSolutionAndGetSingleUnifier(program: string, query: string, solveOptions?: SolveOptions): Map<string, string>{
  const prolog = new Prolog(program, query);
  const solutions = prolog.solve(solveOptions).solutions;
  expect(solutions.length).toBe(1);
  return solutions[0];
}

describe('Full Program Handling', () => {
  it('should handle a basic program', () => {
    const unifier = expectOneSolutionAndGetSingleUnifier(`
      a(X) :- b(X).
      b(X).
    `, `
      a(X).
    `);
    
    console.log(unifier);
    expect(unifier.size).toBe(0);
  });

  it('should find a simple substitution', () => {
    const unifier = expectOneSolutionAndGetSingleUnifier(`
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
  
    const unifier = expectOneSolutionAndGetSingleUnifier(program, query);

    checkVariable('X', unifier, '1');
  })

  it('should solve simple member program', () => {
    const program = `
      member(X, [X|T]).
      member(X, [H|T]) :- member(X, T).
    `;

    const query = `
      member(1, [1, 2, 3]).
    `;

    const unifier = expectOneSolutionAndGetSingleUnifier(program, query);

    expect(unifier.size).toBe(0);
  })

  it('should solve simple program with member and is and find substitution', () => {
    const program = `
      member1(X, [X|T]) :- X is 1.
      member1(X, [H|T]) :- member1(X, T).
    `;

    const query = `
      member1(X, [1, 2, 3]).
    `;

    const unifier = expectOneSolutionAndGetSingleUnifier(program, query);

    checkVariable('X', unifier, '1');
  })
  
})