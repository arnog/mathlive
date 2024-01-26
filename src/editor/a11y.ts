import { Atom } from '../core/atom';
import { speakableText } from './speech';

import type { _Model } from '../editor-model/model-private';
import type { _Mathfield } from '../editor-mathfield/mathfield-private';
import type { AnnounceVerb } from 'editor-model/types';

/**
 * Given an atom, describe the relationship between the atom
 * and its siblings and their parent.
 */
function relationName(atom: Atom): string {
  let result: string | undefined = undefined;
  if (atom.parent!.type === 'prompt') {
    if (atom.parentBranch === 'body') result = 'prompt';
  } else if (atom.parentBranch === 'body') {
    result = !atom.type
      ? 'parent'
      : {
          enclose: 'cross out',
          leftright: 'delimiter',
          surd: 'square root',
          root: 'math field',
          mop: 'operator', // E.g. `\operatorname`, a `mop` with a body
          first: 'first',
        }[atom.type] ?? 'parent';
  } else if (atom.parent!.type === 'genfrac') {
    if (atom.parentBranch === 'above') return 'numerator';

    if (atom.parentBranch === 'below') return 'denominator';
  } else if (atom.parent!.type === 'surd') {
    if (atom.parentBranch === 'above') result = 'index';
  } else if (atom.parentBranch === 'superscript') result = 'superscript';
  else if (atom.parentBranch === 'subscript') result = 'subscript';

  if (!result) console.log('unknown relationship');

  return result ?? 'parent';
}

/**
 * Announce a change in selection or content via the aria-live region.
 *
 * @param action The action that invoked the change.
 * @param previousPosition The position of the insertion point before the change
 */
export function defaultAnnounceHook(
  mathfield: _Mathfield,
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
    globalThis.MathfieldElement.playSound('plonk');
    // As a side effect, reset the keystroke buffer
    mathfield.flushInlineShortcutBuffer();
  } else if (action === 'delete') liveText = speakableText('deleted: ', atoms!);
  //* ** FIX: could also be moveUp or moveDown -- do something different like provide context???
  else if (action === 'focus' || action.includes('move')) {
    //* ** FIX -- should be xxx selected/unselected */
    liveText =
      getRelationshipAsSpokenText(mathfield.model, previousPosition) +
      (mathfield.model.selectionIsCollapsed ? '' : 'selected: ') +
      getNextAtomAsSpokenText(mathfield.model);
  } else if (action === 'replacement') {
    // Announce the contents
    liveText = speakableText('', mathfield.model.at(mathfield.model.position));
  } else if (action === 'line') {
    // Announce the current line -- currently that's everything
    // mathfield.accessibleMathML.innerHTML = mathfield.options.createHTML(
    //     '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
    //         atomsToMathML(mathfield.model.root, mathfield.options) +
    //         '</math>'
    // );

    const label = speakableText('', mathfield.model.root);
    mathfield.keyboardDelegate.setAriaLabel(label);

    /** * FIX -- testing hack for setting braille ***/
    // mathfield.accessibleMathML.focus();
    // console.log("before sleep");
    // sleep(1000).then(() => {
    //     mathfield.textarea.focus();
    //     console.log("after sleep");
    // });
  } else liveText = atoms ? speakableText(action + ' ', atoms) : action;

  if (liveText) {
    // Aria-live regions are only spoken when it changes; force a change by
    // alternately using nonbreaking space or narrow nonbreaking space
    const ariaLiveChangeHack = mathfield.ariaLiveText.textContent!.includes(
      '\u00a0'
    )
      ? ' \u202F '
      : ' \u00A0 ';
    mathfield.ariaLiveText.textContent = liveText + ariaLiveChangeHack;
  }
}

function getRelationshipAsSpokenText(
  model: _Model,
  previousOffset?: number
): string {
  if (Number.isNaN(previousOffset)) return '';
  const previous = model.at(previousOffset!);
  if (!previous) return '';
  if (previous.treeDepth <= model.at(model.position).treeDepth) return '';

  let result = '';
  let ancestor = previous.parent;
  const newParent = model.at(model.position).parent;
  while (ancestor !== model.root && ancestor !== newParent) {
    result += `out of ${relationName(ancestor!)};`;
    ancestor = ancestor!.parent;
  }

  return result;
}

/**
 *
 * Return the spoken text for the atom to the right of the current selection.
 * Take into consideration the position amongst siblings to include 'start of'
 * and 'end of' if applicable.
 */
function getNextAtomAsSpokenText(model: _Model): string {
  if (!model.selectionIsCollapsed)
    return speakableText('', model.getAtoms(model.selection));

  let result = '';

  // Announce start of denominator, etc
  const cursor = model.at(model.position);
  const relation = relationName(cursor);
  if (cursor.isFirstSibling)
    result = (relation ? 'start of ' + relation : 'unknown') + ': ';

  if (cursor.isLastSibling) {
    // Don't say both start and end
    if (!cursor.isFirstSibling)
      result += relation ? 'end of ' + relation : 'unknown';
  } else result += speakableText('', cursor);

  return result;
}
