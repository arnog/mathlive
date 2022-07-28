import { MacroDefinition } from '../public/core';
import {
  FunctionDefinition,
  getMacros,
  LATEX_COMMANDS,
} from '../core-definitions/definitions';
import { getDefaultRegisters } from '../core/registers';

import { defaultColorMap, defaultBackgroundColorMap } from './color';
import { GlobalContext } from './context';
import { l10n } from './l10n';

/** @internal */
export function defaultGlobalContext(): GlobalContext {
  const result: GlobalContext = {
    registers: {},
    smartFence: false,
    fractionNavigationOrder: 'numerator-denominator',
    letterShapeStyle: l10n.locale.startsWith('fr') ? 'french' : 'tex',
    colorMap: defaultColorMap,
    backgroundColorMap: defaultBackgroundColorMap,
    getCommandInfo: (command: string): FunctionDefinition | null => {
      return LATEX_COMMANDS[command] ?? null;
    },
    getMacroDefinition: (command: string): MacroDefinition | null => {
      return getMacros()[command] ?? null;
    },
  };

  return { ...result, registers: getDefaultRegisters(result) };
}
