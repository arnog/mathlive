import { getKeybindingMarkup } from '../editor/keybindings';
import type { MathfieldPrivate } from './mathfield-private';

import { getSharedElement, releaseSharedElement } from './utils';
import { hashCode } from '../common/hash-code';
import { Stylesheet, inject as injectStylesheet } from '../common/stylesheet';

// @ts-ignore-error
import KEYSTROKE_CAPTION_STYLESHEET from '../../css/keystroke-caption.less';
// @ts-ignore-error
import CORE_STYLESHEET from '../../css/core.less';

let KEYSTROKE_CAPTION_STYLESHEET_HASH: string | undefined = undefined;
let gKeystrokeCaptionStylesheet: Stylesheet | null = null;
let gCoreStylesheet: Stylesheet | null = null;

export function showKeystroke(
  mathfield: MathfieldPrivate,
  keystroke: string
): void {
  if (mathfield.options.readOnly || !mathfield.keystrokeCaptionVisible) return;

  const vb = createKeystrokeCaption(mathfield);

  const bounds = mathfield.element!.getBoundingClientRect();
  vb.style.left = `${bounds.left}px`;
  vb.style.top = `${bounds.top - 64}px`;
  vb.innerHTML = mathfield.options.createHTML(
    '<span>' +
      (getKeybindingMarkup(keystroke) || keystroke) +
      '</span>' +
      vb.innerHTML
  );
  vb.style.visibility = 'visible';
  setTimeout(() => {
    if (vb.childNodes.length > 0) {
      vb.childNodes[vb.childNodes.length - 1].remove();
    }

    if (vb.childNodes.length === 0) {
      vb.style.visibility = 'hidden';
    }
  }, 3000);
}

export function toggleKeystrokeCaption(mathfield: MathfieldPrivate): boolean {
  mathfield.keystrokeCaptionVisible = !mathfield.keystrokeCaptionVisible;
  if (!mathfield.keystrokeCaptionVisible) {
    if (mathfield.keystrokeCaption) {
      mathfield.keystrokeCaption.style.visibility = 'hidden';
    }
  } else {
    mathfield.keystrokeCaption = createKeystrokeCaption(mathfield);
    mathfield.keystrokeCaption.innerHTML = '';
  }

  return false;
}

function createKeystrokeCaption(mf: MathfieldPrivate): HTMLElement {
  if (mf.keystrokeCaption) return mf.keystrokeCaption;

  mf.keystrokeCaption = getSharedElement('mathlive-keystroke-caption-panel');

  if (KEYSTROKE_CAPTION_STYLESHEET_HASH === undefined) {
    KEYSTROKE_CAPTION_STYLESHEET_HASH = hashCode(
      KEYSTROKE_CAPTION_STYLESHEET
    ).toString(36);
  }
  gKeystrokeCaptionStylesheet = injectStylesheet(
    null,
    KEYSTROKE_CAPTION_STYLESHEET,
    KEYSTROKE_CAPTION_STYLESHEET_HASH
  );
  gCoreStylesheet = injectStylesheet(
    null,
    CORE_STYLESHEET,
    hashCode(CORE_STYLESHEET).toString(36)
  );

  return mf.keystrokeCaption;
}

export function disposeKeystrokeCaption(mf: MathfieldPrivate): void {
  releaseSharedElement(mf.keystrokeCaption);
  if (gKeystrokeCaptionStylesheet) gKeystrokeCaptionStylesheet.release();
  if (gCoreStylesheet) gCoreStylesheet.release();
  delete mf.keystrokeCaption;
}
