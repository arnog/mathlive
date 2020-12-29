import { ModelPrivate } from '../editor-model/model-private';
import { ParseMode } from '../public/core';
import { InsertOptions } from '../public/mathfield';
import { MathfieldPrivate } from './mathfield-private';

export class ModeEditor {
  static _registry: Record<string, ModeEditor> = {};
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

  static onCopy(
    mode: ParseMode,
    mathfield: MathfieldPrivate,
    ev: ClipboardEvent
  ): void {
    ModeEditor._registry[mode].onCopy(mathfield, ev);
  }

  static insert(
    mode: ParseMode,
    model: ModelPrivate,
    text: string,
    options: InsertOptions = {}
  ): boolean {
    return ModeEditor._registry[mode].insert(model, text, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onCopy(_mathfield: MathfieldPrivate, _ev: ClipboardEvent): void {}
  onPaste(_mathfield: MathfieldPrivate, _ev: ClipboardEvent): boolean {
    return false;
  }

  insert(
    _model: ModelPrivate,
    _text: string,
    _options: InsertOptions
  ): boolean {
    return false;
  }
}
