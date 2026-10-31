import { Atom, makeScripts, scriptsToLatex } from '../core/atom-class';
import { Box } from '../core/box';
import { Context } from '../core/context';
import { joinLatex, latexCommand } from '../core/tokenizer';
import type {
  AtomJson,
  CreateAtomOptions,
  ToLatexOptions,
} from '../core/types';
import { ExtensibleSymbolAtom } from './extensible-symbol';

/**
 * Scripts at the corners of a large operator, which keeps its limits:
 * `\sideset{_a^b}{_c^d}\sum_{i=1}^n` (amsmath).
 *
 * - `above`, `below`: the superscript and subscript before the operator
 * - `body`: the operator. Its own superscript and subscript are the scripts
 *   after it, always beside it, never limits.
 * - `superscript`, `subscript`: the limits, placed as the operator's would
 *   be (over and under it in display style).
 *
 * As in amsmath, the scripts before the operator are placed for the height
 * and depth of the operator alone.
 */
export class SidesetAtom extends Atom {
  constructor(
    options: CreateAtomOptions & {
      above?: readonly Atom[];
      below?: readonly Atom[];
      body?: readonly Atom[];
    }
  ) {
    super({ ...options, type: 'sideset', body: options.body ?? [] });
    if (options.above) this.above = options.above;
    if (options.below) this.below = options.below;
    // The scripts that follow `\sideset{}{}\sum` are its limits
    this.subsupPlacement = 'auto';
  }

  static fromJson(json: AtomJson): SidesetAtom {
    return new SidesetAtom(json as any);
  }

  /** The operator: the last atom of the body */
  get operator(): Atom | undefined {
    const body = this.body?.filter((x) => x.type !== 'first') ?? [];
    return body[body.length - 1];
  }

  /**
   * The keyboard visits the scripts as they are drawn: before the operator
   * (the subscript first, as `_a^b` is written and as NAMED_BRANCHES orders
   * scripts), the operator and the scripts after it, then the limits.
   */
  get children(): readonly Atom[] {
    if (this._children) return this._children;
    const result: Atom[] = [];
    for (const branch of [
      'below',
      'above',
      'body',
      'subscript',
      'superscript',
    ] as const) {
      for (const x of this.branch(branch) ?? []) {
        result.push(...x.children);
        result.push(x);
      }
    }
    this._children = result;
    return result;
  }

  render(context: Context): Box | null {
    const body =
      Atom.createBox(context, this.body, { type: 'ignore' }) ??
      new Box(null, { type: 'ignore' });

    // The scripts before the operator are placed as its own scripts after it
    // are: by the symbol alone.
    const operator = this.operator;
    const symbol =
      operator instanceof ExtensibleSymbolAtom
        ? operator.symbolBox(new Context({ parent: context, isPhantom: true }))
        : { base: body, baseShift: 0, slant: 0 };
    const scripts = makeScripts(context, {
      base: symbol.base,
      superscript: this.above,
      subscript: this.below,
      isCharacterBox: false,
      align: 'right',
    });

    let result = new Box(
      scripts ? [new Box(scripts, { classes: 'ML__msubsup' }), body] : [body],
      { type: 'op' }
    );

    if (this.superscript || this.subscript) {
      let limits = this.subsupPlacement ?? 'auto';
      if (limits === 'auto' && context.isDisplayStyle) limits = 'over-under';
      result =
        limits === 'over-under'
          ? this.attachLimits(context, {
              base: result,
              baseShift: symbol.baseShift,
              slant: symbol.slant,
            })
          : this.attachSupsub(context, { base: result });
    }

    return new Box(this.bind(context, result), {
      type: 'op',
      caret: this.caret,
      isSelected: this.isSelected,
      classes: 'ML__op-group',
    }).wrap(context);
  }

  _serialize(options: ToLatexOptions): string {
    if (
      !(
        options.expandMacro ||
        options.skipStyles ||
        options.skipPlaceholders
      ) &&
      typeof this.verbatimLatex === 'string'
    )
      return this.verbatimLatex;

    // The operator is written without the scripts after it, which are the
    // second argument
    const operator = this.operator;
    const body = this.body?.filter((x) => x.type !== 'first') ?? [];
    const base = joinLatex([
      Atom.serialize(body.slice(0, -1), options),
      operator ? serializeWithoutScripts(operator, options) : '',
    ]);

    const result = [
      latexCommand(
        this.command,
        scriptsToLatex(present(this.below), present(this.above), options),
        operator
          ? scriptsToLatex(
              present(operator.subscript),
              present(operator.superscript),
              options
            )
          : ''
      ),
      body.length === 1 && /^\\[a-zA-Z]+$/.test(base) ? base : `{${base}}`,
    ];

    if (this.explicitSubsupPlacement) {
      if (this.subsupPlacement === 'over-under') result.push('\\limits');
      if (this.subsupPlacement === 'adjacent') result.push('\\nolimits');
      if (this.subsupPlacement === 'auto') result.push('\\displaylimits');
    }

    result.push(this.supsubToLatex(options));
    return joinLatex(result);
  }
}

/** A script emptied in the editor is no script */
function present(
  atoms: readonly Atom[] | undefined
): readonly Atom[] | undefined {
  return atoms?.some((x) => x.type !== 'first') ? atoms : undefined;
}

function serializeWithoutScripts(atom: Atom, options: ToLatexOptions): string {
  if (atom.body && atom.command)
    return latexCommand(atom.command, atom.bodyToLatex(options));
  if (atom.body) return atom.bodyToLatex(options);
  return atom.command || atom.value || '';
}
