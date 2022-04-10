import type { MathfieldOptions } from '../public/options';

import { isArray } from '../common/types';

import type { Atom } from '../core/atom';
import {
  getMacros,
  normalizeMacroDictionary,
} from '../core-definitions/definitions';

import type { MathfieldPrivate } from '../editor-mathfield/mathfield-private';
import { l10n } from './l10n';
import { defaultAnnounceHook } from './a11y';
import { DEFAULT_KEYBINDINGS } from './keybindings-definitions';
import { resolveRelativeUrl } from '../common/script-url';
import { isBrowser, isTouchCapable } from '../common/capabilities';
import { getDefaultRegisters } from '../core/registers';
import { defaultSpeakHook } from './speech';
import { defaultReadAloudHook } from './speech-read-aloud';
import { defaultBackgroundColorMap, defaultColorMap } from '../core/color';
import { defaultExportHook } from '../editor-mathfield/mode-editor';
import { INLINE_SHORTCUTS } from './shortcuts-definitions';

const AUDIO_FEEDBACK_VOLUME = 0.5; // From 0.0 to 1.0

const NO_OP_LISTENER = (): void => {};

/** @internal */
export type MathfieldOptionsPrivate = MathfieldOptions & {
  onAnnounce: (
    target: MathfieldPrivate,
    command: string, // Verb
    previousPosition: number | undefined,
    atoms: Atom[] // Object of the command
  ) => void; // @revisit 1.0: rename announceHook,
  value: string;
};

function loadSound(
  soundDirectory: string,
  sound?: string | HTMLAudioElement | null
): HTMLAudioElement | null {
  if (
    sound === null ||
    sound === undefined ||
    sound === 'none' ||
    sound === 'null'
  ) {
    return null;
  }
  if (sound instanceof HTMLAudioElement) {
    sound.load();
    return sound;
  }

  sound = sound.trim();
  if (sound.length === 0) return null;

  const url = resolveRelativeUrl(
    (soundDirectory === undefined || soundDirectory.length === 0
      ? './sounds'
      : soundDirectory) +
      '/' +
      sound
  ).toString();

  const result: HTMLAudioElement = new Audio();
  result.src = url;
  // Note that on iOS the volume property is read-only
  result.volume = AUDIO_FEEDBACK_VOLUME;
  result.load();
  return result;
}

function unloadSound(
  sound: string | HTMLAudioElement | Record<string, HTMLAudioElement | string>
): void {
  if (sound instanceof HTMLAudioElement) {
    sound.pause();
    sound.removeAttribute('src');
    // Important: to properly unload call `load()` after removing the
    // `src` attribute
    sound.load();
  }
}

export function update(
  current: Required<MathfieldOptionsPrivate>,
  updates: Partial<MathfieldOptionsPrivate>
): Required<MathfieldOptionsPrivate> {
  const soundsDirectory =
    updates.soundsDirectory ?? current.soundsDirectory ?? './sounds';
  const result: Required<MathfieldOptionsPrivate> = get(
    current,
    Object.keys(current)
  ) as Required<MathfieldOptionsPrivate>;
  for (const key of Object.keys(updates)) {
    switch (key) {
      case 'scriptDepth':
        if (isArray<number>(updates.scriptDepth)) {
          result.scriptDepth = [updates.scriptDepth[0], updates.scriptDepth[1]];
        } else if (typeof updates.scriptDepth === 'number') {
          result.scriptDepth = [updates.scriptDepth, updates.scriptDepth];
        } else {
          throw new TypeError('Unexpected value for scriptDepth');
        }

        break;

      case 'locale':
        result.locale =
          updates.locale === 'auto'
            ? (isBrowser() ? navigator.language.slice(0, 5) : null) ?? 'en'
            : updates.locale!;
        l10n.locale = result.locale;
        break;

      case 'strings':
        l10n.merge(updates.strings!);
        result.strings = l10n.strings;
        break;

      case 'virtualKeyboardLayout':
        result.virtualKeyboardLayout = updates.virtualKeyboardLayout!;
        break;

      case 'virtualKeyboardMode':
        if (updates.virtualKeyboardMode === 'auto') {
          result.virtualKeyboardMode = isTouchCapable() ? 'onfocus' : 'off';
        } else {
          result.virtualKeyboardMode = updates.virtualKeyboardMode!;
        }

        break;

      case 'customVirtualKeyboardLayers':
        result.customVirtualKeyboardLayers = {
          ...result.customVirtualKeyboardLayers,
          ...updates.customVirtualKeyboardLayers,
        };
        break;

      case 'customVirtualKeyboards':
        result.customVirtualKeyboards = {
          ...result.customVirtualKeyboards,
          ...updates.customVirtualKeyboards,
        };
        break;

      case 'letterShapeStyle':
        if (updates.letterShapeStyle === 'auto') {
          // Letter shape style (locale dependent)
          if (l10n.locale.startsWith('fr')) {
            result.letterShapeStyle = 'french';
          } else {
            result.letterShapeStyle = 'tex';
          }
        } else {
          result.letterShapeStyle = updates.letterShapeStyle!;
        }

        break;

      case 'plonkSound':
        unloadSound(result.plonkSound!);
        result.plonkSound = loadSound(soundsDirectory, updates.plonkSound!);
        break;

      case 'keypressSound':
        if (
          typeof result.keypressSound === 'object' &&
          result.keypressSound !== null &&
          'default' in result.keypressSound
        ) {
          unloadSound(result.keypressSound.default!);
          unloadSound(result.keypressSound.delete!);
          unloadSound(result.keypressSound.return!);
          unloadSound(result.keypressSound.spacebar!);
        }
        if (updates.keypressSound === null) {
          result.keypressSound = {
            default: null,
            delete: null,
            return: null,
            spacebar: null,
          };
        } else if (typeof updates.keypressSound === 'string') {
          const sound = loadSound(soundsDirectory, updates.keypressSound);
          result.keypressSound = {
            delete: sound,
            return: sound,
            spacebar: sound,
            default: sound,
          };
        } else if (updates.keypressSound instanceof HTMLAudioElement) {
          result.keypressSound = {
            delete: updates.keypressSound,
            return: updates.keypressSound,
            spacebar: updates.keypressSound,
            default: updates.keypressSound,
          };
        } else if (
          typeof updates.keypressSound === 'object' &&
          'default' in updates.keypressSound!
        ) {
          result.keypressSound = { ...updates.keypressSound };
          result.keypressSound!.default = loadSound(
            soundsDirectory,
            result.keypressSound!.default
          );
          result.keypressSound!.delete =
            loadSound(soundsDirectory, result.keypressSound!.delete) ??
            updates.keypressSound!.default!;
          result.keypressSound!.return =
            loadSound(soundsDirectory, result.keypressSound!.return) ??
            updates.keypressSound!.default!;
          result.keypressSound!.spacebar =
            loadSound(soundsDirectory, result.keypressSound!.spacebar) ??
            updates.keypressSound!.default!;
        }

        break;
      case 'virtualKeyboardContainer':
        result.virtualKeyboardContainer = updates.virtualKeyboardContainer!;
        break;

      case 'macros':
        result.macros = normalizeMacroDictionary(updates.macros!);
        break;

      case 'onBlur':
      case 'onFocus':
      case 'onContentWillChange':
      case 'onContentDidChange':
      case 'onSelectionWillChange':
      case 'onSelectionDidChange':
      case 'onUndoStateWillChange':
      case 'onUndoStateDidChange':
      case 'onModeChange':
      case 'onCommit':
      case 'onReadAloudStatus':
      case 'onError':
        if (updates[key] === null) {
          result[key] = NO_OP_LISTENER;
        } else if (typeof updates[key] !== 'function') {
          throw new TypeError(key + ' must be a function or null');
        }

        result[key] = updates[key] as any;
        break;
      default:
        if (isArray(updates[key])) {
          result[key] = [...updates[key]];
        } else if (typeof updates[key] === 'object') {
          result[key] = { ...updates[key] };
        } else {
          result[key] = updates[key];
        }
    }
  }

  return result;
}

export function get(
  config: Required<MathfieldOptionsPrivate>,
  keys?: keyof MathfieldOptionsPrivate | string[]
): any | Partial<MathfieldOptionsPrivate> {
  let resolvedKeys: string[];
  if (typeof keys === 'string') {
    resolvedKeys = [keys];
  } else if (keys === undefined) {
    resolvedKeys = Object.keys(config);
  } else {
    resolvedKeys = keys;
  }

  const result: Partial<MathfieldOptionsPrivate> = {};
  for (const x of resolvedKeys) {
    if (isArray(config[x])) {
      result[x] = [...config[x]];
    } else if (config[x] instanceof HTMLElement) {
      //For 'plonksound', it's a AudioElement
      result[x] = config[x];
    } else if (config[x] === null) {
      result[x] = null;
    } else if (typeof config[x] === 'object') {
      // Some object literal, make a copy (for keypressSound)
      result[x] = { ...config[x] };
    } else {
      result[x] = config[x];
    }
  }
  // If requested a single key, return its value
  if (typeof keys === 'string') {
    return result[keys];
  }

  return result;
}

export const DEFAULT_KEYBOARD_TOGGLE_GLYPH = `<span style="width: 21px; margin-top: 4px;"><svg style="width: 21px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M528 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm16 336c0 8.823-7.177 16-16 16H48c-8.823 0-16-7.177-16-16V112c0-8.823 7.177-16 16-16h480c8.823 0 16 7.177 16 16v288zM168 268v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-336 80v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm384 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zM120 188v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-96 152v-8c0-6.627-5.373-12-12-12H180c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h216c6.627 0 12-5.373 12-12z"/></svg></span>`;

export function getDefault(): Required<MathfieldOptionsPrivate> {
  return {
    readOnly: false,
    createHTML: (s: string): any => s,
    fontsDirectory: './fonts',
    soundsDirectory: './sounds',

    defaultMode: 'math',
    macros: getMacros(),
    registers: { ...getDefaultRegisters() },
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

    locale: l10n.locale ?? 'en',
    strings: l10n.strings,

    keybindings: DEFAULT_KEYBINDINGS,

    inlineShortcuts: INLINE_SHORTCUTS,
    inlineShortcutTimeout: 0,

    virtualKeyboardToggleGlyph: DEFAULT_KEYBOARD_TOGGLE_GLYPH,
    virtualKeyboardMode: 'auto',
    virtualKeyboards: 'all',
    virtualKeyboardLayout: 'auto',
    customVirtualKeyboardLayers: {},
    customVirtualKeyboards: {},
    virtualKeyboardTheme:
      isBrowser() && /android|cros/i.test(navigator.userAgent)
        ? 'material'
        : 'apple',
    keypressVibration: true,
    keypressSound: null,
    plonkSound: null,
    virtualKeyboardToolbar: 'default',
    virtualKeyboardContainer: globalThis.document?.body ?? null,

    useSharedVirtualKeyboard: false,
    sharedVirtualKeyboardTargetOrigin: globalThis.window?.origin,
    originValidator: 'same-origin',

    textToSpeechRules: 'mathlive',
    textToSpeechMarkup: '', // No markup
    textToSpeechRulesOptions: {},
    speechEngine: 'local',
    speechEngineVoice: 'Joanna',
    speechEngineRate: '100%',
    speakHook: defaultSpeakHook,
    readAloudHook: defaultReadAloudHook,

    onAnnounce: defaultAnnounceHook,
    onKeystroke: (): boolean => true,
    onMoveOutOf: (): boolean => true,
    onTabOutOf: (): boolean => true,
    onPlaceholderDidChange: () => {},
    onBlur: NO_OP_LISTENER,
    onFocus: NO_OP_LISTENER,
    onContentWillChange: NO_OP_LISTENER,
    onContentDidChange: NO_OP_LISTENER,
    onSelectionWillChange: NO_OP_LISTENER,
    onSelectionDidChange: NO_OP_LISTENER,
    onUndoStateWillChange: NO_OP_LISTENER,
    onUndoStateDidChange: NO_OP_LISTENER,
    onModeChange: NO_OP_LISTENER,
    onReadAloudStatus: NO_OP_LISTENER,
    onCommit: NO_OP_LISTENER,
    onExport: defaultExportHook,

    onError: (): void => {},
    value: '',
  };
}

export function effectiveMode(
  options: MathfieldOptionsPrivate
): 'math' | 'text' {
  if (options.defaultMode === 'inline-math') return 'math';
  return options.defaultMode;
}
