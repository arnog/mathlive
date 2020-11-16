import { ModelPrivate } from '../editor-model/model-private';
import { ParseMode } from '../public/core';
import { InsertOptions } from '../public/mathfield';
import { MathfieldPrivate } from './mathfield-private';

export class ModeEditor {
    static _registry: { [name: string]: ModeEditor } = {};
    constructor(name: string) {
        ModeEditor._registry[name] = this;
    }
    static onPaste(
        mode: ParseMode,
        mathfield: MathfieldPrivate,
        ev: ClipboardEvent
    ): boolean {
        return ModeEditor._registry[mode].onPaste(mathfield, ev);
    }
    onPaste(_mathfield: MathfieldPrivate, _ev: ClipboardEvent): boolean {
        return false;
    }
    static onCopy(
        mode: ParseMode,
        mathfield: MathfieldPrivate,
        ev: ClipboardEvent
    ): void {
        ModeEditor._registry[mode].onCopy(mathfield, ev);
    }
    onCopy(_mathfield: MathfieldPrivate, _ev: ClipboardEvent): void {
        return;
    }
    static insert(
        mode: ParseMode,
        model: ModelPrivate,
        text: string,
        options: InsertOptions = {}
    ): boolean {
        return ModeEditor._registry[mode].insert(model, text, options);
    }
    insert(
        _model: ModelPrivate,
        _text: string,
        _options: InsertOptions
    ): boolean {
        return;
    }
}
