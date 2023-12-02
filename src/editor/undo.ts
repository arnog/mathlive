import type { ModelState } from 'editor-model/types';
import type { _Model } from '../editor-model/model-private';

import type { Selection } from '../public/mathfield';

export class UndoManager {
  // Maximum number of undo/redo states
  static readonly maximumDepth = 1000;

  private model: _Model;

  private recording = false;

  // Stack of undo/redo states.
  // The state pointed at by `index` represent the current state of
  // the model.
  // The one at `index - 1` is the last snapshot to be used for undo.
  private stack: ModelState[];

  // The current record in the undo/redo stack
  private index: number;

  // The last operation recorded. If the next operation is of the same
  // category (has the same "op" value), it gets coalesced with the previous
  // one.
  private lastOp: string;

  constructor(model: _Model) {
    this.model = model;
    this.reset();
  }

  reset(): void {
    this.stack = [];
    this.index = -1;
    this.lastOp = '';
  }

  startRecording(): void {
    this.recording = true;
  }

  stopRecording(): void {
    this.recording = false;
  }

  canUndo(): boolean {
    return this.index - 1 >= 0;
  }

  canRedo(): boolean {
    return this.stack.length - 1 > this.index;
  }

  /** Call this to stop coalescing future ops, for example when the selection
   * changes
   */
  stopCoalescing(selection?: Selection): void {
    if (selection && this.index >= 0)
      this.stack[this.index].selection = selection;
    this.lastOp = '';
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    this.model.setState(this.stack[this.index - 1], {
      silenceNotifications: false,
      type: 'undo',
    });

    this.index -= 1;
    this.lastOp = '';

    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;

    this.index += 1;
    this.model.setState(this.stack[this.index], {
      silenceNotifications: false,
      type: 'redo',
    });

    this.lastOp = '';

    return true;
  }

  pop(): void {
    if (!this.canUndo()) return;
    this.stack.splice(this.index, this.stack.length - this.index);
    this.index -= 1;
  }

  /**
   * Push a snapshot of the content and selection of the mathfield onto the
   * undo stack so that it can potentially be reverted to later.
   *
   * **Return** `true` if the undo state changed
   */
  snapshot(op?: string): boolean {
    if (!this.recording) return false;

    if (op && op === this.lastOp) this.pop();

    // Drop any entries that are part of the redo stack
    this.stack.splice(this.index + 1, this.stack.length - this.index - 1);

    // Add a new entry
    this.stack.push(this.model.getState());

    this.index += 1;

    // If we've reached the maximum number of undo operations, forget the
    // oldest one.
    if (this.stack.length > UndoManager.maximumDepth) {
      this.stack.shift();
      this.index -= 1;
    }

    this.lastOp = op ?? '';

    return true;
  }
}
