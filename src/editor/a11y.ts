import type { TextToSpeechOptions } from '../public/options';

import type { Atom } from '../core/atom';

import { atomsToMathML } from '../addons/math-ml';
import { speakableText } from './speech';
import { selectionIsCollapsed, getSelectedAtoms } from './model-selection';
import type { ModelPrivate } from './model-class';
import type { MathfieldPrivate } from './mathfield-class';
import type { PathSegment } from './path';

/**
 * Given an atom and its parent, describe the relationship between the atom
 * and its siblings and their parent.
 */
function relationName(parent: Atom, leaf: PathSegment): string {
    const EXPR_NAME = {
        //    'array': 'should not happen',
        numer: 'numerator',
        denom: 'denominator',
        index: 'index',
        body: 'parent',
        subscript: 'subscript',
        superscript: 'superscript',
    };
    const PARENT_NAME = {
        enclose: 'cross out',
        leftright: 'fence',
        surd: 'square root',
        root: 'math field',
    };
    return leaf.relation === 'body'
        ? PARENT_NAME[parent.type]
        : EXPR_NAME[leaf.relation];
}

/**
 * Announce a change in selection or content via the aria-live region.
 *
 * @param action The action that invoked the change.
 * @param oldModel The previous value of the model before the change.
 */
export function defaultAnnounceHook(
    mathfield: MathfieldPrivate,
    action: string,
    oldModel: ModelPrivate,
    atoms: Atom[]
): void {
    //** Fix: the focus is the end of the selection, so it is before where we want it
    let liveText = '';
    // const action = moveAmount > 0 ? "right" : "left";

    if (action === 'plonk') {
        // Use this sound to indicate (minor) errors, for
        // example when a action has no effect.
        if (mathfield.plonkSound) {
            mathfield.plonkSound.load();
            mathfield.plonkSound.play().catch((err) => console.warn(err));
        }
        // As a side effect, reset the keystroke buffer
        mathfield.resetKeystrokeBuffer();
    } else if (action === 'delete') {
        liveText = speakableText(mathfield.options, 'deleted: ', atoms);
        //*** FIX: could also be moveUp or moveDown -- do something different like provide context???
    } else if (action === 'focus' || /move/.test(action)) {
        //*** FIX -- should be xxx selected/unselected */
        liveText =
            getRelationshipAsSpokenText(mathfield.model, oldModel) +
            (selectionIsCollapsed(mathfield.model) ? '' : 'selected: ') +
            getNextAtomAsSpokenText(mathfield.model, mathfield.options);
    } else if (action === 'replacement') {
        // announce the contents
        liveText = speakableText(
            mathfield.options,
            '',
            mathfield.model.sibling(0)
        );
    } else if (action === 'line') {
        // announce the current line -- currently that's everything
        mathfield.accessibleNode.innerHTML = mathfield.options.createHTML(
            '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
                atomsToMathML(mathfield.model.root, mathfield.options) +
                '</math>'
        );

        liveText = speakableText(mathfield.options, '', mathfield.model.root);
        mathfield.keyboardDelegate.setAriaLabel('after: ' + liveText);

        /*** FIX -- testing hack for setting braille ***/
        // mathfield.accessibleNode.focus();
        // console.log("before sleep");
        // sleep(1000).then(() => {
        //     mathfield.textarea.focus();
        //     console.log("after sleep");
        // });
    } else {
        liveText = atoms
            ? speakableText(mathfield.options, action + ' ', atoms)
            : action;
    }
    // aria-live regions are only spoken when it changes; force a change by
    // alternately using nonbreaking space or narrow nonbreaking space
    const ariaLiveChangeHack = /\u00a0/.test(mathfield.ariaLiveText.textContent)
        ? ' \u202f '
        : ' \u00a0 ';
    mathfield.ariaLiveText.textContent = liveText + ariaLiveChangeHack;
    // this.textarea.setAttribute('aria-label', liveText + ariaLiveChangeHack);
}

function getRelationshipAsSpokenText(
    model: ModelPrivate,
    previousModel: ModelPrivate
): string {
    const previousPath = previousModel ? previousModel.path : [];
    const path = model.path;
    let result = '';
    while (previousPath.length > path.length) {
        result +=
            'out of ' +
            relationName(
                previousModel.parent(),
                previousPath[previousPath.length - 1]
            ) +
            '; ';
        previousPath.pop();
    }
    return result;
}

/**
 *
 * Return the spoken text for the atom to the right of the current selection.
 * Take into consideration the position amongst siblings to include 'start of'
 * and 'end of' if applicable.
 */
function getNextAtomAsSpokenText(
    model: ModelPrivate,
    options: TextToSpeechOptions
): string {
    const path = model.path;
    const leaf = path[path.length - 1];
    let result = '';
    if (!selectionIsCollapsed(model)) {
        return speakableText(options, '', getSelectedAtoms(model));
    }
    // announce start of denominator, etc
    const relation = relationName(model.parent(), leaf);
    if (leaf.offset === 0) {
        result += (relation ? 'start of ' + relation : 'unknown') + ': ';
    }
    const atom = model.sibling(Math.max(1, model.extent));
    if (atom) {
        result += speakableText(options, '', atom);
    } else if (leaf.offset !== 0) {
        // don't say both start and end
        result += relation ? 'end of ' + relation : 'unknown';
    }
    return result;
}
