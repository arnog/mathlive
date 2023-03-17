import type { GlobalContext, Style } from '../core/types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import { adjustInterAtomSpacing, Box, coalesce } from '../core/box';
import { DEFAULT_FONT_SIZE } from '../core/font-metrics';
import { fromJson } from '../core/atom';
import { defaultGlobalContext } from '../core/context-utils';

export class TooltipAtom extends Atom {
  tooltip: Atom;

  constructor(
    body: Atom[] | undefined,
    tooltip: Atom[] | undefined,
    context: GlobalContext,
    options?: {
      command?: string;
      content: 'math' | 'text';
      style?: Style;
      serialize?: (atom: TooltipAtom, options: ToLatexOptions) => string;
    }
  ) {
    super('tooltip', context, {
      command: options?.command,
      mode: 'math',
      serialize: options?.serialize,
      style: options?.style,
      displayContainsHighlight: true,
    });
    this.body = body;
    const tooltipContext = defaultGlobalContext();
    this.tooltip = new Atom('root', tooltipContext, { style: {} });
    this.tooltip.body = tooltip;

    this.skipBoundary = true;
    this.captureSelection = false;
  }

  static fromJson(json: AtomJson, context: GlobalContext): TooltipAtom {
    return new TooltipAtom(
      json.body,
      fromJson(json.tooltip as Atom[], context),
      context,
      json as any
    );
  }

  toJson(): AtomJson {
    const tooltip = this.tooltip.body
      ?.filter((x) => x.type !== 'first')
      .map((x) => x.toJson());
    return { ...super.toJson(), tooltip };
  }

  render(context: Context): Box | null {
    const body = Atom.createBox(context, this.body, {
      style: this.style,
    });
    if (!body) return null;

    const tooltipContext = new Context(
      { registers: context.registers },
      { fontSize: DEFAULT_FONT_SIZE },
      'displaystyle'
    );
    const tooltip = coalesce(
      adjustInterAtomSpacing(
        new Box(this.tooltip.render(tooltipContext), {
          classes: 'ML__tooltip-content',
        }),
        tooltipContext
      )
    );
    const box = new Box([tooltip, body], { classes: 'ML__tooltip-container' });
    if (this.caret) box.caret = this.caret;
    return this.bind(context, box);
  }

  serialize(options: ToLatexOptions): string {
    return `${this.command}{${this.bodyToLatex(options)}}{${Atom.serialize(
      this.tooltip.body,
      options
    )}}`;
  }
}
