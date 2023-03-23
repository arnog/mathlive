import { Variant, VariantStyle } from 'public/core-types';

/* Some symbols in the MATHEMATICAL ALPHANUMERICAL SYMBOLS block had
   been previously defined in other blocks. Remap them */
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
  variant: string,
  style?: string
): string {
  if (!/[A-Za-z\d]/.test(char)) return char;
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
