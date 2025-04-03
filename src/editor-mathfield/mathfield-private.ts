import type { BoxedExpression } from '@cortex-js/compute-engine';

import type {
  ContentChangeOptions,
  Keybinding,
  KeyboardLayoutName,
} from '../public/options';
import type { Mathfield } from '../public/mathfield';
import type {
  InsertOptions,
  OutputFormat,
  Offset,
  Range,
  Selection,
  ApplyStyleOptions,
} from '../public/core-types';

import { canVibrate } from '../ui/utils/capabilities';

import { Atom } from '../core/atom-class';
import { gFontsState } from '../core/fonts';
import { defaultBackgroundColorMap, defaultColorMap } from '../core/color';
import {
  getMacroDefinition,
  getMacros,
} from '../latex-commands/definitions-utils';
import { LatexGroupAtom } from '../atoms/latex';
import { parseLatex, validateLatex } from '../core/parser';
import { getDefaultRegisters } from '../core/registers';

import { applyStyle } from '../editor-model/styling';
import { getMode, isRange, range } from '../editor-model/selection-utils';
import {
  removeComposition,
  updateComposition,
} from '../editor-model/composition';
import { addRowAfter, addColumnAfter } from '../editor-model/array';

import {
  delegateKeyboardEvents,
  KeyboardDelegate,
  KeyboardDelegateInterface,
} from '../editor/keyboard';
import { UndoManager } from '../editor/undo';
import {
  disposeSuggestionPopover,
  hideSuggestionPopover,
  updateSuggestionPopoverPosition,
} from '../editor/suggestion-popover';
import { l10n, localize } from '../core/l10n';
import {
  HAPTIC_FEEDBACK_DURATION,
  SelectorPrivate,
  perform,
  getCommandTarget,
  parseCommand,
} from '../editor/commands';
import {
  _MathfieldOptions,
  update as updateOptions,
  getDefault as getDefaultOptions,
  get as getOptions,
  effectiveMode,
} from './options';
import { normalizeKeybindings } from '../editor/keybindings';
import {
  setKeyboardLayoutLocale,
  getActiveKeyboardLayout,
  gKeyboardLayout,
  getDefaultKeyboardLayout,
} from '../editor/keyboard-layout';

import { onInput, onKeystroke } from './keyboard-input';
import { complete } from './autocomplete';
import {
  requestUpdate,
  render,
  renderSelection,
  contentMarkup,
  reparse,
} from './render';

import './commands';
import './styling';
import {
  getCaretPoint,
  getElementInfo,
  getSelectionBounds,
  isValidMathfield,
  Rect,
  validateOrigin,
} from './utils';

import { onPointerDown, PointerTracker } from './pointer-input';

import { ModeEditor } from './mode-editor';
import './mode-editor-math';
import './mode-editor-text';

import { computeInsertStyle, validateStyle } from './styling';
import { disposeKeystrokeCaption } from './keystroke-caption';
import { PromptAtom } from '../atoms/prompt';
import { isVirtualKeyboardMessage } from '../virtual-keyboard/proxy';
import '../public/mathfield-element';

import '../virtual-keyboard/virtual-keyboard';
import '../virtual-keyboard/global';

import type {
  ParseMode,
  Style,
  NormalizedMacroDictionary,
  LatexSyntaxError,
} from '../public/core-types';
import { makeProxy } from '../virtual-keyboard/mathfield-proxy';
import type { ContextInterface, PrivateStyle } from '../core/types';
import {
  disposeEnvironmentPopover,
  hideEnvironmentPopover,
  updateEnvironmentPopover,
} from 'editor/environment-popover';
import { Menu } from 'ui/menu/menu';
import { onContextMenu } from 'ui/menu/context-menu';
import { keyboardModifiersFromEvent } from '../ui/events/utils';
import { getDefaultMenuItems } from 'editor/default-menu';
import type { ModelState } from 'editor-model/types';
import { _Model } from 'editor-model/model-private';
import { deleteRange } from 'editor-model/delete';

import 'editor-model/commands-delete';
import 'editor-model/commands-move';
import 'editor-model/commands-select';
import { KeyboardModifiers } from 'public/ui-events-types';
import MathfieldElement from '../public/mathfield-element';
import { parseMathString } from 'formats/parse-math-string';
import { TextAtom } from 'atoms/text';
import { getLatexGroup } from './mode-editor-latex';
import { MenuItem } from 'public/ui-menu-types';

const DEFAULT_KEYBOARD_TOGGLE_GLYPH = `<svg xmlns="http://www.w3.org/2000/svg" style="width: 21px;"  viewBox="0 0 576 512" role="img" aria-label="${localize(
  'tooltip.toggle virtual keyboard'
)}"><path d="M528 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm16 336c0 8.823-7.177 16-16 16H48c-8.823 0-16-7.177-16-16V112c0-8.823 7.177-16 16-16h480c8.823 0 16 7.177 16 16v288zM168 268v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-336 80v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm384 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zM120 188v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-96 152v-8c0-6.627-5.373-12-12-12H180c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h216c6.627 0 12-5.373 12-12z"/></svg>`;

const MENU_GLYPH = `<svg xmlns="http://www.w3.org/2000/svg" style="height: 18px;" viewBox="0 0 448 512" role="img" aria-label="${localize(
  'tooltip.menu'
)}"><path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></svg>`;

/** @internal */
export class _Mathfield implements Mathfield, KeyboardDelegateInterface {
  readonly model: _Model;

  readonly undoManager: UndoManager;

  options: Readonly<Required<_MathfieldOptions>>;

  // When inserting new characters, if not `"none"`, adopt the style
  // (color, up variant, etc..) from the previous or following atom.
  styleBias: 'left' | 'right' | 'none';

  // The style used when `styleBias` is set to 'none'
  defaultStyle: Readonly<Style>;

  dirty: boolean; // If true, need to be redrawn

  element: HTMLElement & { mathfield?: _Mathfield };

  /** The element from which events are emitted, usually a MathfieldElement */
  readonly host: HTMLElement | undefined;

  field: HTMLElement;
  readonly ariaLiveText: HTMLElement;
  // readonly accessibleMathML: HTMLElement;

  atomBoundsCache?: Map<string, Rect>;

  suggestionIndex: number;

  keystrokeCaptionVisible: boolean;

  readonly keyboardDelegate: Readonly<KeyboardDelegate>;

  _keybindings?: Readonly<Keybinding[]>; // Normalized keybindings (raw ones in config)
  keyboardLayout: KeyboardLayoutName;

  inlineShortcutBuffer: {
    state: ModelState;
    keystrokes: string[];
    leftSiblings: Atom[];
  }[];
  inlineShortcutBufferFlushTimer: ReturnType<typeof setTimeout>;

  private blurred: boolean;

  private _menu: Menu;

  private _l10Subscription: number;

  // The value of the mathfield when it is focussed.
  // If this value is different when the field is blured
  // the `change` event is dispatched
  private valueOnFocus: string;
  private focusBlurInProgress = false;

  private geometryChangeTimer: ReturnType<typeof requestAnimationFrame>;

  /** When true, the mathfield is listening to the virtual keyboard */
  private connectedToVirtualKeyboard: boolean;

  private eventController: AbortController;
  resizeObserver: ResizeObserver;
  // ResizeObserver, sadly, fire at least once, even if no size has changed.
  // Workaround this by tracking its state. See https://github.com/WICG/resize-observer/issues/38#issuecomment-532833484
  resizeObserverStarted: boolean;

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
    element: HTMLElement & { mathfield?: _Mathfield },
    options: Partial<_MathfieldOptions> & {
      eventSink?: HTMLElement;
    }
  ) {
    // Setup default config options
    this.options = {
      ...getDefaultOptions(),
      macros: getMacros(),
      registers: getDefaultRegisters(),
      ...updateOptions(options),
    };

    this.eventController = new AbortController();
    const signal = this.eventController.signal;

    if (options.eventSink) this.host = options.eventSink;

    this.element = element;
    element.mathfield = this;

    // Focus/blur state
    this.blurred = true;

    // The keystroke caption panel is initially hidden
    this.keystrokeCaptionVisible = false;

    // This index indicates which of the suggestions available to
    // display in the popover panel
    this.suggestionIndex = 0;

    this.inlineShortcutBuffer = [];
    this.inlineShortcutBufferFlushTimer = 0 as unknown as ReturnType<
      typeof setTimeout
    >;

    // Default style (color, weight, italic, etc...):
    // reflects the style to be applied on next insertion
    // if styleBias is "none".
    this.defaultStyle = {};
    // Adopt the style of the left sibling by default
    this.styleBias = 'left';

    if (this.options.defaultMode === 'inline-math')
      this.element.classList.add('ML__is-inline');
    else this.element.classList.remove('ML__is-inline');

    this.dirty = false;

    // Use the content of the element for the initial value of the mathfield
    let elementText = options.value ?? this.element.textContent ?? '';
    elementText = elementText.trim();

    // The initial input mode (text or math): the mode the next character
    // typed will be interpreted in, which may be different from the mode
    // of the current selection.
    const mode = effectiveMode(this.options);

    // Setup the model
    const body = parseLatex(elementText, { context: this.context });
    let root: Atom;
    if (body.length === 1 && body[0].isRoot) root = body[0];
    else root = new Atom({ type: 'root', mode, body });

    this.model = new _Model(this, mode, root);

    // Prepare to manage undo/redo
    this.undoManager = new UndoManager(this.model);

    // Additional elements used for UI.
    const markup: string[] = [];

    // const accessibleNodeID =
    //   Date.now().toString(36).slice(-2) +
    //   Math.floor(Math.random() * 0x186a0).toString(36);
    // Add "aria-labelledby="${accessibleNodeID}"" to the keyboard sink

    // 1/ The keyboard event capture element.
    markup.push(
      `<span contenteditable=true role=textbox aria-autocomplete=none aria-multiline=false part=keyboard-sink class=ML__keyboard-sink autocapitalize=off autocomplete=off autocorrect=off spellcheck=false inputmode=none tabindex=0></span>`
    );

    // 2/ The field, where the math equation will be displayed

    // Start with hidden content to minimize flashing during creation
    // The visibility will be reset during render
    markup.push(
      '<span part=container class=ML__container  style="visibility:hidden">'
    );
    markup.push('<span part=content class=ML__content>');
    markup.push(contentMarkup(this));
    markup.push('</span>');

    // 2.1/ The virtual keyboard toggle
    if (window.mathVirtualKeyboard) {
      markup.push(
        `<div part=virtual-keyboard-toggle class=ML__virtual-keyboard-toggle role=button ${
          this.hasEditableContent ? '' : 'style="display:none;"'
        } data-l10n-tooltip="tooltip.toggle virtual keyboard">`
      );
      markup.push(DEFAULT_KEYBOARD_TOGGLE_GLYPH);
      markup.push('</div>');
    }

    // 2.2// The menu toggle
    markup.push(
      `<div part=menu-toggle class=ML__menu-toggle role=button data-l10n-tooltip="tooltip.menu">`
    );
    markup.push(MENU_GLYPH);
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

    this.element.innerHTML = globalThis.MathfieldElement.createHTML(
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

    // Update the localizable elements, and subscribe to
    // future updates
    this._l10Subscription = l10n.subscribe(() => l10n.update(this.element!));
    l10n.update(this.element!);

    this.field = this.element.querySelector('[part=content]')!;

    // Listen to 'click' events on the part of the field that doesn't have
    // content, so we avoid sending two 'click' events
    this.field.addEventListener(
      'click',
      (evt) => evt.stopImmediatePropagation(),
      { capture: false, signal }
    );

    // Listen to 'wheel' events to scroll (horizontally) the field when it overflows
    this.field.addEventListener('wheel', this, { passive: false, signal });

    // Delegate pointer events
    if ('PointerEvent' in window)
      this.field.addEventListener('pointerdown', this, { signal });
    else this.field.addEventListener('mousedown', this, { signal });

    this.element
      .querySelector<HTMLElement>('[part=virtual-keyboard-toggle]')
      ?.addEventListener(
        'click',
        () => {
          if (window.mathVirtualKeyboard.visible)
            window.mathVirtualKeyboard.hide();
          else {
            window.mathVirtualKeyboard.show({ animate: true });
            window.mathVirtualKeyboard.update(makeProxy(this));
          }
        },
        { signal }
      );

    // Listen for contextmenu events on the field
    this.field.addEventListener('contextmenu', this, { signal });

    const menuToggle =
      this.element!.querySelector<HTMLElement>('[part=menu-toggle]')!;
    menuToggle?.addEventListener(
      'pointerdown',
      (ev) => {
        if (ev.currentTarget !== menuToggle) return;
        const menu = this.menu;
        if (menu.state !== 'closed') return;
        this.element!.classList.add('tracking');
        const bounds = menuToggle.getBoundingClientRect();
        menu.modifiers = keyboardModifiersFromEvent(ev);
        menu.show({
          target: menuToggle,
          location: { x: bounds.left, y: bounds.bottom },
          onDismiss: () => this.element!.classList.remove('tracking'),
        });
        ev.preventDefault();
        ev.stopPropagation();
      },
      { signal }
    );

    if (
      this.model.atoms.length <= 1 ||
      this.disabled ||
      (this.readOnly && !this.hasEditableContent) ||
      this.userSelect === 'none'
    )
      menuToggle.style.display = 'none';

    this.ariaLiveText = this.element.querySelector('[role=status]')!;
    // this.accessibleMathML = this.element.querySelector('.accessibleMathML')!;

    // Capture clipboard events
    // Delegate keyboard events
    this.keyboardDelegate = delegateKeyboardEvents(
      this.element.querySelector('.ML__keyboard-sink')!,
      this.element,
      this
    );

    // Request notification for when the window is resized, the device
    // switched from portrait to landscape or the document is scrolled
    // to adjust the UI (popover, etc...)
    window.addEventListener('resize', this, { signal });
    document.addEventListener('scroll', this, { signal });
    this.resizeObserver = new ResizeObserver((_entries) => {
      if (this.resizeObserverStarted) {
        this.resizeObserverStarted = false;
        return;
      }
      requestUpdate(this);
    });
    this.resizeObserverStarted = true;
    this.resizeObserver.observe(this.field);

    window.mathVirtualKeyboard.addEventListener(
      'virtual-keyboard-toggle',
      this,
      { signal }
    );

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
      .querySelector<HTMLElement>('[part=container]')!
      .style.removeProperty('visibility');

    // Now start recording potentially undoable actions
    this.undoManager.startRecording();
    // Snapshot as 'set-value' operation, so that any other subsequent
    // `setValue()` gets coalesced
    this.undoManager.snapshot('set-value');

    // Request an update (this is necessary in the case where the mathfield
    // is empty but does have a contentPlaceholder)
    requestUpdate(this);
  }

  connectToVirtualKeyboard(): void {
    if (this.connectedToVirtualKeyboard) return;
    this.connectedToVirtualKeyboard = true;
    window.addEventListener('message', this, {
      signal: this.eventController.signal,
    });
    // Connect the kbd or kbd proxy to the current window
    window.mathVirtualKeyboard.connect();
    if (window.mathVirtualKeyboard.visible)
      window.mathVirtualKeyboard.update(makeProxy(this));
    updateEnvironmentPopover(this);
  }

  disconnectFromVirtualKeyboard(): void {
    if (!this.connectedToVirtualKeyboard) return;
    window.removeEventListener('message', this);
    window.mathVirtualKeyboard.disconnect();
    this.connectedToVirtualKeyboard = false;
    hideEnvironmentPopover();
  }

  showMenu(_?: {
    location?: { x: number; y: number };
    modifiers?: KeyboardModifiers;
  }): boolean {
    const location = _?.location ?? getCaretPoint(this.field!) ?? undefined;
    const modifiers = _?.modifiers;
    const target =
      this.element!.querySelector<HTMLElement>('[part=container]')!;
    return this._menu.show({ target, location, modifiers });
  }

  get colorMap(): (name: string) => string | undefined {
    return (name) => this.options.colorMap?.(name) ?? defaultColorMap(name);
  }

  get backgroundColorMap(): (name: string) => string | undefined {
    return (name) =>
      this.options.backgroundColorMap?.(name) ??
      this.options.colorMap?.(name) ??
      defaultBackgroundColorMap(name);
  }

  get smartFence(): boolean {
    return this.options.smartFence ?? false;
  }

  get readOnly(): boolean {
    return this.options.readOnly ?? false;
  }

  get disabled(): boolean {
    return this.host?.['disabled'] ?? false;
  }

  // This reflects the contenteditable attribute.
  // Use hasEditableContent instead to take into account readonly and disabled
  // states.
  get contentEditable(): boolean {
    if (!this.host) return false;
    return this.host.getAttribute('contenteditable') !== 'false';
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

  get letterShapeStyle(): 'tex' | 'iso' | 'french' | 'upright' {
    return (
      (this.options.letterShapeStyle as 'tex' | 'iso' | 'french' | 'upright') ??
      'tex'
    );
  }

  get minFontScale(): number {
    return this.options.minFontScale;
  }

  get maxMatrixCols(): number {
    return this.options.maxMatrixCols;
  }

  /**
   *
   * If there is a selection, return if all the atoms in the selection,
   * some of them or none of them match the `style` argument.
   *
   * If there is no selection, return 'all' if the current implicit style
   * (determined by a combination of the style of the previous atom and
   * the current style) matches the `style` argument, 'none' if it does not.
   */
  queryStyle(inStyle: Readonly<Style>): 'some' | 'all' | 'none' {
    const style = validateStyle(this, inStyle);
    if ('verbatimColor' in style) delete style.verbatimColor;
    if ('verbatimBackgroundColor' in style)
      delete style.verbatimBackgroundColor;
    const keyCount = Object.keys(style).length;
    if (keyCount === 0) return 'all';
    if (keyCount > 1) {
      for (const prop of Object.keys(style)) {
        const result = this.queryStyle({ [prop]: style[prop] });
        if (result === 'none') return 'none';
        if (result === 'some') return 'some';
      }
      return 'all';
    }

    const prop = Object.keys(style)[0] as keyof Style;
    const value = style[prop];

    if (this.model.selectionIsCollapsed) {
      const style = computeInsertStyle(this);
      return style[prop] === value ? 'all' : 'none';
    }

    const atoms = this.model.getAtoms(this.model.selection, {
      includeChildren: true,
    });
    let length = atoms.length;
    if (length === 0) return 'none';
    let count = 0;

    for (const atom of atoms) {
      if (atom.type === 'first') {
        length -= 1;
        continue;
      }
      if (atom.style[prop] === value) count += 1;
    }
    if (count === 0) return 'none';
    if (count === length) return 'all';
    return 'some';
  }

  get keybindings(): Readonly<Keybinding[]> {
    if (this._keybindings) return this._keybindings;

    const [keybindings, errors] = normalizeKeybindings(
      this.options.keybindings,
      getActiveKeyboardLayout() ?? getDefaultKeyboardLayout()
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

  get menu(): Menu {
    this._menu ??= new Menu(getDefaultMenuItems(this), { host: this.host });
    return this._menu;
  }

  set menuItems(menuItems: Readonly<MenuItem[]>) {
    if (this._menu) this._menu.menuItems = menuItems;
    else this._menu = new Menu(menuItems, { host: this.host });
  }

  setOptions(config: Partial<_MathfieldOptions>): void {
    this.options = { ...this.options, ...updateOptions(config) };

    this._keybindings = undefined;

    if (this.options.defaultMode === 'inline-math')
      this.element!.classList.add('ML__is-inline');
    else this.element!.classList.remove('ML__is-inline');

    // The mode of the 'first' atom is the mode of the  expression when empty
    let mode = this.options.defaultMode;
    if (mode === 'inline-math') mode = 'math';
    if (this.model.root.firstChild?.mode !== mode)
      this.model.root.firstChild.mode = mode;

    if (this.options.readOnly) {
      if (this.hasFocus() && window.mathVirtualKeyboard.visible)
        this.executeCommand('hideVirtualKeyboard');
    }

    // Changing some config options (i.e. `macros`) may
    // require the content to be reparsed and re-rendered
    const content = Atom.serialize([this.model.root], {
      expandMacro: false,
      defaultMode: this.options.defaultMode,
    });
    if ('macros' in config || this.model.getValue() !== content) reparse(this);

    if (
      'value' in config ||
      'registers' in config ||
      'colorMap' in config ||
      'backgroundColorMap' in config ||
      'letterShapeStyle' in config ||
      'minFontScale' in config ||
      'maxMatrixCols' in config ||
      'readOnly' in config ||
      'placeholderContent' in config ||
      'placeholderSymbol' in config
    )
      requestUpdate(this);
  }

  getOptions<K extends keyof _MathfieldOptions>(
    keys: K[]
  ): Pick<_MathfieldOptions, K>;
  getOptions(): _MathfieldOptions;
  getOptions(
    keys?: keyof _MathfieldOptions | (keyof _MathfieldOptions)[]
  ): any | Partial<_MathfieldOptions> {
    return getOptions(this.options, keys);
  }

  getOption<K extends keyof _MathfieldOptions>(key: K): _MathfieldOptions[K] {
    return getOptions(this.options, key) as _MathfieldOptions[K];
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
  async handleEvent(evt: Event): Promise<void> {
    if (!isValidMathfield(this)) return;
    if (isVirtualKeyboardMessage(evt)) {
      if (!validateOrigin(evt.origin, this.options.originValidator ?? 'none')) {
        throw new DOMException(
          `Message from unknown origin (${evt.origin}) cannot be handled`,
          'SecurityError'
        );
      }

      const { action } = evt.data;

      if (action === 'execute-command') {
        const command = parseCommand(evt.data.command);
        if (!command) return;
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

      // Safari on iOS <= 13 and Firefox on Android
      case 'mousedown':
        if (this.userSelect !== 'none')
          onPointerDown(this, evt as PointerEvent);

        break;

      case 'pointerdown':
        if (!evt.defaultPrevented && this.userSelect !== 'none') {
          onPointerDown(this, evt as PointerEvent);
          // Firefox convention: holding the shift key disables custom context menu
          if ((evt as PointerEvent).shiftKey === false) {
            if (
              await onContextMenu(
                evt,
                this.element!.querySelector<HTMLElement>('[part=container]')!,
                this.menu
              )
            )
              PointerTracker.stop();
          }
        }
        break;

      case 'contextmenu':
        if (
          this.userSelect !== 'none' &&
          (evt as PointerEvent).shiftKey === false
        ) {
          if (
            await onContextMenu(
              evt,
              this.element!.querySelector<HTMLElement>('[part=container]')!,
              this.menu
            )
          )
            PointerTracker.stop();
        }
        break;

      case 'virtual-keyboard-toggle':
        if (this.hasFocus()) updateEnvironmentPopover(this);
        // Workaround a Chromium 133+ issue where the keyboard sink loses focus
        // when the virtual keyboard is shown
        // https://github.com/arnog/mathlive/issues/2588
        if (this.hasFocus()) {
          this.keyboardDelegate.blur();
          this.keyboardDelegate.focus();
        }
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

      case 'message':
        break;

      default:
        console.warn('Unexpected event type', evt.type);
    }
  }

  dispose(): void {
    if (!isValidMathfield(this)) return;

    l10n.unsubscribe(this._l10Subscription);

    this.keyboardDelegate.dispose();
    (this as any).keyboardDelegate = undefined;
    this.eventController.abort();
    (this as any).eventController = undefined;

    this.resizeObserver.disconnect();

    window.mathVirtualKeyboard.removeEventListener(
      'virtual-keyboard-toggle',
      this
    );

    this.disconnectFromVirtualKeyboard();

    this.model.dispose();

    const element = this.element!;
    delete element.mathfield;
    (this.element as any) = undefined;

    (this as any).host = undefined;
    (this as any).field = undefined;
    (this as any).ariaLiveText = undefined;

    disposeKeystrokeCaption();
    disposeSuggestionPopover();
    disposeEnvironmentPopover();
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

  get errors(): Readonly<LatexSyntaxError[]> {
    return validateLatex(this.model.getValue(), { context: this.context });
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

    if (options.mode === undefined || options.mode === 'auto')
      options.mode = getMode(this.model, this.model.position) ?? 'math';

    const couldUndo = this.undoManager.canUndo();
    if (ModeEditor.insert(this.model, value, options)) {
      requestUpdate(this);
      // If this is the first insertion, drop the previous (empty) snapshot
      if (!couldUndo) this.undoManager.reset();
      this.undoManager.snapshot('set-value');
    }
  }

  get expression(): Readonly<BoxedExpression> | null {
    const ce = globalThis.MathfieldElement.computeEngine;
    if (!ce) {
      console.error(
        `MathLive {{SDK_VERSION}}:  no compute engine available. Make sure the Compute Engine library is loaded.`
      );
      return null;
    }
    return ce.box(ce.parse(this.model.getValue('latex-unstyled')));
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
      if (globalThis.MathfieldElement.keypressVibration && canVibrate())
        navigator.vibrate(HAPTIC_FEEDBACK_DURATION);

      globalThis.MathfieldElement.playSound('keypress');
    }

    if (s === '\\\\') {
      // This string is interpreted as an "insert row after" command
      addRowAfter(this.model);
    } else if (s === '&') addColumnAfter(this.model);
    else {
      if (this.model.selectionIsCollapsed) {
        const style = { ...computeInsertStyle(this) };
        // If we're inserting a non-alphanumeric character, reset the variant
        if (!/^[a-zA-Z0-9]$/.test(s) && this.styleBias !== 'none') {
          style.variant = 'normal';
          style.variantStyle = undefined;
        }

        ModeEditor.insert(this.model, s, { style, ...options });
      } else ModeEditor.insert(this.model, s, options);
    }

    this.snapshot(`insert-${this.model.at(this.model.position).type}`);

    requestUpdate(this);
    if (options.scrollIntoView) this.scrollIntoView();

    return true;
  }

  /**
   * Switch from the current mode to the new mode, if different.
   * Prefix and suffix are optional strings to be inserted before and after
   * the mode change, so prefix is interpreted with the current mode and
   * suffix with the new mode.
   */
  switchMode(mode: ParseMode, prefix = '', suffix = ''): void {
    if (
      this.model.mode === mode ||
      !this.hasEditableContent ||
      !this.contentEditable ||
      this.disabled
    )
      return;

    const { model } = this;

    //
    // 1. Confirm that the mode change is allowed
    //
    // Dispatch event with the option of canceling.
    // Set the mode to the requested mode so the event handler can inspect it.
    const previousMode = model.mode;
    model.mode = mode;
    if (
      this.host &&
      !this.host.dispatchEvent(
        new Event('mode-change', {
          bubbles: true,
          composed: true,
          cancelable: true,
        })
      )
    ) {
      model.mode = previousMode;
      return;
    }

    // Restore to the current mode
    model.mode = previousMode;

    //
    // 2. Perform the mode change, accounting for selection and prefix/suffix
    //
    model.deferNotifications(
      {
        content: Boolean(suffix) || Boolean(prefix),
        selection: true, // Boolean(suffix) || Boolean(prefix),
        type: 'insertText',
      },
      (): boolean => {
        let cursor = model.at(model.position);

        const insertString = (s: string, options: { select: boolean }) => {
          if (!s) return;
          const atoms =
            model.mode === 'math'
              ? parseLatex(parseMathString(s, { format: 'ascii-math' })[1], {
                  context: this.context,
                })
              : [...s].map((c) => new TextAtom(c, c, {}));

          if (options.select) {
            const end = cursor.parent!.addChildrenAfter(atoms, cursor);
            model.setSelection(
              model.offsetOf(atoms[0].leftSibling),
              model.offsetOf(end)
            );
          } else {
            model.position = model.offsetOf(
              cursor.parent!.addChildrenAfter(atoms, cursor)
            );
          }
          contentChanged = true;
        };

        const insertLatexGroup = (
          latex: string,
          options: { select: boolean }
        ) => {
          const atom = new LatexGroupAtom(latex);
          cursor.parent!.addChildAfter(atom, cursor);
          if (options.select) {
            model.setSelection(
              model.offsetOf(atom.firstChild),
              model.offsetOf(atom.lastChild)
            );
          } else model.position = model.offsetOf(atom.lastChild);
          contentChanged = true;
        };

        const getContent = () => {
          const format =
            mode === 'latex'
              ? 'latex'
              : mode === 'math'
                ? 'plain-text'
                : 'ascii-math';

          const selRange = range(model.selection);
          let content = this.model.getValue(selRange, format);

          const atoms = this.model.extractAtoms(selRange);

          // If we just had a placeholder selected, pretend we had an empty
          // selection
          if (atoms.length === 1 && atoms[0].type === 'placeholder')
            content = suffix;

          cursor = model.at(selRange[0]);

          return content;
        };

        let contentChanged = false;

        // 2.1. Disregard any pending inline shortcut
        this.flushInlineShortcutBuffer();
        this.stopCoalescingUndo();

        // 2.2 If there is a LaTeX group, remove it
        complete(this, 'accept');

        if (model.selectionIsCollapsed) {
          //
          // 2.4a. If empty selection: insert prefix and suffix
          //
          insertString(prefix, { select: false });
          model.mode = mode;
          if (mode === 'latex') insertLatexGroup(suffix, { select: false });
          else insertString(suffix, { select: false });
        } else {
          //
          // 2.4b. Non-empty selection: convert the selection to the new mode
          //
          const content = getContent();
          model.mode = mode;
          if (mode === 'latex') insertLatexGroup(content, { select: true });
          else insertString(content, { select: true });
        }

        requestUpdate(this);
        this.undoManager.snapshot(mode === 'latex' ? 'insert-latex' : 'insert');
        return contentChanged;
      }
    );

    model.mode = mode;

    // Update the toolbar
    window.mathVirtualKeyboard.update(makeProxy(this));
  }

  hasFocus(): boolean {
    return !this.blurred;
  }

  focus(options?: FocusOptions): void {
    if (this.focusBlurInProgress) return;
    if (!this.hasFocus()) {
      this.onFocus();
      this.model.announce('line');
    }
    if (!(options?.preventScroll ?? false)) this.scrollIntoView();
  }

  blur(): void {
    this.disconnectFromVirtualKeyboard();
    if (!this.hasFocus()) return;
    this.keyboardDelegate.blur();
  }

  select(): void {
    this.model.selection = { ranges: [[0, this.model.lastOffset]] };
    // The behavior of select() is not clearly defined. Some implementations
    // focus, others don't. Selecting the sink may focus it in some cases
    // so, to be safe, we focus the field as well
    this.focus();
  }

  applyStyle(inStyle: Style, inOptions: Range | ApplyStyleOptions = {}): void {
    let range: Range | undefined;
    let operation: 'set' | 'toggle' = 'set';
    let silenceNotifications = false;

    if (isRange(inOptions)) range = inOptions;
    else {
      if (inOptions.operation === 'toggle') operation = 'toggle';
      range = inOptions.range;
      silenceNotifications = inOptions.silenceNotifications ?? false;
    }

    if (range) range = this.model.normalizeRange(range);
    if (range && range[0] === range[1]) range = undefined;

    const style = validateStyle(this, inStyle);

    if (range === undefined && this.model.selectionIsCollapsed) {
      // We don't have a selection. Set the global style instead.
      if (operation === 'set') {
        const newStyle: PrivateStyle = { ...this.defaultStyle };
        if ('color' in style) delete newStyle.verbatimColor;
        if ('backgroundColor' in style) delete newStyle.verbatimBackgroundColor;
        this.defaultStyle = { ...newStyle, ...style };
        this.styleBias = 'none';
        return;
      }

      // Toggle the properties
      const newStyle: PrivateStyle = { ...this.defaultStyle };
      for (const prop of Object.keys(style)) {
        if (newStyle[prop] === style[prop]) {
          if (prop === 'color') delete newStyle.verbatimColor;
          if (prop === 'backgroundColor')
            delete newStyle.verbatimBackgroundColor;

          delete newStyle[prop];
        } else newStyle[prop] = style[prop];
      }
      this.defaultStyle = newStyle;
      this.styleBias = 'none';
      return;
    }

    this.model.deferNotifications(
      { content: !silenceNotifications, type: 'insertText' },
      () => {
        if (range === undefined) {
          for (const range of this.model.selection.ranges)
            applyStyle(this.model, range, style, { operation });
        } else applyStyle(this.model, range, style, { operation });
      }
    );
    requestUpdate(this);
  }

  toggleContextMenu(): boolean {
    const menu = this.menu;
    if (!menu.visible) return false;
    if (menu.state === 'open') {
      menu.hide();
      return true;
    }
    const caretBounds = getElementInfo(this, this.model.position)?.bounds;
    if (!caretBounds) return false;
    const location = { x: caretBounds.right, y: caretBounds.bottom };
    menu.show({
      target: this.element!.querySelector<HTMLElement>('[part=container]')!,
      location,
      onDismiss: () => this.element?.focus(),
    });
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
    if (!prompt) return '';

    const first = this.model.offsetOf(prompt.firstChild);
    const last = this.model.offsetOf(prompt.lastChild);

    return this.model.getValue(first, last, format);
  }

  getPrompts(filter?: {
    id?: string;
    locked?: boolean;
    correctness?: 'correct' | 'incorrect' | 'undefined';
  }): string[] {
    return this.model.atoms
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
    if (insertOptions?.silenceNotifications)
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

  getPromptState(id: string): ['correct' | 'incorrect' | undefined, boolean] {
    const prompt = this.getPrompt(id);
    if (!prompt) {
      console.error(`MathLive {{SDK_VERSION}}: unknown prompt ${id}`);
      return [undefined, true];
    }
    return [prompt.correctness, prompt.locked];
  }

  getPromptRange(id: string): Range {
    const prompt = this.getPrompt(id);
    if (!prompt) {
      console.error(`MathLive {{SDK_VERSION}}: unknown prompt ${id}`);
      return [0, 0];
    }
    return this.model.getBranchRange(this.model.offsetOf(prompt), 'body');
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

  snapshot(op?: string): void {
    if (this.undoManager.snapshot(op)) {
      if (window.mathVirtualKeyboard.visible)
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

  stopCoalescingUndo(): void {
    this.undoManager.stopCoalescing(this.model.selection);
  }

  stopRecording(): void {
    this.undoManager.stopRecording();
  }

  startRecording(): void {
    this.undoManager.startRecording();
  }

  undo(): void {
    if (!this.undoManager.undo()) return;
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
    this.host?.dispatchEvent(
      new CustomEvent('undo-state-change', {
        bubbles: true,
        composed: true,
        detail: { type: 'redo' },
      })
    );
  }

  resetUndo(): void {
    this.undoManager?.reset();
  }

  onSelectionDidChange(): void {
    const model = this.model;

    // Keep the content of the keyboard sink in sync with the selection.
    // Safari will not dispatch cut/copy/paste unless there is a DOM selection.
    this.keyboardDelegate.setValue(
      model.getValue(model.selection, 'latex-expanded')
    );

    // If we move the selection outside of a LaTeX group, close the group
    if (model.selectionIsCollapsed) {
      const latexGroup = getLatexGroup(model);
      const pos = model.position;
      const cursor = model.at(pos);
      const mode = cursor.mode ?? effectiveMode(this.options);
      if (
        latexGroup &&
        (pos < model.offsetOf(latexGroup.firstChild) - 1 ||
          pos > model.offsetOf(latexGroup.lastChild) + 1)
      ) {
        // We moved outside a LaTeX group
        complete(this, 'accept', { mode });
        model.position = model.offsetOf(cursor);
      } else {
        // If we're at the start or the end of a LaTeX group,
        // move inside the group and don't switch mode.
        const sibling = model.at(pos + 1);
        if (sibling?.type === 'first' && sibling.mode === 'latex')
          model.position = pos + 1;
        else if (latexGroup && sibling?.mode !== 'latex')
          model.position = pos - 1;
        else {
          // We may have moved from math to text, or text to math.
          this.switchMode(mode);
        }
      }
    }

    // Dispatch `selection-change` event
    this.host?.dispatchEvent(
      new Event('selection-change', {
        bubbles: true,
        composed: true,
      })
    );

    if (window.mathVirtualKeyboard.visible)
      window.mathVirtualKeyboard.update(makeProxy(this));

    updateEnvironmentPopover(this);
  }

  onContentWillChange(options: ContentChangeOptions): boolean {
    return (
      this.host?.dispatchEvent(
        new InputEvent('beforeinput', {
          ...options,
          // To work around a bug in WebKit/Safari (the inputType property gets stripped), include the inputType as the 'data' property. (see #1843)
          data: options.data ? options.data : (options.inputType ?? ''),
          cancelable: true,
          bubbles: true,
          composed: true,
        })
      ) ?? true
    );
  }

  onFocus(): void {
    if (this.focusBlurInProgress || !this.blurred) return;
    this.focusBlurInProgress = true;
    this.blurred = false;

    this.stopCoalescingUndo();

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

    render(this, { interactive: true });

    setTimeout(() => {
      if (!isValidMathfield(this)) return;

      //
      // Capture the focus/blur events to avoid double-dispatching
      //
      const abortController = new AbortController();
      const signal = abortController.signal;
      for (const event of ['focus', 'blur', 'focusin', 'focusout']) {
        this.host?.addEventListener(
          event,
          (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
          },
          { once: true, capture: true, signal }
        );
      }

      this.keyboardDelegate.blur();
      this.keyboardDelegate.focus();
      this.connectToVirtualKeyboard();
      this.focusBlurInProgress = false;

      abortController.abort();
    }, 60);
  }

  onBlur(): void {
    if (this.focusBlurInProgress || this.blurred) return;
    this.focusBlurInProgress = true;

    this.stopCoalescingUndo();

    this.blurred = true;
    this.ariaLiveText!.textContent = '';

    hideSuggestionPopover(this);

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

    hideEnvironmentPopover();

    if (MathfieldElement.restoreFocusWhenDocumentFocused) {
      //
      // When the document/window loses focus, for example by switching
      // to another tab, the mathfield will be blured. When the window
      // regains focus, we'd like the focus to be restored on the mathfield,
      // like the browsers do for `<textarea>` elements. However, they
      // don't do that for custom elements, so we do it ourselves. @futureweb
      //

      // Wait for the window focus to change
      // (the mathfield gets blurred before the window)
      const controller = new AbortController();
      const signal = controller.signal;
      window.addEventListener(
        'blur',
        () => {
          window.addEventListener(
            'focus',
            () => {
              if (isValidMathfield(this)) this.focus({ preventScroll: true });
            },
            { once: true, signal }
          );
        },
        { once: true, signal }
      );

      // If something else gets the focus (could be the mathfield too),
      // cancel the above
      document.addEventListener('focusin', () => controller.abort(), {
        once: true,
      });

      // If user clicks anywhere, cancel the refocus (covers case where
      // click doesn't cause an element to come into focus)
      document.addEventListener('click', () => controller.abort(), {
        once: true,
      });
    }
  }

  onInput(text: string): void {
    onInput(this, text);
  }

  onKeystroke(evt: KeyboardEvent): boolean {
    return onKeystroke(this, evt);
  }

  onCompositionStart(_composition: string): void {
    // Clear the selection if there is one
    deleteRange(this.model, range(this.model.selection), 'insertText');
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

  onCompositionUpdate(composition: string): void {
    updateComposition(this.model, composition);
    requestUpdate(this);
  }

  onCompositionEnd(composition: string): void {
    removeComposition(this.model);
    onInput(this, composition, { simulateKeystroke: true });
  }

  onCut(ev: ClipboardEvent): void {
    // Ignore if in read-only mode
    if (!this.isSelectionEditable) {
      this.model.announce('plonk');
      return;
    }

    if (this.model.contentWillChange({ inputType: 'deleteByCut' })) {
      // Snapshot the undo state
      this.stopCoalescingUndo();

      // Copy to the clipboard
      if (ev.clipboardData) ModeEditor.onCopy(this, ev);
      else ModeEditor.copyToClipboard(this, 'latex');

      // Delete the selection
      deleteRange(this.model, range(this.model.selection), 'deleteByCut');

      this.snapshot('cut');

      requestUpdate(this);
    }
  }

  onCopy(ev: ClipboardEvent): void {
    if (ev.clipboardData) ModeEditor.onCopy(this, ev);
    else ModeEditor.copyToClipboard(this, 'latex');
  }

  onPaste(ev: ClipboardEvent): boolean {
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
  }

  private onGeometryChange(): void {
    this._menu?.hide();
    updateSuggestionPopoverPosition(this);
    updateEnvironmentPopover(this);
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
    // Find an atom id in this atom or its children
    let target = atom;
    while (!target.id && target.hasChildren) target = atom.children[0];

    return this.field.querySelector(
      `[data-atom-id="${target.id}"]`
    ) as HTMLSpanElement;
  }

  get context(): Readonly<ContextInterface> {
    return {
      registers: this.options.registers ?? {},
      smartFence: this.smartFence,
      letterShapeStyle: this.letterShapeStyle,
      minFontScale: this.minFontScale,
      maxMatrixCols: this.maxMatrixCols,
      placeholderSymbol: this.options.placeholderSymbol ?? '▢',
      colorMap: (name) => this.colorMap(name),
      backgroundColorMap: (name) => this.backgroundColorMap(name),
      getMacro: (token) =>
        getMacroDefinition(
          token,
          this.options.macros as NormalizedMacroDictionary
        ),
      atomIdsSettings: { seed: 'random', groupNumbers: false },
    };
  }
}
