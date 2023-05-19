import { Atom } from '../core/atom';
import { coalesce, Box, makeStruts } from '../core/box';
import { l10n as l10nOptions, localize as l10n } from '../core/l10n';
import { parseLatex } from '../core/parser';
import { SelectorPrivate } from '../editor/types';
import { getActiveKeyboardLayout } from '../editor/keyboard-layout';

import VIRTUAL_KEYBOARD_STYLESHEET from '../../css/virtual-keyboard.less' assert { type: 'css' };
import CORE_STYLESHEET from '../../css/core.less' assert { type: 'css' };
import { releaseStylesheet, injectStylesheet } from '../common/stylesheet';
import { loadFonts } from '../core/fonts';
import { Context } from '../core/context';

import { LAYOUTS } from './data';
import { VirtualKeyboard } from './virtual-keyboard';
import { MathfieldProxy } from '../public/virtual-keyboard';
import { hasVariants, showVariantsPanel } from './variants';
import {
  NormalizedVirtualKeyboardLayer,
  NormalizedVirtualKeyboardLayout,
  VirtualKeyboardKeycap,
  VirtualKeyboardLayer,
  VirtualKeyboardLayout,
  VirtualKeyboardOptions,
} from '../public/virtual-keyboard';
import { applyInterBoxSpacing } from '../core/inter-box-spacing';

function jsonToCssProps(json) {
  if (typeof json === 'string') return json;
  return Object.entries(json)
    .map(([k, v]) => `${k}:${v} !important`)
    .join(';');
}

function jsonToCss(json): string {
  return Object.keys(json)
    .map((k) => {
      return `${k} {${jsonToCssProps(json[k])}}`;
    })
    .join('');
}

function latexToMarkup(latex: string): string {
  if (!latex) return '';

  const context = new Context();

  const root = new Atom({
    mode: 'math',
    type: 'root',
    body: parseLatex(latex, {
      context,
      args: (arg) =>
        arg === '@'
          ? '{\\class{ML__box-placeholder}{\\blacksquare}}'
          : '\\placeholder{}',
    }),
  });

  const box = coalesce(
    applyInterBoxSpacing(
      new Box(root.render(context), { classes: 'ML__base' }),
      context
    )
  );

  return makeStruts(box, { classes: 'ML__mathlive' }).toMarkup();
}

function normalizeLayer(
  layer: string | VirtualKeyboardLayer | (string | VirtualKeyboardLayer)[]
): NormalizedVirtualKeyboardLayer[] {
  if (Array.isArray(layer)) return layer.map((x) => normalizeLayer(x)).flat();

  const result = typeof layer === 'string' ? { markup: layer } : layer;

  if ('rows' in result && Array.isArray(result.rows))
    result.rows = result.rows.map((row) => row.map((x) => normalizeKeycap(x)));

  result.id ??=
    'ML__layer_' +
    Date.now().toString(36).slice(-2) +
    Math.floor(Math.random() * 0x186a0).toString(36);

  return [result] as NormalizedVirtualKeyboardLayer[];
}

function alphabeticLayout(): NormalizedVirtualKeyboardLayout {
  // Determine the layout of the virtual keyboard based on a
  // detected physical keyboard layout, or the current locale
  const keyboard = window.mathVirtualKeyboard;
  let layoutName = keyboard.alphabeticLayout;
  if (layoutName === 'auto') {
    const activeLayout = getActiveKeyboardLayout();
    if (activeLayout) layoutName = activeLayout.virtualLayout;

    if (!layoutName || layoutName === 'auto') {
      layoutName =
        (
          {
            fr: 'azerty',
            be: 'azerty',
            al: 'qwertz',
            ba: 'qwertz',
            cz: 'qwertz',
            de: 'qwertz',
            hu: 'qwertz',
            sk: 'qwertz',
            ch: 'qwertz',
          } as const
        )[l10nOptions.locale.slice(0, 2)] ?? 'qwerty';
    }
  }

  // First row should be 10 key wide
  // Second row should be 10 key wide
  // Third row should be 8.5 key wide
  // One row should have ^ (shift key) which is 1.5 key wide
  // One row should have ~ (delete key) which is .5 or 1.5 key wide
  const ALPHABETIC_TEMPLATE = {
    qwerty: ['qwertyuiop', ' asdfghjkl ', '^zxcvbnm~'],
    azerty: ['azertyuiop', 'qsdfghjklm', '^ wxcvbn ~'],
    qwertz: ['qwertzuiop', ' asdfghjkl ', '^yxcvbnm~'],
    dvorak: ['^  pyfgcrl ', 'aoeuidhtns', 'qjkxbmwvz~'],
    colemak: [' qwfpgjluy ', 'arstdhneio', '^zxcvbkm~'],
  };
  const template =
    ALPHABETIC_TEMPLATE[layoutName] ?? ALPHABETIC_TEMPLATE.qwerty;

  const rows: (string | Partial<VirtualKeyboardKeycap>)[][] = [
    [
      { label: '1', variants: '1' },
      { label: '2', variants: '2' },
      { label: '3', variants: '3' },
      { label: '4', variants: '4' },
      { label: '5', shift: { latex: '\\frac{#@}{#?}' }, variants: '5' },
      { label: '6', shift: { latex: '#@^#?' }, variants: '6' },
      { label: '7', variants: '4' },
      { label: '8', shift: { latex: '\\times' }, variants: '8' },
      { label: '9', shift: { label: '(', latex: '(' }, variants: '9' },
      { label: '0', shift: { label: ')', latex: ')' }, variants: '0' },
    ],
  ];

  for (const templateRow of template) {
    const row: (string | Partial<VirtualKeyboardKeycap>)[] = [];
    for (const k of templateRow) {
      if (/[a-z]/.test(k)) {
        row.push({
          label: k,
          class: 'hide-shift',
          shift: { label: k.toUpperCase() },
          variants: hasVariants(k) ? k : undefined,
        });
      } else if (k === '~') {
        if (layoutName !== 'dvorak') row.push('[backspace]');
        else row.push({ label: '[backspace]', width: 1.0 });
      } else if (k === '^') row.push('[shift]');
      else if (k === ' ') row.push('[separator-5]');
    }
    rows.push(row);
  }

  rows.push([
    // {
    //   class: 'action',
    //   label: 'text mode',
    //   command: ['performWithFeedback', ['switchMode', 'text', '', '']],
    // },
    '[-]',
    '[+]',
    '[=]',
    { label: ' ', width: 1.5 },
    ',',
    '[.]',
    '[left]',
    '[right]',
    { label: '[action]', width: 1.5 },
  ]);

  return {
    label: 'abc',
    labelClass: 'MLK__tex-math',
    tooltip: 'keyboard.tooltip.alphabetic',
    layers: normalizeLayer({ rows }),
  };
}

export function normalizeLayout(
  layout: string | VirtualKeyboardLayout
): NormalizedVirtualKeyboardLayout {
  if (layout === 'alphabetic') return alphabeticLayout();
  if (typeof layout === 'string') {
    console.assert(
      LAYOUTS[layout] !== undefined,
      `MathLive {{SDK_VERSION}}: unknown keyboard layout "${layout}"`
    );
    return normalizeLayout(LAYOUTS[layout]);
  }

  let result: NormalizedVirtualKeyboardLayout;

  if ('rows' in layout && Array.isArray(layout.rows)) {
    console.assert(
      !('layers' in layout || 'markup' in layout),
      `MathLive {{SDK_VERSION}}: when providing a "rows" property, "layers" and "markup" are ignored`
    );
    // Remove the `rows` key from `layout`
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rows, ...partialLayout } = layout;
    result = {
      ...partialLayout,
      layers: normalizeLayer({ rows: layout.rows }),
    } as NormalizedVirtualKeyboardLayout;
  } else if ('markup' in layout && typeof layout.markup === 'string') {
    // Remove the `markup` key from `layout`
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { markup, ...partialLayout } = layout;
    result = {
      ...partialLayout,
      layers: normalizeLayer(layout.markup as string),
    } as NormalizedVirtualKeyboardLayout;
  } else {
    result = { ...layout } as NormalizedVirtualKeyboardLayout;
    if ('layers' in layout) result.layers = normalizeLayer(layout.layers);
    else {
      console.error(
        `MathLive {{SDK_VERSION}}: provide either a "rows", "markup" or "layers" property`
      );
    }
  }

  let hasShift = false;
  let hasEdit = false;

  for (const layer of result.layers) {
    if (layer.rows) {
      for (const keycap of layer.rows.flat()) {
        if (isShiftKey(keycap)) hasShift = true;
        const command = keycap.command;
        if (
          typeof command === 'string' &&
          ['undo', 'redo', 'cut', 'copy', 'paste'].includes(command)
        )
          hasEdit = true;
      }
    }
  }

  if (
    !('displayShiftedKeycaps' in layout) ||
    layout.displayShiftedKeycaps === undefined
  )
    result.displayShiftedKeycaps = hasShift;
  if (
    !('displayEditToolbar' in layout) ||
    layout.displayEditToolbar === undefined
  )
    result.displayEditToolbar = !hasEdit;

  return result;
}

/**
 * Return a markup string for the layouts toolbar for the specified layout.
 */
function makeLayoutsToolbar(keyboard: VirtualKeyboard, index: number): string {
  // The left hand side of the toolbar has a list of all the available keyboards
  let markup = `<div class="left">`;
  if (keyboard.normalizedLayouts.length > 1) {
    for (const [i, l] of keyboard.normalizedLayouts.entries()) {
      const layout = l;

      const classes = [i === index ? 'selected' : 'layer-switch'];
      if (layout.tooltip) classes.push('MLK__tooltip');
      if (layout.labelClass) classes.push(...layout.labelClass.split(' '));

      markup += `<div class="${classes.join(' ')}"`;

      if (layout.tooltip) {
        markup +=
          " data-tooltip='" + (l10n(layout.tooltip) ?? layout.tooltip) + "' ";
      }

      if (i !== index) markup += `data-layer="${layout.layers[0].id}"`;

      markup += `>${layout.label ?? 'untitled'}</div>`;
    }
  }

  markup += '</div>';

  return markup;
}

export function makeEditToolbar(
  options: VirtualKeyboardOptions,
  mathfield: MathfieldProxy
): string {
  let result = '';
  const toolbarOptions = options.editToolbar;
  if (toolbarOptions === 'none') return '';

  const availableActions: string[] = [];

  if (mathfield.selectionIsCollapsed)
    availableActions.push('undo', 'redo', 'pasteFromClipboard');
  else {
    availableActions.push(
      'cutToClipboard',
      'copyToClipboard',
      'pasteFromClipboard'
    );
  }

  const actionsMarkup = {
    undo: `<div class='action ${mathfield.canUndo === false ? 'disabled' : ''}'
          data-command='"undo"'
          data-tooltip='${l10n('tooltip.undo')}'>
          <svg><use xlink:href='#svg-undo' /></svg>
      </div>`,
    redo: `<div class='action ${mathfield.canRedo === false ? 'disabled' : ''}'
          data-command='"redo"'
          data-tooltip='${l10n('tooltip.redo')}'>
          <svg><use xlink:href='#svg-redo' /></svg>
      </div>`,
    cutToClipboard: `
        <div class='action'
            data-command='"cutToClipboard"'
            data-tooltip='${l10n('tooltip.cut to clipboard')}'>
            <svg><use xlink:href='#svg-cut' /></svg>
        </div>
    `,
    copyToClipboard: `
        <div class='action'
            data-command='"copyToClipboard"'
            data-tooltip='${l10n('tooltip.copy to clipboard')}'>
            <svg><use xlink:href='#svg-copy' /></svg>
        </div>
    `,
    pasteFromClipboard: `
        <div class='action'
            data-command='"pasteFromClipboard"'
            data-tooltip='${l10n('tooltip.paste from clipboard')}'>
            <svg><use xlink:href='#svg-paste' /></svg>
        </div>
    `,
  };

  // The right hand side of the toolbar, with the copy/undo/redo commands
  result += availableActions.map((action) => actionsMarkup[action]).join('');

  return result;
}

export function makeSyntheticKeycaps(elementList: NodeList): void {
  for (const element of elementList)
    makeSyntheticKeycap(element as HTMLElement);
}

function makeSyntheticKeycap(element: HTMLElement): void {
  const keycap: Partial<VirtualKeyboardKeycap> = {};

  // Generate synthetic keycap from DOM element
  if (!element.id) {
    if (element.hasAttribute('data-label'))
      keycap.label = element.dataset.label;

    if (element.hasAttribute('data-latex'))
      keycap.latex = element.dataset.latex;

    if (element.hasAttribute('data-key')) keycap.key = element.dataset.key;

    if (element.hasAttribute('data-insert'))
      keycap.insert = element.dataset.insert;

    if (element.hasAttribute('data-variants'))
      keycap.variants = element.dataset.variants;

    if (element.hasAttribute('data-aside'))
      keycap.aside = element.dataset.aside;

    if (element.className) keycap.class = element.className;

    if (!keycap.label && !keycap.latex && !keycap.key && !keycap.insert) {
      keycap.latex = element.innerText;
      keycap.label = element.innerHTML;
    }

    if (element.hasAttribute('data-command')) {
      try {
        keycap.command = JSON.parse(element.dataset.command!);
      } catch (e) {}
    }

    element.id = VirtualKeyboard.singleton.registerKeycap(keycap);
  }

  // Display
  if (!element.innerHTML) {
    const [markup, _] = renderKeycap(keycap);
    element.innerHTML = window.MathfieldElement.createHTML(markup);
  }
}

function injectStylesheets(): void {
  injectStylesheet(
    'mathlive-virtual-keyboard-stylesheet',
    VIRTUAL_KEYBOARD_STYLESHEET
  );
  injectStylesheet('mathlive-core-stylesheet', CORE_STYLESHEET);
  void loadFonts();
}

export function releaseStylesheets(): void {
  releaseStylesheet('mathlive-core-stylesheet');
  releaseStylesheet('mathlive-virtual-keyboard-stylesheet');
}

const SVG_ICONS = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">

<symbol id="svg-delete-backward" viewBox="0 0 576 512">
  <path d="M432.1 208.1L385.9 256L432.1 303C442.3 312.4 442.3 327.6 432.1 336.1C423.6 346.3 408.4 346.3 399 336.1L352 289.9L304.1 336.1C295.6 346.3 280.4 346.3 271 336.1C261.7 327.6 261.7 312.4 271 303L318.1 256L271 208.1C261.7 199.6 261.7 184.4 271 175C280.4 165.7 295.6 165.7 304.1 175L352 222.1L399 175C408.4 165.7 423.6 165.7 432.1 175C442.3 184.4 442.3 199.6 432.1 208.1V208.1zM512 64C547.3 64 576 92.65 576 128V384C576 419.3 547.3 448 512 448H205.3C188.3 448 172 441.3 160 429.3L9.372 278.6C3.371 272.6 0 264.5 0 256C0 247.5 3.372 239.4 9.372 233.4L160 82.75C172 70.74 188.3 64 205.3 64L512 64zM528 128C528 119.2 520.8 112 512 112H205.3C201 112 196.9 113.7 193.9 116.7L54.63 256L193.9 395.3C196.9 398.3 201 400 205.3 400H512C520.8 400 528 392.8 528 384V128z"/>
</symbol>

<symbol id="svg-shift" viewBox="0 0 384 512">
  <path d="M2.438 252.3C7.391 264.2 19.06 272 32 272h80v160c0 26.51 21.49 48 48 48h64C250.5 480 272 458.5 272 432v-160H352c12.94 0 24.61-7.797 29.56-19.75c4.953-11.97 2.219-25.72-6.938-34.88l-160-176C208.4 35.13 200.2 32 192 32S175.6 35.13 169.4 41.38l-160 176C.2188 226.5-2.516 240.3 2.438 252.3zM192 86.63L313.4 224H224v208H160V224H70.63L192 86.63z"/>
</symbol>

<symbol id="svg-commit" viewBox="0 0 512 512">
  <path d="M135 432.1l-128-128C2.344 300.3 0 294.2 0 288s2.344-12.28 7.031-16.97l128-128c9.375-9.375 24.56-9.375 33.94 0s9.375 24.56 0 33.94L81.94 264H464v-208C464 42.75 474.8 32 488 32S512 42.75 512 56V288c0 13.25-10.75 24-24 24H81.94l87.03 87.03c9.375 9.375 9.375 24.56 0 33.94S144.4 442.3 135 432.1z"/>
</symbol>

<symbol id="svg-command" viewBox="0 0 640 512">
  <path d="M34.495 36.465l211.051 211.05c4.686 4.686 4.686 12.284 0 16.971L34.495 475.535c-4.686 4.686-12.284 4.686-16.97 0l-7.071-7.07c-4.686-4.686-4.686-12.284 0-16.971L205.947 256 10.454 60.506c-4.686-4.686-4.686-12.284 0-16.971l7.071-7.07c4.686-4.687 12.284-4.687 16.97 0zM640 468v-10c0-6.627-5.373-12-12-12H300c-6.627 0-12 5.373-12 12v10c0 6.627 5.373 12 12 12h328c6.627 0 12-5.373 12-12z"/>
</symbol>

<symbol id="svg-undo" viewBox="0 0 512 512">
  <path d="M20 8h10c6.627 0 12 5.373 12 12v110.625C85.196 57.047 165.239 7.715 256.793 8.001 393.18 8.428 504.213 120.009 504 256.396 503.786 393.181 392.834 504 256 504c-63.926 0-122.202-24.187-166.178-63.908-5.113-4.618-5.354-12.561-.482-17.433l7.069-7.069c4.503-4.503 11.749-4.714 16.482-.454C150.782 449.238 200.935 470 256 470c117.744 0 214-95.331 214-214 0-117.744-95.331-214-214-214-82.862 0-154.737 47.077-190.289 116H180c6.627 0 12 5.373 12 12v10c0 6.627-5.373 12-12 12H20c-6.627 0-12-5.373-12-12V20c0-6.627 5.373-12 12-12z"/>
</symbol>
<symbol id="svg-redo" viewBox="0 0 512 512">
  <path d="M492 8h-10c-6.627 0-12 5.373-12 12v110.625C426.804 57.047 346.761 7.715 255.207 8.001 118.82 8.428 7.787 120.009 8 256.396 8.214 393.181 119.166 504 256 504c63.926 0 122.202-24.187 166.178-63.908 5.113-4.618 5.354-12.561.482-17.433l-7.069-7.069c-4.503-4.503-11.749-4.714-16.482-.454C361.218 449.238 311.065 470 256 470c-117.744 0-214-95.331-214-214 0-117.744 95.331-214 214-214 82.862 0 154.737 47.077 190.289 116H332c-6.627 0-12 5.373-12 12v10c0 6.627 5.373 12 12 12h160c6.627 0 12-5.373 12-12V20c0-6.627-5.373-12-12-12z"/>
</symbol>
<symbol id="svg-arrow-left" viewBox="0 0 320 512">
  <path d="M206.7 464.6l-183.1-191.1C18.22 267.1 16 261.1 16 256s2.219-11.97 6.688-16.59l183.1-191.1c9.152-9.594 24.34-9.906 33.9-.7187c9.625 9.125 9.938 24.37 .7187 33.91L73.24 256l168 175.4c9.219 9.5 8.906 24.78-.7187 33.91C231 474.5 215.8 474.2 206.7 464.6z"/>
</symbol>
<symbol id="svg-arrow-right" viewBox="0 0 320 512">
  <path d="M113.3 47.41l183.1 191.1c4.469 4.625 6.688 10.62 6.688 16.59s-2.219 11.97-6.688 16.59l-183.1 191.1c-9.152 9.594-24.34 9.906-33.9 .7187c-9.625-9.125-9.938-24.38-.7187-33.91l168-175.4L78.71 80.6c-9.219-9.5-8.906-24.78 .7187-33.91C88.99 37.5 104.2 37.82 113.3 47.41z"/>
</symbol>
<symbol id="svg-tab" viewBox="0 0 448 512">
  <path d="M32 217.1c0-8.8 7.2-16 16-16h144v-93.9c0-7.1 8.6-10.7 13.6-5.7l143.5 143.1c6.3 6.3 6.3 16.4 0 22.7L205.6 410.4c-5 5-13.6 1.5-13.6-5.7v-93.9H48c-8.8 0-16-7.2-16-16v-77.7m-32 0v77.7c0 26.5 21.5 48 48 48h112v61.9c0 35.5 43 53.5 68.2 28.3l143.6-143c18.8-18.8 18.8-49.2 0-68L228.2 78.9c-25.1-25.1-68.2-7.3-68.2 28.3v61.9H48c-26.5 0-48 21.6-48 48zM436 64h-8c-6.6 0-12 5.4-12 12v360c0 6.6 5.4 12 12 12h8c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12z"/>
</symbol>
<symbol id="svg-paste" viewBox="0 0 512 512"><path d="M160 32c11.6 0 21.3 8.2 23.5 19.2C185 58.6 191.6 64 199.2 64H208c8.8 0 16 7.2 16 16V96H96V80c0-8.8 7.2-16 16-16h8.8c7.6 0 14.2-5.4 15.7-12.8C138.7 40.2 148.4 32 160 32zM64 64h2.7C65 69 64 74.4 64 80V96c0 17.7 14.3 32 32 32H224c17.7 0 32-14.3 32-32V80c0-5.6-1-11-2.7-16H256c17.7 0 32 14.3 32 32h32c0-35.3-28.7-64-64-64H210.6c-9-18.9-28.3-32-50.6-32s-41.6 13.1-50.6 32H64C28.7 32 0 60.7 0 96V384c0 35.3 28.7 64 64 64H192V416H64c-17.7 0-32-14.3-32-32V96c0-17.7 14.3-32 32-32zM288 480c-17.7 0-32-14.3-32-32V192c0-17.7 14.3-32 32-32h96v56c0 22.1 17.9 40 40 40h56V448c0 17.7-14.3 32-32 32H288zM416 165.3L474.7 224H424c-4.4 0-8-3.6-8-8V165.3zM448 512c35.3 0 64-28.7 64-64V235.9c0-12.7-5.1-24.9-14.1-33.9l-59.9-59.9c-9-9-21.2-14.1-33.9-14.1H288c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H448z"/></symbol>
<symbol id="svg-cut" viewBox="0 0 512 512"><path d="M485.6 444.2L333.6 314.9C326.9 309.2 326.1 299.1 331.8 292.4C337.5 285.6 347.6 284.8 354.4 290.5L506.4 419.8C513.1 425.5 513.9 435.6 508.2 442.4C502.5 449.1 492.4 449.9 485.6 444.2zM485.7 67.76C492.5 62.07 502.5 62.94 508.2 69.69C513.9 76.45 513.1 86.55 506.3 92.24L208.5 343.1C218.3 359.7 224 379.2 224 400C224 461.9 173.9 512 112 512C50.14 512 0 461.9 0 400C0 338.1 50.14 288 112 288C141.5 288 168.4 299.4 188.4 318.1L262.2 256L188.4 193.9C168.4 212.6 141.5 224 112 224C50.14 224 0 173.9 0 112C0 50.14 50.14 0 112 0C173.9 0 224 50.14 224 112C224 132.8 218.3 152.3 208.5 168.9L287 235.1L485.7 67.76zM32 112C32 156.2 67.82 192 112 192C156.2 192 192 156.2 192 112C192 67.82 156.2 32 112 32C67.82 32 32 67.82 32 112zM112 480C156.2 480 192 444.2 192 400C192 355.8 156.2 320 112 320C67.82 320 32 355.8 32 400C32 444.2 67.82 480 112 480z"/></symbol>
<symbol id="svg-copy" viewBox="0 0 512 512"><path d="M272 416C263.2 416 256 423.2 256 432V448c0 17.67-14.33 32-32 32H64c-17.67 0-32-14.33-32-32V192c0-17.67 14.33-32 32-32h112C184.8 160 192 152.8 192 144C192 135.2 184.8 128 176 128H63.99c-35.35 0-64 28.65-64 64l.0098 256C0 483.3 28.65 512 64 512h160c35.35 0 64-28.65 64-64v-16C288 423.2 280.8 416 272 416zM502.6 86.63l-77.25-77.25C419.4 3.371 411.2 0 402.7 0H288C252.7 0 224 28.65 224 64v256c0 35.35 28.65 64 64 64h160c35.35 0 64-28.65 64-64V109.3C512 100.8 508.6 92.63 502.6 86.63zM416 45.25L466.7 96H416V45.25zM480 320c0 17.67-14.33 32-32 32h-160c-17.67 0-32-14.33-32-32V64c0-17.67 14.33-32 32-32h96l.0026 64c0 17.67 14.33 32 32 32H480V320z"/>
</symbol>
<symbol id="svg-angle-double-right" viewBox="0 0 512 512"><path d="M470.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 256 265.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160zm-352 160l160-160c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L210.7 256 73.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0z"/>
</symbol>
<symbol id="svg-angle-double-left" viewBox="0 0 512 512"><path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160zm352-160l-160 160c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L301.3 256 438.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0z"/>
</symbol>
<symbol id="svg-trash" viewBox="0 0 448 512">
  <path d="M336 64l-33.6-44.8C293.3 7.1 279.1 0 264 0h-80c-15.1 0-29.3 7.1-38.4 19.2L112 64H24C10.7 64 0 74.7 0 88v2c0 3.3 2.7 6 6 6h26v368c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V96h26c3.3 0 6-2.7 6-6v-2c0-13.3-10.7-24-24-24h-88zM184 32h80c5 0 9.8 2.4 12.8 6.4L296 64H152l19.2-25.6c3-4 7.8-6.4 12.8-6.4zm200 432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V96h320v368zm-176-44V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12zm-80 0V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12zm160 0V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12z"/>
</symbol>
<symbol id="svg-keyboard-down" viewBox="0 0 576 512"><path d="M64 48c-8.8 0-16 7.2-16 16V240c0 8.8 7.2 16 16 16H512c8.8 0 16-7.2 16-16V64c0-8.8-7.2-16-16-16H64zM0 64C0 28.7 28.7 0 64 0H512c35.3 0 64 28.7 64 64V240c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zM159 359c9.4-9.4 24.6-9.4 33.9 0l95 95 95-95c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9L305 505c-4.5 4.5-10.6 7-17 7s-12.5-2.5-17-7L159 393c-9.4-9.4-9.4-24.6 0-33.9zm1-167c0-8.8 7.2-16 16-16H400c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V192zM120 88h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H120c-8.8 0-16-7.2-16-16V104c0-8.8 7.2-16 16-16zm64 16c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H200c-8.8 0-16-7.2-16-16V104zm96-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H280c-8.8 0-16-7.2-16-16V104c0-8.8 7.2-16 16-16zm64 16c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H360c-8.8 0-16-7.2-16-16V104zm96-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H440c-8.8 0-16-7.2-16-16V104c0-8.8 7.2-16 16-16z"/></symbol>
</svg>`;
// <symbol id="svg-wikipedia" viewBox="0 0 640 512">
//         <path d="M640 51.2l-.3 12.2c-28.1.8-45 15.8-55.8 40.3-25 57.8-103.3 240-155.3 358.6H415l-81.9-193.1c-32.5 63.6-68.3 130-99.2 193.1-.3.3-15 0-15-.3C172 352.3 122.8 243.4 75.8 133.4 64.4 106.7 26.4 63.4.2 63.7c0-3.1-.3-10-.3-14.2h161.9v13.9c-19.2 1.1-52.8 13.3-43.3 34.2 21.9 49.7 103.6 240.3 125.6 288.6 15-29.7 57.8-109.2 75.3-142.8-13.9-28.3-58.6-133.9-72.8-160-9.7-17.8-36.1-19.4-55.8-19.7V49.8l142.5.3v13.1c-19.4.6-38.1 7.8-29.4 26.1 18.9 40 30.6 68.1 48.1 104.7 5.6-10.8 34.7-69.4 48.1-100.8 8.9-20.6-3.9-28.6-38.6-29.4.3-3.6 0-10.3.3-13.6 44.4-.3 111.1-.3 123.1-.6v13.6c-22.5.8-45.8 12.8-58.1 31.7l-59.2 122.8c6.4 16.1 63.3 142.8 69.2 156.7L559.2 91.8c-8.6-23.1-36.4-28.1-47.2-28.3V49.6l127.8 1.1.2.5z"/>
// </symbol>
// <symbol id="svg-link" viewBox="0 0 512 512">
//         <path d="M301.148 394.702l-79.2 79.19c-50.778 50.799-133.037 50.824-183.84 0-50.799-50.778-50.824-133.037 0-183.84l79.19-79.2a132.833 132.833 0 0 1 3.532-3.403c7.55-7.005 19.795-2.004 20.208 8.286.193 4.807.598 9.607 1.216 14.384.481 3.717-.746 7.447-3.397 10.096-16.48 16.469-75.142 75.128-75.3 75.286-36.738 36.759-36.731 96.188 0 132.94 36.759 36.738 96.188 36.731 132.94 0l79.2-79.2.36-.36c36.301-36.672 36.14-96.07-.37-132.58-8.214-8.214-17.577-14.58-27.585-19.109-4.566-2.066-7.426-6.667-7.134-11.67a62.197 62.197 0 0 1 2.826-15.259c2.103-6.601 9.531-9.961 15.919-7.28 15.073 6.324 29.187 15.62 41.435 27.868 50.688 50.689 50.679 133.17 0 183.851zm-90.296-93.554c12.248 12.248 26.362 21.544 41.435 27.868 6.388 2.68 13.816-.68 15.919-7.28a62.197 62.197 0 0 0 2.826-15.259c.292-5.003-2.569-9.604-7.134-11.67-10.008-4.528-19.371-10.894-27.585-19.109-36.51-36.51-36.671-95.908-.37-132.58l.36-.36 79.2-79.2c36.752-36.731 96.181-36.738 132.94 0 36.731 36.752 36.738 96.181 0 132.94-.157.157-58.819 58.817-75.3 75.286-2.651 2.65-3.878 6.379-3.397 10.096a163.156 163.156 0 0 1 1.216 14.384c.413 10.291 12.659 15.291 20.208 8.286a131.324 131.324 0 0 0 3.532-3.403l79.19-79.2c50.824-50.803 50.799-133.062 0-183.84-50.802-50.824-133.062-50.799-183.84 0l-79.2 79.19c-50.679 50.682-50.688 133.163 0 183.851z"/>
// </symbol>
//     <symbol id="svg-external-link" viewBox="0 0 448 512">
//     <path d="M400 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zm16 400c0 8.822-7.178 16-16 16H48c-8.822 0-16-7.178-16-16V80c0-8.822 7.178-16 16-16h352c8.822 0 16 7.178 16 16v352zM99.515 374.828c-4.686-4.686-4.686-12.284 0-16.971l195.15-195.15-.707-.707-89.958.342c-6.627 0-12-5.373-12-12v-9.999c0-6.628 5.372-12 12-12L340 128c6.627 0 12 5.372 12 12l-.343 136c0 6.627-5.373 12-12 12h-9.999c-6.627 0-12-5.373-12-12l.342-89.958-.707-.707-195.15 195.15c-4.686 4.686-12.284 4.686-16.971 0l-5.657-5.657z"/>
// </symbol>
// <symbol id="svg-external-link" viewBox="0 0 512 512">
//     <path d="M256 40c118.621 0 216 96.075 216 216 0 119.291-96.61 216-216 216-119.244 0-216-96.562-216-216 0-119.203 96.602-216 216-216m0-32C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm-36 344h12V232h-12c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h48c6.627 0 12 5.373 12 12v140h12c6.627 0 12 5.373 12 12v8c0 6.627-5.373 12-12 12h-72c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12zm36-240c-17.673 0-32 14.327-32 32s14.327 32 32 32 32-14.327 32-32-14.327-32-32-32z"/>
// </symbol>

/**
 * Construct a virtual keyboard element.
 */
export function makeKeyboardElement(keyboard: VirtualKeyboard): HTMLDivElement {
  keyboard.resetKeycapRegistry();

  injectStylesheets();

  const result = document.createElement('div');
  result.className = 'ML__keyboard';

  // We have a separate 'plate' element to support positioning the keyboard
  // inside custom `virtualKeyboardContainer`

  const plate = document.createElement('div');
  plate.className = 'MLK__plate';
  plate.innerHTML = window.MathfieldElement.createHTML(
    SVG_ICONS +
      keyboard.normalizedLayouts
        .map((x, i) => makeLayout(keyboard, x, i))
        .join('')
  );

  // The plate is placed on a 'backdrop' which is used to display the keyboard
  // background and account for optional margins
  const backdrop = document.createElement('div');
  backdrop.className = 'MLK__backdrop';
  backdrop.appendChild(plate);

  result.appendChild(backdrop);

  result.addEventListener('pointerdown', handlePointerDown, { passive: false });

  const toolbars = result.querySelectorAll<HTMLElement>('.ML__edit-toolbar');
  if (toolbars) {
    for (const toolbar of toolbars) {
      toolbar.addEventListener('click', (ev) => {
        let target: HTMLElement | null = ev.target as HTMLElement;
        let command = '';
        while (target && !command) {
          command = target?.getAttribute('data-command') ?? '';
          target = target?.parentElement ?? null;
        }
        if (command) keyboard.executeCommand(JSON.parse(command));
      });
    }
  }

  // Convert the HTML markup to objet literal keycaps
  makeSyntheticKeycaps(
    result.querySelectorAll<HTMLElement>(
      '.MLK__keycap, .action, .fnbutton, .bigfnbutton'
    )
  );

  const layerElements = result.querySelectorAll('.MLK__layer');
  console.assert(layerElements.length > 0, 'No virtual keyboards available');

  // Prevent a click on a virtual keyboard to focus it (and blur the mathfield)
  for (const x of layerElements)
    x.addEventListener('pointerdown', (evt) => evt.preventDefault());

  // Restore the last active keyboards, or pick the first one
  keyboard.currentLayer = keyboard.latentLayer;

  return result;
}

function makeLayout(
  keyboard: VirtualKeyboard,
  layout: NormalizedVirtualKeyboardLayout,
  index: number
): string {
  const markup: string[] = [];
  if (!('layers' in layout)) return '';
  for (const layer of layout.layers) {
    markup.push(`<div tabindex="-1" class="MLK__layer" id="${layer.id}">`);
    if (keyboard.normalizedLayouts.length > 1 || layout.displayEditToolbar) {
      markup.push(`<div class='MLK__toolbar' role='toolbar'>`);
      markup.push(makeLayoutsToolbar(keyboard, index));
      // If there are no keycap with editing commands, add an edit toolbar
      if (layout.displayEditToolbar)
        markup.push(`<div class="ML__edit-toolbar right"></div>`);
      markup.push(`</div>`);
    }
    // A layer can contain 'shortcuts' (i.e. <row> tags) that need to
    // be expanded
    markup.push(makeLayer(keyboard, layer));
    markup.push('</div>');
  }

  return markup.join('');
}

/**
 * Render the JSON-based description of the layer to HTML
 */
function makeLayer(
  keyboard: VirtualKeyboard,
  layer: Partial<NormalizedVirtualKeyboardLayer>
): string {
  if (typeof layer === 'string') return layer;

  let layerMarkup = '';
  if (typeof layer.style === 'string')
    layerMarkup += `<style>${layer.style}</style>`;
  else if (typeof layer.style === 'object')
    layerMarkup += `<style>${jsonToCss(layer.style)}</style>`;

  if (layer.backdrop) layerMarkup += `<div class='${layer.backdrop}'>`;

  if (layer.container) layerMarkup += `<div class='${layer.container}'>`;

  if (layer.rows) {
    layerMarkup += `<div class='MLK__rows'>`;
    for (const row of layer.rows) {
      layerMarkup += `<div class=row>`;
      for (const keycap of row) {
        if (keycap) {
          const keycapId = keyboard.registerKeycap(keycap);
          const [markup, cls] = renderKeycap(keycap);

          if (/(^|\s)separator/.test(cls)) layerMarkup += `<div class="${cls}"`;
          else
            layerMarkup += `<div tabindex="-1" id="${keycapId}" class="${cls}"`;

          if (keycap.tooltip)
            layerMarkup += ` data-tooltip="${keycap.tooltip}"`;

          layerMarkup += `>${markup}</div>`;
        }
      }

      layerMarkup += `</div>`;
    }

    layerMarkup += `</div>`;
  } else if (layer.markup) layerMarkup += layer.markup;

  if (layer.container) layerMarkup += '</div>';

  if (layer.backdrop) layerMarkup += '</div>';

  return layerMarkup;
}

export function renderKeycap(
  keycap: Partial<VirtualKeyboardKeycap>,
  options: { shifted: boolean } = { shifted: false }
): [markup: string, classes: string] {
  let markup = '';
  let cls = keycap.class ?? '';

  if (options.shifted && isShiftKey(keycap)) cls += ' is-active';

  if (options.shifted && 'shift' in keycap) {
    //
    // Render shifted version
    //
    if (typeof keycap.shift === 'string') markup = latexToMarkup(keycap.shift);
    else if (typeof keycap.shift === 'object') {
      markup = keycap.shift.label
        ? keycap.shift.label
        : (latexToMarkup(keycap.shift.latex || keycap.shift.insert || '') ||
            keycap.shift.key) ??
          '';
    }
    if (typeof keycap.shift === 'object')
      cls = keycap.shift.class ?? keycap.class ?? '';
  } else {
    //
    // Render non-shifted version
    //
    markup = keycap.label
      ? keycap.label
      : (latexToMarkup(keycap.latex || keycap.insert || '') || keycap.key) ??
        '';

    if (keycap.shift) {
      // There is a shift version of this keycap, render a small label
      let shiftLabel: string;
      if (typeof keycap.shift === 'string')
        shiftLabel = latexToMarkup(keycap.shift);
      else if (keycap.shift.label) shiftLabel = keycap.shift.label;
      else {
        shiftLabel =
          (latexToMarkup(keycap.shift.latex || keycap.shift.insert || '') ||
            keycap.shift.key) ??
          '';
      }
      markup += `<span class="MLK__shift">${shiftLabel}</span>`;
    }

    if (keycap.aside) markup += `<aside>${keycap.aside}</aside>`;
  }

  if (keycap.layer && !/layer-switch/.test(cls)) cls += ' layer-switch';
  if (!/(^|\s)(separator|action|shift|fnbutton|bigfnbutton)($|\s)/.test(cls))
    cls += ' MLK__keycap';
  // If there's no explicit width class, and a width is specified,
  // add a class
  if (!/\bw[0-9]+\b/.test(cls) && keycap.width) {
    cls +=
      { 0: ' w0', 0.5: ' w5', 1.5: ' w15', 2.0: ' w20', 5.0: ' w50' }[
        keycap.width
      ] ?? '';
  }

  return [markup, cls || 'MLK__keycap'];
}

const KEYCAP_SHORTCUTS: Record<string, Partial<VirtualKeyboardKeycap>> = {
  '[left]': {
    class: 'action hide-shift',
    label: '<svg class=svg-glyph><use xlink:href=#svg-arrow-left /></svg>',
    command: ['performWithFeedback', 'moveToPreviousChar'],
    shift: {
      label:
        '<svg class=svg-glyph><use xlink:href=#svg-angle-double-left /></svg>',
      command: ['performWithFeedback', 'extendSelectionBackward'],
    },
  },
  '[right]': {
    class: 'action hide-shift',
    label: '<svg class=svg-glyph><use xlink:href=#svg-arrow-right /></svg>',
    command: ['performWithFeedback', 'moveToNextChar'],
    shift: {
      label:
        '<svg class=svg-glyph><use xlink:href=#svg-angle-double-right /></svg>',
      command: ['performWithFeedback', 'extendSelectionForward'],
    },
  },
  '[return]': {
    class: 'action',
    command: ['performWithFeedback', 'commit'],
    width: 1.5,
    label: '<svg class=svg-glyph><use xlink:href=#svg-commit /></svg>',
  },
  '[action]': {
    class: 'action',
    command: ['performWithFeedback', 'commit'],
    width: 1.5,
    label: '<svg class=svg-glyph><use xlink:href=#svg-commit /></svg>',
  },
  '[hr]': {
    class: 'separator horizontal-rule',
  },
  '[hide-keyboard]': {
    class: 'action',
    command: ['performWithFeedback', 'hideVirtualKeyboard'],
    width: 1.5,
    label:
      '<svg class=svg-glyph-lg><use xlink:href=#svg-keyboard-down /></svg>',
  },
  '[.]': {
    variants: '.',
    command: 'insertDecimalSeparator',
    shift: ',',
    class: 'big-op hide-shift',
  },
  '[+]': {
    variants: [{ latex: '\\sum_{#0}^{#0}', class: 'small' }, '\\oplus'],
    latex: '+',
    label: '+',
    class: 'big-op hide-shift',
    shift: {
      latex: '\\sum',
      insert: '\\sum_{#?}^{#?}',
      class: 'small',
    },
  },
  '[-]': {
    variants: ['\\pm', '\\ominus'],
    latex: '-',
    label: '&#x2212;',
    shift: '\\pm',
    class: 'big-op hide-shift',
  },
  '[/]': {
    class: 'big-op hide-shift',
    shift: { class: '', latex: '\\frac{1}{#@}' },
    variants: ['/', '\\div', '\\%', '\\oslash'],
    latex: '\\frac{#@}{#?}',
    label: '&divide;',
  },
  '[*]': {
    variants: [{ latex: '\\prod_{#0}^{#0}', class: 'small' }, '\\otimes'],
    latex: '\\times',
    label: '&times;',
    shift: {
      latex: '\\prod',
      insert: '\\prod_{#?}^{#?}',
      class: 'small',
    },
    class: 'big-op hide-shift',
  },
  '[=]': {
    variants: [
      '\\neq',
      '\\equiv',
      '\\varpropto',
      '\\thickapprox',
      '\\lt',
      '\\gt',
      '\\le',
      '\\ge',
    ],
    latex: '=',
    label: '=',
    shift: { label: '≠', latex: '\\ne' },
    class: 'big-op hide-shift',
  },
  '[backspace]': {
    class: 'action bottom right hide-shift',
    width: 1.5,
    command: ['performWithFeedback', 'deleteBackward'],
    label: '<svg class=svg-glyph><use xlink:href=#svg-delete-backward /></svg>',
    shift: {
      class: 'action warning',
      label: '<svg class=svg-glyph><use xlink:href=#svg-trash /></svg>',
      command: 'deleteAll',
    },
  },
  '[undo]': {
    class: 'ghost if-can-undo',
    command: 'undo',
    label: '<svg class=svg-glyph><use xlink:href=#svg-undo /></svg>',
    tooltip: l10n('tooltip.undo'),
  },
  '[redo]': {
    class: 'ghost  if-can-redo',
    command: 'redo',
    label: '<svg class=svg-glyph><use xlink:href=#svg-redo /></svg>',
    tooltip: l10n('tooltip.redo'),
  },

  '[(]': {
    variants: [
      // We insert the fences as "keys" so they can be handled by smartFence.
      // They will be sent via `onKeystroke` instead of inserted directly in
      // the model
      { latex: '\\lbrack', key: '[' },
      '\\langle',
      '\\lfloor',
      '\\lceil',
      { latex: '\\lbrace', key: '{' },
    ],
    key: '(',
    label: '(',
    shift: { label: '[', key: '[' },
    class: 'hide-shift',
  },
  '[)]': {
    variants: [
      { latex: '\\rbrack', key: ']' },
      '\\rangle',
      '\\rfloor',
      '\\rceil',
      { latex: '\\rbrace', key: ']' },
    ],
    key: ')',
    label: ')',
    shift: { label: ']', latex: '\\rbrack' },
    class: 'hide-shift',
  },
  '[0]': {
    variants: '0',
    latex: '0',
    label: '0',
    shift: '\\infty',
    class: 'hide-shift',
  },
  '[1]': {
    variants: '1',
    latex: '1',
    label: '1',
    shift: '#@^{-1}',
    class: 'hide-shift',
  },
  '[2]': {
    variants: '2',
    latex: '2',
    label: '2',
    shift: '#@^2',
    class: 'hide-shift',
  },
  '[3]': {
    variants: '3',
    latex: '3',
    label: '3',
    shift: '#@^3',
    class: 'hide-shift',
  },
  '[4]': {
    variants: '4',
    latex: '4',
    label: '4',
    shift: '#@^4',
    class: 'hide-shift',
  },
  '[5]': {
    variants: '5',
    latex: '5',
    label: '5',
    shift: '#@^5',
    class: 'hide-shift',
  },
  '[6]': {
    variants: '6',
    latex: '6',
    label: '6',
    shift: '#@^6',
    class: 'hide-shift',
  },
  '[7]': {
    variants: '7',
    latex: '7',
    label: '7',
    shift: '#@^7',
    class: 'hide-shift',
  },
  '[8]': {
    variants: '8',
    latex: '8',
    label: '8',
    shift: '#@^8',
    class: 'hide-shift',
  },
  '[9]': {
    variants: '9',
    latex: '9',
    label: '9',
    shift: '#@^9',
    class: 'hide-shift',
  },
  '[separator-5]': { class: 'separator', width: 0.5 },
  '[separator]': { class: 'separator' },
  '[separator-10]': { class: 'separator' },
  '[separator-15]': { class: 'separator', width: 1.5 },
  '[separator-20]': { class: 'separator', width: 2.0 },
  '[separator-50]': { class: 'separator', width: 5.0 },
  '[shift]': {
    class: 'shift bottom left',
    width: 1.5,
    label:
      '<span class=caps-lock-indicator></span><svg class=svg-glyph><use xlink:href=#svg-shift /></svg>',
  },
  '[foreground-color]': {
    variants: 'foreground-color',
    command: ['applyStyle', { color: 'red' }],
    label:
      "<span style='border-radius: 50%;width:22px;height:22px; border: 3px solid #cc2428; box-sizing: border-box'>",
  },
  '[background-color]': {
    variants: 'background-color',
    command: ['applyStyle', { backgroundColor: 'yellow' }],
    label:
      "<span style='border-radius: 50%;width:22px;height:22px; background:#fff590; box-sizing: border-box'></span>",
  },
};

export function normalizeKeycap(
  keycap: string | Partial<VirtualKeyboardKeycap>
): Partial<VirtualKeyboardKeycap> {
  if (typeof keycap === 'string') {
    if (!KEYCAP_SHORTCUTS[keycap]) return { latex: keycap };
    keycap = { label: keycap };
  }

  let shortcut: Partial<VirtualKeyboardKeycap> | undefined = undefined;
  if ('label' in keycap && keycap.label && KEYCAP_SHORTCUTS[keycap.label]) {
    shortcut = {
      ...KEYCAP_SHORTCUTS[keycap.label],
      ...keycap,
      label: KEYCAP_SHORTCUTS[keycap.label].label,
    };
  }
  if ('key' in keycap && keycap.key && KEYCAP_SHORTCUTS[keycap.key]) {
    shortcut = {
      ...KEYCAP_SHORTCUTS[keycap.key],
      ...keycap,
      key: KEYCAP_SHORTCUTS[keycap.key].key,
    };
  }
  if (shortcut) {
    if (shortcut.command === 'insertDecimalSeparator')
      shortcut.label = window.MathfieldElement.decimalSeparator ?? '.';

    if (keycap.label === '[action]') {
      shortcut = {
        ...shortcut,
        ...(window.mathVirtualKeyboard
          .actionKeycap as Partial<VirtualKeyboardKeycap>),
      };
    }
    if (keycap.label === '[shift]') {
      shortcut = {
        ...shortcut,
        ...(window.mathVirtualKeyboard
          .shiftKeycap as Partial<VirtualKeyboardKeycap>),
      };
    }
    if (keycap.label === '[backspace]') {
      shortcut = {
        ...shortcut,
        ...(window.mathVirtualKeyboard
          .backspaceKeycap as Partial<VirtualKeyboardKeycap>),
      };
    }
    if (keycap.label === '[tab]') {
      shortcut = {
        ...shortcut,
        ...(window.mathVirtualKeyboard
          .tabKeycap as Partial<VirtualKeyboardKeycap>),
      };
    }

    return shortcut;
  }

  return keycap;
}

let pressAndHoldTimer;

function handlePointerDown(ev: PointerEvent) {
  if (ev.button !== 0) return;

  const keyboard = VirtualKeyboard.singleton;

  //
  // Is this event for a layer switch
  //

  let layerButton: HTMLElement | null = ev.target as HTMLElement;
  while (layerButton && !layerButton.getAttribute('data-layer'))
    layerButton = layerButton.parentElement;
  if (layerButton) {
    keyboard.currentLayer = layerButton.getAttribute('data-layer') ?? '';
    ev.preventDefault();
    return;
  }

  //
  // Is this event for a keycap?
  //
  const target = parentKeycap(ev.target);

  if (!target?.id) return;

  const keycap = keyboard.getKeycap(target.id);

  if (!keycap) return;

  console.assert(ev.type === 'pointerdown');

  const controller = new AbortController();

  target.classList.add('is-pressed');
  target.addEventListener(
    'pointerenter',
    handleVirtualKeyboardEvent(controller),
    {
      capture: true,
      signal: controller.signal,
    }
  );
  target.addEventListener(
    'pointerleave',
    handleVirtualKeyboardEvent(controller),
    {
      capture: true,
      signal: controller.signal,
    }
  );
  target.addEventListener(
    'pointercancel',
    handleVirtualKeyboardEvent(controller),
    {
      signal: controller.signal,
    }
  );
  target.addEventListener('pointerup', handleVirtualKeyboardEvent(controller), {
    signal: controller.signal,
  });

  // Is it the Shift key?
  if (isShiftKey(keycap)) {
    target.classList.add('is-active');
    keyboard.incrementShiftPress();
  }

  if (keycap.variants) {
    if (pressAndHoldTimer) clearTimeout(pressAndHoldTimer);
    pressAndHoldTimer = setTimeout(() => {
      if (target!.classList.contains('is-pressed')) {
        target!.classList.remove('is-pressed');
        target!.classList.add('is-active');
        if (ev.target && 'releasePointerCapture' in ev.target)
          (ev.target as HTMLElement).releasePointerCapture(ev.pointerId);
        showVariantsPanel(target!, () => {
          controller.abort();
          target?.classList.remove('is-active');
        });
      }
    }, 200);
  }

  ev.preventDefault();
}

function handleVirtualKeyboardEvent(controller) {
  return (ev: Event) => {
    // Is this event for a keycap?
    const target = parentKeycap(ev.target);

    if (!target?.id) return;

    const keyboard = VirtualKeyboard.singleton;
    const keycap = keyboard.getKeycap(target.id);

    if (!keycap) return;

    if (ev.type === 'pointerenter' && ev.target === target) {
      const pev = ev as PointerEvent;
      if (pev.isPrimary) target.classList.add('is-pressed');
    }

    if (ev.type === 'pointercancel') {
      target.classList.remove('is-pressed');
      if (isShiftKey(keycap)) {
        keyboard.decrementShiftPress();
        // Because of capslock, we may not have changed status
        target.classList.toggle('is-active', keyboard.isShifted);
      }
      controller.abort();
      return;
    }

    if (ev.type === 'pointerleave' && ev.target === target) {
      target.classList.remove('is-pressed');
      if (isShiftKey(keycap)) {
        keyboard.decrementShiftPress();
        // Because of capslock, we may not have changed status
        target.classList.toggle('is-active', keyboard.isShifted);
      }
      return;
    }

    if (ev.type === 'pointerup') {
      if (pressAndHoldTimer) clearTimeout(pressAndHoldTimer);
      if (isShiftKey(keycap)) {
        // Because of capslock, we may not have changed status
        target.classList.toggle('is-active', keyboard.isShifted);
      } else if (target.classList.contains('is-pressed')) {
        target.classList.remove('is-pressed');

        if (keyboard.isShifted && keycap.shift) {
          if (typeof keycap.shift === 'string') {
            keyboard.executeCommand([
              'typedText',
              keycap.shift,
              {
                focus: true,
                feedback: true,
                scrollIntoView: true,
                mode: 'math',
                format: 'latex',
                resetStyle: true,
              },
            ]);
          } else executeKeycapCommand(keycap.shift);
        } else executeKeycapCommand(keycap);

        if (keyboard.shiftPressCount === 1) keyboard.resetShiftPress();
      }
      controller.abort();
      ev.preventDefault();
      return;
    }
  };
}

export function executeKeycapCommand(
  keycap: Partial<VirtualKeyboardKeycap>
): void {
  let command: SelectorPrivate | [SelectorPrivate, ...any[]] | undefined =
    keycap.command as SelectorPrivate | [SelectorPrivate, ...any[]] | undefined;
  if (!command && keycap.insert) {
    command = [
      'insert',
      keycap.insert,
      {
        focus: true,
        feedback: true,
        scrollIntoView: true,
        mode: 'math',
        format: 'latex',
        resetStyle: true,
      },
    ];
  }
  if (!command && keycap.key) {
    command = [
      'typedText',
      keycap.key,
      { focus: true, feedback: true, simulateKeystroke: true },
    ];
  }

  if (!command && keycap.latex) {
    command = [
      'insert',
      keycap.latex,
      {
        focus: true,
        feedback: true,
        scrollIntoView: true,
        mode: 'math',
        format: 'latex',
        resetStyle: true,
      },
    ];
  }
  if (!command) {
    command = [
      'typedText',
      keycap.label,
      { focus: true, feedback: true, simulateKeystroke: true },
    ];
  }
  VirtualKeyboard.singleton.executeCommand(command);
}

function isKeycapElement(el: Element): el is HTMLElement {
  if (el.nodeType !== 1) return false;
  const classes = (el as HTMLElement).classList;
  return (
    classes.contains('MLK__keycap') ||
    classes.contains('shift') ||
    classes.contains('action') ||
    classes.contains('fnbutton') ||
    classes.contains('bigfnbutton')
  );
}

export function parentKeycap(el: EventTarget | null): HTMLElement | undefined {
  if (!el) return undefined;

  let node: Element | null = el as Element;
  while (node && !isKeycapElement(node)) node = node.parentElement;

  return (node as HTMLElement) ?? undefined;
}

function isShiftKey(k: Partial<VirtualKeyboardKeycap>): boolean {
  return !!k.class && /(^|\s)shift($|\s)/.test(k.class);
}
