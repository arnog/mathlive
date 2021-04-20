import { makeStruts, Span } from '../core/span';
import { MATHSTYLES } from '../core/mathstyle';

import { Rect, getSelectionBounds, isValidMathfield } from './utils';
import type { MathfieldPrivate } from './mathfield-private';

import { atomsToMathML } from '../addons/math-ml';
import { Atom, Context } from '../core/core';
import { updatePopoverPosition } from '../editor/popover';

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
        mathfield._atomBoundsCache = new Map<string, Rect>();
        render(mathfield, options);
        mathfield._atomBoundsCache = undefined;
      }
    });
  }
}

/**
 * Lay-out the mathfield and generate the DOM.
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
  renderOptions = renderOptions ?? {};
  mathfield.dirty = false;
  const { model } = mathfield;

  //
  // 1. Stop and reset read aloud state
  //
  if (window.mathlive === undefined) {
    window.mathlive = {};
  }

  //
  // 2. Update selection state and blinking cursor (caret)
  //
  model.root.caret = undefined;
  model.root.isSelected = false;
  model.root.containsCaret = true;
  for (const atom of model.atoms) {
    atom.caret = undefined;
    atom.isSelected = false;
    atom.containsCaret = false;
  }
  const hasFocus = mathfield.hasFocus() && !mathfield.options.readOnly;
  if (model.selectionIsCollapsed) {
    model.at(model.position).caret = hasFocus ? mathfield.mode : '';
  } else {
    for (const atom of model.getAtoms(model.selection, {
      includeChildren: true,
    })) {
      atom.isSelected = true;
    }
  }

  if (hasFocus) {
    let ancestor = model.at(model.position).parent;
    while (ancestor) {
      // The `surd` and `leftright` types of atom have a special display,
      // mark the first of them in the path from the caret (`position`) to
      // the root  as such.
      if (ancestor.type === 'surd' || ancestor.type === 'leftright') {
        ancestor.containsCaret = true;
        break;
      }

      ancestor = ancestor.parent;
    }
  }

  //
  // 3. Render spans
  //
  const base = model.root.render(
    new Context({
      mathstyle: MATHSTYLES.displaystyle,
      letterShapeStyle: mathfield.options.letterShapeStyle,
      atomIdsSettings: {
        // Using the hash as a seed for the ID
        // keeps the IDs the same until the content of the field changes.
        seed: hash(Atom.toLatex(model.root, { expandMacro: false })),
        // The `groupNumbers` flag indicates that extra spans should be generated
        // to represent group of atoms, for example, a span to group
        // consecutive digits to represent a number.
        groupNumbers: renderOptions.forHighlighting,
      },
      smartFence: mathfield.options.smartFence,
      macros: mathfield.options.macros,
    })
  );

  //
  // 4. Construct struts around the spans
  //
  const wrapper = makeStruts(base, { classes: 'ML__mathlive' });
  wrapper.attributes = {
    // Sometimes Google Translate kicks in an attempts to 'translate' math
    // This doesn't work very well, so turn off translate
    'translate': 'no',
    // Hint to screen readers to not attempt to read this <span>.
    // They should use instead the 'aria-label' attribute.
    'aria-hidden': 'true',
  };

  //
  // 5. Generate markup and accessible node
  //
  const isFocused = mathfield.field.classList.contains('ML__focused');
  if (isFocused && !hasFocus) {
    mathfield.field.classList.remove('ML__focused');
  } else if (!isFocused && hasFocus) {
    mathfield.field.classList.add('ML__focused');
  }

  mathfield.field.innerHTML = mathfield.options.createHTML(
    wrapper.toMarkup({
      hskip: 0,
      hscale: mathfield.options.horizontalSpacingScale,
    })
  );
  mathfield.fieldContent = mathfield.field.querySelector('.ML__mathlive');

  mathfield.accessibleNode.innerHTML = mathfield.options.createHTML(
    '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
      atomsToMathML(model.root, mathfield.options) +
      '</math>'
  );

  //
  // 6. Render the selection
  //
  if (!model.selectionIsCollapsed) {
    renderSelection(mathfield);
    if (!(renderOptions.interactive ?? false)) {
      // (re-render a bit later because the layout, sometimes, is not
      // up to date by now)
      setTimeout(() => renderSelection(mathfield), 32);
    }
  } else {
    // The popover is relative to the location of the caret
    setTimeout(() => updatePopoverPosition(mathfield), 32);
  }
}

export function renderSelection(mathfield: MathfieldPrivate): void {
  for (const element of mathfield.field.querySelectorAll('.ML__selection')) {
    element.remove();
  }

  for (const x of uniqueRects(getSelectionBounds(mathfield))) {
    const selectionElement = document.createElement('div');
    selectionElement.classList.add('ML__selection');
    selectionElement.style.position = 'absolute';
    selectionElement.style.left = `${x.left}px`;
    selectionElement.style.top = `${x.top}px`;
    selectionElement.style.width = `${Math.ceil(x.right - x.left)}px`;
    selectionElement.style.height = `${Math.ceil(x.bottom - x.top - 1)}px`;
    mathfield.field.insertBefore(
      selectionElement,
      mathfield.field.childNodes[0]
    );
  }
}

/**
 * Return the rects that are not entirely contained by other rects.
 */
function uniqueRects(rects: Rect[]): Rect[] {
  const result = [];
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
