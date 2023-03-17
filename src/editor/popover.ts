import { throwIfNotInBrowser } from '../common/capabilities';
import { hashCode } from '../common/hash-code';
import { Stylesheet, inject as injectStylesheet } from '../common/stylesheet';

import {
  makeStruts,
  parseLatex,
  Atom,
  coalesce,
  Box,
  Context,
  adjustInterAtomSpacing,
  DEFAULT_FONT_SIZE,
} from '../core/core';

import {
  getCaretPoint,
  getSharedElement,
  releaseSharedElement,
} from '../editor-mathfield/utils';
import type { MathfieldPrivate } from '../editor-mathfield/mathfield-private';

import { getKeybindingsForCommand } from './keybindings';

// @ts-ignore-error
import POPOVER_STYLESHEET from '../../css/popover.less';
// @ts-ignore-error
import CORE_STYLESHEET from '../../css/core.less';
import { complete } from '../editor-mathfield/autocomplete';
import { ModeEditor } from '../editor-mathfield/mode-editor';

let POPOVER_STYLESHEET_HASH: string | undefined = undefined;
let gPopoverStylesheet: Stylesheet | null = null;
let gCoreStylesheet: Stylesheet | null = null;

function latexToMarkup(mf: MathfieldPrivate, latex: string): string {
  const root = new Atom('root', mf);
  root.body = parseLatex(latex, mf, { parseMode: 'math' });

  const context = new Context(
    { registers: mf.registers },
    { fontSize: DEFAULT_FONT_SIZE },
    'displaystyle'
  );
  const box = coalesce(
    adjustInterAtomSpacing(
      new Box(root.render(context), { classes: 'ML__base' }),
      context
    )
  );

  return makeStruts(box, { classes: 'ML__mathlive' }).toMarkup();
}

export function showPopover(mf: MathfieldPrivate, suggestions: string[]): void {
  if (suggestions.length === 0 || mf.options.popoverPolicy === 'off') {
    hidePopover(mf);
    return;
  }

  suggestions = suggestions.slice(0, 10);

  let template = '<ul>';
  for (const suggestion of suggestions) {
    const command = suggestion;
    const commandMarkup = latexToMarkup(mf, suggestion);
    const keybinding = getKeybindingsForCommand(mf.keybindings, command).join(
      '<br>'
    );

    template += `<li role="button" data-command="${command}"><span class="ML__popover__latex">${command}</span><span class="ML__popover__command">${commandMarkup}</span>`;

    if (keybinding)
      template += `<span class="ML__popover__keybinding">${keybinding}</span>`;

    template += '</li>';
  }
  template += '</ul>';
  mf.popover = createPopover(mf, template);

  const elements = mf.popover.querySelectorAll<HTMLElement>('ul li');
  for (const element of elements) {
    // Prevent loss of focus of the mathfield
    element.addEventListener('pointerdown', (ev) => ev.preventDefault());
    element.addEventListener('click', (_ev) => {
      complete(mf, 'reject');
      ModeEditor.insert('math', mf.model, element.dataset.command!, {
        selectionMode: 'placeholder',
        format: 'latex',
      });
      mf.dirty = true;
      mf.scrollIntoView();
      mf.focus();
    });
  }

  setTimeout(() => {
    const caretPoint = getCaretPoint(mf.field!);
    if (caretPoint) setPopoverPosition(mf, caretPoint);
    if (mf.popover) {
      mf.popover.classList.add('is-visible');
      mf.popoverVisible = true;
    }
  }, 32);
}

export function updatePopoverPosition(
  mf: MathfieldPrivate,
  options?: { deferred: boolean }
): void {
  // Check that the mathfield is still valid
  // (we're calling ourselves from requestAnimationFrame() and the mathfield
  // could have gotten destroyed
  if (!mf.element || mf.element.mathfield !== mf) return;

  if (!mf.popover || !mf.popoverVisible) return;

  // If the popover pane is visible...
  if (options?.deferred) {
    // Call ourselves again later, typically after the
    // rendering/layout of the DOM has been completed
    // (don't do it on next frame, it might be too soon)
    setTimeout(() => updatePopoverPosition(mf), 100);
    return;
  }

  if (mf.model.at(mf.model.position)?.type !== 'latex') hidePopover(mf);
  else {
    // ... get the caret position
    const caretPoint = getCaretPoint(mf.field!);
    if (caretPoint) setPopoverPosition(mf, caretPoint);
  }
}

function setPopoverPosition(
  mf: MathfieldPrivate,
  position: { x: number; y: number; height: number }
): void {
  throwIfNotInBrowser();

  if (!mf.popover || !mf.popoverVisible) return;

  // Get screen width & height (browser compatibility)
  const screenHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  const screenWidth =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;

  // Get scrollbar size. This would be 0 in mobile device (also no needed).
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;
  const scrollbarHeight =
    window.innerHeight - document.documentElement.clientHeight;
  const virtualkeyboardHeight = window.mathVirtualKeyboard.boundingRect.height;
  // Prevent screen overflow horizontal.
  if (position.x + mf.popover.offsetWidth / 2 > screenWidth - scrollbarWidth) {
    mf.popover.style.left = `${
      screenWidth - mf.popover.offsetWidth - scrollbarWidth
    }px`;
  } else if (position.x - mf.popover.offsetWidth / 2 < 0)
    mf.popover.style.left = '0';
  else mf.popover.style.left = `${position.x - mf.popover.offsetWidth / 2}px`;

  // And position the popover right below or above the caret
  if (
    position.y + mf.popover.offsetHeight + 5 >
    screenHeight - scrollbarHeight - virtualkeyboardHeight
  ) {
    mf.popover.classList.add('ML__popover--reverse-direction');
    mf.popover.style.top = `${
      position.y - position.height - mf.popover.offsetHeight - 5
    }px`;
  } else {
    mf.popover.classList.remove('ML__popover--reverse-direction');
    mf.popover.style.top = `${position.y + 5}px`;
  }
}

export function hidePopover(mf: MathfieldPrivate): void {
  mf.suggestionIndex = 0;
  mf.popoverVisible = false;
  if (mf.popover) {
    mf.popover.classList.remove('is-visible');
    mf.popover.innerHTML = '';
  }
}

export function createPopover(mf: MathfieldPrivate, html: string): HTMLElement {
  if (mf.popover) {
    mf.popover.innerHTML = window.MathfieldElement.createHTML(html);
    return mf.popover;
  }

  mf.popover = getSharedElement('mathlive-popover-panel');
  if (POPOVER_STYLESHEET_HASH === undefined)
    POPOVER_STYLESHEET_HASH = hashCode(POPOVER_STYLESHEET).toString(36);

  gPopoverStylesheet = injectStylesheet(
    null,
    POPOVER_STYLESHEET,
    POPOVER_STYLESHEET_HASH
  );
  gCoreStylesheet = injectStylesheet(
    null,
    CORE_STYLESHEET,
    hashCode(CORE_STYLESHEET).toString(36)
  );

  mf.popover.innerHTML = window.MathfieldElement.createHTML(html);

  return mf.popover;
}

export function disposePopover(mf: MathfieldPrivate): void {
  releaseSharedElement(mf.popover);
  if (gPopoverStylesheet) gPopoverStylesheet.release();
  if (gCoreStylesheet) gCoreStylesheet.release();
  delete mf.popover;
}
