import { isArray } from '../common/types';

import type { Atom } from '../core/atom';
import { GenfracAtom } from '../core-atoms/genfrac';
import { LeftRightAtom } from '../core-atoms/leftright';
import { ArrayAtom } from '../core-atoms/array';
import { Style } from '../public/core-types';

const SPECIAL_IDENTIFIERS = {
  '\\ne': '≠',
  '\\neq': '≠',
  '\u2212': '-', // MINUS SIGN
  '-': '-',
  '\\alpha': 'alpha',
  '\\beta': 'beta',
  '\\gamma': 'gamma',
  '\\delta': 'delta',
  '\\epsilon': 'epsilon',
  '\\varepsilon': 'varepsilon',
  '\\zeta': 'zeta',
  '\\eta': 'eta',
  '\\theta': 'theta',
  '\\vartheta': 'vartheta',
  '\\iota': 'iota',
  '\\kappa': 'kappa',
  '\\lambda': 'lambda',
  '\\mu': 'mu',
  '\\nu': 'nu',
  '\\xi': 'xi',
  '\\pi': 'pi',
  '\\rho': 'rho',
  '\\sigma': 'sigma',
  '\\tau': 'tau',
  '\\upsilon': 'upsilon',
  '\\phi': 'phi',
  '\\varphi': 'varphi',
  '\\chi': 'chi',
  '\\psi': 'psi',
  '\\omega': 'omega',
  '\\Gamma': 'Gamma',
  '\\Delta': 'Delta',
  '\\Theta': 'Theta',
  '\\Lambda': 'Lambda',
  '\\Xi': 'Xi',
  '\\Pi': 'Pi',
  '\\Sigma': 'Sigma',
  '\\Phi': 'Phi',
  '\\Psi': 'Psi',
  '\\Omega': 'Omega',
  '\\exponentialE': 'e',
  '\\imaginaryI': 'i',
  '\\imaginaryJ': 'j',
  '\\!': ' ',
  '\\,': ' ',
  '\\:': ' ',
  '\\>': ' ',
  '\\;': ' ',
  '\\enskip': ' ',
  '\\enspace': ' ',
  '\\qquad': ' ',
  '\\quad': ' ',
  '\\infty': 'oo',
};

const SPECIAL_OPERATORS = {
  '\\pm': '+-',
  '\\colon': ':',
  '\\vert': '|',
  '\\Vert': '||',
  '\\mid': '|',
  '\\lbrace': '{',
  '\\rbrace': '}',
  '\\lparen': '(',
  '\\rparen': ')',
  '\\langle': '(:',
  '\\rangle': ':)',
  '\\sum': 'sum',
  '\\prod': 'prod',
  '\\bigcap': 'nnn',
  '\\bigcup': 'uuu',
  '\\int': 'int',
  '\\oint': 'oint',
  '\\ge': '>=',
  '\\le': '<=',
  '\\ne': '!=',
  '\\neq': '!=',
  '\\lt': '<',
  '\\gt': '>',
  '\\gets': '<-',
  '\\to': '->',
  '\\land': 'and',
  '\\lor': 'or',
  '\\lnot': 'not',
  '\\forall': 'AA',
  '\\exists': 'EE',
  '\\in': 'in',
  '\\notin': '!in',
  '\\mapsto': '|->',
  '\\implies': '=>',
  '\\iff': '<=>',

  '\\cdot': '*',
  '\\ast': '**',
  '\\star': '***',
  '\\times': 'xx',
  '\\div': '-:',
  '\\ltimes': '|><',
  '\\rtimes': '><|',
  '\\bowtie': '|><|',
  '\\circ': '@',

  // '\\lfloor': '\u230a',
  // '\\rfloor': '\u230b',
  // '\\lceil': '\u2308',
  // '\\rceil': '\u2309',

  // '\\vec': '&#x20d7;',
  // '\\acute': '&#x00b4;',
  // '\\grave': '&#x0060;',
  // '\\dot': '&#x02d9;',
  // '\\ddot': '&#x00a8;',
  // '\\tilde': '&#x007e;',
  // '\\bar': '&#x00af;',
  // '\\breve': '&#x02d8;',
  // '\\check': '&#x02c7;',
  // '\\hat': '&#x005e;'
};

export function atomToAsciiMath(atom: Atom | Atom[] | undefined): string {
  if (!atom) return '';
  if (isArray<Atom>(atom)) {
    if (atom.length === 0) return '';

    if (atom[0].mode === 'latex') return atom.map(atomToAsciiMath).join('');

    if (atom[0].mode === 'text') {
      // Text mode... put it in (ASCII) quotes
      let i = 0;
      let text = '';
      while (atom[i]?.mode === 'text') {
        text += atom[i].body ? atomToAsciiMath(atom[i].body) : atom[i].value;
        i++;
      }

      return `"${text}" ${atomToAsciiMath(atom.slice(i))}`;
    }

    let i = 0;
    let result = '';
    while (atom[i] && atom[i].mode === 'math')
      result += atomToAsciiMath(atom[i++]);

    return result + atomToAsciiMath(atom.slice(i));
  }

  if (atom.mode === 'text') return `"${atom.value}"`;

  let result = '';
  const { command } = atom;
  let m;

  if (command === '\\placeholder') return `(${atomToAsciiMath(atom.body)})`;

  switch (atom.type) {
    case 'accent':
      const accent = {
        '\\vec': 'vec',
        '\\dot': 'dot',
        '\\ddot': 'ddot',
        '\\bar': 'bar',
        '\\hat': 'hat',
        '\\acute': 'acute;', // non-standard
        '\\grave': 'grave', // non-standard
        '\\tilde': 'tilde', // non-standard
        '\\breve': 'breave', // non-standard
        '\\check': 'check', // non-standard
      }[command];

      result += `${accent ?? ''} ${atomToAsciiMath(atom.body)} `;
      break;

    case 'first':
      return '';

    case 'latexgroup':
      return atom.body!.map((x) => x.value).join('');

    case 'group':
    case 'root':
      result = SPECIAL_IDENTIFIERS[command] ?? atomToAsciiMath(atom.body);
      break;

    case 'genfrac':
      {
        const genfracAtom = atom as GenfracAtom;
        if (genfracAtom.leftDelim || genfracAtom.rightDelim) {
          result +=
            genfracAtom.leftDelim === '.' || !genfracAtom.leftDelim
              ? '{:'
              : genfracAtom.leftDelim;
        }

        if (genfracAtom.hasBarLine) {
          result += '(';
          result += atomToAsciiMath(genfracAtom.above);
          result += ')/(';
          result += atomToAsciiMath(genfracAtom.below);
          result += ')';
        } else {
          // No bar line, i.e. \choose, etc...
          result += '(' + atomToAsciiMath(genfracAtom.above) + '),';
          result += '(' + atomToAsciiMath(genfracAtom.below) + ')';
        }

        if (genfracAtom.leftDelim || genfracAtom.rightDelim) {
          result +=
            genfracAtom.rightDelim === '.' || !genfracAtom.rightDelim
              ? '{:'
              : genfracAtom.rightDelim;
        }
      }

      break;

    case 'surd':
      result += !atom.hasEmptyBranch('above')
        ? 'root(' +
          atomToAsciiMath(atom.above) +
          ')(' +
          atomToAsciiMath(atom.body) +
          ')'
        : 'sqrt(' + atomToAsciiMath(atom.body) + ')';
      break;

    case 'latex':
      result = atom.value;
      break;

    case 'leftright':
      {
        const leftrightAtom = atom as LeftRightAtom;
        result +=
          leftrightAtom.leftDelim === '.' || !leftrightAtom.leftDelim
            ? '{:'
            : leftrightAtom.leftDelim;
        result += atomToAsciiMath(leftrightAtom.body);
        result +=
          leftrightAtom.rightDelim === '.' || !leftrightAtom.rightDelim
            ? ':}'
            : leftrightAtom.rightDelim;
      }

      break;

    case 'sizeddelim':
    case 'delim':
      // Result += '<mo separator="true"' + makeID(atom.id, options) + '>' + (SPECIAL_OPERATORS[atom.delim] || atom.delim) + '</mo>';
      result = atom.value;
      break;

    case 'overlap':
      break;

    case 'overunder':
      break;

    case 'mord':
      result =
        SPECIAL_IDENTIFIERS[command!] ??
        command ??
        (typeof atom.value === 'string' ? atom.value : '');
      if (result.startsWith('\\')) result += ' ';
      m = command ? command.match(/{?\\char"([\dabcdefABCDEF]+)}?/) : null;
      if (m) {
        // It's a \char command
        result = String.fromCodePoint(Number.parseInt('0x' + m[1]));
      } else if (result.length > 0 && result.startsWith('\\')) {
        // Atom is an identifier with no special handling. Use the
        // Unicode value
        result =
          typeof atom.value === 'string'
            ? atom.value.charAt(0)!
            : atom.command!;
      }
      result = asciiStyle(result, atom.style);
      break;

    case 'mbin':
    case 'mrel':
    case 'minner':
      result =
        SPECIAL_IDENTIFIERS[command!] ??
        SPECIAL_OPERATORS[command!] ??
        atom.value;
      break;

    case 'mopen':
    case 'mclose':
      result += atom.value;
      break;

    case 'mpunct':
      result = SPECIAL_OPERATORS[command!] ?? command;
      break;

    case 'mop':
      // Not ZERO-WIDTH
      if (atom.value !== '\u200B') {
        if (SPECIAL_OPERATORS[command!]) result = SPECIAL_OPERATORS[command!];
        else {
          result =
            command === '\\operatorname'
              ? atomToAsciiMath(atom.body)
              : atom.value ?? command;
        }
        result += ' ';
      }
      break;

    case 'array':
      const array = (atom as ArrayAtom).array;
      const environment = (atom as ArrayAtom).environmentName;
      const rowDelim = {
        'bmatrix': ['[', ']'],
        'bmatrix*': ['[', ']'],
      }[environment] ?? ['(', ')'];
      const rows: string[] = [];
      for (const row of array) {
        const cells: string[] = [];
        for (const cell of row)
          cells.push(rowDelim[0] + atomToAsciiMath(cell) + rowDelim[1]);

        rows.push(cells.join(','));
      }

      const delim = {
        'bmatrix': ['[', ']'],
        'bmatrix*': ['[', ']'],
        'cases': ['{', ':}'],
      }[environment] ?? ['(', ')'];
      result = delim[0] + rows.join(',') + delim[1];
      break;

    case 'box':
      break;

    case 'spacing':
      result = SPECIAL_IDENTIFIERS[command] ?? ' ';
      break;

    case 'enclose':
      result = '(' + atomToAsciiMath(atom.body) + ')';
      break;

    case 'space':
      result = ' ';
      break;

    case 'subsup':
      result = '';
      break;

    case 'macro':
      result =
        SPECIAL_IDENTIFIERS[command] ??
        SPECIAL_OPERATORS[command] ??
        atomToAsciiMath(atom.body);
      break;
  }

  // Subscripts before superscripts (according to the ASCIIMath spec)
  if (!atom.hasEmptyBranch('subscript')) {
    result += '_';
    const arg = atomToAsciiMath(atom.subscript);
    result += arg.length !== 1 ? `(${arg})` : arg;
  }

  if (!atom.hasEmptyBranch('superscript')) {
    result += '^';
    const arg = atomToAsciiMath(atom.superscript);
    result += arg.length !== 1 ? `(${arg})` : arg;
  }

  return result;
}

function asciiStyle(body: string, style: Style | undefined): string {
  if (!style) return body;

  let result = body;

  if (style.variant === 'double-struck') result = `bbb "${result}"`;
  if (style.variant === 'script') result = `cc "${result}"`;
  if (style.variant === 'fraktur') result = `fr "${result}"`;
  if (style.variant === 'sans-serif') result = `sf "${result}"`;
  if (style.variant === 'monospace') result = `tt "${result}"`;

  if (style.variantStyle === 'bold') result = `bb "${result}"`;

  if (style.color) return `color({${style.color}})(${result})`;

  return result;
}
