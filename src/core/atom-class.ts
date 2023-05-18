import type {
  ParseMode,
  Style,
  FontSize,
  LatexValue,
} from '../public/core-types';

import { PT_PER_EM, X_HEIGHT } from './font-metrics';
import { boxType, Box } from './box';
import { makeLimitsStack, VBox } from './v-box';
import { joinLatex, latexCommand } from './tokenizer';
import { Mode } from './modes-utils';
import {
  Argument,
  getDefinition,
  unicodeCharToLatex,
} from '../core-definitions/definitions-utils';

import { Context } from './context';
import { PrivateStyle, BoxType } from './types';

/**
 * This data type is used as a serialized representation of the atom tree.
 * This is used by the Undo Manager to store the state of the mathfield.
 * While in many cases the LaTeX representation of the mathfield could be used
 * there are a few cases where the atom will carry additional information
 * that is difficult/impossible to represent in pure LaTeX, for example
 * the state/content of empty branches.
 */
export type AtomJson = { type?: AtomType; [key: string]: any };

/**
 * Each atom can have one or more "branches" of child atoms.
 */
export type BranchName =
  | 'body'
  | 'above'
  | 'below'
  | 'superscript'
  | 'subscript';

/**
 * The order of these branches specify the default keyboard navigation order.
 * It can be overriden in `get children()`
 */
export const NAMED_BRANCHES: BranchName[] = [
  'body',
  'above',
  'below',
  'superscript',
  'subscript',
];

/**
 * In addition to a "named" branch, a branch can also be identified as a cell
 * in a tabular atom (matrix, etc...) with a row and column number.
 */
export type Branch = BranchName | [row: number, col: number];

/**
 * A _branch_ is a set of children of an atom.
 *
 * There are two kind of branches:
 * - **cell branches** are addressed with a column and row number and are
 * used by `ArrayAtom`
 * - **named branches** used with other kind of atoms. There is a fixed set of
 * possible named branches.
 */
export function isNamedBranch(branch: Branch): branch is BranchName {
  return typeof branch === 'string' && NAMED_BRANCHES.includes(branch);
}

export function isCellBranch(branch?: Branch): branch is [number, number] {
  return branch !== undefined && Array.isArray(branch) && branch.length === 2;
}

export type Branches = {
  [branch in BranchName]?: Atom[];
};

export type ToLatexOptions = {
  expandMacro?: boolean;
  // If true, don't emit color, backgroundcolor, fontsize commands
  skipStyles?: boolean;
  // Don't emit unnecessary style shift commands: you can assume we're in
  // this default mode.
  defaultMode: 'text' | 'math' | 'inline-math';
};

// IMPORTANT: when adding a new atom type, add its constructor to `toJson()`
// atom.ts
export type AtomType =
  | 'accent'
  | 'array' // A group, which has children arranged in rows. Used
  // by environments such as `matrix`, `cases`, etc...
  | 'box' // A border drawn around an expression and change its background color
  | 'chem' // A chemical formula (mhchem)
  | 'choice' // A \\mathchoice command
  | 'composition' // IME composition area
  | 'delim'
  | 'enclose'
  | 'error' //  An unknown command, for example `\xyzy`. The text  is displayed with a wavy red underline in the editor.
  | 'first' // A special, empty, atom put as the first atom in math lists in
  // order to be able to position the caret before the first element. Aside from
  // the caret, they display nothing.
  | 'genfrac' // A generalized fraction: a numerator and denominator, separated
  // by an optional line, and surrounded by optional fences
  | 'group' // A simple group of atoms, for example from a `{...}`
  | 'latex' // A raw latex atom
  | 'latexgroup' // A string of raw latex atoms
  | 'leftright' // Used by the `\left` and `\right` commands
  | 'line' // Used by `\overline` and `\underline`
  | 'macro'
  | 'macro-argument'
  | 'subsup' // A carrier for a superscript/subscript
  | 'overlap' // Display a symbol _over_ another
  | 'overunder' // Displays an annotation above or below a symbol
  | 'placeholder' // A temporary item. Placeholders are displayed as a dashed square in the editor.
  | 'phantom'
  | 'root' // A group, which has no parent (only one per formula)
  | 'rule' // Draw a line, for the `\rule` command
  | 'sizeddelim' // A delimiter that can grow
  | 'space'
  | 'spacing'
  | 'surd' // Aka square root, nth root
  | 'text' // Text mode atom;
  | 'tooltip' // For `\mathtip` and `\texttip`
  | 'prompt'
  /** The types below confound atom type and box type. They are all indicating
   * a probable Atom class, but with a different boxType (inter-atom spacing)
   */
  | 'mbin' // Binary operator: `+`, `*`, etc...
  | 'mclose' // Closing fence: `)`, `\rangle`, etc...
  | 'minner' // Special layout cases, fraction, overlap, `\left...\right`
  | 'mop' // `mop`: operators, including special functions, `\sin`, `\sum`, `\cap`.
  | 'mopen' // Opening fence: `(`, `\langle`, etc...
  | 'mord' // Ordinary symbol, e.g. `x`, `\alpha`
  | 'mpunct' // Punctuation: `,`, `:`, etc...
  | 'mrel'; // Relational operator: `=`, `\ne`, etc...

export type BBoxParameter = {
  backgroundcolor?: LatexValue;
  padding?: LatexValue;
  border?: string;
};

export type CreateAtomOptions<
  T extends (Argument | null)[] = (Argument | null)[]
> = {
  mode?: ParseMode;
  command?: string;
  style?: Style;
  args?: T;
};

export type AtomOptions<T extends (Argument | null)[] = (Argument | null)[]> =
  CreateAtomOptions<T> & {
    verbatimLatex?: string | null;

    type?: AtomType;
    value?: string;
    body?: Atom[];
    isFunction?: boolean;
    limits?: 'auto' | 'over-under' | 'adjacent';
    displayContainsHighlight?: boolean;
    captureSelection?: boolean;
    skipBoundary?: boolean;
  };

/**
 * An atom is an object encapsulating an elementary mathematical unit,
 * independent of its graphical representation.
 *
 * It keeps track of the content, while the dimensions, position and style
 * are tracked by Box objects which are created by the `createBox()` function.
 */
export class Atom<T extends (Argument | null)[] = (Argument | null)[]> {
  // The root has no parent. Every other atom has one.
  parent: Atom | undefined;

  // An atom can have multiple "branches" of children,
  // e.g. `body` and `superscript`.
  //
  // The `parentBranch` property indicate which branch of the parent this
  // atom belongs to or if in an array, the row and column
  parentBranch: Branch | undefined;

  value: string; // If no branches

  // Used to match a DOM element to an Atom
  // (the corresponding DOM element has a matching `id` attribute)
  id?: string;

  type: AtomType | undefined;

  // LaTeX command ('\sin') or character ('a')
  command: string;
  args: T; // (optional)

  // Verbatim LaTeX of the command and its arguments
  // Note that the empty string is a valid verbatim LaTeX, so it's important
  // to distinguish between `verbatimLatex === undefined` and `typeof verbatimLatex === 'string'`
  verbatimLatex: string | undefined;

  mode: ParseMode;
  style: PrivateStyle;

  // A monotonically increasing counter to detect structural changes
  /** @internal */
  private _changeCounter;

  // Cached list of children, invalidated when isDirty = true
  /** @internal */
  protected _children: Atom[] | undefined;

  /** @internal */
  private _branches: Branches;

  // How to display "limits" (i.e. superscript/subscript) for example
  // with `\sum`:
  // - 'over-under': directly above and below the symbol
  // - 'adjacent': to the right, above and below the baseline (for example
  // for operators in `textstyle` style)
  // - 'auto': 'over-under' in \displaystyle, 'adjacent' otherwise
  // If `undefined`, the subsup should be placed on a separate `msubsup` atom.
  subsupPlacement: 'auto' | 'over-under' | 'adjacent' | undefined = undefined;

  // True if the subsupPlacement was set by `\limits`, `\nolimits` or
  // `\displaylimits`.
  // Necessary so the proper LaTeX can be output.
  explicitSubsupPlacement = false;

  // If true, the atom represents a function (which can be followed by
  // parentheses) e.g. "f" or "\sin"
  isFunction: boolean;

  // If true, the atom is an operator such as `\int` or `\sum`
  // (affects layout of supsub)
  isExtensibleSymbol: boolean;

  // If true, when the caret reaches the first position in this element's body,
  // (moving right to left) it automatically moves to the outside of the
  // element.
  // Conversely, when the caret reaches the last position inside
  // this element, (moving left to right) it automatically moves to the one
  // outside the element.
  skipBoundary: boolean;

  // If true, the children of this atom cannot be selected and should be handled
  // as a unit. Used by the `\enclose` annotations, for example.
  captureSelection: boolean;

  // If true, this atom should be highlighted when it contains the caret
  displayContainsHighlight: boolean;

  // The kern to the right of this atom
  // kern?: Glue;

  //
  // The following properties are reset and updated through each rendering loop.
  //

  // True if the item is currently part of the selection
  isSelected: boolean;

  // If the atom or one of its descendant includes the caret
  // (used to highlight surd or fences to make clearer where the caret is)
  containsCaret: boolean;
  caret: ParseMode | undefined;

  constructor(options: AtomOptions<T>) {
    this.type = options.type;
    if (typeof options.value === 'string') this.value = options.value;
    this.command = options.command ?? this.value ?? '';
    this.mode = options.mode ?? 'math';
    this.isFunction = options.isFunction ?? false;
    this.subsupPlacement = options.limits;
    this.style = { ...options.style } ?? {};
    this.displayContainsHighlight = options.displayContainsHighlight ?? false;
    this.captureSelection = options.captureSelection ?? false;
    this.skipBoundary = options.skipBoundary ?? false;
    this.verbatimLatex = options.verbatimLatex ?? undefined;
    if (options.args) this.args = options.args;
    if (options.body) this.body = options.body;
    if (this.type === 'root') this._changeCounter = 0;
  }

  /**
   * Return a list of boxes equivalent to atoms.
   *
   * While an atom represent an abstract element (for example 'genfrac'),
   * a box corresponds to something to draw on screen (a character, a line,
   * etc...).
   *
   * @param context Font family, variant, size, color, and other info useful
   * to render an expression
   */
  static createBox(
    context: Context,
    atoms: Atom[] | undefined,
    options?: {
      mode?: ParseMode;
      type?: BoxType;
      style?: Style;
      classes?: string;
    }
  ): Box | null {
    if (!atoms) return null;
    const runs = getStyleRuns(atoms);

    const boxes: Box[] = [];
    for (const run of runs) {
      const style = run[0].style;
      const box = renderStyleRun(context, run, {
        style: {
          color: style.color,
          backgroundColor: style.backgroundColor,
          fontSize: style.fontSize,
        },
      });

      if (box) boxes.push(box);
    }
    if (boxes.length === 0) return null;

    const classes = (options?.classes ?? '').trim();
    if (boxes.length === 1 && !classes && !options?.type)
      return boxes[0].wrap(context);

    return new Box(boxes, { classes, type: options?.type }).wrap(context);
  }

  /**
   * Given an atom or an array of atoms, return a LaTeX string representation
   */
  static serialize(value: Atom[] | undefined, options: ToLatexOptions): string {
    return Mode.serialize(value, options);
  }

  /**
   * The common ancestor between two atoms
   */
  static commonAncestor(a: Atom, b: Atom): Atom | undefined {
    if (a === b) return a.parent!;

    // Short-circuit a common case
    if (a.parent === b.parent) return a.parent!;

    // Accumulate all the parents of `a`
    const parents = new WeakSet<Atom>();
    let { parent } = a;
    while (parent) {
      parents.add(parent);
      parent = parent.parent;
    }

    // Walk up the parents of `b`. If a parent of `b` is also a parent of
    // `a`, it's the common ancestor
    parent = b.parent;
    while (parent) {
      if (parents.has(parent!)) return parent!;
      parent = parent!.parent;
    }

    console.assert(Boolean(parent)); // Never reached
    return undefined;
  }

  static fromJson(json: AtomJson): Atom {
    if (typeof json === 'string')
      return new Atom({ type: 'mord', value: json, mode: 'math' });
    return new Atom(json as any);
  }

  get latexMode(): 'text' | 'math' | 'inline-math' {
    if (this.mode === 'math') return 'math';

    return 'text';
  }

  toJson(): AtomJson {
    const result: AtomJson = {};

    if (this.type) result.type = this.type;

    if (this.mode !== 'math') result.mode = this.mode;
    if (this.command && this.command !== this.value)
      result.command = this.command;
    if (this.value !== undefined) result.value = this.value;
    if (this.style && Object.keys(this.style).length > 0)
      result.style = { ...this.style };

    if (this.verbatimLatex !== undefined)
      result.verbatimLatex = this.verbatimLatex;

    if (this.subsupPlacement) result.subsupPlacement = this.subsupPlacement;
    if (this.explicitSubsupPlacement) result.explicitSubsupPlacement = true;

    if (this.isFunction) result.isFunction = true;
    if (this.displayContainsHighlight) result.displayContainsHighlight = true;
    if (this.isExtensibleSymbol) result.isExtensibleSymbol = true;
    if (this.skipBoundary) result.skipBoundary = true;
    if (this.captureSelection) result.captureSelection = true;
    if (this.args) result.args = argumentsToJson(this.args);

    if (this._branches) {
      for (const branch of Object.keys(this._branches)) {
        if (this._branches[branch]) {
          result[branch] = this._branches[branch]
            .filter((x) => x.type !== 'first')
            .map((x) => x.toJson());
        }
      }
    }

    // If the result is only `{type: "mord", value="b"}`,
    // return a shortcut
    if (result.type === 'mord') {
      if (Object.keys(result).length === 2 && 'value' in result)
        return result.value;
    }
    return result;
  }

  // Used to detect changes and send appropriate notifications
  get changeCounter(): number {
    if (this.parent) return this.parent.changeCounter;
    return this._changeCounter;
  }

  set isDirty(dirty: boolean) {
    if (dirty) {
      if (this.type === 'root') this._changeCounter++;
      if ('verbatimLatex' in this) this.verbatimLatex = undefined;
      this._children = undefined;

      let { parent } = this;
      while (parent) {
        if (parent.type === 'root') parent._changeCounter++;
        if ('verbatimLatex' in parent) parent.verbatimLatex = undefined;
        parent._children = undefined;

        parent = parent.parent;
      }
    }
  }

  /**
   * Serialize the atom  to LaTeX.
   * Used internally by Mode: does not serialize styling. To serialize
   * one or more atoms, use `Atom.serialize()`
   */
  _serialize(options: ToLatexOptions): string {
    // 1/ Verbatim LaTeX. This allow non-significant punctuation to be
    // preserved when possible.
    if (
      !(options.expandMacro || options.skipStyles) &&
      typeof this.verbatimLatex === 'string'
    )
      return this.verbatimLatex;

    // 2/ Custom serializer
    const def = getDefinition(this.command, this.mode);
    if (def?.serialize) return def.serialize(this, options);

    // 3/ Command and body
    if (this.body && this.command) {
      return joinLatex([
        latexCommand(this.command, this.bodyToLatex(options)),
        this.supsubToLatex(options),
      ]);
    }

    // 4/ body with no command
    if (this.body) {
      return joinLatex([
        this.bodyToLatex(options),
        this.supsubToLatex(options),
      ]);
    }

    // 5/ A string value (which is a unicode character)
    if (!this.value || this.value === '\u200B') return '';

    return this.command ?? unicodeCharToLatex(this.mode, this.value);
  }

  bodyToLatex(options: ToLatexOptions): string {
    return Mode.serialize(this.body, {
      ...options,
      defaultMode: options.defaultMode ?? this.latexMode,
    });
  }

  aboveToLatex(options: ToLatexOptions): string {
    return Mode.serialize(this.above, options);
  }

  belowToLatex(options: ToLatexOptions): string {
    return Mode.serialize(this.below, options);
  }

  supsubToLatex(options: ToLatexOptions): string {
    let result = '';

    // Super/subscript are always in math mode
    options = { ...options, defaultMode: 'math' };

    if (this.branch('subscript') !== undefined) {
      const sub = Mode.serialize(this.subscript, options);
      if (sub.length === 0) result += '_{}';
      else if (sub.length === 1) {
        // Using the short form without braces is a stylistic choice
        // In general, LaTeX recommends the use of braces
        if (/^[0-9]$/.test(sub)) result += `_${sub}`;
        else result += `_{${sub}}`;
      } else result += `_{${sub}}`;
    }

    if (this.branch('superscript') !== undefined) {
      const sup = Mode.serialize(this.superscript, options);
      if (sup.length === 0) result += '^{}';
      else if (sup.length === 1) {
        if (sup === '\u2032') result += '^\\prime ';
        else if (sup === '\u2033') result += '^\\doubleprime ';
        // Using the short form without braces is a stylistic choice
        // In general, LaTeX recommends the use of braces
        else if (/^[0-9]$/.test(sup)) result += `^${sup}`;
        else result += `^{${sup}}`;
      } else result += `^{${sup}}`;
    }
    return result;
  }

  get treeDepth(): number {
    let result = 1;
    let atom = this.parent;
    while (atom) {
      atom = atom.parent;
      result += 1;
    }

    return result;
  }

  get inCaptureSelection(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let atom: Atom | undefined = this;
    while (atom) {
      if (atom.captureSelection) return true;
      atom = atom.parent;
    }
    return false;
  }

  /** Return the parent editable prompt, if it exists */
  get parentPrompt(): Atom | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let atom: Atom | undefined = this.parent;
    while (atom) {
      if (atom.type === 'prompt' && !atom.captureSelection) return atom;
      atom = atom.parent;
    }
    return null;
  }

  /**
   * Return the atoms in the branch, if it exists, otherwise null
   */
  branch(name: Branch): Atom[] | undefined {
    if (!isNamedBranch(name)) return undefined;
    if (!this._branches) return undefined;
    return this._branches[name];
  }

  /**
   * Return all the branches that exist.
   * Some of them may be empty.
   */
  get branches(): Branch[] {
    if (!this._branches) return [];
    const result: BranchName[] = [];
    for (const branch of NAMED_BRANCHES)
      if (this._branches[branch]) result.push(branch);

    return result;
  }

  /**
   * Return the atoms in the branch, if it exists, otherwise create it
   */
  createBranch(name: Branch): Atom[] {
    console.assert(isNamedBranch(name));
    if (!isNamedBranch(name)) return [];
    if (!this._branches) {
      this._branches = {
        [name]: [this.makeFirstAtom(name)],
      };
    } else if (!this._branches[name])
      this._branches[name] = [this.makeFirstAtom(name)];

    this.isDirty = true;
    return this._branches[name]!;
  }

  get row(): number {
    if (!isCellBranch(this.parentBranch)) return -1;
    return this.parentBranch[0];
  }

  get col(): number {
    if (!isCellBranch(this.parentBranch)) return -1;
    return this.parentBranch[1];
  }

  get body(): Atom[] | undefined {
    return this._branches?.body;
  }

  set body(atoms: Atom[] | undefined) {
    this.setChildren(atoms, 'body');
  }

  get superscript(): Atom[] | undefined {
    return this._branches?.superscript;
  }

  set superscript(atoms: Atom[] | undefined) {
    this.setChildren(atoms, 'superscript');
  }

  get subscript(): Atom[] | undefined {
    return this._branches?.subscript;
  }

  set subscript(atoms: Atom[] | undefined) {
    this.setChildren(atoms, 'subscript');
  }

  get above(): Atom[] | undefined {
    return this._branches?.above;
  }

  set above(atoms: Atom[] | undefined) {
    this.setChildren(atoms, 'above');
  }

  get below(): Atom[] | undefined {
    return this._branches?.below;
  }

  set below(atoms: Atom[] | undefined) {
    this.setChildren(atoms, 'below');
  }

  get computedStyle(): PrivateStyle {
    const hadVerbatimColor = typeof this.style.verbatimColor === 'string';
    const hadVerbatimBackgroundColor =
      typeof this.style.verbatimBackgroundColor === 'string';

    const result = { ...(this.parent?.computedStyle ?? {}), ...this.style };

    // Variants are not included in the computed style (they're not inherited)
    delete result.variant;
    delete result.variantStyle;

    if (!hadVerbatimBackgroundColor) delete result.verbatimBackgroundColor;
    if (!hadVerbatimColor) delete result.verbatimColor;
    return result;
  }

  applyStyle(style: Style): void {
    this.isDirty = true;
    this.style = { ...this.style, ...style };

    if (this.style.fontFamily === 'none') delete this.style.fontFamily;

    if (this.style.fontShape === 'auto') delete this.style.fontShape;

    if (this.style.fontSeries === 'auto') delete this.style.fontSeries;

    if (this.style.color === 'none') {
      delete this.style.color;
      delete this.style.verbatimColor;
    }

    if (this.style.backgroundColor === 'none') {
      delete this.style.backgroundColor;
      delete this.style.verbatimBackgroundColor;
    }

    if (this.style.fontSize === 'auto') delete this.style.fontSize;

    for (const child of this.children) child.applyStyle(style);
  }

  getInitialBaseElement(): Atom {
    if (this.hasEmptyBranch('body')) return this;

    console.assert(this.body?.[0].type === 'first');

    return this.body![1]?.getInitialBaseElement() ?? this;
  }

  getFinalBaseElement(): Atom {
    if (this.hasEmptyBranch('body')) return this;
    return this.body![this.body!.length - 1].getFinalBaseElement();
  }

  isCharacterBox(): boolean {
    if (
      this.type === 'leftright' ||
      this.type === 'genfrac' ||
      this.type === 'subsup' ||
      this.type === 'delim' ||
      this.type === 'array' ||
      this.type === 'surd'
    )
      return false;
    return this.getFinalBaseElement().type === 'mord';
  }

  hasEmptyBranch(branch: Branch): boolean {
    const atoms = this.branch(branch);
    if (!atoms) return true;
    console.assert(atoms.length > 0);
    console.assert(atoms[0].type === 'first');
    return atoms.length === 1;
  }

  /*
   * Setting `null` does nothing
   * Setting `[]` adds an empty list (the branch is created)
   * The children should *not* start with a `"first"` atom:
   * the `first` atom will be added if necessary
   */
  setChildren(children: Atom[] | undefined, branch: Branch): void {
    if (!children) return;
    console.assert(isNamedBranch(branch));
    if (!isNamedBranch(branch)) return;
    console.assert(children[0]?.type !== 'first');

    // Update the parent
    const newBranch = [this.makeFirstAtom(branch), ...children];
    if (this._branches) this._branches[branch] = newBranch;
    else this._branches = { [branch]: newBranch };

    // Update the children
    for (const child of children) {
      child.parent = this;
      child.parentBranch = branch;
    }

    this.isDirty = true;
  }

  makeFirstAtom(branch: Branch): Atom {
    const result = new Atom({ type: 'first', mode: this.mode });
    result.parent = this;
    result.parentBranch = branch;
    return result;
  }

  addChild(child: Atom, branch: Branch): void {
    console.assert(child.type !== 'first');

    this.createBranch(branch).push(child);
    this.isDirty = true;

    // Update the child
    child.parent = this;
    child.parentBranch = branch;
  }

  addChildBefore(child: Atom, before: Atom): void {
    console.assert(before.parentBranch !== undefined);
    const branch = this.createBranch(before.parentBranch!);
    branch.splice(branch.indexOf(before), 0, child);
    this.isDirty = true;

    // Update the child
    child.parent = this;
    child.parentBranch = before.parentBranch;
  }

  addChildAfter(child: Atom, after: Atom): void {
    console.assert(after.parentBranch !== undefined);
    const branch = this.createBranch(after.parentBranch!);
    branch.splice(branch.indexOf(after) + 1, 0, child);
    this.isDirty = true;

    // Update the child
    child.parent = this;
    child.parentBranch = after.parentBranch;
  }

  addChildren(children: Atom[], branchName: Branch): void {
    const branch = this.createBranch(branchName);

    for (const child of children) {
      child.parent = this;
      child.parentBranch = branchName;
      branch.push(child);
    }

    this.isDirty = true;
  }

  /**
   * Return the last atom that was added
   */
  addChildrenAfter(children: Atom[], after: Atom): Atom {
    console.assert(children.length === 0 || children[0].type !== 'first');
    console.assert(after.parentBranch !== undefined);
    const branch = this.createBranch(after.parentBranch!);
    branch.splice(branch.indexOf(after) + 1, 0, ...children);
    this.isDirty = true;

    // Update the children
    for (const child of children) {
      child.parent = this;
      child.parentBranch = after.parentBranch;
    }
    return children[children.length - 1];
  }

  removeBranch(name: Branch): Atom[] {
    const children = this.branch(name);
    if (isNamedBranch(name)) this._branches[name] = undefined;

    if (!children) return [];

    for (const child of children) {
      child.parent = undefined;
      child.parentBranch = undefined;
    }
    // Drop the 'first' element
    console.assert(children[0].type === 'first');
    children.shift();
    this.isDirty = true;
    return children;
  }

  removeChild(child: Atom): void {
    console.assert(child.parent === this);

    // `first` atom cannot be deleted
    if (child.type === 'first') return;

    // Update the parent
    const branch = this.branch(child.parentBranch!)!;
    const index = branch.indexOf(child);
    console.assert(index >= 0);
    branch.splice(index, 1);
    this.isDirty = true;

    // Update the child
    child.parent = undefined;
    child.parentBranch = undefined;
  }

  get siblings(): Atom[] {
    if (!this.parent) return [];
    return this.parent.branch(this.parentBranch!)!;
  }

  get firstSibling(): Atom {
    return this.siblings[0];
  }

  get lastSibling(): Atom {
    const { siblings } = this;
    return siblings[siblings.length - 1];
  }

  get isFirstSibling(): boolean {
    return this === this.firstSibling;
  }

  get isLastSibling(): boolean {
    return this === this.lastSibling;
  }

  get hasNoSiblings(): boolean {
    // There is always at least one sibling, the 'first'
    // atom, but we don't count it.
    return this.siblings.length === 1;
  }

  get leftSibling(): Atom {
    console.assert(this.parent !== undefined);
    const siblings = this.parent!.branch(this.parentBranch!)!;
    return siblings[siblings.indexOf(this) - 1];
  }

  get rightSibling(): Atom {
    console.assert(this.parent !== undefined);
    const siblings = this.parent!.branch(this.parentBranch!)!;
    return siblings[siblings.indexOf(this) + 1];
  }

  get hasChildren(): boolean {
    return Boolean(this._branches && this.children.length > 0);
  }

  get firstChild(): Atom {
    console.assert(this.hasChildren);
    return this.children[0];
  }

  get lastChild(): Atom {
    console.assert(this.hasChildren);
    const { children } = this;
    return children[children.length - 1];
  }

  /**
   * All the children of this atom.
   *
   * The order of the atoms is the order in which they
   * are navigated using the keyboard.
   */
  get children(): Atom[] {
    if (this._children) return this._children;
    if (!this._branches) return [];
    const result: Atom[] = [];
    for (const branchName of NAMED_BRANCHES) {
      if (this._branches[branchName]) {
        for (const x of this._branches[branchName]!) {
          result.push(...x.children);
          result.push(x);
        }
      }
    }

    this._children = result;
    return result;
  }

  /**
   * Render this atom as a box.
   *
   * The parent context (color, size...) will be applied
   * to the result.
   *
   */
  render(parentContext: Context): Box | null {
    if (this.type === 'first' && !parentContext.atomIdsSettings) return null;

    const def = getDefinition(this.command, this.mode);
    if (def?.render) return def.render(this, parentContext);

    //
    // 1. Render the body or value
    //
    const context = new Context({ parent: parentContext }, this.style);
    let result = this.createBox(context, {
      classes: !this.parent ? 'ML__base' : '',
    });
    if (!result) return null;

    //
    // 2. Render any attached superscript, subscripts
    //
    if (!this.subsupPlacement && (this.superscript || this.subscript)) {
      // If there is a `subsupPlacement`, the attachment of sup/sub was handled
      // in the atom decomposition (e.g. `mop`, `accent`)
      result = this.attachSupsub(context, { base: result });
    }

    return result.wrap(context);
  }

  attachSupsub(
    parentContext: Context,
    options: { base: Box; isCharacterBox?: boolean; type?: BoxType }
  ): Box {
    const base = options.base;
    const superscript = this.superscript;
    const subscript = this.subscript;

    // If no superscript or subscript, nothing to do.
    if (!superscript && !subscript) return base;

    // Superscript and subscripts are discussed in the TeXbook
    // on page 445-446, rules 18(a-f).
    // TeX:14859-14945
    let supBox: Box | null = null;
    let subBox: Box | null = null;
    const isCharacterBox = options.isCharacterBox ?? this.isCharacterBox();

    // Rule 18a, p445

    let supShift = 0;
    if (superscript) {
      const context = new Context({
        parent: parentContext,
        mathstyle: 'superscript',
      });
      supBox = Atom.createBox(context, superscript);
      if (!isCharacterBox) {
        supShift =
          base.height - parentContext.metrics.supDrop * context.scalingFactor;
      }
    }

    let subShift = 0;
    if (subscript) {
      const context = new Context({
        parent: parentContext,
        mathstyle: 'subscript',
      });
      subBox = Atom.createBox(context, subscript);
      if (!isCharacterBox) {
        subShift =
          base.depth + parentContext.metrics.subDrop * context.scalingFactor;
      }
    }

    // Rule 18c, p445
    let minSupShift: number;
    if (parentContext.isDisplayStyle)
      minSupShift = parentContext.metrics.sup1; // Sigma13
    else if (parentContext.isCramped)
      minSupShift = parentContext.metrics.sup3; // Sigma15
    else minSupShift = parentContext.metrics.sup2; // Sigma14

    // Scriptspace is a font-size-independent size, so scale it
    // appropriately
    const scriptspace = 0.5 / PT_PER_EM / parentContext.scalingFactor;
    let supsub: Box | null = null;
    if (subBox && supBox) {
      // Rule 18e
      supShift = Math.max(
        supShift,
        minSupShift,
        supBox.depth + 0.25 * parentContext.metrics.xHeight
      );
      subShift = Math.max(subShift, parentContext.metrics.sub2);
      const ruleWidth = parentContext.metrics.defaultRuleThickness;
      if (
        supShift - supBox.depth - (subBox.height - subShift) <
        4 * ruleWidth
      ) {
        subShift = 4 * ruleWidth - (supShift - supBox.depth) + subBox.height;
        const psi =
          0.8 * parentContext.metrics.xHeight - (supShift - supBox.depth);
        if (psi > 0) {
          supShift += psi;
          subShift -= psi;
        }
      }

      // Subscripts shouldn't be shifted by the nucleus' italic correction.
      // Account for that by shifting the subscript back the appropriate
      // amount. Note we only do this when the nucleus is a single symbol.
      const slant = this.isExtensibleSymbol && base.italic ? -base.italic : 0;
      supsub = new VBox({
        individualShift: [
          { box: subBox, shift: subShift, marginLeft: slant },
          { box: supBox, shift: -supShift },
        ],
      }).wrap(parentContext);
    } else if (subBox && !supBox) {
      // Rule 18b
      subShift = Math.max(
        subShift,
        parentContext.metrics.sub1,
        subBox.height - 0.8 * X_HEIGHT
      );

      supsub = new VBox({
        shift: subShift,
        children: [
          {
            box: subBox,
            marginRight: scriptspace,
            marginLeft: this.isCharacterBox() ? -base.italic ?? 0 : 0,
          },
        ],
      });
    } else if (!subBox && supBox) {
      // Rule 18c, d
      supShift = Math.max(
        supShift,
        minSupShift,
        supBox.depth + 0.25 * X_HEIGHT
      );

      supsub = new VBox({
        shift: -supShift,
        children: [{ box: supBox, marginRight: scriptspace }],
      });

      supsub.wrap(parentContext);
    }

    // Display the caret *following* the superscript and subscript,
    // so attach the caret to the 'subsup' element.

    return new Box(
      [
        base,
        new Box(supsub, {
          caret: this.caret,
          isSelected: this.isSelected,
          classes: 'msubsup',
        }),
      ],
      { type: options.type }
    );
  }

  attachLimits(
    ctx: Context,
    options: {
      base: Box;
      baseShift?: number;
      slant?: number;
      type?: BoxType;
    }
  ): Box {
    const above = this.superscript
      ? Atom.createBox(
          new Context({ parent: ctx, mathstyle: 'superscript' }, this.style),
          this.superscript
        )
      : null;
    const below = this.subscript
      ? Atom.createBox(
          new Context({ parent: ctx, mathstyle: 'subscript' }, this.style),
          this.subscript
        )
      : null;

    if (!above && !below) return options.base.wrap(ctx);

    return makeLimitsStack(ctx, { ...options, above, below });
  }

  /**
   * Add an ID attribute to both the box and this atom so that the atom
   * can be retrieved from the box later on, e.g. when the box is clicked on.
   */
  bind(context: Context, box: null): null;
  bind(context: Context, box: Box): Box;
  bind(context: Context, box: Box | null): Box | null {
    // Don't bind to phantom boxes or "empty" atoms (\u200b)
    // (they won't be interactive, so no need for the id)
    if (!box || context.isPhantom || this.value === '\u200B') return box;

    let parent = this.parent;
    while (parent && !parent.captureSelection) parent = parent.parent;
    if (parent?.captureSelection) return box;

    if (!this.id) this.id = context.makeID();
    box.atomID = this.id;

    return box;
  }

  /**
   * Create a box with the specified body.
   */
  createBox(
    context: Context,
    options?: { classes?: string; boxType?: BoxType }
  ): Box {
    const value = this.value ?? this.body;

    // Get the right BoxType for this atom type
    const type = options?.boxType ?? boxType(this.type);

    // The font family is determined by:
    // - the base font family associated with this atom (optional). For example,
    // some atoms such as some functions ('\sin', '\cos', etc...) or some
    // symbols ('\Z') have an explicit font family. This overrides any
    // other font family
    // - the user-specified font family that has been explicitly applied to
    // this atom
    // - the font family determined automatically in math mode, for example
    // which italicizes some characters, but which can be overridden

    let classes = options?.classes ?? '';

    if (this.mode === 'text') classes += ' ML__text';

    const result =
      typeof value === 'string' || value === undefined
        ? new Box((value as string | undefined) ?? null, {
            type,
            isSelected: this.isSelected,
            mode: this.mode,
            maxFontSize: context.scalingFactor,
            style: {
              variant: 'normal', // Will auto-italicize
              ...this.style,
              fontSize: Math.max(
                1,
                context.size + context.mathstyle.sizeDelta
              ) as FontSize,
            },
            letterShapeStyle: context.letterShapeStyle,
            classes,
          })
        : Atom.createBox(context, value, {
            type,
            mode: this.mode,
            style: this.style,
            classes,
          }) ?? new Box(null);

    // Set other attributes
    if (context.isTight) result.isTight = true;

    // The italic correction applies only in math mode
    if (this.mode !== 'math' || this.style.variant === 'main')
      result.italic = 0;

    result.right = result.italic;

    // To retrieve the atom from a box, for example when the box is clicked
    // on, attach a unique ID to the box and associate it with the atom.
    this.bind(context, result);
    if (this.caret) {
      // If this has a super/subscript, the caret will be attached
      // to the 'subsup' atom, so no need to have it here.
      if (!this.superscript && !this.subscript) result.caret = this.caret;
    }

    return result;
  }

  /** Return true if a digit, or a decimal point, or a french decimal `{,}` */
  isDigit(): boolean {
    if (this.type === 'mord' && this.value) return /^[\d,\.]$/.test(this.value);
    if (this.type === 'group' && this.body?.length === 2)
      return this.body![0].type === 'first' && this.body![1].value === ',';

    return false;
  }
  asDigit(): string {
    if (this.type === 'mord' && this.value && /^[\d,\.]$/.test(this.value))
      return this.value;

    if (this.type === 'group' && this.body?.length === 2) {
      if (this.body![0].type === 'first' && this.body![1].value === ',')
        return '.';
    }
    return '';
  }
}

function getStyleRuns(atoms: Atom[]): Atom[][] {
  let style: Style | undefined = undefined;
  const runs: Atom[][] = [];
  let run: Atom[] = [];
  for (const atom of atoms) {
    if (!style && !atom.style) run.push(atom);
    else {
      const atomStyle = atom.computedStyle;
      if (
        style &&
        atomStyle.color === style.color &&
        atomStyle.backgroundColor === style.backgroundColor &&
        atomStyle.fontSize === style.fontSize
      ) {
        // Atom matches the current run
        run.push(atom);
      } else {
        // Start a new run
        if (run.length > 0) runs.push(run);
        run = [atom];
        style = atomStyle;
      }
    }
  }

  if (run.length > 0) runs.push(run);

  return runs;
}

/**
 * Render a list of atoms with the same style (color, backgroundColor, size)
 */
function renderStyleRun(
  parentContext: Context,
  atoms: Atom[] | undefined,
  options: {
    mode?: ParseMode;
    type?: BoxType;
    style?: Style;
    classes?: string;
  }
): Box | null {
  if (!atoms || atoms.length === 0) return null;

  const context = new Context({ parent: parentContext }, options.style);

  // In most cases we want to display selection,
  // except if the `atomIdsSettings.groupNumbers` flag is set which is used for
  // read aloud.
  const displaySelection = !context.atomIdsSettings?.groupNumbers;

  let boxes: Box[] = [];
  if (atoms.length === 1) {
    const atom = atoms[0];
    const box = atom.render(context);
    if (box) {
      if (displaySelection && atom.isSelected) box.selected(true);
      boxes = [box];
    }
  } else {
    let digitOrTextStringID = '';
    let lastWasDigit = true;
    for (const atom of atoms) {
      if (
        context.atomIdsSettings?.groupNumbers &&
        digitOrTextStringID &&
        ((lastWasDigit && atom.isDigit()) || (!lastWasDigit && isText(atom)))
      )
        context.atomIdsSettings.overrideID = digitOrTextStringID;

      const box = atom.render(context);

      if (context.atomIdsSettings)
        context.atomIdsSettings.overrideID = undefined;

      if (box) {
        // If this is a digit or text run, keep track of it
        if (context.atomIdsSettings?.groupNumbers) {
          if (atom.isDigit() || isText(atom)) {
            if (!digitOrTextStringID || lastWasDigit !== atom.isDigit()) {
              // Changed from text to digits or vice-versa
              lastWasDigit = atom.isDigit();
              digitOrTextStringID = atom.id ?? '';
            }
          }

          if (
            digitOrTextStringID &&
            (!(atom.isDigit() || isText(atom)) ||
              !atom.hasEmptyBranch('superscript') ||
              !atom.hasEmptyBranch('subscript'))
          ) {
            // Done with digits/text
            digitOrTextStringID = '';
          }
        }

        if (displaySelection && atom.isSelected) box.selected(true);
        boxes.push(box);
      }
    }
  }

  if (boxes.length === 0) return null;

  const result = new Box(boxes, {
    isTight: context.isTight,
    ...options,
    type: options.type ?? 'lift',
  });
  result.isSelected = boxes.every((x) => x.isSelected);
  return result.wrap(context);
}

function isText(atom: Atom): boolean {
  return atom.mode === 'text';
}

function argumentsToJson<T extends any[]>(args: T): any {
  return args.map((arg) => {
    if (arg === null) return '<null>';
    if (Array.isArray(arg) && arg[0] instanceof Atom)
      return { atoms: arg.map((x) => x.toJson()) };
    if (typeof arg === 'object' && 'group' in arg)
      return { group: arg.group.map((x) => x.toJson()) };
    return arg;
  });
}
