import type { ParseMode, Style } from '../public/core';
import type { Keybinding, KeyboardLayoutName } from '../public/config';
import type {
    Mathfield,
    OutputFormat,
    InsertOptions,
} from '../public/mathfield';

import { Atom, makeRoot } from '../core/atom';

import { loadFonts } from '../core/fonts';
import { Stylesheet, inject as injectStylesheet } from '../common/stylesheet';

import { ModelPrivate } from './model';
import { applyStyle } from './model-styling';
import { delegateKeyboardEvents } from './keyboard';
import { UndoRecord, UndoManager } from './undo';
import { hidePopover, updatePopoverPosition } from './popover';
import { atomToAsciiMath } from './atom-to-ascii-math';
import { localize as l10n } from './l10n';
import { HAPTIC_FEEDBACK_DURATION, SelectorPrivate, perform } from './commands';
import {
    selectionIsCollapsed,
    getAnchorStyle,
    getSelectedAtoms,
    getAnchorMode,
} from './model-selection';
import { removeSuggestion } from './model-utils';
import {
    commitCommandStringBeforeInsertionPoint,
    removeCommandString,
    decorateCommandStringAroundInsertionPoint,
} from './model-command-mode';
import { selectAll } from './model-selection';
import { complete } from './autocomplete';
import { requestUpdate } from './mathfield-render';
import {
    MathfieldConfigPrivate,
    update as updateConfig,
    getDefault as getDefaultConfig,
    get as getConfig,
} from './config';
import { insert } from './model-insert';
import { deleteChar } from './model-delete';
import { addRowAfter, addColumnAfter } from './model-array';
import { onTypedText, onKeystroke } from './mathfield-keyboard-input';
import { render } from './mathfield-render';

import './mathfield-commands';
import './mathfield-styling';

import {
    getCaretPosition,
    getSelectionBounds,
    getSharedElement,
    releaseSharedElement,
    isValidMathfield,
    on,
    off,
} from './mathfield-utils';

import { onCut, onCopy, onPaste } from './mathfield-clipboard';
import { attachButtonHandlers } from './mathfield-buttons';
import { onPointerDown } from './mathfield-pointer-input';
import {
    showVirtualKeyboard,
    hideVirtualKeyboard,
    switchKeyboardLayer,
} from './virtual-keyboard-commands';

import { normalizeKeybindings } from './keybindings';
import {
    setKeyboardLayoutLocale,
    getActiveKeyboardLayout,
} from './keyboard-layout';

import { atomToSpeakableText } from './atom-to-speakable-text';
import { atomsToMathML } from '../addons/math-ml';
import { updateUndoRedoButtons } from './virtual-keyboard';

import mathfieldStylesheet from '../../css/mathfield.less';
import coreStylesheet from '../../css/core.less';

import popoverStylesheet from '../../css/popover.less';
import keystrokeCaptionStylesheet from '../../css/keystroke-caption.less';
// import { parseLatex } from '../math-json/math-json';
import { atomtoMathJson } from '../addons/math-json';

export class MathfieldPrivate implements Mathfield {
    model: ModelPrivate;
    config: Required<MathfieldConfigPrivate>;

    private undoManager: UndoManager;

    private blurred: boolean;
    dirty: boolean; // If true, need to be redrawn
    pasteInProgress: boolean;
    smartModeSuppressed: boolean;
    private resizeTimer: number; // Timer handle

    element: HTMLElement;
    readonly originalContent: string;

    private stylesheets: Stylesheet[] = [];

    textarea: HTMLElement;
    field: HTMLElement;
    virtualKeyboardToggleDOMNode: HTMLElement;
    ariaLiveText: HTMLElement;
    accessibleNode: HTMLElement;
    popover: HTMLElement;

    keystrokeCaptionVisible: boolean;
    keystrokeCaption: HTMLElement;

    virtualKeyboardVisible: boolean;
    virtualKeyboard: HTMLElement;

    keybindings: Keybinding[]; // Normalized keybindings (raw ones in config)
    keyboardLayout: KeyboardLayoutName;

    keystrokeBuffer: string;
    keystrokeBufferStates: UndoRecord[];
    keystrokeBufferResetTimer: number;

    suggestionIndex: number;

    mode: ParseMode;
    style: Style;

    readonly keypressSound: HTMLAudioElement; // @revisit. Is this used? The sounds are in config, no?
    readonly spacebarKeypressSound: HTMLAudioElement;
    readonly returnKeypressSound: HTMLAudioElement;
    readonly deleteKeypressSound: HTMLAudioElement;
    readonly plonkSound: HTMLAudioElement;

    /**
     * To create a mathfield, you would typically use {@linkcode makeMathField | MathLive.makeMathField()}
     * instead of invoking directly this constructor.
     *
     *
     * @param element - The DOM element that this mathfield is attached to.
     * Note that `element.mathfield` is this object.
     */
    constructor(element: HTMLElement, config: MathfieldConfigPrivate) {
        // Setup default config options
        this.config = updateConfig(getDefaultConfig(), config);

        this.element = element;
        element['mathfield'] = this;

        // Save existing content
        this.originalContent = element.innerHTML;
        let elementText = this.element.textContent;
        if (elementText) {
            elementText = elementText.trim();
        }

        // Load the fonts, inject the core and mathfield stylesheets
        loadFonts(this.config.fontsDirectory, this.config.onError);
        this.stylesheets.push(injectStylesheet(element, coreStylesheet));
        this.stylesheets.push(injectStylesheet(element, mathfieldStylesheet));

        // Additional elements used for UI.
        // They are retrieved in order a bit later, so they need to be kept in sync
        // 1.0/ The field, where the math equation will be displayed
        // 1.1/ The virtual keyboard toggle
        // 2/ The popover panel which displays info in command mode
        // 3/ The keystroke caption panel (option+shift+K)
        // 4/ The virtual keyboard
        // 5.0/ The area to stick MathML for screen reading larger exprs (not used right now)
        //      The for the area is that focus would bounce their and then back triggering the
        //         screen reader to read it
        // 5.1/ The aria-live region for announcements
        let markup = '';
        if (!this.config.substituteTextArea) {
            if (/android|ipad|ipod|iphone/i.test(navigator?.userAgent)) {
                // On Android or iOS, don't use a textarea, which has the side effect of
                // bringing up the OS virtual keyboard
                markup += `<span class='ML__textarea'>
                <span class='ML__textarea__textarea'
                    tabindex="0" role="textbox"
                    style='display:inline-block;height:1px;width:1px' >
                </span>
            </span>`;
            } else {
                markup +=
                    '<span class="ML__textarea">' +
                    '<textarea class="ML__textarea__textarea" autocapitalize="off" autocomplete="off" ' +
                    'autocorrect="off" spellcheck="false" aria-hidden="true" tabindex="0">' +
                    '</textarea>' +
                    '</span>';
            }
        } else {
            if (typeof this.config.substituteTextArea === 'string') {
                markup += this.config.substituteTextArea;
            } else {
                // We don't really need this one, but we keep it here so that the
                // indexes below remain the same whether a substituteTextArea is
                // provided or not.
                markup += '<span></span>';
            }
        }
        markup +=
            '<span class="ML__fieldcontainer">' +
            '<span class="ML__fieldcontainer__field"></span>';

        // Only display the virtual keyboard toggle if the virtual keyboard mode is
        // 'manual'
        if (this.config.virtualKeyboardMode === 'manual') {
            markup += `<div class="ML__virtual-keyboard-toggle" role="button" data-tooltip="${l10n(
                'tooltip.toggle virtual keyboard'
            )}">`;
            // data-tooltip='Toggle Virtual Keyboard'
            if (this.config.virtualKeyboardToggleGlyph) {
                markup += this.config.virtualKeyboardToggleGlyph;
            } else {
                markup += `<span style="width: 21px; margin-top: 4px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M528 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm16 336c0 8.823-7.177 16-16 16H48c-8.823 0-16-7.177-16-16V112c0-8.823 7.177-16 16-16h480c8.823 0 16 7.177 16 16v288zM168 268v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-336 80v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm384 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zM120 188v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-96 152v-8c0-6.627-5.373-12-12-12H180c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h216c6.627 0 12-5.373 12-12z"/></svg></span>`;
            }
            markup += '</div>';
        } else {
            markup += '<span ></span>';
        }
        markup += '</span>';
        markup += `
        <div class="ML__sr-only">
            <span aria-live="assertive" aria-atomic="true"></span>
            <span></span>
        </div>
    `;

        this.element.innerHTML = this.config.createHTML(markup);

        let iChild = 0; // index of child -- used to make changes below easier
        if (typeof this.config.substituteTextArea === 'function') {
            this.textarea = this.config.substituteTextArea();
        } else {
            this.textarea = this.element.children[iChild++]
                .firstElementChild as HTMLElement;
        }
        this.field = this.element.children[iChild].children[0] as HTMLElement;

        // Listen to 'wheel' events to scroll (horizontally) the field when it overflows
        this.field.addEventListener(
            'wheel',
            (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const wheelDelta =
                    typeof ev.deltaX === 'undefined' ? ev.detail : -ev.deltaX;
                if (isFinite(wheelDelta)) {
                    this.field.scroll({
                        top: 0,
                        left: this.field.scrollLeft - wheelDelta * 5,
                    });
                }
            },
            { passive: false }
        );
        this.virtualKeyboardToggleDOMNode = this.element.children[iChild++]
            .children[1] as HTMLElement;
        attachButtonHandlers(this, this.virtualKeyboardToggleDOMNode, {
            default: 'toggleVirtualKeyboard',
            alt: 'toggleVirtualKeyboardAlt',
            shift: 'toggleVirtualKeyboardShift',
        });
        this.ariaLiveText = this.element.children[iChild]
            .children[0] as HTMLElement;
        this.accessibleNode = this.element.children[iChild++]
            .children[1] as HTMLElement;
        // Some panels are shared amongst instances of mathfield
        // (there's a single instance in the document)
        this.popover = getSharedElement(
            'mathlive-popover-panel',
            'ML__popover'
        );
        this.stylesheets.push(injectStylesheet(element, popoverStylesheet));
        this.keystrokeCaption = getSharedElement(
            'mathlive-keystroke-caption-panel',
            'ML__keystroke-caption'
        );
        this.stylesheets.push(
            injectStylesheet(element, keystrokeCaptionStylesheet)
        );
        // The keystroke caption panel and the command bar are
        // initially hidden
        this.keystrokeCaptionVisible = false;
        this.virtualKeyboardVisible = false;
        this.keystrokeBuffer = '';
        this.keystrokeBufferStates = [];
        this.keystrokeBufferResetTimer = null;
        // This index indicates which of the suggestions available to
        // display in the popover panel
        this.suggestionIndex = 0;
        // The input mode (text, math, command)
        // While getAnchorMode() represent the mode of the current selection,
        // this.mode is the mode chosen by the user. It indicates the mode the
        // next character typed will be interpreted in.
        // It is often identical to getAnchorMode() since changing the selection
        // changes the mode, but sometimes it is not, for example when a user
        // enters a mode changing command.
        this.mode = this.config.defaultMode;
        this.smartModeSuppressed = false;
        // Current style (color, weight, italic, etc...)
        // Reflects the style to be applied on next insertion, if any
        this.style = {};
        // Focus/blur state
        this.blurred = true;
        on(this.element, 'focus', this);
        on(this.element, 'blur', this);
        // Capture clipboard events
        on(this.textarea, 'cut', this);
        on(this.textarea, 'copy', this);
        on(this.textarea, 'paste', this);
        // Delegate keyboard events
        delegateKeyboardEvents(this.textarea, {
            allowDeadKey: () => this.mode === 'text',
            typedText: (text: string): void => onTypedText(this, text),
            paste: () => {
                return onPaste(this);
            },
            keystroke: (keystroke, e) => onKeystroke(this, keystroke, e),
            focus: () => this._onFocus(),
            blur: () => this._onBlur(),
        });

        // Delegate mouse and touch events
        if (window.PointerEvent) {
            // Use modern pointer events if available
            on(this.field, 'pointerdown', this);
        } else {
            on(this.field, 'touchstart:active mousedown', this);
        }

        // Request notification for when the window is resized (
        // or the device switched from portrait to landscape) to adjust
        // the UI (popover, etc...)
        on(window, 'resize', this);

        // Setup the model
        this.model = new ModelPrivate(
            {
                mode: this.config.defaultMode,
                macros: this.config.macros,
                removeExtraneousParentheses: this.config
                    .removeExtraneousParentheses,
            },
            {
                onContentDidChange: (_sender: ModelPrivate): void =>
                    this.config.onContentDidChange(this),
                onSelectionDidChange: (_sender: ModelPrivate): void =>
                    this._onSelectionDidChange(),
                onContentWillChange: (): void =>
                    this.config.onContentWillChange(this),
                onSelectionWillChange: (): void =>
                    this.config.onSelectionWillChange(this),
                onError: this.config.onError,
            },
            {
                announce: (
                    _sender: Mathfield,
                    command,
                    modelBefore,
                    atoms
                ): void =>
                    this.config.onAnnounce?.(this, command, modelBefore, atoms),
                moveOut: (_sender, direction): boolean =>
                    this.config.onMoveOutOf(this, direction),
                tabOut: (_sender, direction): boolean =>
                    this.config.onTabOutOf(this, direction),
            },
            this
        );

        // Prepare to manage undo/redo
        this.undoManager = new UndoManager(this.model);

        // Use the content of the element for the initial value of the mathfield
        insert(this.model, elementText, {
            insertionMode: 'replaceAll',
            selectionMode: 'after',
            format: 'latex',
            mode: 'math',
            suppressChangeNotifications: true,
            macros: this.config.macros,
        });

        // Now start recording potentially undoable actions
        this.undoManager.startRecording();
        this.undoManager.snapshot(this.config);

        this.model.setListeners({
            onContentDidChange: (_sender: ModelPrivate) =>
                this.config.onContentDidChange(this),
            onSelectionDidChange: (_sender: ModelPrivate) =>
                this._onSelectionDidChange(),
            onContentWillChange: () => this.config.onContentWillChange(this),
            onSelectionWillChange: () =>
                this.config.onSelectionWillChange(this),
            onError: this.config.onError,
        });
        this.model.setHooks({
            announce: (_sender: Mathfield, command, modelBefore, atoms) =>
                this.config.onAnnounce?.(this, command, modelBefore, atoms),
            moveOut: (_sender, direction) =>
                this.config.onMoveOutOf(this, direction),
            tabOut: (_sender, direction) =>
                this.config.onTabOutOf(this, direction),
        });

        if (!this.config.locale.startsWith(getActiveKeyboardLayout().locale)) {
            setKeyboardLayoutLocale(this.config.locale);
        }
        this.keybindings = normalizeKeybindings(
            this.config.keybindings,
            (e) => {
                if (typeof this.config.onError === 'function') {
                    this.config.onError({
                        code: 'invalid-keybinding',
                        arg: e.join('\n'),
                    });
                }
                console.log(e.join('\n'));
            }
        );
        requestUpdate(this);
    }

    $setConfig(config: MathfieldConfigPrivate): void {
        this.config = updateConfig(this.config, config);
        this.model.setListeners({
            onContentDidChange: (_sender: ModelPrivate) =>
                this.config.onContentDidChange(this),
            onSelectionDidChange: (_sender: ModelPrivate) =>
                this._onSelectionDidChange(),
            onContentWillChange: () => this.config.onContentWillChange(this),
            onSelectionWillChange: () =>
                this.config.onSelectionWillChange(this),
            onError: this.config.onError,
        });
        this.model.setHooks({
            announce: (_sender: Mathfield, command, modelBefore, atoms) =>
                this.config.onAnnounce?.(this, command, modelBefore, atoms),
            moveOut: (_sender, direction) =>
                this.config.onMoveOutOf(this, direction),
            tabOut: (_sender, direction) =>
                this.config.onTabOutOf(this, direction),
        });

        if (!this.config.locale.startsWith(getActiveKeyboardLayout().locale)) {
            setKeyboardLayoutLocale(this.config.locale);
        }
        this.keybindings = normalizeKeybindings(
            this.config.keybindings,
            (e) => {
                if (typeof this.config.onError === 'function') {
                    this.config.onError({
                        code: 'invalid-keybinding',
                        arg: e.join('\n'),
                    });
                }
                console.log(e.join('\n'));
            }
        );

        if (!this.config.readOnly) {
            this._onBlur();
        }
        requestUpdate(this);
    }

    getConfig(keys: keyof MathfieldConfigPrivate): boolean | number | string;
    getConfig(keys: string[]): MathfieldConfigPrivate;
    getConfig(
        keys: keyof MathfieldConfigPrivate | string[]
    ): boolean | number | string | MathfieldConfigPrivate {
        return getConfig(this.config, keys);
    }

    /*
     * handleEvent is a function invoked when an event is registered with an
     * object instead ( see `addEventListener()` in `on()`)
     * The name is defined by addEventListener() and cannot be changed.
     * This pattern is used to be able to release bound event handlers,
     * (event handlers that need access to `this`) as the bind() function
     * would create a new function that would have to be kept track off
     * to be able to properly remove the event handler later.
     */
    handleEvent(evt: Event): void {
        switch (evt.type) {
            case 'focus':
                this._onFocus();
                break;
            case 'blur':
                this._onBlur();
                break;
            case 'touchstart':
            case 'mousedown':
                // iOS <=13 Safari and Firefox on Android
                onPointerDown(this, evt as PointerEvent);
                break;
            case 'pointerdown':
                onPointerDown(this, evt as PointerEvent);
                break;
            case 'resize': {
                if (this.resizeTimer) {
                    window.cancelAnimationFrame(this.resizeTimer);
                }
                this.resizeTimer = window.requestAnimationFrame(
                    () => isValidMathfield(this) && this._onResize()
                );
                break;
            }
            case 'cut':
                onCut(this);
                break;
            case 'copy':
                onCopy(this, evt as ClipboardEvent);
                break;
            case 'paste':
                onPaste(this);
                break;
            default:
                console.warn('Unexpected event type', evt.type);
        }
    }
    $revertToOriginalContent(): void {
        this.element.innerHTML = this.config.createHTML(this.originalContent);
        delete this.element['mathfield'];
        delete this.accessibleNode;
        delete this.ariaLiveText;
        delete this.field;
        off(this.textarea, 'cut', this);
        off(this.textarea, 'copy', this);
        off(this.textarea, 'paste', this);
        this.textarea.remove();
        delete this.textarea;
        this.virtualKeyboardToggleDOMNode.remove();
        delete this.virtualKeyboardToggleDOMNode;
        releaseSharedElement(this.popover);
        delete this.popover;
        releaseSharedElement(this.keystrokeCaption);
        delete this.keystrokeCaption;
        releaseSharedElement(this.virtualKeyboard);
        delete this.virtualKeyboard;
        releaseSharedElement(
            document.getElementById('mathlive-alternate-keys-panel')
        );
        off(this.element, 'pointerdown', this);
        off(this.element, 'touchstart:active mousedown', this);
        off(this.element, 'focus', this);
        off(this.element, 'blur', this);
        off(window, 'resize', this);
        delete this.element;
        this.stylesheets.forEach((x) => x.release());
    }
    resetKeystrokeBuffer(): void {
        this.keystrokeBuffer = '';
        this.keystrokeBufferStates = [];
        clearTimeout(this.keystrokeBufferResetTimer);
    }

    private _onSelectionDidChange(): void {
        // Every atom before the new caret position is now committed
        commitCommandStringBeforeInsertionPoint(this.model);
        // Keep the content of the textarea in sync wiht the selection.
        // This will allow cut/copy to work.
        const result = selectionIsCollapsed(this.model)
            ? ''
            : makeRoot('math', getSelectedAtoms(this.model)).toLatex(false);
        const textarea = this.textarea as HTMLInputElement;
        if (result) {
            textarea.value = result;
            // The textarea may be a span (on mobile, for example), so check that
            // it has a select() before calling it.
            if (this.$hasFocus() && textarea.select) {
                textarea.select();
            }
        } else {
            textarea.value = '';
            textarea.setAttribute('aria-label', '');
        }
        // Update the mode
        {
            const previousMode = this.mode;
            this.mode = getAnchorMode(this.model) || this.config.defaultMode;
            if (
                this.mode !== previousMode &&
                typeof this.config.onModeChange === 'function'
            ) {
                this.config.onModeChange(this, this.mode);
            }
            if (previousMode === 'command' && this.mode !== 'command') {
                hidePopover(this);
                removeCommandString(this.model);
            }
        }
        // Defer the updating of the popover position: we'll need the tree to be
        // re-rendered first to get an updated caret position
        updatePopoverPosition(this, { deferred: true });

        // Invoke client listeners, if provided.
        if (typeof this.config.onSelectionDidChange === 'function') {
            this.config.onSelectionDidChange(this);
        }
    }

    private _onFocus(): void {
        if (this.config.readOnly) return;
        if (this.blurred) {
            this.blurred = false;
            // The textarea may be a span (on mobile, for example), so check that
            // it has a focus() before calling it.
            if (this.textarea.focus) {
                this.textarea.focus();
            }
            if (this.config.virtualKeyboardMode === 'onfocus') {
                showVirtualKeyboard(this);
            }
            updatePopoverPosition(this);
            if (this.config.onFocus) {
                this.config.onFocus(this);
            }
            requestUpdate(this);
        }
    }
    private _onBlur(): void {
        if (!this.blurred) {
            this.blurred = true;
            this.ariaLiveText.textContent = '';
            if (this.config.virtualKeyboardMode === 'onfocus') {
                hideVirtualKeyboard(this);
            }
            complete(this, { discard: true });
            requestUpdate(this);
            if (this.config.onBlur) {
                this.config.onBlur(this);
            }
        }
    }
    private _onResize(): void {
        this.element.classList.remove(
            'ML__isNarrowWidth',
            'ML__isWideWidth',
            'ML__isExtendedWidth'
        );
        if (window.innerWidth >= 1024) {
            this.element.classList.add('ML__isExtendedWidth');
        } else if (window.innerWidth >= 768) {
            this.element.classList.add('ML__isWideWidth');
        } else {
            this.element.classList.add('ML__isNarrowWidth');
        }
        updatePopoverPosition(this);
    }

    $perform(command: SelectorPrivate | any[]): boolean {
        return perform(this, command);
    }

    private formatMathlist(root: Atom, format: OutputFormat): string {
        format = format || 'latex';
        let result = '';
        if (format === 'latex' || format === 'latex-expanded') {
            result = root.toLatex(format === 'latex-expanded');
        } else if (format === 'mathML') {
            result = atomsToMathML(root, this.config);
        } else if (format === 'spoken') {
            result = atomToSpeakableText(root, this.config);
        } else if (format === 'spoken-text') {
            const saveTextToSpeechMarkup = this.config.textToSpeechMarkup;
            this.config.textToSpeechMarkup = '';
            result = atomToSpeakableText(root, this.config);
            this.config.textToSpeechMarkup = saveTextToSpeechMarkup;
        } else if (
            format === 'spoken-ssml' ||
            format === 'spoken-ssml-withHighlighting'
        ) {
            const saveTextToSpeechMarkup = this.config.textToSpeechMarkup;
            // const savedAtomIdsSettings = this.config.atomIdsSettings;    // @revisit
            this.config.textToSpeechMarkup = 'ssml';
            // if (format === 'spoken-ssml-withHighlighting') {     // @revisit
            //     this.config.atomIdsSettings = { seed: 'random' };
            // }
            result = atomToSpeakableText(root, this.config);
            this.config.textToSpeechMarkup = saveTextToSpeechMarkup;
            // this.config.atomIdsSettings = savedAtomIdsSettings;      // @revisit
        } else if (format === 'json') {
            const json = atomtoMathJson(root);
            // const json = parseLatex(root.toLatex(true), {
            //     form: 'canonical',
            // });
            result = JSON.stringify(json);
        } else if (format === 'json-2') {
            const json = atomtoMathJson(root);
            // const json = parseLatex(root.toLatex(true), {
            //     form: 'canonical',
            // });
            result = JSON.stringify(json, null, 2);
        } else if (format === 'ASCIIMath') {
            result = atomToAsciiMath(root);
        } else {
            console.warn('Unknown format :', format);
        }
        return result;
    }

    $text(format: OutputFormat): string {
        return this.formatMathlist(this.model.root, format);
    }

    $selectedText(format: OutputFormat): string {
        const atoms = getSelectedAtoms(this.model);
        if (!atoms) {
            return '';
        }
        const root = makeRoot('math', atoms);
        return this.formatMathlist(root, format);
    }
    $selectionIsCollapsed(): boolean {
        return selectionIsCollapsed(this.model);
    }
    $selectionDepth(): number {
        return this.model.path.length;
    }

    /**
     * Checks if the selection starts at the beginning of the selection group.
     */
    $selectionAtStart(): boolean {
        return this.model.startOffset() === 0;
    }
    $selectionAtEnd(): boolean {
        return this.model.endOffset() >= this.model.siblings().length - 1;
    }
    /**
     *  True if the entire group is selected
     */
    groupIsSelected(): boolean {
        return (
            this.model.startOffset() === 0 &&
            this.model.endOffset() >= this.model.siblings().length - 1
        );
    }
    $latex(text?: string, options?: InsertOptions): string {
        if (typeof text === 'string') {
            const oldValue = this.model.root.toLatex();
            if (text !== oldValue) {
                options = options ?? { mode: 'math' };
                insert(this.model, text, {
                    insertionMode: 'replaceAll',
                    selectionMode: 'after',
                    format: 'latex',
                    mode: 'math',
                    suppressChangeNotifications:
                        options.suppressChangeNotifications,
                    macros: this.config.macros,
                });
                this.undoManager.snapshot(this.config);
                requestUpdate(this);
            }
            return text;
        }
        // Return the content as LaTeX
        return this.model.root.toLatex();
    }
    $el(): HTMLElement {
        return this.element;
    }
    scrollIntoView(): void {
        // If a render is pending, do it now to make sure we have correct layout
        // and caret position
        if (this.dirty) {
            render(this);
        }
        let pos: number = getCaretPosition(this.field)?.x;
        const fieldBounds = this.field.getBoundingClientRect();
        if (typeof pos === 'undefined') {
            const selectionBounds = getSelectionBounds(this.field);
            if (selectionBounds !== null) {
                pos =
                    selectionBounds.right +
                    fieldBounds.left -
                    this.field.scrollLeft;
            }
        }
        if (typeof pos !== 'undefined') {
            const x = pos - window.scrollX;
            if (x < fieldBounds.left) {
                this.field.scroll({
                    top: 0,
                    left: x - fieldBounds.left + this.field.scrollLeft - 20,
                    behavior: 'smooth',
                });
            } else if (x > fieldBounds.right) {
                this.field.scroll({
                    top: 0,
                    left: x - fieldBounds.right + this.field.scrollLeft + 20,
                    behavior: 'smooth',
                });
            }
        }
    }
    $insert(s: string, options?: InsertOptions): boolean {
        if (typeof s === 'string' && s.length > 0) {
            options = options ?? { mode: 'math' };
            if (options.focus) {
                this.$focus();
            }
            if (options.feedback) {
                if (this.config.keypressVibration && navigator?.vibrate) {
                    navigator.vibrate(HAPTIC_FEEDBACK_DURATION);
                }
                if (this.keypressSound) {
                    this.keypressSound.load();
                    this.keypressSound.play();
                }
            }
            if (s === '\\\\') {
                // This string is interpreted as an "insert row after" command
                addRowAfter(this.model);
            } else if (s === '&') {
                addColumnAfter(this.model);
            } else {
                const savedStyle = this.style;
                insert(this.model, s, {
                    mode: this.mode,
                    style: getAnchorStyle(this.model),
                    ...options,
                });
                if (options.resetStyle) {
                    this.style = savedStyle;
                }
            }
            this.undoManager.snapshot(this.config);
            requestUpdate(this);
            return true;
        }
        return false;
    }
    switchMode(mode: ParseMode, prefix = '', suffix = ''): void {
        this.resetKeystrokeBuffer();
        // Suppress (temporarily) smart mode if switching to/from text or math
        // This prevents switching to/from command mode from supressing smart mode.
        this.smartModeSuppressed =
            /text|math/.test(this.mode) && /text|math/.test(mode);
        if (prefix) {
            this.$insert(prefix, {
                format: 'latex',
                mode: { math: 'text', text: 'math' }[mode],
            });
        }
        // Remove any error indicator on the current command sequence (if there is one)
        decorateCommandStringAroundInsertionPoint(this.model, false);
        if (mode === 'command') {
            removeSuggestion(this.model);
            hidePopover(this);
            this.suggestionIndex = 0;
            // Switch to the command mode keyboard layer
            if (this.virtualKeyboardVisible) {
                switchKeyboardLayer(this, 'lower-command');
            }
            insert(this.model, '\u001b', { mode: 'math' });
        } else {
            this.mode = mode;
        }
        if (suffix) {
            this.$insert(suffix, {
                format: 'latex',
                mode: mode,
            });
        }
        // Notify of mode change
        if (typeof this.config.onModeChange === 'function') {
            this.config.onModeChange(this, this.mode);
        }
        requestUpdate(this);
    }

    $hasFocus(): boolean {
        return (
            document.hasFocus() && deepActiveElement(document) === this.textarea
        );
    }
    $focus(): void {
        if (!this.$hasFocus()) {
            // The textarea may be a span (on mobile, for example), so check that
            // it has a focus() before calling it.
            if (typeof this.textarea.focus === 'function') {
                this.textarea.focus();
            }
            this.model.announce('line');
        }
    }
    $blur(): void {
        if (this.$hasFocus()) {
            if (this.textarea.blur) {
                this.textarea.blur();
            }
        }
    }
    $select(): void {
        selectAll(this.model);
    }
    $clearSelection(): void {
        deleteChar(this.model);
    }

    $applyStyle(style: Style): void {
        applyStyle(this.model, style);
    }

    $keystroke(keys: string, evt?: KeyboardEvent): boolean {
        return onKeystroke(this, keys, evt);
    }
    $typedText(text: string): void {
        onTypedText(this, text);
    }
    canUndo(): boolean {
        return this.undoManager.canUndo();
    }
    canRedo(): boolean {
        return this.undoManager.canRedo();
    }
    popUndoStack(): void {
        this.undoManager.pop();
    }
    snapshot(): void {
        this.undoManager.snapshot({
            ...this.config,
            onUndoStateDidChange: (mf, reason): void => {
                updateUndoRedoButtons(this);
                this.config.onUndoStateDidChange(mf, reason);
            },
        });
    }
    snapshotAndCoalesce(): void {
        this.undoManager.snapshotAndCoalesce({
            ...this.config,
            onUndoStateDidChange: (mf, reason): void => {
                updateUndoRedoButtons(this);
                this.config.onUndoStateDidChange(mf, reason);
            },
        });
    }
    getUndoRecord(): UndoRecord {
        return this.undoManager.save();
    }
    restoreToUndoRecord(s: UndoRecord): void {
        this.undoManager.restore(s, {
            ...this.config,
            suppressChangeNotifications: true,
        });
    }
    undo(): void {
        return this.undoManager.undo({
            ...this.config,
            onUndoStateDidChange: (mf, reason): void => {
                updateUndoRedoButtons(this);
                this.config.onUndoStateDidChange(mf, reason);
            },
        });
    }
    redo(): void {
        return this.undoManager.redo({
            ...this.config,
            onUndoStateDidChange: (mf, reason): void => {
                updateUndoRedoButtons(this);
                this.config.onUndoStateDidChange(mf, reason);
            },
        });
    }
}

function deepActiveElement(
    root: DocumentOrShadowRoot = document
): Element | null {
    if (root.activeElement?.shadowRoot?.activeElement) {
        return deepActiveElement(root.activeElement.shadowRoot);
    }
    return root.activeElement;
}
