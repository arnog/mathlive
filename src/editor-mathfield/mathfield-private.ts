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

import { canVibrate } from '../common/capabilities';
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
import { UndoManager } from '../editor/undo';
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
import { ModelState } from '../editor-model/model-private';

import { onInput, onKeystroke } from './keyboard-input';
import { complete } from './autocomplete';
import { requestUpdate, render } from './render';

import './commands';
import './styling';

import {
  getCaretPoint,
  getSelectionBounds,
  isValidMathfield,
  Rect,
  validateOrigin,
} from './utils';

import { attachButtonHandlers } from './buttons';
import { onPointerDown, offsetFromPoint } from './pointer-input';

import { ModeEditor } from './mode-editor';
import { getLatexGroupBody } from './mode-editor-latex';
import './mode-editor-math';
import './mode-editor-text';

import { validateStyle } from './styling';
import { disposeKeystrokeCaption } from './keystroke-caption';
import {
  defaultGetDefinition,
  getMacroDefinition,
} from '../core/context-utils';
import { PromptAtom } from '../core-atoms/prompt';
import {
  isKeyboardMessage,
  VirtualKeyboard,
  VIRTUAL_KEYBOARD_MESSAGE,
} from '../editor/virtual-keyboard-utils';

let CORE_STYLESHEET_HASH: string | undefined = undefined;
let MATHFIELD_STYLESHEET_HASH: string | undefined = undefined;

/** @internal */
export class MathfieldPrivate implements GlobalContext, Mathfield {
  readonly model: ModelPrivate;

  private readonly undoManager: UndoManager;

  options: Required<MathfieldOptionsPrivate>;

  mode: ParseMode;
  style: Style;
  // When inserting new characters, if not `"none"`, adopt the style
  // (up variant, etc..) from the previous or following atom.
  adoptStyle: 'left' | 'right' | 'none';

  dirty: boolean; // If true, need to be redrawn
  smartModeSuppressed: boolean;

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
  // readonly accessibleMathML: HTMLElement;

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
    state: ModelState;
    keystrokes: string[];
    leftSiblings: Atom[];
  }[];
  inlineShortcutBufferFlushTimer: ReturnType<typeof setTimeout>;

  private blurred: boolean;

  // The value of the mathfield when it is focussed.
  // If this value is different when the field is blured
  // the `change` event is dispatched
  private valueOnFocus: string;
  private focusBlurInProgress = false;

  private readonly stylesheets: (null | Stylesheet)[] = [];
  private resizeTimer: ReturnType<typeof requestAnimationFrame>;

  /** When true, the mathfield is listening to the virtual keyboard */
  private connectedToVirtualKeyboard: boolean;

  /**
   *
   * - `options.computeEngine`: An instance of a `ComputeEngine`. It is used to parse and serialize
   * LaTeX strings, using the information contained in the dictionaries
   * of the Compute Engine to determine, for example, which symbols are
   * numbers or which are functions, and therefore correctly interpret
   * `bf(x)` as `b \\times f(x)`.
   *
   * If no instance is provided, a new default one is created.
   *
   * @param element - The DOM element that this mathfield is attached to.
   * Note that `element.mathfield` is this object.
   */
  constructor(
    element: HTMLElement & { mathfield?: MathfieldPrivate },
    options: Partial<MathfieldOptionsPrivate> & {
      eventSink?: HTMLElement;
    }
  ) {
    // Setup default config options
    this.options = updateOptions(
      { ...getDefaultOptions(), registers: getDefaultRegisters(this) },
      options
    );

    if (options.eventSink) this.host = options.eventSink;

    this.element = element;
    element.mathfield = this;

    // Load the fonts, inject the core and mathfield stylesheets
    void loadFonts();
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
    const markup: string[] = [];

    // const accessibleNodeID =
    //   Date.now().toString(36).slice(-2) +
    //   Math.floor(Math.random() * 0x186a0).toString(36);
    // Add "aria-labelledby="${accessibleNodeID}"" to the keyboard sink

    // 1/ The keyboard event capture element.
    markup.push(
      `<span contenteditable=true aria-multiline=false class=ML__keyboard-sink autocapitalize=off autocomplete=off autocorrect=off spellcheck=false inputmode=none tabindex=${
        element.tabIndex ?? 0
      }></span>`
    );

    // 2/ The field, where the math equation will be displayed
    markup.push('<span part=container class=ML__container aria-hidden=true>');
    markup.push('<span part=content class=ML__content></span>');

    // 2.1/ The virtual keyboard toggle
    markup.push(
      `<div part=virtual-keyboard-toggle class=ML__virtual-keyboard-toggle role=button data-ML__tooltip="${localize(
        'tooltip.toggle virtual keyboard'
      )}">`
    );
    markup.push(DEFAULT_KEYBOARD_TOGGLE_GLYPH);
    markup.push('</div>');

    markup.push('<div class=ML__placeholdercontainer></div>');

    markup.push('</span>');

    // 3.1/ The aria-live region for announcements

    markup.push('<div class=ML__sr-only>');
    markup.push(
      '<span role=status aria-live=assertive aria-atomic=true></span>'
    );

    // markup.push(
    //   `<span class=accessibleMathML id="${accessibleNodeID}"></span>`
    // );
    markup.push('</div>');

    this.element.innerHTML = window.MathfieldElement.createHTML(
      markup.join('')
    );
    if (!this.element.children) {
      console.error(
        '%cMathLive: Something went wrong and the mathfield could not be created.%c\n' +
          'If you are using Vue, this may be because you are using the ' +
          'runtime-only build of Vue. Make sure to include ' +
          "'runtimeCompiler: true' in your Vue configuration. There" +
          'may a warning from Vue in the log above.',

        'color:red;font-family:system-ui;font-size:1.2rem;font-weight:bold',
        'color:inherit;font-family:system-ui;font-size:inherit;font-weight:inherit'
      );
      return;
    }

    this.field = this.element.querySelector('[part=content]')!;

    // Listen to 'click' events on the part of the field that doesn't have
    // content, so we avoid sending two 'click' events
    this.field.addEventListener(
      'click',
      (evt) => evt.stopImmediatePropagation(),
      { capture: false }
    );

    // Listen to 'wheel' events to scroll (horizontally) the field when it overflows
    this.field.addEventListener('wheel', this, { passive: false });

    // Delegate pointer events
    if ('PointerEvent' in window)
      this.field.addEventListener('pointerdown', this);
    else this.field.addEventListener('mousedown', this);

    this.virtualKeyboardToggle = this.element.querySelector<HTMLElement>(
      '[part=virtual-keyboard-toggle]'
    )!;
    if (!this.options.readOnly)
      this.virtualKeyboardToggle.classList.add('is-visible');
    else this.virtualKeyboardToggle.classList.remove('is-visible');

    attachButtonHandlers(
      this.virtualKeyboardToggle,
      (command) => this.executeCommand(command),
      {
        default: 'toggleVirtualKeyboard',
        shift: 'toggleVirtualKeyboardShift',
      }
    );

    this.ariaLiveText = this.element.querySelector('[role=status]')!;
    // this.accessibleMathML = this.element.querySelector('.accessibleMathML')!;

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
    this.adoptStyle = 'left';

    if (this.options.readOnly) this.element.classList.add('ML__isReadOnly');
    else this.element.classList.remove('ML__isReadOnly');

    if (this.options.defaultMode === 'inline-math')
      this.element.classList.add('ML__isInline');
    else this.element.classList.remove('ML__isInline');

    // Focus/blur state
    this.blurred = true;

    // Capture clipboard events
    // Delegate keyboard events
    this.keyboardDelegate = delegateKeyboardEvents(
      this.element.querySelector('.ML__keyboard-sink')!,
      this.element,
      {
        onFocus: () => this.onFocus(),
        onBlur: () => this.onBlur(),
        onInput: (text) => onInput(this, text),
        onKeystroke: (keystroke, event) => onKeystroke(this, keystroke, event),
        onCompositionStart: (composition) =>
          this.onCompositionStart(composition),
        onCompositionUpdate: (composition) =>
          this.onCompositionUpdate(composition),
        onCompositionEnd: (composition) => this.onCompositionEnd(composition),
        onCut: (ev) => {
          // Ignore if in read-only mode
          if (this.promptSelectionLocked) {
            this.model.announce('plonk');
            return;
          }

          if (contentWillChange(this.model, { inputType: 'deleteByCut' })) {
            // Snapshot the undo state
            this.snapshot();

            // Copy to the clipboard
            ModeEditor.onCopy(this, ev);

            // Delete the selection
            deleteRange(this.model, range(this.model.selection), 'deleteByCut');

            requestUpdate(this);
          }
        },
        onCopy: (ev) => ModeEditor.onCopy(this, ev),
        onPaste: (ev) => {
          // Ignore if in read-only mode
          let result = !this.promptSelectionLocked;

          if (result) {
            result = ModeEditor.onPaste(
              this.model.at(this.model.position).mode,
              this,
              ev.clipboardData
            );
          }

          if (!result) this.model.announce('plonk');

          ev.preventDefault();
          ev.stopPropagation();
          return result;
        },
      }
    );

    // Request notification for when the window is resized or the device
    // switched from portrait to landscape, to adjust the UI (popover, etc...)
    window.addEventListener('resize', this);

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
        onSelectionDidChange: () => this._onSelectionDidChange(),
      },
      this
    );

    // Prepare to manage undo/redo
    this.undoManager = new UndoManager(this.model);

    // Use the content of the element for the initial value of the mathfield
    let elementText = options.value ?? this.element.textContent;
    if (elementText) elementText = elementText.trim();
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

    if (
      gKeyboardLayout &&
      !this.options.locale.startsWith(gKeyboardLayout.locale)
    )
      setKeyboardLayoutLocale(this.options.locale);

    requestUpdate(this);

    // When fonts are done loading, re-render
    // (the selection highlighting may be out of date due to the HTML layout
    // having been updated with the new font metrics)
    document.fonts.ready.then(() => render(this));
  }

  connectToVirtualKeyboard(): void {
    if (this.connectedToVirtualKeyboard) return;
    this.connectedToVirtualKeyboard = true;
    globalThis.addEventListener('message', this);
    VirtualKeyboard.singleton.updateToolbar(this);
  }

  disconnectFromVirtualKeyboard(): void {
    if (!this.connectedToVirtualKeyboard) return;
    globalThis.removeEventListener('message', this);
    this.connectedToVirtualKeyboard = false;
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

  get readOnly(): boolean {
    return this.options?.readOnly ?? false;
  }

  /** returns true if readOnly and at least one ID'd placeholder */
  get prompting(): boolean {
    return (
      this.readOnly &&
      this.model
        .getAllAtoms(0)
        .some((a: PromptAtom) => a.type === 'prompt' && !a.captureSelection)
    );
  }

  /** Returns true if mathfield is in readOnly mode and selection not contained to a single ID'd placeholder */
  get promptSelectionLocked(): boolean {
    if (!this.readOnly) return false;
    const anchor = this.model.at(this.model.anchor);
    const cursor = this.model.at(this.model.position);

    const ancestor = Atom.commonAncestor(anchor, cursor);

    if (ancestor?.inEditablePrompt) return false;

    return true;
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

  get computeEngine(): ComputeEngine | null {
    if (this._computeEngine === undefined) {
      const ComputeEngineCtor =
        globalThis[Symbol.for('io.cortexjs.compute-engine')]?.ComputeEngine;
      if (ComputeEngineCtor) this._computeEngine = new ComputeEngineCtor();
      else {
        console.error(
          'MathLive: The CortexJS Compute Engine library is not available.\nLoad the library, for example with:\nimport "https://unpkg.com/@cortex-js/compute-engine?module"'
        );
      }
      if (this._computeEngine && this.options.decimalSeparator === ',')
        this._computeEngine.latexOptions.decimalMarker = '{,}';
    }
    return this._computeEngine ?? null;
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
          'MathLive: Invalid keybindings for current keyboard layout',
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

    if (this.options.defaultMode === 'inline-math')
      this.element!.classList.add('ML__isInline');
    else this.element!.classList.remove('ML__isInline');

    if (this.options.readOnly) {
      if (this.hasFocus() && VirtualKeyboard.singleton.visible)
        this.executeCommand('hideVirtualKeyboard');
      this.onBlur();
      this.element!.classList.add('ML__isReadOnly');
    } else this.element!.classList.remove('ML__isReadOnly');

    VirtualKeyboard.singleton.setOptions(this.options);

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
   * handleEvent is a function invoked when an event is registered with an
   * object.
   * The name is defined by `addEventListener()` and cannot be changed.
   * This pattern is used to be able to release bound event handlers,
   * (event handlers that need access to `this`) as the `bind()` function
   * would create a new function that would have to be kept track of
   * to be able to properly remove the event handler later.
   */
  handleEvent(evt: Event): void {
    if (!isValidMathfield(this)) return;
    if (isKeyboardMessage(evt)) {
      if (
        !validateOrigin(
          evt.origin,
          this.options.originValidator ?? 'same-origin'
        )
      ) {
        throw new Error(
          `Message from unknown origin (${evt.origin}) cannot be handled`
        );
      }

      const { action } = evt.data;

      if (action === 'execute-command') {
        // Avoid an infinite messages loop if within one window
        if (
          getCommandTarget(evt.data.command!) === 'virtual-keyboard' &&
          window === globalThis.parent
        )
          return;

        this.executeCommand(evt.data.command!);
      } else if (action === 'update-state') {
      } else if (action === 'focus') this.focus?.();
      else if (action === 'blur') this.blur?.();
      else if (action === 'update-toolbar')
        VirtualKeyboard.singleton.updateToolbar(this);
      return;
    }

    switch (evt.type) {
      case 'focus':
        this.onFocus();
        break;

      case 'blur':
        this.onBlur();
        break;

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

  private sendMessage(action: string, payload: any = {}): boolean {
    if (!globalThis.parent) return false;
    globalThis.parent.postMessage(
      {
        type: VIRTUAL_KEYBOARD_MESSAGE,
        action,
        ...payload,
      },
      this.options.virtualKeyboardTargetOrigin ?? globalThis.origin ?? '*'
    );

    return true;
  }

  dispose(): void {
    if (!isValidMathfield(this)) return;

    this.disconnectFromVirtualKeyboard();

    const element = this.element!;
    delete (this as any).element;
    delete element.mathfield;

    element.innerHTML = this.model.getValue();

    element.removeEventListener('pointerdown', this);
    element.removeEventListener('mousedown', this);
    element.removeEventListener('focus', this);
    element.removeEventListener('blur', this);
    window.removeEventListener('resize', this);
    window.removeEventListener('blur', this, { capture: true });

    // delete (this as any).accessibleMathML;
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
    if (getCommandTarget(command) === 'virtual-keyboard') {
      this.focus();
      this.sendMessage('execute-command', { command });
      requestAnimationFrame(() =>
        VirtualKeyboard.singleton.updateToolbar(this)
      );
      return false;
    }
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

  get expression(): BoxedExpression | null {
    const ce = this.computeEngine;
    if (!ce) return null;
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
        if (window.mathVirtualKeyboard.keypressVibration && canVibrate())
          navigator.vibrate(HAPTIC_FEEDBACK_DURATION);

        window.MathfieldElement.playSound('keypress');
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

    // Dispatch event with option of canceling
    if (
      !this.host?.dispatchEvent(
        new Event('mode-change', {
          bubbles: true,
          composed: true,
          cancelable: true,
        })
      )
    )
      return;

    // Notify of mode change
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

        requestUpdate(this);
        return contentChanged;
      }
    );

    this.mode = mode;
  }

  hasFocus(): boolean {
    return this.keyboardDelegate.hasFocus();
  }

  focus(options?: { scrollIntoView: boolean }): void {
    if (this.hasFocus()) return;
    this.keyboardDelegate.focus();
    this.connectToVirtualKeyboard();
    this.model.announce('line');
    if (options?.scrollIntoView ?? true) this.scrollIntoView();
  }

  blur(): void {
    if (!this.hasFocus()) return;
    this.disconnectFromVirtualKeyboard();
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

  getPrompt(id: string): PromptAtom {
    const prompts = this.model
      .getAllAtoms(0)
      .filter((a) => a.type === 'prompt') as PromptAtom[];
    const promptsWithID = prompts.filter((a) => a.placeholderId === id);
    console.assert(
      promptsWithID.length > 0,
      'no prompts with matching ID found'
    );
    console.assert(promptsWithID.length < 2, 'duplicate prompt IDs found');
    return promptsWithID[0];
  }

  getPromptContent(id: string): string {
    return this.getPrompt(id).bodyToLatex({ defaultMode: 'math' });
  }

  get prompts(): string[] {
    return this.model
      .getAllAtoms(0)
      .filter((a) => a.type === 'prompt')
      .map((a) => a.bodyToLatex({ defaultMode: 'math' }));
  }

  setPromptContent(id: string, content?: string): void {
    if (content !== undefined)
      this.getPrompt(id).body = parseLatex(content, this);
    requestUpdate(this);
  }

  setPromptCorrectness(
    id: string,
    correctness: 'correct' | 'incorrect' | undefined
  ): void {
    this.getPrompt(id).correctness = correctness;
    requestUpdate(this);
  }

  setPromptLocked(id: string, locked: boolean): void {
    this.getPrompt(id).locked = locked;
    this.getPrompt(id).captureSelection = locked;
    requestUpdate(this);
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
      VirtualKeyboard.singleton.updateToolbar(this);
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
      VirtualKeyboard.singleton.updateToolbar(this);
      this.host?.dispatchEvent(
        new CustomEvent('undo-state-change', {
          bubbles: true,
          composed: true,
          detail: { type: 'snapshot' },
        })
      );
    }
  }

  undo(): void {
    if (!this.undoManager.undo()) return;
    VirtualKeyboard.singleton.updateToolbar(this);
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
    VirtualKeyboard.singleton.updateToolbar(this);
    this.host?.dispatchEvent(
      new CustomEvent('undo-state-change', {
        bubbles: true,
        composed: true,
        detail: { type: 'undo' },
      })
    );
  }

  resetUndo(): void {
    this.undoManager?.reset();
  }

  private _onSelectionDidChange(): void {
    const model = this.model;

    // Keep the content of the keyboard sink in sync with the selection.
    // Safari will not dispatch cut/copy/paste unless there is a DOM selection.
    this.keyboardDelegate.setValue(
      this.model.getValue(this.model.selection, 'latex-expanded')
    );

    // Adjust mode
    {
      const cursor = model.at(model.position);
      const newMode = cursor.mode ?? effectiveMode(this.options);
      if (this.mode !== newMode) {
        if (this.mode === 'latex') {
          complete(this, 'accept', { mode: newMode });
          model.position = model.offsetOf(cursor);
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

    VirtualKeyboard.singleton.setOptions(this.options);

    VirtualKeyboard.singleton.connect();

    updatePopoverPosition(this);
    render(this, { interactive: true });

    this.host?.dispatchEvent(
      new FocusEvent('focus', {
        bubbles: false, // DOM 'focus' and 'blur' don't bubble
        composed: true,
      })
    );
    // Note: a `focus-in` event is automatically dispatched

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

    if (this.model.getValue() !== this.valueOnFocus) {
      this.host?.dispatchEvent(
        new Event('change', { bubbles: true, composed: true })
      );
    }

    this.disconnectFromVirtualKeyboard();

    this.host?.dispatchEvent(
      new Event('blur', {
        bubbles: false, // DOM 'focus' and 'blur' don't bubble
        composed: true,
      })
    );

    this.host?.dispatchEvent(
      new UIEvent('focusout', {
        bubbles: true, // unlike 'blur', focusout does bubble
        composed: true,
      })
    );

    requestUpdate(this);

    this.focusBlurInProgress = false;
  }

  private onCompositionStart(_composition: string): void {
    // Clear the selection if there is one
    this.model.deleteAtoms(range(this.model.selection));
    const caretPoint = getCaretPoint(this.field!);
    if (!caretPoint) return;
    requestAnimationFrame(() => {
      render(this); // Recalculate the position of the caret
      // Synchronize the location and style of the keyboard sink
      // so that the IME candidate window can align with the composition
      this.keyboardDelegate.moveTo(
        caretPoint.x,
        caretPoint.y - caretPoint.height
      );
    });
  }

  private onCompositionUpdate(composition: string): void {
    updateComposition(this.model, composition);
    requestUpdate(this);
  }

  private onCompositionEnd(composition: string): void {
    removeComposition(this.model);
    onInput(this, composition, {
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

  getHTMLElement(atom: Atom): HTMLSpanElement {
    // find an atom id in this atom or its children
    let target = atom;
    while (!target.id && target.hasChildren) target = atom.children[0];

    if (target.id) {
      return this.fieldContent!.querySelector(
        `[data-atom-id="${target.id}"]`
      ) as HTMLSpanElement;
    }
    throw new TypeError('Could not get an ID from atom');
  }
}
