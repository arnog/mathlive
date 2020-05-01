/**
 * This module imports the definitions of all the symbols and
 * commands, for example `\alpha`, `\sin`, `\mathrm`.
 * There are a few exceptions with some "built-in" commands that require
 * special parsing such as `\char`.
 */

import './definitions-symbols';
import './definitions-accents';
import './definitions-extensible-symbols';
import './definitions-environments';
import './definitions-enclose';
import './definitions-styling';
import './definitions-functions';

export * from './definitions-utils';
export { MacroDictionary } from '../public/core';
