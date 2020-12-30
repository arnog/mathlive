import type { Selection } from '../public/mathfield';
import { UndoStateChangeListener } from '../public/options';
import type { ModelPrivate } from '../editor-model/model-private';
import { Atom } from '../core/atom-class';
import { ModeEditor } from '../editor-mathfield/mode-editor';

export type UndoRecord = {
  latex: string;
  selection: Selection;
};

interface UndoOptions {
  onUndoStateWillChange?: UndoStateChangeListener;
  onUndoStateDidChange?: UndoStateChangeListener;
  suppressChangeNotifications?: boolean;
}

export class UndoManager {
  private model: ModelPrivate;
  private get maximumDepth() {
    return 1000;
  } // Maximum number of undo/redo states

  private record = false;
  private canCoalesce = false;
  private stack: UndoRecord[]; // Stack of undo/redo states
  private index: number; // Index pointing to the undo/redo stack

  constructor(model: ModelPrivate) {
    this.model = model;
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
        options.onUndoStateWillChange(this.model.mathfield, 'undo');
      }

      this.restore(this.stack[this.index - 1], options);
      this.index -= 1;
      if (options && typeof options.onUndoStateDidChange === 'function') {
        options.onUndoStateDidChange(this.model.mathfield, 'undo');
      }

      this.canCoalesce = false;
    }
  }

  redo(options: UndoOptions): void {
    if (this.canRedo()) {
      if (typeof options?.onUndoStateWillChange === 'function') {
        options.onUndoStateWillChange(this.model.mathfield, 'redo');
      }

      this.index += 1;
      this.restore(this.stack[this.index], options);
      if (options && typeof options.onUndoStateDidChange === 'function') {
        options.onUndoStateDidChange(this.model.mathfield, 'redo');
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
      options.onUndoStateWillChange(this.model.mathfield, 'snapshot');
    }

    // Drop any entries that are part of the redo stack
    this.stack.splice(this.index + 1, this.stack.length - this.index - 1);
    // Add a new entry
    this.stack.push({
      latex: Atom.toLatex(this.model.root, { expandMacro: false }),
      selection: this.model.selection,
    });

    this.index++;
    // If we've reached the maximum number of undo operations, forget the
    // oldest one.
    if (this.stack.length > this.maximumDepth) {
      this.stack.shift();
    }

    if (options && typeof options.onUndoStateDidChange === 'function') {
      options.onUndoStateDidChange(this.model.mathfield, 'snapshot');
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
      latex: Atom.toLatex(this.model.root, { expandMacro: false }),
      selection: this.model.selection,
    };
  }

  /**
   * Set the content and selection of the mathfield to a value previously
   * captured with save() or stored in the undo stack.
   * This does not affect the undo stack.
   */
  restore(state: UndoRecord, options: UndoOptions): void {
    const wasSuppressing = this.model.suppressChangeNotifications;
    if (options.suppressChangeNotifications !== undefined) {
      this.model.suppressChangeNotifications =
        options.suppressChangeNotifications;
    }

    // Restore the content
    ModeEditor.insert('math', this.model, state ? state.latex : '', {
      ...options,
      format: 'latex',
      insertionMode: 'replaceAll',
      selectionMode: 'after',
      smartFence: false,
    });

    // Restore the selection
    this.model.selection = state ? state.selection : { ranges: [[0, 0]] };

    this.model.suppressChangeNotifications = wasSuppressing;
  }
}
