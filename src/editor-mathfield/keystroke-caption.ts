import { getKeybindingMarkup } from '../editor/keybindings';
import type { MathfieldPrivate } from './mathfield-private';

import { injectStylesheet, releaseStylesheet } from '../common/stylesheet';

// @ts-ignore-error
import KEYSTROKE_CAPTION_STYLESHEET from '../../css/keystroke-caption.less';
// @ts-ignore-error
import CORE_STYLESHEET from '../../css/core.less';
import {
  getSharedElement,
  releaseSharedElement,
} from '../editor/shared-element';

export function showKeystroke(
  mathfield: MathfieldPrivate,
  keystroke: string
): void {
  if (!mathfield.isSelectionEditable || !mathfield.keystrokeCaptionVisible)
    return;

  const vb = createKeystrokeCaption();

  const bounds = mathfield.element!.getBoundingClientRect();
  vb.style.left = `${bounds.left}px`;
  vb.style.top = `${bounds.top - 64}px`;
  vb.innerHTML = window.MathfieldElement.createHTML(
    '<span>' +
      (getKeybindingMarkup(keystroke) || keystroke) +
      '</span>' +
      vb.innerHTML
  );
  vb.style.visibility = 'visible';
  setTimeout(() => {
    if (vb.childNodes.length > 0)
      vb.childNodes[vb.childNodes.length - 1].remove();

    if (vb.childNodes.length === 0) vb.style.visibility = 'hidden';
  }, 3000);
}

export function toggleKeystrokeCaption(mathfield: MathfieldPrivate): boolean {
  mathfield.keystrokeCaptionVisible = !mathfield.keystrokeCaptionVisible;
  if (!mathfield.keystrokeCaptionVisible) {
    const panel = getSharedElement('mathlive-keystroke-caption-panel');
    panel.style.visibility = 'hidden';
  } else {
    const panel = createKeystrokeCaption();
    panel.innerHTML = '';
  }

  return false;
}

function createKeystrokeCaption(): HTMLElement {
  let panel = document.getElementById('mathlive-keystroke-caption-panel');

  if (panel) return panel;

  panel = getSharedElement('mathlive-keystroke-caption-panel');

  injectStylesheet(
    'mathlive-keystroke-caption-stylesheet',
    KEYSTROKE_CAPTION_STYLESHEET
  );
  injectStylesheet('mathlive-core-stylesheet', CORE_STYLESHEET);

  return panel;
}

export function disposeKeystrokeCaption(): void {
  if (!document.getElementById('mathlive-keystroke-caption-panel')) return;
  releaseSharedElement('mathlive-keystroke-caption-panel');
  releaseStylesheet('mathlive-core-stylesheet');
  releaseStylesheet('mathlive-keystroke-caption-stylesheet');
}
