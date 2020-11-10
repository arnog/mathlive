/**
 * This module imports the definitions of all the symbols and
 * commands, for example `\alpha`, `\sin`, `\mathrm`.
 * There are a few exceptions with some "built-in" commands that require
 * special parsing such as `\char`.
 */

import './accents';
import './enclose';
import './environments';
import './extensible-symbols';
import './functions';
import './mhchem';
import './styling';
import './symbols';

import './definitions-utils';
export * from './definitions-utils';

export { MacroDictionary } from '../public/core';
