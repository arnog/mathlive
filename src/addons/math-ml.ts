import type { MathfieldOptions } from '../public/options';
import { Atom } from '../core/atom';
import { stringToColor } from '../core/color';
const SPECIAL_OPERATORS = {
  '\\pm': '&#177;',
  '\\times': '&#215;',
  '\\colon': ':',
  '\\vert': '|',
  '\\Vert': '\u2225',
  '\\mid': '\u2223',
  '\\lbrace': '{',
  '\\rbrace': '}',
  '\\langle': '\u27E8',
  '\\rangle': '\u27E9',
  '\\lfloor': '\u230A',
  '\\rfloor': '\u230B',
  '\\lceil': '\u2308',
  '\\rceil': '\u2309',

  '\\vec': '&#x20d7;',
  '\\acute': '&#x00b4;',
  '\\grave': '&#x0060;',
  '\\dot': '&#x02d9;',
  '\\ddot': '&#x00a8;',
  '\\tilde': '&#x007e;',
  '\\bar': '&#x00af;',
  '\\breve': '&#x02d8;',
  '\\check': '&#x02c7;',
  '\\hat': '&#x005e;',
};

const APPLY_FUNCTION = '&#x2061;';

const INVISIBLE_TIMES = '&#8290;';

function xmlEscape(string: string): string {
  return (
    string
      // .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  );
}

function makeID(id, options) {
  if (!id || !options.generateID) return '';
  // Note: the 'extid' attribute is recognized by SRE as an attribute
  // to be passed to SSML as a <mark> tag.
  return ' extid="' + id + '"';
}

function scanIdentifier(stream, final, options) {
  let result = false;
  final = final || stream.atoms.length;
  let mathML = '';
  let body = '';
  let superscript = -1;
  let subscript = -1;
  const atom: Atom = stream.atoms[stream.index];

  if (
    stream.index < final &&
    atom.type === 'mord' &&
    !'0123456789,.'.includes(atom.value)
  ) {
    body = atomToMathML(atom, options);
    if (atom.superscript) {
      superscript = stream.index;
    }

    if (atom.subscript) {
      subscript = stream.index;
    }

    stream.index += 1;
  }

  if (body.length > 0) {
    result = true;

    // If there are separate atoms for sub/sup, record them
    if (isSuperscriptAtom(stream)) {
      superscript = stream.index;
      stream.index += 1;
    }

    if (isSubscriptAtom(stream)) {
      subscript = stream.index;
      stream.index += 1;
    }

    if (superscript >= 0 && subscript >= 0) {
      mathML = '<msubsup>' + body;
      mathML += toMathML(stream.atoms[subscript].subscript, 0, 0, options)
        .mathML;
      mathML += toMathML(stream.atoms[superscript].superscript, 0, 0, options)
        .mathML;
      mathML += '</msubsup>';
    } else if (superscript >= 0) {
      mathML = '<msup>' + body;
      if (isSuperscriptAtom(stream)) {
        // There's another superscript after this one. Maybe double-prime?
        const sup = toMathML(
          stream.atoms[superscript].superscript,
          0,
          0,
          options
        ).mathML;

        const sup2 = toMathML(
          stream.atoms[superscript + 1].superscript,
          0,
          0,
          options
        ).mathML;
        if (
          (sup === '<mi>\u2032</mi>' || sup === '<mi>&#x2032;</mi>') &&
          (sup2 === '<mi>\u2032</mi>' || sup2 === '<mi>&#x2032;</mi>')
        ) {
          mathML += '<mi>&#x2033;</mi>';
        } else if (sup === '<mi>\u2032</mi>' || sup === '<mi>&#x2032;</mi>') {
          mathML += '<mi>&#x2032;</mi>';
        } else {
          mathML += sup;
        }
      } else {
        mathML += toMathML(stream.atoms[superscript].superscript, 0, 0, options)
          .mathML;
      }

      mathML += '</msup>';
    } else if (subscript >= 0) {
      mathML = '<msub>' + body;
      mathML += toMathML(stream.atoms[subscript].subscript, 0, 0, options)
        .mathML;
      mathML += '</msub>';
    } else {
      mathML = body;
    }

    if (
      (stream.lastType === 'mi' ||
        stream.lastType === 'mn' ||
        stream.lastType === 'mtext' ||
        stream.lastType === 'fence') &&
      !/^<mo>(.*)<\/mo>$/.test(mathML)
    ) {
      mathML = `<mo>${INVISIBLE_TIMES}</mo>${mathML}`; // &InvisibleTimes;
    }

    if (body.endsWith('>f</mi>') || body.endsWith('>g</mi>')) {
      mathML += `<mo>${APPLY_FUNCTION}</mo>`; // &ApplyFunction;
      stream.lastType = 'applyfunction';
    } else {
      stream.lastType = /^<mo>(.*)<\/mo>$/.test(mathML) ? 'mo' : 'mi';
    }

    stream.mathML += mathML;
  }

  return result;
}

/**
 * Return true if the current atom is a standalone superscript atom
 * i.e. an atom with no content, except of a superscript.
 * Superscripts can be encoded either as an attribute on the last atom
 * or as a standalone, empty, atom following the one to which it applies.
 * @param {object} stream
 */
function isSuperscriptAtom(stream) {
  return (
    stream.index < stream.atoms.length &&
    stream.atoms[stream.index].superscript &&
    stream.atoms[stream.index].type === 'msubsup'
  );
}

function isSubscriptAtom(stream) {
  return (
    stream.index < stream.atoms.length &&
    stream.atoms[stream.index].subscript &&
    stream.atoms[stream.index].type === 'msubsup'
  );
}

function indexOfSuperscriptInNumber(stream) {
  let result = -1;
  let i = stream.index;
  let done = false;
  let found = false;
  while (i < stream.atoms.length && !done && !found) {
    done =
      stream.atoms[i].type !== 'mord' ||
      !'0123456789,.'.includes(stream.atoms[i].body);
    found = !done && stream.atoms[i].superscript;
    i++;
  }

  if (found) {
    result = i - 1;
  }

  return result;
}

function parseSubsup(base, stream, options) {
  let result = false;
  let mathML = '';
  let atom: Atom = stream.atoms[stream.index - 1];

  if (!atom) {
    return false;
  }

  if (!atom.superscript && !atom.subscript) {
    if (isSuperscriptAtom(stream) || isSubscriptAtom(stream)) {
      atom = stream.atoms[stream.index];
      stream.index += 1;
    }
  }

  if (!atom) {
    return false;
  }

  if (atom.superscript && atom.subscript) {
    mathML = '<msubsup>' + base;
    mathML += toMathML(atom.subscript, 0, 0, options).mathML;
    mathML += toMathML(atom.superscript, 0, 0, options).mathML;
    mathML += '</msubsup>';
  } else if (atom.superscript) {
    mathML = '<msup>' + base;
    mathML += toMathML(atom.superscript, 0, 0, options).mathML;
    mathML += '</msup>';
  } else if (atom.subscript) {
    mathML = '<msub>' + base;
    mathML += toMathML(atom.subscript, 0, 0, options).mathML;
    mathML += '</msub>';
  }

  if (mathML.length > 0) {
    result = true;
    stream.mathML += mathML;
    stream.lastType = '';
  }

  return result;
}

function scanText(stream, final, options) {
  let result = false;
  final = final || stream.atoms.length;
  const initial = stream.index;
  let mathML = '';
  while (stream.index < final && stream.atoms[stream.index].mode === 'text') {
    mathML += stream.atoms[stream.index].body
      ? stream.atoms[stream.index].body
      : ' ';
    stream.index += 1;
  }

  if (mathML.length > 0) {
    result = true;
    mathML =
      '<mtext' +
      makeID(stream.atoms[initial].id, options) +
      '>' +
      mathML +
      '</mtext>';

    stream.mathML += mathML;
    stream.lastType = 'mtext';
  }

  return result;
}

function scanNumber(stream, final, options) {
  let result = false;
  final = final || stream.atoms.length;
  const initial = stream.index;
  let mathML = '';

  let superscript = indexOfSuperscriptInNumber(stream);
  if (superscript >= 0 && superscript < final) {
    final = superscript;
  }

  while (
    stream.index < final &&
    stream.atoms[stream.index].type === 'mord' &&
    '0123456789,.'.includes(stream.atoms[stream.index].body)
  ) {
    mathML += stream.atoms[stream.index].body;
    stream.index += 1;
  }

  if (mathML.length > 0) {
    result = true;
    mathML =
      '<mn' +
      makeID(stream.atoms[initial].id, options) +
      '>' +
      mathML +
      '</mn>';

    if (superscript < 0 && isSuperscriptAtom(stream)) {
      superscript = stream.index;
      stream.index += 1;
    }

    if (superscript >= 0) {
      mathML = '<msup>' + mathML;
      mathML += toMathML(stream.atoms[superscript].superscript, 0, 0, options)
        .mathML;
      mathML += '</msup>';
    }

    stream.mathML += mathML;
    stream.lastType = 'mn';
  }

  return result;
}

function scanFence(stream, final, options) {
  let result = false;
  final = final || stream.atoms.length;
  let mathML = '';
  let lastType = '';

  if (stream.index < final && stream.atoms[stream.index].type === 'mopen') {
    let found = false;
    let depth = 0;
    const openIndex = stream.index;
    let closeIndex = -1;
    let index = openIndex + 1;
    while (index < final && !found) {
      if (stream.atoms[index].type === 'mopen') {
        depth += 1;
      } else if (stream.atoms[index].type === 'mclose') {
        depth -= 1;
      }

      if (depth === -1) {
        found = true;
        closeIndex = index;
      }

      index += 1;
    }

    if (found) {
      // TODO: could add attribute indicating it's a fence (fence=true)
      mathML = '<mrow>';
      mathML += toMo(stream.atoms[openIndex], options);

      mathML += toMathML(stream.atoms, openIndex + 1, closeIndex, options)
        .mathML;

      // TODO: could add attribute indicating it's a fence (fence=true)
      mathML += toMo(stream.atoms[closeIndex], options);
      mathML += '</mrow>';

      if (
        stream.lastType === 'mi' ||
        stream.lastType === 'mn' ||
        stream.lastType === 'mfrac' ||
        stream.lastType === 'fence'
      ) {
        mathML = `<mo>${INVISIBLE_TIMES}</mo>${mathML}`; // &InvisibleTimes;
      }

      stream.index = closeIndex + 1;

      if (parseSubsup(mathML, stream, options)) {
        result = true;
        stream.lastType = '';
        mathML = '';
      }

      lastType = 'fence';
    }
  }

  if (mathML.length > 0) {
    result = true;
    stream.mathML += mathML;
    stream.lastType = lastType;
  }

  return result;
}

function scanOperator(stream, final, options) {
  let result = false;
  final = final || stream.atoms.length;
  let mathML = '';
  let lastType = '';
  const atom: Atom = stream.atoms[stream.index];

  if (stream.index < final && (atom.type === 'mbin' || atom.type === 'mrel')) {
    mathML += atomToMathML(stream.atoms[stream.index], options);
    stream.index += 1;
    lastType = 'mo';
  } else if (stream.index < final && atom.type === 'mop') {
    // MathML += '<mrow>';

    if (atom.limits === 'limits' && (atom.superscript || atom.subscript)) {
      // Operator with limits, e.g. \sum
      const op = toMo(atom, options);
      if (atom.superscript && atom.subscript) {
        // Both superscript and subscript
        mathML += '<munderover>' + op;

        mathML += toMathML(atom.subscript, 0, 0, options).mathML;
        mathML += toMathML(atom.superscript, 0, 0, options).mathML;
        mathML += '</munderover>';
      } else if (atom.superscript) {
        // Superscript only
        mathML += '<mover>' + op;
        mathML += toMathML(atom.superscript, 0, 0, options).mathML;
        mathML += '</mover>';
      } else {
        // Subscript only
        mathML += '<munder>' + op;
        mathML += toMathML(atom.subscript, 0, 0, options).mathML;
        mathML += '</munder>';
      }

      lastType = 'mo';
    } else {
      const atom = stream.atoms[stream.index];
      const isUnit = atom.symbol === '\\operatorname';
      const op = isUnit
        ? '<mi class="MathML-Unit"' +
          makeID(atom.id, options) +
          '>' +
          toString(atom.value) +
          '</mi>'
        : toMo(atom, options);
      mathML += op;
      stream.index += 1;
      if (parseSubsup(mathML, stream, options)) {
        result = true;
        stream.lastType = '';
        mathML = '';
      }

      stream.index -= 1;
      if (!isUnit && !/^<mo>(.*)<\/mo>$/.test(op)) {
        mathML += `<mo>${APPLY_FUNCTION}</mo>`; // APPLY FUNCTION
        // mathML += scanArgument(stream);
        lastType = 'applyfunction';
      } else {
        lastType = isUnit ? 'mi' : 'mo';
      }
    }
    // MathML += '</mrow>';

    if (
      (stream.lastType === 'mi' || stream.lastType === 'mn') &&
      !/^<mo>(.*)<\/mo>$/.test(mathML)
    ) {
      mathML = `<mo>${INVISIBLE_TIMES}</mo>${mathML}`; // &InvisibleTimes;
    }

    stream.index += 1;
  }

  if (mathML.length > 0) {
    result = true;
    stream.mathML += mathML;
    stream.lastType = lastType;
  }

  return result;
}

/**
 * Given an atom or an array of atoms, return their MathML representation as
 * a string.
 * @param {string|Atom|Atom[]} input
 * @param initial index of the input to start conversion from
 * @param final last index of the input to stop conversion to
 */
function toMathML(
  input: number | boolean | string | Atom | Atom[],
  initial: number,
  final: number,
  options: Partial<MathfieldOptions>
): {
  atoms: number | boolean | string | Atom | Atom[];
  index: number;
  mathML: string;
  lastType: string;
} {
  const result = {
    atoms: input,
    index: initial ?? 0,
    mathML: '',
    lastType: '',
  };

  if (typeof input === 'number' || typeof input === 'boolean') {
    result.mathML = input.toString();
  } else if (typeof input === 'string') {
    result.mathML = input;
  } else if (input instanceof Atom) {
    result.mathML = atomToMathML(input, options);
  } else if (Array.isArray(input)) {
    let count = 0;
    final = final ? final : input ? input.length : 0;

    while (result.index < final) {
      if (
        scanText(result, final, options) ||
        scanNumber(result, final, options) ||
        scanIdentifier(result, final, options) ||
        scanOperator(result, final, options) ||
        scanFence(result, final, options)
      ) {
        count += 1;
      } else if (result.index < final) {
        let mathML = atomToMathML(result.atoms[result.index], options);
        if (
          result.lastType === 'mn' &&
          mathML.length > 0 &&
          result.atoms[result.index].type === 'genfrac'
        ) {
          // If this is a fraction preceded by a number (e.g. 2 1/2),
          // add an "invisible plus" (U+0264) character in front of it
          mathML = '<mo>&#x2064;</mo>' + mathML;
        }

        if (result.atoms[result.index].type === 'genfrac') {
          result.lastType = 'mfrac';
        } else {
          result.lastType = '';
        }

        if (mathML.length > 0) {
          result.mathML += mathML;
          count += 1;
        }

        result.index += 1;
      }
    }

    // If there are more than a single element, wrap them in a mrow tag.
    if (count > 1) {
      result.mathML = '<mrow>' + result.mathML + '</mrow>';
    }
  }

  return result;
}

function toMo(atom, options) {
  let result = '';
  const body = toString(atom.value);
  if (body) {
    result = '<mo' + makeID(atom.id, options) + '>' + body + '</mo>';
  }

  return result;
}

function toString(atoms) {
  if (!atoms) return '';
  if (typeof atoms === 'string') return xmlEscape(atoms);
  if (!Array.isArray(atoms) && typeof atoms.body === 'string') {
    return xmlEscape(atoms.body);
  }

  let result = '';
  for (const atom of atoms) {
    if (typeof atom.value === 'string') {
      result += atom.value;
    }
  }

  return xmlEscape(result);
}

/**
 * Return a MathML fragment representation of a single atom
 *
 */
function atomToMathML(atom, options): string {
  // For named SVG atoms, map to a Unicode char
  const SVG_CODE_POINTS = {
    widehat: '^',
    widecheck: 'ˇ',
    widetilde: '~',
    utilde: '~',
    overleftarrow: '\u2190',
    underleftarrow: '\u2190',
    xleftarrow: '\u2190',
    overrightarrow: '\u2192',
    underrightarrow: '\u2192',
    xrightarrow: '\u2192',
    underbrace: '\u23DF',
    overbrace: '\u23DE',
    overgroup: '\u23E0',
    undergroup: '\u23E1',
    overleftrightarrow: '\u2194',
    underleftrightarrow: '\u2194',
    xleftrightarrow: '\u2194',
    Overrightarrow: '\u21D2',
    xRightarrow: '\u21D2',
    overleftharpoon: '\u21BC',
    xleftharpoonup: '\u21BC',
    overrightharpoon: '\u21C0',
    xrightharpoonup: '\u21C0',
    xLeftarrow: '\u21D0',
    xLeftrightarrow: '\u21D4',
    xhookleftarrow: '\u21A9',
    xhookrightarrow: '\u21AA',
    xmapsto: '\u21A6',
    xrightharpoondown: '\u21C1',
    xleftharpoondown: '\u21BD',
    xrightleftharpoons: '\u21CC',
    xleftrightharpoons: '\u21CB',
    xtwoheadleftarrow: '\u219E',
    xtwoheadrightarrow: '\u21A0',
    xlongequal: '=',
    xtofrom: '\u21C4',
    xrightleftarrows: '\u21C4',
    xrightequilibrium: '\u21CC', // Not a perfect match.
    xleftequilibrium: '\u21CB', // None better available.
  };

  const SPECIAL_IDENTIFIERS = {
    '\\exponentialE': '&#x02147;',
    '\\imaginaryI': '&#x2148;',
    '\\differentialD': '&#x2146;',
    '\\capitalDifferentialD': '&#x2145;',
    '\\alpha': '&#x03b1;',
    '\\pi': '&#x03c0;',
    '\\infty': '&#x221e;',
    '\\forall': '&#x2200;',
    '\\nexists': '&#x2204;',
    '\\exists': '&#x2203;',
    '\\hbar': '\u210F',
    '\\cdotp': '\u22C5',
    '\\ldots': '\u2026',
    '\\cdots': '\u22EF',
    '\\ddots': '\u22F1',
    '\\vdots': '\u22EE',
    '\\ldotp': '\u002E',
  };

  const MATH_VARIANTS = {
    cal: 'script',
    frak: 'fraktur',
    bb: 'double-struck',
    scr: 'script',
    cmtt: 'monospace',
    cmss: 'sans-serif',
  };
  const SPACING = {
    '\\!': -3 / 18,
    '\\ ': 6 / 18,
    '\\,': 3 / 18,
    '\\:': 4 / 18,
    '\\;': 5 / 18,
    '\\enspace': 0.5,
    '\\quad': 1,
    '\\qquad': 2,
    '\\enskip': 0.5,
  };

  let result = '';
  let sep = '';
  let col;
  let row;
  let i;
  let underscript;
  let overscript;
  let body;
  let variant = MATH_VARIANTS[atom.fontFamily || atom.font] || '';
  if (variant) {
    variant = ' mathvariant="' + variant + '"';
  }

  const { command } = atom;
  if (atom.mode === 'text') {
    result = '<mi' + makeID(atom.id, options) + '>' + atom.value + '</mi>';
  } else {
    switch (atom.type) {
      case 'first':
        break; // Nothing to do
      case 'group':
      case 'root':
        result = toMathML(atom.body, 0, 0, options).mathML;
        break;

      case 'array':
        if (
          (atom.leftDelim && atom.leftDelim !== '.') ||
          (atom.rightDelim && atom.rightDelim !== '.')
        ) {
          result += '<mrow>';
          if (atom.leftDelim && atom.leftDelim !== '.') {
            result +=
              '<mo>' +
              (SPECIAL_OPERATORS[atom.leftDelim] || atom.leftDelim) +
              '</mo>';
          }
        }

        result += '<mtable';
        if (atom.colFormat) {
          result += ' columnalign="';
          for (i = 0; i < atom.colFormat.length; i++) {
            if (atom.colFormat[i].align) {
              result +=
                { l: 'left', c: 'center', r: 'right' }[
                  atom.colFormat[i].align
                ] + ' ';
            }
          }

          result += '"';
        }

        result += '>';
        for (row = 0; row < atom.array.length; row++) {
          result += '<mtr>';
          for (col = 0; col < atom.array[row].length; col++) {
            result +=
              '<mtd>' +
              toMathML(atom.array[row][col], 0, 0, options).mathML +
              '</mtd>';
          }

          result += '</mtr>';
        }

        result += '</mtable>';

        if (
          (atom.leftDelim && atom.leftDelim !== '.') ||
          (atom.rightDelim && atom.rightDelim !== '.')
        ) {
          if (atom.rightDelim && atom.rightDelim !== '.') {
            result +=
              '<mo>' +
              (SPECIAL_OPERATORS[atom.leftDelim] || atom.rightDelim) +
              '</mo>';
          }

          result += '</mrow>';
        }

        break;

      case 'genfrac':
        if (atom.leftDelim || atom.rightDelim) {
          result += '<mrow>';
        }

        if (atom.leftDelim && atom.leftDelim !== '.') {
          result +=
            '<mo' +
            makeID(atom.id, options) +
            '>' +
            (SPECIAL_OPERATORS[atom.leftDelim] || atom.leftDelim) +
            '</mo>';
        }

        if (atom.hasBarLine) {
          result += '<mfrac>';
          result +=
            toMathML(atom.above, 0, 0, options).mathML || '<mi>&nbsp;</mi>';
          result +=
            toMathML(atom.below, 0, 0, options).mathML || '<mi>&nbsp;</mi>';
          result += '</mfrac>';
        } else {
          // No bar line, i.e. \choose, etc...
          result += '<mtable' + makeID(atom.id, options) + '>';
          result +=
            '<mtr>' + toMathML(atom.above, 0, 0, options).mathML + '</mtr>';
          result +=
            '<mtr>' + toMathML(atom.below, 0, 0, options).mathML + '</mtr>';
          result += '</mtable>';
        }

        if (atom.rightDelim && atom.rightDelim !== '.') {
          result +=
            '<mo' +
            makeID(atom.id, options) +
            '>' +
            (SPECIAL_OPERATORS[atom.rightDelim] || atom.rightDelim) +
            '</mo>';
        }

        if (atom.leftDelim || atom.rightDelim) {
          result += '</mrow>';
        }

        break;

      case 'surd':
        if (!atom.hasEmptyBranch('above')) {
          result += '<mroot' + makeID(atom.id, options) + '>';
          result += toMathML(atom.body, 0, 0, options).mathML;
          result += toMathML(atom.above, 0, 0, options).mathML;
          result += '</mroot>';
        } else {
          result += '<msqrt' + makeID(atom.id, options) + '>';
          result += toMathML(atom.body, 0, 0, options).mathML;
          result += '</msqrt>';
        }

        break;

      case 'leftright':
        // TODO: could add fence=true attribute
        result = '<mrow>';
        if (atom.leftDelim && atom.leftDelim !== '.') {
          result +=
            '<mo' +
            makeID(atom.id, options) +
            '>' +
            (SPECIAL_OPERATORS[atom.leftDelim] || atom.leftDelim) +
            '</mo>';
        }

        if (atom.body) {
          result += toMathML(atom.body, 0, 0, options).mathML;
        }

        if (atom.rightDelim && atom.rightDelim !== '.') {
          result +=
            '<mo' +
            makeID(atom.id, options) +
            '>' +
            (SPECIAL_OPERATORS[atom.rightDelim] || atom.rightDelim) +
            '</mo>';
        }

        result += '</mrow>';
        break;

      case 'sizeddelim':
      case 'delim':
        result +=
          '<mo separator="true"' +
          makeID(atom.id, options) +
          '>' +
          (SPECIAL_OPERATORS[atom.delim] || atom.delim) +
          '</mo>';
        break;

      case 'accent':
        result += '<mover accent="true"' + makeID(atom.id, options) + '>';
        result += toMathML(atom.body, 0, 0, options).mathML;
        result +=
          '<mo>' + (SPECIAL_OPERATORS[command] || atom.accent) + '</mo>';
        result += '</mover>';
        break;

      case 'line':
      case 'overlap':
        break;

      case 'overunder':
        overscript = atom.above;
        underscript = atom.below;
        if ((atom.svgAbove || overscript) && (atom.svgBelow || underscript)) {
          body = atom.body;
        } else if (overscript && overscript.length > 0) {
          body = atom.body;
          if (atom.body?.[0]?.below) {
            underscript = atom.body[0].below;
            body = atom.body[0].body;
          } else if (
            atom.body?.[0]?.type === 'first' &&
            atom.body?.[1]?.below
          ) {
            underscript = atom.body[1].below;
            body = atom.body[1].body;
          }
        } else if (underscript && underscript.length > 0) {
          body = atom.body;
          if (atom.body?.[0]?.above) {
            overscript = atom.body[0].above;
            body = atom.body[0].body;
          } else if (
            atom.body?.[0]?.type === 'first' &&
            atom.body?.[1]?.above
          ) {
            overscript = atom.body[1].overscript;
            body = atom.body[1].body;
          }
        }

        if ((atom.svgAbove || overscript) && (atom.svgBelow || underscript)) {
          result += `<munderover ${variant} ${makeID(atom.id, options)}>`;
          result +=
            SVG_CODE_POINTS[atom.svgBody] ||
            toMathML(body, 0, 0, options).mathML;
          result +=
            SVG_CODE_POINTS[atom.svgBelow] ||
            toMathML(underscript, 0, 0, options).mathML;
          result +=
            SVG_CODE_POINTS[atom.svgAbove] ||
            toMathML(overscript, 0, 0, options).mathML;
          result += '</munderover>';
        } else if (atom.svgAbove || overscript) {
          result +=
            `<mover ${variant} ${makeID(atom.id, options)}>` +
            (SVG_CODE_POINTS[atom.svgBody] ||
              toMathML(body, 0, 0, options).mathML);
          result +=
            SVG_CODE_POINTS[atom.svgAbove] ||
            toMathML(overscript, 0, 0, options).mathML;
          result += '</mover>';
        } else if (atom.svgBelow || underscript) {
          result +=
            `<munder ${variant} ${makeID(atom.id, options)}>` +
            (SVG_CODE_POINTS[atom.svgBody] ||
              toMathML(body, 0, 0, options).mathML);
          result +=
            SVG_CODE_POINTS[atom.svgBelow] ||
            toMathML(underscript, 0, 0, options).mathML;
          result += '</munder>';
        }

        break;

      case 'placeholder': // No real equivalent in MathML -- will generate a '?'qq
      case 'mord': {
        result =
          SPECIAL_IDENTIFIERS[command] ||
          command ||
          (typeof atom.value === 'string' ? atom.value : '');
        const m = command
          ? command.match(/{?\\char"([\dabcdefABCDEF]*)}?/)
          : null;
        if (m) {
          // It's a \char command
          result = '&#x' + m[1] + ';';
        } else if (result.length > 0 && result.startsWith('\\')) {
          // This is an identifier with no special handling. Use the
          // Unicode value
          if (
            typeof atom.value === 'string' &&
            atom.value.charCodeAt(0) > 255
          ) {
            result =
              '&#x' +
              ('000000' + atom.value.charCodeAt(0).toString(16)).slice(-4) +
              ';';
          } else if (typeof atom.value === 'string') {
            result = atom.value.charAt(0);
          } else {
            console.log('Did not expect this');
            result = '';
          }
        }

        const tag = /\d/.test(result) ? 'mn' : 'mi';
        result =
          '<' +
          tag +
          variant +
          makeID(atom.id, options) +
          '>' +
          xmlEscape(result) +
          '</' +
          tag +
          '>';
        break;
      }

      case 'mbin':
      case 'mrel':
      case 'minner':
        if (command && SPECIAL_IDENTIFIERS[command]) {
          // Some 'textord' are actually identifiers. Check them here.
          result =
            '<mi' +
            makeID(atom.id, options) +
            '>' +
            SPECIAL_IDENTIFIERS[command] +
            '</mi>';
        } else if (command && SPECIAL_OPERATORS[command]) {
          result =
            '<mo' +
            makeID(atom.id, options) +
            '>' +
            SPECIAL_OPERATORS[command] +
            '</mo>';
        } else {
          result = toMo(atom, options);
        }

        break;

      case 'mpunct':
        result =
          '<mo separator="true"' +
          makeID(atom.id, options) +
          '>' +
          (SPECIAL_OPERATORS[command] || command) +
          '</mo>';
        break;

      case 'mop':
        if (atom.body !== '\u200B') {
          // Not ZERO-WIDTH
          result = '<mo' + makeID(atom.id, options) + '>';
          result +=
            command === '\\operatorname' ? atom.body : command || atom.body;
          result += '</mo>';
        }

        break;

      // Case 'mathstyle':
      // TODO: mathstyle is a switch. Need to figure out its scope to properly wrap it around a <mstyle> tag
      // if (atom.mathstyle === 'displaystyle') {
      //     result += '<mstyle displaystyle="true">';
      //     result += '</mstyle>';
      // } else {
      //     result += '<mstyle displaystyle="false">';
      //     result += '</mstyle>';
      // };
      // break;

      case 'box':
        result = '<menclose notation="box"';
        if (atom.backgroundcolor) {
          result +=
            ' mathbackground="' + stringToColor(atom.backgroundcolor) + '"';
        }

        result +=
          makeID(atom.id, options) +
          '>' +
          toMathML(atom.body, 0, 0, options).mathML +
          '</menclose>';
        break;

      case 'spacing':
        result += '<mspace width="' + (SPACING[command] || 0) + 'em"/>';
        break;

      case 'enclose':
        result = '<menclose notation="';
        for (const notation in atom.notation) {
          if (
            Object.prototype.hasOwnProperty.call(atom.notation, notation) &&
            atom.notation[notation]
          ) {
            result += sep + notation;
            sep = ' ';
          }
        }

        result +=
          makeID(atom.id, options) +
          '">' +
          toMathML(atom.body, 0, 0, options).mathML +
          '</menclose>';
        break;

      case 'space':
        result += '&nbsp;';
        break;

      case 'msubsup':
        break;

      case 'phantom':
        break;
      case 'composition':
        break;
      default:
        console.log('In conversion to MathML, unknown type : ' + atom.type);
    }
  }

  return result;
}

export function atomsToMathML(
  atoms: Atom | Atom[],
  options: Partial<MathfieldOptions>
): string {
  return toMathML(atoms, 0, 0, options).mathML;
}
