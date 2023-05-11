import type {
  EditToolbarOptions,
  AlphabeticKeyboardLayout,
  NormalizedVirtualKeyboardLayer,
  VirtualKeyboardKeycap,
  VirtualKeyboardLayout,
  VirtualKeyboardLayoutCore,
} from '../public/virtual-keyboard';

import type {
  MathfieldProxy,
  VirtualKeyboardInterface,
  VirtualKeyboardMessage,
  VirtualKeyboardMessageAction,
} from '../public/virtual-keyboard';
import type { OriginValidator } from '../public/options';
import type { MathfieldElement } from '../public/mathfield-element';

import { isTouchCapable } from '../common/capabilities';
import { isArray } from '../common/types';
import { validateOrigin } from '../editor-mathfield/utils';
import { getCommandTarget, COMMANDS } from '../editor/commands';
import { SelectorPrivate } from '../editor/types';

import { isVirtualKeyboardMessage, VIRTUAL_KEYBOARD_MESSAGE } from './proxy';
import {
  makeKeyboardElement,
  makeEditToolbar,
  releaseStylesheets,
  normalizeLayout,
  renderKeycap,
} from './utils';

import { hideVariantsPanel, showVariantsPanel } from './variants';
import { Style } from '../public/core-types';

export class VirtualKeyboard implements VirtualKeyboardInterface, EventTarget {
  private _visible: boolean;
  private _element?: HTMLDivElement;
  private _rebuilding: boolean;
  private readonly observer: ResizeObserver;
  private originalContainerBottomPadding: string | null = null;

  private connectedMathfieldWindow: Window | undefined;
  private readonly listeners: {
    [type: string]: Set<EventListenerOrEventListenerObject | null>;
  };

  private keycapRegistry: Record<string, Partial<VirtualKeyboardKeycap>> = {};

  latentLayer: string;

  get currentLayer(): string {
    return this._element?.querySelector('.MLK__layer.is-visible')?.id ?? '';
  }

  set currentLayer(id: string) {
    if (!this._element) {
      this.latentLayer = id;
      return;
    }
    let newActive = id
      ? this._element.querySelector(`#${id}.MLK__layer`)
      : null;
    if (!newActive) newActive = this._element.querySelector('.MLK__layer');

    if (newActive) {
      this._element
        .querySelector('.MLK__layer.is-visible')
        ?.classList.remove('is-visible');
      newActive.classList.add('is-visible');
    }

    if (this.isShifted) this.render();
  }

  private _isCapslock = false;
  get isCapslock(): boolean {
    return this._isCapslock;
  }
  set isCapslock(val: boolean) {
    this._element?.classList.toggle('is-caps-lock', this.shiftPressCount === 2);

    if (val === this._isCapslock) return;

    this._isCapslock = val;
    this.isShifted = val;
  }

  /** `0`: not pressed
   *
   * `1`: Shift is locked for next char only
   *
   * `2`: Shift is locked for all characters
   */
  private _shiftPressCount: 0 | 1 | 2 = 0;

  get shiftPressCount(): 0 | 1 | 2 {
    return this._shiftPressCount;
  }

  /** Increments `_shiftPressCount` by `1`, and handle the appropriate related behavior for each val */
  incrementShiftPress(): void {
    if (++this._shiftPressCount > 2) this.resetShiftPress();
    else this.isCapslock = true;
  }

  /** Decrements `_shiftPressCount` by `1`, and sets `isCapslock` to `false` if reaches `0` */
  decrementShiftPress(): void {
    this._shiftPressCount = Math.max(--this._shiftPressCount, 0) as 0 | 1 | 2;
    if (this._shiftPressCount === 0) this.isCapslock = false;
  }

  /** Resets `_shiftPressCount` to `0`, and sets `isCapslock` to `false` */
  resetShiftPress(): void {
    this._shiftPressCount = 0;
    this.isCapslock = false;
  }

  private _isShifted = false;
  get isShifted(): boolean {
    return this._isShifted;
  }

  set isShifted(shifted: boolean) {
    if (this._isCapslock) shifted = true;
    if (this._isShifted === shifted) return;

    this._isShifted = shifted;

    this.render();
  }

  resetKeycapRegistry(): void {
    this.keycapRegistry = {};
  }

  registerKeycap(keycap: Partial<VirtualKeyboardKeycap>): string {
    const id =
      'ML__k' +
      Date.now().toString(36).slice(-2) +
      Math.floor(Math.random() * 0x186a0).toString(36);

    this.keycapRegistry[id] = keycap;
    return id;
  }

  getKeycap(
    id: string | undefined
  ): Partial<VirtualKeyboardKeycap> | undefined {
    return id ? this.keycapRegistry[id] : undefined;
  }

  getLayer(id: string): NormalizedVirtualKeyboardLayer | undefined {
    const layouts = this.normalizedLayouts;
    for (const layout of layouts)
      for (const layer of layout.layers) if (layer.id === id) return layer;

    return undefined;
  }

  private _alphabeticLayout: AlphabeticKeyboardLayout;
  get alphabeticLayout(): AlphabeticKeyboardLayout {
    return this._alphabeticLayout;
  }
  set alphabeticLayout(value: AlphabeticKeyboardLayout) {
    this._alphabeticLayout = value;
    this.rebuild();
  }

  private _actionKeycap: Partial<VirtualKeyboardKeycap>;
  get actionKeycap(): Partial<VirtualKeyboardKeycap> {
    return this._actionKeycap;
  }
  set actionKeycap(value: string | Partial<VirtualKeyboardKeycap>) {
    this._actionKeycap = typeof value === 'string' ? { label: value } : value;
  }
  private _shiftKeycap: Partial<VirtualKeyboardKeycap>;
  get shiftKeycap(): Partial<VirtualKeyboardKeycap> {
    return this._shiftKeycap;
  }
  set shiftKeycap(value: string | Partial<VirtualKeyboardKeycap>) {
    this._shiftKeycap = typeof value === 'string' ? { label: value } : value;
  }
  private _backspaceKeycap: Partial<VirtualKeyboardKeycap>;
  get backspaceKeycap(): Partial<VirtualKeyboardKeycap> {
    return this._backspaceKeycap;
  }
  set backspaceKeycap(value: string | Partial<VirtualKeyboardKeycap>) {
    this._backspaceKeycap =
      typeof value === 'string' ? { label: value } : value;
  }
  private _tabKeycap: Partial<VirtualKeyboardKeycap>;
  get tabKeycap(): Partial<VirtualKeyboardKeycap> {
    return this._tabKeycap;
  }
  set tabKeycap(value: string | Partial<VirtualKeyboardKeycap>) {
    this._tabKeycap = typeof value === 'string' ? { label: value } : value;
  }

  private _layouts: 'default' | (string | VirtualKeyboardLayout)[];
  get layouts(): 'default' | (string | VirtualKeyboardLayout)[] {
    return this._layouts;
  }
  set layouts(value: 'default' | (string | VirtualKeyboardLayout)[]) {
    this._layouts = value;
    this.updateNormalizedLayouts();
    this.rebuild();
  }

  private updateNormalizedLayouts(): void {
    const layouts = Array.isArray(this._layouts)
      ? [...this._layouts]
      : [this._layouts];
    const defaultIndex = layouts.findIndex((x) => x === 'default');
    if (defaultIndex >= 0) {
      layouts.splice(
        defaultIndex,
        1,
        'numeric',
        'symbols',
        'alphabetic',
        'greek'
      );
    }

    this._normalizedLayouts = layouts.map((x) => normalizeLayout(x));
  }

  private _normalizedLayouts:
    | (VirtualKeyboardLayoutCore & {
        layers: NormalizedVirtualKeyboardLayer[];
      })[]
    | undefined;
  get normalizedLayouts(): (VirtualKeyboardLayoutCore & {
    layers: NormalizedVirtualKeyboardLayer[];
  })[] {
    if (!this._normalizedLayouts) this.updateNormalizedLayouts();
    return this._normalizedLayouts!;
  }

  private _editToolbar: EditToolbarOptions;
  get editToolbar(): EditToolbarOptions {
    return this._editToolbar;
  }
  set editToolbar(value: EditToolbarOptions) {
    this._editToolbar = value;
    this.rebuild();
  }

  private _container: HTMLElement | null;
  get container(): HTMLElement | null {
    return this._container;
  }
  set container(value: HTMLElement | null) {
    this._container = value;
    this.rebuild();
  }

  targetOrigin: string;
  originValidator: OriginValidator;

  private static _singleton: VirtualKeyboard;
  static get singleton(): VirtualKeyboard {
    if (!this._singleton) this._singleton = new VirtualKeyboard();
    return this._singleton;
  }

  private _style: Style;
  get style(): Style {
    return this._style;
  }

  constructor() {
    this.targetOrigin = window.origin;
    this.originValidator = 'none';

    this._alphabeticLayout = 'auto';
    this._layouts = 'default';
    this._editToolbar = 'default';

    this._container = window.document?.body ?? null;

    this._visible = false;
    this._rebuilding = false;
    this.observer = new ResizeObserver((_entries) => {
      this.adjustBoundingRect();
      this.dispatchEvent(new Event('geometrychange'));
      this.sendMessage('geometry-changed', { boundingRect: this.boundingRect });
    });

    this.listeners = {};

    window.top?.addEventListener('message', this);

    document.body.addEventListener('focusin', (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (
        target?.isConnected &&
        target.tagName?.toLowerCase() === 'math-field' &&
        isTouchCapable()
      ) {
        const mf = target as MathfieldElement;
        if (mf.mathVirtualKeyboardPolicy === 'auto' && !mf.readOnly)
          this.show({ animate: true });
      }
    });

    document.addEventListener('focusout', (evt) => {
      const target = evt.target as MathfieldElement;
      if (target.mathVirtualKeyboardPolicy !== 'manual') {
        // If after a short delay the active element is no longer
        // a mathfield (or there is no active element),
        // hide the virtual keyboard
        setTimeout(() => {
          let target = document.activeElement;
          let focusedMathfield = false;
          while (target) {
            if (target.tagName?.toLowerCase() === 'math-field') {
              focusedMathfield = true;
              break;
            }
            target = target.shadowRoot?.activeElement ?? null;
          }
          if (!focusedMathfield) this.hide();
        }, 300);
      }
    });
  }

  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    _options?: AddEventListenerOptions | boolean
  ): void {
    if (!this.listeners[type]) this.listeners[type] = new Set();
    if (!this.listeners[type].has(callback)) this.listeners[type].add(callback);
  }

  dispatchEvent(event: Event): boolean {
    if (!this.listeners[event.type] || this.listeners[event.type].size === 0)
      return true;
    this.listeners[event.type].forEach((x) => {
      if (typeof x === 'function') x(event);
      else x?.handleEvent(event);
    });

    return !event.defaultPrevented;
  }

  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    _options?: EventListenerOptions | boolean
  ): void {
    if (this.listeners[type]) this.listeners[type].delete(callback);
  }

  get element(): HTMLDivElement | undefined {
    return this._element;
  }
  set element(val: HTMLDivElement | undefined) {
    if (this._element === val) return;
    this._element?.remove();
    this._element = val;
  }
  get visible(): boolean {
    return this._visible;
  }
  set visible(val: boolean) {
    if (val) this.show();
    else this.hide();
  }

  get boundingRect(): DOMRect {
    if (!this._visible) return new DOMRect();
    const plate = this._element?.getElementsByClassName('MLK__plate')[0];
    if (plate) return plate.getBoundingClientRect();
    return new DOMRect();
  }

  adjustBoundingRect(): void {
    // Adjust the keyboard height
    const h = this.boundingRect.height;
    if (this.container === document.body) {
      this._element?.style.setProperty(
        '--keyboard-height',
        `calc(${h}px + env(safe-area-inset-bottom, 0))`
      );
      const keyboardHeight = h - 1;
      this.container!.style.paddingBottom = this.originalContainerBottomPadding
        ? `calc(${this.originalContainerBottomPadding} + ${keyboardHeight}px)`
        : `${keyboardHeight}px`;
    } else this._element?.style.setProperty('--keyboard-height', `${h}px`);
  }

  rebuild(): void {
    if (this._rebuilding || !this._element) return;

    this._rebuilding = true;

    const currentLayerId = this.currentLayer;
    requestAnimationFrame(() => {
      this._rebuilding = false;

      // By the time the handler is called, the _element may have been destroyed
      if (this._element) {
        this._element.remove();
        this._element = undefined;
      }
      if (this.visible) {
        this.buildAndAttachElement();

        // Restore the active keyboard
        this.currentLayer = currentLayerId;

        this.render();

        this.adjustBoundingRect();

        // Show the keyboard panel
        this._element!.classList.add('is-visible');
      }
    });
  }

  /** Update the keycaps to account for the current state */
  render(): void {
    if (!this._element) return;

    // If there's a container, hide the default backdrop
    const layer = this.getLayer(this.currentLayer);
    this._element.classList.toggle(
      'backdrop-is-transparent',
      Boolean(layer && (layer.backdrop || layer.container))
    );

    const keycaps = this._element.querySelectorAll<HTMLElement>(
      '.MLK__layer.is-visible .MLK__keycap, .MLK__layer.is-visible .action, .fnbutton, .MLK__layer.is-visible .bigfnbutton, .MLK__layer.is-visible .shift'
    );

    if (!keycaps) return;

    for (const keycapElement of keycaps) {
      const keycap = this.getKeycap(keycapElement.id);
      if (keycap) {
        const [markup, cls] = renderKeycap(keycap, { shifted: this.isShifted });
        keycapElement.innerHTML = window.MathfieldElement.createHTML(markup);
        keycapElement.className = cls;
      }
    }
  }

  show(options?: { animate: boolean }): void {
    if (this._visible) return;

    const container = this.container;
    if (!container) return;

    // Confirm
    if (!this.stateWillChange(true)) return;

    if (!this._element) {
      this.buildAndAttachElement();
      this.adjustBoundingRect();
    }

    if (!this._visible) {
      const plate = this._element!.getElementsByClassName(
        'MLK__plate'
      )[0] as HTMLElement;
      if (plate) this.observer.observe(plate);

      if (container === window.document.body) {
        const padding = container.style.paddingBottom;
        this.originalContainerBottomPadding = padding;
        const keyboardHeight = plate.offsetHeight - 1;
        container.style.paddingBottom = padding
          ? `calc(${padding} + ${keyboardHeight}px)`
          : `${keyboardHeight}px`;
      }
      window.addEventListener('mouseup', this);
      window.addEventListener('blur', this);
      window.addEventListener('keydown', this, { capture: true });
      window.addEventListener('keyup', this, { capture: true });

      this.currentLayer = this.latentLayer;

      this.render();

      this._element?.classList.toggle(
        'is-caps-lock',
        this.shiftPressCount === 2
      );
    }

    this._visible = true;

    // For the transition effect to work, the property has to be changed
    // after the insertion in the DOM.
    if (options?.animate) {
      requestAnimationFrame(() => {
        if (this._element) {
          this._element.classList.add('animate');
          this._element.addEventListener(
            'transitionend',
            () => this._element?.classList.remove('animate'),
            { once: true }
          );
          this._element.classList.add('is-visible');
          this.stateChanged();
        }
      });
    } else {
      this._element!.classList.add('is-visible');
      this.stateChanged();
    }
  }

  hide(_options?: { animate: boolean }): void {
    const container = this.container;
    if (!container) return;
    if (!this._visible) return;

    // Confirm
    if (!this.stateWillChange(false)) return;
    this._visible = false;

    if (this._element) {
      this.latentLayer = this.currentLayer;

      const plate = this._element.getElementsByClassName('MLK__plate')[0];
      if (plate) this.observer.unobserve(plate);

      // Remove the element from the DOM
      window.removeEventListener('mouseup', this);
      window.removeEventListener('blur', this);
      window.removeEventListener('keydown', this, { capture: true });
      window.removeEventListener('keyup', this, { capture: true });
      window.removeEventListener('contextmenu', this, { capture: true });
      hideVariantsPanel();

      releaseStylesheets();

      this._element?.remove();
      this._element = undefined;

      if (this.originalContainerBottomPadding !== null)
        container.style.paddingBottom = this.originalContainerBottomPadding;
    }

    this.stateChanged();
  }

  get height(): number {
    return this.element?.offsetHeight ?? 0;
  }

  buildAndAttachElement(): void {
    console.assert(!this.element);
    this.element = makeKeyboardElement(this);
    // this.element.addEventListener('pointerdown', () => this.focus());

    // To prevent the long press contextmenu from showing up in Chrome...
    window.addEventListener('contextmenu', this, { capture: true });

    this.element.addEventListener(
      'contextmenu',
      (ev) => {
        if (!ev.shiftKey) {
          if (ev.ctrlKey || ev.button === 2)
            showVariantsPanel(ev.target as HTMLElement);
          ev.preventDefault();
          ev.stopPropagation();
        }
      },
      { capture: true }
    );
    this.container?.appendChild(this.element);
  }

  handleEvent(evt: Event): void {
    if (isVirtualKeyboardMessage(evt)) {
      if (!validateOrigin(evt.origin, this.originValidator)) {
        throw new DOMException(
          `Message from unknown origin (${evt.origin}) cannot be handled`,
          'SecurityError'
        );
      }
      if (evt.data.action === 'disconnect')
        this.connectedMathfieldWindow = undefined;
      else if (
        evt.data.action !== 'update-setting' &&
        evt.data.action !== 'proxy-created' &&
        evt.data.action !== 'execute-command'
      ) {
        console.assert(evt.source !== undefined);
        this.connectedMathfieldWindow = evt.source as Window;
      }

      this.handleMessage(evt.data, evt.source);
    }

    if (!this._element) return;

    switch (evt.type) {
      case 'mouseup':
      case 'blur':
        // Safari on iOS will aggressively attempt to select when there is a long
        // press. Restore the userSelect on mouse up
        document.body.style.userSelect = '';

        this.isShifted = false;
        break;

      case 'contextmenu':
        if ((evt as PointerEvent).button !== 2) evt.preventDefault();
        break;

      case 'keydown': {
        const kev = evt as KeyboardEvent;
        if (kev.key === 'Shift') this.incrementShiftPress();
        break;
      }
      case 'keyup': {
        const kev = evt as KeyboardEvent;
        if (kev.key !== 'Shift' && this._shiftPressCount === 1) {
          this.isCapslock = false;
          this._shiftPressCount = 0;
        }
        break;
      }
    }
  }

  handleMessage(
    msg: VirtualKeyboardMessage,
    source: MessageEventSource | null
  ): void {
    const { action } = msg;
    if (action === 'execute-command') {
      const { command } = msg;

      // Avoid an infinite messages loop if within one window
      const commandTarget = getCommandTarget(command!);
      if (commandTarget !== 'virtual-keyboard' && window === window.parent)
        return;

      this.executeCommand(command!);
      return;
    }

    if (action === 'connect') {
      this.sendMessage(
        'synchronize-proxy',
        {
          boundingRect: this.boundingRect,
          alphabeticLayout: this._alphabeticLayout,
          layouts: this._layouts,
          editToolbar: this._editToolbar,
        },
        source
      );
    }

    if (action === 'disconnect') return;

    // If the mathVirtualKeyboardPolicy was set to `sandboxed`,
    // we can be a VirtualKeyboard instance (not a proxy) inside a non-top-level
    // browsing context. If that's the case, safely ignored messages that could
    // be dispatched from other mathfields, as we will only respond to
    // direct invocation via function dispatching on the VK instance.
    if (window !== window.top) return;

    if (action === 'show') {
      if (typeof msg.animate !== 'undefined')
        this.show({ animate: msg.animate });
      else this.show();
      return;
    }

    if (action === 'hide') {
      if (typeof msg.animate !== 'undefined')
        this.hide({ animate: msg.animate });
      else this.hide();
      return;
    }

    if (action === 'update-setting') {
      // A proxy has an updated setting
      if (msg.alphabeticLayout) this.alphabeticLayout = msg.alphabeticLayout;
      if (msg.layouts) this.layouts = msg.layouts;
      if (msg.editToolbar) this.editToolbar = msg.editToolbar;
      return;
    }

    if (action === 'proxy-created') {
      // A new proxy has been created. Dispatch a message to synchronize
      // the reflected state
      this.sendMessage(
        'synchronize-proxy',
        {
          boundingRect: this.boundingRect,
          alphabeticLayout: this._alphabeticLayout,
          layouts: this._layouts,
          editToolbar: this._editToolbar,
        },
        source
      );
      return;
    }
  }

  private sendMessage(
    action: VirtualKeyboardMessageAction,
    payload: any,
    target?: MessageEventSource | null
  ): void {
    if (!target) target = this.connectedMathfieldWindow;
    if (
      this.targetOrigin === null ||
      this.targetOrigin === 'null' ||
      target === window
    ) {
      window.dispatchEvent(
        new MessageEvent('message', {
          source: window,
          data: {
            type: VIRTUAL_KEYBOARD_MESSAGE,
            action,
            ...payload,
          },
        })
      );
      return;
    }
    if (target) {
      target.postMessage(
        {
          type: VIRTUAL_KEYBOARD_MESSAGE,
          action,
          ...payload,
        },
        { targetOrigin: this.targetOrigin }
      );
    } else {
      if (
        action === 'execute-command' &&
        Array.isArray(payload.command) &&
        payload.command[0] === 'insert'
      ) {
        const s = payload.command[1].split('');
        for (const c of s) {
          this.dispatchEvent(
            new KeyboardEvent('keydown', { key: c, bubbles: true })
          );
          this.dispatchEvent(
            new KeyboardEvent('keyup', { key: c, bubbles: true })
          );
        }
      }
    }
  }

  stateWillChange(visible: boolean): boolean {
    const defaultNotPrevented = this.dispatchEvent(
      new CustomEvent('before-virtual-keyboard-toggle', {
        detail: { visible },
        bubbles: true,
        cancelable: true,
        composed: true,
      })
    );
    return defaultNotPrevented;
  }

  stateChanged(): void {
    this.dispatchEvent(new Event('virtual-keyboard-toggle'));
    this.sendMessage('geometry-changed', {
      boundingRect: this.boundingRect,
    });
  }

  /**
   * @category Focus
   */
  public focus(): void {
    this.sendMessage('focus', {});
  }

  /**
   * @category Focus
   */
  public blur(): void {
    this.sendMessage('blur', {});
  }

  updateToolbar(mf: MathfieldProxy): void {
    const el = this._element;
    if (!el) return;

    el.classList.toggle('can-undo', mf.canUndo);
    el.classList.toggle('can-redo', mf.canRedo);
    el.classList.toggle('can-copy', !mf.selectionIsCollapsed);
    el.classList.toggle('can-copy', !mf.selectionIsCollapsed);
    el.classList.toggle('can-paste', true);

    const toolbars = el.querySelectorAll('.ML__edit-toolbar');
    if (!toolbars) return;
    for (const toolbar of toolbars)
      toolbar.innerHTML = makeEditToolbar(this, mf);
  }

  update(mf: MathfieldProxy): void {
    this._style = mf.style;
    this.updateToolbar(mf);
  }

  connect(): void {
    this.connectedMathfieldWindow = window;
  }

  disconnect(): void {
    this.connectedMathfieldWindow = undefined;
  }

  executeCommand(
    command: SelectorPrivate | [SelectorPrivate, ...any[]]
  ): boolean {
    let selector: SelectorPrivate;
    let args: string[] = [];
    if (isArray(command)) {
      selector = command[0];
      args = command.slice(1);
    } else selector = command;

    // Convert kebab case (like-this) to camel case (likeThis).
    selector = selector.replace(/-\w/g, (m) =>
      m[1].toUpperCase()
    ) as SelectorPrivate;
    if (getCommandTarget(command) === 'virtual-keyboard')
      return COMMANDS[selector]!.fn(...args);

    this.sendMessage('execute-command', { command });
    return false;
  }

  dispose(): void {
    window.removeEventListener('mouseup', this);
    window.removeEventListener('blur', this);
    window.removeEventListener('message', this);
  }
}
