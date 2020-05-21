import type { TextToSpeechOptions } from '../public/config';

import type { Atom } from '../core/atom';

import { atomsToMathML } from '../addons/math-ml';
import { speakableText } from './speech';
import { selectionIsCollapsed, getSelectedAtoms } from './model-selection';
import type { ModelPrivate } from './model-class';
import type { MathfieldPrivate } from './mathfield-class';
import type { PathSegment } from './path';

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
        liveText = speakableText(mathfield.config, 'deleted: ', atoms);
        //*** FIX: could also be moveUp or moveDown -- do something different like provide context???
    } else if (action === 'focus' || /move/.test(action)) {
        //*** FIX -- should be xxx selected/unselected */
        liveText =
            (selectionIsCollapsed(mathfield.model) ? '' : 'selected: ') +
            nextAtomSpeechText(mathfield, oldModel);
    } else if (action === 'replacement') {
        // announce the contents
        liveText = speakableText(
            mathfield.config,
            '',
            mathfield.model.sibling(0)
        );
    } else if (action === 'line') {
        // announce the current line -- currently that's everything
        liveText = speakableText(mathfield.config, '', mathfield.model.root);
        mathfield.accessibleNode.innerHTML = mathfield.config.createHTML(
            '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
                atomsToMathML(mathfield.model.root, mathfield.config) +
                '</math>'
        );

        mathfield.textarea.setAttribute('aria-label', 'after: ' + liveText);

        /*** FIX -- testing hack for setting braille ***/
        // mathfield.accessibleNode.focus();
        // console.log("before sleep");
        // sleep(1000).then(() => {
        //     mathfield.textarea.focus();
        //     console.log("after sleep");
        // });
    } else {
        liveText = atoms
            ? speakableText(mathfield.config, action + ' ', atoms)
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

/* Returns the speech text of the next atom after the selection or
 *   an 'end of' phrasing based on what structure we are at the end of
 */
// @revisit. Currently this = MathfieldPrivate, but it looks like model is enough
function nextAtomSpeechText(
    mathfield: MathfieldPrivate,
    oldModel: ModelPrivate
): string {
    function relation(parent: Atom, leaf: PathSegment): string {
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
    const oldPath = oldModel ? oldModel.path : [];
    const path = mathfield.model.path;
    const leaf = path[path.length - 1];
    let result = '';
    while (oldPath.length > path.length) {
        result +=
            'out of ' +
            relation(oldModel.parent(), oldPath[oldPath.length - 1]) +
            '; ';
        oldPath.pop();
    }
    if (!selectionIsCollapsed(mathfield.model)) {
        return speakableText(
            mathfield.config as Required<TextToSpeechOptions>,
            '',
            getSelectedAtoms(mathfield.model)
        );
    }
    // announce start of denominator, etc
    const relationName = relation(mathfield.model.parent(), leaf);
    if (leaf.offset === 0) {
        result +=
            (relationName ? 'start of ' + relationName : 'unknown') + ': ';
    }
    const atom = mathfield.model.sibling(Math.max(1, mathfield.model.extent));
    if (atom) {
        result += speakableText(
            mathfield.config as Required<TextToSpeechOptions>,
            '',
            atom
        );
    } else if (leaf.offset !== 0) {
        // don't say both start and end
        result += relationName ? 'end of ' + relationName : 'unknown';
    }
    return result;
}
