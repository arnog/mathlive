import { BoxedExpression, ComputeEngine } from '@cortex-js/compute-engine';

// @ts-ignore-error
import MATHFIELD_STYLESHEET from '../../css/mathfield.less';
// @ts-ignore-error
import CORE_STYLESHEET from '../../css/core.less';

import type {
  MacroDefinition,
  LatexSyntaxError,
  ParseMode,
  Registers,
  Style,
} from '../public/core';
import type { Keybinding, KeyboardLayoutName } from '../public/options';
import type {
  Mathfield,
  InsertOptions,
  OutputFormat,
  Offset,
  Range,
  Selection,
  ApplyStyleOptions,
  VirtualKeyboardInterface,
} from '../public/mathfield';
import MathfieldElement from '../public/mathfield-element';

import { canVibrate, isBrowser, isTouchCapable } from '../common/capabilities';
import { hashCode } from '../common/hash-code';
import { Stylesheet, inject as injectStylesheet } from '../common/stylesheet';

import { Atom } from '../core/atom-class';
import { loadFonts } from '../core/fonts';
import { GlobalContext } from '../core/context';
import { defaultBackgroundColorMap, defaultColorMap } from '../core/color';
import {
  NormalizedMacroDictionary,
  TokenDefinition,
} from '../core-definitions/definitions-utils';
import { LatexGroupAtom } from '../core-atoms/latex';
import { parseLatex, validateLatex } from '../core/parser';
import { getDefaultRegisters } from '../core/registers';

import { PlaceholderAtom } from '../core-atoms/placeholder';

import {
  contentWillChange,
  deleteRange,
  getMode,
  isRange,
  ModelPrivate,
} from '../editor/model';
import { applyStyle } from '../editor-model/styling';
import { range } from '../editor-model/selection-utils';
import {
  removeComposition,
  updateComposition,
} from '../editor-model/composition';
import { addRowAfter, addColumnAfter } from '../editor-model/array';

import { delegateKeyboardEvents, KeyboardDelegate } from '../editor/keyboard';
import { UndoRecord, UndoManager } from '../editor/undo';
import { disposePopover, updatePopoverPosition } from '../editor/popover';
import { localize } from '../core/l10n';
import {
  HAPTIC_FEEDBACK_DURATION,
  SelectorPrivate,
  perform,
  getCommandTarget,
} from '../editor/commands';
import {
  MathfieldOptionsPrivate,
  update as updateOptions,
  getDefault as getDefaultOptions,
  get as getOptions,
  effectiveMode,
  DEFAULT_KEYBOARD_TOGGLE_GLYPH,
} from '../editor/options';
import { normalizeKeybindings } from '../editor/keybindings';
import {
  setKeyboardLayoutLocale,
  getActiveKeyboardLayout,
  DEFAULT_KEYBOARD_LAYOUT,
  gKeyboardLayout,
} from '../editor/keyboard-layout';
import { VirtualKeyboard } from '../editor/virtual-keyboard';

import { onTypedText, onKeystroke } from './keyboard-input';
import { complete } from './autocomplete';
import { requestUpdate, render } from './render';

import './commands';
import './styling';

import {
  getCaretPoint,
  getSelectionBounds,
  isValidMathfield,
  on,
  off,
  Rect,
} from './utils';

import { attachButtonHandlers } from './buttons';
import { onPointerDown, offsetFromPoint } from './pointer-input';

import { ModeEditor } from './mode-editor';
import { getLatexGroupBody } from './mode-editor-latex';
import './mode-editor-math';
import './mode-editor-text';

import { VirtualKeyboardDelegate } from './remote-virtual-keyboard';
import { validateStyle } from './styling';
import { disposeKeystrokeCaption } from './keystroke-caption';
import {
  defaultGetDefinition,
  getMacroDefinition,
} from '../core/context-utils';

let CORE_STYLESHEET_HASH: string | undefined = undefined;
let MATHFIELD_STYLESHEET_HASH: string | undefined = undefined;

/** @internal */
export class MathfieldPrivate implements GlobalContext, Mathfield {
  readonly model: ModelPrivate;

  private readonly undoManager: UndoManager;

  options: Required<MathfieldOptionsPrivate>;

  mode: ParseMode;
  style: Style;

  dirty: boolean; // If true, need to be redrawn
  smartModeSuppressed: boolean;

  // Placeholders for 'fill-in-the-blank'
  readonly placeholders: Map<
    string,
    { atom: PlaceholderAtom; field: MathfieldElement }
  >;

  private _computeEngine: ComputeEngine;

  readonly element:
    | (HTMLElement & {
        mathfield?: MathfieldPrivate;
      })
    | undefined;

  /** The element from which events are emitted, usually a MathfieldElement */
  readonly host: HTMLElement | undefined;

  readonly field: HTMLElement;
  fieldContent: HTMLElement;
  private virtualKeyboardToggle: HTMLElement;
  readonly ariaLiveText: HTMLElement;
  readonly accessibleNode: HTMLElement;

  atomBoundsCache?: Map<string, Rect>;

  popover?: HTMLElement;
  popoverVisible: boolean;
  suggestionIndex: number;

  keystrokeCaption?: HTMLElement;
  keystrokeCaptionVisible: boolean;

  readonly keyboardDelegate: KeyboardDelegate;
  private _virtualKeyboard?: VirtualKeyboardInterface;

  _keybindings?: Keybinding[]; // Normalized keybindings (raw ones in config)
  keyboardLayout: KeyboardLayoutName;

  inlineShortcutBuffer: {
    state: UndoRecord;
    keystrokes: string;
    leftSiblings: Atom[];
  }[];
  inlineShortcutBufferFlushTimer: ReturnType<typeof setTimeout>;

  keypressSound: null | HTMLAudioElement;
  spacebarKeypressSound: null | HTMLAudioElement;
  returnKeypressSound: null | HTMLAudioElement;
  deleteKeypressSound: null | HTMLAudioElement;
  plonkSound: null | HTMLAudioElement;

  private blurred: boolean;

  // The value of the mathfield when it is focussed.
  // If this value is different when the field is blured
  // the `change` event is dispatched
  private valueOnFocus: string;
  private focusBlurInProgress = false;

  private readonly stylesheets: (null | Stylesheet)[] = [];
  private resizeTimer: ReturnType<typeof requestAnimationFrame>;

  /**
   *
   * - `options.computeEngine`: An instance of a `ComputeEngine`. It is used to parse and serialize
   * LaTeX strings, using the information contained in the dictionaries
   * of the Compute Engine to determine, for example, which symbols are
   * numbers or which are functions, and therefore corectly interpret
   * `bf(x)` as `b \\times f(x)`.
   *
   * If no instance is provided, a new, default, one is created.
   *
   * @param element - The DOM element that this mathfield is attached to.
   * Note that `element.mathfield` is this object.
   */
  constructor(
    element: HTMLElement & { mathfield?: MathfieldPrivate },
    options: Partial<MathfieldOptionsPrivate> & {
      eventSink?: HTMLElement;
      computeEngine?: ComputeEngine;
    }
  ) {
    // Setup default config options
    this.options = updateOptions(
      { ...getDefaultOptions(), registers: getDefaultRegisters(this) },
      options.readOnly
        ? { ...options, virtualKeyboardMode: 'off' }
        : {
            plonkSound: 'plonk.wav',
            keypressSound: {
              spacebar: 'keypress-spacebar.wav',
              return: 'keypress-return.wav',
              delete: 'keypress-delete.wav',
              default: 'keypress-standard.wav',
            },
            ...options,
          }
    );

    if (this.options.virtualKeyboardMode === 'auto')
      this.options.virtualKeyboardMode = isTouchCapable() ? 'onfocus' : 'off';

    if (options.computeEngine) this._computeEngine = options.computeEngine;
    if (options.eventSink) this.host = options.eventSink;

    this.placeholders = new Map();

    this.plonkSound = this.options.plonkSound as HTMLAudioElement;
    if (!this.options.keypressSound) {
      this.keypressSound = null;
      this.spacebarKeypressSound = null;
      this.returnKeypressSound = null;
      this.deleteKeypressSound = null;
    } else if (
      this.options.keypressSound &&
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

    let elementText = options.value ?? this.element.textContent;
    if (elementText) elementText = elementText.trim();

    // Load the fonts, inject the core and mathfield stylesheets
    void loadFonts(this.options.fontsDirectory);
    if (!CORE_STYLESHEET_HASH)
      CORE_STYLESHEET_HASH = hashCode(CORE_STYLESHEET).toString(36);

    this.stylesheets.push(
      injectStylesheet(element, CORE_STYLESHEET, CORE_STYLESHEET_HASH)
    );
    if (!MATHFIELD_STYLESHEET_HASH)
      MATHFIELD_STYLESHEET_HASH = hashCode(MATHFIELD_STYLESHEET).toString(36);

    this.stylesheets.push(
      injectStylesheet(element, MATHFIELD_STYLESHEET, MATHFIELD_STYLESHEET_HASH)
    );

    // Additional elements used for UI.
    // They are retrieved in order a bit later, so they need to be kept in sync

    // 1/ The keyboard event capture element.
    // On touch capable devices, we do not create a textarea to capture keyboard
    // events as this has the side effect of triggering the OS virtual keyboard
    // which we want to avoid
    let markup = "<span class='ML__textarea'>";
    if (isTouchCapable())
      markup += `<span class='ML__textarea__textarea' tabindex="-1" role="textbox"></span>`;
    else {
      markup +=
        '<textarea class="ML__textarea__textarea" autocapitalize="off" autocomplete="off" ' +
        `autocorrect="off" spellcheck="false" aria-hidden="true" tabindex="${
          element.tabIndex ?? 0
        }"></textarea>`;
    }
    markup += '</span>';

    // 2/ The field, where the math equation will be displayed
    markup +=
      '<span part="container" class="ML__container"><span part="content" class="ML__content"></span>';

    // 2.1/ The virtual keyboard toggle
    markup += `<div part='virtual-keyboard-toggle' class="ML__virtual-keyboard-toggle" role="button" data-ML__tooltip="${localize(
      'tooltip.toggle virtual keyboard'
    )}">`;
    markup +=
      this.options.virtualKeyboardToggleGlyph ?? DEFAULT_KEYBOARD_TOGGLE_GLYPH;
    markup += '</div>';

    markup += "<div class='ML__placeholdercontainer'></div>";

    markup += '</span>';

    // 3.1/ The aria-live region for announcements
    // 3.1/ The area to stick MathML for screen reading larger exprs
    // (not used right now). The idea for the area is that focus would bounce
    // there and then back triggering the screen reader to read it

    markup +=
      '<div class="ML__sr-only">' +
      '<span aria-role="status" aria-live="assertive" aria-atomic="true"></span>' +
      '<span></span>' +
      '</div>';

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
    const textarea: HTMLTextAreaElement = this.element.children[iChild++]
      .firstElementChild as HTMLTextAreaElement;
    this.field = this.element.children[iChild].children[0] as HTMLElement;

    iChild++;

    this.virtualKeyboardToggle = this.element.querySelector<HTMLElement>(
      '.ML__virtual-keyboard-toggle'
    )!;

    this.ariaLiveText = this.element.children[iChild]
      .children[0] as HTMLElement;
    this.accessibleNode = this.element.children[iChild++]
      .children[1] as HTMLElement;

    // The keystroke caption panel and the popover are initially hidden
    this.keystrokeCaptionVisible = false;
    this.popoverVisible = false;

    // This index indicates which of the suggestions available to
    // display in the popover panel
    this.suggestionIndex = 0;

    this.inlineShortcutBuffer = [];
    this.inlineShortcutBufferFlushTimer = 0 as unknown as ReturnType<
      typeof setTimeout
    >;

    // The input mode (text, math, command)
    // While model.getMode() represent the mode of the current selection,
    // this.mode is the mode chosen by the user. It indicates the mode the
    // next character typed will be interpreted in.
    // It is often identical to getAnchorMode() since changing the selection
    // changes the mode, but sometimes it is not, for example when a user
    // enters a mode changing command.
    this.mode = effectiveMode(this.options);
    this.smartModeSuppressed = false;

    // Current style (color, weight, italic, etc...):
    // reflects the style to be applied on next insertion.
    this.style = {};

    if (!this.options.readOnly && this.options.virtualKeyboardMode === 'manual')
      this.virtualKeyboardToggle.classList.add('is-visible');
    else this.virtualKeyboardToggle.classList.remove('is-visible');

    if (this.options.readOnly) this.element.classList.add('ML__isReadOnly');
    else this.element.classList.remove('ML__isReadOnly');

    if (this.options.defaultMode === 'inline-math')
      this.element.classList.add('ML__isInline');
    else this.element.classList.remove('ML__isInline');

    // Listen to 'click' events on the part of the field that doesn't have
    // content, so we avoid sending two 'click' events
    this.element
      .querySelector('.ML__content')!
      .addEventListener('click', (evt) => evt.stopImmediatePropagation(), {
        capture: false,
      });

    // Listen to 'wheel' events to scroll (horizontally) the field when it overflows
    this.field.addEventListener('wheel', this, { passive: false });

    attachButtonHandlers(
      (command) => this.executeCommand(command),
      this.virtualKeyboardToggle,
      {
        default: 'toggleVirtualKeyboard',
        alt: 'toggleVirtualKeyboardAlt',
        shift: 'toggleVirtualKeyboardShift',
      }
    );

    // Focus/blur state
    this.blurred = true;
    on(this.element, 'focus', this);
    on(this.element, 'blur', this);

    // Capture clipboard events
    // Delegate keyboard events
    this.keyboardDelegate = delegateKeyboardEvents(textarea, this.element, {
      typedText: (text: string): void => onTypedText(this, text),
      cut: (ev: ClipboardEvent) => {
        // Ignore if in read-only mode
        if (this.options.readOnly) {
          this.model.announce('plonk');
          return;
        }

        if (contentWillChange(this.model, { inputType: 'deleteByCut' })) {
          // Snapshot the undo state
          this.snapshot();

          // Copy to the clipboard
          ModeEditor.onCopy(this, ev);

          // Clearing the selection will have the side effect of clearing the
          // content of the textarea. However, the textarea value is what will
          // be copied to the clipboard (in some cases), so defer the clearing of the selection
          // to later, after the cut operation has been handled.
          setTimeout(() => {
            deleteRange(this.model, range(this.model.selection), 'deleteByCut');
            requestUpdate(this);
          }, 0);
        }
      },
      copy: (ev: ClipboardEvent) => ModeEditor.onCopy(this, ev),
      paste: (ev: ClipboardEvent) => {
        // Ignore if in read-only mode
        let result = true;
        if (this.options.readOnly) result = false;
        if (result) {
          result = ModeEditor.onPaste(
            this.model.at(this.model.position).mode,
            this,
            ev
          );
        }

        if (!result) this.model.announce('plonk');
        return result;
      },
      keystroke: (keystroke, event) => onKeystroke(this, keystroke, event),
      focus: () => this.onFocus(),
      blur: () => this.onBlur(),
      compositionStart: (composition: string) =>
        this.onCompositionStart(composition),
      compositionUpdate: (composition: string) =>
        this.onCompositionUpdate(composition),
      compositionEnd: (composition: string) =>
        this.onCompositionEnd(composition),
    });

    // Delegate mouse and touch events
    if (isBrowser() && 'PointerEvent' in window) {
      // Use modern pointer events if available
      on(this.field, 'pointerdown', this);
    } else on(this.field, 'touchstart:active mousedown', this);

    // Request notification for when the window is resized or the device
    // switched from portrait to landscape, to adjust the UI (popover, etc...)
    on(window, 'resize', this);

    // When the window loses focus, the browser will restore the focus to a
    // textarea element if it had the focus when the window was blured.
    // But it doesn't restore the focus for math-field elements (and other
    // custom elements, presumably). So, listen for when the window loses focus
    // (during the capture phase, before the mathfield potentially loses focus)\
    // then, if this mathfield has focus, listen for when the window regains
    // focus, and restore the focus to this mathfield.

    window.addEventListener(
      'blur',
      () => {
        if (isValidMathfield(this) && this.hasFocus()) {
          window.addEventListener(
            'focus',
            (evt) => {
              if (evt.target === window && isValidMathfield(this)) this.focus();
            },
            { once: true }
          );
        }
      },
      { capture: true }
    );

    // Setup the model
    this.model = new ModelPrivate(
      {
        mode: effectiveMode(this.options),
        macros: this.options.macros as NormalizedMacroDictionary,
        removeExtraneousParentheses: this.options.removeExtraneousParentheses,
      },
      {
        onSelectionDidChange: (_sender): void => this._onSelectionDidChange(),
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
      });
    }

    // Now start recording potentially undoable actions
    this.undoManager.startRecording();
    this.undoManager.snapshot();

    this.model.setListeners({
      onSelectionDidChange: (_sender: ModelPrivate) =>
        this._onSelectionDidChange(),
    });

    if (
      gKeyboardLayout &&
      !this.options.locale.startsWith(gKeyboardLayout.locale)
    )
      setKeyboardLayoutLocale(this.options.locale);

    requestUpdate(this);

    // When fonts are done loading, re-render
    // (the selection highlighting may be out of date due to the HTML layout
    // having been updated with the new font metrics)
    if (isBrowser()) document.fonts.ready.then(() => render(this));
  }

  /** Global Context.
   * These properties are accessed by the atom instances for rendering/layout
   */
  get colorMap(): (name: string) => string | undefined {
    return (name: string): string | undefined => {
      let result: string | undefined = undefined;
      if (typeof this.options?.colorMap === 'function')
        result = this.options.colorMap(name);

      if (!result) result = defaultColorMap(name);

      return result;
    };
  }

  get backgroundColorMap(): (name: string) => string | undefined {
    return (name: string): string | undefined => {
      let result: string | undefined = undefined;
      if (typeof this.options?.backgroundColorMap === 'function')
        result = this.options.backgroundColorMap(name);

      if (!result && typeof this.options.colorMap === 'function')
        result = this.options.colorMap(name);

      if (!result) result = defaultBackgroundColorMap(name);

      return result;
    };
  }

  get fractionNavigationOrder():
    | 'numerator-denominator'
    | 'denominator-numerator' {
    return this.options?.fractionNavigationOrder ?? 'numerator-denominator';
  }

  get placeholderSymbol(): string {
    return this.options?.placeholderSymbol ?? '▢';
  }

  get smartFence(): boolean {
    return this.options?.smartFence ?? false;
  }

  get letterShapeStyle(): 'auto' | 'tex' | 'iso' | 'french' | 'upright' {
    return this.options?.letterShapeStyle ?? 'tex';
  }

  get registers(): Registers {
    return this.options?.registers ?? {};
  }

  getDefinition(
    token: string,
    parseMode: ParseMode = 'math'
  ): TokenDefinition | null {
    return defaultGetDefinition(token, parseMode);
  }

  getMacro(token: string): MacroDefinition | null {
    return getMacroDefinition(
      token,
      this.options.macros as NormalizedMacroDictionary
    );
  }

  get virtualKeyboard(): VirtualKeyboardInterface | undefined {
    if (this.options.readOnly) return undefined;

    // The virtual keyboard can be either attached to this mathfield
    // or a delegate that mirrors a global virtual keyboard attached
    // to the document. This is useful for example when using
    // mathfield in iframes so that all the mathfields share the keyboard
    // at the document level (rather than having one in each iframe)
    // If there is a shared virtual keyboard attached to this document, use it
    // even if `options.useSharedVirtualKeyboard` is false.

    if (!this._virtualKeyboard) {
      if (
        window.mathlive?.sharedVirtualKeyboard ||
        this.options.useSharedVirtualKeyboard
      ) {
        this._virtualKeyboard = new VirtualKeyboardDelegate({
          targetOrigin: this.options.sharedVirtualKeyboardTargetOrigin,
          originValidator: this.options.originValidator,
          mathfield: this,
        });
      } else this._virtualKeyboard = new VirtualKeyboard(this.options, this);
    }
    return this._virtualKeyboard;
  }

  get computeEngine(): ComputeEngine {
    if (!this._computeEngine) {
      this._computeEngine = new ComputeEngine();
      if (this.options.decimalSeparator === ',')
        this._computeEngine.latexOptions.decimalMarker = '{,}';
    }
    return this._computeEngine;
  }

  get virtualKeyboardState(): 'hidden' | 'visible' {
    if (this.virtualKeyboard?.visible) return 'visible';
    return 'hidden';
  }

  set virtualKeyboardState(value: 'hidden' | 'visible') {
    if (!this.virtualKeyboard) return;
    if (value === 'hidden')
      this.virtualKeyboard.executeCommand('hideVirtualKeyboard');
    else if (value === 'visible')
      this.virtualKeyboard.executeCommand('showVirtualKeyboard');
  }

  get keybindings(): Keybinding[] {
    if (this._keybindings) return this._keybindings;

    const [keybindings, errors] = normalizeKeybindings(
      this.options.keybindings,
      getActiveKeyboardLayout() ?? DEFAULT_KEYBOARD_LAYOUT
    );

    if (getActiveKeyboardLayout()?.score > 0) {
      this._keybindings = keybindings;

      if (errors.length > 0) {
        console.error(
          'invalid keybindings for current keyboard layout',
          errors
        );
      }
    }
    return keybindings;
  }

  setOptions(config: Partial<MathfieldOptionsPrivate>): void {
    this.options = updateOptions(this.options, config);
    if (this._computeEngine && 'decimalSeparator' in config) {
      this._computeEngine.latexOptions.decimalMarker =
        this.options.decimalSeparator === ',' ? '{,}' : '.';
    }
    this.model.setListeners({
      onSelectionDidChange: (_sender: ModelPrivate) =>
        this._onSelectionDidChange(),
    });
    this.model.options.macros = this.options
      .macros as NormalizedMacroDictionary;

    if (
      gKeyboardLayout &&
      !this.options.locale.startsWith(gKeyboardLayout.locale)
    )
      setKeyboardLayoutLocale(this.options.locale);

    this._keybindings = undefined;

    this.plonkSound = this.options.plonkSound as HTMLAudioElement;
    if (
      this.options.keypressSound &&
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
      this.element!.classList.add('ML__isReadOnly');
    } else this.element!.classList.remove('ML__isReadOnly');

    if (this.options.defaultMode === 'inline-math')
      this.element!.classList.add('ML__isInline');
    else this.element!.classList.remove('ML__isInline');

    this.virtualKeyboard?.setOptions(this.options);

    if (!this.options.readOnly && this.options.virtualKeyboardMode === 'manual')
      this.virtualKeyboardToggle.classList.add('is-visible');
    else this.virtualKeyboardToggle.classList.remove('is-visible');

    if ('virtualKeyboardToggleGlyph' in config) {
      const toggle = this.element?.querySelector(
        '.ML__virtual-keyboard-toggle'
      );
      if (toggle) {
        toggle.innerHTML = this.options.createHTML(
          this.options.virtualKeyboardToggleGlyph
        );
      }
    }

    // Changing some config options (i.e. `macros`) may
    // require the content to be reparsed and re-rendered
    const content = Atom.serialize(this.model.root, {
      expandMacro: false,
      defaultMode: this.options.defaultMode,
    });
    if ('macros' in config || this.model.getValue() !== content) {
      ModeEditor.insert('math', this.model, content, {
        insertionMode: 'replaceAll',
        selectionMode: 'after',
        format: 'latex',
        suppressChangeNotifications: true,
      });
    }

    requestUpdate(this);
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
    return getOptions(this.options, key) as MathfieldOptionsPrivate[K];
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
    if (!isValidMathfield(this)) return;
    switch (evt.type) {
      case 'focus':
        this.onFocus();
        break;

      case 'blur':
        this.onBlur();
        break;

      case 'touchstart':
      case 'mousedown':
        // iOS <=13 Safari and Firefox on Android
        onPointerDown(this, evt as PointerEvent);
        break;

      case 'pointerdown':
        onPointerDown(this, evt as PointerEvent);
        break;

      case 'resize':
        if (this.resizeTimer) cancelAnimationFrame(this.resizeTimer);

        this.resizeTimer = requestAnimationFrame(
          () => isValidMathfield(this) && this.onResize()
        );
        break;

      case 'wheel':
        this.onWheel(evt as WheelEvent);
        break;

      default:
        console.warn('Unexpected event type', evt.type);
    }
  }

  dispose(): void {
    if (!isValidMathfield(this)) return;

    const element = this.element!;
    delete (this as any).element;
    delete element.mathfield;

    element.innerHTML = this.model.getValue();

    off(element, 'pointerdown', this);
    off(element, 'touchstart:active mousedown', this);
    off(element, 'focus', this);
    off(element, 'blur', this);
    off(window, 'resize', this);
    window.removeEventListener('blur', this, { capture: true });

    delete (this as any).accessibleNode;
    delete (this as any).ariaLiveText;
    delete (this as any).field;
    delete (this as any).fieldContent;
    this.virtualKeyboardToggle.remove();
    delete (this as any).virtualKeyboardToggle;
    if (this._virtualKeyboard) {
      this._virtualKeyboard.dispose();
      delete this._virtualKeyboard;
    }
    disposePopover(this);
    disposeKeystrokeCaption(this);

    this.stylesheets.forEach((x) => x?.release());
  }

  flushInlineShortcutBuffer(options?: { defer: boolean }): void {
    options ??= { defer: false };
    if (!options.defer) {
      this.inlineShortcutBuffer = [];
      clearTimeout(this.inlineShortcutBufferFlushTimer);
      this.inlineShortcutBufferFlushTimer = 0;
      return;
    }
    // If there is a timeout greater than 0, defer the reset
    // If the timeout is 0, never do the reset: regardless of the amount
    // of time between keystrokes, consider them as candidates for
    // a shortcut
    if (this.options.inlineShortcutTimeout > 0) {
      // Set a timer to reset the shortcut buffer
      clearTimeout(this.inlineShortcutBufferFlushTimer);
      this.inlineShortcutBufferFlushTimer = setTimeout(
        () => this.flushInlineShortcutBuffer(),
        this.options.inlineShortcutTimeout
      );
    }
  }

  executeCommand(
    command: SelectorPrivate | [SelectorPrivate, ...unknown[]]
  ): boolean {
    if (getCommandTarget(command) === 'virtual-keyboard')
      return this.virtualKeyboard?.executeCommand(command) ?? false;

    return perform(this, command);
  }

  get errors(): LatexSyntaxError[] {
    return validateLatex(this.model.getValue(), this);
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
    if (options.insertionMode === undefined)
      options.insertionMode = 'replaceAll';

    if (options.format === undefined || options.format === 'auto')
      options.format = 'latex';

    let mode: ParseMode = 'math';
    if (options.mode === undefined || options.mode === 'auto')
      mode = getMode(this.model, this.model.position) ?? 'math';

    if (ModeEditor.insert(mode, this.model, value, options)) {
      this.undoManager.snapshot();
      requestUpdate(this);
    }
  }

  get expression(): BoxedExpression {
    const ce = this.computeEngine;
    return ce.box(ce.parse(this.model.getValue()));
  }

  /** Make sure the caret is visible within the matfield.
   * If the mathfield is inside a mathfield element, make sure the mathfield
   * element is visible in the page
   */
  scrollIntoView(): void {
    if (!this.element) return;

    //
    // 1/ If inside a mathfield element, make sure that element is visible.
    //
    this.host?.scrollIntoView({ block: 'nearest', inline: 'nearest' });

    //
    // 2/ If a render is pending, do it now to make sure we have correct layout
    // and caret position
    //
    if (this.dirty) render(this, { interactive: true });

    //
    // 3/ Get the position of the caret
    //
    const fieldBounds = this.field!.getBoundingClientRect();
    let caretPoint: { x: number; y: number; height: number } | null = null;
    if (this.model.selectionIsCollapsed)
      caretPoint = getCaretPoint(this.field!);
    else {
      const selectionBounds = getSelectionBounds(this);
      if (selectionBounds.length > 0) {
        let maxRight = -Infinity;
        let minTop = -Infinity;
        for (const r of selectionBounds) {
          if (r.right > maxRight) maxRight = r.right;
          if (r.top < minTop) minTop = r.top;
        }

        caretPoint = {
          x: maxRight + fieldBounds.left - this.field!.scrollLeft,
          y: minTop + fieldBounds.top - this.field!.scrollTop,
          height: 0,
        };
      }
    }

    //
    // 4/ Make sure that the caret is vertically visible, but because
    // vertical scrolling of the field occurs via a scroller that includes
    // the field and the virtual keyboard toggle, we'll handle the horizontal
    // scrolling separately
    //
    if (this.host && caretPoint) {
      const hostBounds = this.host.getBoundingClientRect();

      const y = caretPoint.y;
      let top = this.host.scrollTop;
      if (y < hostBounds.top) top = y - hostBounds.top + this.host.scrollTop;
      else if (y > hostBounds.bottom)
        top = y - hostBounds.bottom + this.host.scrollTop + caretPoint.height;
      this.host.scroll({ top, left: 0 });
    }

    //
    // 5/  Make sure the caret is horizontally visible within the field
    //
    if (caretPoint) {
      const x = caretPoint.x - window.scrollX;

      let left = this.field!.scrollLeft;
      if (x < fieldBounds.left)
        left = x - fieldBounds.left + this.field!.scrollLeft - 20;
      else if (x > fieldBounds.right)
        left = x - fieldBounds.right + this.field!.scrollLeft + 20;

      this.field!.scroll({
        top: this.field!.scrollTop, // should always be 0
        left,
      });
    }
  }

  insert(s: string, options?: InsertOptions): boolean {
    if (typeof s === 'string' && s.length > 0) {
      // This code path is used when inserting content from the virtual keyboard
      // (i.e. inserting `\sin`). We need to ignore previous key combinations
      // in this case
      this.flushInlineShortcutBuffer();

      options = options ?? { mode: 'math' };
      if (options.focus) this.focus();

      if (options.feedback) {
        if (this.options.keypressVibration && canVibrate())
          navigator.vibrate(HAPTIC_FEEDBACK_DURATION);

        void this.keypressSound?.play().catch(console.warn);
      }

      if (options.scrollIntoView) this.scrollIntoView();

      if (s === '\\\\') {
        // This string is interpreted as an "insert row after" command
        addRowAfter(this.model);
      } else if (s === '&') addColumnAfter(this.model);
      else {
        const savedStyle = this.style;
        ModeEditor.insert(this.mode, this.model, s, {
          style: this.model.at(this.model.position).computedStyle,
          ...options,
        });
        if (options.resetStyle) this.style = savedStyle;
      }

      this.undoManager.snapshot();
      requestUpdate(this);
      return true;
    }

    return false;
  }

  switchMode(mode: ParseMode, prefix = '', suffix = ''): void {
    if (this.mode === mode || this.options.readOnly) return;
    const currentMode = this.mode;
    const { model } = this;
    model.deferNotifications(
      {
        content: Boolean(suffix) || Boolean(prefix),
        selection: true,
        type: 'insertText',
      },
      (): boolean => {
        let contentChanged = false;
        this.flushInlineShortcutBuffer();
        // Suppress (temporarily) smart mode if switching to/from text or math
        // This prevents switching to/from command mode from suppressing smart mode.
        this.smartModeSuppressed =
          /text|math/.test(this.mode) && /text|math/.test(mode);
        if (prefix && mode !== 'latex') {
          const atoms = parseLatex(prefix, this, { parseMode: mode });
          model.collapseSelection('forward');
          const cursor = model.at(model.position);
          model.position = model.offsetOf(
            cursor.parent!.addChildrenAfter(atoms, cursor)
          );
          contentChanged = true;
        }

        this.mode = mode;

        if (mode === 'latex') {
          let wasCollapsed = model.selectionIsCollapsed;
          // We can have only a single latex group at a time.
          // If a latex group is open, close it first
          complete(this, 'accept');

          // Switch to the command mode keyboard layer
          if (this.virtualKeyboard?.visible)
            this.executeCommand(['switchKeyboardLayer', 'latex-lower']);

          // Insert a latex group atom
          let latex: string;
          let cursor = model.at(model.position);
          if (wasCollapsed) latex = '\\';
          else {
            const selRange = range(model.selection);
            latex = this.model.getValue(selRange, 'latex');
            const extractedAtoms = this.model.extractAtoms(selRange);
            if (
              extractedAtoms.length === 1 &&
              extractedAtoms[0] instanceof PlaceholderAtom
            ) {
              // If we just had a placeholder selected, pretend we had an empty
              // selection
              latex = prefix;
              wasCollapsed = true;
            }
            cursor = model.at(selRange[0]);
          }

          const atom = new LatexGroupAtom(latex, this);
          cursor.parent!.addChildAfter(atom, cursor);
          if (wasCollapsed) model.position = model.offsetOf(atom.lastChild);
          else {
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
          const atoms = parseLatex(suffix, this, { parseMode: currentMode });
          model.collapseSelection('forward');
          const cursor = model.at(model.position);
          model.position = model.offsetOf(
            cursor.parent!.addChildrenAfter(atoms, cursor)
          );
          contentChanged = true;
        }

        // Notify of mode change
        this.host?.dispatchEvent(
          new Event('mode-change', {
            bubbles: true,
            composed: true,
          })
        );
        requestUpdate(this);
        return contentChanged;
      }
    );

    this.mode = mode;
  }

  hasFocus(): boolean {
    return isBrowser() && this.keyboardDelegate.hasFocus();
  }

  focus(options?: { scrollIntoView: boolean }): void {
    this.keyboardDelegate.focus();
    this.model.announce('line');
    if (options?.scrollIntoView ?? true) this.scrollIntoView();
  }

  blur(): void {
    this.keyboardDelegate.blur();
  }

  select(): void {
    this.model.selection = { ranges: [[0, this.model.lastOffset]] };
  }

  applyStyle(inStyle: Style, inOptions: Range | ApplyStyleOptions = {}): void {
    const options: ApplyStyleOptions = {
      operation: 'set',
      suppressChangeNotifications: false,
    };
    if (isRange(inOptions)) options.range = inOptions;
    else {
      options.range = inOptions.range;
      options.suppressChangeNotifications =
        inOptions.suppressChangeNotifications ?? false;
    }
    const style = validateStyle(this, inStyle);
    const operation = options.operation ?? 'set';
    this.model.deferNotifications(
      { content: !options.suppressChangeNotifications, type: 'insertText' },
      () => {
        if (options.range === undefined) {
          this.model.selection.ranges.forEach((range) =>
            applyStyle(this.model, range, style, { operation })
          );
        } else applyStyle(this.model, options.range, style, { operation });
      }
    );
    requestUpdate(this);
  }

  getCaretPoint(): { x: number; y: number } | null {
    const caretOffset = getCaretPoint(this.field!);
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

  getPlaceholderField(placeholderId: string): MathfieldElement | undefined {
    return this.placeholders.get(placeholderId)?.field;
  }

  attachNestedMathfield(): void {
    let needsUpdate = false;
    this.placeholders.forEach((v) => {
      const container = this.field?.querySelector(
        `[data-placeholder-id=${v.atom.placeholderId}]`
      ) as HTMLElement;
      if (container) {
        const placeholderPosition = container.getBoundingClientRect();
        const parentPosition = this.field?.getBoundingClientRect();

        const scaleDownFontsize =
          parseInt(window.getComputedStyle(container).fontSize) * 0.6;

        if (
          !v.field.style.fontSize ||
          Math.abs(scaleDownFontsize - parseFloat(v.field.style.fontSize)) >=
            0.2
        ) {
          needsUpdate = true;
          v.field.style.fontSize = `${scaleDownFontsize}px`;
        }
        const newTop =
          (placeholderPosition?.top ?? 0) -
          (parentPosition?.top ?? 0) +
          (this.element!.offsetTop ?? 0);
        const newLeft =
          (placeholderPosition?.left ?? 0) -
          (parentPosition?.left ?? 0) +
          (this.element!.offsetLeft ?? 0);
        if (
          !v.field.style.left ||
          Math.abs(newLeft - parseFloat(v.field.style.left)) >= 1
        ) {
          needsUpdate = true;
          v.field.style.left = `${newLeft}px`;
        }

        if (
          !v.field.style.top ||
          Math.abs(newTop - parseFloat(v.field.style.top)) >= 1
        ) {
          needsUpdate = true;
          v.field.style.top = `${newTop}px`;
        }
      }
    });

    if (needsUpdate) requestUpdate(this);
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
    if (this.undoManager.snapshot()) {
      this.virtualKeyboard?.executeCommand([
        'onUndoStateChanged',
        this.canUndo(),
        this.canRedo(),
      ]);
      this.host?.dispatchEvent(
        new CustomEvent('undo-state-change', {
          bubbles: true,
          composed: true,
          detail: { type: 'snapshot' },
        })
      );
    }
  }

  snapshotAndCoalesce(): void {
    if (this.undoManager.snapshotAndCoalesce()) {
      this.virtualKeyboard?.executeCommand([
        'onUndoStateChanged',
        this.canUndo(),
        this.canRedo(),
      ]);
      this.host?.dispatchEvent(
        new CustomEvent('undo-state-change', {
          bubbles: true,
          composed: true,
          detail: { type: 'snapshot' },
        })
      );
    }
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
    if (!this.undoManager.undo()) return;
    this.virtualKeyboard?.executeCommand([
      'onUndoStateChanged',
      this.canUndo(),
      this.canRedo(),
    ]);
    this.host?.dispatchEvent(
      new CustomEvent('undo-state-change', {
        bubbles: true,
        composed: true,
        detail: { type: 'undo' },
      })
    );
  }

  redo(): void {
    if (!this.undoManager.redo()) return;
    this.virtualKeyboard?.executeCommand([
      'onUndoStateChanged',
      this.canUndo(),
      this.canRedo(),
    ]);
    this.host?.dispatchEvent(
      new CustomEvent('undo-state-change', {
        bubbles: true,
        composed: true,
        detail: { type: 'undo' },
      })
    );
  }

  private _onSelectionDidChange(): void {
    // Keep the content of the textarea in sync with the selection.
    // This will allow cut/copy to work.
    this.keyboardDelegate.setValue(
      this.model.getValue(this.model.selection, 'latex-expanded')
    );
    const selectedAtoms = this.model.getAtoms(this.model.selection);
    if (selectedAtoms.length === 1 && selectedAtoms[0].type === 'placeholder') {
      const placeholder = selectedAtoms[0] as PlaceholderAtom;
      if (this.model.mathfield.placeholders.has(placeholder.placeholderId!)) {
        this.model.mathfield.placeholders
          .get(placeholder.placeholderId!)
          ?.field.focus();
      }
    }
    // Adjust mode
    {
      const cursor = this.model.at(this.model.position);
      const newMode = cursor.mode ?? effectiveMode(this.options);
      if (this.mode !== newMode) {
        if (this.mode === 'latex') {
          complete(this, 'accept', { mode: newMode });
          this.model.position = this.model.offsetOf(cursor);
        } else this.switchMode(newMode);
      }
    }

    // Dispatch `selection-change` event
    this.host?.dispatchEvent(
      new Event('selection-change', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private onFocus(): void {
    if (this.focusBlurInProgress || !this.blurred) return;
    this.focusBlurInProgress = true;
    this.blurred = false;
    this.keyboardDelegate.focus();

    this.virtualKeyboard?.setOptions(this.options);

    this.virtualKeyboard?.enable();

    if (this.options.virtualKeyboardMode === 'onfocus')
      this.executeCommand('showVirtualKeyboard');

    updatePopoverPosition(this);
    render(this, { interactive: true });

    this.host?.dispatchEvent(
      new Event('focus', {
        bubbles: false, // DOM 'focus' and 'blur' don't bubble
        composed: true,
      })
    );

    // Save the current value.
    // It will be compared in `onBlur()` to see if the
    // `change` event needs to be dispatched. This
    // mimic the `<input>` and `<textarea>` behavior
    this.valueOnFocus = this.model.getValue();

    this.focusBlurInProgress = false;
  }

  private onBlur(): void {
    if (this.focusBlurInProgress || this.blurred) return;
    this.focusBlurInProgress = true;

    this.blurred = true;
    this.ariaLiveText!.textContent = '';

    complete(this, 'accept');
    if (this.model.getValue() !== this.valueOnFocus)
      this.executeCommand('commit');

    if (
      !window.mathlive?.sharedVirtualKeyboard &&
      /onfocus|manual/.test(this.options.virtualKeyboardMode)
    )
      this.executeCommand('hideVirtualKeyboard');

    this.virtualKeyboard?.disable();

    this.host?.dispatchEvent(
      new Event('blur', {
        bubbles: false, // DOM 'focus' and 'blur' don't bubble
        composed: true,
      })
    );

    requestUpdate(this);

    this.focusBlurInProgress = false;
  }

  private onCompositionStart(_composition: string): void {
    // Clear the selection if there is one
    this.model.deleteAtoms(range(this.model.selection));
    requestAnimationFrame(() => {
      render(this); // Recalculate the position of the caret
      // Synchronize the location and style of textarea
      // so that the IME candidate window can align with the composition
      const caretPoint = getCaretPoint(this.field!);
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
    updatePopoverPosition(this);
  }

  private onWheel(ev: WheelEvent): void {
    const wheelDelta = 5 * ev.deltaX;
    if (!Number.isFinite(wheelDelta) || wheelDelta === 0) return;

    const field = this.field!;

    if (wheelDelta < 0 && field.scrollLeft === 0) return;

    if (
      wheelDelta > 0 &&
      field.offsetWidth + field.scrollLeft >= field.scrollWidth
    )
      return;

    field.scrollBy({ top: 0, left: wheelDelta });
    ev.preventDefault();
    ev.stopPropagation();
  }
}
