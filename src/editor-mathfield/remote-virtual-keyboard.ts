/* eslint-disable brace-style */
import { Selector } from '../public/commands';
import { Mathfield, VirtualKeyboardInterface } from '../public/mathfield';
import type { MathfieldElement } from '../public/mathfield-element';
import {
  CombinedVirtualKeyboardOptions,
  OriginValidator,
  RemoteVirtualKeyboardOptions,
} from '../public/options';

import { osPlatform } from '../common/capabilities';
import { getCommandTarget, SelectorPrivate } from '../editor/commands';
import { VirtualKeyboard } from '../editor/virtual-keyboard-utils';
import { validateOrigin } from './utils';
import { globalMathLive } from '../mathlive';

const POST_MESSAGE_TYPE = 'mathlive#remote-virtual-keyboard-message';

interface RemoteKeyboardMessageData {
  type: 'mathlive#remote-virtual-keyboard-message';
  action:
    | 'execute-command'
    | 'focus'
    | 'blur'
    | 'update-state'
    | 'update-toolbar'
    | 'set-options';
  state?: {
    visible: boolean;
    height: number;
  };
  command?: Selector | [Selector, ...any[]];
  options?: string;
}

/**
 * Must be used on frame with mathfield editor
 */
export class VirtualKeyboardDelegate implements VirtualKeyboardInterface {
  height: number;

  private readonly targetOrigin: string;
  private readonly originValidator: OriginValidator;
  private enabled: boolean;
  private readonly _mathfield: Mathfield;

  /**
   * @param targetOrigin only virtual keyboards in a frame (or document) with this
   * origin will be able to receive messages.
   * Specify a value other than '*' to improve security and prevent malicious
   * sites from intercepting content.
   */
  constructor(options: {
    targetOrigin: string;
    mathfield: Mathfield;
    originValidator: OriginValidator;
  }) {
    this.targetOrigin = options.targetOrigin ?? globalThis.origin ?? '*';
    this.originValidator = options.originValidator ?? 'same-origin';
    this._mathfield = options.mathfield;
  }

  get visible(): boolean {
    return globalMathLive().sharedVirtualKeyboard?.visible ?? false;
  }

  set visible(value: boolean) {
    if (globalMathLive().sharedVirtualKeyboard)
      globalMathLive().sharedVirtualKeyboard!.visible = value;
  }

  setOptions(
    options: CombinedVirtualKeyboardOptions | Record<string, never>
  ): void {
    this.sendMessage('set-options', {
      options: JSON.stringify(getValidOptions(options)),
    });
  }

  public create(): void {}

  public dispose(): void {
    this.disable();
  }

  public enable(): void {
    if (!this.enabled) {
      this.enabled = true;
      globalThis.addEventListener('message', this);
      this.updateToolbar();
    }
  }

  public disable(): void {
    if (this.enabled) {
      globalThis.removeEventListener('message', this);
      this.enabled = false;
    }
  }

  public executeCommand(
    command: SelectorPrivate | [SelectorPrivate, ...any[]]
  ): boolean {
    if (getCommandTarget(command) === 'virtual-keyboard') {
      if (this._mathfield) {
        this.setOptions(getValidOptions(this._mathfield.getOptions()));
        if (
          command === 'showVirtualKeyboard' ||
          (command === 'toggleVirtualKeyboard' && this.visible === false)
        )
          this._mathfield.focus?.();
      }
      this.sendMessage('execute-command', { command });
      requestAnimationFrame(() => this.updateToolbar());
      return false;
    }

    return this._mathfield?.executeCommand(
      command as Selector | [Selector, ...any[]]
    );
  }

  focusMathfield(): void {}

  blurMathfield(): void {}

  stateWillChange(_visible: boolean): boolean {
    return true;
  }
  stateChanged(): void {}

  updateToolbar(): void {
    globalMathLive().sharedVirtualKeyboard?.updateToolbar(this._mathfield);
  }

  handleEvent(event: MessageEvent<RemoteKeyboardMessageData>): void {
    if (
      event.type === 'message' &&
      event.data &&
      event.data.type === POST_MESSAGE_TYPE
    ) {
      if (!validateOrigin(event.origin, this.originValidator)) {
        throw new Error(
          `Message from unknown origin (${event.origin}) cannot be handled`
        );
      }

      const { action } = event.data;

      if (action === 'execute-command') {
        // Avoid an infinite messages loop if within one window
        if (
          getCommandTarget(event.data.command!) === 'virtual-keyboard' &&
          window === globalThis.parent
        )
          return;

        this.executeCommand(event.data.command!);
      } else if (action === 'update-state') {
        this.visible = event.data.state!.visible;
        this.height = event.data.state!.height;
      } else if (action === 'focus') this._mathfield?.focus?.();
      else if (action === 'blur') this._mathfield?.blur?.();
      else if (action === 'update-toolbar') this.updateToolbar();
    }
  }

  private sendMessage(action: string, payload: any = {}): boolean {
    if (globalThis.parent) {
      globalThis.parent.postMessage(
        {
          type: POST_MESSAGE_TYPE,
          action,
          ...payload,
        },
        this.targetOrigin
      );

      return true;
    }

    return false;
  }
}

/**
 * Must be used on parent frame where virtual keyboard will be rendered
 */
export class RemoteVirtualKeyboard
  extends VirtualKeyboard
  implements EventTarget
{
  options: RemoteVirtualKeyboardOptions;

  private sourceFrame: Window;
  private readonly canUndoState: boolean;
  private readonly canRedoState: boolean;
  private readonly listeners: {
    [type: string]: Set<EventListenerOrEventListenerObject | null>;
  };

  constructor(options?: Partial<RemoteVirtualKeyboardOptions>) {
    const validOptions = {
      ...RemoteVirtualKeyboard.defaultOptions,
      ...getValidOptions(options),
    };
    if (options?.createHTML) validOptions.createHTML = options.createHTML;
    if (options?.virtualKeyboardContainer)
      validOptions.virtualKeyboardContainer = options.virtualKeyboardContainer;

    super(validOptions);

    this.listeners = {
      'virtual-keyboard-toggle': new Set(),
      'before-virtual-keyboard-toggle': new Set(),
    };

    globalThis.addEventListener('message', this);

    document.body.addEventListener('focusin', (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (
        target?.isConnected &&
        target.tagName?.toLowerCase() === 'math-field'
      ) {
        const mf = target as MathfieldElement;
        if (
          mf.virtualKeyboardMode === 'onfocus' &&
          mf.virtualKeyboardState === 'hidden'
        )
          mf.virtualKeyboardState = 'visible';
      }
    });

    document.addEventListener('focusout', (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (
        target?.isConnected &&
        target.tagName?.toLowerCase() === 'math-field'
      ) {
        setTimeout(() => {
          if (document.activeElement?.tagName?.toLowerCase() !== 'math-field') {
            const mf = document.querySelector('math-field') as MathfieldElement;
            if (mf) mf.virtualKeyboardState = 'hidden';
          }
        }, 300);
      }
    });
  }

  static get defaultOptions(): RemoteVirtualKeyboardOptions {
    return {
      createHTML: (s: string): any => s,
      fontsDirectory: './fonts',
      soundsDirectory: './sounds',
      targetOrigin: globalThis.origin,
      originValidator: 'same-origin',

      virtualKeyboards: 'all',
      virtualKeyboardLayout: 'auto',
      customVirtualKeyboardLayers: {},
      customVirtualKeyboards: {},
      virtualKeyboardTheme: /macos|ios/.test(osPlatform())
        ? 'apple'
        : 'material',
      keypressVibration: true,
      keypressSound: null,
      plonkSound: null,
      virtualKeyboardToolbar: 'default',
      computeEngine: null,

      virtualKeyboardContainer: globalThis.document?.body ?? null,
    };
  }

  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    _options?: AddEventListenerOptions | boolean
  ): void {
    if (
      type !== 'virtual-keyboard-toggle' &&
      type !== 'before-virtual-keyboard-toggle'
    )
      throw new TypeError('Unexpected event type');
    if (!this.listeners[type].has(callback)) this.listeners[type].add(callback);
  }

  dispatchEvent(event: Event): boolean {
    if (
      event.type !== 'virtual-keyboard-toggle' &&
      event.type !== 'before-virtual-keyboard-toggle'
    )
      throw new TypeError('Unexpected event type');
    if (this.listeners[event.type].size === 0) return true;
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
    if (
      type !== 'virtual-keyboard-toggle' &&
      type !== 'before-virtual-keyboard-toggle'
    )
      throw new TypeError('Unexpected event type');
    this.listeners[type].delete(callback);
  }

  handleEvent(event: MessageEvent<RemoteKeyboardMessageData>): void {
    if (
      event.type === 'message' &&
      event.data &&
      event.data.type === POST_MESSAGE_TYPE
    ) {
      if (!validateOrigin(event.origin, this.options.originValidator)) {
        throw new Error(
          `Can not handle message from unknown origin (${event.origin}).`
        );
      }

      const { action } = event.data;
      if (action === 'execute-command') {
        const { command } = event.data;
        this.sourceFrame = event.source as Window;

        // Avoid an infinite messages loop if within one window
        const commandTarget = getCommandTarget(command!);
        if (commandTarget !== 'virtual-keyboard' && window === window.parent)
          return;

        this.executeCommand(command!);
      } else if (action === 'set-options') {
        const currentOptions = JSON.stringify(getValidOptions(this.options));
        if (currentOptions !== event.data.options) {
          const parsedOptions = getValidOptions(
            JSON.parse(event.data.options!)
          ) as CombinedVirtualKeyboardOptions;

          // We can't pass functions through and nor do we want to allow the
          // caller to change the keyboard container
          parsedOptions.createHTML = this.options.createHTML;
          parsedOptions.virtualKeyboardContainer =
            this.options.virtualKeyboardContainer;
          this.setOptions(parsedOptions);
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
    this.sendMessage('state-changed', {
      state: {
        visible: this.visible,
        height: this.element?.offsetHeight ?? 0,
      },
    });
  }

  public executeCommand(command: Selector | [Selector, ...any[]]): boolean {
    const commandTarget = getCommandTarget(command);

    // Virtual keyboard commands must be handled at local window
    if (commandTarget === 'virtual-keyboard')
      return super.executeCommand(command);

    this.sendMessage('execute-command', { command });
    return false;
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

  public canUndo(): boolean {
    return this.canUndoState;
  }

  public canRedo(): boolean {
    return this.canRedoState;
  }

  public dispose(): void {
    window.removeEventListener('message', this);
  }

  private sendMessage(action: string, payload: any = {}): void {
    this.sourceFrame?.postMessage(
      {
        type: POST_MESSAGE_TYPE,
        action,
        ...payload,
      },
      this.options.targetOrigin
    );
  }
}

function getValidOptions(
  options?: any
): RemoteVirtualKeyboardOptions | Record<string, never> {
  if (typeof options !== 'object') return {};
  const validOptions: Partial<RemoteVirtualKeyboardOptions> = {};
  // Note: we explicitly exclude `virtualKeyboardContainer` and `createHhtml` (a function)
  // as valid options
  if (options.fontsDirectory)
    validOptions.fontsDirectory = options.fontsDirectory;
  if (options.soundsDirectory)
    validOptions.soundsDirectory = options.soundsDirectory;
  if (options.virtualKeyboards)
    validOptions.virtualKeyboards = options.virtualKeyboards;
  if (options.virtualKeyboardLayout)
    validOptions.virtualKeyboardLayout = options.virtualKeyboardLayout;
  if (options.customVirtualKeyboardLayers) {
    validOptions.customVirtualKeyboardLayers =
      options.customVirtualKeyboardLayers;
  }
  if (options.customVirtualKeyboards)
    validOptions.customVirtualKeyboards = options.customVirtualKeyboards;
  if (options.virtualKeyboardTheme)
    validOptions.virtualKeyboardTheme = options.virtualKeyboardTheme;
  if (options.keypressVibration)
    validOptions.keypressVibration = options.keypressVibration;
  if (options.keypressSound) validOptions.keypressSound = options.keypressSound;
  if (options.plonkSound) validOptions.plonkSound = options.plonkSound;
  if (options.virtualKeyboardToolbar)
    validOptions.virtualKeyboardToolbar = options.virtualKeyboardToolbar;

  if (options.targetOrigin) validOptions.targetOrigin = options.targetOrigin;
  if (options.originValidator)
    validOptions.originValidator = options.originValidator;

  return validOptions as RemoteVirtualKeyboardOptions;
}
