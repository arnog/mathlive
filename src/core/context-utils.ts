import {
  getMacroDefinition,
  getMacros,
} from '../core-definitions/definitions-utils';
import type { ContextInterface } from '../core/types';

import { defaultColorMap, defaultBackgroundColorMap } from './color';
import { l10n } from './l10n';
import { getDefaultRegisters } from './registers';

/** @internal */
export function getDefaultContext(): ContextInterface {
  return {
    registers: getDefaultRegisters(),
    smartFence: false,
    renderPlaceholder: undefined,
    placeholderSymbol: '▢',
    letterShapeStyle: l10n.locale.startsWith('fr') ? 'french' : 'tex',
    colorMap: defaultColorMap,
    backgroundColorMap: defaultBackgroundColorMap,
    getMacro: (token) => getMacroDefinition(token, getMacros()),
  };
}
