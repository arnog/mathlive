import { adjustInterAtomSpacing, Box, BoxOptions, makeStruts } from './box';
import MathfieldElement from '../public/mathfield-element';
import { MathfieldPrivate } from 'editor/mathfield';
import { Context } from './context';
import { DEFAULT_FONT_SIZE } from './font-metrics';
// import { MathfieldPrivate } from '../editor-mathfield/mathfield-private';
// import { Context } from './context';
// import { DEFAULT_FONT_SIZE } from './font-metrics';

function makeBox(mathfield: MathfieldPrivate) {
  const base = mathfield.model.root.render(
    new Context(
      {
        registers: mathfield.registers,
      },
      {
        fontSize: DEFAULT_FONT_SIZE,
        letterShapeStyle: mathfield.options.letterShapeStyle,
      },
      mathfield.options.defaultMode === 'inline-math'
        ? 'textstyle'
        : 'displaystyle'
    )
  )!;

  //
  // 3. Construct struts around the boxes
  //
  const wrapper = makeStruts(
    adjustInterAtomSpacing(base, mathfield.options.horizontalSpacingScale),
    {
      classes: 'ML__mathlive',
      attributes: {
        // Sometimes Google Translate kicks in an attempts to 'translate' math
        // This doesn't work very well, so turn off translate
        'translate': 'no',
        // Hint to screen readers to not attempt to read this <span>.
        // They should use instead the 'aria-label' attribute.
        'aria-hidden': 'true',
      },
    }
  );
  return wrapper;
}

export class MathfieldBox extends Box {
  mathfield: MathfieldElement;
  element: MathfieldElement; // x

  constructor(
    placeholderId: string,
    mathfield: MathfieldElement,
    options?: BoxOptions
  ) {
    super(null, options);
    this.mathfield = mathfield;
    this.htmlData = `placeholder-id="${placeholderId}" `;

    const box = makeBox(mathfield['_mathfield']!);
    this.height = box.height;
    this.depth = box.depth;

    // this.height =
    //   element.style.fontSize === ''
    //     ? 1
    //     : (element.clientHeight / parseInt(element.style.fontSize)) * 0.6;
  }
  toMarkup(): string {
    const props: string[] = [];
    const classes = this.classes.split(' ');
    const classList =
      classes.length === 1
        ? classes[0]
        : classes
            .filter((x, e, a) => x.length > 0 && a.indexOf(x) === e)
            .join(' ');

    if (this.cssId) {
      // A (HTML5) CSS id may not contain a space
      props.push(`id="${this.cssId.replace(/ /g, '-')}"`);
    }

    if (this.htmlData) {
      const entries = this.htmlData.split(',');
      for (const entry of entries) {
        const matched = entry.match(/([^=]+)=(.+$)/);
        if (matched) {
          const key = matched[1].trim().replace(/ /g, '-');
          if (key) props.push(`data-${key}=${matched[2]}`);
        } else {
          const key = entry.trim().replace(/ /g, '-');
          if (key) props.push(`data-${key}`);
        }
      }
    }

    if (this.htmlStyle) {
      const entries = this.htmlStyle.split(';');
      let styleString = '';
      for (const entry of entries) {
        const matched = entry.match(/([^=]+):(.+$)/);
        if (matched) {
          const key = matched[1].trim().replace(/ /g, '-');
          if (key) styleString += `${key}:${matched[2]};`;
        }
      }
      if (styleString) props.push(`style="${styleString}"`);
    }

    if (this.attributes) {
      props.push(
        ...Object.keys(this.attributes).map(
          (x) => `${x}="${this.attributes![x]}"`
        )
      );
    }

    if (classList.length > 0) props.push(`class="${classList}"`);

    const element = this.mathfield;
    props.push(
      `style="display:inline-block; width:${element.clientWidth}px; height:${element.clientHeight}px;" `
    );

    return `<span ${props.join(' ')}></span>`;
  }
}
