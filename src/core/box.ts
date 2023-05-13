import { isArray } from '../common/types';

import { getCharacterMetrics } from './font-metrics';
import { svgBodyToMarkup, svgBodyHeight } from './svg-box';
import { Context } from './context';
import { highlight } from './color';
import { BoxCSSProperties, ParseMode } from '../public/core-types';
import { Mode } from './modes-utils';
import { BoxInterface, BoxOptions, BoxType } from './types';
import { Atom, AtomType } from './atom-class';

export function boxType(type: AtomType | undefined): BoxType | undefined {
  if (!type) return undefined;
  const result = {
    mord: 'ord',
    mbin: 'bin',
    mop: 'op',
    mrel: 'rel',
    mopen: 'open',
    mclose: 'close',
    mpunct: 'punct',
    minner: 'inner',
    spacing: 'ignore',
    latex: 'latex',
    composition: 'inner',
    error: 'inner',
    placeholder: 'ord',
    supsub: 'ignore',
  }[type];

  return result;
}

export function atomsBoxType(atoms: Atom[]): BoxType {
  if (atoms.length === 0) return 'ord';
  const first = boxType(atoms[0].type);
  const last = boxType(atoms[atoms.length - 1].type);
  if (first && first === last) return first;
  return 'ord';
}

/**
 * Return a string made up of the concatenated arguments.
 * Each arguments can be either a string, which is unchanged,
 * or a number, which is converted to a string with at most 2 fractional digits.
 *
 */
function toString(value: string | number): string;
function toString(value: number, unit: string): string;
function toString(value: number | string, unit?: string): string;
function toString(arg1: number | string, arg2?: string): string {
  if (typeof arg1 === 'string') return arg1;

  if (typeof arg1 === 'number') {
    console.assert(Number.isFinite(arg1));
    const numValue = Math.ceil(1e2 * arg1) / 1e2;
    if (numValue === 0) return '0';
    return numValue.toString() + (arg2 ?? '');
  }

  return '';
}

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


 * @property  type - For example, `"latex"`, `"mrel"`, etc...
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
export class Box implements BoxInterface {
  type: BoxType;

  parent: Box | undefined;
  children?: Box[];
  value: string;

  classes: string;

  caret?: ParseMode;
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

  attributes?: Record<string, string>; // HTML attributes, for example 'data-atom-id'

  cssProperties?: Partial<Record<BoxCSSProperties, string>>;

  constructor(
    content: null | number | string | Box | (Box | null)[],
    options?: BoxOptions
  ) {
    if (typeof content === 'number') this.value = String.fromCodePoint(content);
    else if (typeof content === 'string') this.value = content;
    else if (isArray<Box | null>(content))
      this.children = content.filter((x) => x !== null) as Box[];
    else if (content && content instanceof Box) this.children = [content];

    if (this.children) for (const child of this.children) child.parent = this;

    this.type = options?.type ?? 'ignore';

    this.isSelected = options?.isSelected === true;
    if (options?.caret) this.caret = options.caret;

    this.classes = options?.classes ?? '';
    if (this.isSelected) this.classes += ' ML__selected';

    this.isTight = options?.isTight ?? false;

    // CSS style, as a set of key value pairs.
    // Use `Box.setStyle()` to modify it.
    if (options?.properties) {
      for (const prop of Object.keys(options.properties))
        this.setStyle(prop as BoxCSSProperties, options.properties[prop]);
    }

    if (options?.attributes) this.attributes = options.attributes;

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    let fontName = options?.fontFamily || 'Main-Regular';
    if (options?.style && this.value) {
      fontName =
        Mode.getFont(options.mode ?? 'math', this, {
          ...options.style,
          letterShapeStyle: options.letterShapeStyle,
        }) || 'Main-Regular';
    }

    this.height = 0;
    this.depth = 0;
    this.skew = 0;
    this.italic = 0;
    this.maxFontSize = 0;

    //
    // Calculate the dimensions of this box
    //
    if (this.type === 'latex') {
      //
      // Fixed width (and height) characters from "latex mode"
      //
      this.height = 0.8;
      this.depth = 0.2;
    } else if (typeof content === 'number') {
      //
      // A codepoint, as used by delimiters
      //
      const metrics = getCharacterMetrics(content, fontName);
      this.height = metrics.height;
      this.depth = metrics.depth;
      this.skew = metrics.skew;
      this.italic = metrics.italic;
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
          fontName || 'Main-Regular'
        );
        this.height = Math.max(this.height, metrics.height);
        this.depth = Math.max(this.depth, metrics.depth);
        this.skew = metrics.skew;
        this.italic = metrics.italic;
      }
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
    if (options?.maxFontSize !== undefined)
      this.maxFontSize = options.maxFontSize;
  }

  set atomID(id: string | undefined) {
    if (id === undefined || id.length === 0) return;
    if (!this.attributes) this.attributes = {};
    this.attributes['data-atom-id'] = id;
  }

  selected(isSelected: boolean): void {
    if (this.isSelected === isSelected) return;
    this.isSelected = isSelected;
    if (this.children)
      for (const child of this.children) child.selected(isSelected);
  }

  /**
   * Set the value of a CSS property associated with this box.
   * For example, setStyle('margin-right', 5.6, 'em');
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
    if (value === undefined) return;
    const v = toString(value, unit);
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
    if (this.cssProperties?.['margin-left'])
      return Number.parseFloat(this.cssProperties['margin-left']);

    return 0;
  }

  set left(value: number) {
    if (!Number.isFinite(value)) return;
    if (value === 0) {
      if (this.cssProperties) delete this.cssProperties['margin-left'];
    } else {
      if (!this.cssProperties) this.cssProperties = {};
      this.cssProperties['margin-left'] = toString(value, 'em');
    }
  }

  set right(value: number) {
    if (!Number.isFinite(value)) return;
    if (value === 0) {
      if (this.cssProperties) delete this.cssProperties['margin-right'];
    } else {
      if (!this.cssProperties) this.cssProperties = {};
      this.cssProperties['margin-right'] = toString(value, 'em');
    }
  }

  set width(value: number) {
    if (!Number.isFinite(value)) return;
    if (value === 0) {
      if (this.cssProperties) delete this.cssProperties.width;
    } else {
      if (!this.cssProperties) this.cssProperties = {};
      this.cssProperties.width = toString(value, 'em');
    }
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
      type: 'open' | 'close' | 'inner';
    }
  ): Box {
    const parent = context.parent;

    // If we're at the root, nothing to do
    if (!parent) return this;

    if (context.isPhantom) this.setStyle('opacity', 0);

    let newColor = context.color;
    if (newColor === parent.color) newColor = '';

    //
    // Apply color changes to the box
    //
    this.setStyle('color', newColor);

    const newSize =
      context.effectiveFontSize === parent.effectiveFontSize
        ? undefined
        : context.effectiveFontSize;

    let backgroundColor = context.backgroundColor;
    if (this.isSelected) backgroundColor = highlight(backgroundColor);

    if (backgroundColor === parent.backgroundColor) backgroundColor = '';

    if (backgroundColor) {
      this.setStyle('background-color', backgroundColor);
      this.setStyle('display', 'inline-block');
    }

    //
    // Wrap the box if necessary.
    //
    // Note that when the size changes, the font-size should be applied to
    // the wrapper, not to the nucleus, otherwise the size of the element
    // (which is used to calculate the selection rectangle)is incorrect
    //
    if (!newSize && !(options && (options.classes || options.type)))
      return this;

    const result = new Box(this, { ...options, type: 'lift' });
    //
    // Adjust the dimensions to account for the size variations
    // (since the dimensions are in em, adjusting the font-size will have
    // the same effect)
    //
    const factor = context.scalingFactor;
    if (factor !== 1.0) result.setStyle('font-size', factor * 100, '%');
    return result;
  }

  /**
   * Generate the HTML markup to represent this box.
   */

  toMarkup(): string {
    let body = this.value ?? '';
    // console.log('box.ts > toMarkUp() > \n\t box:', this);

    //
    // 1. Render the children
    //
    if (this.children) for (const box of this.children) body += box.toMarkup();

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
    if (this.caret === 'latex') classes.push('ML__latex-caret');

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
        props += ` id="${this.cssId.replace(/ /g, '-')}" `;
      }
      if (this.htmlData) {
        const entries = this.htmlData.split(',');
        for (const entry of entries) {
          const matched = entry.match(/([^=]+)=(.+$)/);
          if (matched) {
            const key = matched[1].trim().replace(/ /g, '-');
            if (key) props += ` data-${key}="${matched[2]}" `;
          } else {
            const key = entry.trim().replace(/ /g, '-');
            if (key) props += ` data-${key} `;
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
            if (key) styleString += `${key}:${matched[2]};`;
          }
        }
        if (styleString) props += ` style="${styleString}"`;
      }

      if (this.attributes) {
        props +=
          ' ' +
          Object.keys(this.attributes)
            .map((x) => `${x}="${this.attributes![x]}"`)
            .join(' ');
      }

      if (classList.length > 0) props += ` class="${classList}"`;

      const cssProps = this.cssProperties;
      if (cssProps) {
        const styles = Object.keys(cssProps).map((x) => `${x}:${cssProps[x]}`);
        if (styles.length > 0) props += ` style="${styles.join(';')}"`;
      }

      //
      // If there is some SVG markup associated with this box,
      // include it now
      //
      let svgMarkup = '';
      if (this.svgBody) svgMarkup = svgBodyToMarkup(this.svgBody);
      else if (this.svgOverlay) {
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
        } else svgMarkup += 'top:0;left:0;width:100%;';

        svgMarkup += 'z-index:2;';
        svgMarkup += '"';
        if (this.svgStyle) svgMarkup += ` style="${this.svgStyle}"`;

        svgMarkup += `>${this.svgOverlay}</svg>`;
      }

      // Note: We can't omit the tag, even if it has no props,
      // as some layouts (vlist) depends on the presence of the tag to function
      result = `<span${props}>${body}${svgMarkup}</span>`;
    }

    //
    // 4. Add markup for the caret
    //
    if (this.caret === 'text') result += '<span class="ML__text-caret"></span>';
    else if (this.caret === 'math') result += '<span class="ML__caret"></span>';

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
    // if (this.type !== box.type) return false;

    // Only coalesce some types
    // if (
    //   !/ML__text/.test(this.classes) &&
    //   !['ord', 'bin', 'rel'].includes(this.type)
    // )
    //   return false;

    // Don't coalesce if some of the content is SVG
    if (this.svgBody || !this.value) return false;
    if (box.svgBody || !box.value) return false;

    // If this box or the candidate box have children, we can't
    // coalesce them, but we'll try to coalesce their children
    const hasChildren = this.children && this.children.length > 0;
    const boxHasChildren = box.children && box.children.length > 0;
    if (hasChildren || boxHasChildren) return false;

    if (box.cssProperties || this.cssProperties) {
      // If it contains unmergable properties, bail
      for (const prop of [
        'border',
        'border-left',
        'border-right',
        'border-right-width',
        'left',
        'margin',
        'margin-left',
        'margin-right',
        'padding',
        'position',
        'width',
      ]) {
        if (box.cssProperties && prop in box.cssProperties) return false;
        if (this.cssProperties && prop in this.cssProperties) return false;
      }
    }

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
      for (const prop of Object.keys(this.cssProperties!)) {
        if (this.cssProperties![prop] !== box.cssProperties![prop])
          return false;
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
  boxes = boxes?.filter(
    (x) =>
      !(
        x.height === 0 &&
        x.depth === 0 &&
        !x.value &&
        !x.classes &&
        !x.cssProperties
      )
  );

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

//----------------------------------------------------------------------------
// UTILITY FUNCTIONS
//----------------------------------------------------------------------------

export function makeStruts(
  content: Box,
  options?: {
    classes?: string;
    attributes?: Record<string, string>;
  }
): Box {
  if (!content) return new Box(null, options);

  const topStrut = new Box(null, { classes: 'ML__strut', type: 'ignore' });
  topStrut.setStyle('height', Math.max(0, content.height), 'em');
  const struts = [topStrut];

  if (content.depth !== 0) {
    const bottomStrut = new Box(null, {
      classes: 'ML__strut--bottom',
      type: 'ignore',
    });
    bottomStrut.setStyle('height', content.height + content.depth, 'em');
    bottomStrut.setStyle('vertical-align', -content.depth, 'em');
    struts.push(bottomStrut);
  }

  struts.push(content);

  return new Box(struts, { ...options, type: 'lift' });
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
