import {
  AlphabeticKeyboardLayout,
  EditToolbarOptions,
  VirtualKeyboardKeycap,
  VirtualKeyboardLayout,
} from '../public/virtual-keyboard';
import { validateOrigin } from '../editor-mathfield/utils';
import { getCommandTarget } from '../editor/commands';
import { OriginValidator } from '../public/options';
import type {
  VirtualKeyboardMessage,
  VirtualKeyboardInterface,
  MathfieldProxy,
  VirtualKeyboardMessageAction,
} from '../public/virtual-keyboard';

export const VIRTUAL_KEYBOARD_MESSAGE = 'mathlive#virtual-keyboard-message';

export function isVirtualKeyboardMessage(
  evt: Event
): evt is MessageEvent<VirtualKeyboardMessage> {
  if (evt.type !== 'message') return false;

  const msg = evt as MessageEvent<VirtualKeyboardMessage>;

  return msg.data?.type === VIRTUAL_KEYBOARD_MESSAGE;
}
/**
 * The `VirtualKeyboardProxy` singleton is used when inside an
 * iframe (a non-top level browsing context).
 *
 * It relays messages to the top level `VirtualKeyboard` instance.
 */
export class VirtualKeyboardProxy
  implements VirtualKeyboardInterface, EventTarget
{
  private static _singleton: VirtualKeyboardProxy;
  static get singleton(): VirtualKeyboardProxy {
    if (!this._singleton) this._singleton = new VirtualKeyboardProxy();
    return this._singleton;
  }

  targetOrigin = window.origin;
  originValidator: OriginValidator = 'none';

  private readonly listeners: {
    [type: string]: Set<EventListenerOrEventListenerObject | null>;
  };

  private _boundingRect = new DOMRect(0, 0, 0, 0);

  constructor() {
    window.addEventListener('message', this);
    this.sendMessage('proxy-created');
    this.listeners = {};
  }
  set alphabeticLayout(value: AlphabeticKeyboardLayout) {
    this.sendMessage('update-setting', { alphabeticLayout: value });
  }
  set layouts(value: (string | VirtualKeyboardLayout)[]) {
    this.sendMessage('update-setting', { layouts: value });
  }
  set editToolbar(value: EditToolbarOptions) {
    this.sendMessage('update-setting', { editToolbar: value });
  }
  set actionKeycap(value: string | Partial<VirtualKeyboardKeycap>) {
    this.sendMessage('update-setting', { actionKeycap: value });
  }
  set shiftKeycap(value: string | Partial<VirtualKeyboardKeycap>) {
    this.sendMessage('update-setting', { shiftKeycap: value });
  }
  set backspaceKeycap(value: string | Partial<VirtualKeyboardKeycap>) {
    this.sendMessage('update-setting', { backspaceKeycap: value });
  }
  set tabKeycap(value: string | Partial<VirtualKeyboardKeycap>) {
    this.sendMessage('update-setting', { tabKeycap: value });
  }

  set container(value: HTMLElement | null) {
    throw new Error('Container inside an iframe cannot be changed');
  }

  show(options?: { animate: boolean }): void {
    this.sendMessage('show', options);
  }

  hide(options?: { animate: boolean }): void {
    this.sendMessage('hide', options);
  }

  get visible(): boolean {
    return this._boundingRect.height > 0;
  }

  set visible(value: boolean) {
    if (value) this.show();
    else this.hide();
  }

  get boundingRect(): DOMRect {
    return this._boundingRect;
  }

  executeCommand(command: string | [string, ...any[]]): boolean {
    this.sendMessage('execute-command', { command });
    return true; // true = dirty
  }

  updateToolbar(mf: MathfieldProxy): void {
    this.sendMessage('update-toolbar', mf);
  }

  update(mf: MathfieldProxy): void {
    this.sendMessage('update-setting', mf);
  }

  connect(): void {
    this.sendMessage('connect');
  }

  disconnect(): void {
    this.sendMessage('disconnect');
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

  handleEvent(evt: Event): void {
    if (isVirtualKeyboardMessage(evt)) {
      if (!validateOrigin(evt.origin, this.originValidator)) {
        throw new DOMException(
          `Message from unknown origin (${evt.origin}) cannot be handled`,
          'SecurityError'
        );
      }

      this.handleMessage(evt.data);
    }
  }

  handleMessage(msg: VirtualKeyboardMessage): void {
    const { action } = msg;
    if (action === 'execute-command') {
      const { command } = msg;
      const commandTarget = getCommandTarget(command!);
      if (commandTarget === 'virtual-keyboard') this.executeCommand(command!);
      return;
    }

    if (action === 'synchronize-proxy') {
      console.log('synchronize-proxy', window, msg.boundingRect);
      this._boundingRect = msg.boundingRect;
      return;
    }

    if (action === 'geometry-changed') {
      console.log('geometry-change', window, msg.boundingRect);
      this._boundingRect = msg.boundingRect;
      this.dispatchEvent(new Event('geometrychange'));
      return;
    }
  }

  private sendMessage(
    action: VirtualKeyboardMessageAction,
    payload: any = {}
  ): void {
    if (!window.top) {
      throw new DOMException(
        `A frame does not have access to the top window and can‘t communicate with the keyboard. Review virtualKeyboardTargetOrigin and originValidator on mathfields embedded in an iframe`,
        'SecurityError'
      );
    }

    window.top.postMessage(
      {
        type: VIRTUAL_KEYBOARD_MESSAGE,
        action,
        ...payload,
      },
      this.targetOrigin
    );
  }
}
