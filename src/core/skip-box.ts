import { Box } from './box';

export class SkipBox extends Box {
  constructor(width: number) {
    super(null, { type: 'skip' });
    this._width = width;
  }
  toMarkup(): string {
    return `<span style="display:inline-block;width:${
      Math.ceil(this.width * 100) / 100
    }em"></span>`;
  }
}

export function addSkipBefore(box: Box, width: number): void {
  if (!box.parent) return;

  const siblings = box.parent.children!;
  const i = siblings.indexOf(box);

  // If box is the first non-ignore box of its parent,
  // it is a candidate to have the skip box lifted up
  let j = i - 1;
  while (j >= 0) {
    if (siblings[j].type === 'ignore') j -= 1;
    else break;
  }

  if (j < 0 && box.parent.parent && box.parent.type === 'lift') {
    addSkipBefore(box.parent, width);
    return;
  }

  // If there's a skip box to our left, merge
  if (i > 0 && siblings[i - 1].type === 'skip') siblings[i - 1].width += width;
  else siblings.splice(i, 0, new SkipBox(width));
}
