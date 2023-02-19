// @ts-ignore-error
import VIRTUAL_KEYBOARD_STYLESHEET from '../../css/virtual-keyboard.less';
// @ts-ignore-error
import CORE_STYLESHEET from '../../css/core.less';

import { Mathfield, VirtualKeyboardInterface } from '../public/mathfield';

import {
  CombinedVirtualKeyboardOptions,
  VirtualKeyboardDefinition,
  VirtualKeyboardKeycap,
  VirtualKeyboardLayer,
  VirtualKeyboardTheme,
} from '../public/options';

import { inject as injectStylesheet, Stylesheet } from '../common/stylesheet';
import { isArray } from '../common/types';

import { loadFonts } from '../core/fonts';
import { Context } from '../core/context';
import { defaultGlobalContext } from '../core/core';
import { DEFAULT_FONT_SIZE } from '../core/font-metrics';

import { Atom } from '../core/atom';
import { Box, makeStruts, coalesce, adjustInterAtomSpacing } from '../core/box';
import { parseLatex } from '../core/parser';
import { BACKGROUND_COLORS, FOREGROUND_COLORS } from '../core/color';
import { l10n as l10nOptions, localize as l10n } from '../core/l10n';
import {
  attachButtonHandlers,
  ButtonHandlers,
} from '../editor-mathfield/buttons';

import { hashCode } from '../common/hash-code';
import { Selector } from '../public/commands';
import { on } from '../editor-mathfield/utils';

import { MathfieldPrivate } from './mathfield';
import { getActiveKeyboardLayout } from './keyboard-layout';
import { COMMANDS, SelectorPrivate } from './commands';
import { Scrim } from './scrim';

let VIRTUAL_KEYBOARD_STYLESHEET_HASH: string | undefined = undefined;

export function showAlternateKeys(
  keyboard: VirtualKeyboard,
  altKeysetId: string
): boolean {
  const altKeys = ALT_KEYS[altKeysetId];
  const altContainer = document.createElement('div');
  altContainer.setAttribute('aria-hidden', 'true');
  altContainer.className =
    'ML__keyboard alternate-keys' +
    (keyboard.element!.classList.contains('material') ? ' material' : '');
  altContainer.id = 'mathlive-alternate-keys-panel';

  if (altKeys.length >= 14) {
    // Width 5: 5 key wide
    altContainer.style.width = '236px';
  } else if (altKeys.length >= 7) {
    // Width 4
    altContainer.style.width = '286px';
  } else if (altKeys.length === 4 || altKeys.length === 2) {
    // Width 2
    altContainer.style.width = '146px';
  } else if (altKeys.length === 1) {
    // Width 1
    altContainer.style.width = '86px';
  } else {
    // Width 3
    altContainer.style.width = '146px';
  }

  // Reset container height
  altContainer.style.height = 'auto';
  let markup = '';
  for (const altKey of altKeys) {
    markup += '<li';
    if (typeof altKey === 'string')
      markup += ' data-latex="' + altKey.replace(/"/g, '&quot;') + '"';
    else {
      if (altKey.latex)
        markup += ' data-latex="' + altKey.latex.replace(/"/g, '&quot;') + '"';

      if (altKey.content) {
        markup +=
          ' data-content="' + altKey.content.replace(/"/g, '&quot;') + '"';
      }

      if (altKey.insert) {
        markup +=
          ' data-insert="' + altKey.insert.replace(/"/g, '&quot;') + '"';
      }

      if (altKey.command) {
        if (typeof altKey.command === 'string')
          markup += ` data-command="${altKey.command.replace(/"/g, '&quot;')}"`;
        else {
          markup +=
            " data-command='" +
            JSON.stringify(altKey.command).replace(/"/g, '&quot;') +
            "'";
        }
      }

      if (altKey.aside)
        markup += ` data-aside="${altKey.aside.replace(/"/g, '&quot;')}"`;

      if (altKey.class) markup += ` data-classes="${altKey.class}"`;
    }

    markup += '>';
    markup += typeof altKey === 'string' ? altKey : altKey.label ?? '';
    markup += '</li>';
  }

  markup = '<ul>' + markup + '</ul>';
  altContainer.innerHTML = keyboard.options.createHTML(markup);

  //
  // Associate a command which each of the alternate keycaps
  //
  makeKeycap(
    keyboard,
    [...altContainer.querySelectorAll('li')],
    'performAlternateKeys'
  );

  //
  // Create the scrim and attach the alternate key panel to it
  //
  if (!Scrim.scrim) Scrim.scrim = new Scrim();
  Scrim.scrim.open({
    root: keyboard.options.virtualKeyboardContainer,
    child: altContainer,
  });

  //
  // Position the alternate panel
  //
  const keycapElement = keyboard?.element!.querySelector(
    'div.keyboard-layer.is-visible div.rows ul li[data-alt-keys="' +
      altKeysetId +
      '"]'
  );

  const position = keycapElement?.getBoundingClientRect();
  if (position) {
    if (position.top - altContainer.clientHeight < 0) {
      // AltContainer.style.maxWidth = '320px';  // Up to six columns
      altContainer.style.width = 'auto';
      if (altKeys.length <= 6) altContainer.style.height = '56px'; // 1 row
      else if (altKeys.length <= 12)
        altContainer.style.height = '108px'; // 2 rows
      else if (altKeys.length <= 18)
        altContainer.style.height = '205px'; // 3 rows
      else altContainer.classList.add('compact');
    }

    const top =
      (position.top - altContainer.clientHeight + 5).toString() + 'px';
    const left =
      Math.max(
        0,
        Math.min(
          window.innerWidth - altContainer.offsetWidth,
          (position.left + position.right - altContainer.offsetWidth) / 2
        )
      ) + 'px';
    altContainer.style.transform = 'translate(' + left + ',' + top + ')';
    altContainer.classList.add('is-visible');
  }

  return false;
}

export function hideAlternateKeys(): boolean {
  const altContainer = document.querySelector<HTMLElement>(
    '#mathlive-alternate-keys-panel'
  );
  if (altContainer) {
    altContainer.classList.remove('is-visible');
    altContainer.innerHTML = '';
  }

  Scrim.scrim?.close();

  return false;
}

export class VirtualKeyboard implements VirtualKeyboardInterface {
  options: CombinedVirtualKeyboardOptions;
  _visible: boolean;
  _element?: HTMLDivElement;
  originalContainerBottomPadding: string | null = null;
  private readonly _mathfield?: MathfieldPrivate;

  coreStylesheet: Stylesheet | null;
  virtualKeyboardStylesheet: Stylesheet | null;

  constructor(options: CombinedVirtualKeyboardOptions, mathfield?: Mathfield) {
    this.options = options;
    this.visible = false;
    this._mathfield = mathfield as MathfieldPrivate;
    this.coreStylesheet = null;
    this.virtualKeyboardStylesheet = null;
  }

  setOptions(options: CombinedVirtualKeyboardOptions): void {
    let currentKeyboardName = '';
    if (this._element) {
      const currentKeyboard = this._element.querySelector(
        'div.keyboard-layer.is-visible'
      );
      if (currentKeyboard)
        currentKeyboardName = currentKeyboard.getAttribute('data-layer') ?? '';
      this._element.remove();
      this._element = undefined;
    }
    this.options = options;

    if (this.visible) {
      this.buildAndAttachElement(options.virtualKeyboardTheme);

      // Restore the active keyboard
      const newActive = this.element!.querySelector(
        `.keyboard-layer[data-layer="${currentKeyboardName}"]`
      );
      if (newActive) {
        this.element!.querySelector(
          '.keyboard-layer.is-visible'
        )?.classList.remove('is-visible');
        newActive.classList.add('is-visible');
      }

      // Show the keyboard panel
      this.element!.classList.add('is-visible');
    }
  }

  get element(): HTMLDivElement | undefined {
    return this._element;
  }
  set element(val: HTMLDivElement | undefined) {
    if (this._element === val) return;
    this._element?.remove();
    this._element = val;
  }
  get visible(): boolean {
    return this._visible;
  }
  set visible(val: boolean) {
    this._visible = val;
  }

  get height(): number {
    return this.element?.offsetHeight ?? 0;
  }

  buildAndAttachElement(theme?: VirtualKeyboardTheme): void {
    this.element = makeKeyboardElement(this, theme ?? '');
    on(this.element, 'mousedown', () => this.focusMathfield());
    this.options.virtualKeyboardContainer?.appendChild(this.element);
  }

  handleEvent(evt: Event): void {
    if (!this.element) return;

    switch (evt.type) {
      case 'mouseup':
      case 'blur':
      case 'touchend':
      case 'touchcancel':
        // Safari on iOS will aggressively attempt to select when there is a long
        // press. Restore the userSelect on mouse up
        document.body.style.userSelect = '';

        unshiftKeyboardLayer(this);
        break;
    }
  }

  focusMathfield(): void {
    this._mathfield?.focus?.();
  }

  blurMathfield(): void {
    this._mathfield?.blur?.();
  }

  stateChanged(): void {
    this._mathfield?.element?.dispatchEvent(
      new Event('virtual-keyboard-toggle', {
        bubbles: true,
        cancelable: false,
        composed: true,
      })
    );
  }

  executeCommand(
    command: SelectorPrivate | [SelectorPrivate, ...any[]]
  ): boolean {
    let selector: SelectorPrivate;
    let args: string[] = [];
    if (isArray(command)) {
      selector = command[0];
      args = command.slice(1);
    } else selector = command;

    // Convert kebab case (like-this) to camel case (likeThis).
    selector = selector.replace(/-\w/g, (m) =>
      m[1].toUpperCase()
    ) as SelectorPrivate;
    if (COMMANDS[selector]?.target === 'virtual-keyboard')
      return COMMANDS[selector]!.fn(this, ...args);

    return (
      this._mathfield?.executeCommand(
        command as Selector | [Selector, ...any[]]
      ) ?? false
    );
  }

  create(): void {
    if (!this.virtualKeyboardStylesheet) {
      if (!VIRTUAL_KEYBOARD_STYLESHEET_HASH) {
        VIRTUAL_KEYBOARD_STYLESHEET_HASH = hashCode(
          VIRTUAL_KEYBOARD_STYLESHEET
        ).toString(36);
      }
      this.virtualKeyboardStylesheet = injectStylesheet(
        null,
        VIRTUAL_KEYBOARD_STYLESHEET,
        VIRTUAL_KEYBOARD_STYLESHEET_HASH
      );
    }
    if (!this.coreStylesheet) {
      this.coreStylesheet = injectStylesheet(
        null,
        CORE_STYLESHEET,
        hashCode(CORE_STYLESHEET).toString(36)
      );
    }
    if (this.options.fontsDirectory !== null)
      void loadFonts(this.options.fontsDirectory);
  }

  enable(): void {
    // Listen to know when the mouse has been released without being
    // captured to remove the alternate keys panel and the shifted state of the
    // keyboard.
    // Note that we need to listen on the window to capture events happening
    // outside the virtual keyboard.
    window.addEventListener('mouseup', this);
    window.addEventListener('blur', this);
  }

  disable(): void {
    window.removeEventListener('mouseup', this);
    window.removeEventListener('blur', this);
  }

  dispose(): void {}
}

const KEYBOARDS: Record<string, VirtualKeyboardDefinition> = {
  numeric: {
    tooltip: 'keyboard.tooltip.numeric',
    layer: 'math',
    label: '123',
    layers: ['math'],
  },
  roman: {
    tooltip: 'keyboard.tooltip.roman',
    layer: 'lower-roman',
    label: 'ABC',
    layers: ['lower-roman', 'upper-roman'],
  },
  greek: {
    tooltip: 'keyboard.tooltip.greek',
    layer: 'lower-greek',
    label: '&alpha;&beta;&gamma;',
    classes: 'tex-math',
    layers: ['lower-greek', 'upper-greek'],
  },
  functions: {
    tooltip: 'keyboard.tooltip.functions',
    layer: 'functions',
    label: '<i>f</i>&thinsp;()',
    classes: 'tex',
    layers: ['functions'],
  },
  symbols: {
    tooltip: 'keyboard.tooltip.symbols',
    layer: 'symbols',
    label: '&infin;≠∈',
    classes: 'tex',
    layers: ['symbols'],
  },
};

const SHIFTED_KEYS = {
  '\\varphi ': ['&Phi;', '\\Phi '],
  '\\varsigma ': ['&Sigma;', '\\Sigma '],
  '\\epsilon ': ['&#x0190;', '\\char"0190'],
  '\\rho ': ['&#x3A1', '\\char"3A1'],
  '\\tau ': ['&#x3A4;', '\\char"3A4'],
  '\\upsilon ': ['&Upsilon;', '\\Upsilon '],
  '\\theta ': ['&Theta;', '\\Theta '],
  '\\iota ': ['&Iota;', '\\char"399'],
  '\\omicron ': ['&#x039F;', '\\char"39F'],
  '\\pi ': ['&Pi;', '\\Pi '],
  '\\alpha ': ['&Alpha;', '\\char"391'],
  '\\sigma ': ['&Sigma;', '\\Sigma '],
  '\\delta ': ['&Delta;', '\\Delta '],
  '\\phi ': ['&#x03a6;', '\\Phi '],
  '\\gamma ': ['&Gamma;', '\\Gamma '],
  '\\eta ': ['&Eta;', '\\char"397'],
  '\\xi ': ['&Xi;', '\\Xi '],
  '\\kappa ': ['&Kappa;', '\\char"39A'],
  '\\lambda ': ['&Lambda;', '\\Lambda '],
  '\\zeta ': ['&Zeta;', '\\char"396'],
  '\\chi ': ['&Chi;', '\\char"3A7'],
  '\\psi ': ['&Psi;', '\\Psi '],
  '\\omega ': ['&Omega;', '\\Omega '],
  '\\beta ': ['&Beta;', '\\char"392'],
  '\\nu ': ['&Nu;', '\\char"39D'],
  '\\mu ': ['&Mu;', '\\char"39C'],
};

const ALT_KEYS_BASE: {
  [altKeycapSetId: string]: (string | Partial<VirtualKeyboardKeycap>)[];
} = {
  '0': [
    '\\emptyset',
    '\\varnothing',
    '\\infty',
    { latex: '#?_0', insert: '#@_0' },
    '\\circ',
    '\\bigcirc',
    '\\bullet',
  ],
  '2': ['\\frac{1}{2}', { latex: '#?^2', insert: '#@^2' }],
  '3': ['\\frac{1}{3}', { latex: '#?^3', insert: '#@^3' }],
  '.': [
    '.',
    ',',
    ';',
    '\\colon',
    { latex: ':', aside: 'ratio' },
    { latex: '\\cdotp', aside: 'center dot', class: 'box' },
    { latex: '\\cdots', aside: 'center ellipsis', class: 'box' },
    { latex: '\\ldotp', aside: 'low dot', class: 'box' },
    { latex: '\\ldots', aside: 'low ellipsis', class: 'box' },
    { latex: '\\vdots', aside: '', class: 'box' },
    { latex: '\\ddots', aside: '', class: 'box' },
    '\\odot',
    '\\oslash',
    '\\circledcirc',
  ],

  '*': [
    '\\cdot',
    '\\ast',
    '\\star',
    '\\bigstar',
    '\\ltimes',
    '\\rtimes',
    '\\rightthreetimes',
    '\\leftthreetimes',
    '\\intercal',
    '\\prod',
    { latex: '\\prod_{n\\mathop=0}^{\\infty}', class: 'small' },
  ],

  '+': [
    '\\pm',
    '\\mp',
    '\\sum',
    { latex: '\\sum_{n\\mathop=0}^{\\infty}', class: 'small' },
    '\\dotplus',
    '\\oplus',
  ],
  '-': ['\\pm', '\\mp', '\\ominus', '\\vert #0  \\vert'],

  '/': ['\\divideontimes', '/', '\\div', '\\%'],

  '(': [
    '\\left( #0\\right)',
    '\\left[ #0\\right]',
    '\\left\\{ #0\\right\\}',
    '\\left\\langle #0\\right\\rangle',
    '\\lfloor',
    '\\llcorner',
    '(',
    '\\lbrack',
    '\\lvert',
    '\\lVert',
    '\\lgroup',
    '\\langle',
    '\\lceil',
    '\\ulcorner',
    '\\lmoustache',
    '\\lbrace',
  ],

  ')': [
    '\\rfloor',
    '\\lrcorner',
    ')',
    '\\rbrack',
    '\\rvert',
    '\\rVert',
    '\\rgroup',
    '\\rangle',
    '\\rceil',
    '\\urcorner',
    '\\rmoustache',
    '\\rbrace',
  ],

  '=': [
    '\\cong',
    '\\asymp',
    '\\equiv',
    '\\differencedelta',
    '\\varpropto',
    '\\thickapprox',
    '\\approxeq',
    '\\thicksim',
    '\\backsim',
    '\\eqsim',
    '\\simeq',
    '\\Bumpeq',
    '\\bumpeq',
    '\\doteq',
    '\\Doteq',
    '\\fallingdotseq',
    '\\risingdotseq',
    '\\coloneq',
    '\\eqcirc',
    '\\circeq',
    '\\triangleq',
    '\\between',
  ],

  '!=': ['\\neq', '\\ncong', '', '\\nsim'],

  '<': [
    '\\leq',
    '\\leqq',
    '\\lneqq',
    '\\ll',

    '\\lessgtr',
    '\\nless',
    '\\nleq',
    '\\lesssim',

    '\\precsim',
    '\\prec',
    '\\nprec',
    '\\preccurlyeq',

    '\\lessdot',
  ],

  '>': [
    '\\geq',
    '\\geqq',
    '\\gneqq',
    '\\gg',

    '\\gtrless',
    '\\ngtr',
    '\\ngeq',
    '\\gtrsim',

    '\\succsim',
    '\\succ',
    '\\nsucc',
    '\\succcurlyeq',

    '\\gtrdot',
  ],

  'in': ['\\owns'],
  '!in': ['\\backepsilon'],

  'subset': ['\\subseteq', '\\nsubset', '\\nsubseteq'],
  'superset': ['\\supseteq', '\\nsupset', '\\nsupseteq'],

  'infinity': ['\\aleph_0', '\\aleph_1', '\\omega', '\\mathfrak{m}'],

  'numeric-pi': ['\\prod', '\\theta', '\\rho', '\\sin', '\\cos', '\\tan'],

  'ee': ['\\times 10^{#?}', '\\ln', '\\log_{10}', '\\log'],

  '^': ['_{#?}'],

  // Integrals
  'int': [
    { latex: '\\int_{#?}^{#?}', class: 'small' },
    { latex: '\\int', class: 'small' },
    { latex: '\\smallint', class: 'small' },
    { latex: '\\iint', class: 'small' },
    { latex: '\\iiint', class: 'small' },
    { latex: '\\oint', class: 'small' },
    { latex: '\\dfrac{\\rd}{\\rd x}', class: 'small' },
    { latex: '\\frac{\\partial}{\\partial x}', class: 'small' },

    '\\capitalDifferentialD',
    '\\rd',
    '\\partial',
  ],

  'nabla': ['\\nabla\\times', '\\nabla\\cdot', '\\nabla^{2}'],

  '!': ['!!', '\\Gamma', '\\Pi'],
  'accents': [
    '\\bar{#@}',
    '\\vec{#@}',
    '\\hat{#@}',
    '\\check{#@}',
    '\\dot{#@}',
    '\\ddot{#@}',
    '\\mathring{#@}',
    '\\breve{#@}',
    '\\acute{#@}',
    '\\tilde{#@}',
    '\\grave{#@}',
  ],
  'underline': [
    '\\underbrace{#@}',
    '\\underlinesegment{#@}',
    '\\underleftrightarrow{#@}',
    '\\underrightarrow{#@}',
    '\\underleftarrow{#@}',
    '\\undergroup{#@}',
  ],
  'overline': [
    '\\overbrace{#@}',
    '\\overlinesegment{#@}',
    '\\overleftrightarrow{#@}',
    '\\overrightarrow{#@}',
    '\\overleftarrow{#@}',
    '\\overgroup{#@}',
  ],

  'xleftarrows': [
    '\\xlongequal{#@}',
    '\\xleftrightarrow{#@}',
    '\\xLeftrightarrow{#@}',
    '\\xleftrightharpoons{#@}',
    '\\xLeftarrow{#@}',
    '\\xleftharpoonup{#@}',
    '\\xleftharpoondown{#@}',
    '\\xtwoheadleftarrow{#@}',
    '\\xhookleftarrow{#@}',
    '\\xtofrom{#@}',
    '\\xleftequilibrium{#@}', // From mhchem.sty package
    '\\xrightleftarrows{#@}', // From mhchem.sty package
  ],
  'xrightarrows': [
    '\\xrightarrow{#@}',
    '\\xlongequal{#@}',
    '\\xleftrightarrow{#@}',
    '\\xLeftrightarrow{#@}',
    '\\xleftrightharpoons{#@}',
    '\\xRightarrow{#@}',
    '\\xrightharpoonup{#@}',
    '\\xrightharpoondown{#@}',
    '\\xtwoheadrightarrow{#@}',
    '\\xrightleftharpoons{#@}',
    '\\xhookrightarrow{#@}',
    '\\xmapsto{#@}',
    '\\xrightequilibrium{#@}', // From mhchem.sty package
    '\\xrightleftarrows{#@}', // From mhchem.sty package
  ],

  // 'absnorm': [{latex:'\\lVert #@ \\rVert', aside:'norm'},
  //     {latex:'\\lvert #@ \\rvert', aside:'determinant'},
  //     {latex:'\\begin{cardinality} #@ \\end{cardinality}', aside:'cardinality'},
  //     {latex:'\\lvert #@ \\rvert', aside:'length'},
  //     {latex:'\\lvert #@ \\rvert', aside:'order'},

  // ],
  'A': [
    { latex: '\\aleph', aside: 'aleph' },
    { latex: '\\forall', aside: 'for all' },
  ],
  'a': [
    { latex: '\\aleph', aside: 'aleph' },
    { latex: '\\forall', aside: 'for all' },
  ],
  'b': [{ latex: '\\beth', aside: 'beth' }],
  'B': [{ latex: '\\beth', aside: 'beth' }],
  'c': [{ latex: '\\C', aside: 'set of complex numbers' }],
  'd': [{ latex: '\\daleth', aside: 'daleth' }],
  'D': [{ latex: '\\daleth', aside: 'daleth' }],
  'e': [
    { latex: '\\exponentialE', aside: 'exponential e' },
    { latex: '\\exists', aside: 'there is' },
    { latex: '\\nexists', aside: 'there isn’t' },
  ],
  'g': [{ latex: '\\gimel', aside: 'gimel' }],
  'G': [{ latex: '\\gimel', aside: 'gimel' }],
  'h': [
    { latex: '\\hbar', aside: 'h bar' },
    { latex: '\\hslash', aside: 'h slash' },
  ],
  'i': [{ latex: '\\imaginaryI', aside: 'imaginary i' }],
  'j': [{ latex: '\\imaginaryJ', aside: 'imaginary j' }],
  'l': [{ latex: '\\ell', aside: 'ell' }],
  'n': [{ latex: '\\mathbb{N}', aside: 'set of natural numbers' }],
  'p': [{ latex: '\\mathbb{P}', aside: 'set of primes' }],
  'q': [{ latex: '\\mathbb{Q}', aside: 'set of rational numbers' }],
  'r': [{ latex: '\\mathbb{R}', aside: 'set of real numbers' }],
  'z': [{ latex: '\\mathbb{Z}', aside: 'set of integers' }],

  'x-var': [
    'y',
    'z',
    't',
    'r',
    { latex: 'f(#?)', class: 'small' },
    { latex: 'g(#?)', class: 'small' },
    'x^2',
    'x^n',
    'x_n',
    'x_{n+1}',
    'x_i',
    'x_{i+1}',
  ],
  'n-var': ['i', 'j', 'p', 'k', 'a', 'u'],
  'ii': ['\\Re', '\\Im', '\\imaginaryJ', '\\Vert #0 \\Vert'],

  'logic': [
    { latex: '\\exists', aside: 'there is' },
    { latex: '\\nexists', aside: 'there isn’t' },

    { latex: '\\ni', aside: 'such that' },
    { latex: '\\Colon', aside: 'such that' },

    { latex: '\\implies', aside: 'implies' },
    { latex: '\\impliedby', aside: 'implied by' },

    { latex: '\\iff', aside: 'if and only if' },

    { latex: '\\land', aside: 'and' },
    { latex: '\\lor', aside: 'or' },
    { latex: '\\oplus', aside: 'xor' },
    { latex: '\\lnot', aside: 'not' },

    { latex: '\\downarrow', aside: 'nor' },
    { latex: '\\uparrow', aside: 'nand' },

    { latex: '\\curlywedge', aside: 'nor' },
    { latex: '\\bar\\curlywedge', aside: 'nand' },

    // {latex:'\\barwedge', aside:'bar wedge'},
    // {latex:'\\curlyvee', aside:'curly vee'},
    // {latex:'\\veebar', aside:'vee bar'},

    { latex: '\\therefore', aside: 'therefore' },
    { latex: '\\because', aside: 'because' },

    { latex: '^\\biconditional', aside: 'biconditional' },

    '\\leftrightarrow',
    '\\Leftrightarrow',
    '\\to',
    '\\models',
    '\\vdash',
    '\\gets',
    '\\dashv',
    '\\roundimplies',
  ],

  'set-operators': [
    '\\cap',
    '\\cup',
    '\\setminus',
    '\\smallsetminus',
    '\\complement',
  ],

  'set-relations': [
    '\\in',
    '\\notin',
    '\\ni',
    '\\owns',
    '\\subset',
    '\\supset',
    '\\subseteq',
    '\\supseteq',
    '\\subsetneq',
    '\\supsetneq',
    '\\varsubsetneq',
    '\\subsetneqq',
    '\\nsubset',
    '\\nsupset',
    '\\nsubseteq',
    '\\nsupseteq',
  ],

  'space': [
    {
      latex: '\\char"203A\\!\\char"2039',
      insert: '\\!',
      aside: 'negative thin space<br>⁻³⧸₁₈ em',
    },
    {
      latex: '\\unicode{"203A}\\,\\unicode{"2039}',
      insert: '\\,',
      aside: 'thin space<br>³⧸₁₈ em',
    },
    {
      latex: '\\unicode{"203A}\\:\\unicode{"2039}',
      insert: '\\:',
      aside: 'medium space<br>⁴⧸₁₈ em',
    },
    {
      latex: '\\unicode{"203A}\\;\\unicode{"2039}',
      insert: '\\;',
      aside: 'thick space<br>⁵⧸₁₈ em',
    },
    {
      latex: '\\unicode{"203A}\\ \\unicode{"2039}',
      insert: '\\ ',
      aside: '⅓ em',
    },
    {
      latex: '\\unicode{"203A}\\enspace\\unicode{"2039}',
      insert: '\\enspace',
      aside: '½ em',
    },
    {
      latex: '\\unicode{"203A}\\quad\\unicode{"2039}',
      insert: '\\quad',
      aside: '1 em',
    },
    {
      latex: '\\unicode{"203A}\\qquad\\unicode{"2039}',
      insert: '\\qquad',
      aside: '2 em',
    },
  ],

  // @todo could also delete to end
  'delete': [
    {
      label:
        '<span class="warning"><svg class="svg-glyph"><use xlink:href="#svg-trash" /></svg></span>',
      command: 'deleteAll',
    },
  ],

  // @todo Tab: could turn on speech, visible keyboard...
  '->|': [],
};
let ALT_KEYS = {};

const LAYERS = {
  'math': `
        <div class='rows'>
            <ul>
                <li class='keycap tex' data-alt-keys='x-var'><i>x</i></li>
                <li class='keycap tex' data-alt-keys='n-var'><i>n</i></li>
                <li class='separator w5'></li>
                <row name='numpad-1'/>
                <li class='separator w5'></li>
                <li class='keycap tex' data-latex='\\exponentialE' data-alt-keys='ee'>e</li>
                <li class='keycap tex' data-latex='\\imaginaryI' data-alt-keys='ii'>i</li>
                <li class='keycap tex' data-latex='\\pi' data-alt-keys='numeric-pi'></li>
            </ul>
            <ul>
                <li class='keycap tex' data-key='<' data-alt-keys='<'>&lt;</li>
                <li class='keycap tex' data-key='>' data-alt-keys='>'>&gt;</li>
                <li class='separator w5'></li>
                <row name='numpad-2'/>
                <li class='separator w5'></li>
                <li class='keycap tex' data-latex='#@^{2}' data-latex='x^2'></li>
                <li class='keycap tex' data-alt-keys='^' data-insert='#@^{#?}' data-latex='x^\\placeholder'></li>
                <li class='keycap tex small' data-insert='\\sqrt{#0}' data-latex='\\sqrt{#0}'></li>
            </ul>
            <ul>
                <li class='keycap tex' data-alt-keys='(' >(</li>
                <li class='keycap tex' data-alt-keys=')' >)</li>
                <li class='separator w5'></li>
                <row name='numpad-3'/>
                <li class='separator w5'></li>
                <li class='keycap small' data-alt-keys='int' data-latex='\\int_0^\\infty'></li>
                <li class='keycap' data-latex='\\forall' data-alt-keys='logic' ></li>
                <li class='action font-glyph bottom right' data-alt-keys='delete' data-command='["performWithFeedback","deleteBackward"]'><svg class="svg-glyph"><use xlink:href="#svg-delete-backward" /></svg></li></ul>
            </ul>
            <ul>
                <li class='keycap' data-alt-keys='foreground-color' data-command='["applyStyle",{"color":"red"}]'><span style='border-radius: 50%;width:22px;height:22px; border: 3px solid #cc2428; box-sizing: border-box'></span></li>
                <li class='keycap' data-alt-keys='background-color' data-command='["applyStyle",{"backgroundColor":"yellow"}]'><span style='border-radius: 50%;width:22px;height:22px; background:#fff590; box-sizing: border-box'></span></li>
                <li class='separator w5'></li>
                <row name='numpad-4'/>
                <li class='separator w5'></li>
                <arrows/>
            </ul>
        </div>
    `,
  'lower-roman': `
        <div class='rows'>
            <ul>
                <row name='numpad-1' class='if-wide'/>
                <row name='lower-1' shift-layer='upper-roman'/>
            </ul>
            <ul>
                <row name='numpad-2' class='if-wide'/>
                <row name='lower-2'  shift-layer='upper-roman''/>
            </ul>
            <ul>
                <row name='numpad-3' class='if-wide'/>
                <row name='lower-3'  shift-layer='upper-roman''/>
            </ul>
            <ul>
                <row name='numpad-4' class='if-wide'/>
                <li class='keycap' >;</li>
                <li class='keycap' >,</li>
                <li class='keycap w50' data-key=' ' data-alt-keys='space'>&nbsp;</li>
                <arrows/>
            </ul>
        </div>`,
  'upper-roman': `
        <div class='rows'>
            <ul>
                <row name='numpad-1' class='if-wide'/>
                <row name='upper-1'  shift-layer='lower-roman'/>
            </ul>
            <ul>
                <row name='numpad-2' class='if-wide'/>
                <row name='upper-2' shift-layer='lower-roman'/>
            </ul>
            <ul>
                <row name='numpad-3' class='if-wide'/>
                <row name='upper-3' shift-layer='lower-roman'/>
            </ul>
            <ul>
                <row name='numpad-4' class='if-wide'/>
                <li class='keycap' >;</li>
                <li class='keycap' data-alt-keys='.'>;</li>
                <li class='keycap w50' data-key=' '>&nbsp;</li>
                <arrows/>
            </ul>
        </div>`,
  'symbols': `
        <div class='rows'>
            <ul>
                <row name='numpad-1' class='if-wide'/>
                <li class='keycap tex' data-alt-keys='(' data-insert='\\lbrace '>{</li>
                <li class='keycap tex' data-alt-keys=')' data-insert='\\rbrace '>}</li>
                <li class='separator w5'></li>
                <li class='keycap tex small' data-alt-keys='xleftarrows' data-latex='\\leftarrow' ></li>
                <li class='keycap tex small' data-alt-keys='xrightarrows' data-latex='\\rightarrow' ></li>
                <li class='keycap tex' data-alt-keys='overline' data-latex='\\overline{#@}' data-aside='overline'></li>
                <li class='keycap tex' data-alt-keys='underline' data-latex='\\underline{#@}' data-aside='underline'></li>
                <li class='keycap w15' data-insert='\\ulcorner#0\\urcorner '><span><sup>&#x250c;</sup><span><span style='color:#ddd'>o</span><sup>&#x2510;</sup></span><aside>ceil</aside></li>
                <li class='keycap tex' data-alt-keys='nabla' data-insert='\\nabla '>&#x2207;<aside>nabla</aside></li>
                <li class='keycap tex' data-alt-keys='infinity' data-insert='\\infty '>&#x221e;</li>

            </ul>
            <ul>
                <row name='numpad-2' class='if-wide'/>
                <li class='keycap tex' data-alt-keys='(' data-insert='\\lbrack '>[</li>
                <li class='keycap tex' data-alt-keys=')' data-insert='\\rbrack '>]</li>
                <li class='separator w5'></li>

                <li class='keycap tex' data-alt-keys='in' data-insert='\\in '>&#x2208;</li>
                <li class='keycap tex' data-alt-keys='!in' data-insert='\\notin '>&#x2209;</li>
                <li class='keycap tex' data-insert='\\Re '>&#x211c;<aside>Real</aside></li>
                <li class='keycap tex' data-insert='\\Im '>&#x2111;<aside>Imaginary</aside></li>
                <li class='keycap w15' data-insert='\\llcorner#0\\lrcorner '><span><sub>&#x2514;</sub><span style='color:#ddd'>o</span><sub>&#x2518;</sub></span><aside>floor</aside></li>

                <li class='keycap tex' data-insert='\\partial '>&#x2202;<aside>partial<br>derivative</aside></li>
                <li class='keycap tex' data-insert='\\emptyset '>&#x2205;<aside>empty set</aside></li>

            </ul>
            <ul>
                <row name='numpad-3' class='if-wide'/>
                <li class='keycap tex' data-alt-keys='(' data-insert='\\langle '>&#x27e8;</li>
                <li class='keycap tex' data-alt-keys=')' data-insert='\\rangle '>&#x27e9;</li>
                <li class='separator w5'></li>
                <li class='keycap tex' data-alt-keys='subset' data-insert='\\subset '>&#x2282;</li>
                <li class='keycap tex' data-alt-keys='superset' data-insert='\\supset '>&#x2283;</li>

                <li class='keycap tex' data-alt-keys='accents' data-insert='\\vec{#@}' data-latex='\\vec{#?}' data-aside='vector'></li>
                <li class='keycap tex' data-alt-keys='absnorm' data-insert='\\left| #0 \\right|' data-latex='\\left| #? \\right|' data-aside='abs'></li>

                <li class='keycap tex' data-key='!' data-alt-keys='!'>!<aside>factorial</aside></li>
                <li class='keycap' data-latex='^{\\prime} '><span><sup><span><span style='color:#ddd'>o</span>&#x2032</sup></span><aside>prime</aside></li>

                <li class='action font-glyph bottom right w15'
                    data-shifted='<span class="warning"><svg class="svg-glyph"><use xlink:href="#svg-trash" /></svg></span>'
                    data-shifted-command='"deleteAll"'
                    data-alt-keys='delete' data-command='["performWithFeedback","deleteBackward"]'
                ><svg class="svg-glyph"><use xlink:href="#svg-delete-backward" /></svg></li>
            </ul>
            <ul>
                <row name='numpad-4' class='if-wide'/>
                <li class='keycap tex' data-insert=','>,</li>
                <li class='keycap tex' data-insert='\\cdot '>&#x22c5;<aside>centered dot</aside></li>
                <li class='keycap tex' data-insert='\\colon '>:<aside>colon</aside></li>
                <li class='keycap tex' data-insert='\\circ '>&#x2218;<aside>circle</aside></li>
                <li class='keycap tex' data-insert='\\approx '>&#x2248;<aside>approx.</aside></li>
                <li class='keycap tex' data-insert='\\ne '>&#x2260;</li>
                <li class='keycap tex' data-insert='\\pm '>&#x00b1;</li>
                <arrows/>
            </ul>
        </div>`,
  'lower-greek': `
        <div class='rows'>
            <ul><li class='keycap tex' data-insert='\\varphi '><i>&#x03c6;</i><aside>phi var.</aside></li>
                <li class='keycap tex' data-insert='\\varsigma '><i>&#x03c2;</i><aside>sigma var.</aside></li>
                <li class='keycap tex' data-insert='\\epsilon '><i>&#x03f5;</i></li>
                <li class='keycap tex' data-insert='\\rho '><i>&rho;</i></li>
                <li class='keycap tex' data-insert='\\tau '><i>&tau;</i></li>
                <li class='keycap tex' data-insert='\\upsilon '><i>&upsilon;</i></li>
                <li class='keycap tex' data-insert='\\theta '><i>&theta;</i></li>
                <li class='keycap tex' data-insert='\\iota '><i>&iota;</i></li>
                <li class='keycap tex' data-insert='\\omicron '>&omicron;</i></li>
                <li class='keycap tex' data-insert='\\pi '><i>&pi;</i></li>
            </ul>
            <ul><li class='keycap tex' data-insert='\\alpha ' data-shifted='&Alpha;' data-shifted-command='["insert","\\\\char\\"391"]'><i>&alpha;</i></li>
                <li class='keycap tex' data-insert='\\sigma '><i>&sigma;</i></li>
                <li class='keycap tex' data-insert='\\delta '><i>&delta;</i></li>
                <li class='keycap tex' data-insert='\\phi '><i>&#x03d5;</i></i></li>
                <li class='keycap tex' data-insert='\\gamma '><i>&gamma;</i></li>
                <li class='keycap tex' data-insert='\\eta '><i>&eta;</i></li>
                <li class='keycap tex' data-insert='\\xi '><i>&xi;</i></li>
                <li class='keycap tex' data-insert='\\kappa '><i>&kappa;</i></li>
                <li class='keycap tex' data-insert='\\lambda '><i>&lambda;</i></li>
            </ul>
            <ul><li class='shift modifier font-glyph bottom left w15 layer-switch' data-layer='upper-greek'><svg class="svg-glyph"><use xlink:href="#svg-shift" /></svg></li>
                <li class='keycap tex' data-insert='\\zeta '><i>&zeta;</i></li>
                <li class='keycap tex' data-insert='\\chi '><i>&chi;</i></li>
                <li class='keycap tex' data-insert='\\psi '><i>&psi;</i></li>
                <li class='keycap tex' data-insert='\\omega '><i>&omega;</i></li>
                <li class='keycap tex' data-insert='\\beta '><i>&beta;</i></li>
                <li class='keycap tex' data-insert='\\nu '><i>&nu;</i></li>
                <li class='keycap tex' data-insert='\\mu '><i>&mu;</i></li>
                <li class='action font-glyph bottom right w15'
                    data-shifted='<span class="warning"><svg class="svg-glyph"><use xlink:href="#svg-trash" /></svg></span>'
                    data-shifted-command='"deleteAll"'
                    data-alt-keys='delete' data-command='["performWithFeedback","deleteBackward"]'
                ><svg class="svg-glyph"><use xlink:href="#svg-delete-backward" /></svg></li>
            </ul>
            <ul>
                <li class='keycap ' data-key=' '>&nbsp;</li>
                <li class='keycap'>,</li>
                <li class='keycap tex' data-insert='\\varepsilon '><i>&#x03b5;</i><aside>epsilon var.</aside></li>
                <li class='keycap tex' data-insert='\\vartheta '><i>&#x03d1;</i><aside>theta var.</aside></li>
                <li class='keycap tex' data-insert='\\varkappa '><i>&#x3f0;</i><aside>kappa var.</aside></li>
                <li class='keycap tex' data-insert='\\varpi '><i>&#x03d6;<aside>pi var.</aside></i></li>
                <li class='keycap tex' data-insert='\\varrho '><i>&#x03f1;</i><aside>rho var.</aside></li>
                <arrows/>
            </ul>
        </div>`,
  'upper-greek': `
        <div class='rows'>
            <ul><li class='keycap tex' data-insert='\\Phi '>&Phi;<aside>phi</aside></li>
                <li class='keycap tex' data-insert='\\Sigma '>&Sigma;<aside>sigma</aside></li>
                <li class='keycap tex' data-insert='\\char"0190'>&#x0190;<aside>epsilon</aside></li>
                <li class='keycap tex' data-insert='\\char"3A1'>&#x3A1;<aside>rho</aside></li>
                <li class='keycap tex' data-insert='\\char"3A4'>&#x3A4;<aside>tau</aside></li>
                <li class='keycap tex' data-insert='\\Upsilon '>&Upsilon;<aside>upsilon</aside></li>
                <li class='keycap tex' data-insert='\\Theta '>&Theta;<aside>theta</aside></li>
                <li class='keycap tex' data-insert='\\char"399'>&Iota;<aside>iota</aside></li>
                <li class='keycap tex' data-insert='\\char"39F'>&#x039F;<aside>omicron</aside></li>
                <li class='keycap tex' data-insert='\\Pi '>&Pi;<aside>pi</aside></li></ul>
            <ul><li class='keycap tex' data-insert='\\char"391'>&#x391;<aside>alpha</aside></li>
                <li class='keycap tex' data-insert='\\Sigma '>&Sigma;<aside>sigma</aside></li>
                <li class='keycap tex' data-insert='\\Delta '>&Delta;<aside>delta</aside></li>
                <li class='keycap tex' data-insert='\\Phi '>&#x03a6;<aside>phi</aside></li>
                <li class='keycap tex' data-insert='\\Gamma '>&Gamma;<aside>gamma</aside></li>
                <li class='keycap tex' data-insert='\\char"397'>&Eta;<aside>eta</aside></li>
                <li class='keycap tex' data-insert='\\Xi '>&Xi;<aside>xi</aside></li>
                <li class='keycap tex' data-insert='\\char"39A'>&Kappa;<aside>kappa</aside></li>
                <li class='keycap tex' data-insert='\\Lambda '>&Lambda;<aside>lambda</aside></li></ul>
            <ul><li class='shift modifier font-glyph bottom left selected w15 layer-switch' data-layer='lower-greek'><svg class="svg-glyph"><use xlink:href="#svg-shift" /></svg></li>
                <li class='keycap tex' data-insert='\\char"396'>&Zeta;<aside>zeta</aside></li>
                <li class='keycap tex' data-insert='\\char"3A7'>&Chi;<aside>chi</aside></li>
                <li class='keycap tex' data-insert='\\Psi '>&Psi;<aside>psi</aside></li>
                <li class='keycap tex' data-insert='\\Omega '>&Omega;<aside>omega</aside></li>
                <li class='keycap tex' data-insert='\\char"392'>&Beta;<aside>beta</aside></li>
                <li class='keycap tex' data-insert='\\char"39D'>&Nu;<aside>nu</aside></li>
                <li class='keycap tex' data-insert='\\char"39C'>&Mu;<aside>mu</aside></li>
                <li class='action font-glyph bottom right w15' data-command='["performWithFeedback","deleteBackward"]'><svg class="svg-glyph"><use xlink:href="#svg-delete-backward" /></svg></li></ul>
            <ul>
                <li class='separator w10'>&nbsp;</li>
                <li class='keycap'>.</li>
                <li class='keycap w50' data-key=' '>&nbsp;</li>
                <arrows/>
            </ul>
        </div>`,

  'functions': `
        <div class='rows'>
            <ul><li class='separator'></li>
                <li class='fnbutton' data-insert='\\sin'></li>
                <li class='fnbutton' data-insert='\\sin^{-1}'></li>
                <li class='fnbutton' data-insert='\\ln'></li>
                <li class='fnbutton' data-insert='\\exponentialE^{#?}'></li>
                <li class='bigfnbutton' data-insert='\\operatorname{lcm}(#?)' data-latex='\\operatorname{lcm}()'></li>
                <li class='bigfnbutton' data-insert='\\operatorname{ceil}(#?)' data-latex='\\operatorname{ceil}()'></li>
                <li class='bigfnbutton' data-insert='\\lim_{n\\to\\infty}'></li>
                <li class='bigfnbutton' data-insert='\\int'></li>
                <li class='bigfnbutton' data-insert='\\operatorname{abs}(#?)' data-latex='\\operatorname{abs}()'></li>
            </ul>
            <ul><li class='separator'></li>
                <li class='fnbutton' data-latex='\\cos'></li>
                <li class='fnbutton' data-latex='\\cos^{-1}'></li>
                <li class='fnbutton' data-latex='\\log'></li>
                <li class='fnbutton' data-latex='10^{#?}'></li>
                <li class='bigfnbutton' data-latex='\\operatorname{gcd}(#?)' data-latex='\\operatorname{gcd}()'></li>
                <li class='bigfnbutton' data-latex='\\operatorname{floor}(#?)' data-latex='\\operatorname{floor}()'></li>
                <li class='bigfnbutton' data-latex='\\sum_{n\\mathop=0}^{\\infty}'></li>
                <li class='bigfnbutton' data-latex='\\int_{0}^{\\infty}'></li>
                <li class='bigfnbutton' data-latex='\\operatorname{sign}(#?)' data-latex='\\operatorname{sign}()'></li>
            </ul>
            <ul><li class='separator'></li>
                <li class='fnbutton' data-latex='\\tan'></li>
                <li class='fnbutton' data-latex='\\tan^{-1}'></li>
                <li class='fnbutton' data-latex='\\log_{#?}'></li>
                <li class='fnbutton' data-latex='\\sqrt[#?]{#0}'></li>
                <li class='bigfnbutton' data-insert='#0 \\mod' data-latex='\\mod'></li>
                <li class='bigfnbutton' data-insert='\\operatorname{round}(#?) ' data-latex='\\operatorname{round}()'></li>
                <li class='bigfnbutton' data-insert='\\prod_{n\\mathop=0}^{\\infty}' data-latex='{\\scriptstyle \\prod_{n=0}^{\\infty}}'></li>
                <li class='bigfnbutton' data-insert='\\frac{\\differentialD #0}{\\differentialD x}'></li>
                <li class='action font-glyph bottom right' data-command='["performWithFeedback","deleteBackward"]'><svg class="svg-glyph"><use xlink:href="#svg-delete-backward" /></svg></li></ul>
            <ul><li class='separator'></li>
                <li class='fnbutton'>(</li>
                <li class='fnbutton'>)</li>
                <li class='fnbutton' data-insert='^{#?}' data-latex='x^{#?}'></li>
                <li class='fnbutton' data-insert='_{#?}' data-latex='x_{#?}'></li>
                <li class='keycap w20 ' data-key=' '>&nbsp;</li>
                <arrows/>
            </ul>
        </div>`,
  'style': `
        <div class='rows'>
            <ul>
                <li class='keycap' data-alt-keys='foreground-color' data-command='["applyStyle",{"color":"red"}]'><span style='border-radius: 50%;width:22px;height:22px; border: 3px solid #cc2428'></span></li>
                <li class='keycap' data-alt-keys='background-color' data-command='["applyStyle",{"backgroundColor":"yellow"}]'><span style='border-radius: 50%;width:22px;height:22px; background:#fff590'></span></li>
                <li class='separator w5'></li>
                <li class='keycap' data-command='["applyStyle",{"size":"3"}]' data-latex='\\scriptsize\\text{small}'></li>
                <li class='keycap' data-command='["applyStyle",{"size":"5"}]' data-latex='\\scriptsize\\text{normal}'></li>
                <li class='keycap' data-command='["applyStyle",{"size":"9"}]' data-latex='\\huge\\text{big}'></li>
                <li class='separator w5'></li>
                <li class='keycap' data-latex='\\langle' data-command='["insert", "\\\\langle", {"smartFence":true}]'></li>
            </ul>
            <ul>
                <li class='keycap' data-command='["applyStyle",{"series":"l"}]' data-latex='\\fontseries{l}\\text{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"series":"m"}]' data-latex='\\fontseries{m}\\text{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"series":"b"}]' data-latex='\\fontseries{b}\\text{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"series":"bx"}]' data-latex='\\fontseries{bx}\\text{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"series":"sb"}]' data-latex='\\fontseries{sb}\\text{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"series":"c"}]' data-latex='\\fontseries{c}\\text{Ab}'></li>
            </ul>
            <ul>
                <li class='keycap' data-command='["applyStyle",{"shape":"up"}]' data-latex='\\textup{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"shape":"it"}]' data-latex='\\textit{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"shape":"sl"}]' data-latex='\\textsl{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"shape":"sc"}]' data-latex='\\textsc{Ab}'></li>
                <li class='separator w5'></li>
                <li class='keycap' data-insert='\\emph{#@} ' data-latex='\\text{\\emph{emph}}'></li>
            </ul>
            <ul>
                <li class='keycap' data-command='["applyStyle",{"fontFamily":"cmr"}]' data-latex='\\textrm{Az}'></li>
                <li class='keycap' data-command='["applyStyle",{"fontFamily":"cmtt"}]' data-latex='\\texttt{Az}'></li>
                <li class='keycap' data-command='["applyStyle",{"fontFamily":"cmss"}]' data-latex='\\textsf{Az}'></li>

                <li class='keycap' data-command='["applyStyle",{"fontFamily":"bb"}]'  data-latex='\\mathbb{AZ}'></li>
                <li class='keycap' data-command='["applyStyle",{"fontFamily":"scr"}]'  data-latex='\\mathscr{AZ}'></li>
                <li class='keycap' data-command='["applyStyle",{"fontFamily":"cal"}]' data-latex='\\mathcal{A1}'></li>
                <li class='keycap' data-command='["applyStyle",{"fontFamily":"frak"}]' data-latex='\\mathfrak{Az}'></li>
            </ul>
        </div>`,
};

function latexToMarkup(latex: string, arg: (arg: string) => string): string {
  // Since we don't have preceding atoms, we'll interpret #@ as a placeholder
  latex = latex.replace(/(^|[^\\])#@/g, '$1#?');

  const context = defaultGlobalContext();

  const root = new Atom('root', context);
  root.body = parseLatex(latex, context, { parseMode: 'math', args: arg });

  const box = coalesce(
    adjustInterAtomSpacing(
      new Box(
        root.render(
          new Context(
            { registers: context.registers },
            { fontSize: DEFAULT_FONT_SIZE },
            'displaystyle'
          )
        ),
        { classes: 'ML__base' }
      )
    )
  );

  return makeStruts(box, { classes: 'ML__mathlive' }).toMarkup();
}

/**
 * Return a markup string for the keyboard toolbar for the specified layer.
 */
function makeKeyboardToolbar(
  options: CombinedVirtualKeyboardOptions,
  keyboardIDs: string,
  currentKeyboard: string
): string {
  // The left hand side of the toolbar has a list of all the available keyboards
  let result = "<div class='left'>";
  const keyboardList = keyboardIDs.replace(/\s+/g, ' ').split(' ');
  if (keyboardList.length > 1) {
    const keyboards = {
      ...KEYBOARDS,
      ...(options.customVirtualKeyboards ?? {}),
    };
    for (const keyboard of keyboardList) {
      if (!keyboards[keyboard]) {
        console.error('MathLive: Unknown virtual keyboard "', keyboard, '"');
        break;
      }

      result += "<div class='";
      if (keyboard === currentKeyboard) result += 'selected ';
      else if (keyboards[keyboard].command) result += 'action ';
      else result += 'layer-switch ';

      result += (keyboards[keyboard].classes ?? '') + "'";

      if (keyboards[keyboard].tooltip) {
        result +=
          "data-tooltip='" +
          (l10n(keyboards[keyboard].tooltip) ?? keyboards[keyboard].tooltip) +
          "' ";
      }

      if (keyboard !== currentKeyboard) {
        if (typeof keyboards[keyboard].command === 'string')
          result += `data-command='"${keyboards[keyboard].command as string}"'`;
        else if (Array.isArray(keyboards[keyboard].command)) {
          result += `data-command='${JSON.stringify(
            keyboards[keyboard].command
          )}'`;
        }

        if (keyboards[keyboard].layer)
          result += "data-layer='" + keyboards[keyboard].layer + "'";
      }

      result += '>' + keyboards[keyboard].label + '</div>';
    }
  }

  result += '</div>';

  const toolbarOptions = options.virtualKeyboardToolbar;
  const availableActions =
    toolbarOptions === 'default' ? ['copyToClipboard', 'undo', 'redo'] : [];

  const actionsMarkup = {
    copyToClipboard: `
            <div class='action'
                data-command='"copyToClipboard"'
                data-tooltip='${l10n('tooltip.copy to clipboard')}'>
                <svg><use xlink:href='#svg-copy' /></svg>
            </div>
        `,
    undo: `
            <div class='action disabled'
                data-command='"undo"'
                data-tooltip='${l10n('tooltip.undo')}'>
                <svg><use xlink:href='#svg-undo' /></svg>
            </div>
        `,
    redo: `
            <div class='action disabled'
                data-command='"redo"'
                data-tooltip='${l10n('tooltip.redo')}'>
                <svg><use xlink:href='#svg-redo' /></svg>
            </div>
        `,
  };

  // The right hand side of the toolbar, with the copy/undo/redo commands
  if (availableActions.length > 0) {
    result += `
            <div class='right'>
                ${availableActions
                  .map((action) => actionsMarkup[action])
                  .join('')}
            </div>
        `;
  }

  return "<div class='keyboard-toolbar' role='toolbar'>" + result + '</div>';
}

export function makeKeycap(
  keyboard: VirtualKeyboard,
  elementList: HTMLElement[],
  chainedCommand?: SelectorPrivate
): void {
  for (const element of elementList) {
    let html: string | undefined = undefined;
    // Display
    if (element.getAttribute('data-latex')) {
      html = latexToMarkup(
        element.getAttribute('data-latex')!.replace(/&quot;/g, '"'),
        () => '\\placeholder{}'
      );
    } else if (
      element.getAttribute('data-insert') &&
      element.innerHTML === ''
    ) {
      html = latexToMarkup(
        element.getAttribute('data-insert')!.replace(/&quot;/g, '"'),
        () => '\\placeholder{}'
      );
    } else if (element.getAttribute('data-content'))
      html = element.getAttribute('data-content')!.replace(/&quot;/g, '"');

    if (element.getAttribute('data-aside')) {
      html =
        (html ?? '') +
        '<aside>' +
        element.getAttribute('data-aside')!.replace(/&quot;/g, '"') +
        '</aside>';
    }

    if (html !== undefined)
      element.innerHTML = keyboard.options.createHTML(html);

    if (element.getAttribute('data-classes'))
      element.classList.add(element.getAttribute('data-classes')!);

    const key = element.getAttribute('data-insert')?.replace(/&quot;/g, '"');
    if (key && SHIFTED_KEYS[key]) {
      element.dataset.shifted = SHIFTED_KEYS[key][0];
      element.dataset.shiftedCommand = JSON.stringify([
        'insertAndUnshiftKeyboardLayer',
        SHIFTED_KEYS[key][1],
      ]);
    }

    // Commands
    let selector: SelectorPrivate | [SelectorPrivate, ...any[]] | undefined =
      undefined;
    const command = element.getAttribute('data-command');
    if (command) {
      if (/^[a-zA-Z]+$/.test(command)) selector = command as SelectorPrivate;
      else {
        try {
          selector = JSON.parse(command);
        } catch (e) {}
      }
    } else if (element.getAttribute('data-insert')) {
      selector = [
        'insert',
        element.getAttribute('data-insert')!,
        {
          focus: true,
          feedback: true,
          scrollIntoView: true,
          mode: 'math',
          format: 'latex',
          resetStyle: true,
        },
      ];
    } else if (element.getAttribute('data-latex')) {
      selector = [
        'insert',
        element.getAttribute('data-latex')!,
        {
          focus: true,
          feedback: true,
          scrollIntoView: true,
          mode: 'math',
          format: 'latex',
          resetStyle: true,
        },
      ];
    } else {
      selector = [
        'typedText',
        element.getAttribute('data-key') ?? element.textContent!,
        { focus: true, feedback: true, simulateKeystroke: true },
      ];
    }

    if (selector) {
      if (chainedCommand) selector = [chainedCommand, selector];

      let handlers: ButtonHandlers = { default: selector };
      const altKeysetId = element.getAttribute('data-alt-keys');
      if (altKeysetId) {
        const altKeys = ALT_KEYS[altKeysetId];
        if (altKeys) {
          handlers = {
            default: selector,
            pressAndHoldStart: ['showAlternateKeys', altKeysetId],
            pressAndHoldEnd: 'hideAlternateKeys',
          };
          // } else {
          //   console.warn(`Unknown alt key set: "${altKeysetId}"`);
        }
      }

      attachButtonHandlers(
        element,
        (command) => keyboard.executeCommand(command),
        handlers
      );
    }
  }
}

/**
 * Expand the shortcut tags (e.g. <row>) inside a layer.
 */
function expandLayerMarkup(
  options: CombinedVirtualKeyboardOptions,
  layer: string
): string {
  const ROWS = {
    // First row should be 10 key wide
    // Second row should be 10 key wide
    // Third row should be 8.5 key wide
    // One row should have ^ (shift key) which is 1.5 key wide
    // One row should have ~ (delete key) which is .5 or 1.5 key wide
    qwerty: {
      'lower-1': 'qwertyuiop',
      'lower-2': ' asdfghjkl ',
      'lower-3': '^zxcvbnm~',
      'upper-1': 'QWERTYUIOP',
      'upper-2': ' ASDFGHJKL ',
      'upper-3': '^ZXCVBNM~',
      'numpad-1': '789/',
      'numpad-2': '456*',
      'numpad-3': '123-',
      'numpad-4': '0.=+',
    },
    azerty: {
      'lower-1': 'azertyuiop',
      'lower-2': 'qsdfghjklm',
      'lower-3': '^ wxcvbn ~',
      'upper-1': 'AZERTYUIOP',
      'upper-2': 'QSDFGHJKLM',
      'upper-3': '^ WXCVBN ~',
    },
    qwertz: {
      'lower-1': 'qwertzuiop',
      'lower-2': ' asdfghjkl ',
      'lower-3': '^yxcvbnm~',
      'upper-1': 'QWERTZUIOP',
      'upper-2': ' ASDFGHJKL',
      'upper-3': '^YXCVBNM~',
    },
    dvorak: {
      'lower-1': '^  pyfgcrl ',
      'lower-2': 'aoeuidhtns',
      'lower-3': 'qjkxbmwvz~',
      'upper-1': '^  PYFGCRL ',
      'upper-2': 'AOEUIDHTNS',
      'upper-3': 'QJKXBMWVZ~',
    },
    colemak: {
      'lower-1': ' qwfpgjluy ',
      'lower-2': 'arstdhneio',
      'lower-3': '^zxcvbkm~',
      'upper-1': ' QWFPGNLUY ',
      'upper-2': 'ARSTDHNEIO',
      'upper-3': '^ZXCVBKM~',
    },
  };
  // Determine the layout of the virtual keyboard based on a
  // detected physical keyboard layout, or the current locale
  let layoutName = options.virtualKeyboardLayout;
  if (layoutName === 'auto') {
    const activeLayout = getActiveKeyboardLayout();
    if (activeLayout) layoutName = activeLayout.virtualLayout;

    if (!layoutName || layoutName === 'auto') {
      layoutName =
        (
          {
            fr: 'azerty',
            be: 'azerty',
            al: 'qwertz',
            ba: 'qwertz',
            cz: 'qwertz',
            de: 'qwertz',
            hu: 'qwertz',
            sk: 'qwertz',
            ch: 'qwertz',
          } as const
        )[l10nOptions.locale.slice(0, 2)] ?? 'qwerty';
    }
  }

  const layout = ROWS[layoutName] ?? ROWS.qwerty;

  let result = layer;
  let row;

  result = result.replace(
    /<arrows\/>/g,
    `
        <li class='action' data-command='["performWithFeedback","moveToPreviousChar"]'
            data-shifted='<svg class="svg-glyph"><use xlink:href="#svg-angle-double-left" /></svg>'
            data-shifted-command='["performWithFeedback","extendToPreviousChar"]'>
            <svg class="svg-glyph"><use xlink:href='#svg-arrow-left' /></svg>
        </li>
        <li class='action' data-command='["performWithFeedback","moveToNextChar"]'
            data-shifted='<svg class="svg-glyph"><use xlink:href="#svg-angle-double-right" /></svg>'
            data-shifted-command='["performWithFeedback","extendToNextChar"]'>
            <svg class="svg-glyph"><use xlink:href='#svg-arrow-right' /></svg>
        </li>
        <li class='action' data-command='["performWithFeedback","commit"]'>
        <svg class="svg-glyph"><use xlink:href='#svg-commit' /></svg></li>`
  );

  let m: string[] | null = result.match(/(<row\s+)(.*)((?:<\/row|\/)>)/);
  while (m) {
    row = '';
    const attributesArray = m[2].match(/[a-zA-Z][a-zA-Z\d-]*=(['"])(.*?)\1/g);
    const attributes: Record<string, string> = {};
    if (attributesArray) {
      for (const attribute of attributesArray) {
        const m2 = attribute.match(/([a-zA-Z][a-zA-Z\d-]*)=(['"])(.*?)\2/);
        if (m2) attributes[m2[1]] = m2[3];
      }
    }

    let keys = layout[attributes.name] as string;
    if (!keys) keys = ROWS.qwerty[attributes.name];
    if (!keys)
      console.error('MathLive: Unknown roman keyboard row:', attributes.name);
    else {
      for (const c of keys) {
        let cls: string = attributes.class ?? '';
        if (cls) cls = ` ${cls}`;
        if (c === '~') {
          row += `<li class='action font-glyph bottom right `;
          row +=
            keys.length - (keys.match(/ /g) || []).length / 2 === 10
              ? 'w10'
              : 'w15';
          row += `' data-shifted='<span class="warning"><svg class="svg-glyph"><use xlink:href="#svg-trash" /></svg></span>'
                        data-shifted-command='"deleteAll"'
                        data-alt-keys='delete' data-command='["performWithFeedback","deleteBackward"]'
                        ><svg class="svg-glyph"><use xlink:href="#svg-delete-backward" /></svg></li>`;
        } else if (c === ' ') {
          // Separator
          row += "<li class='separator w5'></li>";
        } else if (c === '^') {
          // Shift key
          row +=
            `<li class='shift modifier font-glyph bottom left w15 layer-switch' data-layer='` +
            attributes['shift-layer'] +
            `'><svg class="svg-glyph"><use xlink:href="#svg-shift" /></svg></li>`;
        } else if (c === '/') {
          row +=
            "<li class='keycap" +
            cls +
            "' data-alt-keys='/' data-insert='\\frac{#@}{#?}'>&divide;</li>";
        } else if (c === '*') {
          row +=
            "<li class='keycap" +
            cls +
            "' data-alt-keys='*' data-insert='\\times '>&times;</li>";
        } else if (c === '-') {
          row +=
            "<li class='keycap" +
            cls +
            "' data-alt-keys='-' data-key='-'>&#x2212;</li>";
        } else if (c === '.') {
          row +=
            "<li class='keycap" +
            cls +
            "' data-alt-keys='.' data-command='\"insertDecimalSeparator\"'>" +
            (options['decimalSeparator'] ?? '.') +
            '</li>';
        } else if (cls.includes('tt')) {
          row +=
            `<li class='keycap${cls}' data-alt-keys='${c}' ` +
            `data-command='["typedText","${c}",{"mode":"latex", "focus":true, "feedback":true}]'` +
            `>${c}</li>`;
        } else {
          row +=
            "<li class='keycap" +
            cls +
            "' data-alt-keys='" +
            c +
            "'>" +
            c +
            '</li>';
        }
      }
    }

    result = result.replace(new RegExp(m[1] + m[2] + m[3]), row);

    m = result.match(/(<row\s+)(.*)((?:<\/row|\/)>)/);
  }

  return result;
}

/**
 * Construct a virtual keyboard element based on the config options in the
 * mathfield and an optional theme.
 */
export function makeKeyboardElement(
  keyboard: VirtualKeyboard,
  theme: VirtualKeyboardTheme
): HTMLDivElement {
  const svgIcons = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">

    <symbol id="svg-delete-backward" viewBox="0 0 576 512">
      <path d="M432.1 208.1L385.9 256L432.1 303C442.3 312.4 442.3 327.6 432.1 336.1C423.6 346.3 408.4 346.3 399 336.1L352 289.9L304.1 336.1C295.6 346.3 280.4 346.3 271 336.1C261.7 327.6 261.7 312.4 271 303L318.1 256L271 208.1C261.7 199.6 261.7 184.4 271 175C280.4 165.7 295.6 165.7 304.1 175L352 222.1L399 175C408.4 165.7 423.6 165.7 432.1 175C442.3 184.4 442.3 199.6 432.1 208.1V208.1zM512 64C547.3 64 576 92.65 576 128V384C576 419.3 547.3 448 512 448H205.3C188.3 448 172 441.3 160 429.3L9.372 278.6C3.371 272.6 0 264.5 0 256C0 247.5 3.372 239.4 9.372 233.4L160 82.75C172 70.74 188.3 64 205.3 64L512 64zM528 128C528 119.2 520.8 112 512 112H205.3C201 112 196.9 113.7 193.9 116.7L54.63 256L193.9 395.3C196.9 398.3 201 400 205.3 400H512C520.8 400 528 392.8 528 384V128z"/>
    </symbol>

    <symbol id="svg-shift" viewBox="0 0 384 512">
      <path d="M2.438 252.3C7.391 264.2 19.06 272 32 272h80v160c0 26.51 21.49 48 48 48h64C250.5 480 272 458.5 272 432v-160H352c12.94 0 24.61-7.797 29.56-19.75c4.953-11.97 2.219-25.72-6.938-34.88l-160-176C208.4 35.13 200.2 32 192 32S175.6 35.13 169.4 41.38l-160 176C.2188 226.5-2.516 240.3 2.438 252.3zM192 86.63L313.4 224H224v208H160V224H70.63L192 86.63z"/>
    </symbol>

    <symbol id="svg-commit" viewBox="0 0 512 512">
      <path d="M135 432.1l-128-128C2.344 300.3 0 294.2 0 288s2.344-12.28 7.031-16.97l128-128c9.375-9.375 24.56-9.375 33.94 0s9.375 24.56 0 33.94L81.94 264H464v-208C464 42.75 474.8 32 488 32S512 42.75 512 56V288c0 13.25-10.75 24-24 24H81.94l87.03 87.03c9.375 9.375 9.375 24.56 0 33.94S144.4 442.3 135 432.1z"/>
    </symbol>

    <symbol id="svg-command" viewBox="0 0 640 512">
      <path d="M34.495 36.465l211.051 211.05c4.686 4.686 4.686 12.284 0 16.971L34.495 475.535c-4.686 4.686-12.284 4.686-16.97 0l-7.071-7.07c-4.686-4.686-4.686-12.284 0-16.971L205.947 256 10.454 60.506c-4.686-4.686-4.686-12.284 0-16.971l7.071-7.07c4.686-4.687 12.284-4.687 16.97 0zM640 468v-10c0-6.627-5.373-12-12-12H300c-6.627 0-12 5.373-12 12v10c0 6.627 5.373 12 12 12h328c6.627 0 12-5.373 12-12z"/>
    </symbol>

    <symbol id="svg-undo" viewBox="0 0 512 512">
      <path d="M20 8h10c6.627 0 12 5.373 12 12v110.625C85.196 57.047 165.239 7.715 256.793 8.001 393.18 8.428 504.213 120.009 504 256.396 503.786 393.181 392.834 504 256 504c-63.926 0-122.202-24.187-166.178-63.908-5.113-4.618-5.354-12.561-.482-17.433l7.069-7.069c4.503-4.503 11.749-4.714 16.482-.454C150.782 449.238 200.935 470 256 470c117.744 0 214-95.331 214-214 0-117.744-95.331-214-214-214-82.862 0-154.737 47.077-190.289 116H180c6.627 0 12 5.373 12 12v10c0 6.627-5.373 12-12 12H20c-6.627 0-12-5.373-12-12V20c0-6.627 5.373-12 12-12z"/>
    </symbol>
    <symbol id="svg-redo" viewBox="0 0 512 512">
      <path d="M492 8h-10c-6.627 0-12 5.373-12 12v110.625C426.804 57.047 346.761 7.715 255.207 8.001 118.82 8.428 7.787 120.009 8 256.396 8.214 393.181 119.166 504 256 504c63.926 0 122.202-24.187 166.178-63.908 5.113-4.618 5.354-12.561.482-17.433l-7.069-7.069c-4.503-4.503-11.749-4.714-16.482-.454C361.218 449.238 311.065 470 256 470c-117.744 0-214-95.331-214-214 0-117.744 95.331-214 214-214 82.862 0 154.737 47.077 190.289 116H332c-6.627 0-12 5.373-12 12v10c0 6.627 5.373 12 12 12h160c6.627 0 12-5.373 12-12V20c0-6.627-5.373-12-12-12z"/>
    </symbol>
    <symbol id="svg-arrow-left" viewBox="0 0 320 512">
      <path d="M206.7 464.6l-183.1-191.1C18.22 267.1 16 261.1 16 256s2.219-11.97 6.688-16.59l183.1-191.1c9.152-9.594 24.34-9.906 33.9-.7187c9.625 9.125 9.938 24.37 .7187 33.91L73.24 256l168 175.4c9.219 9.5 8.906 24.78-.7187 33.91C231 474.5 215.8 474.2 206.7 464.6z"/>
    </symbol>
    <symbol id="svg-arrow-right" viewBox="0 0 320 512">
      <path d="M113.3 47.41l183.1 191.1c4.469 4.625 6.688 10.62 6.688 16.59s-2.219 11.97-6.688 16.59l-183.1 191.1c-9.152 9.594-24.34 9.906-33.9 .7187c-9.625-9.125-9.938-24.38-.7187-33.91l168-175.4L78.71 80.6c-9.219-9.5-8.906-24.78 .7187-33.91C88.99 37.5 104.2 37.82 113.3 47.41z"/>
    </symbol>
    <symbol id="svg-tab" viewBox="0 0 448 512">
      <path d="M32 217.1c0-8.8 7.2-16 16-16h144v-93.9c0-7.1 8.6-10.7 13.6-5.7l143.5 143.1c6.3 6.3 6.3 16.4 0 22.7L205.6 410.4c-5 5-13.6 1.5-13.6-5.7v-93.9H48c-8.8 0-16-7.2-16-16v-77.7m-32 0v77.7c0 26.5 21.5 48 48 48h112v61.9c0 35.5 43 53.5 68.2 28.3l143.6-143c18.8-18.8 18.8-49.2 0-68L228.2 78.9c-25.1-25.1-68.2-7.3-68.2 28.3v61.9H48c-26.5 0-48 21.6-48 48zM436 64h-8c-6.6 0-12 5.4-12 12v360c0 6.6 5.4 12 12 12h8c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12z"/>
    </symbol>
    <symbol id="svg-copy" viewBox="0 0 448 512">
      <path d="M433.941 65.941l-51.882-51.882A48 48 0 0 0 348.118 0H176c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h224c26.51 0 48-21.49 48-48v-48h80c26.51 0 48-21.49 48-48V99.882a48 48 0 0 0-14.059-33.941zM352 32.491a15.88 15.88 0 0 1 7.431 4.195l51.882 51.883A15.885 15.885 0 0 1 415.508 96H352V32.491zM288 464c0 8.822-7.178 16-16 16H48c-8.822 0-16-7.178-16-16V144c0-8.822 7.178-16 16-16h80v240c0 26.51 21.49 48 48 48h112v48zm128-96c0 8.822-7.178 16-16 16H176c-8.822 0-16-7.178-16-16V48c0-8.822 7.178-16 16-16h144v72c0 13.2 10.8 24 24 24h72v240z"/>
    </symbol>
    <symbol id="svg-angle-double-right" viewBox="0 0 320 512">
      <path d="M166.9 264.5l-117.8 116c-4.7 4.7-12.3 4.7-17 0l-7.1-7.1c-4.7-4.7-4.7-12.3 0-17L127.3 256 25.1 155.6c-4.7-4.7-4.7-12.3 0-17l7.1-7.1c4.7-4.7 12.3-4.7 17 0l117.8 116c4.6 4.7 4.6 12.3-.1 17zm128-17l-117.8-116c-4.7-4.7-12.3-4.7-17 0l-7.1 7.1c-4.7 4.7-4.7 12.3 0 17L255.3 256 153.1 356.4c-4.7 4.7-4.7 12.3 0 17l7.1 7.1c4.7 4.7 12.3 4.7 17 0l117.8-116c4.6-4.7 4.6-12.3-.1-17z"/>
    </symbol>
    <symbol id="svg-angle-double-left" viewBox="0 0 320 512">
      <path d="M153.1 247.5l117.8-116c4.7-4.7 12.3-4.7 17 0l7.1 7.1c4.7 4.7 4.7 12.3 0 17L192.7 256l102.2 100.4c4.7 4.7 4.7 12.3 0 17l-7.1 7.1c-4.7 4.7-12.3 4.7-17 0L153 264.5c-4.6-4.7-4.6-12.3.1-17zm-128 17l117.8 116c4.7 4.7 12.3 4.7 17 0l7.1-7.1c4.7-4.7 4.7-12.3 0-17L64.7 256l102.2-100.4c4.7-4.7 4.7-12.3 0-17l-7.1-7.1c-4.7-4.7-12.3-4.7-17 0L25 247.5c-4.6 4.7-4.6 12.3.1 17z"/>
    </symbol>
    <symbol id="svg-trash" viewBox="0 0 448 512">
      <path d="M336 64l-33.6-44.8C293.3 7.1 279.1 0 264 0h-80c-15.1 0-29.3 7.1-38.4 19.2L112 64H24C10.7 64 0 74.7 0 88v2c0 3.3 2.7 6 6 6h26v368c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V96h26c3.3 0 6-2.7 6-6v-2c0-13.3-10.7-24-24-24h-88zM184 32h80c5 0 9.8 2.4 12.8 6.4L296 64H152l19.2-25.6c3-4 7.8-6.4 12.8-6.4zm200 432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V96h320v368zm-176-44V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12zm-80 0V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12zm160 0V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12z"/>
    </symbol>
</svg>
        `;
  // <symbol id="svg-wikipedia" viewBox="0 0 640 512">
  //         <path d="M640 51.2l-.3 12.2c-28.1.8-45 15.8-55.8 40.3-25 57.8-103.3 240-155.3 358.6H415l-81.9-193.1c-32.5 63.6-68.3 130-99.2 193.1-.3.3-15 0-15-.3C172 352.3 122.8 243.4 75.8 133.4 64.4 106.7 26.4 63.4.2 63.7c0-3.1-.3-10-.3-14.2h161.9v13.9c-19.2 1.1-52.8 13.3-43.3 34.2 21.9 49.7 103.6 240.3 125.6 288.6 15-29.7 57.8-109.2 75.3-142.8-13.9-28.3-58.6-133.9-72.8-160-9.7-17.8-36.1-19.4-55.8-19.7V49.8l142.5.3v13.1c-19.4.6-38.1 7.8-29.4 26.1 18.9 40 30.6 68.1 48.1 104.7 5.6-10.8 34.7-69.4 48.1-100.8 8.9-20.6-3.9-28.6-38.6-29.4.3-3.6 0-10.3.3-13.6 44.4-.3 111.1-.3 123.1-.6v13.6c-22.5.8-45.8 12.8-58.1 31.7l-59.2 122.8c6.4 16.1 63.3 142.8 69.2 156.7L559.2 91.8c-8.6-23.1-36.4-28.1-47.2-28.3V49.6l127.8 1.1.2.5z"/>
  // </symbol>
  // <symbol id="svg-link" viewBox="0 0 512 512">
  //         <path d="M301.148 394.702l-79.2 79.19c-50.778 50.799-133.037 50.824-183.84 0-50.799-50.778-50.824-133.037 0-183.84l79.19-79.2a132.833 132.833 0 0 1 3.532-3.403c7.55-7.005 19.795-2.004 20.208 8.286.193 4.807.598 9.607 1.216 14.384.481 3.717-.746 7.447-3.397 10.096-16.48 16.469-75.142 75.128-75.3 75.286-36.738 36.759-36.731 96.188 0 132.94 36.759 36.738 96.188 36.731 132.94 0l79.2-79.2.36-.36c36.301-36.672 36.14-96.07-.37-132.58-8.214-8.214-17.577-14.58-27.585-19.109-4.566-2.066-7.426-6.667-7.134-11.67a62.197 62.197 0 0 1 2.826-15.259c2.103-6.601 9.531-9.961 15.919-7.28 15.073 6.324 29.187 15.62 41.435 27.868 50.688 50.689 50.679 133.17 0 183.851zm-90.296-93.554c12.248 12.248 26.362 21.544 41.435 27.868 6.388 2.68 13.816-.68 15.919-7.28a62.197 62.197 0 0 0 2.826-15.259c.292-5.003-2.569-9.604-7.134-11.67-10.008-4.528-19.371-10.894-27.585-19.109-36.51-36.51-36.671-95.908-.37-132.58l.36-.36 79.2-79.2c36.752-36.731 96.181-36.738 132.94 0 36.731 36.752 36.738 96.181 0 132.94-.157.157-58.819 58.817-75.3 75.286-2.651 2.65-3.878 6.379-3.397 10.096a163.156 163.156 0 0 1 1.216 14.384c.413 10.291 12.659 15.291 20.208 8.286a131.324 131.324 0 0 0 3.532-3.403l79.19-79.2c50.824-50.803 50.799-133.062 0-183.84-50.802-50.824-133.062-50.799-183.84 0l-79.2 79.19c-50.679 50.682-50.688 133.163 0 183.851z"/>
  // </symbol>
  //     <symbol id="svg-external-link" viewBox="0 0 448 512">
  //     <path d="M400 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zm16 400c0 8.822-7.178 16-16 16H48c-8.822 0-16-7.178-16-16V80c0-8.822 7.178-16 16-16h352c8.822 0 16 7.178 16 16v352zM99.515 374.828c-4.686-4.686-4.686-12.284 0-16.971l195.15-195.15-.707-.707-89.958.342c-6.627 0-12-5.373-12-12v-9.999c0-6.628 5.372-12 12-12L340 128c6.627 0 12 5.372 12 12l-.343 136c0 6.627-5.373 12-12 12h-9.999c-6.627 0-12-5.373-12-12l.342-89.958-.707-.707-195.15 195.15c-4.686 4.686-12.284 4.686-16.971 0l-5.657-5.657z"/>
  // </symbol>
  // <symbol id="svg-external-link" viewBox="0 0 512 512">
  //     <path d="M256 40c118.621 0 216 96.075 216 216 0 119.291-96.61 216-216 216-119.244 0-216-96.562-216-216 0-119.203 96.602-216 216-216m0-32C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm-36 344h12V232h-12c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h48c6.627 0 12 5.373 12 12v140h12c6.627 0 12 5.373 12 12v8c0 6.627-5.373 12-12 12h-72c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12zm36-240c-17.673 0-32 14.327-32 32s14.327 32 32 32 32-14.327 32-32-14.327-32-32-32z"/>
  // </symbol>

  let markup = svgIcons;

  keyboard.create();

  // Auto-populate the ALT_KEYS table
  ALT_KEYS_BASE['foreground-color'] = [];
  for (const color of Object.keys(FOREGROUND_COLORS)) {
    ALT_KEYS_BASE['foreground-color'].push({
      class: 'small-button',
      content:
        '<span style="border-radius:50%;width:32px;height:32px; box-sizing: border-box; border: 3px solid ' +
        FOREGROUND_COLORS[color] +
        '"></span>',
      command: ['applyStyle', { color }],
    });
  }

  ALT_KEYS_BASE['background-color'] = [];
  for (const color of Object.keys(BACKGROUND_COLORS)) {
    ALT_KEYS_BASE['background-color'].push({
      class: 'small-button',
      content:
        '<span style="border-radius:50%;width:32px;height:32px; background:' +
        BACKGROUND_COLORS[color] +
        '"></span>',
      command: ['applyStyle', { backgroundColor: color }],
    });
  }

  ALT_KEYS = { ...ALT_KEYS_BASE };
  for (const key of Object.keys(ALT_KEYS))
    ALT_KEYS[key] = ALT_KEYS[key].slice();

  const UPPER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWER_ALPHA = 'abcdefghijklmnopqrstuvwxyz';
  const DIGITS = '0123456789';
  // Define the alternate set for uppercase keys
  for (let i = 0; i < 26; i++) {
    const key = UPPER_ALPHA[i];
    if (!ALT_KEYS[key]) ALT_KEYS[key] = [];
    ALT_KEYS[key].unshift({
      latex: '\\mathbb{' + key + '}',
      aside: 'blackboard',
      insert: '\\mathbb{' + key + '}',
    });
    ALT_KEYS[key].unshift({
      latex: '\\mathbf{' + key + '}',
      aside: 'bold',
      insert: '\\mathbf{' + key + '}',
    });
    ALT_KEYS[key].unshift({
      latex: '\\mathsf{' + key + '}',
      aside: 'sans',
      insert: '\\mathsf{' + key + '}',
    });
    ALT_KEYS[key].unshift({
      latex: '\\mathtt{' + key + '}',
      aside: 'monospace',
      insert: '\\mathtt{' + key + '}',
    });
    ALT_KEYS[key].unshift({
      latex: '\\mathcal{' + key + '}',
      aside: 'calligraphy',
      insert: '\\mathcal{' + key + '}',
    });
    ALT_KEYS[key].unshift({
      latex: '\\mathfrak{' + key + '}',
      aside: 'fraktur',
      insert: '\\mathfrak{' + key + '}',
    });
  }

  // Define the alternate set for lowercase keys
  for (let i = 0; i <= 26; i++) {
    const key = LOWER_ALPHA[i];
    if (!ALT_KEYS[key]) ALT_KEYS[key] = [];
    ALT_KEYS[key].unshift({
      latex: '\\mathsf{' + key + '}',
      aside: 'sans',
      insert: '\\mathsf{' + key + '}',
    });
    ALT_KEYS[key].unshift({
      latex: '\\mathbf{' + key + '}',
      aside: 'bold',
      insert: '\\mathbf{' + key + '}',
    });
    ALT_KEYS[key].unshift({
      latex: '\\mathtt{' + key + '}',
      aside: 'monospace',
      insert: '\\mathtt{' + key + '}',
    });
    ALT_KEYS[key].unshift({
      latex: '\\mathfrak{' + key + '}',
      aside: 'fraktur',
      insert: '\\mathfrak{' + key + '}',
    });
  }

  for (let i = 0; i < 10; i++) {
    const key = DIGITS[i];
    if (!ALT_KEYS[key]) ALT_KEYS[key] = [];
    // The mathbb font does not appear to include digits,
    // although it's supposed to.
    // ALT_KEYS[key].push({
    //         latex: '\\underset{\\textsf{\\footnotesize blackboard}}{\\mathbb{' + key + '}}',
    //         insert: '\\mathbb{' + key + '}}'});
    ALT_KEYS[key].unshift({
      latex: '\\mathbf{' + key + '}',
      aside: 'bold',
      insert: '\\mathbf{' + key + '}',
    });
    ALT_KEYS[key].unshift({
      latex: '\\mathsf{' + key + '}',
      aside: 'sans',
      insert: '\\mathsf{' + key + '}',
    });
    ALT_KEYS[key].unshift({
      latex: '\\mathtt{' + key + '}',
      aside: 'monospace',
      insert: '\\mathtt{' + key + '}',
    });
    ALT_KEYS[key].unshift({
      latex: '\\mathcal{' + key + '}',
      aside: 'script',
      insert: '\\mathcal{' + key + '}',
    });
    ALT_KEYS[key].unshift({
      latex: '\\mathfrak{' + key + '}',
      aside: 'fraktur',
      insert: '\\mathfrak{' + key + '}',
    });
  }

  let keyboardIDs = keyboard.options.virtualKeyboards;
  if (!keyboardIDs) keyboardIDs = 'all';

  keyboardIDs = keyboardIDs.replace(
    /\ball\b/i,
    'numeric functions symbols roman greek'
  );

  const layers: Record<string, string | Partial<VirtualKeyboardLayer>> = {
    ...LAYERS,
    ...(keyboard.options.customVirtualKeyboardLayers ?? {}),
  };
  const keyboards = {
    ...KEYBOARDS,
    ...(keyboard.options.customVirtualKeyboards ?? {}),
  };

  const keyboardList = keyboardIDs.replace(/\s+/g, ' ').split(' ');
  for (const keyboardName of keyboardList) {
    if (!keyboards[keyboardName]) {
      console.error(
        'MathLive: Unknown virtual keyboard "' + keyboardName + '"'
      );
      continue;
    }

    // Add the default layer to the list of layers,
    // and make sure the list of layers is uniquified.
    let keyboardLayers = keyboards[keyboardName].layers ?? [];
    if (keyboards[keyboardName].layer)
      keyboardLayers.push(keyboards[keyboardName].layer!);

    keyboardLayers = [...new Set(keyboardLayers)];

    for (const layerName of keyboardLayers) {
      if (!layers[layerName]) {
        console.error(
          'MathLive: Unknown virtual keyboard layer: "',
          layerName,
          '"'
        );
        break;
      }

      if (typeof layers[layerName] === 'object') {
        const layer = layers[layerName] as Partial<VirtualKeyboardLayer>;
        // Process JSON layer to web element based layer.

        let layerMarkup = '';
        if (typeof layer.styles === 'string')
          layerMarkup += `<style>${layer.styles}</style>`;
        else if (typeof layer.styles === 'object')
          layerMarkup += `<style>${jsonToCss(layer.styles)}</style>`;

        if (layer.backdrop) layerMarkup += `<div class='${layer.backdrop}'>`;

        if (layer.container) layerMarkup += `<div class='${layer.container}'>`;

        if (layer.rows) {
          layerMarkup += `<div class='rows'>`;
          for (const row of layer.rows) {
            layerMarkup += `<ul>`;
            for (const keycap of row) {
              layerMarkup += `<li`;
              if (keycap.class) {
                let cls = keycap.class;
                if (keycap.layer && !/layer-switch/.test(cls))
                  cls += ' layer-switch';

                if (!/separator/.test(cls)) cls += ' keycap';

                layerMarkup += ` class="${cls}"`;
              } else layerMarkup += ` class="keycap"`;

              if (keycap.key) layerMarkup += ` data-key="${keycap.key}"`;

              if (keycap.command) {
                if (typeof keycap.command === 'string')
                  layerMarkup += ` data-command='"${keycap.command}"'`;
                else {
                  layerMarkup += ` data-command='`;
                  layerMarkup += JSON.stringify(keycap.command);
                  layerMarkup += `'`;
                }
              }

              if (keycap.insert)
                layerMarkup += ` data-insert="${keycap.insert}"`;

              if (keycap.latex) layerMarkup += ` data-latex="${keycap.latex}"`;

              if (keycap.aside) layerMarkup += ` data-aside="${keycap.aside}"`;

              if (keycap.variants) {
                const keysetId =
                  Date.now().toString(36).slice(-2) +
                  Math.floor(Math.random() * 0x186a0).toString(36);

                ALT_KEYS[keysetId] = keycap.variants;
                layerMarkup += ` data-alt-keys="${keysetId}"`;
              }

              if (keycap.shifted)
                layerMarkup += ` data-shifted="${keycap.shifted}"`;

              if (keycap.shiftedCommand)
                layerMarkup += ` data-shifted-command="${keycap.shiftedCommand}"`;

              if (keycap.layer) layerMarkup += ` data-layer="${keycap.layer}"`;

              layerMarkup += `>${keycap.label ? keycap.label : ''}</li>`;
            }

            layerMarkup += `</ul>`;
          }

          layerMarkup += `</div>`;
        }

        if (layer.container) layerMarkup += '</div>';

        if (layer.backdrop) layerMarkup += '</div>';

        layers[layerName] = layerMarkup;
      }

      markup += `<div tabindex="-1" class='keyboard-layer' data-layer='${layerName}'>`;
      markup += makeKeyboardToolbar(
        keyboard.options,
        keyboardIDs,
        keyboardName
      );
      const layerMarkup = layers[layerName];
      // A layer can contain 'shortcuts' (i.e. <row> tags) that need to
      // be expanded
      if (typeof layerMarkup === 'string')
        markup += expandLayerMarkup(keyboard.options, layerMarkup);
      markup += '</div>';
    }
  }

  const result = document.createElement('div');
  result.className = 'ML__keyboard';
  if (theme) result.classList.add(theme);
  else if (keyboard.options.virtualKeyboardTheme)
    result.classList.add(keyboard.options.virtualKeyboardTheme);

  // We have a separate 'plate' element to support positioning the keyboard
  // inside custom `virtualKeyboardContainer`

  const plate = document.createElement('div');
  plate.className = 'ML__keyboard--plate';
  plate.innerHTML = keyboard.options.createHTML(markup);

  result.appendChild(plate);

  // Attach the element handlers
  const keycaps = result.querySelectorAll<HTMLElement>(
    '.keycap, .action, .fnbutton, .bigfnbutton'
  );
  for (const keycap of keycaps) {
    keycap.id =
      'ML__k' +
      Date.now().toString(36).slice(-2) +
      Math.floor(Math.random() * 0x186a0).toString(36);
  }
  makeKeycap(keyboard, [...keycaps]);

  const elementList = result.querySelectorAll<HTMLElement>('.layer-switch');
  for (const element of elementList) {
    if (element.classList.contains('shift')) {
      // This is a potential press-and-hold layer switch
      attachButtonHandlers(
        element,
        (command) => keyboard.executeCommand(command),
        {
          // When the modifier is initially pressed, we will shift the labels
          // (if available)
          pressed: 'shiftKeyboardLayer',

          // If the key is released before a delay, we switch to the target layer
          default: ['switchKeyboardLayer', element.getAttribute('data-layer')],

          // If the key is released after a longer delay, we restore the
          // shifted labels
          pressAndHoldEnd: 'unshiftKeyboardLayer',
        }
      );
    } else {
      // This is a simple layer switch
      attachButtonHandlers(
        element,
        (command) => keyboard.executeCommand(command),
        {
          default: ['switchKeyboardLayer', element.getAttribute('data-layer')],
        }
      );
    }
  }

  const layerElements = result.querySelectorAll('.keyboard-layer');
  console.assert(layerElements.length > 0, 'No virtual keyboards available');

  // Prevent a click on a virtual keyboard to focus it (and blur the mathfield)
  for (const x of layerElements)
    x.addEventListener('mousedown', (evt) => evt.preventDefault());

  // Select the first keyboard as the initial one.
  layerElements[0]?.classList.add('is-visible');

  return result;
}

/*
 * Restore the key labels and commands to the state before a modifier key
 * was pressed.
 *
 */
export function unshiftKeyboardLayer(keyboard: VirtualKeyboard): boolean {
  hideAlternateKeys();

  const keycaps = keyboard.element!.querySelectorAll<HTMLElement>(
    'div.keyboard-layer.is-visible .rows .keycap, div.keyboard-layer.is-visible .rows .action'
  );
  if (keycaps) {
    for (const keycap of keycaps) {
      const content = keycap.getAttribute('data-unshifted-content');
      if (content) {
        keycap.innerHTML = keyboard.options.createHTML(content);
        keycap.dataset.unshiftedContent = '';
      }

      const command = keycap.getAttribute('data-unshifted-command');
      if (command) {
        keycap.dataset.command = command;
        keycap.dataset.unshiftedCommand = '';
      }
    }
  }

  return false;
}

export function onUndoStateChanged(
  keyboard: VirtualKeyboard,
  canUndoState: boolean,
  canRedoState: boolean
): boolean {
  const toolbar = keyboard.element?.querySelector('.keyboard-toolbar');
  if (!toolbar) return false;

  const undoButton = toolbar.querySelector('[data-command=\'"undo"\']');
  const redoButton = toolbar.querySelector('[data-command=\'"redo"\']');

  if (redoButton) {
    if (canRedoState) redoButton.classList.remove('disabled');
    else redoButton.classList.add('disabled');
  }

  if (undoButton) {
    if (canUndoState) undoButton.classList.remove('disabled');
    else undoButton.classList.add('disabled');
  }

  return false;
}

function jsonToCssProps(json) {
  if (typeof json === 'string') return json;
  return Object.entries(json)
    .map(([k, v]) => `${k}:${v} !important`)
    .join(';');
}

function jsonToCss(json): string {
  return Object.keys(json)
    .map((k) => {
      return `${k} {${jsonToCssProps(json[k])}}`;
    })
    .join('');
}
