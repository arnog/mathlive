import { isArray } from '../common/types';
import { Atom } from '../core/atom';
import { arrayCell, arrayCellCount } from './model-array-utils';
import { ModelPrivate } from './model-class';
import { normalizeModel } from './model-insert';

export type Position = { path: string; atom: Atom; depth: number };

export class PositionIterator {
    positions: Position[];
    root: Atom;

    constructor(root: Atom) {
        this.positions = [];
        this.root = root;
        const model = new ModelPrivate();
        model.root = root;
        normalizeModel(model);
        do {
            this.positions.push({
                path: model.toString(),
                atom: getCurrentAtom(model),
                depth: model.path.length,
            });
        } while (nextPosition(model));
    }
    at(index: number): Position {
        return this.positions[index];
    }
    find(atom: Atom): number {
        for (let i = 0; i < this.positions.length; i++) {
            if (this.positions[i].atom === atom) {
                return i;
            }
        }
        return -1;
    }
    get lastPosition(): number {
        return this.positions.length;
    }
    paths(indexes: number[]): string[] {
        return indexes.map((i): string => this.at(i).path);
    }
}

function nextPosition(model: ModelPrivate): boolean {
    const NEXT_RELATION = {
        body: 'numer',
        numer: 'denom',
        denom: 'index',
        index: 'overscript',
        overscript: 'underscript',
        underscript: 'subscript',
        subscript: 'superscript',
    };

    if (model.anchorOffset() === model.siblings(false).length - 1) {
        // We've reached the end of this list.
        // Is there another list to consider?
        let relation = NEXT_RELATION[model.relation()];
        const parent = model.parent();
        while (relation && !parent[relation]) {
            relation = NEXT_RELATION[relation];
        }

        // We found a new relation/set of siblings...
        if (relation) {
            setPosition(model, 0, relation);
            return true;
        }

        // No more siblings, check if we have a sibling cell in an array
        if (model.parent().array) {
            const maxCellCount = arrayCellCount(model.parent().array);
            let cellIndex =
                parseInt(model.relation().match(/cell([0-9]*)$/)[1]) + 1;
            while (cellIndex < maxCellCount) {
                const cell = arrayCell(model.parent().array, cellIndex, false);
                // Some cells could be null (sparse array), so skip them
                if (cell && setPosition(model, 0, 'cell' + cellIndex)) {
                    return true;
                }
                cellIndex += 1;
            }
        }

        // No more siblings, go up to the parent.
        if (model.path.length === 1) {
            // We're already at the top: nowhere else to go
            return false;
        }
        // We've reached the end of the siblings.
        model.path.pop();

        return true;
    }

    // Still some siblings to go through. Move on to the next one.
    setPosition(model, model.anchorOffset() + 1);
    const anchor = getCurrentAtom(model);

    // Dive into its components, if the new anchor is a compound atom,
    // and allows capture of the selection by its sub-elements
    if (anchor && !anchor.captureSelection) {
        let relation;
        if (anchor.array) {
            // Find the first non-empty cell in this array
            let cellIndex = 0;
            relation = '';
            const maxCellCount = arrayCellCount(anchor.array);
            while (!relation && cellIndex < maxCellCount) {
                // Some cells could be null (sparse array), so skip them
                if (arrayCell(anchor.array, cellIndex, false)) {
                    relation = 'cell' + cellIndex.toString();
                }
                cellIndex += 1;
            }
            console.assert(relation);
            model.path.push({ relation: relation, offset: 0 });
            setPosition(model, 0, relation);
            return true;
        }
        relation = 'body';
        while (relation) {
            if (isArray(anchor[relation])) {
                model.path.push({ relation: relation, offset: 0 });
                return true;
            }
            relation = NEXT_RELATION[relation];
        }
    }
    return true;
}

function setPosition(model: ModelPrivate, offset = 0, relation = ''): boolean {
    // If no relation ("children", "superscript", etc...) is specified
    // keep the current relation
    const oldRelation = model.path[model.path.length - 1].relation;
    if (!relation) relation = oldRelation;

    // If the relation is invalid, exit and return false
    const parent = model.parent();
    if (!parent && relation !== 'body') return false;
    const arrayRelation = relation.startsWith('cell');
    if (
        (!arrayRelation && !parent[relation]) ||
        (arrayRelation && !parent.array)
    ) {
        return false;
    }

    // Temporarily set the path to the potentially new relation to get the
    // right siblings
    model.path[model.path.length - 1].relation = relation;

    const siblings = model.siblings(false);
    const siblingsCount = siblings.length;

    // Restore the relation
    model.path[model.path.length - 1].relation = oldRelation;

    // Calculate the new offset, and make sure it is in range
    // (`setSelectionOffset()` can be called with an offset greater than
    // the number of children, for example when doing an up from a
    // numerator to a smaller denominator, e.g. "1/(x+1)".
    if (offset < 0) {
        offset = siblingsCount + offset;
    }
    offset = Math.max(0, Math.min(offset, siblingsCount - 1));

    model.path[model.path.length - 1].relation = relation;
    model.path[model.path.length - 1].offset = offset;

    return true;
}

function getCurrentAtom(model: ModelPrivate): Atom {
    if (model.parent().array) {
        return arrayCell(model.parent().array, model.relation())[
            model.anchorOffset()
        ];
    }
    const siblings = model.siblings(false);
    return siblings[Math.min(siblings.length - 1, model.anchorOffset())];
}
