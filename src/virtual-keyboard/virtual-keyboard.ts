import { isTouchCapable } from 'common/capabilities';
import { isArray } from 'common/types';
import { on, validateOrigin } from 'editor-mathfield/utils';
import { getCommandTarget, COMMANDS } from 'editor/commands';
import { SelectorPrivate } from 'editor/types';
import { MathfieldElement } from 'mathlive';
import {
  AlphabeticKeyboardLayout,
  OriginValidator,
  VirtualKeyboardDefinition,
  VirtualKeyboardLayer,
  VirtualKeyboardToolbarOptions,
} from '../public/options';
import { isVirtualKeyboardMessage, VIRTUAL_KEYBOARD_MESSAGE } from './proxy';
import {
  makeKeyboardElement,
  unshiftKeyboardLayer,
  makeToolbarAction,
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

  private sourceFrame: Window;
  private readonly listeners: {
    [type: string]: Set<EventListenerOrEventListenerObject | null>;
  };

  private _virtualKeyboards: string;
  get virtualKeyboards(): string {
    return this._virtualKeyboards;
  }
  set virtualKeyboards(value: string) {
    this._virtualKeyboards = value;
    this.requestUpdate();
  }

  private _virtualKeyboardLayout: AlphabeticKeyboardLayout;
  get virtualKeyboardLayout(): AlphabeticKeyboardLayout {
    return this._virtualKeyboardLayout;
  }
  set virtualKeyboardLayout(value: AlphabeticKeyboardLayout) {
    this._virtualKeyboardLayout = value;
    this.requestUpdate();
  }

  private _customVirtualKeyboards: {
    layers: Record<string, string | Partial<VirtualKeyboardLayer>>;
    keyboards: Record<string, VirtualKeyboardDefinition>;
  };
  get customVirtualKeyboards(): {
    layers: Record<string, string | Partial<VirtualKeyboardLayer>>;
    keyboards: Record<string, VirtualKeyboardDefinition>;
  } {
    return this._customVirtualKeyboards;
  }
  set customVirtualKeyboards(
    value:
      | undefined
      | null
      | {
          layers: Record<string, string | Partial<VirtualKeyboardLayer>>;
          keyboards: Record<string, VirtualKeyboardDefinition>;
        }
  ) {
    if (value) this._customVirtualKeyboards = value;
    else this._customVirtualKeyboards = { layers: {}, keyboards: {} };

    this.requestUpdate();
  }

  private _virtualKeyboardToolbar: VirtualKeyboardToolbarOptions;
  get virtualKeyboardToolbar(): VirtualKeyboardToolbarOptions {
    return this._virtualKeyboardToolbar;
  }
  set virtualKeyboardToolbar(value: VirtualKeyboardToolbarOptions) {
    this._virtualKeyboardToolbar = value;
    this.requestUpdate();
  }

  private _virtualKeyboardContainer: HTMLElement | null;
  get virtualKeyboardContainer(): HTMLElement | null {
    return this._virtualKeyboardContainer;
  }
  set virtualKeyboardContainer(value: HTMLElement | null) {
    this._virtualKeyboardContainer = value;
    this.requestUpdate();
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

    this._virtualKeyboards = 'all';
    this._virtualKeyboardLayout = 'auto';
    this._customVirtualKeyboards = { layers: {}, keyboards: {} };
    this._virtualKeyboardToolbar = 'default';

    this._virtualKeyboardContainer = globalThis.document?.body ?? null;

    this._visible = false;
    this._dirty = true;
    this.observer = new ResizeObserver((_entries) => {
      // Adjust the keyboard height
      const h = this.boundingRect.height;
      this._element?.style.setProperty('--keyboard-height', `${h}px`);

      const keyboardHeight = h - 1;
      this.virtualKeyboardContainer!.style.paddingBottom = this
        .originalContainerBottomPadding
        ? `calc(${this.originalContainerBottomPadding} + ${keyboardHeight}px)`
        : `${keyboardHeight}px`;

      this.sendMessage('geometry-changed', { boundingRect: this.boundingRect });
    });

    this.listeners = {};

    window.addEventListener('message', this);

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
        if (document.activeElement?.tagName?.toLowerCase() !== 'math-field')
          this.hide();
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

  requestUpdate(): void {
    if (this._dirty || !this._element) return;
    this._dirty = true;
    let currentKeyboardName = '';
    const currentKeyboard = this._element.querySelector(
      '.MLK__layer.is-visible'
    );
    if (currentKeyboard)
      currentKeyboardName = currentKeyboard.getAttribute('data-layer') ?? '';
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
          `.MLK__layer[data-layer="${currentKeyboardName}"]`
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

    const container = this.virtualKeyboardContainer;
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
    const container = this.virtualKeyboardContainer;
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
    this.virtualKeyboardContainer?.appendChild(this.element);
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
        this.sourceFrame = evt.source as Window;

        // Avoid an infinite messages loop if within one window
        const commandTarget = getCommandTarget(command!);
        if (commandTarget !== 'virtual-keyboard' && window === window.parent)
          return;

        this.executeCommand(command!);
        return;
      }

      if (action === 'show') {
        this.show();
        return;
      }

      if (action === 'hide') {
        this.hide();
        return;
      }

      if (action === 'update-setting') {
        // A proxy has an updated setting
        if (evt.data.virtualKeyboards)
          this.virtualKeyboards = evt.data.virtualKeyboards;
        if (evt.data.virtualKeyboardLayout)
          this.virtualKeyboardLayout = evt.data.virtualKeyboardLayout;
        if (evt.data.customKeyboards)
          this.customVirtualKeyboards = evt.data.customKeyboards;
        if (evt.data.virtualKeyboardToolbar)
          this.virtualKeyboardToolbar = evt.data.virtualKeyboardToolbar;
        return;
      }

      if (action === 'proxy-created') {
        // A new proxy has been created. Dispatch a message to synchronize
        // the reflected state
        this.sendMessage('synchronize-proxy', {
          boundingRect: this.boundingRect,
          virtualKeyboards: this._virtualKeyboards,
          virtualKeyboardLayout: this._virtualKeyboardLayout,
          customKeyboards: structuredClone(this._customVirtualKeyboards),
          virtualKeyboardToolbar: this._virtualKeyboardToolbar,
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
    this.sourceFrame?.postMessage(
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
      toolbar.innerHTML = makeToolbarAction(this, mf);
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
    if (COMMANDS[selector]?.target === 'virtual-keyboard')
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
