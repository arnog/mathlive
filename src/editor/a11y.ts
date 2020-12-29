import type { TextToSpeechOptions } from '../public/options';

import { Atom } from '../core/atom';

// Import { atomsToMathML } from '../addons/math-ml';
import { speakableText } from './speech';
import type { ModelPrivate } from '../editor-model/model-private';
import type { MathfieldPrivate } from '../editor-mathfield/mathfield-private';
import { AnnounceVerb } from '../editor-model/utils';

/**
 * Given an atom, describe the relationship between the atom
 * and its siblings and their parent.
 */
function relationName(atom: Atom): string {
  let result: string;
  if (atom.treeBranch === 'body') {
    result = {
      enclose: 'cross out',
      leftright: 'fence',
      surd: 'square root',
      root: 'math field',
      mop: 'operator', // E.g. `\operatorname`, a `mop` with a body
    }[atom.parent.type];
  } else if (atom.parent.type === 'genfrac') {
    if (atom.treeBranch === 'above') {
      return 'numerator';
    }

    if (atom.treeBranch === 'below') {
      return 'denominator';
    }
  } else if (atom.parent.type === 'surd') {
    if (atom.treeBranch === 'above') {
      result = 'index';
    }
  } else if (atom.treeBranch === 'superscript') {
    result = 'superscript';
  } else if (atom.treeBranch === 'subscript') {
    result = 'subscript';
  }

  if (!result) {
    console.log('unknown relationship');
  }

  return result ?? 'parent';
}

/**
 * Announce a change in selection or content via the aria-live region.
 *
 * @param action The action that invoked the change.
 * @param previousPosition The position of the insertion point before the change
 */
export function defaultAnnounceHook(
  mathfield: MathfieldPrivate,
  action: AnnounceVerb,
  previousPosition?: number,
  atoms?: Atom[]
): void {
  //* * Fix: the focus is the end of the selection, so it is before where we want it
  let liveText = '';
  // Const action = moveAmount > 0 ? "right" : "left";

  if (action === 'plonk') {
    // Use this sound to indicate minor errors, for
    // example when an action has no effect.
    mathfield.plonkSound?.play().catch((error) => console.warn(error));
    // As a side effect, reset the keystroke buffer
    mathfield.resetKeystrokeBuffer();
  } else if (action === 'delete') {
    liveText = speakableText(mathfield.options, 'deleted: ', atoms);
    //* ** FIX: could also be moveUp or moveDown -- do something different like provide context???
  } else if (action === 'focus' || action.includes('move')) {
    //* ** FIX -- should be xxx selected/unselected */
    liveText =
      getRelationshipAsSpokenText(mathfield.model, previousPosition) +
      (mathfield.model.selectionIsCollapsed ? '' : 'selected: ') +
      getNextAtomAsSpokenText(mathfield.model, mathfield.options);
  } else if (action === 'replacement') {
    // Announce the contents
    liveText = speakableText(
      mathfield.options,
      '',
      mathfield.model.at(mathfield.model.position)
    );
  } else if (action === 'line') {
    // Announce the current line -- currently that's everything
    // mathfield.accessibleNode.innerHTML = mathfield.options.createHTML(
    //     '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
    //         atomsToMathML(mathfield.model.root, mathfield.options) +
    //         '</math>'
    // );

    liveText = speakableText(mathfield.options, '', mathfield.model.root);
    mathfield.keyboardDelegate.setAriaLabel('after: ' + liveText);

    /** * FIX -- testing hack for setting braille ***/
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

  // Aria-live regions are only spoken when it changes; force a change by
  // alternately using nonbreaking space or narrow nonbreaking space
  const ariaLiveChangeHack = mathfield.ariaLiveText.textContent.includes(' ')
    ? ' \u202F '
    : ' \u00A0 ';
  mathfield.ariaLiveText.textContent = liveText + ariaLiveChangeHack;
  // This.textarea.setAttribute('aria-label', liveText + ariaLiveChangeHack);
}

function getRelationshipAsSpokenText(
  model: ModelPrivate,
  previousOffset?: number
): string {
  if (Number.isNaN(previousOffset)) return '';
  const previous = model.at(previousOffset);
  if (!previous) return '';
  if (previous.treeDepth <= model.at(model.position).treeDepth) {
    return '';
  }

  let result = '';
  let ancestor = previous.parent;
  const newParent = model.at(model.position).parent;
  while (ancestor !== model.root && ancestor !== newParent) {
    result += `out of ${relationName(ancestor)};`;
    ancestor = ancestor.parent;
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
  if (!model.selectionIsCollapsed) {
    return speakableText(options, '', model.getAtoms(model.selection));
  }

  let result = '';

  // Announce start of denominator, etc
  const cursor = model.at(model.position);
  const relation = relationName(cursor);
  if (cursor.isFirstSibling) {
    result = (relation ? 'start of ' + relation : 'unknown') + ': ';
  }

  if (cursor.isLastSibling) {
    // Don't say both start and end
    if (!cursor.isFirstSibling) {
      result += relation ? 'end of ' + relation : 'unknown';
    }
  } else {
    result += speakableText(options, '', cursor);
  }

  return result;
}
