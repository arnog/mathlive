import { MacroDictionary, ParseMode } from './core';
import { InlineShortcutDefinition } from './shortcuts';

declare class Mathfield {}

export type TextToSpeechOptions = {
    textToSpeechRules?: 'mathlive' | 'sre';
    textToSpeechMarkup?: '' | 'ssml' | 'ssml_step' | 'mac';
    textToSpeechRulesOptions?: { [key: string]: string };
    speechEngine?: 'local' | 'amazon';
    speechEngineVoice?: string;
    speechEngineRate?: string;
    speakHook?: (text: string, config: MathfieldConfig) => void; // @revisit 1.0: rename speakHook
    readAloudHook?: (
        element: HTMLElement,
        text: string,
        config: MathfieldConfig
    ) => void; // @revisit 1.0: rename readAloudHook
};

export type VirtualKeyboardOptions = {
    virtualKeyboardToggleGlyph?: string;
    virtualKeyboardMode?: 'auto' | 'manual' | 'onfocus' | 'off';
    virtualKeyboards?:
        | 'all'
        | 'numeric'
        | 'roman'
        | 'greek'
        | 'functions'
        | 'command'
        | string;
    virtualKeyboardLayout?:
        | 'auto'
        | 'qwerty'
        | 'azerty'
        | 'qwertz'
        | 'dvorak'
        | 'colemak';
    customVirtualKeyboardLayers?: { [layer: string]: string };
    customVirtualKeyboards?: { [layer: string]: string };
    virtualKeyboardTheme?: 'material' | 'apple' | '';
    keypressVibration?: boolean;
    keypressSound?:
        | string
        | HTMLAudioElement
        | {
              spacebar?: string | HTMLAudioElement;
              return?: string | HTMLAudioElement;
              delete?: string | HTMLAudioElement;
              default: string | HTMLAudioElement;
          };
    plonkSound?: string | HTMLAudioElement;
};

export interface MathfieldHooks {
    onKeystroke?: (
        sender: Mathfield,
        keystroke: string,
        ev: KeyboardEvent
    ) => boolean; // @revisit: check event type
    onMoveOutOf?: (
        sender: Mathfield,
        direction: 'forward' | 'backward'
    ) => boolean;
    onTabOutOf?: (
        sender: Mathfield,
        direction: 'forward' | 'backward'
    ) => boolean;
}

export type UndoStateChangeListener = (
    target: Mathfield,
    action: 'undo' | 'redo' | 'snapshot'
) => void;

export interface MathfieldListeners {
    onBlur?: (sender: Mathfield) => void;
    onFocus?: (sender: Mathfield) => void;
    onContentWillChange?: (sender: Mathfield) => void;
    onContentDidChange?: (sender: Mathfield) => void;
    onSelectionWillChange?: (sender: Mathfield) => void;
    onSelectionDidChange?: (sender: Mathfield) => void;
    onUndoStateWillChange?: UndoStateChangeListener;
    onUndoStateDidChange?: UndoStateChangeListener;
    onModeChange?: (sender: Mathfield, mode: ParseMode) => void;
    onVirtualKeyboardToggle?: (
        sender: Mathfield,
        visible: boolean,
        keyboardElement: HTMLElement
    ) => void;
    onReadAloudStatus?: (sender: Mathfield) => void;
}

export type InlineShortcutsOptions = {
    /** @deprecated : Use `mf.setConfig('inlineShortcuts', {...mf.getConfig('inlineShortcuts'),...newShortcuts})` to add `newShortcuts` to the default ones */
    overrideDefaultInlineShortcuts?: boolean;
    inlineShortcuts?: { [key: string]: InlineShortcutDefinition };
    inlineShortcutTimeout?: number;
};

export type LocalizationOptions = {
    locale?: string;
    strings?: { [locale: string]: { [key: string]: string } };
};

export type EditingOptions = {
    readOnly?: boolean;

    smartMode?: boolean;
    smartFence?: boolean;
    smartSuperscript?: boolean;
    scriptDepth?: number | [number, number]; // For [superscript, subscript] or for both
    removeExtraneousParentheses?: boolean;
    ignoreSpacebarInMathMode?: boolean;
};

export type LayoutOptions = {
    defaultMode?: 'math' | 'text';

    macros?: MacroDictionary;

    horizontalSpacingScale?: number;
    letterShapeStyle?: 'auto' | 'tex' | 'iso' | 'french' | 'upright';
};

/**
 * See {@tutorial CONFIG Configuration Options} for details.
 */
export type MathfieldConfig = LayoutOptions &
    EditingOptions &
    LocalizationOptions &
    InlineShortcutsOptions &
    VirtualKeyboardOptions &
    TextToSpeechOptions &
    MathfieldHooks &
    MathfieldListeners & {
        namespace?: string;
        substituteTextArea?: string | (() => HTMLElement);
    };
