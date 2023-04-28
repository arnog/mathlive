import { hashCode } from '../common/hash-code';
import { Stylesheet, inject as injectStylesheet } from '../common/stylesheet';

import {
  makeStruts,
  parseLatex,
  Atom,
  coalesce,
  Box,
  Context,
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
import { applyInterBoxSpacing } from '../core/inter-box-spacing';

let POPOVER_STYLESHEET_HASH: string | undefined = undefined;
let gPopoverStylesheet: Stylesheet | null = null;
let gCoreStylesheet: Stylesheet | null = null;

function latexToMarkup(mf: MathfieldPrivate, latex: string): string {
  const root = new Atom('root');
  const context = new Context({ from: mf.context });

  root.body = parseLatex(latex, { context });

  const box = coalesce(
    applyInterBoxSpacing(
      new Box(root.render(context), { classes: 'ML__base' }),
      context
    )
  );

  return makeStruts(box, { classes: 'ML__mathlive' }).toMarkup();
}

export function showPopover(mf: MathfieldPrivate, suggestions: string[]): void {
  if (suggestions.length === 0) {
    hidePopover(mf);
    return;
  }

  let template = '';
  for (const [i, suggestion] of suggestions.entries()) {
    const command = suggestion;
    const commandMarkup = latexToMarkup(mf, suggestion);
    const keybinding = getKeybindingsForCommand(mf.keybindings, command).join(
      '<br>'
    );

    template += `<li role="button" data-command="${command}" ${
      i === mf.suggestionIndex ? 'class=ML__popover__current' : ''
    }><span class="ML__popover__latex">${command}</span><span class="ML__popover__command">${commandMarkup}</span>`;

    if (keybinding)
      template += `<span class="ML__popover__keybinding">${keybinding}</span>`;

    template += '</li>';
  }
  mf.popover = createPopover(mf, `<ul>${template}</ul>`);
  if (mf.popoverVisible) {
    mf.popover
      .querySelector('.ML__popover__current')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  setTimeout(() => {
    if (mf.popover && !mf.popoverVisible) {
      mf.popover.classList.add('is-visible');
      mf.popoverVisible = true;
      updatePopoverPosition(mf);
      mf.popover
        .querySelector('.ML__popover__current')
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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

  if (mf.model.at(mf.model.position)?.type !== 'latex') {
    hidePopover(mf);
    return;
  }

  if (options?.deferred) {
    // Call ourselves again later, typically after the
    // rendering/layout of the DOM has been completed
    // (don't do it on next frame, it might be too soon)
    setTimeout(() => updatePopoverPosition(mf), 32);
    return;
  }

  const position = getCaretPoint(mf.field!);
  if (!position) return;

  // Get screen width & height (browser compatibility)
  const viewportHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  const viewportWidth =
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
  if (
    position.x + mf.popover.offsetWidth / 2 >
    viewportWidth - scrollbarWidth
  ) {
    mf.popover.style.left = `${
      viewportWidth - mf.popover.offsetWidth - scrollbarWidth
    }px`;
  } else if (position.x - mf.popover.offsetWidth / 2 < 0)
    mf.popover.style.left = '0';
  else mf.popover.style.left = `${position.x - mf.popover.offsetWidth / 2}px`;

  // And position the popover right below or above the caret
  const spaceAbove = position.y - position.height;
  const spaceBelow =
    viewportHeight - scrollbarHeight - virtualkeyboardHeight - position.y;

  if (spaceBelow < spaceAbove) {
    mf.popover.classList.add('ML__popover--reverse-direction');
    mf.popover.classList.remove('top-tip');
    mf.popover.classList.add('bottom-tip');
    mf.popover.style.top = `${
      position.y - position.height - mf.popover.offsetHeight - 15
    }px`;
  } else {
    mf.popover.classList.remove('ML__popover--reverse-direction');
    mf.popover.classList.add('top-tip');
    mf.popover.classList.remove('bottom-tip');
    mf.popover.style.top = `${position.y + 15}px`;
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
  if (!mf.popover) {
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

    mf.popover.addEventListener('pointerdown', (ev) => ev.preventDefault());
    mf.popover.addEventListener('click', (ev) => {
      let el: HTMLElement | null = ev.target as HTMLElement;
      while (el && !el.dataset.command) el = el.parentElement;
      if (!el) return;
      complete(mf, 'reject');
      ModeEditor.insert('math', mf.model, el.dataset.command!, {
        selectionMode: 'placeholder',
        format: 'latex',
      });
      mf.dirty = true;
      mf.focus();
    });
  }
  mf.popover.innerHTML = window.MathfieldElement.createHTML(html);

  return mf.popover;
}

export function disposePopover(mf: MathfieldPrivate): void {
  releaseSharedElement(mf.popover);
  if (gPopoverStylesheet) gPopoverStylesheet.release();
  if (gCoreStylesheet) gCoreStylesheet.release();
  delete mf.popover;
}
