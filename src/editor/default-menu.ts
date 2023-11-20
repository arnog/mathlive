import { MenuItem } from 'ui/menu/types';
import { convertLatexToMarkup } from 'public/mathlive-ssr';
import { localize } from 'core/l10n';
import { ModeEditor } from 'editor-mathfield/mode-editor';
import { _Mathfield } from './mathfield';
import { setEnvironment } from 'editor-model/array';
import { TabularEnvironment } from 'public/core-types';
import { requestUpdate } from 'editor-mathfield/render';
import { removeSuggestion } from 'editor-mathfield/autocomplete';
import { BACKGROUND_COLORS, FOREGROUND_COLORS } from 'core/color';
import { Atom } from 'core/atom-class';
import { VARIANT_REPERTOIRE } from 'core/modes-math';

// Return a string from the selection, if all the atoms are character boxes
// (i.e. not fractions, square roots, etc...)
function getSelectionString(mf: _Mathfield): string {
  // const model = mf.model;
  // return model.getValue(model.selection, 'latex');
  const atoms = getSelectionAtoms(mf);
  let result = '';
  for (const atom of atoms) {
    if (typeof atom.value !== 'string') return '';
    result += atom.value;
  }
  return result;
}

function getSelectionAtoms(mf: _Mathfield): Atom[] {
  const model = mf.model;
  const ranges = model.selection.ranges;
  if (ranges.length !== 1) return [];

  return mf.model.getAtoms(ranges[0]);
}

function validVariantAtom(mf: _Mathfield, variant: string): boolean {
  const atoms = getSelectionAtoms(mf);
  if (atoms.length !== 1) return false;

  const repertoire = VARIANT_REPERTOIRE[variant];
  if (!repertoire) return false;
  if (repertoire.test(atoms[0].value)) return true;
  return false;
}

function validVariantStyleSelection(
  mf: _Mathfield,
  _variantStyle: VariantStyle
): boolean {
  return getSelectionString(mf).length > 0;
}

function getVariantSubmenu(mf: _Mathfield): MenuItem[] {
  return [
    {
      label: () => convertLatexToMarkup(`\\mathbb{${getSelectionString(mf)}}`),
      visible: () => validVariantAtom(mf, 'double-struck'),
      onMenuSelect: () =>
        mf.applyStyle({ variant: 'double-struck' }, { operation: 'toggle' }),
    },
    {
      label: () =>
        convertLatexToMarkup(`\\mathfrak{${getSelectionString(mf)}}`),
      visible: () => validVariantAtom(mf, 'fraktur'),
      onMenuSelect: () =>
        mf.applyStyle({ variant: 'fraktur' }, { operation: 'toggle' }),
    },
    {
      label: () => convertLatexToMarkup(`\\mathcal{${getSelectionString(mf)}}`),
      visible: () => validVariantAtom(mf, 'calligraphic'),
      onMenuSelect: () =>
        mf.applyStyle({ variant: 'calligraphic' }, { operation: 'toggle' }),
    },
    {
      label: () => convertLatexToMarkup(`\\mathrm{${getSelectionString(mf)}}`),
      visible: () => validVariantStyleSelection(mf, 'up'),
      onMenuSelect: () =>
        mf.applyStyle({ variantStyle: 'up' }, { operation: 'toggle' }),
    },
    {
      label: () => convertLatexToMarkup(`\\mathbf{${getSelectionString(mf)}}`),
      visible: () => validVariantStyleSelection(mf, 'bold'),
      onMenuSelect: () =>
        mf.applyStyle({ variantStyle: 'bold' }, { operation: 'toggle' }),
    },
  ];
}

function getAccentSubmenu(mf: _Mathfield): MenuItem[] {
  return [
    {
      label: () => convertLatexToMarkup(`\\vec{${getSelectionString(mf)}}`),
      visible: () => getSelectionString(mf).length === 1,
      onMenuSelect: () => mf.insert('\\vec{#@}', { selectionMode: 'item' }),
    },
    {
      label: () =>
        convertLatexToMarkup(`\\overrightarrow{${getSelectionString(mf)}}`),
      visible: () => getSelectionString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overrightarrow{#@}', { selectionMode: 'item' }),
    },
    {
      label: () =>
        convertLatexToMarkup(`\\overleftarrow{${getSelectionString(mf)}}`),
      visible: () => getSelectionString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overleftarrow{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\dot{${getSelectionString(mf)}}`),
      visible: () => getSelectionString(mf).length === 1,
      onMenuSelect: () => mf.insert('\\dot{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\ddot{${getSelectionString(mf)}}`),
      visible: () => getSelectionString(mf).length === 1,
      onMenuSelect: () => mf.insert('\\ddot{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\bar{${getSelectionString(mf)}}`),
      visible: () => getSelectionString(mf).length === 1,
      onMenuSelect: () => mf.insert('\\bar{#@}', { selectionMode: 'item' }),
    },
    {
      label: () =>
        convertLatexToMarkup(`\\overline{${getSelectionString(mf)}}`),
      visible: () => getSelectionString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overline{#@}', { selectionMode: 'item' }),
    },
    {
      label: () =>
        convertLatexToMarkup(`\\overgroup{${getSelectionString(mf)}}`),
      visible: () => getSelectionString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overgroup{#@}', { selectionMode: 'item' }),
    },
    {
      label: () =>
        convertLatexToMarkup(`\\overbrace{${getSelectionString(mf)}}`),
      visible: () => getSelectionString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overbrace{#@}', { selectionMode: 'item' }),
    },
    {
      label: () =>
        convertLatexToMarkup(`\\underline{${getSelectionString(mf)}}`),
      visible: () => getSelectionString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\underline{#@}', { selectionMode: 'item' }),
    },
    {
      label: () =>
        convertLatexToMarkup(`\\undergroup{${getSelectionString(mf)}}`),
      visible: () => getSelectionString(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\undergroup{#@}', { selectionMode: 'item' }),
    },
    {
      label: () =>
        convertLatexToMarkup(`\\underbrace{${getSelectionString(mf)}}`),
      visible: () => getSelectionString(mf).length > 0,
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
      label: () => convertLatexToMarkup(`\\boxed{${getSelectionString(mf)}}`),
      // visible: () => getSelection(mf).length > 0,
      onMenuSelect: () => mf.insert('\\boxed{#@}', { selectionMode: 'item' }),
    },
    {
      label: () =>
        convertLatexToMarkup(
          `\\bbox[5px, border: 2px solid red]{${getSelectionString(mf)}}`
        ),
      // visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\bbox[5px, border: 2px solid red]{#@}', {
          selectionMode: 'item',
        }),
    },
    {
      label: () =>
        convertLatexToMarkup(
          `\\bbox[5px, border: 2px dashed black]{${getSelectionString(mf)}}`
        ),
      // visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\bbox[5px, border: 1px solid black]{#@}', {
          selectionMode: 'item',
        }),
    },
  ];
}

function getBackgroundColorSubmenu(mf: _Mathfield): MenuItem[] {
  const result: MenuItem[] = [];
  for (const color of Object.keys(BACKGROUND_COLORS)) {
    result.push({
      class: 'menu-swatch',
      label: `<span style="background:${BACKGROUND_COLORS[color]} "></span>`,
      onMenuSelect: () => {
        if (mf.model.selectionIsCollapsed) {
          if (mf.style.backgroundColor === color)
            mf.style.backgroundColor = undefined;
          else mf.style.backgroundColor = color;
        } else
          mf.applyStyle({ backgroundColor: color }, { operation: 'toggle' });
      },
    });
  }
  return result;
}

function getColorSubmenu(mf: _Mathfield): MenuItem[] {
  const result: MenuItem[] = [];
  for (const color of Object.keys(FOREGROUND_COLORS)) {
    result.push({
      class: 'menu-swatch',
      label: `<span style="background:${FOREGROUND_COLORS[color]} "></span>`,
      onMenuSelect: () => {
        if (mf.model.selectionIsCollapsed) {
          if (mf.style.color === color) mf.style.color = undefined;
          else mf.style.color = color;
        } else mf.applyStyle({ color: color }, { operation: 'toggle' });
      },
    });
  }
  return result;
}

function getInsertMatrixSubmenu(mf: _Mathfield): MenuItem[] {
  const result: MenuItem[] = [];

  for (let rows = 1; rows <= 5; rows++) {
    for (let cols = 1; cols <= 5; cols++) {
      result.push({
        label: `☐`,
        onMenuSelect: () => {
          mf.insert(
            `\\begin{pmatrix}${Array(cols)
              .fill(Array(rows).fill('#?').join(' & '))
              .join('\\\\')}\\end{pmatrix}`,
            {
              selectionMode: 'item',
            }
          );
        },
      });
    }
  }

  return result;
}

export function getDefaultMenuItems(mf: _Mathfield): MenuItem[] {
  return [
    // // {
    // //   label: 'Show Virtual Keyboard',
    // //   onMenuSelect: () => window.mathVirtualKeyboard.show({ animate: true }),
    // //   visible: () => window.mathVirtualKeyboard.visible === false,
    // // },
    // // {
    // //   label: 'Hide Virtual Keyboard',
    // //   onMenuSelect: () => window.mathVirtualKeyboard.hide({ animate: true }),
    // //   visible: () => window.mathVirtualKeyboard.visible === true,
    // // },
    // {
    //   type: 'divider',
    // },
    {
      label: 'Return to Math Mode',
      onMenuSelect: () => mf.executeCommand(['switchMode', 'math']),
      visible: () => mf.isSelectionEditable && mf.model.mode === 'text',
    },
    {
      type: 'divider',
    },
    {
      label: localize('menu.array.add row above'),
      onMenuSelect: () => mf.executeCommand('addRowBefore'),
      visible: () => inMatrix(mf),
    },
    {
      label: localize('menu.array.add row below'),
      onMenuSelect: () => mf.executeCommand('addRowAfter'),
      visible: () => inMatrix(mf),
    },
    {
      label: localize('menu.array.add column before'),
      onMenuSelect: () => mf.executeCommand('addColumnBefore'),
      visible: () => inMatrix(mf),
      enabled: () => {
        const array = mf.model.parentEnvironment;
        if (!array) return false;
        const [rows, _cols] = shape(mf);
        return rows < array.maxColumns;
      },
    },
    {
      label: localize('menu.array.add column after'),
      onMenuSelect: () => mf.executeCommand('addColumnAfter'),
      visible: () => inMatrix(mf),
    },
    {
      label: localize('menu.array.delete row'),
      onMenuSelect: () => mf.executeCommand('removeRow'),
      visible: () => inMatrix(mf),
    },
    {
      label: localize('menu.array.delete column'),
      onMenuSelect: () => mf.executeCommand('removeColumn'),
      visible: () => inMatrix(mf),
    },

    {
      label: 'Insert Matrix',
      containerClass: 'menu-container-insert-matrix',
      visible: () => mf.isSelectionEditable,
      submenu: getInsertMatrixSubmenu(mf),
    },
    {
      label: 'Borders',
      containerClass: 'menu-container-border',
      visible: () => inMatrix(mf) && mf.isSelectionEditable,
      type: 'group',
      submenu: [
        {
          label: ' ⋱ ',
          onMenuSelect: () => performSetEnvironment(mf, 'matrix'),
        },
        {
          label: '(⋱)',
          onMenuSelect: () => performSetEnvironment(mf, 'pmatrix'),
        },
        {
          label: '[⋱]',
          onMenuSelect: () => performSetEnvironment(mf, 'bmatrix'),
        },
        {
          label: '|⋱|',
          onMenuSelect: () => performSetEnvironment(mf, 'vmatrix'),
        },
        {
          label: '{⋱}',
          onMenuSelect: () => performSetEnvironment(mf, 'Bmatrix'),
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      label: 'Insert Text',
      onMenuSelect: () => mf.executeCommand(['switchMode', 'text']),
      visible: () => mf.model.mode === 'math',
    },

    {
      type: 'divider',
    },
    {
      label: 'Variant',
      containerClass: 'menu-container-variant',
      visible: () => mf.isSelectionEditable,
      submenu: getVariantSubmenu(mf),
    },
    {
      label: 'Accent',
      containerClass: 'menu-container-variant',
      visible: () => mf.isSelectionEditable,
      submenu: getAccentSubmenu(mf),
    },
    {
      label: 'Decoration',
      containerClass: 'menu-container-variant',
      visible: () => mf.isSelectionEditable && getSelectionAtoms(mf).length > 0,
      submenu: getDecorationSubmenu(mf),
    },
    {
      label: 'Color',
      containerClass: 'menu-container-swatches',
      visible: () => mf.isSelectionEditable,
      submenu: getColorSubmenu(mf),
    },
    {
      label: 'Background Color',
      containerClass: 'menu-container-swatches',
      visible: () => mf.isSelectionEditable,
      submenu: getBackgroundColorSubmenu(mf),
    },
    {
      type: 'divider',
    },
    {
      label: 'Cut',
      onMenuSelect: () => mf.executeCommand('cutToClipboard'),
      visible: () => !mf.options.readOnly && mf.isSelectionEditable,
      keyboardShortcut: 'meta+X',
    },
    // {
    //   label: 'Copy',
    //   onMenuSelect: () => mf.executeCommand('copyToClipboard'),
    // },
    {
      label: 'Copy',
      submenu: [
        {
          label: 'Copy LaTeX',
          onMenuSelect: () => ModeEditor.copyToClipboard(mf, 'latex'),
          keyboardShortcut: 'meta+C',
        },
        {
          label: 'Copy ASCII Math',
          onMenuSelect: () => ModeEditor.copyToClipboard(mf, 'ascii-math'),
        },
        {
          label: 'Copy MathML',
          onMenuSelect: () => ModeEditor.copyToClipboard(mf, 'math-ml'),
        },
      ],
    },

    {
      label: 'Paste',
      onMenuSelect: () => mf.executeCommand('pasteFromClipboard'),
      visible: () => !mf.options.readOnly,
      keyboardShortcut: 'meta+V',
    },
    {
      label: 'Select All',
      keyboardShortcut: 'meta+A',
      onMenuSelect: () => mf.executeCommand('selectAll'),
    },
  ];
}

function inMatrix(mf: _Mathfield): boolean {
  return !!mf.model.parentEnvironment?.array;
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
