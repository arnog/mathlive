import { isArray } from '../common/types';

import { Atom, NAMED_BRANCHES } from './atom-class';

import { AccentAtom } from '../atoms/accent';
import { ArrayAtom } from '../atoms/array';
import { BoxAtom } from '../atoms/box';
import { CompositionAtom } from '../atoms/composition';
import { ChemAtom } from '../latex-commands/mhchem';
import { MiddleDelimAtom } from '../atoms/delim';
import { EncloseAtom } from '../atoms/enclose';
import { ErrorAtom } from '../atoms/error';
import { GenfracAtom } from '../atoms/genfrac';
import { GroupAtom } from '../atoms/group';
import { LatexAtom, LatexGroupAtom } from '../atoms/latex';
import { LeftRightAtom } from '../atoms/leftright';
import { MacroArgumentAtom, MacroAtom } from '../atoms/macro';
import { ExtensibleSymbolAtom } from '../atoms/extensible-symbol';
import { OverlapAtom } from '../atoms/overlap';
import { OverunderAtom } from '../atoms/overunder';
import { PlaceholderAtom } from '../atoms/placeholder';
import { PhantomAtom } from '../atoms/phantom';
import { SizedDelimAtom } from '../atoms/delim';
import { SpacingAtom } from '../atoms/spacing';
import { SubsupAtom } from '../atoms/subsup';
import { SurdAtom } from '../atoms/surd';
import { TextAtom } from '../atoms/text';
import { TooltipAtom } from '../atoms/tooltip';
import { PromptAtom } from '../atoms/prompt';
import { OperatorAtom } from '../atoms/operator';
import type { Argument } from 'latex-commands/types';
import type { AtomJson, AtomType } from './types';

export * from './atom-class';

export function fromJson(json: AtomJson): Atom;
export function fromJson(json: AtomJson[]): Atom[];
export function fromJson(json: AtomJson | AtomJson[]): Atom | Atom[] {
  if (isArray<AtomJson>(json)) return json.map((x) => fromJson(x));

  if (typeof json === 'string') return Atom.fromJson(json);

  json = { ...json };

  // Restore the branches
  for (const branch of NAMED_BRANCHES)
    if (json[branch]) json[branch] = fromJson(json[branch] as AtomJson[]);

  if (json.args) json.args = argumentsFromJson(json.args);

  if (json.array) json.array = fromJson(json.array);

  const type: AtomType | undefined = json.type;
  let result: Atom | undefined = undefined;
  if (type === 'accent') result = AccentAtom.fromJson(json);
  if (type === 'array') result = ArrayAtom.fromJson(json);
  if (type === 'box') result = BoxAtom.fromJson(json);
  if (type === 'chem') result = ChemAtom.fromJson(json);
  if (type === 'composition') result = CompositionAtom.fromJson(json);
  if (type === 'delim') result = MiddleDelimAtom.fromJson(json);
  if (type === 'enclose') result = EncloseAtom.fromJson(json);
  if (type === 'error') result = ErrorAtom.fromJson(json);
  if (type === 'extensible-symbol')
    result = ExtensibleSymbolAtom.fromJson(json);
  if (type === 'genfrac') result = GenfracAtom.fromJson(json);
  if (type === 'group') result = GroupAtom.fromJson(json);
  if (type === 'latex') result = LatexAtom.fromJson(json);
  if (type === 'latexgroup') result = LatexGroupAtom.fromJson(json);
  if (type === 'leftright') result = LeftRightAtom.fromJson(json);
  if (type === 'macro') result = MacroAtom.fromJson(json);
  if (type === 'macro-argument') result = MacroArgumentAtom.fromJson(json);
  if (type === 'operator') result = OperatorAtom.fromJson(json);
  if (type === 'overlap') result = OverlapAtom.fromJson(json);
  if (type === 'overunder') result = OverunderAtom.fromJson(json);
  if (type === 'placeholder') result = PlaceholderAtom.fromJson(json);
  if (type === 'prompt') result = PromptAtom.fromJson(json);
  if (type === 'phantom') result = PhantomAtom.fromJson(json);
  if (type === 'sizeddelim') result = SizedDelimAtom.fromJson(json);
  if (type === 'spacing') result = SpacingAtom.fromJson(json);
  if (type === 'subsup') result = SubsupAtom.fromJson(json);
  if (type === 'surd') result = SurdAtom.fromJson(json);
  if (type === 'text') result = TextAtom.fromJson(json);
  if (type === 'tooltip') result = TooltipAtom.fromJson(json);

  // @todo root;
  // @todo space;

  if (!result) {
    console.assert(
      !type ||
        [
          'first',
          'mbin',
          'mrel',
          'mclose',
          'minner',
          'mop',
          'mopen',
          'mord',
          'mpunct',
          'root',
          'space',
        ].includes(type),
      `MathLive {{SDK_VERSION}}: an unexpected atom type "${type}" was encountered. Add new atom constructors to \`fromJson()\` in "atom.ts"`
    );
    result = Atom.fromJson(json);
  }

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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function argumentsFromJson(json: any[]): undefined | Argument[] {
  if (!json) return undefined;
  if (!Array.isArray(json)) return undefined;
  return json.map((arg) => {
    if (arg === '<null>') return null;
    if (typeof arg === 'object' && 'group' in arg)
      return { group: arg.group.map((x) => fromJson(x)) };
    if (typeof arg === 'object' && 'atoms' in arg)
      return arg.atoms.map((x) => fromJson(x));
    return arg;
  });
}
