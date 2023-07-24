import { injectStylesheet, releaseStylesheet } from '../common/stylesheet';
import { getKeybindingMarkup } from '../editor/keybindings';
import {
  getSharedElement,
  releaseSharedElement,
} from '../editor/shared-element';

import type { MathfieldPrivate } from './mathfield-private';

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
  const panel = document.getElementById('mathlive-keystroke-caption-panel');

  if (panel) return panel;

  injectStylesheet('keystroke-caption');
  injectStylesheet('core');

  return getSharedElement('mathlive-keystroke-caption-panel');
}

export function disposeKeystrokeCaption(): void {
  if (!document.getElementById('mathlive-keystroke-caption-panel')) return;
  releaseSharedElement('mathlive-keystroke-caption-panel');
  releaseStylesheet('core');
  releaseStylesheet('keystroke-caption');
}
