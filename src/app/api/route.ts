import { NextResponse } from "next/server";
import { Prolog } from "./Prolog/Interface";
import { NodePL } from "./Prolog/PrologTree/NodePL";

export type PrologResponse = {
    result: string,
    nodeTree?: NodePL,
    solutions?: Record<string, string>[],
    queryParsingErrors?: string[],
    programParsingErrors?: string[],
    interpreterErrors?: string[],
    status: number
}

export async function POST(request: Request) : Promise<NextResponse<PrologResponse>> {
    try {
        const body = await request.json();
        const { clauses, query } = body;
        console.log("clauses", clauses)
        console.log("query", query)
        if (!query) {
            // return NextResponse.json(
            //     { error: "Query is required" },
            //     { status: 400 }
            // );

            return NextResponse.json({
                result: "Query is required",
                status: 400
            })
        }

        const prolog = new Prolog(clauses? clauses : "", query);

        const { solutions, trees, queryParsingErrors, programParsingErrors, interpreterErrors } = prolog.solve();
        return NextResponse.json({
            result: "Query Success",
            solutions,
            queryParsingErrors, programParsingErrors, interpreterErrors,
            nodeTree: trees.length > 0 ? trees[0] : undefined,
            status: (queryParsingErrors || programParsingErrors || interpreterErrors) ? 400 : 200
        });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({
            result: "Internal Server Error",
            status: 500
        });
    }
}