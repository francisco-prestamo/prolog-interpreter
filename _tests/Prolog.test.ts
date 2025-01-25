import { Prolog, SolveOptions } from "@/app/api/Prolog/Interface"


function checkVariable(name: string, unifier: Record<string, string>, value: string){
  expect(unifier[name]).not.toBe(undefined);
  expect(unifier[name]).toBe(value);
}

function expectOneSolutionAndGetSingleUnifier(program: string, query: string, solveOptions?: SolveOptions): Record<string, string>{
  const prolog = new Prolog(program, query);
  const solution = prolog.solve(solveOptions);
  expect(solution.errors).toBe(undefined);
  expect(solution.solutions.length).toBe(1);
  return solution.solutions[0];
}

function expectNoSolutions(program: string, query: string, solveOptions?: SolveOptions){
  const prolog = new Prolog(program, query);
  const solutions = prolog.solve(solveOptions).solutions;
  expect(solutions.length).toBe(0);
}

function expectErrors(program: string, query: string, solveOptions?: SolveOptions): string[]{
  const prolog = new Prolog(program, query);
  const solution = prolog.solve(solveOptions);

  expect(solution.errors).toBeDefined();
  expect(solution.errors?.length).toBeGreaterThan(0);
  
  return solution.errors!;
}

describe('Full Program Handling', () => {
  it('should handle a basic program', () => {
    const unifier = expectOneSolutionAndGetSingleUnifier(`
      a(X) :- b(X).
      b(X).
    `, `
      a(X).
    `);
    
    // console.log(unifier);
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


  it('should solve fibonacci', () => {
    const program = `
      fib(0, 1).
      fib(1, 1).
      fib(N, F) :- N > 1, N1 is N - 1, N2 is N - 2, fib(N1, F1), fib(N2, F2), F is F1 + F2.
    `;

    const query = `fib(5, X).`;

    const unifier = expectOneSolutionAndGetSingleUnifier(program, query);

    checkVariable('X', unifier, '8');
  })

  it('should solve base case of concat', () => {
    const program = `
      concat ([], L, L).
    `

    const query = `concat([], A, [1, 2]).`;

    const u = expectOneSolutionAndGetSingleUnifier(program, query)

    checkVariable('A', u, '[1, 2]');
  })

  it('should solve concat', () => {
    const program = `
      concat([], L, L).
      concat([H | T], L, [H | R]) :- concat(T, L, R).
    `;

    const query = `concat([1, 2, 3, 4, 5, 6], [3, 4, 5], X).`;

    const unifier = expectOneSolutionAndGetSingleUnifier(program, query);

    checkVariable('X', unifier, '[1, 2, 3, 4, 5, 6, 3, 4, 5]');
  
  })

  it('should handle less than inequality', () => {
    const program = `lessThan3(X) :- X < 3.`;
    const query1 = `lessThan3(1).`;
    const query2 = `lessThan3(3).`;

    const u = expectOneSolutionAndGetSingleUnifier(program, query1);
    expect(Object.values(u).length).toBe(0);

    expectNoSolutions(program, query2);
  })

  it('should handle less than or equal to inequality', () => {
    const program = `lessThan3(X) :- X =< 3.`;
    const query1 = `lessThan3(1).`;
    const query2 = `lessThan3(3).`;
    const query3 = `lessThan3(4).`;

    const u = expectOneSolutionAndGetSingleUnifier(program, query1);
    expect(Object.values(u).length).toBe(0);

    const u2 = expectOneSolutionAndGetSingleUnifier(program, query2);
    expect(Object.values(u2).length).toBe(0);

    expectNoSolutions(program, query3);

  });

  it('should handle greater than inequality', () => {
    const program = `greaterThan3(X) :- X > 3.`;
    const query1 = `greaterThan3(4).`;
    const query2 = `greaterThan3(3).`;

    const u = expectOneSolutionAndGetSingleUnifier(program, query1);
    expect(Object.values(u).length).toBe(0);

    expectNoSolutions(program, query2);
  })

  it('should handle greater than or equal to inequality', () => {
    const program = `greaterThan3(X) :- X >= 3.`;
    const query1 = `greaterThan3(4).`;
    const query2 = `greaterThan3(3).`;
    const query3 = `greaterThan3(2).`;

    const u = expectOneSolutionAndGetSingleUnifier(program, query1);
    expect(Object.values(u).length).toBe(0);

    const u2 = expectOneSolutionAndGetSingleUnifier(program, query2);
    expect(Object.values(u2).length).toBe(0);

    expectNoSolutions(program, query3);
  })

  it('should throw SemanticError when defining list as subclause', () => {
    const program = `
      p(2) :- !.
      p(X) :- [X | T].
    `

    const query1 = `p(1).`;
    const query2 = `p(2).`;

    const e = expectErrors(program, query1);
    expect(e.some(e => e.includes('Semantic'))).toBe(true);
    const u = expectOneSolutionAndGetSingleUnifier(program, query2);

    expect(Object.values(u).length).toBe(0);
  })

  it('should solve recursive case of concat', () => {
    const program = `
      concat([], L, L).
      concat([H | T], L, [H | R]) :- concat(T, L, R).
    `;

    const query = `concat([2], [3, 4], X).`;

    const unifier = expectOneSolutionAndGetSingleUnifier(program, query);

    checkVariable('X', unifier, '[2, 3, 4]');
  });

  it('should collapse transitive substitutions', () => {
    const program = ``;

    const query1 = `A = [1, B], B = 3.`;
    const query2 = `B = 3, A = [1, B].`;

    const u1 = expectOneSolutionAndGetSingleUnifier(program, query1);
    checkVariable('A', u1, '[1, 3]');

    const u2 = expectOneSolutionAndGetSingleUnifier(program, query2);
    checkVariable('A', u2, '[1, 3]');
  
  
  })

  it('should collapse long transitive substitutions', () => {
    const program = ``;

    const query1 = `A = [1 | B], B = [2 | C], C = [3 | D], D = [4 | E], E = [5].`;

    const u1 = expectOneSolutionAndGetSingleUnifier(program, query1);
    checkVariable('A', u1, '[1, 2, 3, 4, 5]');

  });

  it('should collapse transitive substitutions at the interpreter level', () => {
    const program = ``;

    const query1 = `C = 3, A = [1 | B], B = [1 | C].`;

    const e = expectErrors(program, query1);
    expect(e.some(e => e.toLowerCase().includes('tail'))).toBe(true);

  });

  it('should find transitive substitution in single step', () => {
    const program = `
      a(A, A, B, B, C, C).
    `;

    const query = `a(A, B, B, [1 , C], C, 3).`;

    const unifier = expectOneSolutionAndGetSingleUnifier(program, query);

    checkVariable('A', unifier, '[1, 3]');
    checkVariable('B', unifier, '[1, 3]');
    checkVariable('C', unifier, '3');
  })

  it('should safely detect simple recursive definition', () => {
    const program = ``;
    
    const query1 = `A = [1 | A], A is 3.`;
    const query2 = `A is 3, A = [1 | A].`;

    expectNoSolutions(program, query1);
    expectNoSolutions(program, query2);
  })

  it('should safely capture recursive type definitions in single step', () => {
    const program = `
      a(A, A, B, B, C, C, D, D).
    `;

    const query = `a(A, B, B, [1, C], C, A, A, 3).`;

    expectNoSolutions(program, query);
  })

  it('should find 6 permutations in p program', () => {
    const program = `
      d(X, [X | R], R).
      d(X, [Y | R1], [Y | R2]) :- d(X, R1, R2).

      p([], []).
      p(X, [Y | L1]) :- d(Y, X, L2), p(L2, L1).
    `

    const query = `p([1, 2, 3], X).`;

    const solutions = new Prolog(program, query).solve().solutions;
    expect(solutions.length).toBe(6);
  })

  it('should solve the "TC" set A', () => {
    const program = `
      fst(X, Y, Z, [X, Y, Z]).

      n(X) :- X, !, fail.
      n(_).
      
      d(X, [X | R], R).
      d(X, [Y | R1], [Y | R2]) :- d(X, R1, R2).

      p([], []).
      p(X, [Y | L1]) :- d(Y, X, L2), p(L2, L1).
    `;

    const query = `p([1, 2, 3], R), fst(X, Y, Z, R), n(X >= Y), !, Y =< Z + 1.`;

    const unifier = expectOneSolutionAndGetSingleUnifier(program, query);
    
    checkVariable('X', unifier, '1');
    checkVariable('Y', unifier, '2');
    checkVariable('Z', unifier, '3');
    checkVariable('R', unifier, '[1, 2, 3]');
  })
})

// describe('Non Passing Tests', () => {
//  
// });

// ... :)