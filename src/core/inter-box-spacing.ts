import { Box } from './box';
import { Context } from './context';
import { addSkipBefore } from './skip-box';

/*
 * See http://www.tug.org/TUGboat/tb30-3/tb96vieth.pdf for
 * typesetting conventions for mathematical physics (units, etc...)
 */

/**
 *
 * Extract from the TeXBook:
 *
 * > In fact, TEX’s rules for spacing in formulas are fairly simple. A
 * > formula is converted to a math list as described at the end of Chapter 17,
 * > and the math list consists chiefly of “atoms” of eight basic types:
 * > Ord (ordinary), Op (large operator), Bin (binary operation),
 * > Rel (relation), Open (opening), Close (closing), Punct (punctuation),
 * > and Inner (a delimited subformula).
 * > Other kinds of atoms, which arise from commands like \overline or
 * > \mathaccent or \vcenter, etc., are all treated as type Ord; fractions are
 * > treated as type Inner.
 *
 * > The following table is used to determine the spacing between pair of
 * > adjacent atoms.
 *                                                          -- TeXBook, p. 170
 *
 * @todo
 * > If the math list turns out to be simply a single Ord atom
 * > without subscripts or superscripts, or an Acc whose nucleus
 * > is an Ord, the enclosing braces are effectively removed.
 * -- TeXBook, p. 290
 *
 * Superscript and subscript are considered part of the atom
 * they're attached to, and don't affect its type.
 *
 * In this table
 * - "3" = `\thinmuskip`
 * - "4" = `\medmuskip`
 * - "5" = `\thickmuskip`
 *
 */

const INTER_BOX_SPACING = {
  ord: { op: 3, bin: 4, rel: 5, inner: 3 },
  op: { ord: 3, op: 3, rel: 5, inner: 3 },
  bin: { ord: 4, op: 4, open: 4, inner: 4 },
  rel: { ord: 5, op: 5, open: 5, inner: 5 },
  close: { op: 3, bin: 4, rel: 5, inner: 3 },
  punct: { ord: 3, op: 3, rel: 3, open: 3, punct: 3, inner: 3 },
  inner: { ord: 3, op: 3, bin: 4, rel: 5, open: 3, punct: 3, inner: 3 },
};

/**
 * This table is used when the mathstyle is 'tight' (scriptstyle or
 * scriptscriptstyle).
 */
const INTER_BOX_TIGHT_SPACING = {
  ord: { op: 3 },
  op: { ord: 3, op: 3 },
  close: { op: 3 },
  inner: { op: 3 },
};

/**
 *  Handle proper spacing of, e.g. "-4" vs "1-4", by adjusting some box type
 */
function adjustType(boxes: Box[]): void {
  traverseBoxes(boxes, (prev, cur) => {
    // > 5. If the current item is a Bin atom, and if this was the first atom
    // >   in the list, or if the most recent previous atom was Bin, Op, Rel,
    // >   Open, or Punct, change the current Bin to Ord and continue with
    // >   Rule 14.
    // >   Otherwise continue with Rule 17.
    //                                                    -- TexBook p. 442
    if (
      cur.type === 'bin' &&
      (!prev || /^(middle|bin|op|rel|open|punct)$/.test(prev.type))
    )
      cur.type = 'ord';

    // > 6. If the current item is a Rel or Close or Punct atom, and if the
    // >    most recent previous atom was Bin, change that previous Bin to Ord.
    // >    Continue with Rule 17.
    if (prev?.type === 'bin' && /^(rel|close|punct)$/.test(cur.type))
      prev.type = 'ord';

    if (cur.type !== 'ignore') prev = cur;
  });
}

//
// Adjust the atom(/box) types according to the TeX rules and the corresponding
// spacing
//
export function applyInterBoxSpacing(root: Box, context: Context): Box {
  if (!root.children) return root;

  const boxes = root.children;
  adjustType(boxes);

  const thin = context.getRegisterAsEm('thinmuskip');
  const med = context.getRegisterAsEm('medmuskip');
  const thick = context.getRegisterAsEm('thickmuskip');

  traverseBoxes(boxes, (prev, cur) => {
    // console.log(prev?.value, prev?.type, cur.value, cur.type);
    if (!prev) return;
    const prevType = prev.type;
    const table = cur.isTight
      ? INTER_BOX_TIGHT_SPACING[prevType] ?? null
      : INTER_BOX_SPACING[prevType] ?? null;
    const hskip = table?.[cur.type] ?? null;
    if (hskip === 3) addSkipBefore(cur, thin);
    if (hskip === 4) addSkipBefore(cur, med);
    if (hskip === 5) addSkipBefore(cur, thick);
  });

  return root;
}

function traverseBoxes(
  boxes: undefined | Box[],
  f: (prev: Box | undefined, cur: Box) => void,
  prev: Box | undefined = undefined
): Box | undefined {
  if (!boxes) return undefined;
  for (const cur of boxes) {
    if (cur.type === 'lift') prev = traverseBoxes(cur.children!, f, prev);
    else if (cur.type === 'ignore') traverseBoxes(cur.children!, f);
    else {
      f(prev, cur);
      if (cur.children) traverseBoxes(cur.children, f);
      prev = cur;
    }
  }
  return prev;
}
