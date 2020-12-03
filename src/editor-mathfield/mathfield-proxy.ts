import { getCommandTarget, perform } from '../editor/commands';
import { getRemoteKeyboardDefault } from '../editor/options';
import { VirtualKeyboard } from '../editor/virtual-keyboard-utils';
import { Selector } from '../public/commands';
import { RemoteKeyboardOptions } from '../public/options';
import {
    ICommandExecutor,
    IRemoteMathfield,
    MathfieldPrivate,
} from './mathfield-private';

const POST_MESSAGE_TYPE = 'ml#systemPostMessage';
const POST_MESSAGE_ACTION_EXECUTE_COMMAND = 'executeCommand';
const POST_MESSAGE_ACTION_FOCUS = 'focus';
const POST_MESSAGE_ACTION_BLUR = 'blur';

/**
 * Must be used on frame with mathfield editor
 */
export class MathfieldProxyHost implements ICommandExecutor {
    private mathfield: MathfieldPrivate;

    constructor(mathfield: MathfieldPrivate) {
        this.mathfield = mathfield;

        this._initHandlers();
    }

    public executeCommand(command: Selector | [Selector, ...any[]]): boolean {
        const commandTarget = getCommandTarget(command);

        if (commandTarget === 'virtual-keyboard') {
            if (window.parent) {
                window.parent.postMessage(
                    {
                        type: POST_MESSAGE_TYPE,
                        action: POST_MESSAGE_ACTION_EXECUTE_COMMAND,
                        command,
                    },
                    '*'
                );

                return false;
            }
        }

        return perform(this.mathfield, command);
    }

    private _initHandlers() {
        window.addEventListener('message', (e) => {
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
        });
    }
}

/**
 * Must be used on parent frame where virtual keyboard will be rendered
 */
export class MathfieldProxyClient implements IRemoteMathfield {
    public options: Required<RemoteKeyboardOptions>;
    public virtualKeyboardVisible: boolean;
    public virtualKeyboard: VirtualKeyboard;

    private sourceFrame: Window;

    private canUndoState: boolean;
    private canRedoState: boolean;

    constructor(options?: Partial<RemoteKeyboardOptions>) {
        this.options = {
            ...getRemoteKeyboardDefault(),
            ...(options || {}),
        };

        this._registerHandlers();
    }

    public executeCommand(command: Selector | [Selector, ...any[]]): boolean {
        // TODO Handle all commands to virtual-keyboard locally
        // all another events pass to the source frame

        const commandTarget = getCommandTarget(command);

        const [commandName, ...commandArgs] = command;
        if (commandName === 'updateUndoRedoButtons') {
            const [canUndoState, canRedoState] = commandArgs;
            // Update undo / redo state in local instance
            this.canUndoState = canUndoState;
            this.canRedoState = canRedoState;

            perform(this as any, command);
            return;
        }

        // Virtual keyboard commands must be handled at local window
        if (commandTarget === 'virtual-keyboard') {
            // Small hack
            perform(this as any, command);
            return;
        }

        if (this.sourceFrame) {
            this.sourceFrame.postMessage(
                {
                    type: POST_MESSAGE_TYPE,
                    action: POST_MESSAGE_ACTION_EXECUTE_COMMAND,
                    command,
                },
                '*'
            );
        }

        return false;
    }

    /**
     * @category Focus
     */
    public focus?(): void {
        if (this.sourceFrame) {
            this.sourceFrame.postMessage(
                {
                    type: POST_MESSAGE_TYPE,
                    action: POST_MESSAGE_ACTION_FOCUS,
                },
                '*'
            );
        }
    }

    /**
     * @category Focus
     */
    public blur?(): void {
        if (this.sourceFrame) {
            this.sourceFrame.postMessage(
                {
                    type: POST_MESSAGE_TYPE,
                    action: POST_MESSAGE_ACTION_BLUR,
                },
                '*'
            );
        }
    }

    public canUndo(): boolean {
        return this.canUndoState;
    }

    public canRedo(): boolean {
        return this.canRedoState;
    }

    private _registerHandlers() {
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === POST_MESSAGE_TYPE) {
                const action = e.data.action;
                if (action === POST_MESSAGE_ACTION_EXECUTE_COMMAND) {
                    const command = e.data.command;
                    this.sourceFrame = e.source as Window;

                    this.executeCommand(command);
                }
            }
        });
    }
}
