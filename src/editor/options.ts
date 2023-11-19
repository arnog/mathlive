import type { MathfieldOptions } from '../public/options';
import { VirtualKeyboardPolicy } from '../public/mathfield-element';

import { isArray } from '../common/types';

import { l10n, localize } from '../core/l10n';
import { defaultBackgroundColorMap, defaultColorMap } from '../core/color';

import { normalizeMacroDictionary } from '../core-definitions/definitions-utils';

import { ModeEditor, defaultExportHook } from '../editor-mathfield/mode-editor';

import { INLINE_SHORTCUTS } from './shortcuts-definitions';
import { DEFAULT_KEYBINDINGS } from './keybindings-definitions';
import { VirtualKeyboard } from '../virtual-keyboard/global';
import { MenuItem } from 'ui/menu/types';
import { _Mathfield } from './mathfield';
import { convertLatexToMarkup } from 'public/mathlive-ssr';

/** @internal */
export type _MathfieldOptions = MathfieldOptions & {
  value: string;
};

export function update(
  updates: Partial<_MathfieldOptions>
): Partial<_MathfieldOptions> {
  const result: Partial<_MathfieldOptions> = {};
  for (const key of Object.keys(updates)) {
    switch (key) {
      case 'scriptDepth':
        const scriptDepth = updates.scriptDepth;
        if (isArray<number>(scriptDepth))
          result.scriptDepth = [scriptDepth[0], scriptDepth[1]];
        else if (typeof scriptDepth === 'number')
          result.scriptDepth = [scriptDepth, scriptDepth];
        else if (typeof scriptDepth === 'string') {
          const [from, to] = (scriptDepth as string)
            .split(',')
            .map((x) => parseInt(x.trim()));
          result.scriptDepth = [from, to];
        } else throw new TypeError('Unexpected value for scriptDepth');

        break;

      case 'mathVirtualKeyboardPolicy':
        let keyboardPolicy =
          updates.mathVirtualKeyboardPolicy!.toLowerCase() as VirtualKeyboardPolicy;

        // The 'sandboxed' policy requires the use of a VirtualKeyboard
        // (not a proxy) while inside an iframe.
        // Redefine the `mathVirtualKeyboard` getter in the current browsing context
        if (keyboardPolicy === 'sandboxed') {
          if (window !== window['top']) {
            const kbd = VirtualKeyboard.singleton;
            Object.defineProperty(window, 'mathVirtualKeyboard', {
              get: () => kbd,
            });
          }
          keyboardPolicy = 'manual';
        }

        result.mathVirtualKeyboardPolicy = keyboardPolicy;
        break;

      case 'letterShapeStyle':
        if (updates.letterShapeStyle === 'auto') {
          // Letter shape style (locale dependent)
          if (l10n.locale.startsWith('fr')) result.letterShapeStyle = 'french';
          else result.letterShapeStyle = 'tex';
        } else result.letterShapeStyle = updates.letterShapeStyle!;

        break;

      case 'defaultMode':
        if (
          !['text', 'math', 'inline-math'].includes(
            updates.defaultMode as string
          )
        ) {
          console.error(
            `MathLive {{SDK_VERSION}}:  valid values for defaultMode are "text", "math" or "inline-math"`
          );
          result.defaultMode = 'math';
        } else result.defaultMode = updates.defaultMode!;
        break;

      case 'macros':
        result.macros = normalizeMacroDictionary(updates.macros!);
        break;

      default:
        if (isArray(updates[key])) result[key] = [...updates[key]];
        else if (
          typeof updates[key] === 'object' &&
          !(updates[key] instanceof Element) &&
          key !== 'computeEngine'
        )
          result[key] = { ...updates[key] };
        else result[key] = updates[key];
    }
  }

  return result;
}

export function get(
  config: Required<_MathfieldOptions>,
  keys?: keyof _MathfieldOptions | string[]
): any | Partial<_MathfieldOptions> {
  let resolvedKeys: string[];
  if (typeof keys === 'string') resolvedKeys = [keys];
  else if (keys === undefined) resolvedKeys = Object.keys(config);
  else resolvedKeys = keys;

  const result: Partial<_MathfieldOptions> = {};
  for (const x of resolvedKeys) {
    if (config[x] === null) result[x] = null;
    else if (isArray(config[x])) result[x] = [...config[x]];
    else if (
      typeof config[x] === 'object' &&
      !(config[x] instanceof Element) &&
      x !== 'computeEngine'
    ) {
      // Some object literal, make a copy (for keypressSound, macros, etc...)
      result[x] = { ...config[x] };
    } else result[x] = config[x];
  }
  // If requested a single key, return its value
  if (typeof keys === 'string') return result[keys];

  return result;
}

export function getDefault(): Required<_MathfieldOptions> {
  return {
    readOnly: false,

    defaultMode: 'math',
    macros: {},
    registers: {},
    colorMap: defaultColorMap,
    backgroundColorMap: defaultBackgroundColorMap,
    letterShapeStyle: l10n.locale.startsWith('fr') ? 'french' : 'tex',
    minFontScale: 0,

    smartMode: false,
    smartFence: true,
    smartSuperscript: true,
    scriptDepth: [Infinity, Infinity],
    removeExtraneousParentheses: true,
    mathModeSpace: '',
    placeholderSymbol: '▢',
    popoverPolicy: 'auto',
    environmentPopoverPolicy: 'auto',

    keybindings: DEFAULT_KEYBINDINGS,

    inlineShortcuts: INLINE_SHORTCUTS,
    inlineShortcutTimeout: 0,

    mathVirtualKeyboardPolicy: 'auto',

    virtualKeyboardTargetOrigin: window?.origin,
    originValidator: 'none',

    onInlineShortcut: () => '',
    onScrollIntoView: null,
    onExport: defaultExportHook,
    value: '',
  };
}

export function effectiveMode(options: MathfieldOptions): 'math' | 'text' {
  if (options.defaultMode === 'inline-math') return 'math';
  return options.defaultMode;
}

function getSelection(mf: _Mathfield): string {
  const model = mf.model;
  return model.getValue(model.selection, 'latex');
}

function getVariantSubmenu(mf: _Mathfield): MenuItem[] {
  return [
    {
      label: () => convertLatexToMarkup(`\\mathbb{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\mathbb{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\mathfrak{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () =>
        mf.insert('\\mathfrak{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\mathcal{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\mathcal{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\mathrm{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\mathrm{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\mathbf{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\mathbf{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\vec{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\vec{#@}', { selectionMode: 'item' }),
    },
    {
      label: () =>
        convertLatexToMarkup(`\\overrightarrow{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overrightarrow{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\overleftarrow{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overleftarrow{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\dot{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\dot{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\ddot{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\ddot{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\bar{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\bar{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\overline{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overline{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\overgroup{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overgroup{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\overbrace{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overbrace{#@}', { selectionMode: 'item' }),
    },
  ];
}

export function getDefaultMenuItems(mf: _Mathfield): MenuItem[] {
  return [
    // // {
    // //   label: 'Show Virtual Keyboard',
    // //   onMenuSelect: () => window.mathVirtualKeyboard.show({ animate: true }),
    // //   visible: () => window.mathVirtualKeyboard.visible === false,
    // // },
    // // {
    // //   label: 'Hide Virtual Keyboard',
    // //   onMenuSelect: () => window.mathVirtualKeyboard.hide({ animate: true }),
    // //   visible: () => window.mathVirtualKeyboard.visible === true,
    // // },
    // {
    //   type: 'divider',
    // },
    {
      label: 'Switch to Math Mode',
      onMenuSelect: () => mf.executeCommand(['switchMode', 'math']),
      visible: () => mf.model.mode === 'text',
    },
    {
      type: 'divider',
    },
    {
      label: localize('menu.array.add row above'),
      onMenuSelect: () => mf.executeCommand('addRowBefore'),
      visible: () => inMatrix(mf),
    },
    {
      label: localize('menu.array.add row below'),
      onMenuSelect: () => mf.executeCommand('addRowAfter'),
      visible: () => inMatrix(mf),
    },
    {
      label: localize('menu.array.add column before'),
      onMenuSelect: () => mf.executeCommand('addColumnBefore'),
      visible: () => inMatrix(mf),
      enabled: () => {
        const array = mf.model.parentEnvironment;
        if (!array) return false;
        const [rows, _cols] = shape(mf);
        return rows < array.maxColumns;
      },
    },
    {
      label: localize('menu.array.add column after'),
      onMenuSelect: () => mf.executeCommand('addColumnAfter'),
      visible: () => inMatrix(mf),
    },
    {
      label: localize('menu.array.delete row'),
      onMenuSelect: () => mf.executeCommand('removeRow'),
      visible: () => inMatrix(mf),
    },
    {
      label: localize('menu.array.delete column'),
      onMenuSelect: () => mf.executeCommand('removeColumn'),
      visible: () => inMatrix(mf),
    },

    {
      label: 'Insert Matrix',
      containerClass: 'menu-container-insert-matrix',
      submenu: [
        {
          label: '(⋱)',
          onMenuSelect: () => {
            mf.executeCommand([
              'insert',
              '\\begin{pmatrix}#@ & #? \\\\ #? & #? \\end{pmatrix}',
            ]);
          },
        },
        {
          label: '[⋱]',
          onMenuSelect: () => {
            mf.executeCommand([
              'insert',
              '\\begin{bmatrix}#@ & #? \\\\ #? & #?\\end{bmatrix}',
            ]);
          },
        },
        {
          label: '{⋱}',
          onMenuSelect: () => {
            mf.executeCommand([
              'insert',
              '\\begin{Bmatrix}#@ & #? \\\\ #? & #?\\end{Bmatrix}',
            ]);
          },
        },
      ],
    },
    {
      label: 'Insert Text',
      onMenuSelect: () => mf.executeCommand(['switchMode', 'text']),
      visible: () => mf.model.mode === 'math',
    },

    {
      type: 'divider',
    },
    {
      label: 'Variant',
      containerClass: 'menu-container-variant',
      submenu: getVariantSubmenu(mf),
    },
    {
      type: 'divider',
    },
    {
      label: 'Cut',
      onMenuSelect: () => mf.executeCommand('cutToClipboard'),
      visible: () => !mf.options.readOnly,
    },
    // {
    //   label: 'Copy',
    //   onMenuSelect: () => mf.executeCommand('copyToClipboard'),
    // },
    {
      label: 'Copy',
      submenu: [
        {
          label: 'Copy LaTeX',
          onMenuSelect: () => ModeEditor.copyToClipboard(mf, 'latex'),
        },
        {
          label: 'Copy ASCII Math',
          onMenuSelect: () => ModeEditor.copyToClipboard(mf, 'ascii-math'),
        },
        {
          label: 'Copy MathML',
          onMenuSelect: () => ModeEditor.copyToClipboard(mf, 'math-ml'),
        },
      ],
    },

    {
      label: 'Paste',
      onMenuSelect: () => mf.executeCommand('pasteFromClipboard'),
      visible: () => !mf.options.readOnly,
    },
    {
      label: 'Select All',
      onMenuSelect: () => mf.executeCommand('selectAll'),
    },
  ];
}

function inMatrix(mf: _Mathfield): boolean {
  return !!mf.model.parentEnvironment?.array;
}

function shape(mf: _Mathfield): [number, number] {
  const array = mf.model.parentEnvironment?.array;
  if (!array) return [0, 0];

  return [
    array.length,
    array.reduce((acc, col) => Math.max(acc, col.length), 0),
  ];
}
