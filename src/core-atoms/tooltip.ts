import type { Style } from '../public/core-types';

import { Atom, AtomJson, ToLatexOptions } from '../core/atom-class';
import { Context } from '../core/context';
import { Box, coalesce } from '../core/box';
import { DEFAULT_FONT_SIZE } from '../core/font-metrics';
import { fromJson } from '../core/atom';
import { latexCommand } from '../core/tokenizer';
import { applyInterBoxSpacing } from '../core/inter-box-spacing';

export class TooltipAtom extends Atom {
  tooltip: Atom;

  constructor(
    body: Atom[] | undefined,
    tooltip: Atom[] | undefined,
    options?: {
      command?: string;
      content: 'math' | 'text';
      style?: Style;
      serialize?: (atom: TooltipAtom, options: ToLatexOptions) => string;
    }
  ) {
    super('tooltip', {
      command: options?.command,
      mode: 'math',
      serialize: options?.serialize,
      style: options?.style,
      displayContainsHighlight: true,
    });
    this.body = body;
    this.tooltip = new Atom('root', { style: {} });
    this.tooltip.body = tooltip;

    this.skipBoundary = true;
    this.captureSelection = false;
  }

  static fromJson(json: AtomJson): TooltipAtom {
    return new TooltipAtom(
      json.body,
      fromJson(json.tooltip as AtomJson[]),
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
    const body = Atom.createBox(new Context(), this.body, {
      style: this.style,
    });
    if (!body) return null;

    const tooltipContext = new Context(
      { parent: context, mathstyle: 'displaystyle' },
      { fontSize: DEFAULT_FONT_SIZE }
    );
    const tooltip = coalesce(
      applyInterBoxSpacing(
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
    return latexCommand(
      this.command,
      this.bodyToLatex(options),
      Atom.serialize(this.tooltip.body, options)
    );
  }
}
