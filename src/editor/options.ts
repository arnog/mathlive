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

import { defaultSpeakHook } from './speech';
import { defaultReadAloudHook } from './speech-read-aloud';
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

      case 'locale':
        if (updates.locale === 'auto')
          result.locale = navigator.language.slice(0, 5);
        else result.locale = updates.locale!;
        l10n.locale = result.locale;
        break;

      case 'strings':
        l10n.merge(updates.strings!);
        result.strings = l10n.strings;
        break;

      case 'virtualKeyboardPolicy':
        const keyboardPolicy =
          updates.virtualKeyboardPolicy!.toLowerCase() as VirtualKeyboardPolicy;
        result.virtualKeyboardPolicy = keyboardPolicy;

        break;

      case 'letterShapeStyle':
        if (updates.letterShapeStyle === 'auto') {
          // Letter shape style (locale dependent)
          if (l10n.locale.startsWith('fr')) result.letterShapeStyle = 'french';
          else result.letterShapeStyle = 'tex';
        } else result.letterShapeStyle = updates.letterShapeStyle!;

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

export const DEFAULT_KEYBOARD_TOGGLE_GLYPH = `<span style="width: 21px; margin-top: 4px;"><svg style="width: 21px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M528 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm16 336c0 8.823-7.177 16-16 16H48c-8.823 0-16-7.177-16-16V112c0-8.823 7.177-16 16-16h480c8.823 0 16 7.177 16 16v288zM168 268v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-336 80v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm384 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zM120 188v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-96 152v-8c0-6.627-5.373-12-12-12H180c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h216c6.627 0 12-5.373 12-12z"/></svg></span>`;

export function getDefault(): Required<MathfieldOptionsPrivate> {
  return {
    readOnly: false,

    defaultMode: 'math',
    macros: getMacros(),
    registers: {},
    colorMap: defaultColorMap,
    backgroundColorMap: defaultBackgroundColorMap,
    horizontalSpacingScale: 1,
    letterShapeStyle: l10n.locale.startsWith('fr') ? 'french' : 'tex',

    smartMode: false,
    smartFence: true,
    smartSuperscript: true,
    scriptDepth: [Infinity, Infinity],
    removeExtraneousParentheses: true,
    mathModeSpace: '',
    decimalSeparator: '.',
    fractionNavigationOrder: 'numerator-denominator',
    placeholderSymbol: '▢',
    enablePopover: true,
    promptMode: false,

    locale: l10n.locale,
    strings: l10n.strings,

    keybindings: DEFAULT_KEYBINDINGS,

    inlineShortcuts: INLINE_SHORTCUTS,
    inlineShortcutTimeout: 0,

    virtualKeyboardPolicy: 'auto',

    virtualKeyboardTargetOrigin: globalThis.window?.origin,
    originValidator: 'same-origin',

    textToSpeechRules: 'mathlive',
    textToSpeechMarkup: '', // No markup
    textToSpeechRulesOptions: {},
    speechEngine: 'local',
    speechEngineVoice: 'Joanna',
    speechEngineRate: '100%',
    speakHook: defaultSpeakHook,
    readAloudHook: defaultReadAloudHook,

    onInlineShortcut: () => '',
    onExport: defaultExportHook,
    value: '',
  };
}

export function effectiveMode(options: MathfieldOptions): 'math' | 'text' {
  if (options.defaultMode === 'inline-math') return 'math';
  return options.defaultMode;
}
