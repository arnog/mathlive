import { Atom } from '../core/atom';
import { coalesce, adjustInterAtomSpacing, Box, makeStruts } from '../core/box';
import { DEFAULT_FONT_SIZE } from '../core/font-metrics';
import { l10n as l10nOptions, localize as l10n } from '../core/l10n';
import { parseLatex } from '../core/parser';
import {
  ButtonHandlers,
  attachButtonHandlers,
} from '../editor-mathfield/buttons';
import { SelectorPrivate } from '../editor/types';
import { getActiveKeyboardLayout } from '../editor/keyboard-layout';
import {
  MathfieldElement,
  VirtualKeyboardOptions,
  VirtualKeyboardLayer,
  VirtualKeyboardLayout,
  VirtualKeyboardKeycap,
  NormalizedVirtualKeyboardLayout,
  Selector,
} from '../mathlive';

import VIRTUAL_KEYBOARD_STYLESHEET from '../../css/virtual-keyboard.less';
import CORE_STYLESHEET from '../../css/core.less';

import { Stylesheet, inject as injectStylesheet } from '../common/stylesheet';
import { hashCode } from '../common/hash-code';
import { loadFonts } from '../core/fonts';
import { Context } from '../core/context';

import { LAYOUTS, LAYERS, SHIFTED_KEYS } from './data';
import { VirtualKeyboard } from './virtual-keyboard';
import { MathfieldProxy } from '../public/virtual-keyboard-types';
import { hideVariantsPanel, setVariants, showVariantsPanel } from './variants';
import { defaultGlobalContext } from '../core/context-utils';

/*
 * Restore the key labels and commands to the state before a modifier key
 * was pressed.
 *
 */
export function unshiftKeyboardLayer(): boolean {
  hideVariantsPanel();

  const keycaps =
    VirtualKeyboard.singleton.element!.querySelectorAll<HTMLElement>(
      '.MLK__layer.is-visible .MLK__keycap, .MLK__layer.is-visible .action'
    );
  if (keycaps) {
    for (const keycap of keycaps) {
      keycap.classList.remove('is-active');
      keycap.classList.remove('is-pressed');

      const content = keycap.getAttribute('data-unshifted-content');
      if (content) {
        keycap.innerHTML = MathfieldElement.createHTML(content);
        keycap.dataset.unshiftedContent = '';
      }

      const command = keycap.getAttribute('data-unshifted-command');
      if (command) {
        keycap.dataset.command = command;
        keycap.dataset.unshiftedCommand = '';
      }
    }
  }

  return false;
}

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

export function latexToMarkup(
  latex: string,
  arg?: (arg: string) => string
): string {
  if (!latex) return '';
  // Since we don't have preceding atoms, we'll interpret #@ as a placeholder
  latex = latex.replace(/(^|[^\\])#@/g, '$1#?');

  const globalContext = defaultGlobalContext();

  const root = new Atom('root', globalContext);
  root.body = parseLatex(latex, globalContext, {
    parseMode: 'math',
    args: arg ?? (() => '\\placeholder{}'),
  });

  const context = new Context(
    { registers: globalContext.registers },
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

function normalizeLayer(
  layer: string | VirtualKeyboardLayer | (string | VirtualKeyboardLayer)[]
): VirtualKeyboardLayer[] {
  if (Array.isArray(layer)) return layer.map((x) => normalizeLayer(x)).flat();

  if (typeof layer === 'string' && LAYERS[layer])
    return normalizeLayer({ markup: LAYERS[layer], id: layer });

  let result: VirtualKeyboardLayer;
  if (typeof layer === 'string') result = { markup: layer };
  else result = layer;

  if (!result.id) {
    result.id =
      'ML__layer_' +
      Date.now().toString(36).slice(-2) +
      Math.floor(Math.random() * 0x186a0).toString(36);
  }

  return [result];
}

export function normalizeLayout(
  layout: string | VirtualKeyboardLayout
): NormalizedVirtualKeyboardLayout {
  if (typeof layout === 'string') return normalizeLayout(LAYOUTS[layout]);

  if ('rows' in layout && Array.isArray(layout.rows)) {
    console.assert(
      !('layers' in layout),
      `MathLive {{SDK_VERSION}}: only provide either a "rows" or "layers" property, not both`
    );

    let hasShift = false;
    let hasEdit = false;
    for (const keycap of layout.rows.flat()) {
      const label = typeof keycap === 'string' ? keycap : keycap.label!;
      if (label === '[shift]') hasShift = true;
      if (['[undo]', '[redo]', '[cut]', '[copy]', '[paste]'].includes(label))
        hasEdit = true;
    }
    if (
      !('displayShiftedKeycaps' in layout) ||
      layout.displayShiftedKeycaps === undefined
    )
      layout.displayShiftedKeycaps = hasShift;
    if (
      !('displayEditToolbar' in layout) ||
      layout.displayEditToolbar === undefined
    )
      layout.displayEditToolbar = !hasEdit;

    return {
      ...layout,
      layers: normalizeLayer({ rows: layout.rows }),
      rows: undefined,
    } as NormalizedVirtualKeyboardLayout;
  }

  if ('markup' in layout && typeof layout.markup === 'string') {
    return {
      ...layout,
      layers: normalizeLayer(layout.markup as string),
    } as NormalizedVirtualKeyboardLayout;
  }

  const result: NormalizedVirtualKeyboardLayout = {
    ...layout,
  } as NormalizedVirtualKeyboardLayout;
  if ('layers' in layout) result.layers = normalizeLayer(layout.layers);
  if (
    !('displayEditToolbar' in layout) ||
    layout.displayEditToolbar === undefined
  )
    result.displayEditToolbar = true;

  return result;
}

/**
 * Return a markup string for the layouts toolbar for the specified layout.
 */
function makeLayoutsToolbar(keyboard: VirtualKeyboard, index: number): string {
  // The left hand side of the toolbar has a list of all the available keyboards
  let markup = `<div class="left">`;
  if (keyboard.layouts.length > 1) {
    for (const [i, l] of keyboard.layouts.entries()) {
      const layout = l;

      const classes = [i === index ? 'selected' : 'layer-switch'];
      if (layout.tooltip) classes.push('MLK__tooltip');
      if (layout.classes) classes.push(...layout.classes.split(' '));

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

export function makeActionToolbar(
  options: VirtualKeyboardOptions,
  mathfield: MathfieldProxy
): string {
  let result = '';
  const toolbarOptions = options.actionToolbar;
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

export function makeKeycap(
  keyboard: VirtualKeyboard,
  elementList: HTMLElement[],
  chainedCommand?: SelectorPrivate
): void {
  for (const element of elementList) {
    // Display
    let html = element.innerHTML;
    if (!html) {
      if (element.getAttribute('data-label'))
        html = element.getAttribute('data-label')!.replace(/&quot;/g, '"');
      else if (element.getAttribute('data-latex')) {
        html = latexToMarkup(
          element.getAttribute('data-latex')!.replace(/&quot;/g, '"')
        );
      } else if (element.getAttribute('data-insert')) {
        html = latexToMarkup(
          element.getAttribute('data-insert')!.replace(/&quot;/g, '"')
        );
      }
      // } else if (element.getAttribute('data-content'))
      //   html = element.getAttribute('data-content')!.replace(/&quot;/g, '"');

      if (element.getAttribute('data-aside')) {
        html += `<aside>${element
          .getAttribute('data-aside')!
          .replace(/&quot;/g, '"')}</aside>`;
      }

      if (html) element.innerHTML = MathfieldElement.createHTML(html);
    }

    if (element.getAttribute('data-classes'))
      element.classList.add(element.getAttribute('data-classes')!);

    const key = element.getAttribute('data-insert')?.replace(/&quot;/g, '"');
    if (key && SHIFTED_KEYS[key]) {
      element.dataset.shifted = SHIFTED_KEYS[key][0];
      element.dataset.shiftedCommand = JSON.stringify([
        'insertAndUnshiftKeyboardLayer',
        SHIFTED_KEYS[key][1],
      ]);
    }

    // Commands
    let selector: SelectorPrivate | [SelectorPrivate, ...any[]] | undefined =
      undefined;
    const command = element.getAttribute('data-command');
    if (command) {
      if (/^[a-zA-Z]+$/.test(command)) selector = command as SelectorPrivate;
      else {
        try {
          selector = JSON.parse(command);
        } catch (e) {}
      }
    } else if (element.getAttribute('data-insert')) {
      // @deprecated
      console.log(
        'insert keycap',
        element.getAttribute('data-insert'),
        'with latex',
        element.getAttribute('data-latex')
      );
      selector = [
        'insert',
        element.getAttribute('data-insert')!,
        {
          focus: true,
          feedback: true,
          scrollIntoView: true,
          mode: 'math',
          format: 'latex',
          resetStyle: true,
        },
      ];
    } else if (element.getAttribute('data-latex')) {
      selector = [
        'insert',
        element.getAttribute('data-latex')!,
        {
          focus: true,
          feedback: true,
          scrollIntoView: true,
          mode: 'math',
          format: 'latex',
          resetStyle: true,
        },
      ];
    } else {
      console.log('keycap fallback, key = ', element.getAttribute('data-key'));
      selector = [
        'typedText',
        element.getAttribute('data-key') ?? element.textContent!,
        { focus: true, feedback: true, simulateKeystroke: true },
      ];
    }

    if (selector) {
      if (chainedCommand) selector = [chainedCommand, selector];

      let handlers: ButtonHandlers = { default: selector };
      const variantsId = element.getAttribute('data-variants');
      if (variantsId) {
        handlers = {
          default: selector,
          pressAndHold: ['showVariantsPanel' as Selector, variantsId],
        };
        // } else {
        //   console.warn(`Unknown variants: "${variantsId}"`);
      }

      attachButtonHandlers(
        element,
        (command) => {
          if (Array.isArray(command)) {
            if (command[0] === ('showVariantsPanel' as Selector))
              return showVariantsPanel(element, variantsId!);
          }
          return keyboard.executeCommand(command);
        },
        handlers
      );
    }
  }
}

/**
 * Expand the shortcut tags (e.g. <row>) inside a layer.
 */
function expandLayerMarkup(
  options: VirtualKeyboardOptions,
  layer: string
): string {
  const ROWS = {
    // First row should be 10 key wide
    // Second row should be 10 key wide
    // Third row should be 8.5 key wide
    // One row should have ^ (shift key) which is 1.5 key wide
    // One row should have ~ (delete key) which is .5 or 1.5 key wide
    qwerty: {
      'lower-1': 'qwertyuiop',
      'lower-2': ' asdfghjkl ',
      'lower-3': '^zxcvbnm~',
      'upper-1': 'QWERTYUIOP',
      'upper-2': ' ASDFGHJKL ',
      'upper-3': '^ZXCVBNM~',
      'numpad-1': '789/',
      'numpad-2': '456*',
      'numpad-3': '123-',
      'numpad-4': '0.=+',
    },
    azerty: {
      'lower-1': 'azertyuiop',
      'lower-2': 'qsdfghjklm',
      'lower-3': '^ wxcvbn ~',
      'upper-1': 'AZERTYUIOP',
      'upper-2': 'QSDFGHJKLM',
      'upper-3': '^ WXCVBN ~',
    },
    qwertz: {
      'lower-1': 'qwertzuiop',
      'lower-2': ' asdfghjkl ',
      'lower-3': '^yxcvbnm~',
      'upper-1': 'QWERTZUIOP',
      'upper-2': ' ASDFGHJKL',
      'upper-3': '^YXCVBNM~',
    },
    dvorak: {
      'lower-1': '^  pyfgcrl ',
      'lower-2': 'aoeuidhtns',
      'lower-3': 'qjkxbmwvz~',
      'upper-1': '^  PYFGCRL ',
      'upper-2': 'AOEUIDHTNS',
      'upper-3': 'QJKXBMWVZ~',
    },
    colemak: {
      'lower-1': ' qwfpgjluy ',
      'lower-2': 'arstdhneio',
      'lower-3': '^zxcvbkm~',
      'upper-1': ' QWFPGNLUY ',
      'upper-2': 'ARSTDHNEIO',
      'upper-3': '^ZXCVBKM~',
    },
  };
  // Determine the layout of the virtual keyboard based on a
  // detected physical keyboard layout, or the current locale
  let layoutName = options.alphabeticLayout;
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

  const layout = ROWS[layoutName] ?? ROWS.qwerty;

  let result = layer;
  let row;

  result = result.replace(
    /<arrows\/>/g,
    `
        <li class='action' data-command='["performWithFeedback","moveToPreviousChar"]'
            data-shifted='<svg class="svg-glyph"><use xlink:href="#svg-angle-double-left" /></svg>'
            data-shifted-command='["performWithFeedback","extendToPreviousChar"]'>
            <svg class="svg-glyph"><use xlink:href='#svg-arrow-left' /></svg>
        </li>
        <li class='action' data-command='["performWithFeedback","moveToNextChar"]'
            data-shifted='<svg class="svg-glyph"><use xlink:href="#svg-angle-double-right" /></svg>'
            data-shifted-command='["performWithFeedback","extendToNextChar"]'>
            <svg class="svg-glyph"><use xlink:href='#svg-arrow-right' /></svg>
        </li>
        <li class='action' data-command='["performWithFeedback","commit"]'>
        <svg class="svg-glyph"><use xlink:href='#svg-commit' /></svg></li>`
  );

  let m: string[] | null = result.match(/(<row\s+)(.*)((?:<\/row|\/)>)/);
  while (m) {
    row = '';
    const attributesArray = m[2].match(/[a-zA-Z][a-zA-Z\d-]*=(['"])(.*?)\1/g);
    const attributes: Record<string, string> = {};
    if (attributesArray) {
      for (const attribute of attributesArray) {
        const m2 = attribute.match(/([a-zA-Z][a-zA-Z\d-]*)=(['"])(.*?)\2/);
        if (m2) attributes[m2[1]] = m2[3];
      }
    }

    let keys = layout[attributes.name] as string;
    if (!keys) keys = ROWS.qwerty[attributes.name];
    if (!keys) {
      console.error(
        `MathLive {{SDK_VERSION}}: Unknown roman keyboard row:`,
        attributes.name
      );
    } else {
      for (const c of keys) {
        let cls: string = attributes.class ?? '';
        if (cls) cls = ` ${cls}`;
        if (c === '~') {
          row += `<li class='action font-glyph bottom right `;
          row +=
            keys.length - (keys.match(/ /g) || []).length / 2 === 10
              ? ''
              : 'w15';
          row += `' data-shifted='<span class="warning"><svg class="svg-glyph"><use xlink:href="#svg-trash" /></svg></span>'
                        data-shifted-command='"deleteAll"'
                        data-variants='delete' data-command='["performWithFeedback","deleteBackward"]'
                        ><svg class="svg-glyph"><use xlink:href="#svg-delete-backward" /></svg></li>`;
        } else if (c === ' ') {
          // Separator
          row += "<li class='separator w5'></li>";
        } else if (c === '^') {
          // Shift key
          row +=
            `<li class='shift modifier font-glyph bottom left w15 layer-switch' data-layer='` +
            attributes['shift-layer'] +
            `'><svg class="svg-glyph"><use xlink:href="#svg-shift" /></svg></li>`;
        } else if (c === '/')
          row += `<li class="MLK__keycap big-op ${cls}" data-variants="/" data-insert='\\frac{#@}{#?}'>&divide;</li>`;
        else if (c === '*')
          row += `<li class="MLK__keycap big-op ${cls}" data-variants="*" data-insert='\\times '>&times;</li>`;
        else if (c === '-')
          row += `<li class="MLK__keycap  big-op ${cls}" data-variants="-" data-key='-'>&#x2212;</li>`;
        else if (c === '.') {
          row +=
            "<li class='MLK__keycap big-op " +
            cls +
            "' data-variants='.' data-command='\"insertDecimalSeparator\"'>" +
            (options['decimalSeparator'] ?? '.') +
            '</li>';
        } else if (c === '+')
          row += `<li class="MLK__keycap big-op ${cls}" data-variants="+" data-key="+">+</li>`;
        else if (c === '=')
          row += `<li class="MLK__keycap big-op ${cls}" data-variants="=" data-key="=">=</li>`;
        else
          row += `<li class="MLK__keycap ${cls}" data-variants="${c}">${c}</li>`;
      }
    }

    result = result.replace(new RegExp(m[1] + m[2] + m[3]), row);

    m = result.match(/(<row\s+)(.*)((?:<\/row|\/)>)/);
  }

  return result;
}

let gCoreStylesheet: Stylesheet | null;
let gVirtualKeyboardStylesheet: Stylesheet | null;

let gVirtualKeyboardStylesheetHash: string;

function injectStylesheets(): void {
  if (!gVirtualKeyboardStylesheet) {
    if (!gVirtualKeyboardStylesheetHash) {
      gVirtualKeyboardStylesheetHash = hashCode(
        VIRTUAL_KEYBOARD_STYLESHEET
      ).toString(36);
    }
    gVirtualKeyboardStylesheet = injectStylesheet(
      null,
      VIRTUAL_KEYBOARD_STYLESHEET,
      gVirtualKeyboardStylesheetHash
    );
  }
  if (!gCoreStylesheet) {
    gCoreStylesheet = injectStylesheet(
      null,
      CORE_STYLESHEET,
      hashCode(CORE_STYLESHEET).toString(36)
    );
    void loadFonts();
  }
}

export function releaseStylesheets(): void {
  gCoreStylesheet?.release();
  gCoreStylesheet = null;
  gVirtualKeyboardStylesheet?.release();
  gVirtualKeyboardStylesheet = null;
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
<symbol id="svg-angle-double-right" viewBox="0 0 320 512">
  <path d="M166.9 264.5l-117.8 116c-4.7 4.7-12.3 4.7-17 0l-7.1-7.1c-4.7-4.7-4.7-12.3 0-17L127.3 256 25.1 155.6c-4.7-4.7-4.7-12.3 0-17l7.1-7.1c4.7-4.7 12.3-4.7 17 0l117.8 116c4.6 4.7 4.6 12.3-.1 17zm128-17l-117.8-116c-4.7-4.7-12.3-4.7-17 0l-7.1 7.1c-4.7 4.7-4.7 12.3 0 17L255.3 256 153.1 356.4c-4.7 4.7-4.7 12.3 0 17l7.1 7.1c4.7 4.7 12.3 4.7 17 0l117.8-116c4.6-4.7 4.6-12.3-.1-17z"/>
</symbol>
<symbol id="svg-angle-double-left" viewBox="0 0 320 512">
  <path d="M153.1 247.5l117.8-116c4.7-4.7 12.3-4.7 17 0l7.1 7.1c4.7 4.7 4.7 12.3 0 17L192.7 256l102.2 100.4c4.7 4.7 4.7 12.3 0 17l-7.1 7.1c-4.7 4.7-12.3 4.7-17 0L153 264.5c-4.6-4.7-4.6-12.3.1-17zm-128 17l117.8 116c4.7 4.7 12.3 4.7 17 0l7.1-7.1c4.7-4.7 4.7-12.3 0-17L64.7 256l102.2-100.4c4.7-4.7 4.7-12.3 0-17l-7.1-7.1c-4.7-4.7-12.3-4.7-17 0L25 247.5c-4.6 4.7-4.6 12.3.1 17z"/>
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
 * Construct a virtual keyboard element based on the config options in the
 * mathfield and an optional theme.
 */
export function makeKeyboardElement(keyboard: VirtualKeyboard): HTMLDivElement {
  injectStylesheets();

  const result = document.createElement('div');
  result.className = 'ML__keyboard';

  // We have a separate 'plate' element to support positioning the keyboard
  // inside custom `virtualKeyboardContainer`

  const plate = document.createElement('div');
  plate.className = 'MLK__plate';
  plate.innerHTML = MathfieldElement.createHTML(
    SVG_ICONS +
      keyboard.layouts.map((x, i) => makeLayout(keyboard, x, i)).join('')
  );

  // The plate is placed on a 'backdrop' which is used to display the keyboard
  // background and account for optional margins
  const backdrop = document.createElement('div');
  backdrop.className = 'MLK__backdrop';
  backdrop.appendChild(plate);

  result.appendChild(backdrop);

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

  // Associated ids with each keycap
  const keycaps = result.querySelectorAll<HTMLElement>(
    '.MLK__keycap, .action, .fnbutton, .bigfnbutton'
  );
  for (const keycap of keycaps) {
    keycap.id =
      'ML__k' +
      Date.now().toString(36).slice(-2) +
      Math.floor(Math.random() * 0x186a0).toString(36);
  }

  // Attach the element handlers
  makeKeycap(keyboard, [...keycaps]);

  const elementList = result.querySelectorAll<HTMLElement>('.layer-switch');
  for (const element of elementList) {
    if (element.classList.contains('shift')) {
      // This is a potential press-and-hold layer switch
      attachButtonHandlers(
        element,
        (command) => keyboard.executeCommand(command),
        {
          // When the modifier is initially pressed, we will shift the labels
          // (if available)
          pressed: 'shiftKeyboardLayer',

          // If the key is released before a delay, we switch to the target layer
          default: ['switchKeyboardLayer', element.getAttribute('data-layer')],
        }
      );
    } else {
      // This is a simple layer switch
      attachButtonHandlers(
        element,
        (command) => keyboard.executeCommand(command),
        {
          default: ['switchKeyboardLayer', element.getAttribute('data-layer')],
        }
      );
    }
  }

  const layerElements = result.querySelectorAll('.MLK__layer');
  console.assert(layerElements.length > 0, 'No virtual keyboards available');

  // Prevent a click on a virtual keyboard to focus it (and blur the mathfield)
  for (const x of layerElements)
    x.addEventListener('mousedown', (evt) => evt.preventDefault());

  // Select the first keyboard as the initial one.
  layerElements[0]?.classList.add('is-visible');

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
    markup.push(
      `<div tabindex="-1" class="MLK__layer" data-layer="${layer.id}">`
    );
    markup.push(`<div class='MLK__toolbar' role='toolbar'>`);
    markup.push(makeLayoutsToolbar(keyboard, index));
    // If there are no keycap with editing commands, add an edit toolbar
    if (layout.displayEditToolbar)
      markup.push(`<div class="ML__edit-toolbar right"></div>`);
    markup.push(`</div>`);

    // A layer can contain 'shortcuts' (i.e. <row> tags) that need to
    // be expanded
    markup.push(
      expandLayerMarkup(
        keyboard,
        markupLayer(layer, {
          displayShiftedKeycaps: layout.displayShiftedKeycaps,
        })
      )
    );
    markup.push('</div>');
  }

  return markup.join('');
}

function markupLayer(
  layer: Partial<VirtualKeyboardLayer>,
  options: {
    displayShiftedKeycaps?: boolean;
  }
): string {
  if (typeof layer === 'string') return layer;

  //
  // Process JSON layer to markup based layer.
  //

  let layerMarkup = '';
  if (typeof layer.styles === 'string')
    layerMarkup += `<style>${layer.styles}</style>`;
  else if (typeof layer.styles === 'object')
    layerMarkup += `<style>${jsonToCss(layer.styles)}</style>`;

  if (layer.backdrop) layerMarkup += `<div class='${layer.backdrop}'>`;

  if (layer.container) layerMarkup += `<div class='${layer.container}'>`;

  if (layer.rows) {
    layerMarkup += `<div class='MLK__rows'>`;
    for (const row of layer.rows) {
      layerMarkup += `<ul>`;
      for (let keycap of row) {
        layerMarkup += `<li`;

        keycap = expandKeycap(keycap, options);

        let cls = keycap.class ?? '';
        if (keycap.layer && !/layer-switch/.test(cls)) cls += ' layer-switch';

        if (cls && !/separator/.test(cls)) cls += ' MLK__keycap';

        // If there's no explicit width class, and a width is specified,
        // add a class
        if (!/\bw[0-9]+\b/.test(cls) && keycap.width) {
          cls +=
            { 0: ' w0', 0.5: ' w5', 1.5: ' w15', 2.0: ' w20', 5.0: ' w50' }[
              keycap.width
            ] ?? '';
        }
        layerMarkup += ` class="${cls || 'MLK__keycap'}"`;

        if (keycap.key) layerMarkup += ` data-key="${keycap.key}"`;

        if (keycap.tooltip) layerMarkup += ` data-tooltip="${keycap.tooltip}"`;

        if (keycap.command) {
          if (typeof keycap.command === 'string')
            layerMarkup += ` data-command='"${keycap.command}"'`;
          else {
            layerMarkup += ` data-command='`;
            layerMarkup += JSON.stringify(keycap.command);
            layerMarkup += `'`;
          }
        }

        if (keycap.insert) layerMarkup += ` data-insert="${keycap.insert}"`;

        if (keycap.latex) layerMarkup += ` data-latex="${keycap.latex}"`;

        if (keycap.aside) layerMarkup += ` data-aside="${keycap.aside}"`;

        if (keycap.variants) {
          if (typeof keycap.variants !== 'string') {
            const keysetId =
              Date.now().toString(36).slice(-2) +
              Math.floor(Math.random() * 0x186a0).toString(36);

            setVariants(keysetId, keycap.variants);
            layerMarkup += ` data-variants="${keysetId}"`;
          } else layerMarkup += ` data-variants="${keycap.variants}"`;
        }

        if (keycap.shifted) layerMarkup += ` data-shifted="${keycap.shifted}"`;

        if (keycap.shiftedCommand)
          layerMarkup += ` data-shifted-command="${keycap.shiftedCommand}"`;

        if (keycap.layer) layerMarkup += ` data-layer="${keycap.layer}"`;

        layerMarkup += `>${
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          keycap.label || latexToMarkup(keycap.latex ?? '')
        }</li>`;
      }

      layerMarkup += `</ul>`;
    }

    layerMarkup += `</div>`;
  } else if (layer.markup) layerMarkup += layer.markup;

  if (layer.container) layerMarkup += '</div>';

  if (layer.backdrop) layerMarkup += '</div>';

  return layerMarkup;
}

const KEYCAP_SHORTCUTS: Record<string, Partial<VirtualKeyboardKeycap>> = {
  '[left]': {
    class: 'action',
    command: ['performWithFeedback', 'moveToPreviousChar'],
    shifted:
      '<svg class=svg-glyph><use xlink:href=#svg-angle-double-left /></svg>',
    shiftedCommand: ['performWithFeedback', 'extendToPreviousChar'],
    label: '<svg class=svg-glyph><use xlink:href=#svg-arrow-left /></svg>',
  },
  '[right]': {
    class: 'action',
    command: ['performWithFeedback', 'moveToNextChar'],
    shifted:
      '<svg class=svg-glyph><use xlink:href=#svg-angle-double-right /></svg>',
    shiftedCommand: ['performWithFeedback', 'extendToNextChar'],
    label: '<svg class=svg-glyph><use xlink:href=#svg-arrow-right /></svg>',
  },
  '[return]': {
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
    class: 'big-op',
    variants: '.',
    command: 'insertDecimalSeparator',
  },
  '[+]': { class: 'big-op', variants: '+', latex: '+', label: '+' },
  '[-]': { class: 'big-op', variants: '-', latex: '-', label: '&#x2212;' },
  '[/]': {
    class: 'big-op',
    variants: '/',
    latex: '\\frac{#@}{#?}',
    label: '&divide;',
  },
  '[*]': {
    class: 'big-op',
    variants: '*',
    latex: '\\times',
    label: '&times;',
  },
  '[=]': { class: 'big-op', variants: '=', latex: '=', label: '=' },
  '[backspace]': {
    class: 'action font-glyph bottom right',
    width: 1.5,
    command: ['performWithFeedback', 'deleteBackward'],
    label: '<svg class=svg-glyph><use xlink:href=#svg-delete-backward /></svg>',
    shifted:
      '<span class=warning><svg class=svg-glyph><use xlink:href=#svg-trash /></svg></span',
    shiftedCommand: 'deleteAll',
    variants: 'delete',
  },
  '[undo]': {
    class: 'ghost',
    command: 'undo',
    label: '<svg class=svg-glyph><use xlink:href=#svg-undo /></svg>',
    tooltip: l10n('tooltip.undo'),
  },
  '[redo]': {
    class: 'ghost',
    command: 'redo',
    label: '<svg class=svg-glyph><use xlink:href=#svg-redo /></svg>',
  },

  '[(]': { variants: '(', latex: '(' },
  '[)]': { variants: ')', latex: ')' },
  '[0]': { variants: '0', latex: '0', label: '0' },
  '[1]': { variants: '1', latex: '1', label: '1' },
  '[2]': { variants: '2', latex: '2', label: '2' },
  '[3]': { variants: '3', latex: '3', label: '3' },
  '[4]': { variants: '4', latex: '4', label: '4' },
  '[5]': { variants: '5', latex: '5', label: '5' },
  '[6]': { variants: '6', latex: '6', label: '6' },
  '[7]': { variants: '7', latex: '7', label: '7' },
  '[8]': { variants: '8', latex: '8', label: '8' },
  '[9]': { variants: '9', latex: '9', label: '9' },
  '[separator-5]': { class: 'separator', width: 0.5 },
  '[separator]': { class: 'separator' },
  '[separator-10]': { class: 'separator' },
  '[separator-15]': { class: 'separator', width: 1.5 },
  '[separator-20]': { class: 'separator', width: 2.0 },
  '[separator-50]': { class: 'separator', width: 5.0 },
  '[shift]': {
    class: 'shift modifier font-glyph bottom left layer-switch',
    width: 1.5,
    // layer: attributes['shift-layer'],
    label: '<svg class=svg-glyph><use xlink:href=#svg-shift /></svg>',
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

function expandKeycap(
  keycap: string | Partial<VirtualKeyboardKeycap>,
  options: {
    displayShiftedKeycaps?: boolean;
  } = {}
): Partial<VirtualKeyboardKeycap> {
  if (typeof keycap === 'string') {
    if (!KEYCAP_SHORTCUTS[keycap]) return { latex: keycap };
    keycap = { label: keycap };
  }

  if ('label' in keycap && keycap.label && KEYCAP_SHORTCUTS[keycap.label]) {
    const shortcut = {
      ...KEYCAP_SHORTCUTS[keycap.label],
      ...keycap,
      label: KEYCAP_SHORTCUTS[keycap.label].label,
    };
    if (shortcut.command === 'insertDecimalSeparator')
      shortcut.label = MathfieldElement.decimalSeparator ?? '.';
    // If there's no shift modifier in this layout, don't apply
    // shifted label or commands to the keycap
    if (!options.displayShiftedKeycaps) {
      delete shortcut.shifted;
      delete shortcut.shiftedCommand;
    }
    return shortcut;
  }

  return keycap;
}
