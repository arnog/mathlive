import type { Style, ParseMode, FontSize, Glue } from '../public/core';

import { isArray } from '../common/types';

import { Context, PrivateStyle } from './context';

import { PT_PER_EM, X_HEIGHT } from './font-metrics';
import { BoxType, isBoxType, Box } from './box';
import { makeLimitsStack, VBox } from './v-box';
import { joinLatex } from './tokenizer';
import { getModeRuns, getPropertyRuns, Mode } from './modes-utils';
import { unicodeCharToLatex } from '../core-definitions/definitions-utils';

export const ATOM_REGISTRY = {};

export type BranchName =
  | 'above'
  | 'body'
  | 'below'
  | 'superscript'
  | 'subscript';
export type Branch = BranchName | [row: number, col: number];
/**
 * The order of these branches specify the keyboard navigation order
 */
const NAMED_BRANCHES: BranchName[] = [
  'above',
  'body',
  'below',
  'superscript',
  'subscript',
];

/**
 * A _branch_ is a set of children of an atom.
 *
 * There are two kind of branches:
 * - **colRow** branches are adressed with a column and row number and are
 * used with ArrayAtom
 * - **named branches** used with other kind of atoms. There is a fixed set of
 * possible named branches.
 */
export function isNamedBranch(branch: Branch): branch is BranchName {
  return typeof branch === 'string' && NAMED_BRANCHES.includes(branch);
}

export function isColRowBranch(branch?: Branch): branch is [number, number] {
  return branch !== undefined && Array.isArray(branch) && branch.length === 2;
}

export type Branches = {
  [branch in BranchName]?: Atom[];
};

export type ToLatexOptions = {
  expandMacro?: boolean;
  // If true, don't emit a mode command such as `\text`
  skipModeCommand?: boolean;
  // Don't emit unnecessary style shift commands: you can assume we're in
  // this default mode.
  defaultMode: 'math' | 'text' | 'inline-math';
};

export type AtomType =
  | 'accent'
  | 'array' // A group, which has children arranged in rows. Used
  // by environments such as `matrix`, `cases`, etc...
  | 'box' // A border drawn around an expression and change its background color
  | 'chem' // A chemical formula (mhchem)
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
  | 'leftright' // Used by the `\left` and `\right` commands
  | 'line' // Used by `\overline` and `\underline`
  | 'macro'
  | 'mbin' // Binary operator: `+`, `*`, etc...
  | 'mclose' // Closing fence: `)`, `\rangle`, etc...
  | 'minner' // Special layout cases, fraction, overlap, `\left...\right`
  | 'mop' // `mop`: operators, including special functions, `\sin`, `\sum`, `\cap`.
  | 'mopen' // Opening fence: `(`, `\langle`, etc...
  | 'mord' // Ordinary symbol, e.g. `x`, `\alpha`
  | 'mpunct' // Punctuation: `,`, `:`, etc...
  | 'mrel' // Relational operator: `=`, `\ne`, etc...
  | 'msubsup' // A carrier for a superscript/subscript
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
  | 'text'; // Text mode atom;

export type BBoxParameter = {
  backgroundcolor?: string;
  padding?: string;
  border?: string;
};

/**
 * An atom is an object encapsulating an elementary mathematical unit,
 * independent of its graphical representation.
 *
 * It keeps track of the content, while the dimensions, position and style
 * are tracked by Box objects which are created by the `createBox()` function.
 */
export class Atom {
  parent: Atom | undefined;

  // An atom can have multiple "branches" of children,
  // e.g. `body` and `superscript`.
  //
  // The `treeBranch` property indicate which branch of the parent this
  // atom belongs to or if in an array, the row and column
  treeBranch?: Branch;

  value: string; // If no branches

  // Used to match a DOM element to an Atom
  // (the corresponding DOM element has a `data-atom-id` attribute)
  id?: string;

  type: AtomType;

  // Latex command ('\sin') or character ('a')
  command?: string;

  // Verbatim Latex of the command and its arguments
  verbatimLatex?: string;

  style: PrivateStyle;
  mode: ParseMode;

  // If true, the atom represents a function (which can be followed by parentheses)
  // e.g. "f" or "\sin"
  isFunction: boolean;

  // If true, the atom is an operator such as `\int` or `\sum`
  // (affects layout of supsub)
  isExtensibleSymbol: boolean;

  // If true, some structural changes have been made to the atom
  // (insertion or removal of children) or one of its children is dirty
  private _isDirty: boolean;

  // A monotonically increasing counter to detect structural changes
  private _changeCounter: number;

  // Cached list of children, invalidated when isDirty = true
  private _children: Atom[] | undefined;

  // Optional, per instance, override of the `serialize()` method
  serializeOverride?: (atom: Atom, options: ToLatexOptions) => string;

  private _branches: Branches;

  // How to display "limits" (i.e. superscript/subscript) for example
  // with `\sum`:
  // - 'over-under': directly above and below the symbol
  // - 'adjacent': to the right, above and below the baseline (for example
  // for operators in `textstyle` style)
  // - 'auto': 'over-under' in \displaystyle, 'adjacent' otherwise
  // If `undefined`, the subsup should be placed on a separate `msubsup` atom.
  subsupPlacement?: 'auto' | 'over-under' | 'adjacent';

  // True if the subsupPlacement was set by `\limits`, `\nolimits` or
  // `\displaylimits`.
  // Necessary so the proper LaTeX can be output.
  explicitSubsupPlacement?: boolean;

  // If true, when the caret reaches the first position in this element's body,
  // (moving right to left) it automatically moves to the outside of the
  // element.
  // Conversely, when the caret reaches the last position inside
  // this element, (moving left to right) it automatically moves to the one
  // outside the element.
  skipBoundary?: boolean;

  // If true, the children of this atom cannot be selected and should be handled
  // as a unit. Used by the `\enclose` annotations, for example.
  captureSelection?: boolean;

  // If true, this atom should be highlited when it contains the caret
  displayContainsHighlight: boolean;

  // This atom causes the parsemode to change. Use by commands such as
  // `\mbox` to indicate that it is not necessary to wrap them in a mode
  // changing command (`\text`).
  changeMode?: boolean;

  // The kern to the right of this atom
  kern?: Glue;

  //
  // The following properties are reset and updated through each rendering loop.
  //

  // The type the item should be considered before typesetting it.
  // This account the atoms that surrounds it, so that a '-' between two
  // ordinary atoms will have more space around it than a '-' with no
  // atom to its left, i.e. `12 + 3` vs `-123`.
  interAtomType: BoxType;
  // The amount of glue between this atom and the one to the right
  // based on the calculated kernType
  interAtomKern: Glue;

  // True if the item currently part of the selection
  isSelected: boolean;

  // If the atom or one of its descendant includes the caret
  // (used to highligth surd or fences to make clearer where the caret is
  containsCaret: boolean;
  caret: ParseMode | '';

  constructor(
    type: AtomType,
    options?: {
      command?: string;
      mode?: ParseMode;
      value?: string;
      isFunction?: boolean;
      limits?: 'auto' | 'over-under' | 'adjacent';
      style?: Style;
      displayContainsHighlight?: boolean;
      serialize?: (atom: Atom, options: ToLatexOptions) => string;
    }
  ) {
    this.command = options?.command;
    this.type = type;
    if (typeof options?.value === 'string') {
      this.value = options.value;
    }

    this._isDirty = false;
    this._changeCounter = 0;

    this.mode = options?.mode ?? 'math';
    this.isFunction = options?.isFunction ?? false;
    this.subsupPlacement = options?.limits;
    this.style = options?.style ?? {};
    this.serializeOverride = options?.serialize;
    this.displayContainsHighlight = options?.displayContainsHighlight ?? false;
  }

  get changeCounter(): number {
    return this._changeCounter;
  }

  get isDirty(): boolean {
    return this._isDirty;
  }

  set isDirty(dirty: boolean) {
    this._isDirty = dirty;
    if (dirty) {
      this._changeCounter++;
      this.verbatimLatex = undefined;
      this._children = undefined;

      let { parent } = this;
      while (parent) {
        parent._isDirty = true;
        parent._changeCounter++;
        parent.verbatimLatex = undefined;
        parent._children = undefined;

        parent = parent.parent;
      }
    }
  }

  /**
   * Return a list of boxes equivalent to atoms.
   *
   * While an atom represent an abstract element (for example 'genfrac'),
   * a box corresponds to something to draw on screen (a character, a line,
   * etc...).
   *
   * @param parentContext Font family, variant, size, color, and other info useful
   * to render an expression
   * @param options.newList - If true, for the purpose of calculating spacing
   * between atoms, this list of atoms should be considered a new atom list,
   * in the sense of TeX atom lists (i.e. don't consider preceding atoms
   * to calculate spacing)
   */
  static createBox(
    parentContext: Context,
    atoms: Atom[] | undefined,
    options?: {
      type?: BoxType;
      classes?: string;
      style?: Style;
      mode?: ParseMode;
      newList?: boolean;
    }
  ): Box | null {
    if (!atoms) return null;
    const runs = getStyleRuns(atoms);

    //
    // Special case when there's a single run
    //
    if (runs.length === 1) {
      const run = runs[0];
      if (run[0].style) {
        return renderStyleRun(parentContext, run, {
          ...options,
          style: {
            color: run[0].style.color,
            backgroundColor: run[0].style.backgroundColor,
            fontSize: run[0].style.fontSize,
          },
        });
      }
      return renderStyleRun(parentContext, run, options);
    }

    //
    // There are multiple runs to handle
    //
    const boxes: Box[] = [];
    let newList = options?.newList;
    for (const run of runs) {
      const context = new Context(parentContext, {
        color: run[0].style?.color,
        backgroundColor: run[0].style?.backgroundColor,
        fontSize: run[0].style?.fontSize,
        isSelected: run[0].isSelected,
      });
      const box = renderStyleRun(context, run, { newList });

      if (box) {
        newList = false;
        boxes.push(box);
      }
    }
    if (boxes.length === 0) return null;
    if (boxes.length === 1 && !options?.classes && !options?.type) {
      return boxes[0].wrap(parentContext);
    }
    return new Box(boxes, {
      classes: options?.classes,
      type: options?.type,
      newList: options?.newList,
    }).wrap(parentContext);
  }

  /**
   * Given an atom or an array of atoms, return a LaTeX string representation
   */
  static serialize(
    value: boolean | number | string | Atom | Atom[] | undefined,
    options: ToLatexOptions
  ): string {
    let result = '';
    if (isArray<Atom>(value)) {
      result = atomsToLatex(value, options);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      result = value.toString();
    } else if (typeof value === 'string') {
      result = value.replace(/\s/g, '~');
    } else if (value !== undefined) {
      // If we have some verbatim latex for this atom, use it.
      // This allow non-significant punctuation to be preserved when possible.
      if (!options.expandMacro && typeof value.verbatimLatex === 'string') {
        return value.verbatimLatex;
      }

      if (value.serializeOverride) {
        return value.serializeOverride(value, options);
      }

      result = value.serialize(options);
    }

    return result;
  }

  /**
   * The common ancestor between two atoms
   */
  static commonAncestor(a: Atom, b: Atom): Atom | undefined {
    if (a === b) return a.parent;

    // Short-circuit a common case
    if (a.parent === b.parent) return a.parent;

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
      if (parents.has(parent)) return parent;
      parent = parent.parent;
    }

    console.assert(Boolean(parent)); // Never reached
    return undefined;
  }

  /**
   * Default Latex emmiter.
   * Avoid calling directly, instead call `Atom.serialize(atom)`
   * to correctly call per-definition emitters and use the cached verbatim
   * latex when applicable.
   */
  serialize(options: ToLatexOptions): string {
    if (this.body && this.command) {
      // There's a command and body
      return joinLatex([
        this.command,
        '{',
        this.bodyToLatex(options),
        '}',
        this.supsubToLatex(options),
      ]);
    }

    if (this.body) {
      // There's a body with no command
      return joinLatex([
        this.bodyToLatex(options),
        this.supsubToLatex(options),
      ]);
    }

    if (this.value && this.value !== '\u200B') {
      // There's probably just a value (which is a unicode character)
      return this.command ?? unicodeCharToLatex(this.mode, this.value);
    }

    return '';
  }

  bodyToLatex(options: ToLatexOptions): string {
    return atomsToLatex(this.body, options);
  }

  aboveToLatex(options: ToLatexOptions): string {
    return atomsToLatex(this.above, options);
  }

  belowToLatex(options: ToLatexOptions): string {
    return atomsToLatex(this.below, options);
  }

  supsubToLatex(options: ToLatexOptions): string {
    let result = '';
    // Note: **important** we must check only for the existence of the branch
    // not if it is non-empty (`hasEmptyBranch`) because we must serialize
    // e.g. `x^`. If we don't do this correctly, weird things will happen
    // like inline shortcuts (which rely on the undo buffer and serialization)
    // will fail, for example in `e^pi`.

    if (this.branch('subscript') !== undefined) {
      const sub = atomsToLatex(this.subscript, options);
      if (sub.length === 0) {
        result += '_';
      } else if (sub.length === 1) {
        result += '_' + sub;
      } else {
        result += `_{${sub}}`;
      }
    }

    if (this.branch('superscript') !== undefined) {
      const sup = atomsToLatex(this.superscript, options);
      if (sup.length === 0) {
        result += '^';
      } else if (sup.length === 1) {
        if (sup === '\u2032') {
          result += '^\\prime ';
        } else if (sup === '\u2033') {
          result += '^\\doubleprime ';
        } else {
          result += '^' + sup;
        }
      } else {
        result += `^{${sup}}`;
      }
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
    let result = false;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let atom: Atom | undefined = this;
    while (atom) {
      if (atom.captureSelection) {
        result = true;
        break;
      }
      atom = atom.parent;
    }
    return result;
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
    const result: Branch[] = [];
    for (const branch of NAMED_BRANCHES) {
      if (this._branches[branch]) {
        result.push(branch);
      }
    }
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
    } else if (!this._branches[name]) {
      this._branches[name] = [this.makeFirstAtom(name)];
    }

    this.isDirty = true;
    return this._branches[name]!;
  }

  get row(): number {
    if (!isColRowBranch(this.treeBranch)) return -1;
    return this.treeBranch[0];
  }

  get col(): number {
    if (!isColRowBranch(this.treeBranch)) return -1;
    return this.treeBranch[1];
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
    const style = { ...this.style };
    const hadVerbatimColor = this.style.verbatimColor !== undefined;
    const hadVerbatimBackgroundColor =
      this.style.verbatimBackgroundColor !== undefined;
    if (style) {
      // Variant are not included in the computed style (they're not inherited)
      delete style.variant;
      delete style.variantStyle;
    }

    if (!this.parent) return style ?? {};
    const result = { ...this.parent.computedStyle, ...style };

    if (!hadVerbatimBackgroundColor) delete result.verbatimBackgroundColor;
    if (!hadVerbatimColor) delete result.verbatimColor;

    return result;
  }

  applyStyle(style: Style): void {
    this.isDirty = true;
    this.style = { ...this.style, ...style };

    if (this.style.fontFamily === 'none') {
      delete this.style.fontFamily;
    }

    if (this.style.fontShape === 'auto') {
      delete this.style.fontShape;
    }

    if (this.style.fontSeries === 'auto') {
      delete this.style.fontSeries;
    }

    if (this.style.color === 'none') {
      delete this.style.color;
      delete this.style.verbatimColor;
    }

    if (this.style.backgroundColor === 'none') {
      delete this.style.backgroundColor;
      delete this.style.verbatimBackgroundColor;
    }

    if (this.style.fontSize === 'auto') {
      delete this.style.fontSize;
    }
  }

  getInitialBaseElement(): Atom {
    let result: Atom | undefined = undefined;
    if (!this.hasEmptyBranch('body')) {
      console.assert(this.body?.[0].type === 'first');
      result = this.body![1].getInitialBaseElement();
    }

    return result ?? this;
  }

  getFinalBaseElement(): Atom {
    if (!this.hasEmptyBranch('body')) {
      return this.body![this.body!.length - 1].getFinalBaseElement();
    }

    return this;
  }

  isCharacterBox(): boolean {
    const base = this.getInitialBaseElement();
    return /mord/.test(base.type);
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
   * The children should *not* start with a `'first'` atom:
   * the `first` atom will be added if necessary
   */
  setChildren(children: Atom[] | undefined, branch: Branch): void {
    if (!children) return;
    console.assert(isNamedBranch(branch));
    if (!isNamedBranch(branch)) return;
    console.assert(children[0]?.type !== 'first');

    // Update the parent
    if (this._branches) {
      this._branches[branch] = [this.makeFirstAtom(branch), ...children];
    } else {
      this._branches = {
        [branch]: [this.makeFirstAtom(branch), ...children],
      };
    }

    this.isDirty = true;

    // Update the children
    for (const child of children) {
      child.parent = this;
      child.treeBranch = branch;
    }
  }

  makeFirstAtom(branch: Branch): Atom {
    const result = new Atom('first', { mode: this.mode });
    result.parent = this;
    result.treeBranch = branch;
    return result;
  }

  addChild(child: Atom, branch: Branch): void {
    console.assert(child.type !== 'first');

    this.createBranch(branch).push(child);
    this.isDirty = true;

    // Update the child
    child.parent = this;
    child.treeBranch = branch;
  }

  addChildBefore(child: Atom, before: Atom): void {
    console.assert(before.treeBranch !== undefined);
    const branch = this.createBranch(before.treeBranch!);
    branch.splice(branch.indexOf(before), 0, child);
    this.isDirty = true;

    // Update the child
    child.parent = this;
    child.treeBranch = before.treeBranch;
  }

  addChildAfter(child: Atom, after: Atom): void {
    console.assert(after.treeBranch !== undefined);
    const branch = this.createBranch(after.treeBranch!);
    branch.splice(branch.indexOf(after) + 1, 0, child);
    this.isDirty = true;

    // Update the child
    child.parent = this;
    child.treeBranch = after.treeBranch;
  }

  addChildren(children: Atom[], branch: Branch): void {
    for (const child of children) this.addChild(child, branch);
  }

  /**
   * Return the last atom that was added
   */
  addChildrenAfter(children: Atom[], after: Atom): Atom {
    console.assert(children.length === 0 || children[0].type !== 'first');
    console.assert(after.treeBranch !== undefined);
    const branch = this.createBranch(after.treeBranch!);
    branch.splice(branch.indexOf(after) + 1, 0, ...children);
    this.isDirty = true;

    // Update the children
    for (const child of children) {
      child.parent = this;
      child.treeBranch = after.treeBranch;
    }
    return children[children.length - 1];
  }

  removeBranch(name: Branch): Atom[] {
    const children = this.branch(name);
    if (isNamedBranch(name)) {
      this._branches[name] = undefined;
    }
    if (!children) return [];

    for (const child of children) {
      child.parent = undefined;
      child.treeBranch = undefined;
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
    const branch = this.branch(child.treeBranch!)!;
    const index = branch.indexOf(child);
    console.assert(index >= 0);
    branch.splice(index, 1);
    this.isDirty = true;

    // Update the child
    child.parent = undefined;
    child.treeBranch = undefined;
  }

  get siblings(): Atom[] {
    if (this.type === 'root') return [];
    return this.parent!.branch(this.treeBranch!)!;
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
    const siblings = this.parent!.branch(this.treeBranch!)!;
    return siblings[siblings.indexOf(this) - 1];
  }

  get rightSibling(): Atom {
    console.assert(this.parent !== undefined);
    const siblings = this.parent!.branch(this.treeBranch!)!;
    return siblings[siblings.indexOf(this) + 1];
  }

  get hasChildren(): boolean {
    return this._branches && this.children.length > 0;
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
   * Render this atom as an array of boxes.
   *
   * The parent context (color, size...) will be applied
   * to the result.
   *
   */
  render(parentContext: Context, options?: { newList: boolean }): Box | null {
    if (this.type === 'first' && !parentContext.atomIdsSettings) return null;

    //
    // 1. Render the body or value
    //
    const context = new Context(parentContext, this.style);
    let result: Box = this.createBox(context, {
      classes: this.type === 'root' ? ' ML__base' : '',
      newList: options?.newList === true || this.type === 'first',
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
    if (!superscript && !subscript) {
      return base;
    }

    // Superscript and subscripts are discussed in the TeXbook
    // on page 445-446, rules 18(a-f).
    // TeX:14859-14945
    let supBox: Box | null = null;
    let subBox: Box | null = null;
    const isCharacterBox = options.isCharacterBox ?? this.isCharacterBox();

    // Rule 18a, p445

    let supShift = 0;
    if (superscript) {
      const context = new Context(parentContext, undefined, 'superscript');
      supBox = Atom.createBox(context, superscript, { newList: true });
      if (!isCharacterBox) {
        supShift =
          base.height - parentContext.metrics.supDrop * context.scalingFactor;
      }
    }

    let subShift = 0;
    if (subscript) {
      const context = new Context(parentContext, undefined, 'subscript');
      subBox = Atom.createBox(context, subscript, { newList: true });
      if (!isCharacterBox) {
        subShift =
          base.depth + parentContext.metrics.subDrop * context.scalingFactor;
      }
    }

    // Rule 18c, p445
    let minSupShift: number;
    if (parentContext.isDisplayStyle) {
      minSupShift = parentContext.metrics.sup1; // Sigma13
    } else if (parentContext.isCramped) {
      minSupShift = parentContext.metrics.sup3; // Sigma15
    } else {
      minSupShift = parentContext.metrics.sup2; // Sigma14
    }

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
            marginLeft: this.isCharacterBox() ? -(base.italic ?? 0) : 0,
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
    // so attach the caret to the 'msubsup' element.
    const supsubContainer = new Box(supsub, { classes: 'msubsup' });
    if (this.caret) {
      supsubContainer.caret = this.caret;
    }

    return new Box([base, supsubContainer], { type: options.type });
  }

  attachLimits(
    parentContext: Context,
    options: {
      base: Box;
      baseShift?: number;
      slant?: number;
      type?: BoxType;
    }
  ): Box {
    const above = this.superscript
      ? Atom.createBox(
          new Context(parentContext, this.style, 'superscript'),
          this.superscript,
          { newList: true }
        )
      : null;
    const below = this.subscript
      ? Atom.createBox(
          new Context(parentContext, this.style, 'subscript'),
          this.subscript,
          { newList: true }
        )
      : null;

    if (!above && !below) return options.base.wrap(parentContext);

    return makeLimitsStack(parentContext, {
      ...options,
      above,
      below,
      type: options?.type ?? 'mop',
    });
  }

  /**
   * Add an ID attribute to both the box and this atom so that the atom
   * can be retrieved from the box later on, e.g. when the box is clicked on.
   */
  bind(context: Context, box: Box | null): Box | null {
    if (!box) return null;
    // Don't bind to phantom boxes (they won't be interactive, so no need for the id)
    if (context.isPhantom) return box;

    if (!box || this.value === '\u200B') return box;

    if (!this.id) this.id = context.makeID();
    box.atomID = this.id!;

    return box;
  }

  /**
   * Create a box with the specified body.
   */
  createBox(
    context: Context,
    options?: {
      classes?: string;
      newList?: boolean;
    }
  ): Box {
    const value = this.value ?? this.body;

    // Ensure that the atom type is a valid Box type
    const type: BoxType | undefined = isBoxType(this.type)
      ? this.type
      : undefined;

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
            mode: this.mode,
            maxFontSize: context.scalingFactor,
            style: {
              variant: 'normal', // Will auto-italicize
              ...this.style,
              letterShapeStyle: context.letterShapeStyle,
              fontSize: Math.max(
                1,
                context.size + context.mathstyle.sizeDelta
              ) as FontSize,
            },
            classes,
            newList: options?.newList,
          })
        : Atom.createBox(context, value, {
            type,
            mode: this.mode,
            style: this.style,
            classes,
            newList: options?.newList,
          }) ?? new Box(null);

    // Set other attributes
    if (context.isTight) result.isTight = true;

    // The italic correction applies only in math mode
    if (this.mode !== 'math') result.italic = 0;
    result.right = result.italic; // Italic correction

    // To retrieve the atom from a box, for example when the box is clicked
    // on, attach a unique ID to the box and associate it with the atom.
    this.bind(context, result);
    if (this.caret) {
      // If this has a super/subscript, the caret will be attached
      // to the 'msubsup' atom, so no need to have it here.
      if (!this.superscript && !this.subscript) {
        result.caret = this.caret;
      }
    }

    return result;
  }
}

/**
 *
 * @param atoms the list of atoms to emit as LaTeX
 * @param options.expandMacro true if macros should be expanded
 * @result a LaTeX string
 */
export function atomsToLatex(
  atoms: undefined | Atom[],
  options: ToLatexOptions
): string {
  if (!atoms || atoms.length === 0) return '';
  if (atoms[0].type === 'first') {
    if (atoms.length === 1) return '';
    // Remove the 'first' atom, if present
    atoms = atoms.slice(1);
  }

  if (atoms.length === 0) return '';

  return joinLatex(
    getPropertyRuns(atoms, 'cssClass').map((x) =>
      joinLatex(
        getPropertyRuns(x, 'color').map((x) =>
          joinLatex(getModeRuns(x).map((x) => Mode.serialize(x, options)))
        )
      )
    )
  );
}

function getStyleRuns(atoms: Atom[]): Atom[][] {
  let style: Style | undefined = undefined;
  let selected;
  const runs: Atom[][] = [];
  let run: Atom[] = [];
  for (const atom of atoms) {
    const atomStyle = atom.computedStyle;
    if (!style && !atom.style) {
      run.push(atom);
    } else if (
      style &&
      selected === atom.isSelected &&
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
      style = atom.computedStyle;
      selected = atom.isSelected;
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
  options?: {
    type?: BoxType;
    classes?: string;
    style?: Style;
    mode?: ParseMode;
    newList?: boolean;
  }
): Box | null {
  function isDigit(atom: Atom): boolean {
    return (
      atom.type === 'mord' && Boolean(atom.value) && /^[\d,.]$/.test(atom.value)
    );
  }

  function isText(atom: Atom): boolean {
    return atom.mode === 'text';
  }

  if (!atoms || atoms.length === 0) return null;

  const context = new Context(parentContext, options?.style);

  // In most cases we want to display selection,
  // except if the `atomIdsSettings.groupNumbers` flag is set which is used for
  // read aloud.
  const displaySelection =
    !context.atomIdsSettings || !context.atomIdsSettings.groupNumbers;

  let boxes: Box[] | null = [];
  if (atoms.length === 1) {
    const box = atoms[0].render(context, {
      newList: options?.newList ?? false,
    });
    if (box && displaySelection && atoms[0].isSelected) {
      box.selected(true);
    }
    if (box) boxes = [box];
  } else {
    let selection: Box[] = [];
    let digitOrTextStringID = '';
    let lastWasDigit = true;
    let isNewList = options?.newList ?? false;
    for (const atom of atoms) {
      if (
        context.atomIdsSettings?.groupNumbers &&
        digitOrTextStringID &&
        ((lastWasDigit && isDigit(atom)) || (!lastWasDigit && isText(atom)))
      ) {
        context.atomIdsSettings.overrideID = digitOrTextStringID;
      }

      const box = atom.render(context, { newList: isNewList });
      if (context.atomIdsSettings) {
        context.atomIdsSettings.overrideID = undefined;
      }

      if (box) {
        isNewList = false;
        // If this is a digit or text run, keep track of it
        if (context.atomIdsSettings?.groupNumbers) {
          if (isDigit(atom) || isText(atom)) {
            if (!digitOrTextStringID || lastWasDigit !== isDigit(atom)) {
              // Changed from text to digits or vice-versa
              lastWasDigit = isDigit(atom);
              digitOrTextStringID = atom.id ?? '';
            }
          }

          if (
            (!(isDigit(atom) || isText(atom)) ||
              !atom.hasEmptyBranch('superscript') ||
              !atom.hasEmptyBranch('subscript')) &&
            digitOrTextStringID
          ) {
            // Done with digits/text
            digitOrTextStringID = '';
          }
        }

        if (displaySelection && atom.isSelected) {
          selection.push(box);
          for (const box of selection) box.selected(true);
        } else {
          if (selection.length > 0) {
            // There was a selection, but we're out of it now
            // Append the selection
            boxes = [...boxes, ...selection];
            selection = [];
          }

          boxes.push(box);
        }
      }
    }

    // Is there a leftover selection?
    if (selection.length > 0) {
      boxes = [...boxes, ...selection];
      selection = [];
    }
  }

  if (!boxes || boxes.length === 0) return null;

  let result: Box = boxes[0];
  if (options || boxes.length > 1) {
    result = new Box(boxes, {
      isTight: context.isTight,
      ...options,
    });
    result.selected(boxes[0].isSelected);
  }

  // Apply size correction
  return result.wrap(context).wrap(parentContext);
}
