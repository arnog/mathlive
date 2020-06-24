import { Atom, makeRoot } from '../core/atom';
import type { Model, Mathfield } from '../public/mathfield';
import type { MathfieldPrivate } from './mathfield-class';
import { Path, clone as clonePath, pathToString } from './path';
import { arrayCell } from './model-array-utils';
import { ModelListeners } from './model-listeners';

import { ModelOptions, ModelHooks } from './model-utils';

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
     */
    toString(): string {
        return pathToString(this.path, this.extent);
    }

    /**
     * @return array of children of the parent
     */
    siblings(): Atom[] {
        if (this.path.length === 0) return [];

        let siblings: Atom[];
        if (this.parent().array) {
            siblings = arrayCell(this.parent().array, this.relation());
        } else {
            siblings = this.parent()[this.relation()] || [];
            if (typeof siblings === 'string') siblings = [];
        }

        // If the 'first' atom is missing, insert it
        if (siblings.length === 0 || siblings[0].type !== 'first') {
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
     */
    startOffset(): number {
        return Math.min(this.focusOffset(), this.anchorOffset());
    }

    /**
     * Offset of the first atom not included in the selection
     * i.e. max value of `siblings.length`
     * `endOffset - startOffset = extent`
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
