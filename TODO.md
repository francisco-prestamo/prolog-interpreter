# TODO

## Not Done

- mapping {X$... -> X, X -> 1}, when restricted to {X} gives {}, because only left side of mapping is considered
  - we could create VariableMap, which are fully connected graphs, and then bind those to nodes

## Done

- string LiteralValue's are stored as literal strings, but unifiers map variable names (strings) to ASTNodes, this is ambiguous ("X", X).
  - encapsulate them in object {value: string | number | boolean}
