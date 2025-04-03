import { injectStylesheet, releaseStylesheet } from '../common/stylesheet';

import {
  makeStruts,
  parseLatex,
  Atom,
  coalesce,
  Box,
  Context,
} from '../core/core';

import { getCaretPoint } from '../editor-mathfield/utils';
import type { _Mathfield } from '../editor-mathfield/mathfield-private';

import { getKeybindingsForCommand } from './keybindings';

import { complete } from '../editor-mathfield/autocomplete';
import { ModeEditor } from '../editor-mathfield/mode-editor';
import { applyInterBoxSpacing } from '../core/inter-box-spacing';
import {
  getSharedElement,
  releaseSharedElement,
} from '../common/shared-element';

function latexToMarkup(mf: _Mathfield, latex: string): string {
  const context = new Context({ from: mf.context });

  const root = new Atom({
    mode: 'math',
    type: 'root',
    body: parseLatex(latex, { context }),
  });

  const box = coalesce(
    applyInterBoxSpacing(
      new Box(root.render(context), { classes: 'ML__base' }),
      context
    )
  );

  return makeStruts(box, { classes: 'ML__latex' }).toMarkup();
}

export function showSuggestionPopover(
  mf: _Mathfield,
  suggestions: string[]
): void {
  if (suggestions.length === 0) {
    hideSuggestionPopover(mf);
    return;
  }

  let template = '';
  for (const [i, suggestion] of suggestions.entries()) {
    const command = suggestion;
    const commandMarkup = latexToMarkup(mf, suggestion);
    const keybinding = getKeybindingsForCommand(mf.keybindings, command).join(
      '<br>'
    );

    template += `<li role="button" data-command="${command}" ${i === mf.suggestionIndex ? 'class=ML__popover__current' : ''
      }><span class="ML__popover__latex">${command}</span><span class="ML__popover__command">${commandMarkup}</span>`;

    if (keybinding)
      template += `<span class="ML__popover__keybinding">${keybinding}</span>`;

    template += '</li>';
  }
  const panel = createSuggestionPopover(mf, `<ul>${template}</ul>`);
  if (isSuggestionPopoverVisible()) {
    panel
      .querySelector('.ML__popover__current')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  setTimeout(() => {
    if (panel && !isSuggestionPopoverVisible()) {
      panel.classList.add('is-visible');
      updateSuggestionPopoverPosition(mf);
      panel
        .querySelector('.ML__popover__current')
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, 32);
}

export function isSuggestionPopoverVisible(): boolean {
  const panel = document.getElementById('mathlive-suggestion-popover');
  if (!panel) return false;
  return panel.classList.contains('is-visible');
}

export function updateSuggestionPopoverPosition(
  mf: _Mathfield,
  options?: { deferred: boolean }
): void {
  // Check that the mathfield is still valid
  // (we're calling ourselves from requestAnimationFrame() and the mathfield
  // could have gotten destroyed
  if (!mf.element || mf.element.mathfield !== mf) return;

  if (!isSuggestionPopoverVisible()) return;

  if (mf.model.at(mf.model.position)?.type !== 'latex') {
    hideSuggestionPopover(mf);
    return;
  }

  if (options?.deferred) {
    // Call ourselves again later, typically after the
    // rendering/layout of the DOM has been completed
    // (don't do it on next frame, it might be too soon)
    setTimeout(() => updateSuggestionPopoverPosition(mf), 32);
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
  const virtualkeyboardHeight =
    window.mathVirtualKeyboard?.boundingRect.height ?? 0;
  // Prevent screen overflow horizontal.
  const panel = document.getElementById('mathlive-suggestion-popover')!;
  if (position.x + panel.offsetWidth / 2 > viewportWidth - scrollbarWidth) {
    panel.style.left = `${viewportWidth - panel.offsetWidth - scrollbarWidth
      }px`;
  } else if (position.x - panel.offsetWidth / 2 < 0) panel.style.left = '0';
  else panel.style.left = `${position.x - panel.offsetWidth / 2}px`;

  // And position the popover right below or above the caret
  const spaceAbove = position.y - position.height;
  const spaceBelow =
    viewportHeight - scrollbarHeight - virtualkeyboardHeight - position.y;

  if (spaceBelow < spaceAbove) {
    panel.classList.add('ML__popover--reverse-direction');
    panel.classList.remove('top-tip');
    panel.classList.add('bottom-tip');
    panel.style.top = `${position.y - position.height - panel.offsetHeight - 15
      }px`;
  } else {
    panel.classList.remove('ML__popover--reverse-direction');
    panel.classList.add('top-tip');
    panel.classList.remove('bottom-tip');
    panel.style.top = `${position.y + 15}px`;
  }
}

export function hideSuggestionPopover(mf: _Mathfield): void {
  mf.suggestionIndex = 0;
  const panel = document.getElementById('mathlive-suggestion-popover');
  if (panel) {
    releaseSharedElement('mathlive-suggestion-popover');
  }
}

export function createSuggestionPopover(
  mf: _Mathfield,
  html: string
): HTMLElement {
  let panel = document.getElementById('mathlive-suggestion-popover');
  if (panel) {
    releaseSharedElement('mathlive-suggestion-popover');
  } else {
    injectStylesheet('suggestion-popover');
    injectStylesheet('core');
  }

  panel = getSharedElement('mathlive-suggestion-popover');
  panel.addEventListener('pointerdown', (ev) => ev.preventDefault());
  panel.addEventListener('click', (ev) => {
    let el: HTMLElement | null = ev.target as HTMLElement;
    while (el && !el.dataset.command) el = el.parentElement;
    if (!el) return;
    complete(mf, 'reject');
    ModeEditor.insert(mf.model, el.dataset.command!, {
      selectionMode: 'placeholder',
      format: 'latex',
      mode: 'math',
    });
    mf.dirty = true;
    mf.focus();
  });

  panel!.innerHTML = globalThis.MathfieldElement.createHTML(html);

  return panel;
}

export function disposeSuggestionPopover(): void {
  if (!document.getElementById('mathlive-suggestion-popover')) return;
  releaseSharedElement('mathlive-suggestion-popover');
  releaseStylesheet('suggestion-popover');
  releaseStylesheet('core');
}
