import { MenuItem } from '../public/ui-menu-types';
import { convertLatexToMarkup } from 'public/mathlive-ssr';
import { localize } from 'core/l10n';
import { ModeEditor } from 'editor-mathfield/mode-editor';
import { setEnvironment } from 'editor-model/array';
import { TabularEnvironment, Variant, VariantStyle } from 'public/core-types';
import { requestUpdate } from 'editor-mathfield/render';
import { complete, removeSuggestion } from 'editor-mathfield/autocomplete';
import { BACKGROUND_COLORS, FOREGROUND_COLORS } from 'core/color';
import { Atom } from 'core/atom-class';
import { VARIANT_REPERTOIRE } from 'core/modes-math';
import { _Mathfield } from 'editor-mathfield/mathfield-private';
import { _MenuItemState } from 'ui/menu/menu-item';
import { contrast } from 'ui/colors/contrast';
import { asHexColor } from 'ui/colors/css';

// Return a string from the selection, if all the atoms are character boxes
// (i.e. not fractions, square roots, etc...)
function getSelectionPlainString(mf: _Mathfield): string {
  const atoms = getSelectionAtoms(mf);
  let result = '';
  for (const atom of atoms) {
    if (typeof atom.value !== 'string') return '';
    result += atom.value;
  }
  return result;
}

function getSelectionAtoms(mf: _Mathfield): Readonly<Atom[]> {
  const model = mf.model;
  const ranges = model.selection.ranges;
  if (ranges.length !== 1) return [];

  let atoms = mf.model.getAtoms(ranges[0]);
  if (atoms.length === 1 && atoms[0].type === 'root') atoms = atoms[0].children;
  return atoms.filter((x) => x.type !== 'first');
}

function validVariantAtom(mf: _Mathfield, variant: string): boolean {
  const atoms = getSelectionAtoms(mf);
  if (atoms.length !== 1) return false;

  const repertoire = VARIANT_REPERTOIRE[variant];
  if (!repertoire) return false;
  if (repertoire.test(atoms[0].value)) return true;
  return false;
}

function validVariantStyleSelection(mf: _Mathfield): boolean {
  return getSelectionPlainString(mf).length > 0;
}

function getVariantSubmenu(mf: _Mathfield): MenuItem[] {
  return [
    variantMenuItem(mf, 'double-struck', 'mathbb', 'tooltip.blackboard'),
    variantMenuItem(mf, 'fraktur', 'mathfrak', 'tooltip.fraktur'),
    variantMenuItem(mf, 'calligraphic', 'mathcal', 'tooltip.caligraphic'),
    variantStyleMenuItem(mf, 'up', 'mathrm', 'tooltip.roman-upright'),
    variantStyleMenuItem(mf, 'bold', 'bm', 'tooltip.bold'),
    variantStyleMenuItem(mf, 'italic', 'mathit', 'tooltip.italic'),
  ];
}

function getAccentSubmenu(mf: _Mathfield): MenuItem[] {
  return [
    {
      id: 'accent-vec',
      class: 'ML__center-menu',
      label: () =>
        convertLatexToMarkup(`\\vec{${getSelectionPlainString(mf)}}`),
      visible: () => getSelectionPlainString(mf).length === 1,
      onMenuSelect: () => mf.insert('\\vec{#@}', { selectionMode: 'item' }),
    },
    {
      id: 'accent-overrightarrow',
      class: 'ML__center-menu',
      label: () =>
        convertLatexToMarkup(
          `\\overrightarrow{${getSelectionPlainString(mf)}}`
        ),
      visible: () => getSelectionPlainString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overrightarrow{#@}', { selectionMode: 'item' }),
    },
    {
      id: 'accent-overleftarrow',
      class: 'ML__center-menu',
      label: () =>
        convertLatexToMarkup(`\\overleftarrow{${getSelectionPlainString(mf)}}`),
      visible: () => getSelectionPlainString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overleftarrow{#@}', { selectionMode: 'item' }),
    },
    {
      id: 'accent-dot',
      class: 'ML__center-menu',
      label: () =>
        convertLatexToMarkup(`\\dot{${getSelectionPlainString(mf)}}`),
      visible: () => getSelectionPlainString(mf).length === 1,
      onMenuSelect: () => mf.insert('\\dot{#@}', { selectionMode: 'item' }),
    },
    {
      id: 'accent-ddot',
      class: 'ML__center-menu',
      label: () =>
        convertLatexToMarkup(`\\ddot{${getSelectionPlainString(mf)}}`),
      visible: () => getSelectionPlainString(mf).length === 1,
      onMenuSelect: () => mf.insert('\\ddot{#@}', { selectionMode: 'item' }),
    },
    {
      id: 'accent-bar',
      class: 'ML__center-menu',
      label: () =>
        convertLatexToMarkup(`\\bar{${getSelectionPlainString(mf)}}`),
      visible: () => getSelectionPlainString(mf).length === 1,
      onMenuSelect: () => mf.insert('\\bar{#@}', { selectionMode: 'item' }),
    },
    {
      id: 'accent-overline',
      class: 'ML__center-menu',
      label: () =>
        convertLatexToMarkup(`\\overline{${getSelectionPlainString(mf)}}`),
      visible: () => getSelectionPlainString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overline{#@}', { selectionMode: 'item' }),
    },
    {
      id: 'accent-overgroup',
      class: 'ML__center-menu',
      label: () =>
        convertLatexToMarkup(`\\overgroup{${getSelectionPlainString(mf)}}`),
      visible: () => getSelectionPlainString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overgroup{#@}', { selectionMode: 'item' }),
    },
    {
      id: 'accent-overbrace',
      class: 'ML__center-menu',
      label: () =>
        convertLatexToMarkup(`\\overbrace{${getSelectionPlainString(mf)}}`),
      visible: () => getSelectionPlainString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overbrace{#@}', { selectionMode: 'item' }),
    },
    {
      id: 'accent-underline',
      class: 'ML__center-menu',
      label: () =>
        convertLatexToMarkup(`\\underline{${getSelectionPlainString(mf)}}`),
      visible: () => getSelectionPlainString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\underline{#@}', { selectionMode: 'item' }),
    },
    {
      id: 'accent-undergroup',
      class: 'ML__center-menu',
      label: () =>
        convertLatexToMarkup(`\\undergroup{${getSelectionPlainString(mf)}}`),
      visible: () => getSelectionPlainString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\undergroup{#@}', { selectionMode: 'item' }),
    },
    {
      id: 'accent-underbrace',
      class: 'ML__center-menu',
      label: () =>
        convertLatexToMarkup(`\\underbrace{${getSelectionPlainString(mf)}}`),
      visible: () => getSelectionPlainString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\underbrace{#@}', { selectionMode: 'item' }),
    },
  ];
}

function getDecorationSubmenu(mf: _Mathfield): MenuItem[] {
  return [
    // {
    //   label: () => convertLatexToMarkup(`\\cancel{${getSelection(mf)}}`),
    //   // visible: () => getSelection(mf).length > 0,
    //   onMenuSelect: () => mf.insert('\\cancel{#@}', { selectionMode: 'item' }),
    // },
    {
      id: 'decoration-boxed',
      label: () =>
        convertLatexToMarkup(`\\boxed{${mf.getValue(mf.model.selection)}}}`),
      // visible: () => getSelection(mf).length > 0,
      onMenuSelect: () => mf.insert('\\boxed{#@}', { selectionMode: 'item' }),
    },
    {
      id: 'decoration-red-box',
      label: () =>
        convertLatexToMarkup(
          `\\bbox[5px, border: 2px solid red]{${mf.getValue(
            mf.model.selection
          )}}`
        ),
      // visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\bbox[5px, border: 2px solid red]{#@}', {
          selectionMode: 'item',
        }),
    },
    {
      id: 'decoration-dashed-black-box',
      label: () =>
        convertLatexToMarkup(
          `\\bbox[5px, border: 2px dashed black]{${mf.getValue(
            mf.model.selection
          )}}`
        ),
      // visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\bbox[5px, border: 2px dashed black]{#@}', {
          selectionMode: 'item',
        }),
    },
  ];
}

function getBackgroundColorSubmenu(mf: _Mathfield): Readonly<MenuItem[]> {
  const result: MenuItem[] = [];
  for (const color of Object.keys(BACKGROUND_COLORS)) {
    result.push({
      id: `background-color-${color}`,
      class:
        (asHexColor(contrast(BACKGROUND_COLORS[color])) === '#000'
          ? 'dark-contrast'
          : 'light-contrast') + ' menu-swatch',

      label: `<span style="background:${BACKGROUND_COLORS[color]} "></span>`,

      ariaLabel: () => localize(color) ?? color,

      checked: () =>
        ({ some: 'mixed', all: true })[
          mf.queryStyle({ backgroundColor: color })
        ] ?? false,

      onMenuSelect: () =>
        mf.applyStyle({ backgroundColor: color }, { operation: 'toggle' }),
    });
  }
  return result;
}

function getColorSubmenu(mf: _Mathfield): Readonly<MenuItem[]> {
  const result: MenuItem[] = [];
  for (const color of Object.keys(FOREGROUND_COLORS)) {
    result.push({
      id: `color-${color}`,
      class:
        (contrast(FOREGROUND_COLORS[color]) === '#000'
          ? 'dark-contrast'
          : 'light-contrast') + ' menu-swatch',

      label: `<span style="background:${FOREGROUND_COLORS[color]} "></span>`,

      ariaLabel: () => localize(color) ?? color,

      checked: () =>
        ({ some: 'mixed', all: true })[mf.queryStyle({ color })] ?? false,

      onMenuSelect: () => mf.applyStyle({ color }, { operation: 'toggle' }),
    });
  }
  return result;
}

class InsertMatrixMenuItem extends _MenuItemState<{
  row: number;
  col: number;
}> {
  row: number;
  col: number;
  constructor(decl, parent, row, col) {
    super(decl, parent);
    this.row = row;
    this.col = col;
  }

  set active(value: boolean) {
    const cells = this.parentMenu.children as unknown as Readonly<
      InsertMatrixMenuItem[]
    >;
    if (value) {
      // Make all the items with a smaller column or row active as well
      for (const cell of cells) {
        cell.element.classList.toggle(
          'active',
          cell.row <= this.row && cell.col <= this.col
        );
      }
    } else for (const cell of cells) cell.element.classList.remove('active');
  }
}

function getInsertMatrixSubmenu(mf: _Mathfield): MenuItem[] {
  const result: MenuItem[] = [];

  for (let row = 1; row <= 5; row++) {
    for (let col = 1; col <= 5; col++) {
      result.push({
        id: `insert-matrix-${row}x${col}`,
        onCreate: (decl, parent) =>
          new InsertMatrixMenuItem(decl, parent, row, col),
        label: `☐`,
        tooltip: () => localize('tooltip.row-by-col', row, col)!,
        data: { row, col },
        onMenuSelect: () => {
          mf.insert(
            `\\begin{pmatrix}${Array(row)
              .fill(Array(col).fill('#?').join(' & '))
              .join('\\\\')}\\end{pmatrix}`,
            {
              selectionMode: 'item',
            }
          );
        },
      } as MenuItem);
    }
  }

  return result;
}

export function getDefaultMenuItems(mf: _Mathfield): MenuItem[] {
  return [
    // {
    //   label: 'Show Virtual Keyboard',
    //   onMenuSelect: () => window.mathVirtualKeyboard.show({ animate: true }),
    //   visible: () => window.mathVirtualKeyboard.visible === false,
    // },
    // {
    //   label: 'Hide Virtual Keyboard',
    //   onMenuSelect: () => window.mathVirtualKeyboard.hide({ animate: true }),
    //   visible: () => window.mathVirtualKeyboard.visible === true,
    // },
    {
      label: () => localize('menu.array.add row above')!,
      id: 'add-row-above',
      onMenuSelect: () => mf.executeCommand('addRowBefore'),
      keyboardShortcut: 'shift+alt+[Return]',
      visible: () => inMatrix(mf),
    },
    {
      label: () => localize('menu.array.add row below')!,
      id: 'add-row-below',
      onMenuSelect: () => mf.executeCommand('addRowAfter'),
      keyboardShortcut: 'alt+[Return]',
      visible: () => inMatrix(mf),
    },
    {
      label: () => localize('menu.array.add column before')!,
      id: 'add-column-before',
      onMenuSelect: () => mf.executeCommand('addColumnBefore'),
      visible: () => inMatrix(mf),
      keyboardShortcut: 'shift+alt+[Tab]',
      enabled: () => {
        const array = mf.model.parentEnvironment;
        if (!array) return false;
        const [rows, _cols] = shape(mf);
        return rows < array.maxColumns;
      },
    },
    {
      label: () => localize('menu.array.add column after')!,
      id: 'add-column-after',
      onMenuSelect: () => mf.executeCommand('addColumnAfter'),
      keyboardShortcut: 'alt+[Tab]',
      visible: () => inMatrix(mf),
    },
    {
      type: 'divider',
    },
    {
      label: () => localize('menu.array.delete row')!,
      id: 'delete-row',
      onMenuSelect: () => mf.executeCommand('removeRow'),
      visible: () => inMatrix(mf),
    },
    {
      label: () => localize('menu.array.delete column')!,
      id: 'delete-column',
      onMenuSelect: () => mf.executeCommand('removeColumn'),
      visible: () => inMatrix(mf),
    },
    {
      type: 'divider',
    },

    {
      label: () => localize('menu.borders')!,
      visible: () =>
        (isMatrixSelected(mf) || inMatrix(mf)) && mf.isSelectionEditable,
      submenu: [
        {
          label: ' ⋱ ',
          id: 'environment-no-border',
          onMenuSelect: () => performSetEnvironment(mf, 'matrix'),
        },
        {
          label: '(⋱)',
          id: 'environment-parentheses',
          onMenuSelect: () => performSetEnvironment(mf, 'pmatrix'),
        },
        {
          label: '[⋱]',
          id: 'environment-brackets',
          onMenuSelect: () => performSetEnvironment(mf, 'bmatrix'),
        },
        {
          label: '|⋱|',
          id: 'environment-bar',
          onMenuSelect: () => performSetEnvironment(mf, 'vmatrix'),
        },
        {
          label: '{⋱}',
          id: 'environment-braces',
          onMenuSelect: () => performSetEnvironment(mf, 'Bmatrix'),
        },
      ],
      submenuClass: 'border-submenu',
    },
    {
      type: 'divider',
    },
    {
      label: () => localize('menu.insert matrix')!,
      id: 'insert-matrix',
      visible: () => mf.isSelectionEditable,
      submenu: getInsertMatrixSubmenu(mf),
      submenuClass: 'insert-matrix-submenu',
      columnCount: 5,
    },
    {
      label: () => localize('menu.mode')!,
      id: 'mode',
      visible: () => mf.isSelectionEditable && mf.model.selectionIsCollapsed,
      submenu: [
        {
          label: () => localize('menu.mode-math')!,
          id: 'mode-math',
          onMenuSelect: () => {
            complete(mf, 'accept-all');
            mf.executeCommand(['switchMode', 'math']);
          },
          checked: () => mf.model.mode === 'math',
        },
        {
          label: () => localize('menu.mode-text')!,
          id: 'mode-text',
          onMenuSelect: () => {
            complete(mf, 'accept-all');
            mf.executeCommand(['switchMode', 'text']);
          },
          checked: () => mf.model.mode === 'text',
        },
        {
          label: () => localize('menu.mode-latex')!,
          id: 'mode-latex',
          onMenuSelect: () => mf.executeCommand(['switchMode', 'latex']),
          checked: () => mf.model.mode === 'latex',
        },
      ],
    },

    {
      type: 'divider',
    },
    {
      label: () => localize('menu.font-style')!,
      id: 'variant',
      visible: () => mf.isSelectionEditable,
      submenu: getVariantSubmenu(mf),
      submenuClass: 'variant-submenu',
    },
    {
      label: () => localize('menu.color')!,
      id: 'color',
      visible: () => mf.isSelectionEditable,
      submenu: getColorSubmenu(mf),
      columnCount: 4,
      submenuClass: 'swatches-submenu',
    },
    {
      label: () => localize('menu.background-color')!,
      id: 'background-color',
      visible: () => mf.isSelectionEditable,
      submenu: getBackgroundColorSubmenu(mf),
      columnCount: 4,
      submenuClass: 'swatches-submenu',
    },
    {
      label: () => localize('menu.accent')!,
      id: 'accent',
      visible: () => mf.isSelectionEditable,
      submenu: getAccentSubmenu(mf),
      submenuClass: 'variant-submenu',
    },
    {
      label: () => localize('menu.decoration')!,
      id: 'decoration',
      visible: () =>
        mf.isSelectionEditable && getSelectionPlainString(mf).length > 0,
      submenu: getDecorationSubmenu(mf),
      submenuClass: 'variant-submenu',
    },
    {
      type: 'divider',
    },
    {
      label: () => localize('menu.evaluate')!,
      id: 'ce-evaluate',
      visible: () =>
        mf.isSelectionEditable &&
        globalThis.MathfieldElement.computeEngine !== null,
      onMenuSelect: () => {
        const latex = evaluate(mf);
        if (!latex) {
          mf.model.announce('plonk');
          return;
        }
        if (mf.model.selectionIsCollapsed) {
          mf.model.position = mf.model.lastOffset;
          mf.insert(`=${latex}`, {
            insertionMode: 'insertAfter',
            selectionMode: 'item',
          });
        } else {
          mf.insert(latex, {
            insertionMode: 'replaceSelection',
            selectionMode: 'item',
          });
        }
      },
    },
    {
      label: () => localize('menu.simplify')!,
      id: 'ce-simplify',
      visible: () =>
        mf.isSelectionEditable &&
        globalThis.MathfieldElement.computeEngine !== null,
      onMenuSelect: () => {
        if (mf.model.selectionIsCollapsed) {
          const result = mf.expression?.simplify();
          mf.model.position = mf.model.lastOffset;
          if (!result) {
            mf.model.announce('plonk');
            return;
          }
          mf.insert(`=${result.latex}`, {
            insertionMode: 'insertAfter',
            selectionMode: 'item',
          });
        } else {
          const result = globalThis.MathfieldElement.computeEngine
            ?.parse(mf.getValue(mf.model.selection))
            .simplify();
          if (!result) {
            mf.model.announce('plonk');
            return;
          }
          mf.insert(result.latex, {
            insertionMode: 'replaceSelection',
            selectionMode: 'item',
          });
        }
      },
    },
    {
      label: () => {
        const ce = globalThis.MathfieldElement.computeEngine;
        if (ce === null) return '';

        const unknown = mf.expression?.unknowns[0];
        if (unknown) {
          const latex = ce.box(unknown).latex;
          return localize('menu.solve-for', convertLatexToMarkup(latex))!;
        }
        return localize('menu.solve')!;
      },
      id: 'ce-solve',
      visible: () =>
        mf.isSelectionEditable &&
        globalThis.MathfieldElement.computeEngine !== null &&
        mf.expression?.unknowns.length === 1 &&
        mf.expression.unknowns[0] !== 'Nothing',
      onMenuSelect: () => {
        const expr = mf.expression!;
        const unknown = expr?.unknowns[0];
        const results = expr
          .solve(unknown)
          ?.map((x) => x.simplify().latex ?? '');
        if (!results) {
          mf.model.announce('plonk');
          return;
        }
        mf.insert(
          `${unknown}=${
            results.length === 1
              ? results[0]
              : '\\left\\lbrace' + results?.join(', ') + '\\right\\rbrace'
          }`,
          {
            insertionMode: 'replaceAll',
            selectionMode: 'item',
          }
        );
      },
    },
    {
      type: 'divider',
    },
    {
      label: () => localize('menu.cut')!,
      id: 'cut',
      onMenuSelect: () => mf.executeCommand('cutToClipboard'),
      visible: () => !mf.options.readOnly && mf.isSelectionEditable,
      keyboardShortcut: 'meta+X',
    },
    // {
    //   label: 'Copy',
    //   onMenuSelect: () => mf.executeCommand('copyToClipboard'),
    // },
    {
      label: () => localize('menu.copy')!,
      id: 'copy',
      submenu: [
        {
          label: () => localize('menu.copy-as-latex')!,
          id: 'copy-latex',
          onMenuSelect: () => ModeEditor.copyToClipboard(mf, 'latex'),
          keyboardShortcut: 'meta+C',
        },
        {
          label: () => localize('menu.copy-as-ascii-math')!,
          id: 'copy-ascii-math',
          onMenuSelect: () => ModeEditor.copyToClipboard(mf, 'ascii-math'),
        },
        {
          label: () => localize('menu.copy-as-mathml')!,
          id: 'copy-math-ml',
          onMenuSelect: () => ModeEditor.copyToClipboard(mf, 'math-ml'),
        },
      ],
    },

    {
      label: () => localize('menu.paste')!,
      id: 'paste',
      onMenuSelect: () => mf.executeCommand('pasteFromClipboard'),
      visible: () => mf.hasEditableContent,
      keyboardShortcut: 'meta+V',
    },
    {
      label: () => localize('menu.select-all')!,
      id: 'select-all',
      keyboardShortcut: 'meta+A',
      onMenuSelect: () => mf.executeCommand('selectAll'),
    },
  ];
}

function inMatrix(mf: _Mathfield): boolean {
  return !!mf.model.parentEnvironment?.array;
}

function isMatrixSelected(mf: _Mathfield): boolean {
  return mf.model.at(mf.model.position).type === 'array';
}

function shape(mf: _Mathfield): [number, number] {
  const array = mf.model.parentEnvironment?.array;
  if (!array) return [0, 0];

  return [
    array.length,
    array.reduce((acc, col) => Math.max(acc, col.length), 0),
  ];
}

function performSetEnvironment(mf: _Mathfield, env: TabularEnvironment): void {
  removeSuggestion(mf);
  mf.flushInlineShortcutBuffer();
  setEnvironment(mf.model, env);
  requestUpdate(mf);
}

function evaluate(mf: _Mathfield): string {
  let expr: any;
  if (mf.model.selectionIsCollapsed) {
    expr = globalThis.MathfieldElement.computeEngine?.parse(mf.getValue(), {
      canonical: false,
    });
  } else {
    expr = globalThis.MathfieldElement.computeEngine?.parse(
      mf.getValue(mf.model.selection),
      { canonical: false }
    );
  }
  if (!expr) return '';
  let result = expr.evaluate();
  // eslint-disable-next-line new-cap
  if (result.isSame(expr)) result = expr.N();

  return result.latex;
}

function variantMenuItem(
  mf: _Mathfield,
  variant: Variant,
  command: string,
  tooltip: string
): MenuItem {
  return {
    id: `variant-${variant}`,
    label: () => {
      const textSelection = getSelectionPlainString(mf);
      if (textSelection.length < 12)
        return convertLatexToMarkup(
          `\\${command}{${getSelectionPlainString(mf)}}`
        );
      return localize(tooltip) ?? tooltip;
    },
    class: 'ML__xl',
    tooltip: () => localize(tooltip) ?? tooltip,
    visible: () => validVariantAtom(mf, variant),
    checked: () =>
      ({ some: 'mixed', all: true })[mf.queryStyle({ variant })] ?? false,
    onMenuSelect: () => mf.applyStyle({ variant }, { operation: 'toggle' }),
  };
}

function variantStyleMenuItem(
  mf: _Mathfield,
  variantStyle: VariantStyle,
  command: string,
  tooltip: string
): MenuItem {
  return {
    id: `variant-style-${variantStyle}`,

    label: () => {
      const textSelection = getSelectionPlainString(mf);
      if (textSelection.length > 0 && textSelection.length < 12)
        return convertLatexToMarkup(
          `\\${command}{${getSelectionPlainString(mf)}}`
        );
      return localize(tooltip) ?? tooltip;
    },

    class: () => {
      const textSelection = getSelectionPlainString(mf);
      if (textSelection.length > 0 && textSelection.length < 12)
        return 'ML__xl';
      return '';
    },

    tooltip: () => localize(tooltip) ?? tooltip,

    visible:
      variantStyle === 'bold' ? true : () => validVariantStyleSelection(mf),

    checked: () =>
      ({ some: 'mixed', all: true })[mf.queryStyle({ variantStyle })] ?? false,

    onMenuSelect: () =>
      mf.applyStyle({ variantStyle }, { operation: 'toggle' }),
  };
}
