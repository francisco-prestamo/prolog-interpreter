import { PrattParser } from "@/app/api/Prolog/Parser/PrattParser";
import { Lexer } from "@/app/api/Prolog/Lexer/Lexer";
import { NodeType } from "@/app/api/Prolog/AST/NodeTypes";
import { BinOp } from "@/app/api/Prolog/AST/Nodes/BinOp";
import { Clause } from "@/app/api/Prolog/AST/Nodes/Clause";
import { EmptyList, NonEmptyList } from "@/app/api/Prolog/AST/Nodes/List";
import { isLiteralValue } from "@/app/api/Prolog/Interpreter/Evaluator";

function getParser(text: string){
  const lexer = new Lexer(text);
  return new PrattParser(lexer.getTokens());
}

function parse(text: string){
  const parser = getParser(text);
  return parser.parse();
}

describe('Basic Operator Precedence and Associativity Tests', () => {
  it('should parse 2 + 2 correctly', () => {
    const tree = parse('2 + 2');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;

    if (isLiteralValue(binop.left) || isLiteralValue(binop.right)){
      throw new Error('Unexpected literals');
    }
    expect(binop.left.type).toBe(NodeType.NumberLiteral);
    expect(binop.right.type).toBe(NodeType.NumberLiteral);
  })

  it('should parse 2 + 2 * 3 correctly', () => {
    const tree = parse('2 + 2 * 3');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    
    if (isLiteralValue(binop.left) || isLiteralValue(binop.right)){
      throw new Error('Unexpected literals');
    }
    expect(binop.left.type).toBe(NodeType.NumberLiteral);
    expect(binop.right.type).toBe(NodeType.BinOp);

    
    const right = binop.right as BinOp;

    if (isLiteralValue(right.left) || isLiteralValue(right.right)){
      throw new Error('Unexpected literals');
    }
    expect(right.left.type).toBe(NodeType.NumberLiteral);
    expect(right.right.type).toBe(NodeType.NumberLiteral);
  })

  it('should parse 2 * 2 + 3 correctly', () => {
    const tree = parse('2 * 2 + 3');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;

    if (isLiteralValue(binop.left) || isLiteralValue(binop.right)){
      throw new Error('Unexpected literals');
    }
    
    expect(binop.left.type).toBe(NodeType.BinOp);
    expect(binop.right.type).toBe(NodeType.NumberLiteral);

    const left = binop.left as BinOp;

    if (isLiteralValue(left.left) || isLiteralValue(left.right)){
      throw new Error('Unexpected literals');
    }
    expect(left.left.type).toBe(NodeType.NumberLiteral);
    expect(left.right.type).toBe(NodeType.NumberLiteral);
  })

  it('should parse 2 + 2 + 2 correctly', () => {
    const tree = parse('2 + 2 + 2');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    
    if (isLiteralValue(binop.left) || isLiteralValue(binop.right)){
      throw new Error('Unexpected literals');
    }
    expect(binop.left.type).toBe(NodeType.BinOp);
    expect(binop.right.type).toBe(NodeType.NumberLiteral);

    const left = binop.left as BinOp;
    if (isLiteralValue(left.left) || isLiteralValue(left.right)){
      throw new Error('Unexpected literals');
    }
    expect(left.left.type).toBe(NodeType.NumberLiteral);
    expect(left.right.type).toBe(NodeType.NumberLiteral);
  });

  it('should parse 2 * 2 + 3 * 4 correctly', () => {
    const tree = parse('2 * 2 + 3 * 4');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    
    if (isLiteralValue(binop.left) || isLiteralValue(binop.right)){
      throw new Error('Unexpected literals');
    }
    expect(binop.left.type).toBe(NodeType.BinOp);
    expect(binop.right.type).toBe(NodeType.BinOp);

    const left = binop.left as BinOp;
    if (isLiteralValue(left.left) || isLiteralValue(left.right)){
      throw new Error('Unexpected literals');
    }
    expect(left.left.type).toBe(NodeType.NumberLiteral);
    expect(left.right.type).toBe(NodeType.NumberLiteral);

    const right = binop.right as BinOp;
    if (isLiteralValue(right.left) || isLiteralValue(right.right)){
      throw new Error('Unexpected literals');
    }
    expect(right.left.type).toBe(NodeType.NumberLiteral);
    expect(right.right.type).toBe(NodeType.NumberLiteral);
  })

  it('should parse 2 + 2^3^4 * 3 + 1 correctly', () => {
    const tree = parse('2 + 2^3^4 * 3 + 1');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    
    if (isLiteralValue(binop.left) || isLiteralValue(binop.right)){
      throw new Error('Unexpected literals');
    }
    expect(binop.left.type).toBe(NodeType.BinOp);
    expect(binop.right.type).toBe(NodeType.NumberLiteral);

    const beforeSecondPlus = binop.left as BinOp;
    if (isLiteralValue(beforeSecondPlus.left) || isLiteralValue(beforeSecondPlus.right)){
      throw new Error('Unexpected literals');
    }
    expect(beforeSecondPlus.left.type).toBe(NodeType.NumberLiteral);
    expect(beforeSecondPlus.right.type).toBe(NodeType.BinOp);

    const betweenPluses = beforeSecondPlus.right as BinOp;
    if (isLiteralValue(betweenPluses.left) || isLiteralValue(betweenPluses.right)){
      throw new Error('Unexpected literals');
    }
    expect(betweenPluses.left.type).toBe(NodeType.BinOp);
    expect(betweenPluses.right.type).toBe(NodeType.NumberLiteral);

    const powers = betweenPluses.left as BinOp;
    if (isLiteralValue(powers.left) || isLiteralValue(powers.right)){
      throw new Error('Unexpected literals');
    }
    expect(powers.right.type).toBe(NodeType.BinOp);

  })

  it('should parse 1 ^ 2 ^ 3 correctly', () => {
    const tree = parse('1 ^ 2 ^ 3');
    console.log(tree.to_string_debug());

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;

    if (isLiteralValue(binop.left) || isLiteralValue(binop.right)){
      throw new Error('Unexpected literals');
    }
    expect(binop.left.type).toBe(NodeType.NumberLiteral);
    expect(binop.right.type).toBe(NodeType.BinOp);

    const right = binop.right as BinOp;
    if (isLiteralValue(right.left) || isLiteralValue(right.right)){
      throw new Error('Unexpected literals');
    }
    expect(right.left.type).toBe(NodeType.NumberLiteral);
    expect(right.right.type).toBe(NodeType.NumberLiteral);
  })

  it('should parse 2 + (1 + 3) correctly', () => {
    const tree = parse('2 + (1 + 3)');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    
    if (isLiteralValue(binop.left) || isLiteralValue(binop.right)){
      throw new Error('Unexpected literals');
    }
    expect(binop.left.type).toBe(NodeType.NumberLiteral);
    expect(binop.right.type).toBe(NodeType.BinOp);

    const right = binop.right as BinOp;
    if (isLiteralValue(right.left) || isLiteralValue(right.right)){
      throw new Error('Unexpected literals');
    }
    expect(right.left.type).toBe(NodeType.NumberLiteral);
    expect(right.right.type).toBe(NodeType.NumberLiteral);
  })

  it('should parse (1 + 2) + 3 correctly', () => {
    const tree = parse('(1 + 2) + 3');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    if (isLiteralValue(binop.left) || isLiteralValue(binop.right)){
      throw new Error('Unexpected literals');
    }
    expect(binop.left.type).toBe(NodeType.BinOp);
    expect(binop.right.type).toBe(NodeType.NumberLiteral);

    const left = binop.left as BinOp;
    if (isLiteralValue(left.left) || isLiteralValue(left.right)){
      throw new Error('Unexpected literals');
    }
    expect(left.left.type).toBe(NodeType.NumberLiteral);
    expect(left.right.type).toBe(NodeType.NumberLiteral);
  });
})

describe('Correct Clause Parsing', () => {
  it('should parse a(c) :- b(c), d(c), h(c). correctly', () => {
    const tree = parse('a(c) :- b(c), d(c), h(c)')
    console.log(tree.to_string_debug())

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    if (isLiteralValue(binop.left) || isLiteralValue(binop.right)){
      throw new Error('Unexpected literals');
    }
    expect(binop.left.type).toBe(NodeType.Functor);
    expect(binop.right.type).toBe(NodeType.BinOp);

    const body = binop.right as BinOp;
    if (isLiteralValue(body.left) || isLiteralValue(body.right)){
      throw new Error('Unexpected literals');
    }
    expect(body.left.type).toBe(NodeType.BinOp);
    expect(body.right.type).toBe(NodeType.Functor);

    const first = body.left as BinOp;
    if (isLiteralValue(first.left) || isLiteralValue(first.right)){
      throw new Error('Unexpected literals');
    }
    expect(first.left.type).toBe(NodeType.Functor);
    expect(first.right.type).toBe(NodeType.Functor);
  })
})

describe('Term Parsing', () => {
  it('should parse [1, 2, 3 | A] correctly', () => {
    const node = parse('[1, 2, 3 | A]');

    expect(node.type).toBe(NodeType.NonEmptyList);
    const list = node as NonEmptyList

    if (isLiteralValue(list.head) || isLiteralValue(list.tail)){
      throw new Error('Unexpected literals');
    }
    expect(list.head.type).toBe(NodeType.NumberLiteral);
    expect(list.tail.type).toBe(NodeType.NonEmptyList);

    const t23A = list.tail as NonEmptyList;
    if (isLiteralValue(t23A.head) || isLiteralValue(t23A.tail)){
      throw new Error('Unexpected literals');
    }
    expect(t23A.head.type).toBe(NodeType.NumberLiteral);
    expect(t23A.tail.type).toBe(NodeType.NonEmptyList);

    const t3A = t23A.tail as NonEmptyList;
    if (isLiteralValue(t3A.head) || isLiteralValue(t3A.tail)){
      throw new Error('Unexpected literals');
    }
    expect(t3A.head.type).toBe(NodeType.NumberLiteral);
    expect(t3A.tail.type).toBe(NodeType.Variable);    
  })
})