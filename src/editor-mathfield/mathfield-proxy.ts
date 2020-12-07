import { getCommandTarget, perform, SelectorPrivate } from '../editor/commands';
import { getRemoteDefault } from '../editor/options';
import { VirtualKeyboard } from '../editor/virtual-keyboard-utils';
import { Selector } from '../public/commands';
import { RemoteMathfieldOptions } from '../public/options';
import {
    ICommandExecutor,
    IRemoteMathfield,
    MathfieldPrivate,
} from './mathfield-private';

const POST_MESSAGE_TYPE = 'ml#systemPostMessage';
const POST_MESSAGE_ACTION_EXECUTE_COMMAND = 'executeCommand';
const POST_MESSAGE_ACTION_FOCUS = 'focus';
const POST_MESSAGE_ACTION_BLUR = 'blur';

interface RemoteKeyboardMessageData {
    type: 'ml#systemPostMessage';
    action: 'executeCommand' | 'focus' | 'blur';

    command?: Selector | [Selector, ...any[]];
}

/**
 * Must be used on frame with mathfield editor
 */
export class MathfieldProxyHost implements ICommandExecutor {
    private mathfield: MathfieldPrivate;
    private enabled: boolean;

    constructor(mathfield: MathfieldPrivate) {
        this.mathfield = mathfield;

        this.didMessageReceived = this.didMessageReceived.bind(this);

        this._initHandlers();
    }

    public shutdown(): void {
        this.disable();
    }

    public executeCommand(
        command: SelectorPrivate | [SelectorPrivate, ...any[]]
    ): boolean {
        const commandTarget = getCommandTarget(command);

        if (commandTarget === 'virtual-keyboard') {
            if (
                this.sendMessage(POST_MESSAGE_ACTION_EXECUTE_COMMAND, {
                    command,
                })
            ) {
                return false;
            }
        }

        return perform(this.mathfield, command);
    }

    private sendMessage(action: string, payload: any = {}): boolean {
        if (window.parent) {
            window.parent.postMessage(
                {
                    type: POST_MESSAGE_TYPE,
                    action: action,
                    ...payload,
                },
                this.mathfield.options.proxyHostTargetOrigin
            );

            return true;
        }

        return false;
    }

    private didMessageReceived(
        e: MessageEvent<RemoteKeyboardMessageData>
    ): void {
        if (e.data && e.data.type === POST_MESSAGE_TYPE) {
            const action = e.data.action;

            if (action === POST_MESSAGE_ACTION_EXECUTE_COMMAND) {
                const command = e.data.command;

                this.mathfield.executeCommand(command);
                return;
            }

            if (action === POST_MESSAGE_ACTION_FOCUS) {
                this.mathfield.focus();
                return;
            }

            if (action === POST_MESSAGE_ACTION_BLUR) {
                this.mathfield.blur();
                return;
            }
        }
    }

    public enable(): void {
        if (!this.enabled) {
            this._initHandlers();
        }
    }

    public disable(): void {
        if (this.enabled) {
            this._removeHandlers();
        }
    }

    private _removeHandlers(): void {
        this.enabled = false;
        window.removeEventListener('message', this.didMessageReceived);
    }

    private _initHandlers(): void {
        this.enabled = true;
        window.addEventListener('message', this.didMessageReceived);
    }
}

/**
 * Must be used on parent frame where virtual keyboard will be rendered
 */
export class MathfieldProxyClient implements IRemoteMathfield {
    public options: Required<RemoteMathfieldOptions>;
    public virtualKeyboardVisible: boolean;
    public virtualKeyboard: VirtualKeyboard;

    private sourceFrame: Window;

    private canUndoState: boolean;
    private canRedoState: boolean;

    constructor(options?: Partial<RemoteMathfieldOptions>) {
        this.options = {
            ...getRemoteDefault(),
            ...(options || {}),
        };

        this.didMessageReceived = this.didMessageReceived.bind(this);

        this._registerHandlers();
    }

    public executeCommand(command: Selector | [Selector, ...any[]]): boolean {
        const commandTarget = getCommandTarget(command);

        const [commandName, ...commandArgs] = command;
        if (commandName === 'updateUndoRedoButtons') {
            const [canUndoState, canRedoState] = commandArgs;
            // Update undo / redo state in local instance
            this.canUndoState = canUndoState;
            this.canRedoState = canRedoState;

            // Make this as any to hack method signature, actually it should be safe for 'updateUndoRedoButtons' command
            // Ideally perform method can be refactored to prevent this
            perform(this as any, command);
            return;
        }

        // Virtual keyboard commands must be handled at local window
        if (commandTarget === 'virtual-keyboard') {
            // Make this as any to hack method signature, actually it should be safe for 'virtual-keyboard' target
            // Ideally perform method can be refactored to prevent this
            perform(this as any, command);
            return;
        }

        this.sendMessage(POST_MESSAGE_ACTION_EXECUTE_COMMAND, { command });

        return false;
    }

    /**
     * @category Focus
     */
    public focus(): void {
        this.sendMessage(POST_MESSAGE_ACTION_FOCUS);
    }

    /**
     * @category Focus
     */
    public blur(): void {
        this.sendMessage(POST_MESSAGE_ACTION_BLUR);
    }

    public canUndo(): boolean {
        return this.canUndoState;
    }

    public canRedo(): boolean {
        return this.canRedoState;
    }

    public shutdown(): void {
        this._removeHandlers();
    }

    private sendMessage(action: string, payload: any = {}) {
        if (this.sourceFrame) {
            const messageData: RemoteKeyboardMessageData = {
                type: POST_MESSAGE_TYPE,
                action: action,
                ...payload,
            };

            this.sourceFrame.postMessage(
                messageData,
                this.options.targetOrigin
            );
        }
    }

    private didMessageReceived(e: MessageEvent<RemoteKeyboardMessageData>) {
        if (e.data && e.data.type === POST_MESSAGE_TYPE) {
            const action = e.data.action;
            if (action === POST_MESSAGE_ACTION_EXECUTE_COMMAND) {
                const command = e.data.command;
                this.sourceFrame = e.source as Window;

                this.executeCommand(command);
            }
        }
    }

    private _removeHandlers(): void {
        window.removeEventListener('message', this.didMessageReceived);
    }

    private _registerHandlers(): void {
        window.addEventListener('message', this.didMessageReceived);
    }
}
