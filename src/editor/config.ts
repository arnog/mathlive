import { isArray } from '../common/types';

import { Atom } from '../core/atom';
import { MACROS } from '../core/definitions';
import { l10n } from './l10n';
import { defaultAnnounceHook } from './a11y';
import { INLINE_SHORTCUTS } from './shortcuts-definitions-inline';
import { MathfieldConfig } from '../public/config';
export { InlineShortcutDefinition } from '../public/shortcuts';

const AUDIO_FEEDBACK_VOLUME = 0.5; // from 0.0 to 1.0

declare class Model {}
declare class Mathfield {}

const NO_OP_LISTENER = (): void => {
    return;
};

export type MathfieldConfigPrivate = MathfieldConfig & {
    onAnnounce?: (
        target: Mathfield,
        command: string, // verb
        modelBefore: Model,
        atoms: Atom[] // object of the command
    ) => void; // @revisit 1.0: rename announceHook
};

function loadSound(sound: string | HTMLAudioElement): HTMLAudioElement {
    if (typeof sound === 'string') {
        const result: HTMLAudioElement = new Audio();
        result.preload = 'none';
        result.src = sound;
        result.volume = AUDIO_FEEDBACK_VOLUME;

        return result;
    }
    return sound;
}

function unloadSound(sound: string | HTMLAudioElement | object): void {
    if (sound instanceof HTMLAudioElement) {
        sound.pause();
        sound.removeAttribute('src');
        sound.load();
    }
}

export function update(
    current: Required<MathfieldConfigPrivate>,
    updates: MathfieldConfigPrivate
): Required<MathfieldConfigPrivate> {
    const result: Required<MathfieldConfigPrivate> = get(
        current,
        Object.keys(current)
    ) as Required<MathfieldConfigPrivate>;
    Object.keys(updates).forEach((key) => {
        switch (key) {
            case 'scriptDepth':
                if (isArray(updates.scriptDepth)) {
                    result.scriptDepth = [
                        updates.scriptDepth[0],
                        updates.scriptDepth[1],
                    ];
                } else if (typeof updates.scriptDepth === 'number') {
                    result.scriptDepth = [
                        updates.scriptDepth,
                        updates.scriptDepth,
                    ];
                } else {
                    throw Error('Unexpected value for scriptDepth');
                }
                break;
            case 'namespace':
                // Validate the namespace (used for `data-` attributes)
                if (!/^[a-z]*[-]?$/.test(updates.namespace)) {
                    throw Error(
                        'namespace must be a string of lowercase characters only'
                    );
                }
                if (!/-$/.test(updates.namespace)) {
                    result.namespace = updates.namespace + '-';
                } else {
                    result.namespace = updates.namespace;
                }
                break;
            case 'locale':
                result.locale =
                    updates.locale === 'auto' ? l10n.locale : updates.locale;
                break;
            case 'strings':
                l10n.merge(updates.strings);
                break;
            case 'virtualKeyboardLayout':
                if (updates.virtualKeyboardLayout === 'auto') {
                    result.virtualKeyboardLayout =
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
                        }[l10n.locale.substring(0, 2)] || 'qwerty';
                } else {
                    result.virtualKeyboardLayout =
                        updates.virtualKeyboardLayout;
                }
                break;
            case 'virtualKeyboardMode':
                {
                    const isTouchDevice = window.matchMedia?.(
                        '(any-pointer: coarse)'
                    ).matches;
                    if (updates.virtualKeyboardMode === 'auto') {
                        result.virtualKeyboardMode = isTouchDevice
                            ? 'onfocus'
                            : 'off';
                    } else {
                        result.virtualKeyboardMode =
                            updates.virtualKeyboardMode;
                    }
                }
                break;

            case 'letterShapeStyle':
                if (updates.letterShapeStyle === 'auto') {
                    // Letter shape style (locale dependent)
                    if (l10n.locale.substring(0, 2) === 'fr') {
                        result.letterShapeStyle = 'french';
                    } else {
                        result.letterShapeStyle = 'tex';
                    }
                } else {
                    result.letterShapeStyle = updates.letterShapeStyle;
                }
                break;
            case 'plonkSound':
                unloadSound(result.plonkSound);
                result.plonkSound = loadSound(updates.plonkSound);
                break;
            case 'keypressSound':
                unloadSound(result.keypressSound);
                if (typeof updates.keypressSound === 'string') {
                    const sound = loadSound(updates.keypressSound);
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
                } else {
                    if (!updates.keypressSound.default) {
                        throw Error('Missing keypressSound.default');
                    }
                    result.keypressSound = { ...updates.keypressSound };
                    if (!result.keypressSound.return) {
                        result.keypressSound.return =
                            updates.keypressSound.default;
                    }
                    if (!result.keypressSound.spacebar) {
                        result.keypressSound.spacebar =
                            updates.keypressSound.default;
                    }
                    if (!result.keypressSound.delete) {
                        result.keypressSound.delete =
                            updates.keypressSound.default;
                    }
                }
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
            case 'onVirtualKeyboardToggle':
            case 'onReadAloudStatus':
            case 'onError':
                if (updates[key] === null) {
                    result[key] = NO_OP_LISTENER;
                } else if (typeof updates[key] !== 'function') {
                    throw Error(key + ' must be a function or null');
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
    });

    // @revisit 1.0: for backward compatibility, interprets the overrideDefaultInlineShortcuts
    // property
    if (typeof updates.overrideDefaultInlineShortcuts !== 'undefined') {
        if (updates.overrideDefaultInlineShortcuts) {
            result.inlineShortcuts = updates.inlineShortcuts;
        } else {
            result.inlineShortcuts = {
                ...INLINE_SHORTCUTS,
                ...updates.inlineShortcuts,
            };
        }
    }
    return result;
}

export function get(
    config: Required<MathfieldConfigPrivate>,
    keys?: keyof MathfieldConfigPrivate | string[]
): any | MathfieldConfigPrivate {
    let resolvedKeys: string[];
    if (typeof keys === 'string') {
        resolvedKeys = [keys];
    } else if (typeof keys === 'undefined') {
        resolvedKeys = Object.keys(config);
    } else {
        resolvedKeys = keys;
    }
    const result: MathfieldConfigPrivate = {};
    resolvedKeys.forEach((x) => {
        if (isArray(result[x])) {
            result[x] = [...result[x]];
        } else if (typeof result[x] === 'object') {
            result[x] = { ...result[x] };
        } else {
            result[x] = config[x];
        }
    });
    // If requested a single key, return its value
    if (typeof keys === 'string') {
        return result[keys];
    }
    return result;
}

export function getDefault(): Required<MathfieldConfigPrivate> {
    return {
        namespace: '',
        substituteTextArea: undefined,
        readOnly: false,

        defaultMode: 'math',
        macros: MACROS,
        horizontalSpacingScale: 1.0,
        letterShapeStyle: 'auto',

        smartMode: false,
        smartFence: true,
        smartSuperscript: true,
        scriptDepth: [Infinity, Infinity],
        removeExtraneousParentheses: true,
        ignoreSpacebarInMathMode: true,

        locale: 'auto',
        strings: {},

        overrideDefaultInlineShortcuts: false, // @revisit: don't need this if we return the actual shortcuts
        inlineShortcuts: {}, // @revisit: return the actual shortcuts
        inlineShortcutTimeout: 0,

        virtualKeyboardToggleGlyph: `<span style="width: 21px; margin-top: 4px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M528 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm16 336c0 8.823-7.177 16-16 16H48c-8.823 0-16-7.177-16-16V112c0-8.823 7.177-16 16-16h480c8.823 0 16 7.177 16 16v288zM168 268v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-336 80v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm384 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zM120 188v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-96 152v-8c0-6.627-5.373-12-12-12H180c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h216c6.627 0 12-5.373 12-12z"/></svg></span>`,
        virtualKeyboardMode: 'auto',
        virtualKeyboards: 'all',
        virtualKeyboardLayout: 'auto',
        customVirtualKeyboardLayers: {},
        customVirtualKeyboards: {},
        virtualKeyboardTheme: /android|cros/i.test(navigator?.userAgent)
            ? 'material'
            : 'apple',
        keypressVibration: true,
        keypressSound: null,
        plonkSound: null,

        textToSpeechRules: 'mathlive',
        textToSpeechMarkup: '', // no markup
        textToSpeechRulesOptions: {},
        speechEngine: 'local',
        speechEngineVoice: 'Joanna',
        speechEngineRate: '100%',
        speakHook: NO_OP_LISTENER,
        readAloudHook: NO_OP_LISTENER,

        onAnnounce: defaultAnnounceHook,
        onKeystroke: (): boolean => true,
        onMoveOutOf: (): boolean => true,
        onTabOutOf: (): boolean => true,

        onBlur: NO_OP_LISTENER,
        onFocus: NO_OP_LISTENER,
        onContentWillChange: NO_OP_LISTENER,
        onContentDidChange: NO_OP_LISTENER,
        onSelectionWillChange: NO_OP_LISTENER,
        onSelectionDidChange: NO_OP_LISTENER,
        onUndoStateWillChange: NO_OP_LISTENER,
        onUndoStateDidChange: NO_OP_LISTENER,
        onModeChange: NO_OP_LISTENER,
        onVirtualKeyboardToggle: NO_OP_LISTENER,
        onReadAloudStatus: NO_OP_LISTENER,

        onError: (_) => {
            return;
        },
    };
}
