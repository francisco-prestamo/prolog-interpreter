export interface Variable {
    name: string;
    value?: Term;
}

export type Term = string | Variable;

export interface NodePL {
    id: string;
    fatherId?: string;
    children: NodePL[];
    clause: Clause;
    unifier: Map<string, Term>;
    unifierText: string;
    objective: Subclause[];
    processedCut?: boolean;
}

export interface Subclause {
    name: string;
    arguments: Term[];
    introducedBy: string | null;
}

export interface Clause {
    head: Subclause;
    body: Subclause[];
}

const isVariable = (term: Term): boolean => {
    if (typeof term === "string") {
        return term.length > 0 && term[0] >= "A" && term[0] <= "Z";
    }
    return term.hasOwnProperty("name");
};

export const createVariable = (name: string): Variable => ({
    name,
    value: undefined,
});

const generateUnifierText = (unifier: Map<string, Term>): string => {
    const entries = Array.from(unifier.entries());
    if (entries.length === 0) return "No unification needed.";

    return entries
        .map(([key, value]) => {
            if (typeof value === "string") {
                return ` ${value}:${key},`;
            } else if (typeof value === "object" && value.name) {
                return ` ${value.name}:${key},`;
            }
            return `${key} is unified with an unknown term.`;
        })
        .join(" ");
};

export const unify = (
    clause: Clause,
    subclause: Subclause,
    unifier: Map<string, Term> = new Map()
): Map<string, Term> | null => {
    if (
        clause.head.name !== subclause.name ||
        clause.head.arguments.length !== subclause.arguments.length
    ) {
        return null;
    }

    const newUnifier = new Map(unifier);

    for (let i = 0; i < clause.head.arguments.length; i++) {
        const clauseArg = clause.head.arguments[i];
        const subclauseArg = subclause.arguments[i];

        const resolvedClauseArg = resolveVariable(clauseArg, newUnifier);
        const resolvedSubclauseArg = resolveVariable(subclauseArg, newUnifier);

        if (isVariable(resolvedClauseArg)) {
            const varName = typeof resolvedClauseArg === "string" ? resolvedClauseArg : resolvedClauseArg.name;

            if (isVariable(resolvedSubclauseArg)) {
                const subclauseVarName = typeof resolvedSubclauseArg === "string"
                    ? resolvedSubclauseArg
                    : resolvedSubclauseArg.name;

                if (varName !== subclauseVarName) {
                    newUnifier.set(varName, resolvedSubclauseArg);
                }
            } else {
                newUnifier.set(varName, resolvedSubclauseArg);
            }
        } else if (isVariable(resolvedSubclauseArg)) {
            const varName = typeof resolvedSubclauseArg === "string" ? resolvedSubclauseArg : resolvedSubclauseArg.name;
            newUnifier.set(varName, resolvedClauseArg);
        } else if (resolvedClauseArg !== resolvedSubclauseArg) {
            return null;
        }
    }

    return newUnifier;
};

const resolveVariable = (term: Term, unifier: Map<string, Term>): Term => {
    while (isVariable(term)) {
        const varName = typeof term === "string" ? term : term.name;
        const resolvedValue = unifier.get(varName);
        if (!resolvedValue || resolvedValue === term) {
            break;
        }
        term = resolvedValue;
    }
    return term;
};

export const substituteVariables = (
    subclause: Subclause,
    unifier: Map<string, Term>
): Subclause => {
    return {
        ...subclause,
        arguments: subclause.arguments.map((arg) => {
            if (isVariable(arg)) {
                const varName = typeof arg === "string" ? arg : arg.name;
                return unifier.get(varName) || arg;
            }
            return arg;
        }),
    };
};

const renameVariables = (clause: Clause, nodeId: string): Clause => {
    const renameTerm = (term: Term): Term => {
        if (isVariable(term)) {
            const varName = typeof term === "string" ? term : term.name;
            return `${varName}-${nodeId}`;
        }
        return term;
    };

    const renamedHead: Subclause = {
        ...clause.head,
        arguments: clause.head.arguments.map(renameTerm),
    };

    const renamedBody: Subclause[] = clause.body.map((subclause) => ({
        ...subclause,
        arguments: subclause.arguments.map(renameTerm),
    }));

    return {
        head: renamedHead,
        body: renamedBody,
    };
};

export const interpret = (
    clauses: Clause[],
    objectives: Subclause[],
    currentNode: NodePL,
    globalUnifiers: Map<string, Term>[] = [],
    usageCount: Map<number, number> = new Map()
): boolean => {
    if (objectives.length === 0) {
        if (currentNode.unifier.size > 0) {
            globalUnifiers.push(new Map(currentNode.unifier));
        }
        return true;
    }

    const currentObjective = objectives[0];
    const remainingObjectives = objectives.slice(1);

    if (currentObjective.name === "!") {
        const newNode: NodePL = {
            id: `${currentNode.id}-cut`,
            fatherId: currentNode.id,
            children: [],
            clause: { head: currentObjective, body: [] },
            unifier: new Map(currentNode.unifier),
            unifierText: "Cut operator",
            objective: remainingObjectives,
        };
        currentNode.children.push(newNode);

        currentNode.processedCut = true;

        const success = interpret(
            clauses,
            remainingObjectives,
            newNode,
            globalUnifiers,
            usageCount
        );

        return true;
    }

    for (let i = 0; i < clauses.length; i++) {
        const hasProcessedCut = currentNode.processedCut === true;

        if (hasProcessedCut && i > 0) {
            return false;
        }

        const clause = clauses[i];
        const currentUsage = (usageCount.get(i) || 0) + 1;
        usageCount.set(i, currentUsage);

        const nodeId = `${i + 1}-${currentUsage}`;
        const renamedClause = renameVariables(clause, nodeId);

        const unifier = unify(renamedClause, currentObjective);

        if (unifier) {
            const updatedObjectives = [
                ...renamedClause.body.map((obj) => ({
                    ...obj,
                    introducedBy: nodeId,
                })),
                ...remainingObjectives.map((obj) => substituteVariables(obj, unifier)),
            ];

            const newNode: NodePL = {
                id: nodeId,
                fatherId: currentNode.id,
                children: [],
                clause: renamedClause,
                unifier,
                unifierText: generateUnifierText(unifier),
                objective: updatedObjectives,
                processedCut: false,
            };

            currentNode.children.push(newNode);

            const success = interpret(
                clauses,
                updatedObjectives,
                newNode,
                globalUnifiers,
                usageCount
            );

            if (success) {
                return true;
            }
        }
    }

    return false;
};

export const assignClauseIndices = (clauses: Clause[]): Map<Clause, number> => {
    const clauseIndices = new Map<Clause, number>();
    clauses.forEach((clause, index) => clauseIndices.set(clause, index + 1));
    return clauseIndices;
};