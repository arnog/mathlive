/**
 * This module imports the definitions of all the symbols and
 * commands, for example `\alpha`, `\sin`, `\mathrm`.
 * There are a few exceptions with some "built-in" commands that require
 * special parsing such as `\char`.
 * @module core/definitions
 * @private
 */

import './definitions-symbols.js';
import './definitions-accents.js';
import './definitions-extensible-symbols.js';
import './definitions-environments.js';
import './definitions-enclose.js';
import './definitions-styling.js';
import './definitions-functions.js';

export * from './definitions-utils.js';
