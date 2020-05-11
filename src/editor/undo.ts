import type { ModelPrivate } from './model';
import { insert } from './model-insert';
import { setPath } from './model-selection';
import { UndoStateChangeListener } from '../public/config';

type UndoRecord = {
    latex: string;
    selection: string;
};

interface UndoOptions {
    onUndoStateWillChange?: UndoStateChangeListener;
    onUndoStateDidChange?: UndoStateChangeListener;
    suppressChangeNotifications?: boolean;
}

/**
 *
 * @class UndoManager
 * @property {Atom[]} mathlist
 * @property {object[]} stack Stack of undo/redo states
 * @property {number} index Index pointing to the undo/redo stack
 * @property {number} maximumDepth Maximum number of undo/redo states
 */
export class UndoManager {
    mathlist: ModelPrivate;
    maximumDepth: number;
    record: boolean;
    canCoalesce: boolean;
    stack: UndoRecord[];
    index: number;

    constructor(mathlist: ModelPrivate) {
        this.mathlist = mathlist;
        this.maximumDepth = 1000;
        this.record = false;
        this.canCoalesce = false;
        this.reset();
    }

    reset(): void {
        this.stack = [];
        this.index = -1;
    }

    startRecording(): void {
        this.record = true;
    }

    canUndo(): boolean {
        return this.index > 0;
    }

    canRedo(): boolean {
        return this.index !== this.stack.length - 1;
    }

    undo(options: UndoOptions): void {
        if (this.canUndo()) {
            if (typeof options?.onUndoStateWillChange === 'function') {
                options.onUndoStateWillChange(this.mathlist.mathfield, 'undo');
            }
            this.restore(this.stack[this.index - 1], options);
            this.index -= 1;
            if (options && typeof options.onUndoStateDidChange === 'function') {
                options.onUndoStateDidChange(this.mathlist.mathfield, 'undo');
            }
            this.canCoalesce = false;
        }
    }
    redo(options: UndoOptions): void {
        if (this.canRedo()) {
            if (typeof options?.onUndoStateWillChange === 'function') {
                options.onUndoStateWillChange(this.mathlist.mathfield, 'redo');
            }
            this.index += 1;
            this.restore(this.stack[this.index], options);
            if (options && typeof options.onUndoStateDidChange === 'function') {
                options.onUndoStateDidChange(this.mathlist.mathfield, 'redo');
            }
            this.canCoalesce = false;
        }
    }
    pop(): void {
        if (this.canUndo()) {
            this.index -= 1;
            this.stack.pop();
        }
    }
    /**
     * Push a snapshot of the content and selection of the mathfield onto the
     * undo stack so that it can potentially be reverted to later.
     */
    snapshot(options: UndoOptions): void {
        if (!this.record) return;

        if (typeof options?.onUndoStateWillChange === 'function') {
            options.onUndoStateWillChange(this.mathlist.mathfield, 'snapshot');
        }
        // Drop any entries that are part of the redo stack
        this.stack.splice(this.index + 1, this.stack.length - this.index - 1);
        // Add a new entry
        this.stack.push({
            latex: this.mathlist.root.toLatex(false),
            selection: this.mathlist.toString(),
        });

        this.index++;
        // If we've reached the maximum number of undo operations, forget the
        // oldest one.
        if (this.stack.length > this.maximumDepth) {
            this.stack.shift();
        }
        if (options && typeof options.onUndoStateDidChange === 'function') {
            options.onUndoStateDidChange(this.mathlist.mathfield, 'snapshot');
        }
        this.canCoalesce = false;
    }

    snapshotAndCoalesce(options: UndoOptions): void {
        if (this.canCoalesce) {
            this.pop();
        }
        this.snapshot(options);
        this.canCoalesce = true;
    }

    /**
     * Return an object capturing the state of the content and selection of the
     * mathfield. Pass this object to restore() to reset the value of the math
     * field to this saved value. This does not affect the undo stack.
     */
    save(): UndoRecord {
        return {
            latex: this.mathlist.root.toLatex(false),
            selection: this.mathlist.toString(),
        };
    }
    /**
     * Set the content and selection of the mathfield to a value previously
     * captured with save() or stored in the undo stack.
     * This does not affect the undo stack.
     */
    restore(state: UndoRecord, options: UndoOptions): void {
        const wasSuppressing = this.mathlist.suppressChangeNotifications;
        if (typeof options.suppressChangeNotifications !== 'undefined') {
            this.mathlist.suppressChangeNotifications =
                options.suppressChangeNotifications;
        }

        // Restore the content
        insert(this.mathlist, state ? state.latex : '', {
            ...options,
            format: 'latex',
            mode: 'math',
            insertionMode: 'replaceAll',
            selectionMode: 'after',
            smartFence: false,
        });

        // Restore the selection
        setPath(
            this.mathlist,
            state ? state.selection : [{ relation: 'body', offset: 0 }]
        );

        this.mathlist.suppressChangeNotifications = wasSuppressing;
    }
}
