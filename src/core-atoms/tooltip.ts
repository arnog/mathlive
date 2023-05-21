import { Atom, AtomJson, CreateAtomOptions } from '../core/atom-class';
import { Context } from '../core/context';
import { Box, coalesce } from '../core/box';
import { DEFAULT_FONT_SIZE } from '../core/font-metrics';
import { fromJson } from '../core/atom';
import { applyInterBoxSpacing } from '../core/inter-box-spacing';
import { Argument } from 'core-definitions/definitions-utils';

export class TooltipAtom extends Atom {
  tooltip: Atom;

  constructor(
    options: CreateAtomOptions<[Argument | null, Argument | null]> & {
      content: 'math' | 'text';
      body: Atom[] | undefined;
      tooltip: Atom[] | undefined;
    }
  ) {
    super({
      type: 'tooltip',
      command: options.command,
      mode: options.mode,
      style: options.style,
      body: options.body,
      displayContainsHighlight: true,
    });
    this.tooltip = new Atom({
      type: 'root',
      mode: options.content,
      body: options.tooltip,
      style: {},
    });

    this.skipBoundary = true;
    this.captureSelection = false;
  }

  static fromJson(json: AtomJson): TooltipAtom {
    return new TooltipAtom({
      ...(json as any),
      tooltip: fromJson(json.tooltip as AtomJson[]),
    });
  }

  toJson(): AtomJson {
    const tooltip = this.tooltip.body
      ?.filter((x) => x.type !== 'first')
      .map((x) => x.toJson());
    return { ...super.toJson(), tooltip };
  }

  render(context: Context): Box | null {
    const body = Atom.createBox(new Context(), this.body);
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
}
