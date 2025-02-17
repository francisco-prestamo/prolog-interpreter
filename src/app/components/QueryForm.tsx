import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { NodePL } from "../api/Prolog/PrologTree/NodePL";
import Tree from "react-d3-tree";
import { PrologResponse } from "../api/route";

interface TreeNode {
    id: string;
    unifier?: Record<string, string>;
    // unifierText: string;
    appliedClause: string | null;
    objective: string;
    children: TreeNode[];
    // objective: Subclause[];
}

interface TreeData {
    name: string;
    attributes: Record<string, string>;
    children: TreeData[];
}


export const QueryForm = (): React.ReactElement => {
    const [clauses, setClauses] = useState<string>("");
    const [query, setQuery] = useState<string>("");
    const [treeData, setTreeData] = useState<TreeNode | null>(null);
    const [result, setResult] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const transformTreeData = (node: NodePL): TreeNode => {
        // const unifierObject: Record<string, string> = {};
        // // if (typeof node.unifier === 'object' && node.unifier !== null) {
        // //     Object.entries(node.unifier).forEach(([key, value]) => {
        // //         unifierObject[key] =
        // //             typeof value === 'object' && value !== null
        // //                 ? JSON.stringify(value)
        // //                 : String(value);
        // //     });
        // // }

        // // for (const [])

        return {
            id: node.id,
            unifier: node.unifier,
            // unifierText: node.unifierText,
            appliedClause: node.appliedClause,
            objective: node.objective,
            children: Array.isArray(node.children) ? node.children.map(transformTreeData) : [],
        };
    };

    const handleSubmit = async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            if ( /* !clauses.trim() || */ !query.trim()) {
                throw new Error("Please enter a query");
            }

            const response = await fetch("/api", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clauses, query }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status} - ${response.statusText}`);
            }

            const data: PrologResponse = (await response.json());
            console.log('data')
            
            if (data.queryParsingErrors){
                console.log("query parsing error")
                setError("Query Error: " + data.queryParsingErrors[0]);
                setTreeData(null);
                setResult("Error");

                return;
            }

            if (data.programParsingErrors){
                setError("Body Error: " + data.programParsingErrors[0]);
                setTreeData(null);
                setResult("Error");

                return;
            }

            if (data.interpreterErrors){
                setError("Runtime Error: " + data.interpreterErrors[0]);
                setTreeData(null);
                setResult("Error");

                return;
            }

            if (data.nodeTree) {
                console.log("node tree defined")
                try {
                    setTreeData(transformTreeData(data.nodeTree));
                } catch (transformError) {
                    console.error("Error transforming tree data:", transformError);
                    setError("Error processing the response data");
                    setTreeData(null);
                }
            } else {
                setTreeData(null);
            }

            setResult(data.result || "");

        } catch (err) {
            console.error("Error during query submission:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
            setResult("");
            setTreeData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const renderTree = (node: TreeNode): TreeData => {
        const unifierAttributes = node.unifier ?? {}

        if (node.appliedClause) unifierAttributes.APPLIED_CLAUSE = node.appliedClause;

        return {
            name: node.objective,
            attributes: unifierAttributes,
            children: node.children.map(renderTree),
        };
    };

    return (
        <Card className="w-3/4 mx-auto p-6">
            <CardHeader>
                <CardTitle>Submit Prolog Clauses and Query</CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea
                    placeholder="Enter Prolog clauses (one per line)..."
                    value={clauses}
                    onChange={({ target: { value } }) => setClauses(value)}
                    className="mb-4 h-32 font-mono"
                    disabled={isLoading}

                />
                <Textarea
                    placeholder="Enter your Prolog query here..."
                    value={query}
                    onChange={({ target: { value } }) => setQuery(value)}
                    className="mb-4 font-mono"
                    disabled={isLoading}
                />
                <Button
                    onClick={handleSubmit}
                    className="mb-4"
                    disabled={isLoading}
                >
                    {isLoading ? "Processing..." : "Submit"}
                </Button>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="mt-4">
                        <strong>Result:</strong>
                        <pre className="text-green-600 mt-2">{result}</pre>
                    </div>
                )}

                {treeData && (
                    <div className="h-screen mt-8 overflow-x-auto">
                        <h3 className="text-lg font-bold mb-4">Query Tree</h3>
                        <div className="w-full h-full p-8">
                            <Tree
                                data={renderTree(treeData)}
                                orientation="vertical"
                                translate={{ x: 100, y: 100 }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default QueryForm;