import {
  getMacroDefinition,
  getMacros,
} from '../core-definitions/definitions-utils';
import { defaultBackgroundColorMap, defaultColorMap } from './color';
import { l10n } from './l10n';
import { getDefaultRegisters } from './registers';

import type { ContextInterface } from '../core/types';

/** @internal */
export function getDefaultContext(): ContextInterface {
  return {
    registers: getDefaultRegisters(),
    smartFence: false,
    renderPlaceholder: undefined,
    placeholderSymbol: '▢',
    letterShapeStyle: l10n.locale.startsWith('fr') ? 'french' : 'tex',
    minFontScale: 0,
    colorMap: defaultColorMap,
    backgroundColorMap: defaultBackgroundColorMap,
    getMacro: (token) => getMacroDefinition(token, getMacros()),
  };
}
