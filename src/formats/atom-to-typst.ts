import { isArray } from '../common/types';

import { Atom } from '../core/atom';
import { GenfracAtom } from '../atoms/genfrac';
import { LeftRightAtom } from '../atoms/leftright';
import { ArrayAtom } from '../atoms/array';
import { Style } from '../public/core-types';

const IDENTIFIERS = {
  '\\ne': '!=',
  '\\neq': '!=',
  '\u2212': '-', // MINUS SIGN
  '-': '-',
  '\\alpha': 'alpha',
  '\\beta': 'beta',
  '\\gamma': 'gamma',
  '\\delta': 'delta',
  '\\epsilon': 'epsilon.alt',
  '\\varepsilon': 'epsilon',
  '\\zeta': 'zeta',
  '\\eta': 'eta',
  '\\theta': 'theta.alt',
  '\\vartheta': 'theta',
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
  '\\phi': 'phi.alt',
  '\\varphi': 'phi',
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
  '\\!': ' #h(-1em/6) ',
  '\\,': ' thin ',
  '\\:': ' med ',
  '\\>': ' med ',
  '\\;': ' thick ',
  '\\enskip': 'space.en',
  '\\enspace': 'space.en',
  '\\qquad': 'space.quad space.quad',
  '\\quad': 'space.quad',
  '\\infty': 'infinity',
  '\\R': 'RR',
  '\\mathbb{R}': 'RR',
  '\\N': 'NN',
  '\\mathbb{N}': 'NN',
  '\\Z': 'ZZ',
  '\\mathbb{Z}': 'ZZ',
  '\\Q': 'QQ',
  '\\mathbb{Q}': 'QQ',
  '\\C': 'CC',
  '\\mathbb{C}': 'CC',
  '\\emptyset': 'emptyset',
  '\\varnothing': 'nothing',
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
  '\\vert': ' | ',
  '\\Vert': ' || ',
  '\\mid': ' divides ',
  '\\lbrack': ' bracket.l ',
  '\\rbrack': ' bracket.r ',
  '\\lbrace': ' brace.l ',
  '\\rbrace': ' brace.r ',
  '\\lparen': ' paren.l ',
  '\\rparen': ' paren.r ',
  '\\langle': ' angle.l ',
  '\\rangle': ' angle.r ',
  '\\differentialD': ' dif ',
  '\\diamond': ' diamond.stroked.small ',
  '\\square': ' square.stroked.small ',
  '\\lceil': ' ceil.l ',
  '\\rceil': ' ceil.r ',
  '\\lfloor': ' floor.l ',
  '\\rfloor': ' floor.r ',
  '\\aleph': ' aleph ',
  '\\bet': ' bet ',
  '\\gimel': ' gimel ',
  '\\dalet': ' dalet ',
  '\\mod': ' mod ',
  '\\equiv': ' equiv ',
  '\\subset': ' subset ',
  '\\supset': ' supset ',
  '\\subseteq': ' subset.eq ',
  '\\supseteq': ' supset.eq ',
  '\\subsetneq': ' subset.neq ',
  '\\supsetneq': ' supset.neq ',
  '\\supsetneqq': ' supset.neq ',
  '\\nsubset': ' subset.not ',
  '\\nsupset': ' supset.not ',
  '\\nsubseteq': ' subset.eq.not ',
  '\\nsupseteq': ' supset.eq.not ',
  '\\approx': ' approx ',
  '\\uparrow': ' arrow.t ',
  '\\downarrow': ' arrow.b ',
  '\\rightarrow': ' arrow.r ',
  '\\leftarrow': ' arrow.l ',
  '\\longmapsto': ' mapsto.long ',
  '\\longmapsfrom': ' arrow.l.bar.long ',
  '/': '\\/',
  '&': '&',
};

const FENCES = {
  '[': ' bracket.l ',
  ']': ' bracket.r ',
  '{': ' brace.l ',
  '}': ' brace.r ',
  '(': ' paren.l ',
  ')': ' paren.r ',
  '<': ' angle.l ',
  '>': ' angle.r ',
  '.': '',
};
const REVERSE_FENCES = {
  ' bracket.l ': '[',
  ' bracket.r ': ']',
  ' brace.l ': '{',
  ' brace.r ': '}',
  ' paren.l ': '(',
  ' paren.r ': ')',
  ' angle.l ': ' angle.l ',
  ' angle.r ': ' angle.r ',
};

const OPERATORS = {
  '\\pm': 'plus.minus',
  '\\colon': ' : ',
  '\\sum': ' sum ',
  '\\prod': ' product ',
  '\\bigcap': ' inter.big ',
  '\\bigcup': ' union.big ',
  '\\int': ' integral ',
  '\\iint': ' integral.double ',
  '\\iiint': ' integral.triple ',
  '\\intop': ' integral ',
  '\\oint': ' integral.cont ',
  '\\oiint': ' integral.surf ',
  '\\oiiint': ' integral.vol ',
  '\\setminus': ' without ',
  '\\vdots': ' without ',
  '\\ddots': ' dots.down ',
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
  '\\forall': ' forall ',
  '\\exists': ' exists ',
  '\\in': ' in ',
  '\\notin': ' in.not ',
  '\\mapsto': '|->',
  '\\implies': '==>',
  '\\iff': '<==>',

  '\\cdot': ' dot.op ',
  '\\ast': ' * ',
  '\\star': ' star.op ',
  '\\times': ' times ',
  '\\div': ' div ',
  '\\ltimes': ' times.l ',
  '\\rtimes': ' times.r ',
  '\\bowtie': ' ⋈ ',
  '\\circ': ' circle.stroked.small ',
};

const CUSTOM_FUNCTIONS: Record<string, string> = {
  underarc: 'underparen',
  underparen: 'underparen',
  underbrace: 'underbrace',
  underline: 'underline',
  overarc: 'overparen',
  overparen: 'overparen',
  overbrace: 'overbrace',
  overline: 'overline',
  cancel: 'cancel',
  displaystyle: 'display',
  textstyle: 'inline',
};

const CUSTOM_CONVERTERS: Record<string, (atom: Atom) => string> = {
  longrightarrow: (atom) => `arrow.r.long^(${atomToTypst(atom.above)})`,
  longleftarrow: (atom) => `arrow.l.long^(${atomToTypst(atom.above)})`,
};

function joinAsciiMath(xs: string[]): string {
  let result = '';
  for (const x of xs) {
    const last = result[result.length - 1];
    if (
      last !== undefined &&
      ((/\d$/.test(last) && /^\d/.test(x)) ||
        (/[a-zA-Z]$/.test(last) && /^[a-zA-Z]/.test(x)))
    )
      result += ' ';

    result += x;
  }
  return result;
}

export function atomToTypst(atom: Atom | readonly Atom[] | undefined): string {
  if (!atom) return '';
  if (isArray<Atom>(atom)) {
    if (atom.length === 0) return '';

    if (atom[0].mode === 'latex')
      return atom.map((x) => atomToTypst(x)).join('');

    if (atom[0].mode === 'text') {
      // Text mode... put it in (ASCII) quotes
      let i = 0;
      let text = '';
      while (atom[i]?.mode === 'text') {
        text += atom[i].body ? atomToTypst(atom[i].body) : atom[i].value;
        i++;
      }
      return ` "${text}" ${atomToTypst(atom.slice(i))}`;
    }

    let i = 0;
    const result: string[] = [];
    while (atom[i]?.mode === 'math') {
      let digits = '';
      while (atom[i]?.type === 'mord' && /\d/.test(atom[i].value))
        digits += atom[i++].value;
      if (digits) result.push(digits);
      else result.push(atomToTypst(atom[i++]));
    }
    result.push(atomToTypst(atom.slice(i)));
    return joinAsciiMath(result);
  }

  if (atom.mode === 'text') return `"${atom.value}"`;

  let result = '';
  const { command } = atom;
  let m: string[] | null;

  if (command === '\\placeholder') return `"${atomToTypst(atom.body)}"`;

  const latex = Atom.serialize([atom], {
    expandMacro: true,
    defaultMode: 'math',
  });

  switch (atom.type) {
    case 'accent':
      const accent = {
        '\\vec': 'arrow',
        '\\dot': 'dot',
        '\\ddot': 'dot.double',
        '\\bar': 'overline',
        '\\hat': 'hat',
        '\\acute': 'acute',
        '\\grave': 'grave',
        '\\tilde': 'tilde',
        '\\breve': 'breve',
        '\\check': 'caron',
      }[command];

      result = `${accent ?? ''}(${atomToTypst(atom.body)}) `;
      break;

    case 'first':
      return '';

    case 'latexgroup':
      return atom.body!.map((x) => x.value).join('');

    case 'group':
    case 'root':
      result = IDENTIFIERS[command] ?? atomToTypst(atom.body);
      break;

    case 'genfrac':
      {
        const genfracAtom = atom as GenfracAtom;

        if (genfracAtom.hasBarLine) {
          result += '(';
          result += atomToTypst(genfracAtom.above);
          result += ')/(';
          result += atomToTypst(genfracAtom.below);
          result += ')';
        } else {
          // No bar line, for \choose
          result += `binom(${atomToTypst(genfracAtom.above)}, ${atomToTypst(genfracAtom.below)})`;
        }
      }

      break;

    case 'surd':
      if (atom.hasEmptyBranch('above'))
        result += `sqrt(${atomToTypst(atom.body)})`;
      else
        result += `root(${atomToTypst(atom.above)}, ${atomToTypst(atom.body)})`;
      break;

    case 'latex':
      result = atom.value;
      break;

    case 'leftright':
      {
        const leftrightAtom = atom as LeftRightAtom;

        let lDelim = leftrightAtom.leftDelim;
        if (lDelim && IDENTIFIERS[lDelim]) lDelim = IDENTIFIERS[lDelim];

        let rDelim = leftrightAtom.matchingRightDelim();
        if (rDelim && IDENTIFIERS[rDelim]) rDelim = IDENTIFIERS[rDelim];

        if (lDelim) lDelim = FENCES[lDelim] ?? lDelim;

        if (rDelim) rDelim = FENCES[rDelim] ?? rDelim;

        if (lDelim && rDelim) {
          result = `lr(${REVERSE_FENCES[lDelim] ?? lDelim}${atomToTypst(leftrightAtom.body)}${
            REVERSE_FENCES[rDelim] ?? rDelim
          })`;
        } else
          result = `lr(${lDelim}${atomToTypst(leftrightAtom.body)}${rDelim})`;
      }

      break;

    case 'sizeddelim':
    case 'delim':
      result = atom.value;
      break;

    case 'overlap':
      break;

    case 'mord':
      if (IDENTIFIERS[latex]) return IDENTIFIERS[latex!];
      result =
        IDENTIFIERS[command!] ??
        command ??
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
      result = typstStyle(result, atom.style);
      result = ` ${result} `;
      break;

    case 'mbin':
    case 'mrel':
    case 'minner':
      result =
        IDENTIFIERS[latex] ??
        IDENTIFIERS[command!] ??
        OPERATORS[command!] ??
        atom.value;
      break;

    case 'mopen':
    case 'mclose':
      result = IDENTIFIERS[latex] ?? atom.value;
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
              ? atomToTypst(atom.body)
              : (atom.value ?? command);
        }
        result += ' ';
      }
      break;

    case 'array':
      const environment = (atom as ArrayAtom).environmentName;
      if ((atom as ArrayAtom).isMultiline) {
        const lines = (atom as ArrayAtom).rows!;
        result = lines
          .map((line) => line.map((cell) => atomToTypst(cell)).join(''))
          .join('\n');
      } else {
        const array = (atom as ArrayAtom).rows;
        const rows = array.map((row) => row.map(atomToTypst).join(', '));

        const delim = {
          'pmatrix': '"("',
          'bmatrix': '"["',
          'bmatrix*': '"["',
          'Bmatrix': '"{"',
          'vmatrix': '"|"',
          'matrix': '#none',
        }[environment];

        if (delim) result = `mat(delim: ${delim}, ${rows.join(' ; ')})`;
        else if (environment === 'cases' || environment === 'rcases')
          result = `cases(reverse: #${environment === 'rcases'}, ${rows.join(', ')})`;
        else if (environment === 'aligned') {
          result = array
            .map((row) => row.map(atomToTypst).join(' & '))
            .join(' \\ ');
        } else
          result = array.map((row) => row.map(atomToTypst).join('')).join('');
      }
      break;

    case 'box':
      break;

    case 'spacing':
      result = IDENTIFIERS[latex] ?? IDENTIFIERS[command] ?? ' ';
      break;

    case 'space':
      result = ' ';
      break;

    case 'subsup':
      result = atom.leftSibling?.value ? '' : '""';
      break;

    case 'macro':
      result =
        IDENTIFIERS[latex] ??
        IDENTIFIERS[command] ??
        OPERATORS[command] ??
        atomToTypst(atom.body);
      break;

    case 'overunder':
      break;
  }

  if (!result) {
    const customFunction = CUSTOM_FUNCTIONS[atom.command.slice(1)];
    if (customFunction) result = `${customFunction}(${atomToTypst(atom.body)})`;
  }

  if (!result) {
    const customConverter = CUSTOM_CONVERTERS[atom.command.slice(1)];
    if (customConverter) result = customConverter(atom);
  }

  if (!atom.hasEmptyBranch('subscript')) {
    result += '_';
    const arg = atomToTypst(atom.subscript);
    result += arg.length !== 1 ? `(${arg})` : arg;
  }

  if (!atom.hasEmptyBranch('superscript')) {
    result += '^';
    const arg = atomToTypst(atom.superscript);
    result += arg.length !== 1 ? `(${arg})` : arg;
  }

  return result;
}

function typstStyle(body: string, style: Style | undefined): string {
  if (!style) return body;

  let result = body;

  if (style.variant === 'double-struck') result = `bb(${result})`;
  if (style.variant === 'script') result = `cal(${result})`;
  if (style.variant === 'fraktur') result = `frak(${result})`;
  if (style.variant === 'sans-serif') result = `sans(${result})`;
  if (style.variant === 'monospace') result = `mono(${result})`;

  if (style.variantStyle === 'bold') result = `bold(${result})`;

  // TODO: if (style.color) return;

  return result;
}
