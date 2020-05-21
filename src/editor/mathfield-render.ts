import { decompose } from '../core/atom-utils';
import { makeSpan, makeStruts } from '../core/span';
import { MATHSTYLES } from '../core/mathstyle';

import { pathToString } from './path';
import {
    selectionIsCollapsed,
    getAnchor,
    forEachSelected,
} from './model-selection';
import { getSelectionBounds, isValidMathfield } from './mathfield-utils';
import type { MathfieldPrivate } from './mathfield-class';

import { atomsToMathML } from '../addons/math-ml';

/*
 * Return a hash (32-bit integer) representing the content of the mathfield
 * (but not the selection state)
 */
function hash(latex: string) {
    let result = 0;
    for (let i = 0; i < latex.length; i++) {
        result = result * 31 + latex.charCodeAt(i);
        result = result | 0; // Force it to a 32-bit number
    }
    return Math.abs(result);
}

export function requestUpdate(mathfield: MathfieldPrivate) {
    if (!mathfield.dirty) {
        mathfield.dirty = true;
        requestAnimationFrame(() => {
            if (isValidMathfield(mathfield) && mathfield.dirty) {
                render(mathfield);
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
export function render(mathfield: MathfieldPrivate, renderOptions?) {
    renderOptions = renderOptions ?? {};
    mathfield.dirty = false;
    //
    // 1. Stop and reset read aloud state
    //
    if (!window['mathlive']) {
        window['mathlive'] = {};
    }
    //
    // 2. Validate selection
    //
    if (!getAnchor(mathfield.model)) {
        console.warn(
            'Invalid selection, resetting it. ' +
                pathToString(mathfield.model.path)
        );
        mathfield.model.path = [{ relation: 'body', offset: 0 }];
    }
    //
    // 3. Update selection state and blinking cursor (caret)
    //
    mathfield.model.root.forEach((a) => {
        a.caret = '';
        a.isSelected = false;
        a.containsCaret = false;
    });
    const hasFocus = mathfield.$hasFocus();
    if (selectionIsCollapsed(mathfield.model)) {
        getAnchor(mathfield.model).caret =
            hasFocus && !mathfield.config.readOnly ? mathfield.mode : '';
    } else {
        forEachSelected(mathfield.model, (a) => {
            a.isSelected = true;
        });
    }

    if (hasFocus && !mathfield.config.readOnly) {
        let ancestor = mathfield.model.ancestor(1);
        let i = 1;
        let done = false;
        while (ancestor && !done) {
            if (ancestor.type === 'surd' || ancestor.type === 'leftright') {
                ancestor.containsCaret = true;
                done = true;
            }
            i += 1;
            ancestor = mathfield.model.ancestor(i);
        }
    }
    //
    // 4. Create spans corresponding to the updated mathlist
    //
    const spans = decompose(
        {
            mathstyle: MATHSTYLES.displaystyle,
            letterShapeStyle: mathfield.config.letterShapeStyle,
            atomIdsSettings: {
                // Using the hash as a seed for the ID
                // keeps the IDs the same until the content of the field changes.
                seed: hash(mathfield.model.root.toLatex(false)),
                // The `groupNumbers` flag indicates that extra spans should be generated
                // to represent group of atoms, for example, a span to group
                // consecutive digits to represent a number.
                groupNumbers: renderOptions.forHighlighting,
            },
            smartFence: mathfield.config.smartFence,
            macros: mathfield.config.macros,
        },
        mathfield.model.root
    );
    //
    // 5. Construct struts around the spans
    //
    const base = makeSpan(spans, 'ML__base');
    base.attributes = {
        // Sometimes Google Translate kicks in an attempts to 'translate' math
        // This doesn't work very well, so turn off translate
        translate: 'no',
        // Hint to screen readers to not attempt to read this span
        // They should use instead the 'aria-label' below.
        'aria-hidden': 'true',
    };
    const wrapper = makeStruts(base, 'ML__mathlive');

    //
    // 6. Generate markup and accessible node
    //
    mathfield.field.innerHTML = mathfield.config.createHTML(
        wrapper.toMarkup(0, mathfield.config.horizontalSpacingScale)
    );
    mathfield.field.classList.toggle(
        'ML__focused',
        hasFocus && !mathfield.config.readOnly
    );

    mathfield.accessibleNode.innerHTML = mathfield.config.createHTML(
        '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
            atomsToMathML(mathfield.model.root, mathfield.config) +
            '</math>'
    );
    //mathfield.ariaLiveText.textContent = "";

    //
    // 7. Calculate selection rectangle
    //
    const selectionRect = getSelectionBounds(mathfield.field);
    if (selectionRect) {
        const selectionElement = document.createElement('div');
        selectionElement.classList.add('ML__selection');
        selectionElement.style.position = 'absolute';
        selectionElement.style.left = selectionRect.left + 'px';
        selectionElement.style.top = selectionRect.top + 'px';
        selectionElement.style.width =
            Math.ceil(selectionRect.right - selectionRect.left) + 'px';
        selectionElement.style.height =
            Math.ceil(selectionRect.bottom - selectionRect.top - 1) + 'px';
        mathfield.field.insertBefore(
            selectionElement,
            mathfield.field.childNodes[0]
        );
    }
}
