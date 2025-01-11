import { NextResponse } from "next/server";
import { Clause, Subclause, Term, interpret, NodePL } from "./Prolog/Interpreter/clause";

let storedClauses: Clause[] = [];

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { clauses, query } = body;

        if (!query) {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        if (clauses) {
            storedClauses = parseClauses(clauses);
        }
        console.log(JSON.stringify(storedClauses,null,4));

        const objectives = parseQuery(query);
        console.log(JSON.stringify(objectives,null,4));
        const rootNode: NodePL = {
            id: "root",
            children: [],
            clause: { head: { name: "root", arguments: [], introducedBy: null }, body: [] },
            unifier: new Map(),
            unifierText: "",
            objective: objectives,
        };

        interpret(storedClauses, objectives, rootNode);

        const solutions = findSolutions(rootNode);

        console.log(
            JSON.stringify(
                {
                    result: "Query Success",
                    solutions,
                    nodeTree: rootNode,
                },
                null,
                2
            )
        );

        return NextResponse.json({
            result: "Query Success",
            solutions,
            nodeTree: rootNode,
        });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

function parseClauses(clauses: string): Clause[] {
    return clauses.split("\n")
        .filter((line) => line.trim())
        .map((line) => {
            const [head, body] = line.split(":-").map((part) => part.trim());
            const parsedHead = parseSubclause(head);
            const parsedBody = body ? splitBodyClauses(body) : [];

            return { head: parsedHead, body: parsedBody };
        });
}

function splitBodyClauses(body: string): Subclause[] {
    const subclauses: string[] = [];
    let current = "";
    let openParentheses = 0;

    for (const char of body) {
        if (char === "(") openParentheses++;
        if (char === ")") openParentheses--;
        if (char === "," && openParentheses === 0) {
            subclauses.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }

    if (current.trim()) subclauses.push(current.trim());

    return subclauses.map((subclause) => parseSubclause(subclause));
}

function parseSubclause(subclause: string): Subclause {
    if (subclause.trim() === "!") {
        return {
            name: "!",
            arguments: [],
            introducedBy: null,
        };
    }

    const listMatch = subclause.match(/^([^(]+)\[(.*)\]$/);
    if (listMatch) {
        // Handling list type arguments
        const [, name, args] = listMatch;
        const argumentsList = parseListArguments(args);
        return {
            name: name.trim(),
            arguments: argumentsList,
            introducedBy: null,
        };
    }

    // Check if the argument is a list
    const matchResult = subclause.match(/^([^(]+)\(([^)]*)\)$/);
    if (!matchResult) {
        throw new Error(`Invalid subclause format: "${subclause}"`);
    }

    const [, name, args] = matchResult;
    const argumentsList = args
        .split(",")
        .map((arg) => arg.trim())
        .filter((arg) => arg.length > 0)
        .map((arg) => parseArgument(arg));

    return {
        name: name.trim(),
        arguments: argumentsList,
        introducedBy: null,
    };
}

function parseArgument(arg: string): Term {

    if (arg.startsWith("[") && arg.endsWith("]")) {
        const listContent = arg.slice(1, -1);
        if(listContent.trim() === "") {
            return { type: "list", value: [] }
        }
        const listParts = splitFirstList(listContent);

        return { type: "list", value: listParts.map(parseArgument) };
    }

    return { type: "atom", value: arg };
}

function splitFirstList(content: string): string[] {
    let pipeIndex = -1;
    let bracketLevel = 0;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];

        if (char === '[') {
            bracketLevel++;
        } else if (char === ']') {
            bracketLevel--;
        } else if (char === '|' && bracketLevel === 0) {
            pipeIndex = i;
            break;
        }
    }

    if (pipeIndex === -1) {
        return [content];
    }

    const head = content.slice(0, pipeIndex).trim();
    const tail = content.slice(pipeIndex + 1).trim();

    return [head, tail];
}


function parseListArguments(args: string): Term[] {

    const listMatch = args.match(/^\[(.*)\|(.+)\]$/);
    if (listMatch) {
        const [, head, tail] = listMatch;


        return [
            { type: "atom", value: head.trim() },
            { type: "list", value: parseArgument(tail.trim()).value as Term[] },
        ];
    }

    return args.split(",").map((arg) => {
        return { type: "atom", value: arg.trim() };
    });
}

function parseQuery(query: string): Subclause[] {
    return splitBodyClauses(query);
}

function findSolutions(node: NodePL): Record<string, Term>[] {
    const solutions: Record<string, Term>[] = [];

    function traverse(currentNode: NodePL) {
        if (currentNode.objective.length === 0) {
            const serializedUnifier: Record<string, Term> = {};
            currentNode.unifier.forEach((value, key) => {
                serializedUnifier[String(key)] = value; // Ensure key is treated as a string
            });
            solutions.push(serializedUnifier);
        }

        currentNode.children.forEach(traverse);
    }

    traverse(node);
    return solutions;
}