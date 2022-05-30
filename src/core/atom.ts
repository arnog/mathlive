import { isArray } from '../common/types';

import { AccentAtom } from '../core-atoms/accent';
import { ArrayAtom } from '../core-atoms/array';
import { BoxAtom } from '../core-atoms/box';
import { CompositionAtom } from '../core-atoms/composition';
import { ChemAtom } from '../core-definitions/mhchem';
import { DelimAtom } from '../core-atoms/delim';
import { EncloseAtom } from '../core-atoms/enclose';
import { ErrorAtom } from '../core-atoms/error';
import { GenfracAtom } from '../core-atoms/genfrac';
import { GroupAtom } from '../core-atoms/group';
import { LatexAtom, LatexGroupAtom } from '../core-atoms/latex';
import { LeftRightAtom } from '../core-atoms/leftright';
import { LineAtom } from '../core-atoms/line';
import { MacroAtom } from '../core-atoms/macro';
import { OperatorAtom } from '../core-atoms/operator';
import { OverlapAtom } from '../core-atoms/overlap';
import { OverunderAtom } from '../core-atoms/overunder';
import { PlaceholderAtom } from '../core-atoms/placeholder';
import { PhantomAtom } from '../core-atoms/phantom';
import { RuleAtom } from '../core-atoms/rule';
import { SizedDelimAtom } from '../core-atoms/delim';
import { SpacingAtom } from '../core-atoms/spacing';
import { SurdAtom } from '../core-atoms/surd';
import { TextAtom } from '../core-atoms/text';

import { Atom, AtomJson, AtomType, NAMED_BRANCHES } from './atom-class';
import { SubsupAtom } from '../core-atoms/subsup';

export * from './atom-class';

export function fromJson(json: AtomJson): Atom;
export function fromJson(json: AtomJson[]): Atom[];
export function fromJson(json: AtomJson | AtomJson[]): Atom | Atom[] {
  if (isArray<AtomJson>(json)) return json.map((x) => fromJson(x));

  json = { ...json };

  // Restore the branches
  for (const branch of NAMED_BRANCHES)
    if (json[branch]) json[branch] = fromJson(json[branch] as AtomJson[]);
  if (json.array) json.array = fromJson(json.array);

  const type: AtomType = json.type;
  let result: Atom | undefined = undefined;
  if (type === 'accent') result = AccentAtom.fromJson(json);
  if (type === 'array') result = ArrayAtom.fromJson(json);
  if (type === 'box') result = BoxAtom.fromJson(json);
  if (type === 'composition') result = CompositionAtom.fromJson(json);
  if (type === 'chem') result = ChemAtom.fromJson(json);
  if (type === 'delim') result = DelimAtom.fromJson(json);
  if (type === 'enclose') result = EncloseAtom.fromJson(json);
  if (type === 'error') result = ErrorAtom.fromJson(json);
  if (type === 'genfrac') result = GenfracAtom.fromJson(json);
  if (type === 'group') result = GroupAtom.fromJson(json);
  if (type === 'latex') result = LatexAtom.fromJson(json);
  if (type === 'latexgroup') result = LatexGroupAtom.fromJson(json);
  if (type === 'leftright') result = LeftRightAtom.fromJson(json);
  if (type === 'line') result = LineAtom.fromJson(json);
  if (type === 'macro') result = MacroAtom.fromJson(json);
  if (type === 'msubsup') result = SubsupAtom.fromJson(json);
  if (type === 'overlap') result = OverlapAtom.fromJson(json);
  if (type === 'overunder') result = OverunderAtom.fromJson(json);
  if (type === 'placeholder') {
    if (json.defaultValue) json.defaultValue = fromJson(json.defaultValue);
    result = PlaceholderAtom.fromJson(json);
  }
  if (type === 'phantom') result = PhantomAtom.fromJson(json);
  if (type === 'rule') result = RuleAtom.fromJson(json);
  if (type === 'sizeddelim') result = SizedDelimAtom.fromJson(json);
  if (type === 'spacing') result = SpacingAtom.fromJson(json);
  if (type === 'surd') result = SurdAtom.fromJson(json);
  if (type === 'text') result = TextAtom.fromJson(json);

  if (type === 'mop') result = OperatorAtom.fromJson(json);

  // @todo root;
  // @todo space;

  if (!result) result = Atom.fromJson(json);

  for (const branch of NAMED_BRANCHES)
    if (json[branch]) result.setChildren(json[branch], branch);

  // Restore properties

  if (json.verbatimLatex !== undefined)
    result.verbatimLatex = json.verbatimLatex;

  if (json.subsupPlacement) result.subsupPlacement = json.subsupPlacement;
  if (json.explicitSubsupPlacement) result.explicitSubsupPlacement = true;

  if (json.isFunction) result.isFunction = true;
  if (json.isExtensibleSymbol) result.isExtensibleSymbol = true;
  if (json.skipBoundary) result.skipBoundary = true;
  if (json.captureSelection) result.captureSelection = true;

  return result;
}
