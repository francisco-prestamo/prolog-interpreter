import { ASTNode } from "@/app/api/Prolog/AST/Nodes/ASTNode";
import { Constant } from "@/app/api/Prolog/AST/Nodes/Constant";
import { NumberLiteral } from "@/app/api/Prolog/AST/Nodes/NumberLiteral";
import { Prolog, SolveOptions } from "@/app/api/Prolog/Interface"
import { Unifier } from "@/app/api/Prolog/Interpreter/Unifier/Unifier";
import { isLiteralValue, LiteralValue } from "@/app/api/Prolog/Interpreter/LiteralValue";


function checkVariable(name: string, unifier: Record<string, string>, value: string){
  expect(unifier[name]).not.toBe(undefined);
  expect(unifier[name]).toBe(value);
}

function expectOneSolutionAndGetSingleUnifier(program: string, query: string, solveOptions?: SolveOptions): Record<string, string>{
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
    expect(Object.values(unifier).length).toBe(0);
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

    expect(Object.values(unifier).length).toBe(0);
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

  it('should return only one solution', () => {
    const program = `
      member(X, [X | T]).
      member(X, [H | T]) :- member(X, T).
    `;

    const query = `member(1, [2, 3, 1, 4, 5]).`;

    const unifier = expectOneSolutionAndGetSingleUnifier(program, query);
  })

  it('should solve the "TC" set B', () => {
    const program = `
      a(X, [], [X]).
      a(X, [Y | L], [Y | R]) :- a(X, L, R).

      r([], []).
      r([X | Y], R) :- r(Y, Z), a(X, Z, R).

      m(X, [X | T]).
      m(X, [H | Y]) :- m(X, Y).
    `;

    const query = `m(X, [4, 3]), r([1, 2, X], [3, Y, Z]).`;

    const unifier = expectOneSolutionAndGetSingleUnifier(program, query);

    checkVariable('X', unifier, '3');
    checkVariable('Y', unifier, '2');
    checkVariable('Z', unifier, '1');
  })
  
})