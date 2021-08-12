import { Box, BoxOptions } from './box';
import MathfieldElement from '../public/mathfield-element';

export class MathfieldBox extends Box {
  placeholderId: string;
  element: MathfieldElement;
  constructor(
    placeholderId: string,
    element: MathfieldElement,
    options?: BoxOptions
  ) {
    super(null, options);
    this.placeholderId = placeholderId;
    this.element = element;
    this.htmlData = `placeholder-id=${placeholderId}`;
  }
  toMarkup(): string {
    let props = '';
    const classes = this.classes.split(' ');
    const classList =
      classes.length === 1
        ? classes[0]
        : classes
            .filter((x, e, a) => x.length > 0 && a.indexOf(x) === e)
            .join(' ');

    if (this.cssId) {
      // A (HTML5) CSS id may not contain a space
      props += ` id=${this.cssId.replace(/ /g, '-')} `;
    }

    if (this.htmlData) {
      const entries = this.htmlData.split(',');
      for (const entry of entries) {
        const matched = entry.match(/([^=]+)=(.+$)/);
        if (matched) {
          const key = matched[1].trim().replace(/ /g, '-');
          if (key) {
            props += ` data-${key}=${matched[2]} `;
          }
        } else {
          const key = entry.trim().replace(/ /g, '-');
          if (key) {
            props += ` data-${key} `;
          }
        }
      }
    }

    if (this.attributes) {
      props +=
        ' ' +
        Object.keys(this.attributes)
          .map((x) => `${x}="${this.attributes![x]}"`)
          .join(' ');
    }

    if (classList.length > 0) {
      props += ` class="${classList}"`;
    }

    if (this.cssProperties) {
      const styleString = Object.keys(this.cssProperties)
        .map((x) => `${x}:${this.cssProperties[x]}`)
        .join(';');

      if (styleString.length > 0) {
        props += ` style="${styleString}"`;
      }
    }

    console.log(props);
    return `<span ${props}></span>`;
  }
}
