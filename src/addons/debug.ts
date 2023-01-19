/**
 * This module contains utilities to debug mathlive internal data structures.
 *
 * It is also used by the automated test suite.
 */

import {
  LATEX_COMMANDS,
  MATH_SYMBOLS,
  TEXT_SYMBOLS,
  ENVIRONMENTS,
} from '../core-definitions/definitions';
import { DEFAULT_KEYBINDINGS } from '../editor/keybindings-definitions';
import { getKeybindingMarkup } from '../editor/keybindings';

const MathliveDebug = {
  FUNCTIONS: LATEX_COMMANDS,
  MATH_SYMBOLS,
  TEXT_SYMBOLS,
  ENVIRONMENTS,

  DEFAULT_KEYBINDINGS,

  getKeybindingMarkup,
};

// Export the public interface for this module
export default MathliveDebug;
