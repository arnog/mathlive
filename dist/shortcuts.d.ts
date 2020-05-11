/* v0.50.4-8-g06b13ab-dirty */import { ParseMode } from './core';
/**
 * An inline shortcut can be specified as a simple string or as
 * an object literal with additional options:
 *
 *```javascript
 *     config.inlineShortcuts = {
 *      half: '\\frac{1}{2}',
 *      in: {
 *          mode: 'math',
 *          after: 'space+letter+digit+symbol+fence',
 *          value: '\\in',
 *      },
 *  };
 *```
 *
 * When using a string, the shortcut will apply in any mode, and regardless
 * of the characters surrounding it.
 *
 * When using an object literal the `value` key is required an indicate the
 * shortcut substitution.
 *
 * The `mode` key, if present, indicate which mode this shortcut will
 * apply in, either `'math'` or `'text'`. If the key is not present the
 * shortcut apply in all modes.
 *
 * The `'after'` key, if present, indicate in what context (surrounding characters)
 * the shortcut will apply. One or more values can be specified, separated by a '+'
 * sign. If any of the values match, the shortcut will be applicable.
 *
 *
 * Possible values are:
 *
 *  | | |
 *  | :----- | :----- |
 *  | `'space'` |  A spacing command, such as `\quad` |
 *  | `'nothing'`|  The begining of a group |
 *  | `'surd'` |A square root or n-th root |
 *  | `'frac'` |A fraction|
 *  | `'function'` |A function such as `\sin` or `f`|
 *  | `'letter'` |A letter, such as `x` or `n`|
 *  | `'digit'` |`0` through `9`|
 *  | `'binop'` |A binary operator, such as `+`|
 *  | `'relop'` |A relational operator, such as `=`|
 *  | `'punct'` |A punctuation mark, such as `,`|
 *  | `'array'` |An array, such as a matrix or cases statement|
 *  | `'openfence'` |An opening fence, such as `(`|
 *  | `'closefence'` | A closing fence such as `}`|
 *  | `'text'`| Some plain text|
 */
export declare type InlineShortcutDefinition = string | {
    value: string;
    mode?: ParseMode;
    after?: string;
};
