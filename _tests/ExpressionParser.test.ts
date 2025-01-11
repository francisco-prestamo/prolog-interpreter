import { PrattParser } from "@/app/api/Prolog/Parser/PrattParser";
import { Lexer } from "@/app/api/Prolog/Lexer/Lexer";
import { NodeType } from "@/app/api/Prolog/AST/NodeTypes";
import { BinOp } from "@/app/api/Prolog/AST/Nodes/BinOp";
import { Clause } from "@/app/api/Prolog/AST/Nodes/Clause";
import { EmptyList, NonEmptyList } from "@/app/api/Prolog/AST/Nodes/List";

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
    
    expect(binop.left.type).toBe(NodeType.NumberLiteral);
    expect(binop.right.type).toBe(NodeType.NumberLiteral);
  })

  it('should parse 2 + 2 * 3 correctly', () => {
    const tree = parse('2 + 2 * 3');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    
    expect(binop.left.type).toBe(NodeType.NumberLiteral);
    expect(binop.right.type).toBe(NodeType.BinOp);

    const right = binop.right as BinOp;
    expect(right.left.type).toBe(NodeType.NumberLiteral);
    expect(right.right.type).toBe(NodeType.NumberLiteral);
  })

  it('should parse 2 * 2 + 3 correctly', () => {
    const tree = parse('2 * 2 + 3');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    
    expect(binop.left.type).toBe(NodeType.BinOp);
    expect(binop.right.type).toBe(NodeType.NumberLiteral);

    const left = binop.left as BinOp;
    expect(left.left.type).toBe(NodeType.NumberLiteral);
    expect(left.right.type).toBe(NodeType.NumberLiteral);
  })

  it('should parse 2 + 2 + 2 correctly', () => {
    const tree = parse('2 + 2 + 2');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    
    expect(binop.left.type).toBe(NodeType.BinOp);
    expect(binop.right.type).toBe(NodeType.NumberLiteral);

    const left = binop.left as BinOp;
    expect(left.left.type).toBe(NodeType.NumberLiteral);
    expect(left.right.type).toBe(NodeType.NumberLiteral);
  });

  it('should parse 2 * 2 + 3 * 4 correctly', () => {
    const tree = parse('2 * 2 + 3 * 4');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    
    expect(binop.left.type).toBe(NodeType.BinOp);
    expect(binop.right.type).toBe(NodeType.BinOp);

    const left = binop.left as BinOp;
    expect(left.left.type).toBe(NodeType.NumberLiteral);
    expect(left.right.type).toBe(NodeType.NumberLiteral);

    const right = binop.right as BinOp;
    expect(right.left.type).toBe(NodeType.NumberLiteral);
    expect(right.right.type).toBe(NodeType.NumberLiteral);
  })

  it('should parse 2 + 2^3^4 * 3 + 1 correctly', () => {
    const tree = parse('2 + 2^3^4 * 3 + 1');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    
    expect(binop.left.type).toBe(NodeType.BinOp);
    expect(binop.right.type).toBe(NodeType.NumberLiteral);

    const beforeSecondPlus = binop.left as BinOp;
    expect(beforeSecondPlus.left.type).toBe(NodeType.NumberLiteral);
    expect(beforeSecondPlus.right.type).toBe(NodeType.BinOp);

    const betweenPluses = beforeSecondPlus.right as BinOp;
    expect(betweenPluses.left.type).toBe(NodeType.BinOp);
    expect(betweenPluses.right.type).toBe(NodeType.NumberLiteral);

    const powers = betweenPluses.left as BinOp;
    expect(powers.right.type).toBe(NodeType.BinOp);

  })

  it('should parse 1 ^ 2 ^ 3 correctly', () => {
    const tree = parse('1 ^ 2 ^ 3');
    console.log(tree.to_string());

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    
    expect(binop.left.type).toBe(NodeType.NumberLiteral);
    expect(binop.right.type).toBe(NodeType.BinOp);

    const right = binop.right as BinOp;
    expect(right.left.type).toBe(NodeType.NumberLiteral);
    expect(right.right.type).toBe(NodeType.NumberLiteral);
  })

  it('should parse 2 + (1 + 3) correctly', () => {
    const tree = parse('2 + (1 + 3)');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    
    expect(binop.left.type).toBe(NodeType.NumberLiteral);
    expect(binop.right.type).toBe(NodeType.BinOp);

    const right = binop.right as BinOp;
    expect(right.left.type).toBe(NodeType.NumberLiteral);
    expect(right.right.type).toBe(NodeType.NumberLiteral);
  })

  it('should parse (1 + 2) + 3 correctly', () => {
    const tree = parse('(1 + 2) + 3');

    expect(tree.type).toBe(NodeType.BinOp);
    
    const binop = tree as BinOp;
    
    expect(binop.left.type).toBe(NodeType.BinOp);
    expect(binop.right.type).toBe(NodeType.NumberLiteral);

    const left = binop.left as BinOp;
    expect(left.left.type).toBe(NodeType.NumberLiteral);
    expect(left.right.type).toBe(NodeType.NumberLiteral);
  });
})

describe('Correct Clause Parsing', () => {
  it('should parse a(c) :- b(c), d(c), h(c). correctly', () => {
    const tree = parse('a(c) :- b(c), d(c), h(c)')

    expect(tree.type).toBe(NodeType.Clause);
    
    const clause = tree as Clause;

    expect(clause.head.type).toBe(NodeType.Functor);
    expect(clause.body.length).toBe(3);
    expect(clause.body[0].type).toBe(NodeType.Functor);
    expect(clause.body[1].type).toBe(NodeType.Functor);
    expect(clause.body[2].type).toBe(NodeType.Functor);
  })
})

describe('Term Parsing', () => {
  it('should parse [1, 2, 3 | A] correctly', () => {
    const node = parse('[1, 2, 3 | A]');

    expect(node.type).toBe(NodeType.NonEmptyList);
    const list = node as NonEmptyList

    expect(list.head.type).toBe(NodeType.NumberLiteral);
    expect(list.tail.type).toBe(NodeType.NonEmptyList);

    const t23A = list.tail as NonEmptyList;
    expect(t23A.head.type).toBe(NodeType.NumberLiteral);
    expect(t23A.tail.type).toBe(NodeType.NonEmptyList);

    const t3A = t23A.tail as NonEmptyList;
    expect(t3A.head.type).toBe(NodeType.NumberLiteral);
    expect(t3A.tail.type).toBe(NodeType.Variable);    
  })
})