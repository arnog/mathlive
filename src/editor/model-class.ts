import type { Model, Mathfield, Range } from '../public/mathfield';

import { Atom, makeRoot } from '../core/atom';
import type { MathfieldPrivate } from './mathfield-class';
import { Path, clone as clonePath, pathToString } from './path';
import { arrayCell } from './model-array-utils';
import { ModelListeners } from './model-listeners';

import { ModelOptions, ModelHooks, normalizeRange } from './model-utils';
import { PositionIterator } from './model-iterator';
import { getAnchor, setPath } from './model-selection-utils';

export class ModelPrivate implements Model {
    readonly mathfield: MathfieldPrivate;
    readonly options: ModelOptions;
    listeners: ModelListeners;
    hooks: Required<ModelHooks>;

    root: Atom;

    path: Path; // @revisit: could be called anchor
    extent: number; // @revisit: could group anchor + extent = Selection

    suppressChangeNotifications: boolean;

    constructor(
        options?: ModelOptions,
        listeners?: ModelListeners,
        hooks?: ModelHooks,
        target?: Mathfield
    ) {
        this.options = {
            mode: 'math',
            removeExtraneousParentheses: false,
            ...options,
        };
        this.root = makeRoot(this.options.mode);
        this.path = [{ relation: 'body', offset: 0 }];
        this.extent = 0;

        this.setListeners(listeners);
        this.setHooks(hooks);
        this.mathfield = target as MathfieldPrivate;

        this.suppressChangeNotifications = false;
    }

    clone(): ModelPrivate {
        const result = new ModelPrivate(
            this.options,
            this.listeners,
            this.hooks,
            this.mathfield
        );
        result.root = this.root;
        result.path = clonePath(this.path);
        return result;
    }
    setListeners(listeners?: ModelListeners): void {
        this.listeners = listeners;
    }
    setHooks(hooks?: ModelHooks): void {
        this.hooks = {
            announce: hooks?.announce
                ? hooks.announce
                : (
                      _target: Mathfield,
                      _command: string,
                      _modelBefore: ModelPrivate,
                      _atoms: Atom[]
                  ): void => {
                      return;
                  },
            moveOut: hooks?.moveOut
                ? hooks.moveOut
                : (): boolean => {
                      return true;
                  },
            tabOut: hooks?.tabOut
                ? hooks.tabOut
                : (): boolean => {
                      return true;
                  },
        };
    }
    get selection(): Range[] {
        const anchor = getAnchor(this);
        let focus = undefined;
        if (this.parent().array) {
            focus = arrayCell(this.parent().array, this.relation())[
                this.focusOffset()
            ];
        } else {
            const siblings = this.siblings();
            focus = siblings[Math.min(siblings.length - 1, this.focusOffset())];
        }

        const iter = new PositionIterator(this.root);
        return [
            normalizeRange(iter, {
                start: iter.find(anchor),
                end: iter.find(focus),
            }),
        ];
    }

    set selection(value: Range[]) {
        setSelection(this, value);
    }

    get lastPosition(): number {
        const iter = new PositionIterator(this.root);
        return iter.lastPosition;
    }

    announce(
        command: string, // @revisit: be more explicit
        modelBefore?: ModelPrivate,
        atoms: Atom[] = []
    ): void {
        this.hooks.announce(this.mathfield, command, modelBefore, atoms);
    }

    /**
     * Return a string representation of the selection.
     * @todo This is a bad name for this function, since it doesn't return
     * a representation of the content, which one might expect...
     *
     * Note: Not private: used by filter
     *
     */
    toString(): string {
        return pathToString(this.path, this.extent);
    }

    /**
     * Note: used by model-utils, so not private.
     * @return array of children of the parent
     */
    siblings(addMisingFirstAtom = true): Atom[] {
        if (this.path.length === 0) return [];

        let siblings: Atom[];
        if (this.parent().array) {
            siblings = arrayCell(this.parent().array, this.relation());
        } else {
            siblings = this.parent()[this.relation()] ?? [];
            if (typeof siblings === 'string') siblings = [];
        }

        // If the 'first' atom is missing, insert it
        if (
            addMisingFirstAtom &&
            (siblings.length === 0 || siblings[0].type !== 'first')
        ) {
            siblings.unshift(new Atom(this.parent().mode, 'first'));
        }

        return siblings;
    }

    anchorOffset(): number {
        return this.path.length > 0
            ? this.path[this.path.length - 1].offset
            : 0;
    }

    focusOffset(): number {
        return this.path.length > 0
            ? this.path[this.path.length - 1].offset + this.extent
            : 0;
    }

    /**
     *  True if the entire group is selected
     */
    groupIsSelected(): boolean {
        return (
            this.startOffset() === 0 &&
            this.endOffset() >= this.siblings().length - 1
        );
    }

    /**
     * Offset of the first atom included in the selection
     * i.e. `=1` => selection starts with and includes first atom
     * With expression _x=_ and atoms :
     * - 0: _<first>_
     * - 1: _x_
     * - 2: _=_
     *
     * - if caret is before _x_:  `start` = 0, `end` = 0
     * - if caret is after _x_:   `start` = 1, `end` = 1
     * - if _x_ is selected:      `start` = 1, `end` = 2
     * - if _x=_ is selected:   `start` = 1, `end` = 3
     * Note: accessed by model-selection, not private
     */
    startOffset(): number {
        return Math.min(this.focusOffset(), this.anchorOffset());
    }

    /**
     * Offset of the first atom not included in the selection
     * i.e. max value of `siblings.length`
     * `endOffset - startOffset = extent`
     *
     * Note: accessed by model-selection, not private
     */
    endOffset(): number {
        return Math.max(this.focusOffset(), this.anchorOffset());
    }
    /**
     * Sibling, relative to `anchor`
     * `sibling(0)` = start of selection
     * `sibling(-1)` = sibling immediately left of start offset
     */
    sibling(offset: number): Atom {
        return this.siblings()[this.startOffset() + offset];
    }

    // @revisit: move ancestor, and anything related to the selection to model-selection
    /**
     * Note: used by model-utils, so not private.
     * @param ancestor distance from self to ancestor.
     * - `ancestor` = 0: self
     * - `ancestor` = 1: parent
     * - `ancestor` = 2: grand-parent
     * - etc...
     */
    ancestor(ancestor: number): Atom {
        // If the requested ancestor goes beyond what's available,
        // return null
        if (ancestor > this.path.length) return null;

        // Start with the root
        let result = this.root;

        // Iterate over the path segments, selecting the appropriate
        for (let i = 0; i < this.path.length - ancestor; i++) {
            const segment = this.path[i];
            if (result.array) {
                result = arrayCell(result.array, segment.relation)[
                    segment.offset
                ];
            } else if (!result[segment.relation]) {
                // There is no such relation... (the path got out of sync with the tree)
                return null;
            } else {
                // Make sure the 'first' atom has been inserted, otherwise
                // the segment.offset might be invalid
                if (
                    result[segment.relation].length === 0 ||
                    result[segment.relation][0].type !== 'first'
                ) {
                    result[segment.relation].unshift(
                        new Atom(result[segment.relation][0].mode, 'first')
                    );
                }
                const offset = Math.min(
                    segment.offset,
                    result[segment.relation].length - 1
                );
                result = result[segment.relation][offset];
            }
        }

        return result;
    }

    parent(): Atom {
        return this.ancestor(1);
    }

    relation(): string {
        return this.path.length > 0
            ? this.path[this.path.length - 1].relation
            : '';
    }

    /**
     * If necessary, insert a `first` atom in the sibling list.
     * If there's already a `first` atom, do nothing.
     * The `first` atom is used as a 'placeholder' to hold the blinking caret when
     * the caret is positioned at the very beginning of the mathlist.
     */
    insertFirstAtom(): void {
        this.siblings();
    }
}

export function setSelection(
    model: ModelPrivate,
    value: Range[] | Range
): void {
    // @todo: for now, only consider the first range
    const range = Array.isArray(value) ? value[0] : value;

    // Normalize the range
    const iter = new PositionIterator(model.root);
    if (!range.direction) range.direction = 'forward';
    if (typeof range.end === 'undefined') range.end = range.start;
    if (range.end < 0) range.end = iter.lastPosition;

    let anchorPath: string;
    if (range.direction === 'backward') {
        anchorPath = iter.at(range.end).path;
    } else {
        anchorPath = iter.at(range.start).path;
    }

    setPath(model, anchorPath, range.end - range.start);
}
