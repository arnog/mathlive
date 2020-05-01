import { ParseMode } from './core';
export declare type InlineShortcutDefinition = string | {
    value: string;
    mode?: ParseMode;
    after?: string;
};
