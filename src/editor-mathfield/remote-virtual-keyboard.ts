import { getCommandTarget, SelectorPrivate } from '../editor/commands';
import { ExecuteCommandFunction } from '../editor/commands-definitions';
import {
    VirtualKeyboard,
    VirtualKeyboardInterface,
} from '../editor/virtual-keyboard-utils';
import { Selector } from '../public/commands';
import {
    OriginValidator,
    RemoteVirtualKeyboardOptions,
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
    // private mathfield: MathfieldPrivate;
    private targetOrigin: string;
    private originValidator: OriginValidator;
    private enabled: boolean;
    visible: boolean;
    height: number;

    private _focus: () => void;
    private _blur: () => void;
    private _executeCommand: ExecuteCommandFunction;

    /**
     * @param targetOrigin only virtual keyboards in a frame (or document) with this
     * origin will be able to receive messages.
     * Specify a value other than '*' to improve security and prevent malicious
     * sites from intercepting content.
     */
    constructor(options: {
        targetOrigin: string;
        focus: () => void;
        blur: () => void;
        executeCommand: ExecuteCommandFunction;
        originValidator: OriginValidator;
    }) {
        // this.mathfield = mathfield;
        this.targetOrigin = options.targetOrigin ?? window.origin;
        this.originValidator = options.originValidator ?? 'same-origin';
        this._focus = options.focus;
        this._blur = options.blur;
        this._executeCommand = options.executeCommand;
        this.enable();
    }

    public dispose(): void {
        this.disable();
    }

    public executeCommand(
        command: SelectorPrivate | [SelectorPrivate, ...any[]]
    ): boolean {
        if (getCommandTarget(command) === 'virtual-keyboard') {
            this.sendMessage('executeCommand', { command });
            return false;
        }
        return this._executeCommand(command);
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

    focusMathfield(): void {
        return;
    }
    blurMathfield(): void {
        return;
    }

    stateChanged(): void {
        return;
    }

    private sendMessage(action: string, payload: any = {}): boolean {
        if (window.parent) {
            window.parent.postMessage(
                {
                    type: POST_MESSAGE_TYPE,
                    action: action,
                    ...payload,
                },
                this.targetOrigin
            );

            return true;
        }

        return false;
    }

    handleEvent(e: MessageEvent<RemoteKeyboardMessageData>): void {
        if (
            e.type === 'message' &&
            e.data &&
            e.data.type === POST_MESSAGE_TYPE
        ) {
            if (!validateOrigin(e.origin, this.originValidator)) {
                throw new Error(
                    `Message from unknown origin (${e.origin}) can not be handled`
                );
            }

            const action = e.data.action;

            if (action === 'executeCommand') {
                this.executeCommand(e.data.command);
            } else if (action === 'updateState') {
                this.visible = e.data.state.visible;
                this.height = e.data.state.height;
            } else if (action === 'focus') {
                this._focus();
            } else if (action === 'blur') {
                this._blur();
            }
        }
    }
}

/**
 * Must be used on parent frame where virtual keyboard will be rendered
 */
export class RemoteVirtualKeyboard extends VirtualKeyboard {
    private sourceFrame: Window;
    options: RemoteVirtualKeyboardOptions;

    private canUndoState: boolean;
    private canRedoState: boolean;

    constructor(options?: Partial<RemoteVirtualKeyboardOptions>) {
        super({
            ...RemoteVirtualKeyboard.defaultOptions,
            ...(options ?? {}),
        });

        window.addEventListener('message', this);
    }

    static get defaultOptions(): RemoteVirtualKeyboardOptions {
        return {
            namespace: '',
            createHTML: (s: string): any => s,
            fontsDirectory: './fonts',
            soundsDirectory: './sounds',
            targetOrigin: window.origin,
            originValidator: 'same-origin',

            virtualKeyboards: 'all',
            virtualKeyboardLayout: 'auto',
            customVirtualKeyboardLayers: {},
            customVirtualKeyboards: {},
            virtualKeyboardTheme: /android|cros/i.test(navigator?.userAgent)
                ? 'material'
                : 'apple',
            keypressVibration: true,
            keypressSound: null,
            plonkSound: null,
            virtualKeyboardToolbar: 'default',

            virtualKeyboardToggleGlyph: `<span style="width: 21px; margin-top: 4px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M528 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm16 336c0 8.823-7.177 16-16 16H48c-8.823 0-16-7.177-16-16V112c0-8.823 7.177-16 16-16h480c8.823 0 16 7.177 16 16v288zM168 268v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-336 80v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm384 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zM120 188v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-96 152v-8c0-6.627-5.373-12-12-12H180c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h216c6.627 0 12-5.373 12-12z"/></svg></span>`,
            virtualKeyboardMode: 'auto',
        };
    }

    handleEvent(e: MessageEvent<RemoteKeyboardMessageData>): void {
        if (
            e.type === 'message' &&
            e.data &&
            e.data.type === POST_MESSAGE_TYPE
        ) {
            if (!validateOrigin(e.origin, this.options.originValidator)) {
                throw new Error(
                    `Can not handle message from unknown origin (${e.origin}).`
                );
            }

            const action = e.data.action;
            if (action === 'executeCommand') {
                const command = e.data.command;
                this.sourceFrame = e.source as Window;

                this.executeCommand(command);
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
        if (commandTarget === 'virtual-keyboard') {
            return super.executeCommand(command);
        }

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
                action: action,
                ...payload,
            },
            this.options.targetOrigin
        );
    }
}
