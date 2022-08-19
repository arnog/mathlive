import type { Selection } from '../public/mathfield';
import { ContentChangeOptions } from '../public/options';

import { AtomJson } from '../core/atom-class';
import { fromJson } from '../core/atom';

import type { ModelPrivate } from '../editor-model/model-private';
import { contentDidChange, contentWillChange } from '../editor-model/listeners';

export type UndoRecord = {
  content: AtomJson;
  selection: Selection;
};

interface UndoOptions {
  suppressChangeNotifications?: boolean;
  type?: 'redo' | 'undo';
}

export class UndoManager {
  private model: ModelPrivate;
  // Maximum number of undo/redo states
  private get maximumDepth() {
    return 1000;
  }

  private recording = false;
  private canCoalesce = false;
  private stack: UndoRecord[]; // Stack of undo/redo states
  private index: number; // Index pointing to the current record in the undo/redo stack

  constructor(model: ModelPrivate) {
    this.model = model;
    this.reset();
  }

  reset(): void {
    this.stack = [];
    this.index = -1;
  }

  startRecording(): void {
    this.recording = true;
  }

  canUndo(): boolean {
    return this.index > 0;
  }

  canRedo(): boolean {
    return this.index !== this.stack.length - 1;
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    this.restore(this.stack[this.index - 1], {
      suppressChangeNotifications: false,
      type: 'undo',
    });
    this.index -= 1;

    this.canCoalesce = false;
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;

    this.index += 1;
    this.restore(this.stack[this.index], {
      suppressChangeNotifications: false,
      type: 'redo',
    });

    this.canCoalesce = false;
    return true;
  }

  pop(): void {
    if (!this.canUndo()) return;
    this.index -= 1;
    this.stack.pop();
  }

  /**
   * Push a snapshot of the content and selection of the mathfield onto the
   * undo stack so that it can potentially be reverted to later.
   *
   * **Return** `true` if the undo state changed
   */
  snapshot(): boolean {
    if (!this.recording) return false;

    // Drop any entries that are part of the redo stack
    this.stack.splice(this.index + 1, this.stack.length - this.index - 1);

    // Add a new entry
    this.stack.push({
      content: this.model.root.toJson(),
      selection: this.model.selection,
    });

    this.index++;

    // If we've reached the maximum number of undo operations, forget the
    // oldest one.
    if (this.stack.length > this.maximumDepth) this.stack.shift();

    this.canCoalesce = false;

    return true;
  }

  snapshotAndCoalesce(): boolean {
    if (!this.recording) return false;

    if (this.canCoalesce) this.pop();

    const result = this.snapshot();
    this.canCoalesce = true;
    return result;
  }

  /**
   * Return an object capturing the state of the content and selection of the
   * mathfield. Pass this object to restore() to reset the value of the math
   * field to this saved value. This does not affect the undo stack.
   */
  save(): UndoRecord {
    return {
      content: this.model.root.toJson(),
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
    let changeOption: ContentChangeOptions = {};
    if (options.type === 'undo') changeOption = { inputType: 'historyUndo' };
    if (options.type === 'redo') changeOption = { inputType: 'historyRedo' };
    if (contentWillChange(this.model, changeOption)) {
      // Restore the content and selection
      this.model.root = fromJson(state.content, this.model.mathfield);
      this.model.selection = state.selection;

      contentDidChange(this.model, changeOption);
    }

    this.model.suppressChangeNotifications = wasSuppressing;
  }
}
