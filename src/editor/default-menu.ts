import { MenuItem } from 'ui/menu/types';
import { convertLatexToMarkup } from 'public/mathlive-ssr';
import { localize } from 'core/l10n';
import { ModeEditor } from 'editor-mathfield/mode-editor';
import { _Mathfield } from './mathfield';

function getSelection(mf: _Mathfield): string {
  const model = mf.model;
  return model.getValue(model.selection, 'latex');
}

function getVariantSubmenu(mf: _Mathfield): MenuItem[] {
  return [
    {
      label: () => convertLatexToMarkup(`\\mathbb{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\mathbb{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\mathfrak{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () =>
        mf.insert('\\mathfrak{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\mathcal{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\mathcal{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\mathrm{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\mathrm{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\mathbf{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\mathbf{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\vec{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\vec{#@}', { selectionMode: 'item' }),
    },
    {
      label: () =>
        convertLatexToMarkup(`\\overrightarrow{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overrightarrow{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\overleftarrow{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overleftarrow{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\dot{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\dot{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\ddot{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\ddot{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\bar{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length === 1,
      onMenuSelect: () => mf.insert('\\bar{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\overline{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overline{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\overgroup{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overgroup{#@}', { selectionMode: 'item' }),
    },
    {
      label: () => convertLatexToMarkup(`\\overbrace{${getSelection(mf)}}`),
      visible: () => getSelection(mf).length > 0,
      onMenuSelect: () =>
        mf.insert('\\overbrace{#@}', { selectionMode: 'item' }),
    },
  ];
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
      label: 'Switch to Math Mode',
      onMenuSelect: () => mf.executeCommand(['switchMode', 'math']),
      visible: () => mf.model.mode === 'text',
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
      submenu: [
        {
          label: '(⋱)',
          onMenuSelect: () => {
            mf.executeCommand([
              'insert',
              '\\begin{pmatrix}#@ & #? \\\\ #? & #? \\end{pmatrix}',
            ]);
          },
        },
        {
          label: '[⋱]',
          onMenuSelect: () => {
            mf.executeCommand([
              'insert',
              '\\begin{bmatrix}#@ & #? \\\\ #? & #?\\end{bmatrix}',
            ]);
          },
        },
        {
          label: '{⋱}',
          onMenuSelect: () => {
            mf.executeCommand([
              'insert',
              '\\begin{Bmatrix}#@ & #? \\\\ #? & #?\\end{Bmatrix}',
            ]);
          },
        },
      ],
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
      submenu: getVariantSubmenu(mf),
    },
    {
      type: 'divider',
    },
    {
      label: 'Cut',
      onMenuSelect: () => mf.executeCommand('cutToClipboard'),
      visible: () => !mf.options.readOnly,
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
