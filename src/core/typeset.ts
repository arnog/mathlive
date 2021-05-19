import { Registers } from '../public/core';
import { Atom } from './atom';
import { getDefaultRegisters } from './registers';

/**
 * Apply typsetting rules to a mathlist.
 *
 * The glue of math Atoms is calculated based on the type ('ord', 'rel', etc...)
 * of the atoms around them.
 *
 * TeXBook, p. 170
 *
 * > In fact, TEX’s rules for spacing in formulas are fairly simple. A formula is
 * > converted to a math list as described at the end of Chapter 17, and the math
 * > list consists chiefly of “atoms” of eight basic types: Ord (ordinary),
 * > Op (large operator), Bin (binary operation), Rel (relation), Open (opening),
 * > Close (closing), Punct (punctuation), and Inner (a delimited subformula).
 * > Other kinds of atoms, which arise from commands like \overline or
 * > \mathaccent or \vcenter, etc., are all treated as type Ord; fractions are
 * > treated as type Inner.
 *
 * > The following table is used to determine the spacing between pair of adjacent
 * > atoms.
 *
 * In this table
 * - "3" = `\thinmuskip`
 * - "4" = `\medmuskip`
 * - "5" = `\thickmuskip`
 *
 */

const INTER_ATOM_SPACING = {
  mord: { mop: 3, mbin: 4, mrel: 5, minner: 3 },
  mop: { mord: 3, mop: 3, rel: 5, minner: 3 },
  mbin: { mord: 4, mop: 4, mopen: 4, minner: 4 },
  mrel: { mord: 5, mop: 5, mopen: 5, minner: 5 },
  mclose: { mop: 3, mbin: 4, mrel: 5, minner: 3 },
  mpunct: { mord: 3, mop: 3, mrel: 3, mopen: 3, mpunct: 3, minner: 3 },
  minner: { mord: 3, mop: 3, mbin: 4, mrel: 5, mopen: 3, mpunct: 3, minner: 3 },
};

/**
 * This table is used when the mathstyle is 'tight' (scriptstyle or
 * scriptscriptstyle).
 */
const INTER_ATOM_TIGHT_SPACING = {
  mord: { mop: 3 },
  mop: { mord: 3, mop: 3 },
  mclose: { mop: 3 },
  minner: { mop: 3 },
};

function typesetRecursive(
  atoms: Atom[],
  options: { registers: Registers }
): Atom[] {
  // 1. Apply inter-atom spacing rules
  return atoms;
}

export function typeset(
  atoms: Atom[],
  options?: { registers?: Registers }
): Atom[] {
  // 1. Apply inter-atom spacing rules
  return typesetRecursive(atoms, {
    registers: options?.registers ? options.registers : getDefaultRegisters(),
  });
}
