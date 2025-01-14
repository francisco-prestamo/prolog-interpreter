import { Clause } from "@/app/api/Prolog/AST/Nodes/Clause";
import { Subclause } from "@/app/api/Prolog/AST/Nodes/Subclause";
import { Parser } from "@/app/api/Prolog/Parser/Parser";

function parse(text: string): Clause[]{
  const parser = new Parser(text);

  return parser.parseClauses();
}

function parseQuery(text: string): Subclause[][]{
  const parser = new Parser(text);

  return parser.parseQuery();

}

describe('Parser Tests without disjunction', () => {
  it('should parse simple program correctly', () => {
    const clauses = parse(`
      foo(X) :- bar(X).
      bar(X) :- baz(X).
      baz(X) :- foo(X).
    `);

    expect(clauses.length).toBe(3);
  })

  it ('should parse clause with multiple subclauses correctly', () => {
    const clauses = parse(`
      foo(X) :- bar(X), baz(X).
    `);

    expect(clauses.length).toBe(1);
    expect(clauses[0].body.length).toBe(2);
  })

  it ('should parse clause with nested subclauses correctly', () => {
    const clauses = parse(`
      foo(X) :- bar(x), (fizz(X), (bax(X), bizz(X)), buzz(X)), buz(X).  
    `)
    
    expect(clauses.length).toBe(1);

    const clause = clauses[0];
    // console.log(clause.to_string_debug())

    expect(clause.body.length).toBe(6);
  })

  it('should throw error if two :- are found in a single clause', () => {
    expect(() => {
      parse(`
      foo(X) :- bar(X) :- baz(X).
      `);
    }).toThrow();
  })

  it('should throw error if file is not terminated with "."', () => {
    expect(() => {
      parse(`
      foo(X) :- bar(X)
      `);
    }).toThrow();
  })

  it('should parse clauses with subclauses separated by newlines correctly', () => {
    const clauses = parse(`
      foo(X) :- 
        bar(X),
        baz(X),
        fizz(X).
    `);

    expect(clauses.length).toBe(1);

    const clause = clauses[0];

    expect(clause.body.length).toBe(3);
  })

  it('should parse cuts as any other functor', () => {
    const clauses = parse(`
      foo(X) :- bar(X), !, baz(X).
    `);
    expect(clauses.length).toBe(1);

    const clause = clauses[0];

    expect(clause.body.length).toBe(3);
  })

  it('should parse query correctly', () => {
    const q = parseQuery(`
      foo(X).
    `);

    expect(q.length).toBe(1);
  })

  it('should parse query with multiple subclauses correctly', () => {
    const q = parseQuery(`
      foo(X), bar(X).
    `);

    expect(q.length).toBe(1);
    expect(q[0].length).toBe(2);
  })
})

describe('Parser Tests with disjunction', () => {
  it('should parse simple program with disjunction correctly', () => {
    const clauses = parse(`
      foo(X) :- bar(X); baz(X).
    `);

    expect(clauses.length).toBe(2);
    expect(clauses[0].body.length).toBe(1);
    expect(clauses[1].body.length).toBe(1);
  })

  it('should find all possibilities of program with disjunction', () => {
    const clauses = parse(`
      foo(X) :- ((a(X) ; b(X)) ; (c(X), d(X))) , (f(X) ; e(X)).  
    `)
    expect(clauses.length).toBe(6);
  })

  it ('should find all possibilities of program with deeply nested disjunction', () => {
    const clauses = parse(`
      foo(X) :- ((a(X) ; e(X)) ; ((b(X) , f(X)) ; (c(X) ; d(X)))).
    `)

    expect(clauses.length).toBe(5);
  })

  it ('should parse all possibilities of program with deeply nested disjuntion and conjunction', () => {
    const clauses = parse(`
      foo(X) :- ((a(X) ; e(X)) ; ((b(X) , f(X)) ; (c(X) ; d(X)))), (g(X) ; h(X)), ((i(X); j(X)), k(X)).
    `)
    // console.log(clauses.map(clause => clause.to_string_debug()));

    expect(clauses.length).toBe(20);
  });

  it('should parse member1 program correctly', () => {
    const clauses = parse(`
      member1(X, [X|T]) :- X is 1.
      member1(X, [H|T]) :- member1(X, T).
    `);

    expect(clauses.length).toBe(2);
  })
})