import type { MathfieldOptions } from '../public/options';
import { VirtualKeyboardPolicy } from '../public/mathfield-element';

import { isArray } from '../common/types';

import { l10n } from '../core/l10n';
import { defaultBackgroundColorMap, defaultColorMap } from '../core/color';

import {
  getMacros,
  normalizeMacroDictionary,
} from '../core-definitions/definitions';

import { defaultExportHook } from '../editor-mathfield/mode-editor';

import { INLINE_SHORTCUTS } from './shortcuts-definitions';
import { DEFAULT_KEYBINDINGS } from './keybindings-definitions';

/** @internal */
export type MathfieldOptionsPrivate = MathfieldOptions & {
  value: string;
};

export function update(
  current: Required<MathfieldOptionsPrivate>,
  updates: Partial<MathfieldOptionsPrivate>
): Required<MathfieldOptionsPrivate> {
  const result: Required<MathfieldOptionsPrivate> = get(
    current,
    Object.keys(current)
  ) as Required<MathfieldOptionsPrivate>;
  for (const key of Object.keys(updates)) {
    switch (key) {
      case 'scriptDepth':
        if (isArray<number>(updates.scriptDepth))
          result.scriptDepth = [updates.scriptDepth[0], updates.scriptDepth[1]];
        else if (typeof updates.scriptDepth === 'number')
          result.scriptDepth = [updates.scriptDepth, updates.scriptDepth];
        else throw new TypeError('Unexpected value for scriptDepth');

        break;

      case 'mathVirtualKeyboardPolicy':
        const keyboardPolicy =
          updates.mathVirtualKeyboardPolicy!.toLowerCase() as VirtualKeyboardPolicy;
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
            'MathLive: valid valeus for defaultMode are "text", "math" or "inline-math"'
          );
          result.defaultMode = 'math';
        } else result.defaultMode = updates.defaultMode!;
        break;

      case 'macros':
        result.macros = normalizeMacroDictionary(updates.macros!);
        break;

      default:
        if (isArray(updates[key])) result[key] = [...updates[key]];
        else if (typeof updates[key] === 'object')
          result[key] = { ...updates[key] };
        else result[key] = updates[key];
    }
  }

  return result;
}

export function get(
  config: Required<MathfieldOptionsPrivate>,
  keys?: keyof MathfieldOptionsPrivate | string[]
): any | Partial<MathfieldOptionsPrivate> {
  let resolvedKeys: string[];
  if (typeof keys === 'string') resolvedKeys = [keys];
  else if (keys === undefined) resolvedKeys = Object.keys(config);
  else resolvedKeys = keys;

  const result: Partial<MathfieldOptionsPrivate> = {};
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

export function getDefault(): Required<MathfieldOptionsPrivate> {
  return {
    readOnly: false,

    defaultMode: 'math',
    macros: getMacros(),
    registers: {},
    colorMap: defaultColorMap,
    backgroundColorMap: defaultBackgroundColorMap,
    letterShapeStyle: l10n.locale.startsWith('fr') ? 'french' : 'tex',

    smartMode: false,
    smartFence: true,
    smartSuperscript: true,
    scriptDepth: [Infinity, Infinity],
    removeExtraneousParentheses: true,
    mathModeSpace: '',
    placeholderSymbol: '▢',
    popoverPolicy: 'auto',

    keybindings: DEFAULT_KEYBINDINGS,

    inlineShortcuts: INLINE_SHORTCUTS,
    inlineShortcutTimeout: 0,

    mathVirtualKeyboardPolicy: 'auto',

    virtualKeyboardTargetOrigin: globalThis.window?.origin,
    originValidator: 'same-origin',

    onInlineShortcut: () => '',
    onExport: defaultExportHook,
    value: '',
  };
}

export function effectiveMode(options: MathfieldOptions): 'math' | 'text' {
  if (options.defaultMode === 'inline-math') return 'math';
  return options.defaultMode;
}
