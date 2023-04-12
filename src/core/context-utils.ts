import type { MacroDefinition } from '../public/core-types';
import type { GlobalContext } from '../core/types';

import {
  defaultGetDefinition,
  getMacroDefinition,
  getMacros,
} from '../core-definitions/definitions';
import { getDefaultRegisters } from '../core/registers';

import { defaultColorMap, defaultBackgroundColorMap } from './color';
import { l10n } from './l10n';

/** @internal */
export function defaultGlobalContext(): GlobalContext {
  const result: GlobalContext = {
    registers: {},
    smartFence: false,
    fractionNavigationOrder: 'numerator-denominator',
    placeholderSymbol: '▢',
    letterShapeStyle: l10n.locale.startsWith('fr') ? 'french' : 'tex',
    colorMap: defaultColorMap,
    backgroundColorMap: defaultBackgroundColorMap,
    getDefinition: defaultGetDefinition,
    getMacro(token: string): MacroDefinition | null {
      return getMacroDefinition(token, getMacros());
    },
  };

  return { ...result, registers: getDefaultRegisters(result) };
}

// export function defaultGetDefinition(
//   token: string,
//   parseMode: ParseMode = 'math'
// ): TokenDefinition | null {
//   if (!token || token.length === 0) return null;

//   let info: TokenDefinition | null = null;

//   if (token.startsWith('\\')) {
//     // This could be a function or a token
//     info = LATEX_COMMANDS[token];
//     if (info) return info;

//     // It wasn't a function, maybe it's a token?
//     if (parseMode === 'math') info = MATH_SYMBOLS[token];
//     else if (TEXT_SYMBOLS[token]) {
//       info = {
//         definitionType: 'symbol',
//         type: 'mord',
//         codepoint: TEXT_SYMBOLS[token],
//       };
//     }
//   } else if (parseMode === 'math') {
//     info = MATH_SYMBOLS[token];
//     if (!info && token.length === 1) {
//       //Check if this is a Unicode character that has a definition
//       const command = charToLatex('math', token.codePointAt(0));
//       if (command.startsWith('\\'))
//         return { ...defaultGetDefinition(command, 'math')!, command };
//       return null;
//     }
//   } else if (TEXT_SYMBOLS[token]) {
//     info = {
//       definitionType: 'symbol',
//       type: 'mord',
//       codepoint: TEXT_SYMBOLS[token],
//     };
//   } else if (parseMode === 'text') {
//     info = {
//       definitionType: 'symbol',
//       type: 'mord',
//       codepoint: token.codePointAt(0)!,
//     };
//   }

//   // Special case `f`, `g` and `h` are recognized as functions.
//   if (
//     info &&
//     info.definitionType === 'symbol' &&
//     info.type === 'mord' &&
//     (info.codepoint === 0x66 ||
//       info.codepoint === 0x67 ||
//       info.codepoint === 0x68)
//   )
//     info.isFunction = true;

//   return info ?? null;
// }

// export function getMacroDefinition(
//   token: string,
//   macros: NormalizedMacroDictionary
// ): MacroDefinition | null {
//   if (!token.startsWith('\\')) return null;
//   const command = token.slice(1);
//   return macros[command];
// }
