import type { ParseMode, Style } from '../public/core';
import type { Keybinding, KeyboardLayoutName } from '../public/options';
import type {
  Mathfield,
  InsertOptions,
  OutputFormat,
  Offset,
  Range,
  Selection,
  FindOptions,
  ApplyStyleOptions,
  ReplacementFunction,
  VirtualKeyboardInterface,
} from '../public/mathfield';

import { Atom } from '../core/atom-class';

import { loadFonts } from '../core/fonts';
import { Stylesheet, inject as injectStylesheet } from '../common/stylesheet';

import { deleteRange, getMode, isRange, ModelPrivate } from '../editor/model';
import { applyStyle } from '../editor-model/styling';
import { delegateKeyboardEvents, KeyboardDelegate } from '../editor/keyboard';
import { UndoRecord, UndoManager } from '../editor/undo';
import { updatePopoverPosition } from '../editor/popover';
import { localize as l10n } from '../editor/l10n';
import {
  HAPTIC_FEEDBACK_DURATION,
  SelectorPrivate,
  perform,
  getCommandTarget,
} from '../editor/commands';
import { find, replace } from '../editor-model/find';
import { complete } from './autocomplete';
import { requestUpdate, render } from './render';
import {
  MathfieldOptionsPrivate,
  update as updateOptions,
  getDefault as getDefaultOptions,
  get as getOptions,
} from '../editor/options';
import {
  removeComposition,
  updateComposition,
} from '../editor-model/composition';
import { addRowAfter, addColumnAfter } from '../editor-model/array';
import { onTypedText, onKeystroke } from './keyboard-input';

import './commands';
import './styling';

import {
  getCaretPoint,
  getSelectionBounds,
  getSharedElement,
  releaseSharedElement,
  isValidMathfield,
  on,
  off,
} from './utils';

import { attachButtonHandlers } from './buttons';
import { onPointerDown, offsetFromPoint } from './pointer-input';
import { normalizeKeybindings } from '../editor/keybindings';
import {
  setKeyboardLayoutLocale,
  getActiveKeyboardLayout,
} from '../editor/keyboard-layout';

import { VirtualKeyboard } from '../editor/virtual-keyboard';

// @ts-ignore-error
import mathfieldStylesheet from '../../css/mathfield.less';
// @ts-ignore-error
import coreStylesheet from '../../css/core.less';
// @ts-ignore-error
import popoverStylesheet from '../../css/popover.less';
// @ts-ignore-error
import keystrokeCaptionStylesheet from '../../css/keystroke-caption.less';
import { range } from '../editor-model/selection-utils';
import { LatexGroupAtom } from '../core-atoms/latex';
import { parseLatex } from '../core/parser';
import { ModeEditor } from './mode-editor';
import './mode-editor-math';
import { getLatexGroupBody } from './mode-editor-latex';
import './mode-editor-text';

import { PlaceholderAtom } from '../core-atoms/placeholder';
import { VirtualKeyboardDelegate } from './remote-virtual-keyboard';

export class MathfieldPrivate implements Mathfield {
  model: ModelPrivate;
  options: Required<MathfieldOptionsPrivate>;

  dirty: boolean; // If true, need to be redrawn
  smartModeSuppressed: boolean;

  element: HTMLElement & {
    mathfield?: MathfieldPrivate;
  };

  /** @deprecated */
  readonly originalContent: string;

  keyboardDelegate: KeyboardDelegate;
  field: HTMLElement;
  fieldContent: HTMLElement;
  virtualKeyboardToggle: HTMLElement;
  ariaLiveText: HTMLElement;
  accessibleNode: HTMLElement;
  popover: HTMLElement;

  keystrokeCaptionVisible: boolean;
  keystrokeCaption: HTMLElement;

  virtualKeyboard: VirtualKeyboardInterface;

  keybindings: Keybinding[]; // Normalized keybindings (raw ones in config)
  keyboardLayout: KeyboardLayoutName;

  keystrokeBuffer: string;
  keystrokeBufferStates: UndoRecord[];
  keystrokeBufferResetTimer: ReturnType<typeof setTimeout>;

  suggestionIndex: number;

  mode: ParseMode;
  style: Style;

  keypressSound: HTMLAudioElement;
  spacebarKeypressSound: HTMLAudioElement;
  returnKeypressSound: HTMLAudioElement;
  deleteKeypressSound: HTMLAudioElement;
  plonkSound: HTMLAudioElement;

  private readonly undoManager: UndoManager;

  private blurred: boolean;
  // The value of the mathfield when it is focussed.
  // If this value is different when the field is blured
  // the `onCommit` listener is triggered
  private valueOnFocus: string;
  private eventHandlingInProgress = '';
  private readonly stylesheets: Stylesheet[] = [];
  private resizeTimer: number; // Timer handle

  /**
   * To create a mathfield, you would typically use {@linkcode makeMathField | MathLive.makeMathField()}
   * instead of invoking directly this constructor.
   *
   *
   * @param element - The DOM element that this mathfield is attached to.
   * Note that `element.mathfield` is this object.
   */
  constructor(
    element: HTMLElement & { mathfield?: MathfieldPrivate },
    options: Partial<MathfieldOptionsPrivate>
  ) {
    // Setup default config options
    this.options = updateOptions(getDefaultOptions(), {
      plonkSound: 'plonk.wav',
      keypressSound: {
        spacebar: 'keypress-spacebar.wav',
        return: 'keypress-return.wav',
        delete: 'keypress-delete.wav',
        default: 'keypress-standard.wav',
      },
      ...options,
    });

    // The virtual keyboard can be either attached to this mathfield
    // or a delegate that mirrors a global virtual keyboard attached
    // to the document. This is useful for example when using
    // mathfield in iframes so that all the mathfields share the keyboard
    // at the document level (rather than having one in each iframe)
    this.virtualKeyboard = options.useSharedVirtualKeyboard
      ? new VirtualKeyboardDelegate({
          targetOrigin: this.options.sharedVirtualKeyboardTargetOrigin,
          focus: () => this.focus(),
          blur: () => this.blur(),
          executeCommand: (command) => this.executeCommand(command),
          originValidator: this.options.originValidator,
        })
      : new VirtualKeyboard(this.options, {
          executeCommand: (command) => this.executeCommand(command),
        });

    this.plonkSound = this.options.plonkSound as HTMLAudioElement;
    if (
      typeof this.options.keypressSound !== 'string' &&
      !(this.options.keypressSound instanceof HTMLAudioElement)
    ) {
      this.keypressSound = this.options.keypressSound
        .default as HTMLAudioElement;
      this.spacebarKeypressSound = this.options.keypressSound
        .spacebar as HTMLAudioElement;
      this.returnKeypressSound = this.options.keypressSound
        .return as HTMLAudioElement;
      this.deleteKeypressSound = this.options.keypressSound
        .delete as HTMLAudioElement;
    }

    this.element = element;
    element.mathfield = this;

    // Save existing content
    this.originalContent = element.innerHTML;
    let elementText = this.element.textContent;
    if (elementText) {
      elementText = elementText.trim();
    }

    // Load the fonts, inject the core and mathfield stylesheets
    void loadFonts(this.options.fontsDirectory, this.options.onError);
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
    if (!this.options.substituteTextArea) {
      // On Android or iOS, don't use a textarea, which has the side effect of
      // bringing up the OS virtual keyboard
      markup += /android|ipad|ipod|iphone/i.test(navigator?.userAgent)
        ? `<span class='ML__textarea'>
                <span class='ML__textarea__textarea'
                    tabindex="-1" role="textbox"
                    style='display:inline-block;height:1px;width:1px' >
                </span>
            </span>`
        : '<span class="ML__textarea">' +
          '<textarea class="ML__textarea__textarea" autocapitalize="off" autocomplete="off" ' +
          `autocorrect="off" spellcheck="false" aria-hidden="true" tabindex="${
            element.tabIndex ?? 0
          }">` +
          '</textarea>' +
          '</span>';
    } else if (typeof this.options.substituteTextArea === 'string') {
      markup += this.options.substituteTextArea;
    } else {
      // We don't really need this one, but we keep it here so that the
      // indexes below remain the same whether a substituteTextArea is
      // provided or not.
      markup += '<span></span>';
    }

    markup +=
      '<span class="ML__fieldcontainer">' +
      '<span class="ML__fieldcontainer__field"></span>';

    // Only display the virtual keyboard toggle if the virtual keyboard mode is
    // 'manual'
    if (this.options.virtualKeyboardMode === 'manual') {
      markup += `<div part='virtual-keyboard-toggle' class="ML__virtual-keyboard-toggle" role="button" data-ML__tooltip="${l10n(
        'tooltip.toggle virtual keyboard'
      )}">`;
      // Data-ML__tooltip='Toggle Virtual Keyboard'
      markup += this.options.virtualKeyboardToggleGlyph
        ? this.options.virtualKeyboardToggleGlyph
        : `<span style="width: 21px; margin-top: 4px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M528 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm16 336c0 8.823-7.177 16-16 16H48c-8.823 0-16-7.177-16-16V112c0-8.823 7.177-16 16-16h480c8.823 0 16 7.177 16 16v288zM168 268v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-336 80v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm384 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zM120 188v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-96 152v-8c0-6.627-5.373-12-12-12H180c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h216c6.627 0 12-5.373 12-12z"/></svg></span>`;
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

    this.element.innerHTML = this.options.createHTML(markup);
    if (!this.element.children) {
      console.error(
        '%cMathlive: Something went wrong and the mathfield could not be created.%c\n' +
          'If you are using Vue, this may be because you are using the ' +
          'runtime-only build of Vue. Make sure to include ' +
          "'runtimeCompiler: true' in your Vue configuration. There" +
          'may a warning from Vue in the log above.',

        'color:red;font-family:system-ui;font-size:1.2rem;font-weight:bold',
        'color:inherith;font-family:system-ui;font-size:inherit;font-weight:inherit'
      );
      return;
    }

    let iChild = 0; // Index of child -- used to make changes below easier
    const textarea: HTMLElement =
      typeof this.options.substituteTextArea === 'function'
        ? this.options.substituteTextArea()
        : (this.element.children[iChild++].firstElementChild as HTMLElement);
    this.field = this.element.children[iChild].children[0] as HTMLElement;
    // Listen to 'wheel' events to scroll (horizontally) the field when it overflows
    this.field.addEventListener(
      'wheel',
      (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const wheelDelta = ev.deltaX === undefined ? ev.detail : -ev.deltaX;
        if (Number.isFinite(wheelDelta)) {
          this.field.scroll({
            top: 0,
            left: this.field.scrollLeft - wheelDelta * 5,
          });
        }
      },
      { passive: false }
    );

    // When fonts are done loading, re-render
    // (the selection state may be out of date)
    document.fonts.ready.then(() => {
      render(this);
    });

    this.virtualKeyboardToggle = this.element.children[iChild++]
      .children[1] as HTMLElement;
    attachButtonHandlers(
      (command) => this.executeCommand(command),
      this.virtualKeyboardToggle,
      {
        default: 'toggleVirtualKeyboard',
        alt: 'toggleVirtualKeyboardAlt',
        shift: 'toggleVirtualKeyboardShift',
      }
    );
    this.ariaLiveText = this.element.children[iChild]
      .children[0] as HTMLElement;
    this.accessibleNode = this.element.children[iChild++]
      .children[1] as HTMLElement;
    // Some panels are shared amongst instances of mathfield
    // (there's a single instance in the document)
    this.popover = getSharedElement('mathlive-popover-panel', 'ML__popover');
    this.stylesheets.push(injectStylesheet(null, coreStylesheet));
    this.stylesheets.push(injectStylesheet(null, popoverStylesheet));
    this.keystrokeCaption = getSharedElement(
      'mathlive-keystroke-caption-panel',
      'ML__keystroke-caption'
    );
    this.stylesheets.push(injectStylesheet(null, keystrokeCaptionStylesheet));
    // The keystroke caption panel and the command bar are
    // initially hidden
    this.keystrokeCaptionVisible = false;
    this.keystrokeBuffer = '';
    this.keystrokeBufferStates = [];
    this.keystrokeBufferResetTimer = null;
    // This index indicates which of the suggestions available to
    // display in the popover panel
    this.suggestionIndex = 0;
    // The input mode (text, math, command)
    // While model.getMode() represent the mode of the current selection,
    // this.mode is the mode chosen by the user. It indicates the mode the
    // next character typed will be interpreted in.
    // It is often identical to getAnchorMode() since changing the selection
    // changes the mode, but sometimes it is not, for example when a user
    // enters a mode changing command.
    this.mode = this.options.defaultMode;
    this.smartModeSuppressed = false;
    // Current style (color, weight, italic, etc...):
    // reflects the style to be applied on next insertion.
    this.style = {};
    // Focus/blur state
    this.blurred = true;
    on(this.element, 'focus', this);
    on(this.element, 'blur', this);
    // Capture clipboard events
    // Delegate keyboard events
    this.keyboardDelegate = delegateKeyboardEvents(
      textarea as HTMLTextAreaElement,
      {
        typedText: (text: string): void => onTypedText(this, text),
        cut: (_ev: ClipboardEvent) => {
          // Snapshot the undo state
          this.snapshot();

          // Clearing the selection will have the side effect of clearing the
          // content of the textarea. However, the textarea value is what will
          // be copied to the clipboard, so defer the clearing of the selection
          // to later, after the cut operation has been handled.
          setTimeout(() => {
            deleteRange(this.model, range(this.model.selection));
            requestUpdate(this);
          }, 0);
        },
        copy: (ev: ClipboardEvent) =>
          ModeEditor.onCopy(this.model.at(this.model.position).mode, this, ev),
        paste: (ev: ClipboardEvent) =>
          ModeEditor.onPaste(this.model.at(this.model.position).mode, this, ev),
        keystroke: (keystroke, event) => onKeystroke(this, keystroke, event),
        focus: () => this.onFocus(),
        blur: () => this.onBlur(),
        compositionStart: (composition: string) =>
          this.onCompositionStart(composition),
        compositionUpdate: (composition: string) =>
          this.onCompositionUpdate(composition),
        compositionEnd: (composition: string) =>
          this.onCompositionEnd(composition),
      }
    );

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
        mode: this.options.defaultMode,
        macros: this.options.macros,
        removeExtraneousParentheses: this.options.removeExtraneousParentheses,
      },
      {
        onContentDidChange: (_sender: ModelPrivate): void =>
          this.options.onContentDidChange(this),
        onSelectionDidChange: (_sender: ModelPrivate): void =>
          this._onSelectionDidChange(),
        onContentWillChange: (): void => this.options.onContentWillChange(this),
        onSelectionWillChange: (): void =>
          this.options.onSelectionWillChange(this),
        onError: this.options.onError,
      },
      {
        announce: (
          _sender: Mathfield,
          command: string,
          previousPosition: number,
          atoms: Atom[]
        ): void =>
          this.options.onAnnounce?.(this, command, previousPosition, atoms),
        moveOut: (_sender, direction): boolean =>
          this.options.onMoveOutOf(this, direction),
        tabOut: (_sender, direction): boolean =>
          this.options.onTabOutOf(this, direction),
      },
      this
    );

    // Prepare to manage undo/redo
    this.undoManager = new UndoManager(this.model);

    // Use the content of the element for the initial value of the mathfield
    if (elementText) {
      ModeEditor.insert('math', this.model, elementText, {
        insertionMode: 'replaceAll',
        selectionMode: 'after',
        format: 'latex',
        suppressChangeNotifications: true,
        macros: this.options.macros,
      });
    }

    // Now start recording potentially undoable actions
    this.undoManager.startRecording();
    this.undoManager.snapshot(this.options);

    this.model.setListeners({
      onContentDidChange: (_sender: ModelPrivate) =>
        this.options.onContentDidChange(this),
      onSelectionDidChange: (_sender: ModelPrivate) =>
        this._onSelectionDidChange(),
      onContentWillChange: () => this.options.onContentWillChange(this),
      onSelectionWillChange: () => this.options.onSelectionWillChange(this),
      onError: this.options.onError,
    });
    this.model.setHooks({
      announce: (_sender: Mathfield, command, previousPosition, atoms) =>
        this.options.onAnnounce?.(this, command, previousPosition, atoms),
      moveOut: (_sender, direction) =>
        this.options.onMoveOutOf(this, direction),
      tabOut: (_sender, direction) => this.options.onTabOutOf(this, direction),
    });

    if (!this.options.locale.startsWith(getActiveKeyboardLayout().locale)) {
      setKeyboardLayoutLocale(this.options.locale);
    }

    this.keybindings = normalizeKeybindings(this.options.keybindings, (e) => {
      if (typeof this.options.onError === 'function') {
        this.options.onError({
          code: 'invalid-keybinding',
          arg: e.join('\n'),
        });
      }

      console.log(e.join('\n'));
    });
    requestUpdate(this);
  }

  /** @deprecated */
  $setConfig(config: Partial<MathfieldOptionsPrivate>): void {
    deprecated('$setConfig');
    this.setOptions(config);
  }

  setOptions(config: Partial<MathfieldOptionsPrivate>): void {
    this.options = updateOptions(this.options, config);
    this.model.setListeners({
      onContentDidChange: (_sender: ModelPrivate) =>
        this.options.onContentDidChange(this),
      onSelectionDidChange: (_sender: ModelPrivate) =>
        this._onSelectionDidChange(),
      onContentWillChange: () => this.options.onContentWillChange(this),
      onSelectionWillChange: () => this.options.onSelectionWillChange(this),
      onError: this.options.onError,
    });
    this.model.setHooks({
      announce: (_sender: Mathfield, command, previousPosition, atoms) =>
        this.options.onAnnounce?.(this, command, previousPosition, atoms),
      moveOut: (_sender, direction) =>
        this.options.onMoveOutOf(this, direction),
      tabOut: (_sender, direction) => this.options.onTabOutOf(this, direction),
    });

    if (!this.options.locale.startsWith(getActiveKeyboardLayout().locale)) {
      setKeyboardLayoutLocale(this.options.locale);
    }

    this.keybindings = normalizeKeybindings(this.options.keybindings, (e) => {
      if (typeof this.options.onError === 'function') {
        this.options.onError({
          code: 'invalid-keybinding',
          arg: e.join('\n'),
        });
      }

      console.log(e.join('\n'));
    });

    this.plonkSound = this.options.plonkSound as HTMLAudioElement;
    if (
      typeof this.options.keypressSound !== 'string' &&
      !(this.options.keypressSound instanceof HTMLAudioElement)
    ) {
      this.keypressSound = this.options.keypressSound
        .default as HTMLAudioElement;
      this.spacebarKeypressSound = this.options.keypressSound
        .spacebar as HTMLAudioElement;
      this.returnKeypressSound = this.options.keypressSound
        .return as HTMLAudioElement;
      this.deleteKeypressSound = this.options.keypressSound
        .delete as HTMLAudioElement;
    }

    if (this.options.readOnly) {
      this.onBlur();
    }

    // Changing some config options (i.e. `macros`) may
    // require the content to be reparsed and re-rendered
    const content = Atom.toLatex(this.model.root, { expandMacro: false });
    ModeEditor.insert('math', this.model, content, {
      insertionMode: 'replaceAll',
      selectionMode: 'after',
      format: 'latex',
      suppressChangeNotifications: true,
      macros: this.options.macros,
    });
    requestUpdate(this);
  }

  /** @deprecated */
  getConfig<K extends keyof MathfieldOptionsPrivate>(
    keys: K[]
  ): Pick<MathfieldOptionsPrivate, K>;
  /** @deprecated */
  getConfig<K extends keyof MathfieldOptionsPrivate>(
    key: K
  ): MathfieldOptionsPrivate[K];
  /** @deprecated */
  getConfig(): MathfieldOptionsPrivate;
  /** @deprecated */
  getConfig(
    keys?: keyof MathfieldOptionsPrivate | (keyof MathfieldOptionsPrivate)[]
  ): any | Partial<MathfieldOptionsPrivate> {
    deprecated('getConfig');
    return getOptions(this.options, keys);
  }

  getOptions<K extends keyof MathfieldOptionsPrivate>(
    keys: K[]
  ): Pick<MathfieldOptionsPrivate, K>;
  getOptions(): MathfieldOptionsPrivate;
  getOptions(
    keys?: keyof MathfieldOptionsPrivate | (keyof MathfieldOptionsPrivate)[]
  ): any | Partial<MathfieldOptionsPrivate> {
    return getOptions(this.options, keys);
  }

  getOption<K extends keyof MathfieldOptionsPrivate>(
    key: K
  ): MathfieldOptionsPrivate[K] {
    return getOptions(this.options, key);
  }

  /*
   * HandleEvent is a function invoked when an event is registered with an
   * object instead ( see `addEventListener()` in `on()`)
   * The name is defined by `addEventListener()` and cannot be changed.
   * This pattern is used to be able to release bound event handlers,
   * (event handlers that need access to `this`) as the bind() function
   * would create a new function that would have to be kept track off
   * to be able to properly remove the event handler later.
   */
  handleEvent(evt: Event): void {
    switch (evt.type) {
      case 'focus':
        if (!this.eventHandlingInProgress) {
          this.eventHandlingInProgress = 'focus';
          this.onFocus();
          this.eventHandlingInProgress = '';
        }

        break;
      case 'blur':
        if (!this.eventHandlingInProgress) {
          this.eventHandlingInProgress = 'blur';
          this.onBlur();
          this.eventHandlingInProgress = '';
        }

        break;
      case 'touchstart':
      case 'mousedown':
        // IOS <=13 Safari and Firefox on Android
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
          () => isValidMathfield(this) && this.onResize()
        );
        break;
      }

      default:
        console.warn('Unexpected event type', evt.type);
    }
  }

  /** @deprecated */
  $revertToOriginalContent(): void {
    deprecated('$revertToOriginalContent');
    this.dispose();
    this.element.innerHTML = this.options.createHTML(this.originalContent);
  }

  dispose(): void {
    this.element.innerHTML = '$$' + this.getValue() + '$$';
    delete this.element.mathfield;
    delete this.accessibleNode;
    delete this.ariaLiveText;
    delete this.field;
    delete this.fieldContent;
    delete this.keyboardDelegate;
    this.virtualKeyboardToggle.remove();
    delete this.virtualKeyboardToggle;
    releaseSharedElement(this.popover);
    delete this.popover;
    releaseSharedElement(this.keystrokeCaption);
    delete this.keystrokeCaption;
    if (this.virtualKeyboard) {
      this.virtualKeyboard.dispose();
      delete this.virtualKeyboard;
    }

    off(this.element, 'pointerdown', this);
    off(this.element, 'touchstart:active mousedown', this);
    off(this.element, 'focus', this);
    off(this.element, 'blur', this);
    off(window, 'resize', this);
    delete this.element;
    this.stylesheets.forEach((x) => x.release());
  }

  resetKeystrokeBuffer(options?: { defer: boolean }): void {
    options = options ?? { defer: false };
    if (options.defer) {
      // If there is a timeout greater than 0, defer the reset
      // If the timeout is 0, never do the reset: regardless of the amount
      // of time between keystrokes, consider them as candidates for
      // a shortcut
      if (this.options.inlineShortcutTimeout > 0) {
        // Set a timer to reset the shortcut buffer
        this.keystrokeBufferResetTimer = setTimeout(() => {
          this.resetKeystrokeBuffer();
        }, this.options.inlineShortcutTimeout);
      }

      return;
    }

    this.keystrokeBuffer = '';
    this.keystrokeBufferStates = [];
    clearTimeout(this.keystrokeBufferResetTimer);
  }

  /** @deprecated */
  $perform(
    command: SelectorPrivate | [SelectorPrivate, ...unknown[]]
  ): boolean {
    deprecated('$perform');
    return this.executeCommand(command);
  }

  executeCommand(
    command: SelectorPrivate | [SelectorPrivate, ...unknown[]]
  ): boolean {
    if (getCommandTarget(command) === 'virtual-keyboard') {
      return this.virtualKeyboard?.executeCommand(command);
    }

    return perform(this, command);
  }

  get lastOffset(): number {
    return this.model.lastOffset;
  }

  get selection(): Selection {
    return this.model.selection;
  }

  set selection(value: Selection) {
    this.model.selection = value;
  }

  /** @deprecated */
  $text(format: OutputFormat): string {
    return this.getValue(format);
  }

  getValue(): string;
  getValue(format: OutputFormat): string;
  getValue(start: Offset, end: Offset, format?: OutputFormat): string;
  getValue(range: Range, format?: OutputFormat): string;
  getValue(selection: Selection, format?: OutputFormat): string;
  getValue(
    arg1?: Offset | OutputFormat | Range | Selection,
    arg2?: Offset | OutputFormat,
    arg3?: OutputFormat
  ): string {
    return this.model.getValue(arg1, arg2, arg3);
  }

  setValue(value: string, options?: InsertOptions): void {
    options = options ?? { mode: 'math' };
    if (options.insertionMode === undefined) {
      options.insertionMode = 'replaceAll';
    }

    if (options.format === undefined || options.format === 'auto') {
      options.format = 'latex';
    }

    let mode: ParseMode = 'math';
    if (!options.mode || options.mode === 'auto') {
      mode = getMode(this.model, this.model.position);
    }

    if (ModeEditor.insert(mode, this.model, value, options)) {
      this.undoManager.snapshot(this.options);
      requestUpdate(this);
    }
  }

  find(value: string | RegExp, options: FindOptions): Range[] {
    return find(this.model, value, options);
  }

  replace(
    searchValue: string | RegExp,
    newValue: string | ReplacementFunction,
    options?: FindOptions
  ): void {
    replace(this.model, searchValue, newValue, options);
  }

  /** @deprecated */
  $selectedText(format: OutputFormat): string {
    deprecated('$selectedText');

    return this.getValue(this.model.selection, format);
  }

  /** @deprecated */
  $selectionIsCollapsed(): boolean {
    deprecated('$selectionIsCollapsed');
    return this.model.selectionIsCollapsed;
  }

  /** @deprecated */
  $selectionDepth(): number {
    deprecated('$selectionDepth');
    return this.model.at(this.model.position).treeDepth;
  }

  /**
   * Checks if the selection starts at the beginning of the selection group.
   *
   * @deprecated
   */
  $selectionAtStart(): boolean {
    deprecated('$selectionAtStart');
    return false;
  }

  /** @deprecated */
  $selectionAtEnd(): boolean {
    deprecated('$selectionAtEnd');
    return false;
  }

  /** @deprecated */
  $latex(text?: string, options?: InsertOptions): string {
    deprecated('$latex');
    if (typeof text === 'string') {
      const oldValue = Atom.toLatex(this.model.root, {
        expandMacro: false,
      });
      if (text !== oldValue) {
        options = options ?? { mode: 'math' };
        ModeEditor.insert('math', this.model, text, {
          insertionMode: 'replaceAll',
          selectionMode: 'after',
          format: 'latex',
          mode: 'math',
          suppressChangeNotifications: options.suppressChangeNotifications,
          macros: this.options.macros,
        });
        this.undoManager.snapshot(this.options);
        requestUpdate(this);
      }

      return text;
    }

    // Return the content as LaTeX
    return Atom.toLatex(this.model.root, { expandMacro: false });
  }

  /** @deprecated */
  $el(): HTMLElement {
    deprecated('$el');
    return this.element;
  }

  scrollIntoView(): void {
    // If a render is pending, do it now to make sure we have correct layout
    // and caret position
    if (this.dirty) {
      render(this);
    }

    const fieldBounds = this.field.getBoundingClientRect();
    let caretPoint: number;
    if (this.model.selectionIsCollapsed) {
      caretPoint = getCaretPoint(this.field)?.x;
    } else {
      const selectionBounds = getSelectionBounds(this);
      if (selectionBounds.length > 0) {
        caretPoint =
          selectionBounds[0].right + fieldBounds.left - this.field.scrollLeft;
      }
    }

    if (caretPoint !== undefined) {
      const x = caretPoint - window.scrollX;
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

  /** @deprecated */
  $insert(s: string, options?: InsertOptions): boolean {
    deprecated('$insert');
    return this.insert(s, options);
  }

  insert(s: string, options?: InsertOptions): boolean {
    if (typeof s === 'string' && s.length > 0) {
      options = options ?? { mode: 'math' };
      if (options.focus) {
        this.focus();
      }

      if (options.feedback) {
        if (this.options.keypressVibration && navigator?.vibrate) {
          navigator.vibrate(HAPTIC_FEEDBACK_DURATION);
        }

        void this.keypressSound?.play();
      }

      if (s === '\\\\') {
        // This string is interpreted as an "insert row after" command
        addRowAfter(this.model);
      } else if (s === '&') {
        addColumnAfter(this.model);
      } else {
        const savedStyle = this.style;
        ModeEditor.insert(this.mode, this.model, s, {
          style: this.model.at(this.model.position).computedStyle,
          ...options,
        });
        if (options.resetStyle) {
          this.style = savedStyle;
        }
      }

      this.undoManager.snapshot(this.options);
      requestUpdate(this);
      return true;
    }

    return false;
  }

  switchMode(mode: ParseMode, prefix = '', suffix = ''): void {
    if (this.mode === mode) return;
    const { model } = this;
    model.deferNotifications(
      { content: Boolean(suffix) || Boolean(prefix), selection: true },
      (): boolean => {
        let contentChanged = false;
        this.resetKeystrokeBuffer();
        // Suppress (temporarily) smart mode if switching to/from text or math
        // This prevents switching to/from command mode from suppressing smart mode.
        this.smartModeSuppressed =
          /text|math/.test(this.mode) && /text|math/.test(mode);
        if (prefix) {
          const atoms = parseLatex(
            prefix,
            { math: 'text', text: 'math' }[mode],
            null,
            null
          );
          model.collapseSelection('forward');
          const cursor = model.at(model.position);
          model.position = model.offsetOf(
            cursor.parent.addChildrenAfter(atoms, cursor)
          );
          contentChanged = true;
        }

        this.mode = mode;

        if (mode === 'latex') {
          const wasCollapsed = model.selectionIsCollapsed;
          // We can have only a single latex group at a time.
          // If a latex group is open, close it first
          complete(this, 'accept');

          // Switch to the command mode keyboard layer
          if (this.virtualKeyboard.visible) {
            this.executeCommand(['switchKeyboardLayer', 'latex-lower']);
          }

          // Insert a latex group atom
          let latex: string;
          let cursor = model.at(model.position);
          if (wasCollapsed) {
            latex = '\\';
          } else {
            const selRange = range(model.selection);
            latex = Atom.toLatex(
              model
                .extractAtoms(selRange)
                .filter((x) => !(x instanceof PlaceholderAtom)),
              {
                expandMacro: false,
              }
            );
            cursor = model.at(selRange[0]);
          }

          const atom = new LatexGroupAtom(latex);
          cursor.parent.addChildAfter(atom, cursor);
          if (wasCollapsed) {
            model.position = model.offsetOf(atom.lastChild);
          } else {
            model.setSelection(
              model.offsetOf(atom.firstChild),
              model.offsetOf(atom.lastChild)
            );
          }
        } else {
          // Remove any error indicator on the current command sequence (if there is one)
          getLatexGroupBody(model).forEach((x) => {
            x.isError = false;
          });
        }

        if (suffix) {
          const atoms = parseLatex(
            suffix,
            { math: 'text', text: 'math' }[mode],
            null,
            null
          );
          model.collapseSelection('forward');
          const cursor = model.at(model.position);
          model.position = model.offsetOf(
            cursor.parent.addChildrenAfter(atoms, cursor)
          );
          contentChanged = true;
        }

        // Notify of mode change
        if (typeof this.options.onModeChange === 'function') {
          this.options.onModeChange(this, this.mode);
        }

        requestUpdate(this);
        return contentChanged;
      }
    );
  }

  /** @deprecated */
  $hasFocus(): boolean {
    deprecated('$hasFocus');
    return this.hasFocus();
  }

  hasFocus(): boolean {
    return document.hasFocus() && this.keyboardDelegate.hasFocus();
  }

  focus(): void {
    if (!this.hasFocus()) {
      this.keyboardDelegate.focus();
      this.model.announce('line');
    }
  }

  blur(): void {
    if (this.hasFocus()) {
      this.keyboardDelegate.blur();
    }
  }

  /** @deprecated */
  $focus(): void {
    deprecated('$focus');
    return this.focus();
  }

  /** @deprecated */
  $blur(): void {
    deprecated('$blur');
    return this.blur();
  }

  /** @deprecated */
  $select(): void {
    this.select();
  }

  select(): void {
    this.model.selection = { ranges: [[0, this.model.lastOffset]] };
  }

  /** @deprecated */
  $clearSelection(): void {
    deprecated('$clearSelection');
    deleteRange(this.model, range(this.model.selection));
  }

  applyStyle(style: Style, inOptions: Range | ApplyStyleOptions = {}): void {
    const options: ApplyStyleOptions = {
      operation: 'set',
      suppressChangeNotifications: false,
    };
    if (isRange(inOptions)) {
      options.range = inOptions;
    } else {
      options.range = inOptions.range;
      options.suppressChangeNotifications =
        inOptions.suppressChangeNotifications ?? false;
    }

    const operation = options.operation ?? 'set';
    this.model.deferNotifications(
      { content: !options.suppressChangeNotifications },
      () => {
        if (options.range === undefined) {
          this.model.selection.ranges.forEach((range) =>
            applyStyle(this.model, range, style, { operation })
          );
        } else {
          applyStyle(this.model, options.range, style, { operation });
        }
      }
    );
    requestUpdate(this);
  }

  /** @deprecated */
  $applyStyle(style: Style): void {
    this.model.selection.ranges.forEach((range) =>
      applyStyle(this.model, range, style, { operation: 'toggle' })
    );
  }

  /** @deprecated */
  $keystroke(keys: string, evt?: KeyboardEvent): boolean {
    deprecated('$keystroke');
    return onKeystroke(this, keys, evt);
  }

  /** @deprecated */
  $typedText(text: string): void {
    deprecated('$typedText');
    onTypedText(this, text);
  }

  getCaretPoint(): { x: number; y: number } | null {
    const caretOffset = getCaretPoint(this.field);
    return caretOffset ? { x: caretOffset.x, y: caretOffset.y } : null;
  }

  setCaretPoint(x: number, y: number): boolean {
    const newPosition = offsetFromPoint(this, x, y, { bias: 0 });
    if (newPosition < 0) return false;
    const previousPosition = this.model.position;
    this.model.position = newPosition;
    this.model.announce('move', previousPosition);
    requestUpdate(this);
    return true;
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
      ...this.options,
      onUndoStateDidChange: (mf, reason): void => {
        this.virtualKeyboard.executeCommand([
          'onUndoStateChanged',
          this.canUndo(),
          this.canRedo(),
        ]);
        this.options.onUndoStateDidChange(mf, reason);
      },
    });
  }

  snapshotAndCoalesce(): void {
    this.undoManager.snapshotAndCoalesce({
      ...this.options,
      onUndoStateDidChange: (mf, reason): void => {
        this.virtualKeyboard.executeCommand([
          'onUndoStateChanged',
          this.canUndo(),
          this.canRedo(),
        ]);
        this.options.onUndoStateDidChange(mf, reason);
      },
    });
  }

  getUndoRecord(): UndoRecord {
    return this.undoManager.save();
  }

  restoreToUndoRecord(s: UndoRecord): void {
    this.undoManager.restore(s, {
      ...this.options,
      suppressChangeNotifications: true,
    });
  }

  undo(): void {
    return this.undoManager.undo({
      ...this.options,
      onUndoStateDidChange: (mf, reason): void => {
        this.virtualKeyboard.executeCommand([
          'onUndoStateChanged',
          this.canUndo(),
          this.canRedo(),
        ]);
        this.options.onUndoStateDidChange(mf, reason);
      },
    });
  }

  redo(): void {
    return this.undoManager.redo({
      ...this.options,
      onUndoStateDidChange: (mf, reason): void => {
        this.virtualKeyboard.executeCommand([
          'onUndoStateChanged',
          this.canUndo(),
          this.canRedo(),
        ]);
        this.options.onUndoStateDidChange(mf, reason);
      },
    });
  }

  private _onSelectionDidChange(): void {
    // Keep the content of the textarea in sync wiht the selection.
    // This will allow cut/copy to work.
    this.keyboardDelegate.setValue(
      this.getValue(this.model.selection, 'latex-expanded')
    );

    // Adjust mode
    {
      const cursor = this.model.at(this.model.position);
      const newMode = cursor.mode ?? this.options.defaultMode;
      if (this.mode !== newMode) {
        if (this.mode === 'latex') {
          complete(this, 'accept', { mode: newMode });
          this.model.position = this.model.offsetOf(cursor);
        } else {
          this.switchMode(newMode);
        }
      }
    }

    // Invoke client listeners, if provided.
    if (typeof this.options.onSelectionDidChange === 'function') {
      this.options.onSelectionDidChange(this);
    }
  }

  private onFocus(): void {
    if (this.options.readOnly) return;
    if (this.blurred) {
      this.blurred = false;
      this.keyboardDelegate.focus();

      this.virtualKeyboard.enable();

      if (this.options.virtualKeyboardMode === 'onfocus') {
        this.executeCommand('showVirtualKeyboard');
      }

      updatePopoverPosition(this);
      this.options.onFocus?.(this);

      // Save the current value.
      // It will be compared in `onBlur()` to see if the
      // `onCommit` listener needs to be invoked. This
      // mimic the `<input>` and `<textarea>` behavior
      this.valueOnFocus = this.getValue();
      requestUpdate(this);
    }
  }

  private onBlur(): void {
    if (!this.blurred) {
      this.blurred = true;
      this.ariaLiveText.textContent = '';

      if (/onfocus|manual/.test(this.options.virtualKeyboardMode)) {
        this.executeCommand('hideVirtualKeyboard');
      }

      complete(this, 'accept');
      requestUpdate(this);
      if (typeof this.options.onBlur === 'function') {
        this.options.onBlur(this);
      }

      this.virtualKeyboard.disable();

      if (
        typeof this.options.onCommit === 'function' &&
        this.getValue() !== this.valueOnFocus
      ) {
        this.options.onCommit(this);
      }
    }
  }

  private onCompositionStart(_composition: string): void {
    // Clear the selection if there is one
    this.model.position = this.model.deleteAtoms(range(this.model.selection));
    requestAnimationFrame(() => {
      render(this); // Recalculate the position of the caret
      // Synchronize the location and style of textarea
      // so that the IME candidate window can align with the composition
      const caretPoint = getCaretPoint(this.field);
      if (!caretPoint) return;
      this.keyboardDelegate.moveTo(caretPoint.x, caretPoint.y);
    });
  }

  private onCompositionUpdate(composition: string): void {
    updateComposition(this.model, composition);
    requestUpdate(this);
  }

  private onCompositionEnd(composition: string): void {
    removeComposition(this.model);
    onTypedText(this, composition, {
      simulateKeystroke: true,
    });
  }

  private onResize(): void {
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
}

function deprecated(method: string) {
  console.warn(`Method "${method}" is deprecated`);
}
