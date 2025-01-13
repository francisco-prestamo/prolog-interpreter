import { ASTNode } from "@/app/api/Prolog/AST/Nodes/ASTNode";
import { isLiteralValue } from "@/app/api/Prolog/Interpreter/Evaluator";
import { Unifier, unify } from "@/app/api/Prolog/Interpreter/Unifier";
import { Lexer } from "@/app/api/Prolog/Lexer/Lexer";
import { PrattParser } from "@/app/api/Prolog/Parser/PrattParser";

function unifyExpressions(expr1: string, expr2: string): Unifier | null{
  const node1 = parseExpression(expr1);
  const node2 = parseExpression(expr2);

  return unify(node1, node2);

}

function parseExpression(text: string): ASTNode{
  const lexer = new Lexer(text);
  return new PrattParser(lexer.getTokens()).parse();
}

function checkVariable(name: string, unifier: Unifier, value: string){
  const node = unifier.getResolved(name);
  expect(node).not.toBeNull();
  if (isLiteralValue(node!)){
    expect(String(node)).toBe(value);
  }
  expect((node as ASTNode).to_string_display()).toBe(value);
}


describe('Unifier Tests', () => {
  it('should unify simple assignment', () => {
    const unifier = unifyExpressions('X', '1');

    expect(unifier).not.toBeNull();

    expect(unifier!.getResolved('X')).not.toBeNull();

    const resolved = unifier!.getResolved('X')!;

    if (isLiteralValue(resolved)){
      throw new Error('Unexpected literal value');
    }

    expect(resolved.to_string_display()).toBe('1');
  })

  it('should unify simple assignment in reverse', () => {
    const unifier = unifyExpressions('1', 'X');

    expect(unifier).not.toBeNull();

    expect(unifier!.getResolved('X')).not.toBeNull();

    const resolved = unifier!.getResolved('X')!;

    if (isLiteralValue(resolved)){
      throw new Error('Unexpected literal value');
    }

    expect(resolved.to_string_display()).toBe('1');
  });

  it('should unify variables inside binops', () => {
    const unifier = unifyExpressions('X + 1', '2 + Y');

    expect(unifier).not.toBeNull();

    expect(unifier!.getResolved('X')).not.toBeNull();
    expect(unifier!.getResolved('Y')).not.toBeNull();

    const resolvedX = unifier!.getResolved('X')!;
    const resolvedY = unifier!.getResolved('Y')!;

    if (isLiteralValue(resolvedX) || isLiteralValue(resolvedY)){
      throw new Error('Unexpected literal value');
    }

    expect(resolvedX.to_string_display()).toBe('2');
    expect(resolvedY.to_string_display()).toBe('1');
  })

  it('should unify variables inside deeply nested binops', () => {
    const unifier = unifyExpressions('X + 1 + 2', '3 + Y + 2');

    expect(unifier).not.toBeNull();

    expect(unifier!.getResolved('X')).not.toBeNull();
    expect(unifier!.getResolved('Y')).not.toBeNull();

    const resolvedX = unifier!.getResolved('X')!;
    const resolvedY = unifier!.getResolved('Y')!;

    if (isLiteralValue(resolvedX) || isLiteralValue(resolvedY)){
      throw new Error('Unexpected literal value');
    }

    expect(resolvedX.to_string_display()).toBe('3');
    expect(resolvedY.to_string_display()).toBe('1');
  })

  it('should unify lists correctly', () => {
    const unifier = unifyExpressions('[X, 1, 2]', '[3, Y, 2]');

    expect(unifier).not.toBeNull();

    expect(unifier!.getResolved('X')).not.toBeNull();
    expect(unifier!.getResolved('Y')).not.toBeNull();

    const resolvedX = unifier!.getResolved('X')!;
    const resolvedY = unifier!.getResolved('Y')!;

    if (isLiteralValue(resolvedX) || isLiteralValue(resolvedY)){
      throw new Error('Unexpected literal value');
    }

    expect(resolvedX.to_string_display()).toBe('3');
    expect(resolvedY.to_string_display()).toBe('1');
  })

  it('should unify variables inside functors', () => {
    const unifier = unifyExpressions('foo(X, 1)', 'foo(2, Y)');

    expect(unifier).not.toBeNull();

    checkVariable('X', unifier!, '2');
    checkVariable('Y', unifier!, '1');
  })

  it('should correctly accumulate unifiers', () => {
    const unifier = unifyExpressions('a(X)', 'a(Y)');
    console.log(unifier?.to_string());
    const unifier2 = unifyExpressions('a(Y)', 'a(2)');
    console.log(unifier2?.to_string());

    const composed = unifier!.compose(unifier2!);

    checkVariable('X', composed, '2');
  })
})