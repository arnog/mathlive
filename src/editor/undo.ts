import type { ModelPrivate, ModelState } from '../editor-model/model-private';

export class UndoManager {
  private model: ModelPrivate;
  // Maximum number of undo/redo states
  private get maximumDepth() {
    return 1000;
  }

  private recording = false;
  private canCoalesce = false;
  private stack: ModelState[]; // Stack of undo/redo states
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

    this.model.setState(this.stack[this.index - 1], {
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
    this.model.setState(this.stack[this.index], {
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
    this.stack.push(this.model.getState());

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
}
