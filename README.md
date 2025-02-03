# Readme

## Team

### Dario Hernandez Cubilla
### Francisco Prestamo Bernardez

## Running the project

In order to run the project locally run the following in the root directory:

```bash
npm run dev
```

## Basic Structure

The Prolog interpreter proper is in `src/app/api/Prolog/`. There, in the `Interface.ts` file you can find a convenient entry point the receives a prolog program and a query and returns results or errors (lexing, parsing, or runtime errors)

The code around it belongs to the GUI, but the interpreter does not need it to run

## The UI

At the time of this writing, the web app is deployed in vercel, but you are able to run it locally as shown in the Running the Project section. The UI shows two text areas, one for the program, the set of rules Prolog will use to resolve a query (this first part is optional), and one for the query. When a query is resolved, there might be several possible SLD trees, for example, if the query contains the `;` operator, several trees are created, only the first one is shown.

## The Prolog Interpreter

Inside the Prolog folder, there are several folders, here is a brief explanation of each one's contribution to the interpreter

### AST

Here we define the nodes of the prolog AST, these are created during parsing, and are later used in interpretation, in order to satisfy a query, Prolog might not evaluate expressions if it doesn't need to, but it does parse them.

In interpretation, it is these AST nodes the structures we use in unification, if we want to unify the expression `[A, A]` with `[B, 3]`, this is resolved recursively by unifying each of the nodes that represent the list nodes of the AST, our unification algorithm that, for a list, it needs to unify the head and the tail, and update the unifier with the new information these unifications produce.

### Utils

Here, we define a helper DSU data structure to help with the unification algorithm

### Lexer

The Lexer takes charge of converting valid prolog code into tokens, in order for the parser to continue processing them. It also throws Lexical errors if invalid character sequences are found

### Parser

We use a parsing technique called Pratt Parsing for expression parsing. This is an extensible parsing technique, and a bit more performant than run-of-the-mill recursive descent parsing, it is still based on recursive descent of course, but only the functions necessary for parsing an expression are called: it is not necessary to call all the functions defined for each level of operator precedence in order to parse a term.

We then simply use recursive descent parsing to ensure queries and program clauses end in `.`

### Interpreter

The interpreter is the one that computes the prolog SLD tree and finds the solutions to a query. It has several parts, which contribute to this

#### ASTVisitors

This is essentially a collection of AST Visitor interfaces, one for parallel AST visiting (such as when comparing expressions without actually evaluating them, we can achieve this by comparing the ASTs, which requires recursively comparing nodes), and another for normal single-node visiting.

#### Unifier

This part of the interpreter takes charge of defining and creating unifiers, as well as providing ways of applying unifiers to an expression. 

It has a UnifierBuilder, which is a parallel AST visitor, and builds unifiers by recursively unifying two ASTs, for example, if it ever reaches the point of unifying a variable node with a numeric literal node, the resulting unifier would have this assignment. 

It has a Resolver, which, given a unifier, is able to resolve an expression, for example, if we apply unifier `{A = 3}` to the AST resulting from `A + A`, we'd get `3 + 3`.

It has a Unifier class, which takes charge of representing unifiers and performing some of the unifier updating logic. This is the part that uses the DSU  located in `Utils` to create equivalence classes of variables, in order to resolve and optimize the solution of the problem of handling transitive variable assignments.

#### Comparer

This is a parallel AST visitor which sole purpose is defining if two AST nodes are equal.

#### Evaluator

This is a single-node AST visitor which evaluates AST nodes and returns the literal value that results from them.


#### Variable Extractor

This is a single-node AST visitor which facilitates the restriction of unifier results in the Interpreter to the variables that were defined in the query.

#### Interpreter

This is the part that actually uses the others in order to interpret a prolog program and query, and finding solutions. It uses SLD resolution to achieve this, and, apart from the solutions found, returns a representation of the tree that results from this process

### PrologTree

This is simply a way to represent the SLD tree created in the Interpreter.








