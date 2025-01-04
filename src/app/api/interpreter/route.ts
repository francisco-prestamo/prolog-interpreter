import { NextResponse } from "next/server";
import { Clause, Subclause, Term, interpret, NodePL } from "./clause";

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

        const objectives = parseQuery(query);

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

        console.log(solutions);
        console.log(rootNode);
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

    const matchResult = subclause.match(/^([^(]+)\(([^)]*)\)$/);
    if (!matchResult) {
        throw new Error(`Invalid subclause format: "${subclause}"`);
    }

    const [, name, args] = matchResult;
    const argumentsList = args
        .split(",")
        .map((arg) => arg.trim())
        .filter((arg) => arg.length > 0);

    return {
        name: name.trim(),
        arguments: argumentsList,
        introducedBy: null,
    };
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
                serializedUnifier[key] = value;
            });
            solutions.push(serializedUnifier);
        }

        currentNode.children.forEach(traverse);
    }

    traverse(node);
    return solutions;
}