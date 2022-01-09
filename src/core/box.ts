import { isArray } from '../common/types';

import { Style, ParseMode } from '../public/core';
import { getCharacterMetrics } from './font-metrics';
import { svgBodyToMarkup, svgBodyHeight } from './svg-box';
import { Mode } from './modes-utils';
import { Context } from './context';

/*
 * See https://tex.stackexchange.com/questions/81752/
 * for a thorough description of the TeX atom type and their relevance to
 * proper kerning.
 *
 * See TeXBook p. 158 for a list of the "atom types"
 * Note: we are not using the following types: 'over', 'under', 'acc', 'rad',
 * 'vcent'
 */

const BOX_TYPE = [
  '',
  'chem',
  'mord', // > is an ordinary atom like ‘x’ ;
  'mbin', // > is a binary operation atom like ‘+’
  'mop', // > is a large operator atom like $$\sum$$
  'mrel', // > is a relation atom like ‘=’
  'mopen', // > is an opening atom like ‘(’
  'mclose', // > is a closing atom like ‘)’
  'mpunct', // > is a punctuation atom like ‘,’
  'minner', // >  is an inner atom like ‘$$\frac12$$'
  'spacing',
  'first',
  'latex',
  'composition',
  'error',
  'placeholder',
  'supsub',
  'none',
  'mathfield',
] as const; // The const assertion prevents widening to string[]
export type BoxType = typeof BOX_TYPE[number];

export function isBoxType(type: string): type is BoxType {
  return (BOX_TYPE as unknown as string[]).includes(type);
}

/*
 * See http://www.tug.org/TUGboat/tb30-3/tb96vieth.pdf for
 * typesetting conventions for mathematical physics (units, etc...)
 */

/**
 * TeXBook, p. 170
 *
 * > In fact, TEX’s rules for spacing in formulas are fairly simple. A formula is
 * > converted to a math list as described at the end of Chapter 17, and the math
 * > list consists chiefly of “atoms” of eight basic types: Ord (ordinary),
 * > Op (large operator), Bin (binary operation), Rel (relation), Open (opening),
 * > Close (closing), Punct (punctuation), and Inner (a delimited subformula).
 * > Other kinds of atoms, which arise from commands like \overline or
 * > \mathaccent or \vcenter, etc., are all treated as type Ord; fractions are
 * > treated as type Inner.
 *
 * > The following table is used to determine the spacing between pair of adjacent
 * > atoms.
 *
 * In this table
 * - "3" = `\thinmuskip`
 * - "4" = `\medmuskip`
 * - "5" = `\thickmuskip`
 *
 */

const INTER_ATOM_SPACING = {
  mord: { mop: 3, mbin: 4, mrel: 5, minner: 3 },
  mop: { mord: 3, mop: 3, rel: 5, minner: 3 },
  mbin: { mord: 4, mop: 4, mopen: 4, minner: 4 },
  mrel: { mord: 5, mop: 5, mopen: 5, minner: 5 },
  mclose: { mop: 3, mbin: 4, mrel: 5, minner: 3 },
  mpunct: { mord: 3, mop: 3, mrel: 3, mopen: 3, mpunct: 3, minner: 3 },
  minner: { mord: 3, mop: 3, mbin: 4, mrel: 5, mopen: 3, mpunct: 3, minner: 3 },
};

/**
 * This table is used when the mathstyle is 'tight' (scriptstyle or
 * scriptscriptstyle).
 */
const INTER_ATOM_TIGHT_SPACING = {
  mord: { mop: 3 },
  mop: { mord: 3, mop: 3 },
  mclose: { mop: 3 },
  minner: { mop: 3 },
};

/**
 * Return a string made up of the concatenated arguments.
 * Each arguments can be either a string, which is unchanged,
 * or a number, which is converted to a string with at most 2 fractional digits.
 *
 */
function toString(value: string | number): string;
function toString(value: number, unit?: string): string;
function toString(arg1?: number | string, arg2?: string): string {
  if (typeof arg1 === 'string') {
    return arg1;
  }

  if (typeof arg1 === 'number') {
    console.assert(Number.isFinite(arg1));
    const numValue = Math.ceil(1e2 * arg1) / 1e2;
    if (numValue === 0) return '0';
    return numValue.toString() + (arg2 ?? '');
  }

  return '';
}

export type BoxCSSProperties =
  | 'background-color'
  | 'border'
  | 'border-bottom'
  | 'border-color'
  | 'border-left'
  | 'border-radius'
  | 'border-right'
  | 'border-right-width'
  | 'border-top'
  | 'border-top-width'
  | 'box-sizing'
  | 'color'
  | 'display'
  | 'font-family'
  | 'left'
  | 'font-size'
  | 'height'
  | 'line-height'
  | 'margin'
  | 'margin-top'
  | 'margin-left'
  | 'margin-right'
  | 'opacity'
  | 'padding'
  | 'position'
  | 'top'
  | 'vertical-align'
  | 'width'
  | 'z-index';

export type BoxOptions = {
  classes?: string;
  properties?: Partial<Record<BoxCSSProperties, string>>;
  attributes?: Record<string, string>;
  type?: BoxType;
  isTight?: boolean;
  height?: number;
  depth?: number;
  maxFontSize?: number;

  newList?: boolean;

  mode?: ParseMode;
  style?: Style; // If a `style` option is provided, a `mode` must also be provided.

  fontFamily?: string;
};

//----------------------------------------------------------------------------
// BOX
//----------------------------------------------------------------------------
/**
 * A box is the most elementary element that can be rendered.
 * It is composed of an optional body of text and an optional list
 * of children (other boxes). Each box can be decorated with
 * CSS classes and style attributes.
 *
 * @param content the items 'contained' by this node
 * @param classes list of classes attributes associated with this node


 * @property  type - For example, `'latex'`, `'mrel'`, etc...
 * @property classes - A string of space separated CSS classes
 * associated with this element
 * @property cssId - A CSS ID assigned to this box (optional)
 * @property htmlData - data fields assigned to this box (optional)
 * @property children - An array, potentially empty, of boxes which
 * this box encloses
 * @property cssProperties - A set of key/value pairs specifying CSS properties
 * associated with this element.
 * @property height - The measurement from baseline to top, in em.
 * @property depth - The measurement from baseline to bottom, in em.
 */
export class Box {
  type: BoxType;

  children?: Box[];
  // If true, this atom (and its children) should be considered as part of
  // a 'new list', in the TeX sense. That happens when a new branch
  // (superscript, etc...) is begun. This is important to correctly adjust
  // the 'type' of boxes, and calculate their interspacing correctly.
  newList: boolean;
  value: string;

  classes: string;

  caret: ParseMode;
  isSelected: boolean;

  height: number; // Distance above the baseline, in em
  depth: number; // Distance below the baseline, in em
  skew: number;
  italic: number;
  // The maxFontSize is a dimension in em large enough that the browser will
  // reserve at least that space above the baseline.
  maxFontSize: number;

  isTight?: boolean;

  cssId?: string;
  htmlData?: string;
  htmlStyle?: string;

  svgBody?: string;
  svgOverlay?: string;
  svgStyle?: string;

  delim?: string; // @revisit

  protected attributes?: Record<string, string>; // HTML attributes, for example 'data-atom-id'

  protected cssProperties: Partial<Record<BoxCSSProperties, string>>;

  constructor(
    content: null | number | string | Box | (Box | null)[],
    options?: BoxOptions
  ) {
    if (typeof content === 'number') {
      this.value = String.fromCodePoint(content);
    } else if (typeof content === 'string') {
      this.value = content;
    } else if (isArray<Box | null>(content)) {
      this.children = content.filter((x) => x !== null) as Box[];
    } else if (content && content instanceof Box) {
      this.children = [content];
    }

    this.type = options?.type ?? '';
    this.isSelected = false;
    this.isTight = options?.isTight ?? false;
    this.newList = options?.newList ?? false;

    // CSS style, as a set of key value pairs.
    // Use `Box.setStyle()` to modify it.
    if (options?.properties) {
      for (const prop of Object.keys(options.properties)) {
        this.setStyle(prop as BoxCSSProperties, options.properties[prop]);
      }
    }

    if (options?.attributes) this.attributes = options.attributes;

    // Set initial classes
    this.classes = options?.classes ?? '';

    let fontName: string | null = options?.fontFamily ?? 'Main-Regular';
    if (options?.style && this.value) {
      fontName =
        Mode.applyStyle(options.mode ?? 'math', this, options.style) ??
        'Main-Regular';
    }

    this.height = 0;
    this.depth = 0;
    this.skew = 0;
    this.italic = 0;
    this.maxFontSize = 0;

    //
    // Calculate the dimensions of this box
    //
    if (typeof content === 'number') {
      //
      // A codepoint, as used by delimiters
      //
      const metrics = getCharacterMetrics(content, fontName);
      this.height = metrics.height;
      this.depth = metrics.depth;
      this.skew = metrics.skew;
      this.italic = metrics.italic;
      // Account for the italic slant in the right margin
      // This is required for symbols (big parentheses, integral, etc...)
      this.right = metrics.italic;
    } else if (this.value) {
      //
      // A regular symbol
      //

      // Get the metrics information
      this.height = -Infinity;
      this.depth = -Infinity;
      this.skew = -Infinity;
      this.italic = -Infinity;
      // @revisit: when this.value has more than one char it can be for
      // a string like "cos", but sometimes it can be a multi-code-point grapheme
      for (let i = 0; i < this.value.length; i++) {
        const metrics = getCharacterMetrics(
          this.value.codePointAt(i),
          fontName ?? 'Main-Regular'
        );
        this.height = Math.max(this.height, metrics.height);
        this.depth = Math.max(this.depth, metrics.depth);
        this.skew = metrics.skew;
        this.italic = metrics.italic;
      }
      this.right = this.italic;
    } else if (this.type === 'latex') {
      //
      // Fixed width (and height) characters from "latex mode"
      //
      this.height = 0.8;
      this.depth = 0.2;
    } else if (this.children && this.children.length > 0) {
      //
      // A sequence of boxes
      //

      if (this.children.length === 1) {
        //
        // A single child: inherit its metrics
        //
        const child = this.children[0];
        this.height = child.height;
        this.depth = child.depth;
        this.maxFontSize = child.maxFontSize;
        this.skew = child.skew;
        this.italic = child.italic;
      } else {
        //
        // More than one child, assume they are being laid out horizontally
        // (we'll override the height/depth later if that wasn't the case)
        //

        let height = -Infinity;
        let depth = -Infinity;
        let maxFontSize = 0;
        for (const child of this.children) {
          if (child.height > height) height = child.height;
          if (child.depth > depth) depth = child.depth;
          maxFontSize = Math.max(maxFontSize, child.maxFontSize ?? 0);
        }
        this.height = height;
        this.depth = depth;
        this.maxFontSize = maxFontSize;
      }
    }

    //
    // If a height/depth override was provided, use it.
    //
    if (options?.height !== undefined) this.height = options.height;
    if (options?.depth !== undefined) this.depth = options.depth;
    if (options?.maxFontSize !== undefined) {
      this.maxFontSize = options.maxFontSize;
    }
  }

  set atomID(id: string) {
    if (id === undefined) return;
    if (!this.attributes) this.attributes = {};
    this.attributes['data-atom-id'] = id;
  }

  selected(isSelected: boolean): void {
    this.isSelected = isSelected;
    if (this.children) {
      for (const child of this.children) {
        child.selected(isSelected);
      }
    }
  }

  /**
   * Set the value of a CSS property associated with this box.
   * For example, setStyle('border-right', 5.6, 'em');
   *
   * @param prop the CSS property to set
   * @param value a series of strings and numbers that will be concatenated.
   */
  setStyle(prop: BoxCSSProperties, value: string | undefined): void;
  setStyle(prop: BoxCSSProperties, value: number, unit?: string): void;
  setStyle(
    prop: BoxCSSProperties,
    value: string | number | undefined,
    unit?: string
  ): void {
    // console.assert(
    //   prop !== 'height' || typeof value !== 'number' || value >= 0
    // );
    const v = toString(value as number, unit);
    if (v.length > 0) {
      if (!this.cssProperties) this.cssProperties = {};
      this.cssProperties[prop] = v;
    }
  }

  setTop(top: number): void {
    if (Number.isFinite(top) && Math.abs(top) > 1e-2) {
      if (!this.cssProperties) this.cssProperties = {};
      this.cssProperties.top = toString(top, 'em');
      this.height -= top;
      this.depth += top;
    }
  }

  get left(): number {
    if (this.cssProperties?.['margin-left']) {
      return Number.parseFloat(this.cssProperties['margin-left']);
    }

    return 0;
  }

  set left(value: number) {
    if (!Number.isFinite(value)) return;
    if (!this.cssProperties) this.cssProperties = {};
    if (value === 0) {
      delete this.cssProperties['margin-left'];
    } else {
      this.cssProperties['margin-left'] = toString(value, 'em');
    }
  }

  set right(value: number) {
    if (!Number.isFinite(value)) return;
    if (!this.cssProperties) this.cssProperties = {};
    if (value === 0) {
      delete this.cssProperties['margin-right'];
    } else {
      this.cssProperties['margin-right'] = toString(value, 'em');
    }
  }

  set width(value: number) {
    if (!this.cssProperties) this.cssProperties = {};
    this.cssProperties.width = toString(value, 'em');
  }

  /**
   * If necessary wrap this box with another one that adjust the font-size
   * to account for a change in size between the context and its parent.
   * Also, apply color and background-color attributes.
   */
  wrap(
    context: Context,
    options?: {
      classes: string;
      type: '' | 'mopen' | 'mclose' | 'minner';
    }
  ): Box {
    const parent = context.parent;

    // If we're at the root, nothing to do
    if (!parent) return this;

    if (context.isPhantom) {
      this.setStyle('opacity', 0);
    }

    const newColor =
      context.computedColor === parent.computedColor
        ? undefined
        : context.color;

    //
    // Apply color changes to the box
    //
    this.setStyle('color', newColor);

    const newSize =
      context.effectiveFontSize === parent.effectiveFontSize
        ? undefined
        : context.effectiveFontSize;

    const newBackgroundColor =
      context.computedBackgroundColor === parent.computedBackgroundColor
        ? undefined
        : context.backgroundColor;

    //
    // Wrap the box if necessary.
    //
    // Note that when the size changes, the font-size should be applied to
    // the wrapper, not to the nucleus, otherwise the size of the element
    // (which is used to calculate the selection rectangle)is incorrect
    //
    if (
      !newSize &&
      !newBackgroundColor &&
      !(options && (options.classes || options.type))
    ) {
      return this;
    }

    let result: Box;
    if (newBackgroundColor) {
      result = makeStruts(this, options);
      result.selected(this.isSelected);
      result.setStyle('background-color', newBackgroundColor);
      result.setStyle('display', 'inline-block');
    } else {
      result = new Box(this, options);
    }
    //
    // Adjust the dimensions to account for the size variations
    //
    const factor = context.scalingFactor;
    if (factor !== 1.0) {
      result.setStyle('font-size', factor * 100, '%');
      result.height *= factor;
      result.depth *= factor;
      result.italic *= factor;
      result.skew *= factor;
    }
    return result;
  }

  /**
   * Generate the HTML markup to represent this box.
   */

  toMarkup(): string {
    let body = this.value ?? '';

    //
    // 1. Render the children
    //
    if (this.children) {
      for (const box of this.children) {
        body += box.toMarkup();
      }
    }

    //
    // 2. Calculate the classes associated with this box
    //
    const classes = this.classes.split(' ');

    classes.push(
      {
        latex: 'ML__latex',
        placeholder: 'ML__placeholder',
        error: 'ML__error',
      }[this.type] ?? ''
    );
    if (this.caret === 'latex') {
      classes.push('ML__latex-caret');
    }

    // Remove duplicate and empty classes
    const classList =
      classes.length === 1
        ? classes[0]
        : classes
            .filter((x, e, a) => x.length > 0 && a.indexOf(x) === e)
            .join(' ');

    //
    // 3. Markup for props and SVG
    //
    let result = '';
    if (
      (body.length > 0 && body !== '\u200B') ||
      classList.length > 0 ||
      this.cssId ||
      this.htmlData ||
      this.htmlStyle ||
      this.attributes ||
      this.cssProperties ||
      this.svgBody ||
      this.svgOverlay
    ) {
      let props = '';

      if (this.cssId) {
        // A (HTML5) CSS id may not contain a space
        props += ` id=${this.cssId.replace(/ /g, '-')} `;
      }
      if (this.htmlData) {
        const entries = this.htmlData.split(',');
        for (const entry of entries) {
          const matched = entry.match(/([^=]+)=(.+$)/);
          if (matched) {
            const key = matched[1].trim().replace(/ /g, '-');
            if (key) {
              props += ` data-${key}=${matched[2]} `;
            }
          } else {
            const key = entry.trim().replace(/ /g, '-');
            if (key) {
              props += ` data-${key} `;
            }
          }
        }
      }
      if (this.htmlStyle) {
        const entries = this.htmlStyle.split(';');
        let styleString = '';
        for (const entry of entries) {
          const matched = entry.match(/([^=]+):(.+$)/);
          if (matched) {
            const key = matched[1].trim().replace(/ /g, '-');
            if (key) {
              styleString += `${key}:${matched[2]};`;
            }
          }
        }
        if (styleString) {
          props += ` style="${styleString}"`;
        }
      }

      if (this.attributes) {
        props +=
          ' ' +
          Object.keys(this.attributes)
            .map((x) => `${x}="${this.attributes![x]}"`)
            .join(' ');
      }

      if (classList.length > 0) {
        props += ` class="${classList}"`;
      }

      if (this.cssProperties) {
        const styleString = Object.keys(this.cssProperties)
          .map((x) => `${x}:${this.cssProperties[x]}`)
          .join(';');

        if (styleString.length > 0) {
          props += ` style="${styleString}"`;
        }
      }

      //
      // If there is some SVG markup associated with this box,
      // include it now
      //
      let svgMarkup = '';
      if (this.svgBody) {
        svgMarkup = svgBodyToMarkup(this.svgBody);
      } else if (this.svgOverlay) {
        svgMarkup = '<span style="';
        svgMarkup += 'display: inline-block;';
        svgMarkup += `height:${this.height + this.depth}em;`;
        svgMarkup += `vertical-align:${this.depth}em;`;
        svgMarkup += '">';
        svgMarkup += body;
        svgMarkup += '</span>';
        svgMarkup += '<svg style="position:absolute;overflow:overlay;';
        svgMarkup += `height:${this.height + this.depth}em;`;
        if (this.cssProperties?.padding) {
          svgMarkup += `top:${this.cssProperties.padding}em;`;
          svgMarkup += `left:${this.cssProperties.padding}em;`;
          svgMarkup += `width:calc(100% - 2 * ${this.cssProperties.padding}em );`;
        } else {
          svgMarkup += 'top:0;left:0;width:100%;';
        }

        svgMarkup += 'z-index:2;';
        svgMarkup += '"';
        if (this.svgStyle) {
          svgMarkup += ` style="${this.svgStyle}"`;
        }

        svgMarkup += `>${this.svgOverlay}</svg>`;
      }

      // Note: We can't omit the tag, even if it has no props,
      // as some layouts (vlist) depends on the presence of the tag to function
      result = `<span${props}>${body}${svgMarkup}</span>`;
    }

    //
    // 4. Add markup for the caret
    //
    if (this.caret === 'text') {
      result += '<span class="ML__text-caret"></span>';
    } else if (this.caret === 'math') {
      result += '<span class="ML__caret"></span>';
    }

    return result;
  }

  /**
   * Can this box be coalesced with 'box'?
   * This is used to 'coalesce' (i.e. group together) a series of boxes that are
   * identical except for their value, and to avoid generating redundant boxes.
   * That is: '12' ->
   *      "<span class='crm'>12</span>"
   * rather than:
   *      "<span class='crm'>1</span><span class='crm'>2</span>"
   */
  tryCoalesceWith(box: Box): boolean {
    // Don't coalesce if the types are different
    if (this.type !== box.type) return false;

    // Only coalesce some types
    if (
      !/ML__text/.test(this.classes) &&
      !['mord', 'mbin', 'mrel'].includes(this.type)
    ) {
      return false;
    }

    // Don't coalesce if some of the content is SVG
    if (this.svgBody || !this.value) return false;
    if (box.svgBody || !box.value) return false;

    // If this box or the candidate box have children, we can't
    // coalesce them, but we'll try to coalesce their children
    const hasChildren = this.children && this.children.length > 0;
    const boxHasChildren = box.children && box.children.length > 0;
    if (hasChildren || boxHasChildren) return false;

    // If they have a different number of styles, can't coalesce
    const thisStyleCount = this.cssProperties
      ? Object.keys(this.cssProperties).length
      : 0;
    const boxStyleCount = box.cssProperties
      ? Object.keys(box.cssProperties).length
      : 0;
    if (thisStyleCount !== boxStyleCount) return false;

    // If the styles are different, can't coalesce
    if (thisStyleCount > 0) {
      for (const prop of Object.keys(this.cssProperties)) {
        if (this.cssProperties[prop] !== box.cssProperties[prop]) {
          return false;
        }
      }
    }

    // For the purpose of our comparison,
    // any 'empty' classes (whitespace)
    const classes = this.classes.trim().replace(/\s+/g, ' ').split(' ');
    const boxClasses = box.classes.trim().replace(/\s+/g, ' ').split(' ');

    // If they have a different number of classes, can't coalesce
    if (classes.length !== boxClasses.length) return false;

    // OK, let's do the more expensive comparison now.
    // If they have different classes, can't coalesce
    classes.sort();
    boxClasses.sort();
    for (const [i, class_] of classes.entries()) {
      // Don't coalesce vertical separators
      // (used in column formating with {l||r} for example
      if (class_ === 'vertical-separator') return false;
      if (class_ !== boxClasses[i]) return false;
    }

    // OK, the attributes of those boxes are compatible.
    // Merge box into this
    this.value += box.value;
    this.height = Math.max(this.height, box.height);
    this.depth = Math.max(this.depth, box.depth);
    this.maxFontSize = Math.max(this.maxFontSize, box.maxFontSize);
    // The italic correction for the coalesced boxes is the
    // italic correction of the last box.
    this.italic = box.italic;
    return true;
  }
}

/**
 * Attempts to coalesce (merge) boxes, for example consecutive text boxes.
 * Return a new tree with coalesced boxes.
 *
 */
function coalesceRecursive(boxes: undefined | Box[]): Box[] {
  if (!boxes || boxes.length === 0) return [];

  boxes[0].children = coalesceRecursive(boxes[0].children);
  const result = [boxes[0]];

  for (let i = 1; i < boxes.length; i++) {
    if (!result[result.length - 1].tryCoalesceWith(boxes[i])) {
      boxes[i].children = coalesceRecursive(boxes[i].children);
      result.push(boxes[i]);
    }
  }

  return result;
}

export function coalesce(box: Box): Box {
  if (box.children) box.children = coalesceRecursive(box.children);
  return box;
}

/**
 *  Handle proper spacing of, e.g. "-4" vs "1-4", by adjusting some box type
 */
function adjustType(root: Box | null): void {
  forEachBox(root, (prevBox: Box, box: Box) => {
    // TexBook p. 442:
    // > 5. If the current item is a Bin atom, and if this was the first atom in the
    // >   list, or if the most recent previous atom was Bin, Op, Rel, Open, or
    // >   Punct, change the current Bin to Ord and continue with Rule 14.
    // >   Otherwise continue with Rule 17.

    if (
      box.type === 'mbin' &&
      (!prevBox || /first|none|mbin|mop|mrel|mopen|mpunct/.test(prevBox.type))
    ) {
      box.type = 'mord';
    }
    // > 6. If the current item is a Rel or Close or Punct atom, and if the most
    // >   recent previous atom was Bin, change that previous Bin to Ord. Continue
    // >   with Rule 17.
    if (
      prevBox &&
      prevBox.type === 'mbin' &&
      /mrel|mclose|mpunct|placeholder/.test(box.type)
    ) {
      prevBox.type = 'mord';
    }
  });
}

//
// Adjust the atom(/box) types according to the TeX rules
//
function applyInterAtomSpacing(root: Box | null, scale: number): void {
  forEachBox(root, (prevBox: Box, box: Box) => {
    const prevType: BoxType = prevBox?.type ?? 'none';
    const table = box.isTight
      ? INTER_ATOM_TIGHT_SPACING[prevType] ?? null
      : INTER_ATOM_SPACING[prevType] ?? null;
    const hskip = table ? table[box.type] ?? 0 : 0;

    if (hskip) box.left += scale * (hskip / 18);
  });
}

/*
 * Iterate over each box, mimicking the TeX atom list walking logic
 * used to demote bin atoms to ord.
 *
 * Our boxes don't map one to one with atoms, since we may include
 * "construction" boxes that should be ignored. This function takes care
 * of that.
 *
 */

function forEachBoxRecursive(
  prevBox: Box | null,
  box: Box,
  f: (prevBox: Box | null, curBox: Box) => void
): Box | null {
  // The TeX algorithms scan each elements, and consider them to be part
  // of the same list of atoms, until they reach some branch points (superscript,
  // numerator,etc..). The boxes that indicate the start of a new list have
  // the `newList` property set.
  if (box.newList) prevBox = null;
  const type = box.type;

  if (type === 'first') {
    console.assert(box.newList === true);
    return null;
  }

  // Skip over first and spacing atoms
  if (type === 'spacing') {
    return prevBox;
  }

  f(prevBox, box);

  if (box.children) {
    let childPrev: Box | null = null;
    if (type === undefined || type.length === 0) {
      childPrev = prevBox;
    }
    for (const child of box.children) {
      childPrev = forEachBoxRecursive(childPrev, child, f);
    }
    if (type === undefined || type.length === 0) {
      prevBox = childPrev;
    }
  }

  if (type !== 'supsub' && type !== undefined && type.length > 0) {
    prevBox = box;
  }

  return prevBox;
}

function forEachBox(box: Box | null, f: (prevBox: Box, curBox: Box) => void) {
  if (!box) return;
  forEachBoxRecursive(null, box, f);
}

export function adjustInterAtomSpacing(root: Box, scale = 1.0): Box {
  adjustType(root);
  applyInterAtomSpacing(root, scale);
  return root;
}

// function spanToString(span: Span, indent = 0): string {
//   let result = '\n' + ' '.repeat(indent * 2);
//   if (span.value !== undefined) {
//     result += `"${span.svgBody ?? span.value}"`;
//   }
//   result += ` ${span.type ?? '????'} ${toString(span.height)} / ${toString(
//     span.depth
//   )} / ${span.maxFontSize}`;
//   if (span.children) {
//     for (const child of span.children) {
//       result += spanToString(child, indent + 1);
//     }
//   }
//   return result;
// }

//----------------------------------------------------------------------------
// UTILITY FUNCTIONS
//----------------------------------------------------------------------------

export function makeStruts(
  content: Box,
  options?: {
    classes?: string;
    type?: BoxType;
    attributes?: Record<string, string>;
  }
): Box {
  if (!content) return new Box(null, options);

  const topStrut = new Box(null, { classes: 'ML__strut' });
  topStrut.setStyle('height', Math.max(0, content.height), 'em');
  const struts = [topStrut];

  if (content.depth !== 0) {
    const bottomStrut = new Box(null, { classes: 'ML__strut--bottom' });
    bottomStrut.setStyle('height', content.height + content.depth, 'em');
    bottomStrut.setStyle('vertical-align', -content.depth, 'em');
    struts.push(bottomStrut);
  }

  struts.push(content);

  return new Box(struts, options);
}

/**
 * Add some SVG markup to be overlaid on top of the box
 */
export function addSVGOverlay(
  body: Box,
  svgMarkup: string,
  svgStyle: string
): Box {
  body.svgOverlay = svgMarkup;
  body.svgStyle = svgStyle;
  return body;
}

/**
 * Create a box that consist of a (stretchy) SVG element
 */
export function makeSVGBox(svgBodyName: string): Box {
  const height = svgBodyHeight(svgBodyName) / 2;
  const box = new Box(null, {
    height: height + 0.166,
    depth: height - 0.166,
    maxFontSize: 0,
  });
  box.svgBody = svgBodyName;
  return box;
}
