import { Variant, VariantStyle } from '../public/core-types';

/**
 * Map some unicode characters to their LaTeX equivalent
 */

// prettier-ignore
export const UNICODE_TO_LATEX: Record<number, string> = {
  0x003c: '\\lt',
  0x003e: '\\gt',
  0x006f: 'o', // Also \omicron
  0x0026: '\\&', // Also \And
  0x007b: '\\lbrace',
  0x007d: '\\rbrace',
  0x005b: '\\lbrack',
  0x005d: '\\rbrack',
  0x003a: '\\colon', // Also :

  0x00a0: '~', // Also \space
  0x00ac: '\\neg', // Also \lnot

  0x00b7: '\\cdot',
  0x00bc: '\\frac{1}{4}',
  0x00bd: '\\frac{1}{2}',
  0x00be: '\\frac{3}{4}',
  0x2070: '^{0}',
  0x2071: '^{i}',
  0x00b9: '^{1}',
  0x00b2: '^{2}', // ²
  0x00b3: '^{3}',

  0x2020: '\\dagger', // Also \dag
  0x2021: '\\ddagger', // Also \ddag
  0x2026: '\\ldots', // Also \mathellipsis

  0x2074: '^{4}',
  0x2075: '^{5}',
  0x2076: '^{6}',
  0x2077: '^{7}',
  0x2078: '^{8}',
  0x2079: '^{9}',
  0x207a: '^{+}',
  0x207b: '^{-}',
  0x207c: '^{=}',
  0x207f: '^{n}',
  0x2080: '_{0}',
  0x2081: '_{1}',
  0x2082: '_{2}',
  0x2083: '_{3}',
  0x2084: '_{4}',
  0x2085: '_{5}',
  0x2086: '_{6}',
  0x2087: '_{7}',
  0x2088: '_{8}',
  0x2089: '_{9}',
  0x208a: '_{+}',
  0x208b: '_{-}',
  0x208c: '_{=}',
  0x2090: '_{a}',
  0x2091: '_{e}',
  0x2092: '_{o}',
  0x2093: '_{x}',

  0x2032: '\\prime',
  0x0027: '\\prime',

  0x2190: '\\gets', // Also \leftarrow
  0x2192: '\\to', // Also \rightarrow

  0x25b3: '\\triangle', // Also \bigtriangleup, \vartriangle
  0x25bd: '\\triangledown',

  0x220b: '\\owns', // Also \ni
  0x2217: '\\ast', // Also *
  0x2223: '\\vert', // Also |, \mvert, \lvert, \rvert
  0x2225: '\\Vert', // Also \parallel \shortparallel

  0x2227: '\\land', // Also \wedge
  0x2228: '\\lor', // Also \vee

  0x22c5: '\\cdot', // Also \centerdot, \cdotp
  0x22c8: '\\bowtie', // Also \Joint

  0x2260: '\\ne', // Also \neq
  0x2264: '\\le', // Also \leq
  0x2265: '\\ge', // Also \geq
  0x22a5: '\\bot', // Also \perp

  0x27f7: '\\biconditional', // Also \longleftrightarrow
  0x27f8: '\\impliedby', // Also \Longleftarrow
  0x27f9: '\\implies', // Also \Longrightarrow
  0x27fa: '\\iff',

  0x2102: '\\mathbb{C}',
  0x2115: '\\mathbb{N}',
  0x2119: '\\mathbb{P}',
  0x211a: '\\mathbb{Q}',
  0x211d: '\\mathbb{R}',
  0x2124: '\\mathbb{Z}',
  0x210d: '\\mathbb{H}',

  0x211c: '\\Re',
  0x2111: '\\Im',
  0x002a: '\\ast',

  0x2b1c: '\\square',
  0x25a1: '\\square',
  0x2210: '\\coprod',
  0x220c: '\\not\\ni',
  0x25c7: '\\diamond',
  0x228e: '\\uplus',
  0x2293: '\\sqcap',
  0x2294: '\\sqcup',
  0x2240: '\\wr',
  0x222e: '\\oint',
  0x2022: '\\textbullet',
  0x2212: '-',

  0x03d2: '\\Upsilon',
};

/**
 * Some symbols in the MATHEMATICAL ALPHANUMERICAL SYMBOLS block
 * had been previously defined in other blocks. Remap them
 */
const MATH_LETTER_EXCEPTIONS = {
  0x1d455: 0x0210e,
  0x1d49d: 0x0212c,
  0x1d4a0: 0x02130,
  0x1d4a1: 0x02131,
  0x1d4a3: 0x0210b,
  0x1d4a4: 0x02110,
  0x1d4a7: 0x02112,
  0x1d4a8: 0x02133,
  0x1d4ad: 0x0211b,
  0x1d4ba: 0x0212f,
  0x1d4bc: 0x0210a,
  0x1d4c4: 0x02134,
  0x1d506: 0x0212d,
  0x1d50b: 0x0210c,
  0x1d50c: 0x02111,
  0x1d515: 0x0211c,
  0x1d51d: 0x02128,
  0x1d53a: 0x02102,
  0x1d53f: 0x0210d,
  0x1d545: 0x02115,
  0x1d547: 0x02119,
  0x1d548: 0x0211a,
  0x1d549: 0x0211d,
  0x1d551: 0x02124,
};

const MATH_UNICODE_BLOCKS: {
  start: number;
  len: number;
  offset: number;
  style?: VariantStyle;
  variant?: Variant;
}[] = [
  { start: 0x1d400, len: 26, offset: 65, style: 'bold' },
  { start: 0x1d41a, len: 26, offset: 97, style: 'bold' },
  { start: 0x1d434, len: 26, offset: 65, style: 'italic' },
  { start: 0x1d44e, len: 26, offset: 97, style: 'italic' },
  { start: 0x1d468, len: 26, offset: 65, style: 'bolditalic' },
  { start: 0x1d482, len: 26, offset: 97, style: 'bolditalic' },

  { start: 0x1d49c, len: 26, offset: 65, variant: 'script' },
  { start: 0x1d4b6, len: 26, offset: 97, variant: 'script' },
  { start: 0x1d4d0, len: 26, offset: 65, variant: 'script', style: 'bold' },
  { start: 0x1d4ea, len: 26, offset: 97, variant: 'script', style: 'bold' },

  { start: 0x1d504, len: 26, offset: 65, variant: 'fraktur' },
  { start: 0x1d51e, len: 26, offset: 97, variant: 'fraktur' },
  { start: 0x1d56c, len: 26, offset: 65, variant: 'fraktur', style: 'bold' },
  { start: 0x1d586, len: 26, offset: 97, variant: 'fraktur', style: 'bold' },

  { start: 0x1d538, len: 26, offset: 65, variant: 'double-struck' },
  { start: 0x1d552, len: 26, offset: 97, variant: 'double-struck' },

  { start: 0x1d5a0, len: 26, offset: 65, variant: 'sans-serif' },
  { start: 0x1d5ba, len: 26, offset: 97, variant: 'sans-serif' },
  {
    start: 0x1d5d4,
    len: 26,
    offset: 65,
    variant: 'sans-serif',
    style: 'bold',
  },
  {
    start: 0x1d5ee,
    len: 26,
    offset: 97,
    variant: 'sans-serif',
    style: 'bold',
  },
  {
    start: 0x1d608,
    len: 26,
    offset: 65,
    variant: 'sans-serif',
    style: 'italic',
  },
  {
    start: 0x1d622,
    len: 26,
    offset: 97,
    variant: 'sans-serif',
    style: 'italic',
  },
  {
    start: 0x1d63c,
    len: 26,
    offset: 65,
    variant: 'sans-serif',
    style: 'bolditalic',
  },
  {
    start: 0x1d656,
    len: 26,
    offset: 97,
    variant: 'sans-serif',
    style: 'bolditalic',
  },

  { start: 0x1d670, len: 26, offset: 65, variant: 'monospace' },
  { start: 0x1d68a, len: 26, offset: 97, variant: 'monospace' },

  { start: 0x1d6a8, len: 25, offset: 0x391, style: 'bold' },
  { start: 0x1d6c2, len: 25, offset: 0x3b1, style: 'bold' },
  { start: 0x1d6e2, len: 25, offset: 0x391, style: 'italic' },
  { start: 0x1d6fc, len: 25, offset: 0x3b1, style: 'italic' },
  { start: 0x1d71c, len: 25, offset: 0x391, style: 'bolditalic' },
  { start: 0x1d736, len: 25, offset: 0x3b1, style: 'bolditalic' },
  {
    start: 0x1d756,
    len: 25,
    offset: 0x391,
    variant: 'sans-serif',
    style: 'bold',
  },
  {
    start: 0x1d770,
    len: 25,
    offset: 0x3b1,
    variant: 'sans-serif',
    style: 'bold',
  },
  {
    start: 0x1d790,
    len: 25,
    offset: 0x391,
    variant: 'sans-serif',
    style: 'bolditalic',
  },
  {
    start: 0x1d7aa,
    len: 25,
    offset: 0x3b1,
    variant: 'sans-serif',
    style: 'bolditalic',
  },

  { start: 0x1d7ce, len: 10, offset: 48, variant: 'main', style: 'bold' },
  { start: 0x1d7d8, len: 10, offset: 48, variant: 'double-struck' },
  { start: 0x1d7e3, len: 10, offset: 48, variant: 'sans-serif' },
  {
    start: 0x1d7ec,
    len: 10,
    offset: 48,
    variant: 'sans-serif',
    style: 'bold',
  },
  { start: 0x1d7f6, len: 10, offset: 48, variant: 'monospace' },
];

/**
 * Given a character and variant ('double-struck', 'fraktur', etc...)
 * return the corresponding unicode character (a string)
 */
export function mathVariantToUnicode(
  char: string,
  variant?: string,
  style?: string
): string {
  if (!/[A-Za-z\d]/.test(char)) return char;
  if (style === 'up') style = undefined;
  if (!variant && !style) return char;

  const codepoint = char.codePointAt(0);
  if (codepoint === undefined) return char;

  for (const MATH_UNICODE_BLOCK of MATH_UNICODE_BLOCKS) {
    if (!variant || MATH_UNICODE_BLOCK.variant === variant) {
      if (!style || MATH_UNICODE_BLOCK.style === style) {
        if (
          codepoint >= MATH_UNICODE_BLOCK.offset &&
          codepoint < MATH_UNICODE_BLOCK.offset + MATH_UNICODE_BLOCK.len
        ) {
          const result =
            MATH_UNICODE_BLOCK.start + codepoint - MATH_UNICODE_BLOCK.offset;
          return String.fromCodePoint(MATH_LETTER_EXCEPTIONS[result] || result);
        }
      }
    }
  }

  return char;
}

export function unicodeToMathVariant(codepoint: number): {
  char: string;
  variant?: Variant;
  style?: string;
} {
  if (
    (codepoint < 0x1d400 || codepoint > 0x1d7ff) &&
    (codepoint < 0x2100 || codepoint > 0x214f)
  )
    return { char: String.fromCodePoint(codepoint) };

  // Handle the 'gap' letters by converting them back into their logical range
  for (const c in MATH_LETTER_EXCEPTIONS) {
    if (MATH_LETTER_EXCEPTIONS[c] === codepoint) {
      codepoint = c.codePointAt(0) ?? 0;
      break;
    }
  }

  for (const MATH_UNICODE_BLOCK of MATH_UNICODE_BLOCKS) {
    if (
      codepoint >= MATH_UNICODE_BLOCK.start &&
      codepoint < MATH_UNICODE_BLOCK.start + MATH_UNICODE_BLOCK.len
    ) {
      return {
        char: String.fromCodePoint(
          codepoint - MATH_UNICODE_BLOCK.start + MATH_UNICODE_BLOCK.offset
        ),
        variant: MATH_UNICODE_BLOCK.variant,
        style: MATH_UNICODE_BLOCK.style,
      };
    }
  }

  return { char: String.fromCodePoint(codepoint) };
}

/**
 * Transform some Unicode characters into equivalent LaTeX commands
 */
export function unicodeToLatex(s: string): string {
  let result = '';
  for (const c of s) {
    if ("{}<>[]$&#^_%:'˜".includes(c)) {
      result += c;
      continue;
    }
    const codepoint = c.codePointAt(0) ?? 0;
    let latex = UNICODE_TO_LATEX[codepoint];
    if (latex) {
      if (latex.startsWith('\\')) result += latex + ' ';
      else result += latex;
    } else {
      const { char, variant, style } = unicodeToMathVariant(codepoint);
      latex = char;
      switch (variant) {
        case 'double-struck':
          latex = `\\mathbb{${latex}}`;
          break;
        case 'fraktur':
          latex = `\\mathfrak{${latex}}`;
          break;
        case 'script':
          latex = `\\mathscr{${latex}}`;
          break;
        case 'sans-serif':
          latex = `\\mathsf{${latex}}`;
          break;
        case 'monospace':
          latex = `\\mathtt{${latex}}`;
          break;
        case 'calligraphic':
          latex = `\\mathcal{${latex}}`;
          break;
      }

      switch (style) {
        case 'bold':
          latex = `\\mathbf{${latex}}`;
          break;
        case 'italic':
          latex = `\\mathit{${latex}}`;
          break;
        case 'bolditalic':
          latex = `\\mathbfit{${latex}}`;
          break;
      }

      result += latex;
    }
  }
  return result;
}
