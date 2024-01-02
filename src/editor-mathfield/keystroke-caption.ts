import type { _Mathfield } from './mathfield-private';

import { injectStylesheet, releaseStylesheet } from '../common/stylesheet';

import {
  getSharedElement,
  releaseSharedElement,
} from '../common/shared-element';
import { getKeybindingMarkup } from 'ui/events/keyboard';

export function showKeystroke(mathfield: _Mathfield, keystroke: string): void {
  if (!mathfield.isSelectionEditable || !mathfield.keystrokeCaptionVisible)
    return;

  const vb = createKeystrokeCaption();

  const bounds = mathfield.element!.getBoundingClientRect();
  vb.style.left = `${bounds.left}px`;
  vb.style.top = `${bounds.top - 64}px`;
  vb.innerHTML = globalThis.MathfieldElement.createHTML(
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

export function toggleKeystrokeCaption(mathfield: _Mathfield): boolean {
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
