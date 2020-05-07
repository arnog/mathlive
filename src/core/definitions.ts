/**
 * This module imports the definitions of all the symbols and
 * commands, for example `\alpha`, `\sin`, `\mathrm`.
 * There are a few exceptions with some "built-in" commands that require
 * special parsing such as `\char`.
 */

import './definitions-accents';
import './definitions-enclose';
import './definitions-environments';
import './definitions-extensible-symbols';
import './definitions-functions';
import './definitions-styling';
import './definitions-symbols';

import './definitions-utils';
export * from './definitions-utils';

export { MacroDictionary } from '../public/core';
