import { osPlatform } from '../common/capabilities';
import { getCommandTarget, SelectorPrivate } from '../editor/commands';
import { DEFAULT_KEYBOARD_TOGGLE_GLYPH } from '../editor/options';
import { VirtualKeyboard } from '../editor/virtual-keyboard-utils';
import { Selector } from '../public/commands';
import { Mathfield, VirtualKeyboardInterface } from '../public/mathfield';
import {
  CoreOptions,
  OriginValidator,
  RemoteVirtualKeyboardOptions,
  VirtualKeyboardOptions,
} from '../public/options';
import { validateOrigin } from './utils';

const POST_MESSAGE_TYPE = 'ml#systemPostMessage';

interface RemoteKeyboardMessageData {
  type: 'ml#systemPostMessage';
  action: 'executeCommand' | 'focus' | 'blur' | 'updateState';
  state?: {
    visible: boolean;
    height: number;
  };
  command?: Selector | [Selector, ...any[]];
}

/**
 * Must be used on frame with mathfield editor
 */
export class VirtualKeyboardDelegate implements VirtualKeyboardInterface {
  visible: boolean;
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
    this.targetOrigin = options.targetOrigin ?? window.origin;
    this.originValidator = options.originValidator ?? 'same-origin';
    this._mathfield = options.mathfield;
  }

  setOptions(_options: VirtualKeyboardOptions & CoreOptions): void {
    // The associated mathfield is using a keyboard delegate, and no keyboard
    // options should be set on it
  }

  public create(): void {}

  public dispose(): void {
    this.disable();
  }

  public enable(): void {
    if (!this.enabled) {
      this.enabled = true;
      window.addEventListener('message', this);
    }
  }

  public disable(): void {
    if (this.enabled) {
      window.removeEventListener('message', this);
      this.enabled = false;
    }
  }

  public executeCommand(
    command: SelectorPrivate | [SelectorPrivate, ...any[]]
  ): boolean {
    if (getCommandTarget(command) === 'virtual-keyboard') {
      this.sendMessage('executeCommand', { command });
      return false;
    }

    return this._mathfield?.executeCommand(
      command as Selector | [Selector, ...any[]]
    );
  }

  focusMathfield(): void {}

  blurMathfield(): void {}

  stateChanged(): void {}

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

      if (action === 'executeCommand') {
        // Avoid an infinite messages loop if within one window
        if (
          getCommandTarget(event.data.command!) === 'virtual-keyboard' &&
          window === window.parent
        ) {
          return;
        }

        this.executeCommand(event.data.command!);
      } else if (action === 'updateState') {
        this.visible = event.data.state!.visible;
        this.height = event.data.state!.height;
      } else if (action === 'focus') {
        this._mathfield?.focus?.();
      } else if (action === 'blur') {
        this._mathfield?.blur?.();
      }
    }
  }

  private sendMessage(action: string, payload: any = {}): boolean {
    if (window.parent) {
      window.parent.postMessage(
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
export class RemoteVirtualKeyboard extends VirtualKeyboard {
  options: RemoteVirtualKeyboardOptions;

  private sourceFrame: Window;
  private readonly canUndoState: boolean;
  private readonly canRedoState: boolean;

  constructor(options: Partial<RemoteVirtualKeyboardOptions>) {
    super({
      ...RemoteVirtualKeyboard.defaultOptions,
      ...(options ?? {}),
    });

    window.addEventListener('message', this);
  }

  static get defaultOptions(): RemoteVirtualKeyboardOptions {
    return {
      createHTML: (s: string): any => s,
      fontsDirectory: './fonts',
      soundsDirectory: './sounds',
      targetOrigin: window.origin,
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

      virtualKeyboardToggleGlyph: DEFAULT_KEYBOARD_TOGGLE_GLYPH,
      virtualKeyboardMode: 'auto',

      virtualKeyboardContainer: globalThis.document?.body ?? null,
    };
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
      if (action === 'executeCommand') {
        const { command } = event.data;
        this.sourceFrame = event.source as Window;

        // Avoid an infinite messages loop if within one window
        const commandTarget = getCommandTarget(command!);
        if (commandTarget !== 'virtual-keyboard' && window === window.parent) {
          return;
        }

        this.executeCommand(command!);
      }
    }
  }

  stateChanged(): void {
    this.sendMessage('stateChanged', {
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

    this.sendMessage('executeCommand', { command });
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
