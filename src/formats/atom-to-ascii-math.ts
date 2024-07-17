import { isArray } from '../common/types';

import type { Atom } from '../core/atom';
import { GenfracAtom } from '../atoms/genfrac';
import { LeftRightAtom } from '../atoms/leftright';
import { ArrayAtom } from '../atoms/array';
import { Style } from '../public/core-types';

const IDENTIFIERS = {
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
  '\\R': 'RR',
  '\\N': 'NN',
  '\\Z': 'ZZ',
  '\\Q': 'QQ',
  '\\C': 'CC',
  '\\emptyset': 'O/',
  '\\varnothing': 'O/',
  '\\varDelta': 'Delta',
  '\\varTheta': 'Theta',
  '\\varLambda': 'Lambda',
  '\\varXi': 'Xi',
  '\\varPi': 'Pi',
  '\\varSigma': 'Sigma',
  '\\varUpsilon': 'Upsilon',
  '\\varPhi': 'Phi',
  '\\varPsi': 'Psi',
  '\\varOmega': 'Omega',
};

const OPERATORS = {
  '\\pm': '+-',
  '\\colon': ':',
  '\\sum': ' sum ',
  '\\prod': ' prod ',
  '\\bigcap': ' nnn ',
  '\\bigcup': ' uuu ',
  '\\int': ' int ',
  '\\oint': ' oint ',
  '\\ge': '>=',
  '\\le': '<=',
  '\\ne': '!=',
  '\\neq': '!=',
  '\\lt': '<',
  '\\gt': '>',
  '\\gets': '<-',
  '\\to': '->',
  '\\land': ' and ',
  '\\lor': ' or ',
  '\\lnot': ' not ',
  '\\forall': ' AA ',
  '\\exists': ' EE ',
  '\\in': ' in ',
  '\\notin': ' !in ',
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

const FENCES = {
  '\\vert': '|',
  '\\Vert': '||',
  '\\mid': '|',
  '\\lbrack': '[',
  '\\rbrack': ']',
  '\\lbrace': '{',
  '\\rbrace': '}',
  '\\lparen': '(',
  '\\rparen': ')',
  '\\langle': '(:',
  '\\rangle': ':)',
};

function joinAsciiMath(xs: string[]): string {
  let result = '';
  for (const x of xs) {
    const last = result[result.length - 1];
    if (last !== undefined && /\d/.test(last) && /^\d/.test(x)) result += ' ';

    result += x;
  }
  return result;
}

/**
 * If `plain` is true, the output will not include quotes around text mode
 */
export function atomToAsciiMath(
  atom: Atom | Readonly<Atom[]> | undefined,
  options?: { plain: boolean }
): string {
  if (!atom) return '';
  if (isArray<Atom>(atom)) {
    if (atom.length === 0) return '';

    if (atom[0].mode === 'latex')
      return atom.map((x) => atomToAsciiMath(x)).join('');

    if (atom[0].mode === 'text') {
      // Text mode... put it in (ASCII) quotes
      let i = 0;
      let text = '';
      while (atom[i]?.mode === 'text') {
        text += atom[i].body
          ? atomToAsciiMath(atom[i].body, options)
          : atom[i].value;
        i++;
      }
      if (options?.plain) return text + atomToAsciiMath(atom.slice(i), options);
      return `"${text}" ${atomToAsciiMath(atom.slice(i))}`;
    }

    let i = 0;
    const result: string[] = [];
    while (atom[i] && atom[i].mode === 'math') {
      let digits = '';
      while (atom[i] && atom[i].type === 'mord' && /\d/.test(atom[i].value))
        digits += atom[i++].value;
      if (digits) result.push(digits);
      else result.push(atomToAsciiMath(atom[i++], options));
    }
    result.push(atomToAsciiMath(atom.slice(i), options));
    return joinAsciiMath(result);
  }

  if (atom.mode === 'text')
    return options?.plain ? atom.value : `"${atom.value}"`;

  let result = '';
  const { command } = atom;
  let m;

  if (command === '\\placeholder')
    return `(${atomToAsciiMath(atom.body, options)})`;

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

      result = `${accent ?? ''} ${atomToAsciiMath(atom.body, options)} `;
      break;

    case 'first':
      return '';

    case 'latexgroup':
      return atom.body!.map((x) => x.value).join('');

    case 'group':
    case 'root':
      result = IDENTIFIERS[command] ?? atomToAsciiMath(atom.body, options);
      break;

    case 'genfrac':
      {
        const genfracAtom = atom as GenfracAtom;
        if (genfracAtom.leftDelim || genfracAtom.rightDelim) {
          result =
            genfracAtom.leftDelim === '.' || !genfracAtom.leftDelim
              ? '{:'
              : genfracAtom.leftDelim;
        }

        if (genfracAtom.hasBarLine) {
          result += '(';
          result += atomToAsciiMath(genfracAtom.above, options);
          result += ')/(';
          result += atomToAsciiMath(genfracAtom.below, options);
          result += ')';
        } else {
          // No bar line, i.e. \choose, etc...
          result += '(' + atomToAsciiMath(genfracAtom.above, options) + '),';
          result += '(' + atomToAsciiMath(genfracAtom.below, options) + ')';
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
      if (atom.hasEmptyBranch('above'))
        result += `sqrt(${atomToAsciiMath(atom.body, options)})`;
      else
        result += `root(${atomToAsciiMath(atom.above, options)})(${atomToAsciiMath(atom.body, options)})`;
      break;

    case 'latex':
      result = atom.value;
      break;

    case 'leftright':
      {
        const leftrightAtom = atom as LeftRightAtom;

        let lDelim = leftrightAtom.leftDelim;
        if (lDelim && FENCES[lDelim]) lDelim = FENCES[lDelim];
        result += lDelim === '.' || !lDelim ? '{:' : lDelim;
        result += atomToAsciiMath(leftrightAtom.body, options);

        let rDelim = leftrightAtom.matchingRightDelim();
        if (rDelim && FENCES[rDelim]) rDelim = FENCES[rDelim];
        result += rDelim === '.' || !rDelim ? ':}' : rDelim;
      }

      break;

    case 'sizeddelim':
    case 'delim':
      // Result += '<mo separator="true"' + makeID(atom.id, options) + '>' + (FENCES[atom.delim] || atom.delim) + '</mo>';
      result = atom.value;
      break;

    case 'overlap':
      break;

    case 'overunder':
      break;

    case 'mord':
      result =
        IDENTIFIERS[command!] ??
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
      result = IDENTIFIERS[command!] ?? OPERATORS[command!] ?? atom.value;
      break;

    case 'mopen':
    case 'mclose':
      result = atom.value;
      break;

    case 'mpunct':
      result = OPERATORS[command!] ?? command;
      break;

    case 'mop':
    case 'operator':
    case 'extensible-symbol':
      // Not ZERO-WIDTH
      if (atom.value !== '\u200B') {
        if (OPERATORS[command!]) result = OPERATORS[command!];
        else {
          result =
            command === '\\operatorname'
              ? atomToAsciiMath(atom.body, options)
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
          cells.push(
            rowDelim[0] + atomToAsciiMath(cell, options) + rowDelim[1]
          );

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
      result = IDENTIFIERS[command] ?? ' ';
      break;

    case 'enclose':
      result = '(' + atomToAsciiMath(atom.body, options) + ')';
      break;

    case 'space':
      result = ' ';
      break;

    case 'subsup':
      result = '';
      break;

    case 'macro':
      result =
        IDENTIFIERS[command] ??
        OPERATORS[command] ??
        atomToAsciiMath(atom.body, options);
      break;
  }

  // Subscripts before superscripts (according to the ASCIIMath spec)
  if (!atom.hasEmptyBranch('subscript')) {
    result += '_';
    const arg = atomToAsciiMath(atom.subscript, options);
    result += arg.length !== 1 ? `(${arg})` : arg;
  }

  if (!atom.hasEmptyBranch('superscript')) {
    result += '^';
    const arg = atomToAsciiMath(atom.superscript, options);
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
