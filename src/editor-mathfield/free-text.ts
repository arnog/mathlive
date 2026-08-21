import { ArrayAtom } from '../atoms/array';
import { TextAtom } from '../atoms/text';
import { splitGraphemes } from '../core/grapheme-splitter';
import { parseLatex } from '../core/parser';
import { getDefinition } from '../latex-commands/definitions-utils';
import type { Atom } from '../core/atom-class';
import type { ContextInterface } from '../core/types';
import type { Style } from '../public/core-types';

// TeX parsing normally treats a tab as collapsible whitespace. Keep a
// private marker through the parser when rehydrating a serialized free-text
// lines root, then restore it to a real text atom.
const FREE_TEXT_TAB_MARKER = '\uE000';

/** Create the root used by the free-text editor. */
export function makeFreeTextRoot(
  lines: readonly (readonly Atom[])[]
): ArrayAtom {
  return makeFreeLinesRoot(lines, 'free-text');
}

/** Create a multiline root whose ordinary input is interpreted as math. */
export function makeFreeMathRoot(
  lines: readonly (readonly Atom[])[]
): ArrayAtom {
  return makeFreeLinesRoot(lines, 'free-math');
}

function makeFreeLinesRoot(
  lines: readonly (readonly Atom[])[],
  mode: 'free-text' | 'free-math'
): ArrayAtom {
  return markFreeTextAnchors(
    new ArrayAtom(
      'lines',
      lines.map((line) => [[...line]]),
      [],
      {
        leftDelim: '.',
        rightDelim: '.',
        columns: [{ align: 'l' }],
        isRoot: true,
        minColumns: 1,
        maxColumns: 1,
        minRows: 1,
      }
    ),
    mode
  );
}

/** Mark row anchors as free-text so moving the caret across an empty row does
 * not implicitly switch the editor back to math mode. */
export function markFreeTextAnchors(
  root: ArrayAtom,
  mode: 'free-text' | 'free-math' = 'free-text'
): ArrayAtom {
  for (const row of root.rows)
    for (const cell of row)
      if (cell?.[0]?.type === 'first') cell[0].mode = mode;
  return root;
}

export function isFreeLinesRoot(root: Atom): root is ArrayAtom {
  return (
    root instanceof ArrayAtom &&
    root.environmentName === 'lines' &&
    root.isRoot
  );
}

export function isFreeTextRoot(root: Atom): root is ArrayAtom {
  return isFreeLinesRoot(root) && freeLinesMode(root) === 'free-text';
}

export function isFreeMathRoot(root: Atom): root is ArrayAtom {
  return isFreeLinesRoot(root) && freeLinesMode(root) === 'free-math';
}

function freeLinesMode(root: ArrayAtom): 'free-text' | 'free-math' | undefined {
  const mode = root.rows[0]?.[0]?.[0]?.mode;
  return mode === 'free-text' || mode === 'free-math' ? mode : undefined;
}

/** Turn pasted plain text into atoms without losing tabs or other whitespace. */
export function makeFreeTextAtoms(text: string, style: Style = {}): TextAtom[] {
  const graphemes = splitGraphemes(text);
  const result: TextAtom[] = [];
  for (const grapheme of typeof graphemes === 'string' ? [...graphemes] : graphemes)
    result.push(new TextAtom(grapheme, grapheme, style));
  return result;
}

/**
 * Parse a free-text value. Ordinary characters remain text atoms, while
 * explicit LaTeX commands and `$...$` regions become math atoms.
 * Newlines are returned as separate rows so empty and trailing lines survive.
 */
export function parseFreeText(
  value: string,
  context: ContextInterface,
  style: Style = {}
): Atom[][] {
  return value.split(/\r\n|\n|\r/).map((line) =>
    parseFreeTextLine(line, context, style)
  );
}

/** Parse a serialized free-text value, preserving an existing `lines` root. */
export function parseFreeTextValue(
  value: string,
  context: ContextInterface
): ArrayAtom {
  if (
    /\\displaylines|\\begin\{(?:lines|gathered|gather)\}|\$\$|\\(?:\(|\[)/.test(
      value
    )
  ) {
    const atoms = parseLatex(value.split('\t').join(FREE_TEXT_TAB_MARKER), {
      context,
    });
    if (atoms.length === 1 && isFreeLinesRoot(atoms[0])) {
      restoreFreeTextTabs(atoms[0]);
      return markFreeTextAnchors(atoms[0]);
    }
  }

  return makeFreeTextRoot(parseFreeText(value, context));
}

/** Parse a serialized free-math value, preserving line breaks and tabs. */
export function parseFreeMathValue(
  value: string,
  context: ContextInterface
): ArrayAtom {
  if (/\\displaylines|\\begin\{(?:lines|gathered|gather)\}/.test(value)) {
    const atoms = parseLatex(value, { context, parseMode: 'math' });
    if (atoms.length === 1 && isFreeLinesRoot(atoms[0]))
      return markFreeTextAnchors(atoms[0], 'free-math');
  }

  return makeFreeMathRoot(parseFreeMath(value, context));
}

/** Parse ordinary free-math input one line at a time. Spaces follow math-mode
 * rules, while tabs remain explicit indentation atoms. */
export function parseFreeMath(
  value: string,
  context: ContextInterface,
  style: Style = {}
): Atom[][] {
  return value.split(/\r\n|\n|\r/).map((line) =>
    parseFreeMathLine(line, context, style)
  );
}

function parseFreeMathLine(
  line: string,
  context: ContextInterface,
  style: Style
): Atom[] {
  const result: Atom[] = [];
  const segments = line.split('\t');
  for (let index = 0; index < segments.length; index++) {
    if (index > 0) result.push(new TextAtom('\t', '\t', style));
    if (segments[index]) {
      result.push(
        ...parseLatex(segments[index], {
          context,
          parseMode: 'math',
          style,
        })
      );
    }
  }
  return result;
}

function restoreFreeTextTabs(root: Atom): void {
  if (root instanceof TextAtom && root.value.includes(FREE_TEXT_TAB_MARKER)) {
    root.value = root.value.split(FREE_TEXT_TAB_MARKER).join('\t');
    if (root.verbatimLatex !== undefined)
      root.verbatimLatex = root.verbatimLatex.split(FREE_TEXT_TAB_MARKER).join('\t');
  }
  for (const child of root.children) restoreFreeTextTabs(child);
}

function parseFreeTextLine(
  line: string,
  context: ContextInterface,
  style: Style
): Atom[] {
  const result: Atom[] = [];
  let textStart = 0;
  let index = 0;

  const flushText = (end: number): void => {
    if (end <= textStart) return;
    result.push(...makeFreeTextAtoms(line.slice(textStart, end), style));
  };

  while (index < line.length) {
    const c = line[index];

    if (c === '$') {
      const end = line.indexOf('$', index + 1);
      if (end > index + 1) {
        const atoms = parseLatex(line.slice(index + 1, end), {
          context,
          style,
        });
        if (atoms.length > 0) {
          flushText(index);
          result.push(...atoms);
          index = end + 1;
          textStart = index;
          continue;
        }
      }
    }

    if (c === '\\') {
      const commandEnd = commandNameEnd(line, index);
      const command = line.slice(index, commandEnd);
      if (command === '\\item') {
        flushText(index);
        result.push(...makeFreeTextAtoms('\u2022 ', style));
        index = commandEnd;
        textStart = index;
        continue;
      }

      const definition = getDefinition(command, 'math');
      if (definition) {
        const end =
          definition.definitionType === 'symbol'
            ? commandEnd
            : commandWithArgumentsEnd(line, commandEnd, definition);
        if (end >= commandEnd) {
          const atoms = parseLatex(line.slice(index, end), {
            context,
            parseMode: 'math',
            style,
          });
          if (atoms.length > 0) {
            flushText(index);
            result.push(...atoms);
            index = end;
            textStart = index;
            continue;
          }
        }
      }
    }

    index += 1;
  }

  flushText(line.length);
  return result;
}

function commandNameEnd(value: string, start: number): number {
  if (start + 1 >= value.length) return value.length;
  if (/[A-Za-z*]/.test(value[start + 1])) {
    let end = start + 2;
    while (end < value.length && /[A-Za-z*]/.test(value[end])) end += 1;
    return end;
  }
  return start + 2;
}

function commandWithArgumentsEnd(
  value: string,
  start: number,
  definition: ReturnType<typeof getDefinition>
): number {
  if (!definition || definition.definitionType !== 'function') return start;

  let index = start;
  for (const parameter of definition.params) {
    while (index < value.length && /[ \t]/.test(value[index])) index += 1;

    if (value[index] === '[') index = balancedEnd(value, index, '[', ']');
    else if (value[index] === '{') index = balancedEnd(value, index, '{', '}');
    else if (parameter.isOptional) continue;
    else if (index < value.length) index += 1;
    else return start;

    if (index === -1) return start;
  }

  return index;
}

function balancedEnd(
  value: string,
  start: number,
  open: string,
  close: string
): number {
  let depth = 0;
  for (let index = start; index < value.length; index++) {
    if (value[index] === open) depth += 1;
    else if (value[index] === close) {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}
