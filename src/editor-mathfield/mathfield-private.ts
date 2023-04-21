import type { BoxedExpression } from '@cortex-js/compute-engine';

// @ts-ignore-error
import MATHFIELD_STYLESHEET from '../../css/mathfield.less';
// @ts-ignore-error
import CORE_STYLESHEET from '../../css/core.less';

import type { Keybinding, KeyboardLayoutName } from '../public/options';
import type {
  Mathfield,
  InsertOptions,
  OutputFormat,
  Offset,
  Range,
  Selection,
  ApplyStyleOptions,
} from '../public/mathfield';

import { canVibrate } from '../common/capabilities';
import { hashCode } from '../common/hash-code';
import { Stylesheet, inject as injectStylesheet } from '../common/stylesheet';

import { Atom } from '../core/atom-class';
import { gFontsState } from '../core/fonts';
import { defaultBackgroundColorMap, defaultColorMap } from '../core/color';
import {
  TokenDefinition,
  defaultGetDefinition,
  getMacroDefinition,
} from '../core-definitions/definitions-utils';
import { LatexGroupAtom } from '../core-atoms/latex';
import { parseLatex, validateLatex } from '../core/parser';
import { getDefaultRegisters } from '../core/registers';

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
import { l10n, localize } from '../core/l10n';
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
import {
  requestUpdate,
  render,
  renderSelection,
  contentMarkup,
} from './render';

import './commands';
import './styling';
import {
  getCaretPoint,
  getSelectionBounds,
  isValidMathfield,
  Rect,
  validateOrigin,
} from './utils';

import { onPointerDown, offsetFromPoint } from './pointer-input';

import { ModeEditor } from './mode-editor';
import { getLatexGroupBody } from './mode-editor-latex';
import './mode-editor-math';
import './mode-editor-text';

import { validateStyle } from './styling';
import { disposeKeystrokeCaption } from './keystroke-caption';
import { PromptAtom } from '../core-atoms/prompt';
import { isVirtualKeyboardMessage } from '../virtual-keyboard/proxy';
import '../public/mathfield-element';

import '../virtual-keyboard/virtual-keyboard';
import '../virtual-keyboard/global';

import type {
  ParseMode,
  Style,
  NormalizedMacroDictionary,
  Registers,
  MacroDefinition,
  LatexSyntaxError,
} from '../public/core-types';
import type { GlobalContext } from '../core/types';
import { makeProxy } from '../virtual-keyboard/mathfield-proxy';

let CORE_STYLESHEET_HASH: string | undefined = undefined;
let MATHFIELD_STYLESHEET_HASH: string | undefined = undefined;

const DEFAULT_KEYBOARD_TOGGLE_GLYPH = `<svg style="width: 21px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M528 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm16 336c0 8.823-7.177 16-16 16H48c-8.823 0-16-7.177-16-16V112c0-8.823 7.177-16 16-16h480c8.823 0 16 7.177 16 16v288zM168 268v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-336 80v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm384 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zM120 188v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-96 152v-8c0-6.627-5.373-12-12-12H180c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h216c6.627 0 12-5.373 12-12z"/></svg>`;

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

  readonly element:
    | (HTMLElement & {
        mathfield?: MathfieldPrivate;
      })
    | undefined;

  /** The element from which events are emitted, usually a MathfieldElement */
  readonly host: HTMLElement | undefined;

  readonly field: HTMLElement;
  fieldContent: HTMLElement;
  readonly ariaLiveText: HTMLElement;
  // readonly accessibleMathML: HTMLElement;

  atomBoundsCache?: Map<string, Rect>;

  popover?: HTMLElement;
  popoverVisible: boolean;
  suggestionIndex: number;

  envPopover?: HTMLElement;
  envPopoverVisible: boolean;

  keystrokeCaption?: HTMLElement;
  keystrokeCaptionVisible: boolean;

  readonly keyboardDelegate: KeyboardDelegate;

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
  private geometryChangeTimer: ReturnType<typeof requestAnimationFrame>;

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

    // Inject the core and mathfield stylesheets
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

    // Focus/blur state
    this.blurred = true;

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

    if (this.options.defaultMode === 'inline-math')
      this.element.classList.add('ML__is-inline');
    else this.element.classList.remove('ML__is-inline');

    this.dirty = false;

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

    // Additional elements used for UI.
    const markup: string[] = [];

    // const accessibleNodeID =
    //   Date.now().toString(36).slice(-2) +
    //   Math.floor(Math.random() * 0x186a0).toString(36);
    // Add "aria-labelledby="${accessibleNodeID}"" to the keyboard sink

    // 1/ The keyboard event capture element.
    markup.push(
      `<span contenteditable=true aria-multiline=false part=keyboard-sink class=ML__keyboard-sink autocapitalize=off autocomplete=off autocorrect=off spellcheck=false inputmode=none tabindex=0></span>`
    );

    // 2/ The field, where the math equation will be displayed

    // Start with hidden content to minimize flashing during creation
    // The visibility will be reset during render
    markup.push(
      '<span part=container class=ML__container aria-hidden=true  style="visibility:hidden">'
    );
    markup.push('<span part=content class=ML__content>');
    markup.push(contentMarkup(this));
    markup.push('</span>');

    // 2.1/ The virtual keyboard toggle
    markup.push(
      `<div part=virtual-keyboard-toggle class=ML__virtual-keyboard-toggle role=button ${
        this.hasEditableContent ? '' : 'style="display:none;"'
      }data-ML__tooltip="${localize('tooltip.toggle virtual keyboard')}">`
    );
    markup.push(DEFAULT_KEYBOARD_TOGGLE_GLYPH);
    markup.push('</div>');

    markup.push('</span>'); // end container

    // 3.1/ The aria-live region for announcements

    markup.push('<span class=ML__sr-only>');
    markup.push(
      '<span role=status aria-live=assertive aria-atomic=true></span>'
    );

    // markup.push(
    //   `<span class=accessibleMathML id="${accessibleNodeID}"></span>`
    // );
    markup.push('</span>');

    this.element.innerHTML = window.MathfieldElement.createHTML(
      markup.join('')
    );
    if (!this.element.children) {
      console.error(
        `%cMathLive {{SDK_VERSION}}: Something went wrong and the mathfield could not be created.%c
If you are using Vue, this may be because you are using the runtime-only build of Vue. Make sure to include \`runtimeCompiler: true\` in your Vue configuration. There may a warning from Vue in the log above.`,
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

    this.element
      .querySelector<HTMLElement>('[part=virtual-keyboard-toggle]')
      ?.addEventListener('click', () => {
        if (window.mathVirtualKeyboard.visible)
          window.mathVirtualKeyboard.hide();
        else {
          window.mathVirtualKeyboard.show({ animate: true });
          window.mathVirtualKeyboard.update(makeProxy(this));
        }
      });

    this.ariaLiveText = this.element.querySelector('[role=status]')!;
    // this.accessibleMathML = this.element.querySelector('.accessibleMathML')!;

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
          if (!this.isSelectionEditable) {
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
          let result = this.isSelectionEditable;

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

    // Request notification for when the window is resized, the device
    // switched from portrait to landscape or the document is scrolled
    // to adjust the UI (popover, etc...)
    window.addEventListener('resize', this);
    document.addEventListener('scroll', this);

    // When the window loses focus, the browser will restore the focus to a
    // textarea element if it had the focus when the window was blured.
    // But it doesn't restore the focus for math-field elements (and other
    // custom elements, presumably). So, listen for when the window loses focus
    // (during the capture phase, before the mathfield potentially loses focus)\
    // then, if this mathfield has focus, listen for when the window regains
    // focus, and restore the focus to this mathfield.
    // Check for window.top, i.e. that we're not in an iframe. The "window"
    // object of an iframe also gets sent a blur event when the frame loses focus

    if (window === window.top) {
      window.addEventListener(
        'blur',
        (event) => {
          if (!event.relatedTarget && isValidMathfield(this) && this.hasFocus()) {
            window.addEventListener(
              'focus',
              (evt) => {
                if (evt.target === window && isValidMathfield(this))
                  this.focus({ preventScroll: true });
              },
              { once: true }
            );
          }
        },
        { capture: true }
      );
    }
    // Now start recording potentially undoable actions
    this.undoManager.startRecording();
    this.undoManager.snapshot();

    if (gKeyboardLayout && !l10n.locale.startsWith(gKeyboardLayout.locale))
      setKeyboardLayoutLocale(l10n.locale);

    // When fonts are done loading, re-render
    // (the selection highlighting may be out of date due to the HTML layout
    // having been updated with the new font metrics)
    if (gFontsState !== 'ready')
      document.fonts.ready.then(() => renderSelection(this));

    // The mathfield container is initially set with a visibility of hidden
    // to minimize flashing during construction.
    element
      .querySelector<HTMLElement>('.ML__container')!
      .style.removeProperty('visibility');
  }

  connectToVirtualKeyboard(): void {
    if (this.connectedToVirtualKeyboard) return;
    this.connectedToVirtualKeyboard = true;
    window.addEventListener('message', this);
    // Connect the kbd or kbd proxy to the current window
    window.mathVirtualKeyboard.connect();
    window.mathVirtualKeyboard.update(makeProxy(this));
  }

  disconnectFromVirtualKeyboard(): void {
    if (!this.connectedToVirtualKeyboard) return;
    window.removeEventListener('message', this);
    window.mathVirtualKeyboard.disconnect();
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
    return window.MathfieldElement.fractionNavigationOrder;
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

  get disabled(): boolean {
    return this.host?.['disabled'] ?? false;
  }

  // This reflects the contenteditable attribute.
  // Use hasEditableContent instead to take into account readonly and disabled
  // states.
  get contentEditable(): boolean {
    return this.host?.getAttribute('contenteditable') !== 'false' ?? true;
  }

  // This reflect the `user-select` CSS property
  get userSelect(): string {
    if (!this.host) return '';
    const style = getComputedStyle(this.host);
    // Safari uses '-webkit-user-select'. Other browsers use 'user-select'
    return (
      style.getPropertyValue('user-select') ||
      style.getPropertyValue('-webkit-user-select')
    );
  }

  // Use to hide/show the virtual keyboard toggle. If false, no point in
  // showing  the toggle.
  get hasEditableContent(): boolean {
    if (this.disabled || !this.contentEditable) return false;
    return !this.readOnly || this.hasEditablePrompts;
  }

  get hasEditablePrompts(): boolean {
    return (
      this.readOnly &&
      !this.disabled &&
      this.contentEditable &&
      this.model.findAtom(
        (a: PromptAtom) => a.type === 'prompt' && !a.locked
      ) !== undefined
    );
  }

  /** Returns true if the selection is editable:
   * - mathfield is not disabled, and has contentEditable
   * - if mathfield is readonly, the current selection is in a prompt which is editable (not locked)
   */
  get isSelectionEditable(): boolean {
    if (this.disabled || !this.contentEditable) return false;
    if (!this.readOnly) return true;

    const anchor = this.model.at(this.model.anchor);
    const cursor = this.model.at(this.model.position);

    const ancestor = Atom.commonAncestor(anchor, cursor);

    if (ancestor?.type === 'prompt' || ancestor?.parentPrompt) return true;

    return false;
  }

  get letterShapeStyle(): 'auto' | 'tex' | 'iso' | 'french' | 'upright' {
    return this.options?.letterShapeStyle ?? 'tex';
  }

  get registers(): Registers {
    return this.options?.registers ?? {};
  }

  /** Returns styles shared by all selected atoms */
  get selectionStyle(): Style {
    // Selection is not extended, adopt style
    if (this.model.selectionIsCollapsed) {
      const previousAtom = this.model.at(this.model.selection.ranges[0][0]);

      const siblingToAdopt =
        this.adoptStyle === 'right' ? previousAtom.rightSibling : previousAtom;

      if (!siblingToAdopt) return {};

      if (siblingToAdopt.type === 'group') {
        const branch = siblingToAdopt.branch('body');
        if (!branch || branch.length < 2) return {};
        if (this.adoptStyle === 'right') return branch[1].style;
        return branch[branch.length - 1].style;
      }

      return siblingToAdopt.style;
    }

    // Potentially multiple atoms selected, return the COMMON styles
    const selectedAtoms = this.model.getAtoms(this.model.selection);
    if (selectedAtoms.length === 0) return {};
    const style = { ...selectedAtoms[0].style };
    selectedAtoms.forEach((a: Atom) => {
      for (const [key, value] of Object.entries(a.style))
        if (!style[key] || style[key] !== value) style[key] = undefined;
    });

    return style!;
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
          `MathLive {{SDK_VERSION}}: Invalid keybindings for current keyboard layout`,
          errors
        );
      }
    }
    return keybindings;
  }

  setOptions(config: Partial<MathfieldOptionsPrivate>): void {
    this.options = updateOptions(this.options, config);

    this.model.setListeners({
      onSelectionDidChange: (_sender: ModelPrivate) =>
        this._onSelectionDidChange(),
    });
    this.model.options.macros = this.options
      .macros as NormalizedMacroDictionary;

    this._keybindings = undefined;

    if (this.options.defaultMode === 'inline-math')
      this.element!.classList.add('ML__is-inline');
    else this.element!.classList.remove('ML__is-inline');

    if (this.options.readOnly) {
      if (this.hasFocus() && window.mathVirtualKeyboard.visible)
        this.executeCommand('hideVirtualKeyboard');
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
    if (isVirtualKeyboardMessage(evt)) {
      // console.log('mf received ', evt.data.action, evt);
      if (!validateOrigin(evt.origin, this.options.originValidator ?? 'none')) {
        throw new DOMException(
          `Message from unknown origin (${evt.origin}) cannot be handled`,
          'SecurityError'
        );
      }

      const { action } = evt.data;

      if (action === 'execute-command') {
        const command = evt.data.command!;
        if (getCommandTarget(command) === 'virtual-keyboard') return;
        this.executeCommand(command);
      } else if (action === 'update-state') {
      } else if (action === 'focus') this.focus({ preventScroll: true });
      else if (action === 'blur') this.blur();
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
        if (this.geometryChangeTimer)
          cancelAnimationFrame(this.geometryChangeTimer);

        this.geometryChangeTimer = requestAnimationFrame(
          () => isValidMathfield(this) && this.onGeometryChange()
        );
        break;

      case 'scroll':
        if (this.geometryChangeTimer)
          cancelAnimationFrame(this.geometryChangeTimer);

        this.geometryChangeTimer = requestAnimationFrame(
          () => isValidMathfield(this) && this.onGeometryChange()
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
    document.removeEventListener('scroll', this);
    window.removeEventListener('blur', this, { capture: true });

    // delete (this as any).accessibleMathML;
    delete (this as any).ariaLiveText;
    delete (this as any).field;
    delete (this as any).fieldContent;
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
      this.focus({ preventScroll: true });
      window.mathVirtualKeyboard.executeCommand(command);
      requestAnimationFrame(() =>
        window.mathVirtualKeyboard.update(makeProxy(this))
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
    const ce = window.MathfieldElement.computeEngine;
    if (!ce) {
      console.error(
        `MathLive {{SDK_VERSION}}:  no compute engine available. Make sure the Compute Engine library is loaded.`
      );
      return null;
    }
    return ce.box(ce.parse(this.model.getValue()));
  }

  /** Make sure the caret is visible within the matfield.
   * If using mathfield element, make sure the mathfield element is visible in
   * the page
   */
  scrollIntoView(): void {
    if (!this.element) return;
    //
    // 1/ If using a mathfield element, make sure that the element is visible.
    //

    if (this.host) {
      if (this.options.onScrollIntoView) this.options.onScrollIntoView(this);
      else {
        // 1.1/ Bring the mathfield into the viewport
        this.host.scrollIntoView({ block: 'nearest', inline: 'nearest' });

        // 1.2/ If the virtual keyboard obscures the mathfield, adjust
        if (
          window.mathVirtualKeyboard.visible &&
          window.mathVirtualKeyboard.container === window.document.body
        ) {
          const kbdBounds = window.mathVirtualKeyboard.boundingRect;
          const mathfieldBounds = this.host.getBoundingClientRect();
          if (mathfieldBounds.bottom > kbdBounds.top) {
            window.document.scrollingElement?.scrollBy(
              0,
              mathfieldBounds.bottom - kbdBounds.top + 8
            );
          }
        }
      }
    }

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
    if (typeof s !== 'string') return false;

    if (
      s.length === 0 &&
      (options?.insertionMode === 'insertBefore' ||
        options?.insertionMode === 'insertAfter')
    )
      return false;

    if (s.length === 0 && this.model.selectionIsCollapsed) return false;

    // This code path is used when inserting content from the virtual keyboard
    // (i.e. inserting `\sin`). We need to ignore previous key combinations
    // in this case
    this.flushInlineShortcutBuffer();

    options = options ?? { mode: 'math' };
    if (options.focus) this.focus();

    if (options.feedback) {
      if (window.MathfieldElement.keypressVibration && canVibrate())
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

  switchMode(mode: ParseMode, prefix = '', suffix = ''): void {
    if (
      this.mode === mode ||
      !this.hasEditableContent ||
      !this.contentEditable ||
      this.disabled
    )
      return;

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
              extractedAtoms[0].type === 'placeholder'
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
    return !this.blurred;
  }

  focus(options?: FocusOptions): void {
    if (!this.hasFocus()) {
      this.keyboardDelegate.focus();
      this.connectToVirtualKeyboard();
      this.model.announce('line');
    }
    if (!options?.preventScroll ?? false) this.scrollIntoView();
  }

  blur(): void {
    this.disconnectFromVirtualKeyboard();
    if (!this.hasFocus()) return;
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
          for (const range of this.model.selection.ranges)
            applyStyle(this.model, range, style, { operation });
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

  getPrompt(id: string): PromptAtom | undefined {
    const prompt = this.model.findAtom(
      (a) => a.type === 'prompt' && (a as PromptAtom).placeholderId === id
    ) as PromptAtom | undefined;
    console.assert(
      prompt !== undefined,
      `MathLive {{SDK_VERSION}}:  no prompts with matching ID found`
    );
    return prompt;
  }

  getPromptValue(id: string, format?: OutputFormat): string {
    const prompt = this.getPrompt(id);
    if (!prompt) {
      console.error(`MathLive {{SDK_VERSION}}: unknown prompt ${id}`);
      return '';
    }

    const first = this.model.offsetOf(prompt.firstChild);
    const last = this.model.offsetOf(prompt.lastChild);

    return this.model.getValue(first, last, format);
  }

  getPrompts(filter?: {
    id?: string;
    locked?: boolean;
    correctness?: 'correct' | 'incorrect' | 'undefined';
  }): string[] {
    return this.model
      .getAllAtoms()
      .filter((a: PromptAtom) => {
        if (a.type !== 'prompt') return false;
        if (!filter) return true;

        if (filter.id && a.placeholderId !== filter.id) return false;
        if (filter.locked && a.locked !== filter.locked) return false;
        if (filter.correctness === 'undefined' && a.correctness) return false;
        if (filter.correctness && a.correctness !== filter.correctness)
          return false;

        return true;
      })
      .map((a: PromptAtom) => a.placeholderId!);
  }

  setPromptValue(
    id: string,
    value?: string,
    insertOptions?: Omit<InsertOptions, 'insertionMode'>
  ): void {
    if (value !== undefined) {
      const prompt = this.getPrompt(id);
      if (!prompt) {
        console.error(`MathLive {{SDK_VERSION}}: unknown prompt ${id}`);
        return;
      }

      const branchRange = this.model.getBranchRange(
        this.model.offsetOf(prompt),
        'body'
      );

      this.model.setSelection(branchRange);
      this.insert(value, {
        ...insertOptions,
        insertionMode: 'replaceSelection',
      });
    }
    if (insertOptions?.suppressChangeNotifications)
      this.valueOnFocus = this.getValue();
    requestUpdate(this);
  }

  setPromptState(
    id: string,
    state: 'correct' | 'incorrect' | 'undefined' | undefined,
    locked?: boolean
  ): void {
    const prompt = this.getPrompt(id);
    if (!prompt) {
      console.error(`MathLive {{SDK_VERSION}}: unknown prompt ${id}`);
      return;
    }
    if (state === 'undefined') prompt.correctness = undefined;
    else if (typeof state === 'string') prompt.correctness = state;

    if (typeof locked === 'boolean') {
      prompt.locked = locked;
      prompt.captureSelection = locked;
    }

    requestUpdate(this);
  }

  stripPromptContent(filter?: {
    id?: string;
    locked?: boolean;
    correctness?: 'correct' | 'incorrect' | 'undefined';
  }): Record<string, string> {
    const matchingPrompts = this.model.getAllAtoms().filter((a: PromptAtom) => {
      if (a.type !== 'prompt') return false;
      if (!filter) return true;

      if (filter.id && a.placeholderId !== filter.id) return false;
      if (filter.locked && a.locked !== filter.locked) return false;
      if (filter.correctness === 'undefined' && a.correctness) return false;
      if (filter.correctness && a.correctness !== filter.correctness)
        return false;

      return true;
    }) as PromptAtom[];

    const promptStates = {};
    matchingPrompts.forEach((prompt) => {
      const id = prompt.placeholderId!;
      promptStates[id] = this.getPromptValue(id);
      this.setPromptValue(id, '');
    });
    return promptStates;
  }

  getPromptState(id: string): ['correct' | 'incorrect' | undefined, boolean] {
    const prompt = this.getPrompt(id);
    if (!prompt) {
      console.error(`MathLive {{SDK_VERSION}}: unknown prompt ${id}`);
      return [undefined, true];
    }
    return [prompt.correctness, prompt.locked];
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
      window.mathVirtualKeyboard.update(makeProxy(this));
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
      window.mathVirtualKeyboard.update(makeProxy(this));
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
    console.log('updating');
    window.mathVirtualKeyboard.update(makeProxy(this));
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
    window.mathVirtualKeyboard.update(makeProxy(this));
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
    // As a side effect, a `focus` and `focusin` events will be dispatched
    this.keyboardDelegate.focus();

    render(this, { interactive: true });

    // Save the current value.
    // It will be compared in `onBlur()` to see if the
    // `change` event needs to be dispatched. This
    // mimic the `<input>` and `<textarea>` behavior
    this.valueOnFocus = this.model.getValue();

    // If we're in prompt mode, and the selection is
    // not in a prompt, move it to a prompt
    if (
      this.hasEditablePrompts &&
      !this.model.at(this.model.anchor).parentPrompt
    )
      this.executeCommand('moveToNextPlaceholder');

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

  private onGeometryChange(): void {
    updatePopoverPosition(this);
    window.mathVirtualKeyboard.updateEnvironmemtPopover(makeProxy(this));
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
      return this.fieldContent?.querySelector(
        `[data-atom-id="${target.id}"]`
      ) as HTMLSpanElement;
    }
    throw new TypeError('Could not get an ID from atom');
  }
}
