import { Box, makeStruts } from '../core/box';

import {
  Rect,
  getSelectionBounds,
  isValidMathfield,
  getAtomBounds,
  adjustForScrolling,
} from './utils';
import type { _Mathfield } from './mathfield-private';

import { updateSuggestionPopoverPosition } from '../editor/suggestion-popover';
import { gFontsState } from '../core/fonts';
import { Context } from 'core/context';
import { Atom } from 'core/atom-class';
import { applyInterBoxSpacing } from '../core/inter-box-spacing';
import { convertLatexToMarkup } from 'public/mathlive';

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
  mathfield: _Mathfield | undefined | null,
  options?: { interactive: boolean }
): void {
  if (!mathfield) return;
  if (mathfield.dirty) return;
  mathfield.dirty = true;
  requestAnimationFrame(() => {
    if (isValidMathfield(mathfield) && mathfield.dirty) {
      mathfield.atomBoundsCache = new Map<string, Rect>();
      render(mathfield, options);
      mathfield.atomBoundsCache = undefined;
    }
  });
}

/**
 * Return a box representing the content of the mathfield.
 * @param mathfield
 * @param renderOptions
 */
function makeBox(
  mathfield: _Mathfield,
  renderOptions?: { forHighlighting?: boolean; interactive?: boolean }
): Box {
  renderOptions = renderOptions ?? {};
  const context = new Context({
    from: {
      ...mathfield.context,
      atomIdsSettings: {
        // Using the hash as a seed for the ID
        // keeps the IDs the same until the content of the field changes.
        seed: renderOptions.forHighlighting
          ? hash(
              Atom.serialize([mathfield.model.root], {
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
      letterShapeStyle: mathfield.options.letterShapeStyle as
        | 'tex'
        | 'french'
        | 'iso'
        | 'upright',
    },
    mathstyle:
      mathfield.options.defaultMode === 'inline-math'
        ? 'textstyle'
        : 'displaystyle',
  });
  const base = mathfield.model.root.render(context)!;

  //
  // 3. Construct struts around the boxes
  //
  const wrapper = makeStruts(applyInterBoxSpacing(base, context), {
    classes: mathfield.hasEditablePrompts
      ? 'ML__latex ML__prompting'
      : 'ML__latex',
    attributes: {
      // Sometimes Google Translate kicks in an attempts to 'translate' math
      // This doesn't work very well, so turn off translate
      'translate': 'no',
      // Hint to screen readers to not attempt to read this <span>.
      // They should use instead the 'aria-label' attribute.
      'aria-hidden': 'true',
    },
  });

  return wrapper;
}

export function contentMarkup(
  mathfield: _Mathfield,
  renderOptions?: { forHighlighting?: boolean; interactive?: boolean }
): string {
  //
  // 1. Update selection state and blinking cursor (caret)
  //
  const { model } = mathfield;
  model.root.caret = undefined;
  model.root.isSelected = false;
  model.root.containsCaret = true;
  for (const atom of model.atoms) {
    atom.caret = undefined;
    atom.isSelected = false;
    atom.containsCaret = false;
  }
  if (model.selectionIsCollapsed) {
    const atom = model.at(model.position);
    atom.caret = mathfield.model.mode;
    let ancestor = atom.parent;
    while (ancestor) {
      ancestor.containsCaret = true;
      ancestor = ancestor.parent;
    }
  } else {
    const atoms = model.getAtoms(model.selection, { includeChildren: true });
    for (const atom of atoms) atom.isSelected = true;
  }

  //
  // 2. Render a box representation of the mathfield content
  //
  const box = makeBox(mathfield, renderOptions);

  //
  // 3. Generate markup
  //

  return box.toMarkup();
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
  mathfield: _Mathfield,
  renderOptions?: { forHighlighting?: boolean; interactive?: boolean }
): void {
  if (!isValidMathfield(mathfield)) return;
  renderOptions ??= {};

  //
  // 1. Hide the virtual keyboard toggle if not applicable
  //

  const keyboardToggle = mathfield.element.querySelector<HTMLElement>(
    '[part=virtual-keyboard-toggle]'
  );
  if (keyboardToggle)
    keyboardToggle.style.display = mathfield.hasEditableContent ? '' : 'none';

  // NVA tries (and fails) to read MathML, so skip it for now
  // mathfield.accessibleMathML.innerHTML = mathfield.options.createHTML(
  //   '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
  //     toMathML(model.root, mathfield.options) +
  //     '</math>'
  // );

  //
  // 2. Render the content
  //

  const field = mathfield.field;
  if (!field) return;

  const hasFocus = mathfield.isSelectionEditable && mathfield.hasFocus();
  const isFocused = field.classList.contains('ML__focused');

  if (isFocused && !hasFocus) field.classList.remove('ML__focused');
  else if (!isFocused && hasFocus) field.classList.add('ML__focused');

  let content = contentMarkup(mathfield, renderOptions);

  const menuToggle =
    mathfield.element.querySelector<HTMLElement>('[part=menu-toggle]');
  if (menuToggle) {
    if (
      mathfield.model.atoms.length <= 1 ||
      mathfield.disabled ||
      (mathfield.readOnly && !mathfield.hasEditableContent) ||
      mathfield.userSelect === 'none'
    )
      menuToggle.style.display = 'none';
    else menuToggle.style.display = '';
  }

  //
  // 3. Render the content placeholder, if applicable
  //
  // If the mathfield is emply, display a placeholder
  if (mathfield.model.atoms.length <= 1) {
    const placeholder = mathfield.options.contentPlaceholder;
    if (placeholder) {
      content += `<span part=placeholder class="ML__content-placeholder">${convertLatexToMarkup(
        placeholder
      )}</span>`;
    }
  }

  field.innerHTML = window.MathfieldElement.createHTML(content);

  //
  // 4. Render the selection/caret
  //
  renderSelection(mathfield, renderOptions.interactive);

  mathfield.dirty = false;
}

export function renderSelection(
  mathfield: _Mathfield,
  interactive?: boolean
): void {
  const field = mathfield.field;

  // In some rare cases, we can get called (via a timeout) when the field
  // is either no longer ready, or not yet ready. Bail.
  if (!field) return;

  // Remove existing selection
  for (const element of field.querySelectorAll(
    '.ML__selection, .ML__contains-highlight'
  ))
    element.remove();

  if (
    !(interactive ?? false) &&
    gFontsState !== 'error' &&
    gFontsState !== 'ready'
  ) {
    // If the fonts are not loaded, or if they are still loading, schedule
    // a re-render of the selection to a bit later. If after waiting a bit
    // the fonts are still not ready,
    // Once the fonts are loaded, the layout may shift due to the glyph metrics
    // being different after font-substitution, which may affect rendering of
    // the selection
    setTimeout(() => {
      if (gFontsState === 'ready') renderSelection(mathfield);
      else setTimeout(() => renderSelection(mathfield), 128);
    }, 32);
  }

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
    updateSuggestionPopoverPosition(mathfield, { deferred: true });

    //
    // 1.2. Display the 'contains' highlight
    //
    let atom = model.at(model.position);
    while (atom && !(atom.containsCaret && atom.displayContainsHighlight))
      atom = atom.parent!;

    if (atom?.containsCaret && atom.displayContainsHighlight) {
      const bounds = adjustForScrolling(
        mathfield,
        getAtomBounds(mathfield, atom),
        scaleFactor
      );

      if (bounds) {
        bounds.left /= scaleFactor;
        bounds.right /= scaleFactor;
        bounds.top /= scaleFactor;
        bounds.bottom /= scaleFactor;

        const element = document.createElement('div');
        element.classList.add('ML__contains-highlight');
        element.style.position = 'absolute';
        element.style.left = `${bounds.left + 1}px`;
        element.style.top = `${Math.ceil(bounds.top)}px`;
        element.style.width = `${Math.ceil(bounds.right - bounds.left + 1)}px`;
        element.style.height = `${Math.ceil(bounds.bottom - bounds.top)}px`;
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
