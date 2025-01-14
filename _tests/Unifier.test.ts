import { ASTNode } from "@/app/api/Prolog/AST/Nodes/ASTNode";
import { Lexer } from "@/app/api/Prolog/Lexer/Lexer";
import { PrattParser } from "@/app/api/Prolog/Parser/PrattParser";
import { getUnifier } from "@/app/api/Prolog/Interpreter/Unifier/GetUnifier";
import { isLiteralValue, LiteralValue } from "@/app/api/Prolog/Interpreter/LiteralValue";
import { Unifier } from "@/app/api/Prolog/Interpreter/Unifier/Unifier";

function unifyExpressions(expr1: string, expr2: string): Unifier | null{
  const node1 = parseExpression(expr1);
  const node2 = parseExpression(expr2);

  return getUnifier(node1, node2);

}

function parseExpression(text: string): ASTNode{
  const lexer = new Lexer(text);
  return new PrattParser(lexer.getTokens()).parse();
}

function resolveVariableNameInUnifier(name: string, unifier: Unifier): ASTNode | LiteralValue{
  const node = unifier.resolveVariableName(name);
  expect(node).not.toBeNull();
  expect(typeof node).not.toBe('string');

  return node! as ASTNode | LiteralValue;
}

function checkVariable(name: string, unifier: Unifier, value: string){
  const node = resolveVariableNameInUnifier(name, unifier);
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

    expect(resolveVariableNameInUnifier('X', unifier!)).not.toBeNull();

    const resolved = resolveVariableNameInUnifier('X', unifier!)!;

    if (isLiteralValue(resolved)){
      throw new Error('Unexpected literal value');
    }

    expect(resolved.to_string_display()).toBe('1');
  })

  it('should unify simple assignment in reverse', () => {
    const unifier = unifyExpressions('1', 'X');

    expect(unifier).not.toBeNull();

    expect(resolveVariableNameInUnifier('X', unifier!)).not.toBeNull();

    const resolved = resolveVariableNameInUnifier('X', unifier!)!;

    if (isLiteralValue(resolved)){
      throw new Error('Unexpected literal value');
    }

    expect(resolved.to_string_display()).toBe('1');
  });

  it('should unify variables inside binops', () => {
    const unifier = unifyExpressions('X + 1', '2 + Y');

    expect(unifier).not.toBeNull();

    expect(resolveVariableNameInUnifier('X', unifier!)).not.toBeNull();
    expect(resolveVariableNameInUnifier('Y', unifier!)).not.toBeNull();

    const resolvedX = resolveVariableNameInUnifier('X', unifier!)!;
    const resolvedY = resolveVariableNameInUnifier('Y', unifier!)!;

    if (isLiteralValue(resolvedX) || isLiteralValue(resolvedY)){
      throw new Error('Unexpected literal value');
    }

    expect(resolvedX.to_string_display()).toBe('2');
    expect(resolvedY.to_string_display()).toBe('1');
  })

  it('should unify variables inside deeply nested binops', () => {
    const unifier = unifyExpressions('X + 1 + 2', '3 + Y + 2');

    expect(unifier).not.toBeNull();

    expect(resolveVariableNameInUnifier('X', unifier!)).not.toBeNull();
    expect(resolveVariableNameInUnifier('Y', unifier!)).not.toBeNull();

    const resolvedX = resolveVariableNameInUnifier('X', unifier!)!;
    const resolvedY = resolveVariableNameInUnifier('Y', unifier!)!;

    if (isLiteralValue(resolvedX) || isLiteralValue(resolvedY)){
      throw new Error('Unexpected literal value');
    }

    expect(resolvedX.to_string_display()).toBe('3');
    expect(resolvedY.to_string_display()).toBe('1');
  })

  it('should unify lists correctly', () => {
    const unifier = unifyExpressions('[X, 1, 2]', '[3, Y, 2]');

    expect(unifier).not.toBeNull();

    expect(resolveVariableNameInUnifier('X', unifier!)).not.toBeNull();
    expect(resolveVariableNameInUnifier('Y', unifier!)).not.toBeNull();

    const resolvedX = resolveVariableNameInUnifier('X', unifier!)!;
    const resolvedY = resolveVariableNameInUnifier('Y', unifier!)!;

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

  it('should unify recursively defined lists correctly', () => {
    const unifier = unifyExpressions('[X, [1, 2]]', '[[3, 4], Y]');

    expect(unifier).not.toBeNull();

    checkVariable('X', unifier!, '[3, 4]');
    checkVariable('Y', unifier!, '[1, 2]');
  })

  it('should unify recursively defined lists with variable tails correctly', () => {
    const unifier = unifyExpressions('[X | Y]', '[1, 2]')

    expect(unifier).not.toBeNull();

    checkVariable('X', unifier!, '1');
    checkVariable('Y', unifier!, '[2]');
  })

  it('should unify member heads correctly', () => {
    const unifier = unifyExpressions('member(X, [1, 2, 3])', 'member(X, [X | T])');

    expect(unifier).not.toBeNull();

    checkVariable('T', unifier!, '[2, 3]');
    checkVariable('X', unifier!, '1');
  })

  it('should not unify member functor with member functor with empty list', () => {
    const unifier = unifyExpressions('member(X, [])', 'member(X, [X | T])');

    expect(unifier).toBeNull();
  })

  it('should set T in unify([X | T], [1]) to []', () => {
    const unifier = unifyExpressions('[X | T]', '[1]');

    expect(unifier).not.toBeNull();

    checkVariable('X', unifier!, '1');
    checkVariable('T', unifier!, '[]');
  })

  it('should be applied correctly to list node', () => {
    const unifier = unifyExpressions('[X, Y]', '[1, 2]');

    expect(unifier).not.toBeNull();

    const resolved = unifier!.apply(parseExpression('[X, Y]'));

    expect(resolved.to_string_display()).toBe('[1, 2]');
  })

})