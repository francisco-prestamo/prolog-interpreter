# TODO

## Not Done

- mapping {X$... -> X, X -> 1}, when restricted to {X} gives {}, because only left side of mapping is considered
  - we could create VariableMap, which are fully connected graphs, and then bind those to nodes
- Add builtin functor handling in interpreter
- Further separate elements in different files in interpreter (unifier from unifier builder from unify() for example)

- Unifier should be able to resolve variable name and variable node
- ensure transitive mappings are resolved upon applying unifier (recursive application + path compression)
- Rename PrattParser to ExpressionParser

- add tests to ensure creating a unifier from two nodes, then applying it to both results in equal nodes
- add test to check if non associative operators cause errors

## Done

- string LiteralValue's are stored as literal strings, but unifiers map variable names (strings) to ASTNodes, this is ambiguous ("X", X).
  - encapsulate them in object {value: string | number | boolean}

---

- DSU must receive an IComparable
- Variable classes should have variable nodes (which will be Icomparable)

These two were scrapped to maintain a log(n) complexity