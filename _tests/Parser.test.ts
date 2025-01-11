import { Clause } from "@/app/api/Prolog/AST/Nodes/Clause";
import { Parser } from "@/app/api/Prolog/Parser/Parser";

function parse(text: string): Clause[]{
  const parser = new Parser(text);

  return parser.parseClauses();
}

describe('Parser Tests', () => {
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
    console.log(clause.to_string_debug())

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
})