import type {
  Model,
  Mathfield,
  Offset,
  Range,
  Selection,
  OutputFormat,
} from '../public/mathfield';

import type { MathfieldPrivate } from '../editor-mathfield/mathfield-private';

import { Atom, Branch, ToLatexOptions } from '../core/atom-class';
import { joinLatex } from '../core/tokenizer';

import { atomtoMathJson } from '../addons/math-json';
import { atomsToMathML } from '../addons/math-ml';

import { atomToAsciiMath } from '../editor/atom-to-ascii-math';
import { atomToSpeakableText } from '../editor/atom-to-speakable-text';

import {
  contentDidChange,
  ModelListeners,
  selectionDidChange,
} from './listeners';
import {
  ModelOptions,
  ModelHooks,
  isOffset,
  isSelection,
  isRange,
  AnnounceVerb,
} from './utils';
import { compareSelection, range } from './selection-utils';

export type GetAtomOptions = {
  includeChildren?: boolean;
};

export class ModelPrivate implements Model {
  readonly mathfield: MathfieldPrivate;
  readonly options: ModelOptions;
  listeners: ModelListeners;
  hooks: Required<ModelHooks>;

  root: Atom;
  suppressChangeNotifications: boolean;

  private _selection: Selection;
  private _anchor: Offset;
  private _position: Offset;

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
    this.root = new Atom('root', { mode: this.options.mode });
    this.root.body = [];
    this._selection = { ranges: [[0, 0]], direction: 'none' };
    this._anchor = 0;
    this._position = 0;

    this.setListeners(listeners);
    this.setHooks(hooks);
    this.mathfield = target as MathfieldPrivate;

    this.suppressChangeNotifications = false;
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
    return this.deferNotifications({ selection: true }, () => {
      //
      // 1/ Normalize the input
      // (account for offset < 0, etc...)
      //
      const value = this.normalizeSelection(arg1, arg2);

      if (value === undefined) {
        throw new TypeError('Invalid selection');
      }

      //
      // 2/ Short-circuit a common case...
      //
      if (
        value.ranges.length === 1 &&
        value.ranges[0][0] === value.ranges[0][1]
      ) {
        const pos = value.ranges[0][0];
        console.assert(pos >= 0 && pos <= this.lastOffset);
        this._position = pos;
        this._anchor = pos;
        this._selection = value;
      } else {
        //
        // 2b/ Determine the anchor and position
        // (smallest, largest offsets, oriented as per `direction`)
        //
        const selRange = range(value);
        if (value.direction === 'backward') {
          [this._position, this._anchor] = selRange;
        } else {
          [this._anchor, this._position] = selRange;
        }

        const first = this.at(selRange[0]);
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
        } else {
          this._selection = {
            ranges: [[this.offsetOf(first), this.offsetOf(last)]],
            direction: value.direction,
          };
          // 3b.3/ Adjust the position to match the selection
          if (value.direction === 'backward') {
            this._position = this._selection.ranges[0][0];
          } else {
            this._position = this._selection.ranges[0][1];
          }

          console.assert(
            this._position >= 0 && this._position <= this.lastOffset
          );
        }
      }
    });
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
    if (direction === 'backward') {
      this.position = Math.min(this._anchor, this._position);
    } else {
      this.position = Math.max(this._anchor, this._position);
    }

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
    const branch = atom.parent.branch(atom.treeBranch);
    return [this.offsetOf(branch[0]), this.offsetOf(branch[branch.length - 1])];
  }

  getBranchRange(offset: Offset, branchName: Branch): Range {
    const branch = this.at(offset).branch(branchName);
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

    if (options.includeChildren === undefined) {
      options.includeChildren = false;
    }

    if (start < 0) start = this.lastOffset - start + 1;
    if (end < 0) end = this.lastOffset - end + 1;
    const first = Math.min(start, end) + 1;
    const last = Math.max(start, end);

    let result: Atom[] = [];
    for (let i = first; i <= last; i++) {
      const atom = this.atoms[i];
      if (atomIsInRange(this, atom, first, last)) {
        result.push(atom);
      }
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
  getAllAtoms(startingIndex: number): Atom[] {
    const result: Atom[] = [];
    const last = this.lastOffset;
    for (let i = startingIndex; i <= last; i++) {
      result.push(this.atoms[i]);
    }

    for (let i = 0; i < startingIndex; i++) {
      result.push(this.atoms[i]);
    }

    return result;
  }

  extractAtoms(range: Range): Atom[] {
    const result = this.getAtoms(range);
    result.forEach((x) => x.parent.removeChild(x));
    return result;
  }

  deleteAtoms(range: Range): Offset {
    this.extractAtoms(range);
    return range[0];
  }

  atomToString(atom: Atom, format: OutputFormat): string {
    format = format ?? 'latex';
    let result = '';
    if (format === 'latex' || format === 'latex-expanded') {
      result = Atom.toLatex(atom, {
        expandMacro: format === 'latex-expanded',
      });
    } else if (format === 'mathML') {
      result = atomsToMathML(atom, this.mathfield.options);
    } else if (format === 'spoken') {
      result = atomToSpeakableText(atom, this.mathfield.options);
    } else if (format === 'spoken-text') {
      const saveTextToSpeechMarkup = this.mathfield.options.textToSpeechMarkup;
      this.mathfield.options.textToSpeechMarkup = '';
      result = atomToSpeakableText(atom, this.mathfield.options);
      this.mathfield.options.textToSpeechMarkup = saveTextToSpeechMarkup;
    } else if (
      format === 'spoken-ssml' ||
      format === 'spoken-ssml-withHighlighting'
    ) {
      const saveTextToSpeechMarkup = this.mathfield.options.textToSpeechMarkup;
      // Const savedAtomIdsSettings = this.config.atomIdsSettings;    // @revisit
      this.mathfield.options.textToSpeechMarkup = 'ssml';
      // If (format === 'spoken-ssml-withHighlighting') {     // @revisit
      //     this.config.atomIdsSettings = { seed: 'random' };
      // }
      result = atomToSpeakableText(atom, this.mathfield.options);
      this.mathfield.options.textToSpeechMarkup = saveTextToSpeechMarkup;
      // This.config.atomIdsSettings = savedAtomIdsSettings;      // @revisit
    } else if (format === 'json') {
      console.log('deprecated format. Use MathJSON');
      const json = atomtoMathJson(atom);
      result = JSON.stringify(json);
    } else if (format === 'json-2') {
      console.log('deprecated format. Use MathJSON');
      const json = atomtoMathJson(atom);
      // Const json = parseLatex(root.toLatex(true), {
      //     form: 'canonical',
      // });
      result = JSON.stringify(json, null, 2);
    } else if (format === 'ASCIIMath') {
      result = atomToAsciiMath(atom);
    } else {
      console.warn('Unknown format :', format);
    }

    return result;
  }

  // GetValue(): string;
  // getValue(format: OutputFormat): string;
  // getValue(start: Offset, end: Offset, format?: OutputFormat): string;
  // getValue(range: Range, format?: OutputFormat): string;
  // getValue(selection: Selection, format?: OutputFormat): string;
  getValue(
    arg1?: Offset | OutputFormat | Range | Selection,
    arg2?: Offset | OutputFormat,
    arg3?: OutputFormat
  ): string {
    if (arg1 === undefined) {
      // GetValue()
      return this.atomToString(this.root, 'latex');
    }

    if (typeof arg1 === 'string') {
      // GetValue(format): Output format only
      return this.atomToString(this.root, arg1);
    }

    let ranges: Range[];
    let format: OutputFormat;
    if (isOffset(arg1) && isOffset(arg2)) {
      ranges = [this.normalizeRange([arg1, arg2])];
      format = arg3;
    } else if (isRange(arg1)) {
      ranges = [this.normalizeRange(arg1)];
      format = arg2 as OutputFormat;
    } else if (isSelection(arg1)) {
      ranges = arg1.ranges;
      format = arg2 as OutputFormat;
    }

    format = format ?? 'latex';
    if (format === 'latex' || format === 'latex-expanded') {
      const options: ToLatexOptions = {
        expandMacro: format === 'latex-expanded',
      };
      return joinLatex(
        ranges.map((range) => Atom.toLatex(this.getAtoms(range), options))
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
   * Method called in response to a user interaction
   */
  extendSelection(direction: 'forward' | 'backward'): boolean {
    let anchor = this._anchor;
    // Keep the anchor anchored, move the position forward or back
    if (direction === 'forward') {
      let pos = this._position;
      do {
        pos++;
      } while (pos <= this.lastOffset && this.at(pos).isFirstSibling);

      if (pos === anchor - 1 && this.at(anchor).type === 'first') {
        pos = anchor;
      }

      return this.extendSelectionTo(anchor, pos);
    }

    //
    // Extending backward
    //
    let pos = this._position - 1;

    if (pos < 0) return false;

    while (pos >= 0 && this.at(pos).isLastSibling) {
      pos--;
    }

    if (pos < 0) pos = 0;

    if (pos === anchor + 1 && this.at(pos).type === 'first') {
      anchor = pos;
    }

    return this.extendSelectionTo(anchor, pos);
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
    return this.deferNotifications({ selection: true }, () => {
      const range = this.normalizeRange([anchor, position]);
      let [start, end] = range;

      // Include the parent if all the chidlren are selected
      let { parent } = this.at(end);
      while (
        parent !== this.root &&
        childrenInRange(this, parent, [start, end])
      ) {
        end = this.offsetOf(parent);
        parent = parent.parent;
      }

      parent = this.at(start).parent;
      while (
        parent !== this.root &&
        childrenInRange(this, parent, [start, end])
      ) {
        start = this.offsetOf(parent.leftSibling);
        parent = parent.parent;
      }

      // Now that the start has potentially changed, check again
      // if end needs to be updated
      parent = this.at(end).parent;
      while (
        parent !== this.root &&
        childrenInRange(this, parent, [start, end])
      ) {
        end = this.offsetOf(parent);
        console.assert(end >= 0);
        parent = parent.parent;
      }

      this._position = this.normalizeOffset(position);
      this._selection = {
        ranges: [[start, end]],
        direction: 'none',
      };
    });
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
            _previousPosition: number,
            _atoms: Atom[]
          ): void => {},
      moveOut: hooks?.moveOut ? hooks.moveOut : (): boolean => true,
      tabOut: hooks?.tabOut ? hooks.tabOut : (): boolean => true,
    };
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
    this.hooks.announce(this.mathfield, command, previousPosition, atoms);
  }

  // Suppress notification while scope is executed,
  // then notify of content change, and selection change (if actual change)
  deferNotifications(
    options: { content?: boolean; selection?: boolean },
    f: () => void
  ): boolean {
    const oldSelection = this._selection;
    const oldAnchor = this._anchor;
    const oldPosition = this._position;
    let selectionChanged = false;

    const saved = this.suppressChangeNotifications;
    this.suppressChangeNotifications = true;
    const previousCounter = this.root.changeCounter;
    f();

    const contentChanged = this.root.changeCounter !== previousCounter;
    if (
      oldAnchor !== this._anchor ||
      oldPosition !== this._position ||
      compareSelection(this._selection, oldSelection) === 'different'
    ) {
      selectionChanged = true;
    }

    this.suppressChangeNotifications = saved;
    if (!this.suppressChangeNotifications) {
      // Notify of content change, if requested
      if (options.content && contentChanged) {
        contentDidChange(this);
      }

      // If the selection has effectively changed, notify
      if (options.selection && selectionChanged) {
        selectionDidChange(this);
      }
    }

    return contentChanged || selectionChanged;
  }

  normalizeOffset(value: Offset): Offset {
    if (value > 0) {
      value = Math.min(value, this.lastOffset);
    } else if (value < 0) {
      value = this.lastOffset + value + 1;
    }

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
    let result: Selection;
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
      } else {
        result = { ranges: [[offset, offset]], direction: 'none' };
      }
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

    return result;
  }
}

function atomIsInRange(
  model: ModelPrivate,
  atom: Atom,
  first: Offset,
  last: Offset
): boolean {
  const offset = model.offsetOf(atom);
  if (offset < first || offset > last) {
    return false;
  }

  if (!atom.hasChildren) return true;

  const firstOffset = model.offsetOf(atom.firstChild);
  if (firstOffset >= first && firstOffset <= last) {
    const lastOffset = model.offsetOf(atom.lastChild);
    if (lastOffset >= first && lastOffset <= last) {
      return true;
    }
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
  if (first >= start && first <= end && last >= first && last <= end) {
    return true;
  }

  return false;
}
