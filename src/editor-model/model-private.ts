import type {
  Model,
  Mathfield,
  Offset,
  Range,
  Selection,
  OutputFormat,
} from '../public/mathfield';
import type {
  ContentChangeOptions,
  ContentChangeType,
} from '../public/options';
import type { ParseMode } from '../public/core-types';

import type { MathfieldPrivate } from '../editor-mathfield/mathfield-private';

import { Atom, ToLatexOptions } from '../core/atom-class';
import { joinLatex } from '../core/tokenizer';
import { Mode } from '../core/modes';
import { AtomJson, BranchName, fromJson } from '../core/atom';

import { toMathML } from '../addons/math-ml';

import { atomToAsciiMath } from '../editor/atom-to-ascii-math';
import { atomToSpeakableText } from '../editor/atom-to-speakable-text';
import { defaultAnnounceHook } from '../editor/a11y';

import {
  contentDidChange,
  contentWillChange,
  ModelListeners,
  selectionDidChange,
} from './listeners';
import { isOffset, isSelection, isRange, AnnounceVerb } from './utils';
import { compareSelection, range } from './selection-utils';
import type { ArrayAtom } from '../core-atoms/array';
import { LatexAtom } from '../core-atoms/latex';

export type ModelState = {
  content: AtomJson;
  selection: Selection;
  mode: ParseMode;
};

export type GetAtomOptions = {
  includeChildren?: boolean;
};

/** @internal */
export class ModelPrivate implements Model {
  readonly mathfield: MathfieldPrivate;

  mode: ParseMode;

  silenceNotifications: boolean;
  readonly listeners: ModelListeners;

  root: Atom;

  private _selection: Selection;
  private _anchor: Offset;
  private _position: Offset;

  constructor(
    target: Mathfield,
    mode: ParseMode,
    root: Atom,
    listeners: ModelListeners
  ) {
    this.mathfield = target as MathfieldPrivate;

    this.mode = mode;
    this.silenceNotifications = false;

    this.listeners = listeners;

    this._selection = { ranges: [[0, 0]], direction: 'none' };
    this._anchor = 0;
    this._position = 0;

    this.root = root;
  }

  dispose(): void {
    (this as any).mathfield = undefined;
    (this as any).listeners.onSelectionDidChange = undefined;
    (this as any).listeners.onContentWillChange = undefined;
  }

  getState(): ModelState {
    const selection: Selection = { ranges: [...this._selection.ranges] };
    if (this.selection.direction && this.selection.direction !== 'none')
      selection.direction = this.selection.direction;

    return {
      content: this.root.toJson(),
      selection,
      mode: this.mode,
    };
  }

  setState(
    state: ModelState,
    options?: {
      silenceNotifications?: boolean;
      type?: 'redo' | 'undo';
    }
  ): void {
    const wasSuppressing = this.silenceNotifications;
    this.silenceNotifications = options?.silenceNotifications ?? true;
    let changeOption: ContentChangeOptions = {};
    if (options?.type === 'undo') changeOption = { inputType: 'historyUndo' };
    if (options?.type === 'redo') changeOption = { inputType: 'historyRedo' };
    // Restore the content and selection
    if (contentWillChange(this, changeOption)) {
      const didSuppress = this.silenceNotifications;
      this.silenceNotifications = true;
      this.mode = state.mode;
      this.root = fromJson(state.content);
      this.selection = state.selection;
      this.silenceNotifications = didSuppress;
      contentDidChange(this, changeOption);
    }
    this.silenceNotifications = wasSuppressing;
  }

  get atoms(): Atom[] {
    return this.root.children;
  }

  /**
   * The selection, accounting for the common ancestors
   */
  get selection(): Selection {
    return this._selection;
  }

  set selection(value: Selection) {
    this.setSelection(value);
  }

  setSelection(from: Offset, to: Offset): boolean;
  setSelection(range: Range): boolean;
  setSelection(selection: Selection): boolean;
  setSelection(arg1: Offset | Range | Selection, arg2?: Offset): boolean {
    if (!this.mathfield.contentEditable && this.mathfield.userSelect === 'none')
      return false;
    return this.deferNotifications({ selection: true }, () => {
      //
      // 1/ Normalize the input
      // (account for offset < 0, etc...)
      //
      const value = this.normalizeSelection(arg1, arg2);

      if (value === undefined) throw new TypeError('Invalid selection');
      //
      // 2/ Short-circuit a common case...
      //
      if (
        value.ranges.length === 1 &&
        value.ranges[0][0] === value.ranges[0][1]
      ) {
        const pos = value.ranges[0][0];
        // Are we attempting to set the caret outside a prompt
        // (while in prompt mode)?
        if (
          !this.mathfield.dirty &&
          !this.at(pos)?.parentPrompt &&
          this.mathfield.hasEditablePrompts
        ) {
          if (this.at(pos - 1)?.parentPrompt) {
            this._anchor = this.normalizeOffset(pos - 1);
            this._position = this._anchor;
            this._selection = this.normalizeSelection(this._anchor);
            return true;
          }

          if (this.at(pos + 1)?.parentPrompt) {
            this._anchor = this.normalizeOffset(pos + 1);
            this._position = this._anchor;
            this._selection = this.normalizeSelection(this._anchor);
            return true;
          }
          this._anchor = 0;
          this._position = 0;
          this._selection = { ranges: [[0, 0]] };
          return false;
        }
        this._anchor = pos;
        this._position = pos;
        this._selection = value;
        return false;
      }

      //
      // 2b/ Determine the anchor and position
      // (smallest, largest offsets, oriented as per `direction`)
      //
      const selRange = range(value);
      if (value.direction === 'backward')
        [this._position, this._anchor] = selRange;
      else [this._anchor, this._position] = selRange;

      const first = this.at(selRange[0] + 1);
      const last = this.at(selRange[1]);

      const commonAncestor = Atom.commonAncestor(first, last);
      if (
        commonAncestor?.type === 'array' &&
        first.parent === commonAncestor &&
        last.parent === commonAncestor
      ) {
        // 3a/ If the parent of all the ranges is an array...
        // Make a rectangular selection based on the col/row of the anchor
        // and cursor
        // @todo array
        this._selection = { ranges: [selRange], direction: value.direction };
      } else
        this._selection = { ranges: [selRange], direction: value.direction };

      console.assert(this._position >= 0 && this._position <= this.lastOffset);
      return false;
    });
  }

  setPositionHandlingPlaceholder(pos: Offset): void {
    const atom = this.at(pos);
    if (atom?.type === 'placeholder') {
      // We're going right of a placeholder: select it
      this.setSelection(pos - 1, pos);
    } else if (atom?.rightSibling?.type === 'placeholder') {
      // We're going left of a placeholder: select it
      this.setSelection(pos, pos + 1);
    } else this.position = pos;

    if (atom instanceof LatexAtom && atom.isSuggestion)
      atom.isSuggestion = false;

    this.mathfield.stopCoalescingUndo();
  }

  /**
   * The "focus" or "cursor" (i.e. not the anchor) a.k.a the insertion point
   * or caret: where things are going to be inserted next.
   *
   */
  get position(): Offset {
    return this._position;
  }

  set position(value: Offset) {
    this.setSelection(value, value);
  }

  /**
   * The offset from which the selection is extended
   */
  get anchor(): Offset {
    return this._anchor;
  }

  get selectionIsCollapsed(): boolean {
    return this._anchor === this._position;
  }

  get selectionIsPlaceholder(): boolean {
    if (Math.abs(this._anchor - this._position) === 1) {
      return (
        this.at(Math.max(this._anchor, this._position)).type === 'placeholder'
      );
    }

    return false;
  }

  collapseSelection(direction: 'forward' | 'backward' = 'forward'): boolean {
    if (this._anchor === this._position) return false;
    if (direction === 'backward')
      this.position = Math.min(this._anchor, this._position);
    else this.position = Math.max(this._anchor, this._position);

    return true;
  }

  get lastOffset(): Offset {
    return this.atoms.length - 1;
  }

  at(index: number): Atom {
    return this.atoms[index];
  }

  offsetOf(atom: Atom): Offset {
    return this.atoms.indexOf(atom);
  }

  getSiblingsRange(offset: Offset): Range {
    const atom: Atom = this.at(offset);
    const { parent } = atom;
    if (!parent) return [0, this.lastOffset];
    const branch = atom.parent!.branch(atom.parentBranch!)!;
    return [this.offsetOf(branch[0]), this.offsetOf(branch[branch.length - 1])];
  }

  getBranchRange(offset: Offset, branchName: BranchName): Range {
    const branch = this.at(offset).branch(branchName)!;
    return [this.offsetOf(branch[0]), this.offsetOf(branch[branch.length - 1])];
  }

  /**
   * Return the atoms in a range.
   * getAtoms([3, 5]) -> atoms 4 and 5
   * getAtoms(3, 5) -> atoms 4 and 5
   * getAtom(3) -> all atoms, starting at 4 till lastOffset, then 0 to 3
   * getAtoms(3, -1) -> all atoms after 3 till lastOffset
   * getAtoms(-5, -2) -> all atoms between lastOffset - 4 and lastOffset - 1
   * Note that an atom with children is included in the result only if
   * all its children are in range.
   */
  getAtoms(arg: Selection, options?: GetAtomOptions): Atom[];
  getAtoms(arg: Range, options?: GetAtomOptions): Atom[];
  getAtoms(from: Offset, to?: Offset, options?: GetAtomOptions): Atom[];
  getAtoms(
    arg1: Selection | Range | Offset,
    arg2?: Offset | GetAtomOptions,
    arg3?: GetAtomOptions
  ): Atom[] {
    let options = arg3 ?? {};
    if (isSelection(arg1)) {
      options = (arg2 as GetAtomOptions) ?? {};
      if (arg1.ranges.length > 1) {
        return arg1.ranges.reduce(
          (acc: Atom[], range) => [...acc, ...this.getAtoms(range, options)],
          []
        );
      }

      arg1 = arg1.ranges[0];
    }

    let start: number;
    let end: number;
    if (isOffset(arg1)) {
      start = arg1;
      if (!isOffset(arg2)) return [];
      end = arg2;
    } else {
      [start, end] = arg1;
      options = (arg2 as GetAtomOptions) ?? {};
    }

    if (!Number.isFinite(start)) return [];

    if (options.includeChildren === undefined) options.includeChildren = false;

    if (start < 0) start = this.lastOffset - start + 1;
    if (end < 0) end = this.lastOffset - end + 1;
    const first = Math.min(start, end) + 1;
    const last = Math.max(start, end);

    // If this is the entire selection, return the root
    if (first === 1 && last === this.lastOffset) return [this.root];

    let result: Atom[] = [];
    for (let i = first; i <= last; i++) {
      const atom = this.atoms[i];
      if (atomIsInRange(this, atom, first, last)) result.push(atom);
    }

    if (!options.includeChildren) {
      // Remove any atoms whose ancestor is also included
      result = result.filter((atom) => {
        let ancestorIncluded = false;
        let { parent } = atom;
        while (parent && !ancestorIncluded) {
          ancestorIncluded = atomIsInRange(this, parent, first, last);
          parent = parent.parent;
        }

        return !ancestorIncluded;
      });
    }

    return result;
  }

  /**
   * Unlike `getAtoms()`, the argument here is an index
   * Return all the atoms, in order, starting at startingIndex
   * then looping back at the beginning
   */
  getAllAtoms(startingIndex = 0): Atom[] {
    const result: Atom[] = [];
    const last = this.lastOffset;
    for (let i = startingIndex; i <= last; i++) result.push(this.atoms[i]);

    for (let i = 0; i < startingIndex; i++) result.push(this.atoms[i]);

    return result;
  }

  findAtom(
    filter: (x: Atom) => boolean,
    startingIndex = 0,
    direction: 'forward' | 'backward' = 'forward'
  ): Atom | undefined {
    if (direction === 'forward') {
      const last = this.lastOffset;
      for (let i = startingIndex; i <= last; i++)
        if (filter(this.atoms[i])) return this.atoms[i];

      for (let i = 0; i < startingIndex; i++)
        if (filter(this.atoms[i])) return this.atoms[i];
      return undefined;
    }

    for (let i = startingIndex; i >= 0; i--)
      if (filter(this.atoms[i])) return this.atoms[i];

    for (let i = this.lastOffset; i < startingIndex; i--)
      if (filter(this.atoms[i])) return this.atoms[i];

    return undefined;
  }

  /** Remove the specified atoms from the tree.
   * **WARNING** upon return the selection may now be invalid
   */
  extractAtoms(range: Range): Atom[] {
    let result = this.getAtoms(range);
    if (result.length === 1 && !result[0].parent) {
      // We're trying to extract the root.
      // Don't actually delete the root, delete all the children of the root.
      if (result[0].type === 'root') {
        result = [...result[0].body!];
        result.shift();
      } else {
        // If the root is an array, replace with a plain root
        result = (this.root as ArrayAtom).cells.flat();
        this.root = new Atom({ type: 'root', body: [] });
        return result;
      }
    }
    for (const child of result) child.parent!.removeChild(child);
    return result;
  }

  deleteAtoms(range: Range): void {
    this.extractAtoms(range);
    this.position = range[0];
  }

  atomToString(atom: Atom, inFormat: OutputFormat): string {
    const format: string = inFormat ?? 'latex';

    if (format.startsWith('latex')) {
      return joinLatex(
        Mode.serialize([atom], {
          expandMacro: format === 'latex-expanded',
          skipStyles: format === 'latex-unstyled',
          defaultMode: this.mathfield.options.defaultMode,
        })
      );
    }

    if (format === 'math-ml') return toMathML(atom);

    if (format === 'spoken') return atomToSpeakableText(atom);

    if (format === 'spoken-text') {
      const saveTextToSpeechMarkup = window.MathfieldElement.textToSpeechMarkup;
      window.MathfieldElement.textToSpeechMarkup = '';
      const result = atomToSpeakableText(atom);
      window.MathfieldElement.textToSpeechMarkup = saveTextToSpeechMarkup;
      return result;
    }

    if (
      format === 'spoken-ssml' ||
      format === 'spoken-ssml-with-highlighting'
    ) {
      const saveTextToSpeechMarkup = window.MathfieldElement.textToSpeechMarkup;
      // Const savedAtomIdsSettings = this.config.atomIdsSettings;    // @revisit
      window.MathfieldElement.textToSpeechMarkup = 'ssml';
      // If (format === 'spoken-ssml-with-highlighting') {     // @revisit
      //     this.config.atomIdsSettings = { seed: 'random' };
      // }
      const result = atomToSpeakableText(atom);
      window.MathfieldElement.textToSpeechMarkup = saveTextToSpeechMarkup;
      // This.config.atomIdsSettings = savedAtomIdsSettings;      // @revisit
      return result;
    }

    if (format === 'math-json') {
      if (!window.MathfieldElement.computeEngine) {
        if (!window[Symbol.for('io.cortexjs.compute-engine')]) {
          console.error(
            'The CortexJS Compute Engine library is not available.\nLoad the library, for example with:\nimport "https://unpkg.com/@cortex-js/compute-engine?module"'
          );
        }
        return '["Error", "compute-engine-not-available"]';
      }
      try {
        const expr = window.MathfieldElement.computeEngine.parse(
          Atom.serialize(atom, { expandMacro: false, defaultMode: 'math' })
        );
        return JSON.stringify(expr.json);
      } catch (e) {
        return JSON.stringify(['Error', `'${e.toString()}'`]);
      }
    }

    if (format === 'ascii-math') return atomToAsciiMath(atom);

    console.error(`MathLive {{SDK_VERSION}}: Unknown format "${format}`);
    return '';
  }

  getValue(): string;
  getValue(format: OutputFormat): string;
  getValue(start: Offset, end: Offset, format?: OutputFormat): string;
  getValue(range: Range, format?: OutputFormat): string;
  getValue(selection: Selection, format?: OutputFormat): string;
  getValue(
    arg1?: Offset | OutputFormat | Range | Selection,
    arg2?: Offset | OutputFormat,
    arg3?: OutputFormat
  ): string;
  getValue(
    arg1?: Offset | OutputFormat | Range | Selection,
    arg2?: Offset | OutputFormat,
    arg3?: OutputFormat
  ): string {
    // GetValue()
    if (arg1 === undefined) return this.atomToString(this.root, 'latex');

    // GetValue(format): Output format only
    if (typeof arg1 === 'string') return this.atomToString(this.root, arg1);

    let ranges: Range[];
    let format: OutputFormat;
    if (isOffset(arg1) && isOffset(arg2)) {
      ranges = [this.normalizeRange([arg1, arg2])];
      format = arg3 ?? 'latex';
    } else if (isRange(arg1)) {
      ranges = [this.normalizeRange(arg1)];
      format = arg2 as OutputFormat;
    } else if (isSelection(arg1)) {
      ranges = arg1.ranges;
      format = arg2 as OutputFormat;
    } else {
      ranges = [];
      format = 'latex';
    }

    if (format.startsWith('latex')) {
      const options: ToLatexOptions = {
        expandMacro: format === 'latex-expanded',
        skipStyles: format === 'latex-unstyled',
        defaultMode: this.mathfield.options.defaultMode,
      };
      return joinLatex(
        ranges.map((range) => Atom.serialize(this.getAtoms(range), options))
      );
    }

    return ranges
      .map((range): string =>
        this.getAtoms(range)
          .map((atom) => this.atomToString(atom, format))
          .join('')
      )
      .join('');
  }

  /**
   * Unlike `setSelection`, this method is intended to be used in response
   * to a user action, and it performs various adjustments to result
   * in a more intuitive selection.
   * For example:
   * - when all the children of an atom are selected, the atom
   * become selected.
   * - this method will *not* change the anchor, but may result
   * in a selection whose boundary is outside the anchor
   */
  extendSelectionTo(anchor: Offset, position: Offset): boolean {
    if (!this.mathfield.contentEditable && this.mathfield.userSelect === 'none')
      return false;
    return this.deferNotifications({ selection: true }, () => {
      const range = this.normalizeRange([anchor, position]);
      let [start, end] = range;

      // Include the parent if all the children are selected
      let { parent } = this.at(end);
      if (parent) {
        if (parent.type === 'genfrac' || parent.type === 'subsup') {
          while (
            parent !== this.root &&
            childrenInRange(this, parent!, [start, end])
          ) {
            end = this.offsetOf(parent!);
            parent = parent!.parent;
          }
        }
      }
      parent = this.at(start).parent;
      while (
        parent !== this.root &&
        childrenInRange(this, parent!, [start, end])
      ) {
        start = this.offsetOf(parent!.leftSibling);
        parent = parent!.parent;
      }

      // Now that the start has potentially changed, check again
      // if end needs to be updated
      parent = this.at(end).parent;
      if (parent?.type === 'genfrac') {
        while (
          parent !== this.root &&
          childrenInRange(this, parent!, [start, end])
        ) {
          end = this.offsetOf(parent!);
          console.assert(end >= 0);
          parent = parent!.parent;
        }
      }
      this._position = this.normalizeOffset(position);
      this._selection = {
        ranges: [[start, end]],
        direction: 'none',
      };
    });
  }

  /**
   * This method is called to provide feedback when using a screen reader
   * or other assistive device, for example when changing the selection or
   * moving the insertion point.
   *
   * It can also be used with the 'plonk' command to provide an audible
   * feedback when a command is not possible.
   *
   * This method should not be called from other methods of the model
   * (such as `setSelection`) as these methods can also be called
   * programmatically and a feedback in these case would be innapropriate,
   * however they should be called from functions called as a result of a user
   * action, such as the functions in `commands.ts`
   */
  announce(
    command: AnnounceVerb,
    previousPosition?: number,
    atoms: Atom[] = []
  ): void {
    const result =
      this.mathfield.host?.dispatchEvent(
        new CustomEvent('announce', {
          detail: { command, previousPosition, atoms },
          cancelable: true,
          bubbles: true,
          composed: true,
        })
      ) ?? true;
    if (result)
      defaultAnnounceHook(this.mathfield, command, previousPosition, atoms);
  }

  // Suppress notification while scope is executed,
  // then notify of content change, and selection change (if actual change)
  deferNotifications(
    options: {
      content?: boolean;
      selection?: boolean;
      type?: ContentChangeType;
      data?: string;
    },
    f: () => void
  ): boolean {
    const oldSelection = this._selection;
    const oldAnchor = this._anchor;
    const oldPosition = this._position;

    const saved = this.silenceNotifications;
    this.silenceNotifications = true;
    const previousCounter = this.root.changeCounter;

    f();

    const contentChanged = this.root.changeCounter !== previousCounter;
    const selectionChanged =
      oldAnchor !== this._anchor ||
      oldPosition !== this._position ||
      compareSelection(this._selection, oldSelection) === 'different';

    this.silenceNotifications = saved;

    // Notify of content change, if requested
    if (options.content && contentChanged)
      contentDidChange(this, { inputType: options.type });

    // If the selection has effectively changed, notify
    if (options.selection && selectionChanged) selectionDidChange(this);

    return contentChanged || selectionChanged;
  }

  normalizeOffset(value: Offset): Offset {
    if (value > 0) value = Math.min(value, this.lastOffset);
    else if (value < 0) value = this.lastOffset + value + 1;

    return value;
  }

  /**
   * Ensure that the range is valid and canonical, i.e.
   * - start <= end
   * - collapsed = start === end
   * - start >= 0, end >=0
   */
  normalizeRange(range: Range): Range {
    // 1. Normalize the offsets
    let [start, end] = range;
    start = this.normalizeOffset(start);
    end = this.normalizeOffset(end);

    return start < end ? [start, end] : [end, start];
  }

  normalizeSelection(
    value: Offset | Range | Selection,
    value2?: Offset
  ): Selection {
    let result: Selection | undefined = undefined;
    if (isOffset(value)) {
      const offset = this.normalizeOffset(value);
      if (isOffset(value2)) {
        const offset2 = this.normalizeOffset(value2);
        result =
          offset <= offset2
            ? { ranges: [[offset, offset2]], direction: 'none' }
            : {
                ranges: [[offset2, offset]],
                direction: 'backward',
              };
      } else result = { ranges: [[offset, offset]], direction: 'none' };
    } else if (isRange(value)) {
      const start = this.normalizeOffset(value[0]);
      const end = this.normalizeOffset(value[1]);
      result =
        start <= end
          ? { ranges: [[start, end]], direction: 'none' }
          : { ranges: [[end, start]], direction: 'backward' };
    } else if (isSelection(value)) {
      result = {
        ranges: value.ranges.map((x) => this.normalizeRange(x)),
        direction: value.direction ?? 'none',
      };
    }
    console.assert(result !== undefined);
    return result!;
  }

  /** Returns the first ArrayAtom in ancestry of current position */
  get parentEnvironment(): ArrayAtom | undefined {
    let parent = this.at(this.position).parent;
    if (!parent) return undefined;

    while (parent.parent && parent.type !== 'array') parent = parent.parent;

    if (parent.type !== 'array') return undefined;

    return parent as ArrayAtom;
  }
}

function atomIsInRange(
  model: ModelPrivate,
  atom: Atom,
  first: Offset,
  last: Offset
): boolean {
  const offset = model.offsetOf(atom);
  if (offset < first || offset > last) return false;

  if (!atom.hasChildren) return true;

  const firstOffset = model.offsetOf(atom.firstChild);
  if (firstOffset >= first && firstOffset <= last) {
    const lastOffset = model.offsetOf(atom.lastChild);
    if (lastOffset >= first && lastOffset <= last) return true;
  }

  return false;
}

function childrenInRange(
  model: ModelPrivate,
  atom: Atom,
  range: Range
): boolean {
  if (!atom?.hasChildren) return false;
  const [start, end] = range;
  const first = model.offsetOf(atom.firstChild);
  const last = model.offsetOf(atom.lastChild);
  if (first >= start && first <= end && last >= first && last <= end)
    return true;

  return false;
}
