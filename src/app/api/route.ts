import { NextResponse } from "next/server";
import { Prolog } from "./Prolog/Interface";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { clauses, query } = body;
        console.log("clauses", clauses)
        console.log("query", query)
        if (!query) {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        const prolog = new Prolog(clauses? clauses : "", query);

        const { solutions, trees } = prolog.solve();

        return NextResponse.json({
            result: "Query Success",
            solutions,
            nodeTree: trees[0],
        });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}