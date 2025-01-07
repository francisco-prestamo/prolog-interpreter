export interface Atom {
    type: "atom";
    value: string;
}

export interface List {
    type: "list";
    value: Term[];
}

export type Term = Atom | List;

export interface NodePL {
    id: string;
    fatherId?: string;
    clause: Clause;
    unifier: Map<Term, Term>;
    unifierText: string;
    objective: Subclause[];
    processedCut?: boolean;
    children: NodePL[];
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
    if (term.type === "atom") {
        return /^[A-Z]/.test(term.value);
    }
    return false;
};

const isList = (term: Term): boolean => term.type === "list";


// const parseTerm = (term: Term): Term => {
//     if (term.type === "atom") {
//         return term;
//     } else if (term.type === "list") {
//         return {
//             type: "list",
//             value: term.value.map(parseTerm),
//         };
//     }
//     throw new Error("Unknown term type");
// };

const areTermsEqual = (term1: Term, term2: Term): boolean => {
    if (term1.type !== term2.type) {
        return false;
    }
    if (term1.type === "atom" && term2.type === "atom") {
        return term1.value === term2.value;
    }

    return false;
};

const resolveTerm = (term: Term, unifier: Map<Term, Term>): Term => {
    if (isVariable(term)) {
        for (const [key, value] of unifier) {
            if (areTermsEqual(key, term)) {
                return resolveTerm(value, unifier);
            }
        }
        return term;
    }

    if (term.type === 'list') {
        return {
            type: 'list',
            value: term.value.map(t => resolveTerm(t, unifier))
        };
    }

    return term;
};

const unifyLists = (
    clauseHead: Term,
    subclauseHead: Term,
    unifier: Map<Term, Term>
): Map<Term, Term> | null => {

    const resolvedClauseHead = resolveTerm(clauseHead, unifier);
    let resolvedSubclauseHead = resolveTerm(subclauseHead, unifier);

    if(isList(resolvedClauseHead) && isList(resolvedSubclauseHead) && resolvedClauseHead.value.length === 0 && resolvedSubclauseHead.value.length === 0){
        return unifier
    }
    if (isList(resolvedClauseHead) && isList(resolvedSubclauseHead) && (resolvedClauseHead.value.length > 0 && resolvedSubclauseHead.value.length > 0)) {

        while(isList((resolvedSubclauseHead as List).value[0]) && resolvedSubclauseHead.value.length == 1) {
            resolvedSubclauseHead=(resolvedSubclauseHead.value[0] as List);
        }

        const clauseValues = (resolvedClauseHead as List).value;
        const subclauseValues = (resolvedSubclauseHead as List).value;

        if (clauseValues.length !== subclauseValues.length) {
            return null;
        }

        for (let i = 0; i < clauseValues.length; i++) {
            const unified = unifyLists(clauseValues[i], subclauseValues[i], unifier);
            console.log("unifier list",unifier);
            if (!unified) return null;
        }
    }else if (isVariable(resolvedClauseHead) && isList(resolvedSubclauseHead)) {
        unifier.set(resolvedClauseHead,resolvedSubclauseHead);//
    } else if (isList(resolvedClauseHead) && isVariable(resolvedSubclauseHead)) {
        unifier.set(resolvedSubclauseHead,resolvedClauseHead);//
    }else if (isVariable(resolvedClauseHead )&& !isVariable(resolvedSubclauseHead )){
        unifier.set(resolvedClauseHead,resolvedSubclauseHead );//
        console.log(unifier);
        console.log("not var ",resolvedSubclauseHead," var ",resolvedClauseHead )
    } else if (isVariable(resolvedSubclauseHead) && !isVariable(resolvedClauseHead)) {

        unifier.set(resolvedSubclauseHead,resolvedClauseHead);//
        console.log(unifier);
        console.log("not var ",resolvedClauseHead," var ", resolvedSubclauseHead)
    }
    else if (isVariable(resolvedSubclauseHead) && isVariable(resolvedClauseHead)){
        let b = false;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [key, value] of unifier) {
            if (areTermsEqual(key, resolvedSubclauseHead)) {
                b=true;
            }
        }
        console.log(`[${resolvedSubclauseHead}] ${b}`);
        if(b){

            unifier.set( resolvedClauseHead,resolvedSubclauseHead);//
        }else{
            unifier.set(resolvedSubclauseHead,resolvedClauseHead);//
        }

    }
    else if (resolvedClauseHead.value !== resolvedSubclauseHead.value) {
        return null;
    }
    else{

    }
    return unifier;
};

const renameVariables = (clause: Clause, nodeId: string): Clause => {
    const renameTerm = (term: Term): Term => {
        if (isVariable(term)) {
            return {
                type: "atom",
                value: `${term.value}-${nodeId}`,
            };
        }

        if (isList(term)) {
            return {
                type: "list",
                value: (term as List).value.map(renameTerm),
            };
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

const unify = (
    clause: Clause,
    subclause: Subclause,
    unifier: Map<Term, Term> = new Map()
): Map<Term, Term> | null => {
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

        const resolvedClauseArg = resolveTerm(clauseArg, newUnifier);
        const resolvedSubclauseArg = resolveTerm(subclauseArg, newUnifier);

        if (isVariable(resolvedClauseArg )&& !isVariable(resolvedSubclauseArg )){
            newUnifier.set(resolvedClauseArg ,resolvedSubclauseArg);//
        } else if (isVariable(resolvedSubclauseArg) && !isVariable(resolvedClauseArg)) {
            newUnifier.set(resolvedSubclauseArg,resolvedClauseArg);//
        }
        else if (isVariable(resolvedSubclauseArg) && isVariable(resolvedClauseArg)){
            let b = false;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [key, value] of newUnifier) {
                if (areTermsEqual(key, resolvedSubclauseArg)) {
                    b=true;
                }
            }
            if(b){
                newUnifier.set( resolvedClauseArg,resolvedSubclauseArg);//
            }else{
                newUnifier.set(resolvedSubclauseArg,resolvedClauseArg);//
            }

        } else if (resolvedClauseArg.value !== resolvedSubclauseArg.value) {
            if (
                isList(resolvedClauseArg) &&
                isList(resolvedSubclauseArg)
            ) {
                const listHeadUnifier = unifyLists(
                    resolvedClauseArg,
                    resolvedSubclauseArg,
                    newUnifier
                );
                if (!listHeadUnifier) return null;
            } else {
                return null;
            }
        }
    }

    return newUnifier;
};

export const substituteVariables = (
    subclause: Subclause,
    unifier: Map<Term, Term>
): Subclause => {

    const substituteTerms = (term: Term): Term => {

        const resolvedTerm = resolveTerm(term, unifier);

        if (isList(resolvedTerm)) {
            return {
                type: "list",
                value: (resolvedTerm as List).value.map(substituteTerms)
            };
        }

        return resolvedTerm;
    };

    return {
        ...subclause,
        arguments: subclause.arguments.map(substituteTerms)
    };
};

export const interpret = (
    clauses: Clause[],
    objectives: Subclause[],
    currentNode: NodePL,
    globalUnifiers: Map<Term, Term>[] = [],
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

    for (let i = 0; i < clauses.length; i++) {

        const currentCount = usageCount.get(i) || 0;


        const clause = clauses[i];

        const varId = `${i + 1}-${currentCount + 1}`;
        const renamedClause = renameVariables(clause, varId);

        const unifier = unify(renamedClause, currentObjective);


        if (unifier) {
            console.log(unifier)
            usageCount.set(i, currentCount + 1);
            const updatedObjectives = [
                ...renamedClause.body.map((subclause) =>
                    substituteVariables(subclause, unifier)
                ),
                ...remainingObjectives.map((obj) =>
                    substituteVariables(obj, unifier)
                ),
            ];

            const newNodeId = currentNode.id === "0"
                ? `${i + 1}`
                : `${currentNode.id}.${i + 1}`;

            const newNode: NodePL = {
                id: newNodeId,
                fatherId: currentNode.id,
                children: [],
                clause: renamedClause,
                unifier,
                unifierText: Array.from(unifier.entries())
                    .map(([key, value]) => `${termToString(value)} / ${termToString(key)}`)
                    .join(", "),
                objective: updatedObjectives,
            };

            currentNode.children.push(newNode);
            interpret(clauses, updatedObjectives, newNode, globalUnifiers, usageCount);
        }
    }

    return false;
};



const termToString = (term: Term): string => {
    if (isVariable(term)) {
        return (term as Atom).value;
    }
    if (isList(term)) {
        const listContent = (term as List).value.map(termToString).join("| ");
        return `[${listContent}]`;
    }
    return (term as Atom).value;
};