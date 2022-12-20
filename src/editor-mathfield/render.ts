import { adjustInterAtomSpacing, Box, makeStruts } from '../core/box';

import {
  Rect,
  getSelectionBounds,
  isValidMathfield,
  getAtomBounds,
  adjustForScrolling,
} from './utils';
import type { MathfieldPrivate } from './mathfield-private';

import { toMathML } from '../addons/math-ml';
import { Atom, Context, DEFAULT_FONT_SIZE } from '../core/core';
import { updatePopoverPosition } from '../editor/popover';
import { throwIfNotInBrowser } from '../common/capabilities';

/*
 * Return a hash (32-bit integer) representing the content of the mathfield
 * (but not the selection state)
 */
function hash(latex: string): number {
  let result = 0;
  for (let i = 0; i < latex.length; i++) {
    result = result * 31 + latex.charCodeAt(i);
    result = result | 0; // Force it to a 32-bit integer
  }

  return Math.abs(result);
}

export function requestUpdate(
  mathfield: MathfieldPrivate,
  options?: { interactive: boolean }
): void {
  if (!mathfield.dirty) {
    mathfield.dirty = true;
    requestAnimationFrame(() => {
      if (isValidMathfield(mathfield) && mathfield.dirty) {
        mathfield.atomBoundsCache = new Map<string, Rect>();
        render(mathfield, options);
        mathfield.atomBoundsCache = undefined;
      }
    });
  }
}

/**
 * Return a box representing the content of the mathfield.
 * @param mathfield
 * @param renderOptions
 */
function makeBox(
  mathfield: MathfieldPrivate,
  renderOptions?: { forHighlighting?: boolean; interactive?: boolean }
): Box {
  renderOptions = renderOptions ?? {};
  const base = mathfield.model.root.render(
    new Context(
      {
        registers: mathfield.registers,
        atomIdsSettings: {
          // Using the hash as a seed for the ID
          // keeps the IDs the same until the content of the field changes.
          seed: renderOptions.forHighlighting
            ? hash(
                Atom.serialize(mathfield.model.root, {
                  expandMacro: false,
                  defaultMode: mathfield.options.defaultMode,
                })
              )
            : 'random',
          // The `groupNumbers` flag indicates that extra boxes should be generated
          // to represent group of atoms, for example, a box to group
          // consecutive digits to represent a number.
          groupNumbers: renderOptions.forHighlighting ?? false,
        },
        renderPlaceholder: mathfield.options.readOnly
          ? (context: Context, p) => {
              if (p.placeholderId) {
                const field = mathfield.getPlaceholderField(p.placeholderId!)!;
                return p.createMathfieldBox(context, field, p.placeholderId);
              }
              return p.createBox(context);
            }
          : undefined,
      },
      {
        fontSize: DEFAULT_FONT_SIZE,
        letterShapeStyle: mathfield.options.letterShapeStyle,
      },
      mathfield.options.defaultMode === 'inline-math'
        ? 'textstyle'
        : 'displaystyle'
    )
  )!;

  //
  // 3. Construct struts around the boxes
  //
  const wrapper = makeStruts(
    adjustInterAtomSpacing(base, mathfield.options.horizontalSpacingScale),
    {
      classes: 'ML__mathlive',
      attributes: {
        // Sometimes Google Translate kicks in an attempts to 'translate' math
        // This doesn't work very well, so turn off translate
        'translate': 'no',
        // Hint to screen readers to not attempt to read this <span>.
        // They should use instead the 'aria-label' attribute.
        'aria-hidden': 'true',
      },
    }
  );
  return wrapper;
}

/**
 * Layout the mathfield and generate the DOM.
 *
 * This is usually done automatically, but if the font-size, or other geometric
 * attributes are modified, outside of MathLive, this function may need to be
 * called explicitly.
 *
 */
export function render(
  mathfield: MathfieldPrivate,
  renderOptions?: { forHighlighting?: boolean; interactive?: boolean }
): void {
  throwIfNotInBrowser();
  if (!isValidMathfield(mathfield)) return;

  renderOptions = renderOptions ?? {};
  const { model } = mathfield;

  //
  // 1. Update selection state and blinking cursor (caret)
  //
  model.root.caret = '';
  model.root.isSelected = false;
  model.root.containsCaret = true;
  for (const atom of model.atoms) {
    atom.caret = '';
    atom.isSelected = false;
    atom.containsCaret = false;
  }
  const hasFocus = !mathfield.options.readOnly && mathfield.hasFocus();
  if (model.selectionIsCollapsed)
    model.at(model.position).caret = hasFocus ? mathfield.mode : '';
  else {
    const atoms = model.getAtoms(model.selection, { includeChildren: true });
    for (const atom of atoms) atom.isSelected = true;
  }

  if (hasFocus) {
    let ancestor = model.at(model.position).parent;
    while (ancestor) {
      ancestor.containsCaret = true;
      ancestor = ancestor.parent;
    }
  }

  //
  // 2. Render a box representation of the mathfield content
  //
  const box = makeBox(mathfield, renderOptions);

  //
  // 3. Generate markup and accessible node
  //
  const field = mathfield.field;
  const isFocused = field.classList.contains('ML__focused');
  if (isFocused && !hasFocus) field.classList.remove('ML__focused');
  else if (!isFocused && hasFocus) field.classList.add('ML__focused');

  field.innerHTML = mathfield.options.createHTML(box.toMarkup());
  mathfield.fieldContent = field.querySelector('.ML__mathlive')!;

  mathfield.accessibleNode.innerHTML = mathfield.options.createHTML(
    '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
      toMathML(model.root, mathfield.options) +
      '</math>'
  );

  //
  // 4. Render the selection/caret
  //
  renderSelection(mathfield);
  if (mathfield.options.readOnly) mathfield.attachNestedMathfield();

  if (!(renderOptions.interactive ?? false)) {
    // (re-render a bit later because the layout may not be up to date right
    //  now. This happens in particular when first loading and the fonts are
    //  not yet available. )
    setTimeout(() => renderSelection(mathfield), 32);
  }

  mathfield.dirty = false;
}

export function renderSelection(mathfield: MathfieldPrivate): void {
  throwIfNotInBrowser();

  const field = mathfield.field;

  // In some rare cases, we can get called (via a timeout) when the field
  // is either no longer ready, or not yet ready. Bail.
  if (!field) return;

  // Remove existing selection
  for (const element of field.querySelectorAll(
    '.ML__selection, .ML__contains-highlight'
  ))
    element.remove();

  if (!mathfield.hasFocus()) return;

  const model = mathfield.model;

  // Logic to accommodate mathfield hosted in an isotropically scale-transformed element.
  // Without this, the selection indicator will not be in the right place.
  // 1. Inquire how big the mathfield thinks it is
  const supposedWidth = parseFloat(getComputedStyle(field).width);
  // 2. Get the actual screen width of the box
  const actualWidth = field.getBoundingClientRect().width;
  // 3. Divide the two to get the scale factor
  let scaleFactor = actualWidth / supposedWidth;
  scaleFactor = isNaN(scaleFactor) ? 1 : scaleFactor;

  if (model.selectionIsCollapsed) {
    //
    // 1.1. Display the popover relative to the location of the caret
    //
    setTimeout(() => updatePopoverPosition(mathfield), 32);

    //
    // 1.2. Display the 'contains' highlight
    //
    let atom = model.at(model.position);
    while (atom && !(atom.containsCaret && atom.displayContainsHighlight))
      atom = atom.parent!;

    if (atom?.containsCaret && atom.displayContainsHighlight) {
      const bounds = adjustForScrolling(
        mathfield,
        getAtomBounds(mathfield, atom)
      );

      if (bounds) {
        bounds.left /= scaleFactor;
        bounds.right /= scaleFactor;
        bounds.top /= scaleFactor;
        bounds.bottom /= scaleFactor;

        const element = document.createElement('div');
        element.classList.add('ML__contains-highlight');
        element.style.position = 'absolute';
        element.style.left = `${bounds.left}px`;
        element.style.top = `${bounds.top}px`;
        element.style.width = `${Math.ceil(bounds.right - bounds.left)}px`;
        element.style.height = `${Math.ceil(bounds.bottom - bounds.top - 1)}px`;
        field.insertBefore(element, field.childNodes[0]);
      }
    }

    return;
  }

  //
  // 2. Display the non-collapsed selection
  //

  for (const x of unionRects(
    getSelectionBounds(mathfield, { excludeAtomsWithBackground: true })
  )) {
    x.left /= scaleFactor;
    x.right /= scaleFactor;
    x.top /= scaleFactor;
    x.bottom /= scaleFactor;

    const selectionElement = document.createElement('div');
    selectionElement.classList.add('ML__selection');
    selectionElement.style.position = 'absolute';
    selectionElement.style.left = `${x.left}px`;
    selectionElement.style.top = `${x.top}px`;
    selectionElement.style.width = `${Math.ceil(x.right - x.left)}px`;
    selectionElement.style.height = `${Math.ceil(x.bottom - x.top - 1)}px`;
    field.insertBefore(selectionElement, field.childNodes[0]);
  }
}

/**
 * Return the rects that are not entirely contained by other rects.
 */
function unionRects(rects: Rect[]): Rect[] {
  let result: Rect[] = [];

  // Remove duplicate rects
  for (const rect of rects) {
    let found = false;
    for (const rect2 of result) {
      if (
        rect.left === rect2.left &&
        rect.right === rect2.right &&
        rect.top === rect2.top &&
        rect.bottom === rect2.bottom
      ) {
        found = true;
        break;
      }
    }
    if (!found) result.push(rect);
  }
  rects = result;
  result = [];
  for (const rect of rects) {
    let count = 0;
    for (const rect2 of rects) {
      if (
        rect.left >= rect2.left &&
        rect.right <= rect2.right &&
        rect.top >= rect2.top &&
        rect.bottom <= rect2.bottom
      ) {
        count += 1;
        if (count > 1) break;
      }
    }
    if (count === 1) result.push(rect);
  }
  return result;
}
