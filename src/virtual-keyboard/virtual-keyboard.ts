import { isTouchCapable } from 'common/capabilities';
import { isArray } from 'common/types';
import { on, validateOrigin } from 'editor-mathfield/utils';
import { getCommandTarget, COMMANDS } from 'editor/commands';
import { SelectorPrivate } from 'editor/types';
import { MathfieldElement } from 'mathlive';
import {
  AlphabeticKeyboardLayout,
  OriginValidator,
  LayoutDefinition,
  ActionToolbarOptions,
} from '../public/options';
import { isVirtualKeyboardMessage, VIRTUAL_KEYBOARD_MESSAGE } from './proxy';
import {
  makeKeyboardElement,
  unshiftKeyboardLayer,
  makeActionToolbar,
  releaseStylesheets,
} from './utils';
import type {
  MathfieldProxy,
  VirtualKeyboardInterface,
  VirtualKeyboardMessageAction,
} from './types';
import { hideVariantsPanel } from './variants';

export class VirtualKeyboard implements VirtualKeyboardInterface, EventTarget {
  private _visible: boolean;
  private _element?: HTMLDivElement;
  private _dirty: boolean;
  private readonly observer: ResizeObserver;
  private originalContainerBottomPadding: string | null = null;

  private connectedMathfieldWindow: Window | undefined;
  private readonly listeners: {
    [type: string]: Set<EventListenerOrEventListenerObject | null>;
  };

  private _alphabeticLayout: AlphabeticKeyboardLayout;
  get alphabeticLayout(): AlphabeticKeyboardLayout {
    return this._alphabeticLayout;
  }
  set alphabeticLayout(value: AlphabeticKeyboardLayout) {
    this._alphabeticLayout = value;
    this.rebuild();
  }

  private _layouts: (string | LayoutDefinition)[];
  get layouts(): (string | LayoutDefinition)[] {
    return this._layouts;
  }
  set layouts(value: (string | LayoutDefinition)[]) {
    const layouts = Array.isArray(value) ? [...value] : [value];
    const defaultIndex = layouts.findIndex((x) => x === 'default');
    if (defaultIndex >= 0) {
      layouts.splice(
        defaultIndex,
        1,
        'numeric',
        'functions',
        'symbols',
        'alphabetic',
        'greek'
      );
    }

    this._layouts = layouts;
    this.rebuild();
  }

  private _actionToolbar: ActionToolbarOptions;
  get actionToolbar(): ActionToolbarOptions {
    return this._actionToolbar;
  }
  set actionToolbar(value: ActionToolbarOptions) {
    this._actionToolbar = value;
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

  constructor() {
    this.targetOrigin = globalThis.origin;
    this.originValidator = 'same-origin';

    this._alphabeticLayout = 'auto';
    this._layouts = ['numeric', 'functions', 'symbols', 'alphabetic', 'greek'];
    this._actionToolbar = 'default';

    this._container = globalThis.document?.body ?? null;

    this._visible = false;
    this._dirty = true;
    this.observer = new ResizeObserver((_entries) => {
      // Adjust the keyboard height
      const h = this.boundingRect.height;
      if (this.container === document.body) {
        this._element?.style.setProperty(
          '--keyboard-height',
          `calc(${h}px + env(safe-area-inset-bottom, 0))`
        );
        const keyboardHeight = h - 1;
        this.container!.style.paddingBottom = this
          .originalContainerBottomPadding
          ? `calc(${this.originalContainerBottomPadding} + ${keyboardHeight}px)`
          : `${keyboardHeight}px`;
      } else this._element?.style.setProperty('--keyboard-height', `${h}px`);

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
          this.show();
      }
    });

    document.addEventListener('focusout', () => {
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
    // @todo: sendMessage()

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

  rebuild(): void {
    if (this._dirty || !this._element) return;
    this._dirty = true;
    let currentLayoutId = '';
    const currentLayout = this._element.querySelector('.MLK__layer.is-visible');
    if (currentLayout)
      currentLayoutId = currentLayout.getAttribute('data-layer') ?? '';
    requestAnimationFrame(() => {
      this._dirty = false;

      if (this._element) {
        this._element.remove();
        this._element = undefined;
      }
      if (this.visible) {
        this.buildAndAttachElement();

        // Restore the active keyboard
        const newActive = this.element!.querySelector(
          `.MLK__layer[data-layer="${currentLayoutId}"]`
        );
        if (newActive) {
          this.element!.querySelector(
            '.MLK__layer.is-visible'
          )?.classList.remove('is-visible');
          newActive.classList.add('is-visible');
        }

        // Show the keyboard panel
        this.element!.classList.add('is-visible');
      }
    });
  }

  show(): void {
    if (this._visible) return;

    const container = this.container;
    if (!container) return;

    // Confirm
    if (!this.stateWillChange(true)) return;

    if (!this._element) this.buildAndAttachElement();

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
    }

    // For the transition effect to work, the property has to be changed
    // after the insertion in the DOM.
    requestAnimationFrame(() => {
      this._element?.classList.add('is-visible');
      this.focus();
      this._visible = true;
      this.stateChanged();
    });
  }

  hide(): void {
    const container = this.container;
    if (!container) return;
    if (!this._visible) return;

    // Confirm
    if (!this.stateWillChange(false)) return;

    if (this._element) {
      const plate = this._element.getElementsByClassName('MLK__plate')[0];
      if (plate) this.observer.unobserve(plate);

      // Remove the element from the DOM
      window.removeEventListener('mouseup', this);
      window.removeEventListener('blur', this);
      hideVariantsPanel();
      this._visible = false;

      releaseStylesheets();

      this._element?.remove();
      this._element = undefined;

      if (this.originalContainerBottomPadding !== null)
        container.style.paddingBottom = this.originalContainerBottomPadding;
    }

    this._visible = false;
    this.stateChanged();
  }

  get height(): number {
    return this.element?.offsetHeight ?? 0;
  }

  buildAndAttachElement(): void {
    console.assert(!this.element);
    this.element = makeKeyboardElement(this);
    on(this.element, 'mousedown', () => this.focus());
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

      const { action } = evt.data;
      if (action === 'execute-command') {
        const { command } = evt.data;
        this.connectedMathfieldWindow = evt.source as Window;

        // Avoid an infinite messages loop if within one window
        const commandTarget = getCommandTarget(command!);
        if (commandTarget !== 'virtual-keyboard' && window === window.parent)
          return;

        this.executeCommand(command!);
        return;
      }

      if (action === 'connect') {
        this.connectedMathfieldWindow = evt.source as Window;
        return;
      }

      if (action === 'disconnect') {
        this.connectedMathfieldWindow = undefined;
        return;
      }

      if (action === 'show') {
        this.connectedMathfieldWindow = evt.source as Window;
        this.show();
        return;
      }

      if (action === 'hide') {
        this.connectedMathfieldWindow = evt.source as Window;
        this.hide();
        return;
      }

      if (action === 'update-setting') {
        // A proxy has an updated setting
        if (evt.data.alphabeticLayout)
          this.alphabeticLayout = evt.data.alphabeticLayout;
        if (evt.data.layouts) this.layouts = evt.data.layouts;
        if (evt.data.actionToolbar) this.actionToolbar = evt.data.actionToolbar;
        return;
      }

      if (action === 'proxy-created') {
        // A new proxy has been created. Dispatch a message to synchronize
        // the reflected state
        this.sendMessage('synchronize-proxy', {
          boundingRect: this.boundingRect,
          alphabeticLayout: this._alphabeticLayout,
          layouts: this._layouts,
          actionToolbar: this._actionToolbar,
        });
        return;
      }
    }

    if (!this._element) return;
    switch (evt.type) {
      case 'mouseup':
      case 'blur':
        // Safari on iOS will aggressively attempt to select when there is a long
        // press. Restore the userSelect on mouse up
        document.body.style.userSelect = '';

        unshiftKeyboardLayer();
        break;
    }
  }

  private sendMessage(
    action: VirtualKeyboardMessageAction,
    payload: any = {}
  ): void {
    this.connectedMathfieldWindow?.postMessage(
      {
        type: VIRTUAL_KEYBOARD_MESSAGE,
        action,
        ...payload,
      },
      this.targetOrigin
    );
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
    this.sendMessage('focus');
  }

  /**
   * @category Focus
   */
  public blur(): void {
    this.sendMessage('blur');
  }

  updateToolbar(mf: MathfieldProxy): void {
    const toolbars = this._element?.querySelectorAll('.ML__toolbar-action');
    if (!toolbars) return;
    for (const toolbar of toolbars)
      toolbar.innerHTML = makeActionToolbar(this, mf);
  }

  connect(): void {
    console.log('kbd connecting to ', window);
    this.connectedMathfieldWindow = window;
  }

  disconnect(): void {
    console.log('kbd disconnecting ');
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
