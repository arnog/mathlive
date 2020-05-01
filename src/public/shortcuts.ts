import { ParseMode } from './core';

export type InlineShortcutDefinition =
    | string
    | {
          value: string;
          mode?: ParseMode;
          after?: string;
      };
