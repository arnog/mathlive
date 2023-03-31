import { Scrim } from '../editor/scrim';
import {
  executeKeycapCommand,
  expandKeycap,
  latexToMarkup,
  makeKeycaps,
  parentKeycap,
  renderKeycap,
} from './utils';
import { VirtualKeyboard } from './virtual-keyboard';
import { FOREGROUND_COLORS, BACKGROUND_COLORS } from '../core/color';
import { VirtualKeyboardKeycap } from '../public/options';
import MathfieldElement from '../public/mathfield-element';

const gVariants: {
  [variantID: string]: (string | Partial<VirtualKeyboardKeycap>)[];
} = {
  '0-extended': [
    '\\emptyset',
    '\\varnothing',
    '\\infty',
    { latex: '#?_0', insert: '#@_0' },
    '\\circ',
    '\\bigcirc',
    '\\bullet',
  ],
  '0': ['\\varnothing', '\\infty'],
  '1': ['\\frac{1}{#@}', '#@^{-1}', '\\times 10^{#?}', '\\phi', '\\imaginaryI'],
  '2': ['\\frac{1}{2}', '#@^2', '\\sqrt2', '\\exponentialE'],
  '3': ['\\frac{1}{3}', '#@^3', '\\sqrt3', '\\pi'],
  '4': ['\\frac{1}{4}', '#@^4'],
  '5': ['\\frac{1}{5}', '#@^5', '\\sqrt5'],
  '6': ['\\frac{1}{6}', '#@^6'],
  '7': ['\\frac{1}{7}', '#@^7'],
  '8': ['\\frac{1}{8}', '#@^8'],
  '9': ['\\frac{1}{9}', '#@^9'],
  '.': ['.', ',', ';', '\\colon'],
  '.-extended': [
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
    { latex: '\\prod_{#0}^{#0}', class: 'small' },
  ],
  '*-extended': [
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

  '+-extended': [
    '\\pm',
    '\\mp',
    '\\sum',
    { latex: '\\sum_{n\\mathop=0}^{\\infty}', class: 'small' },
    '\\dotplus',
    '\\oplus',
  ],
  '+': [{ latex: '\\sum_{#0}^{#0}', class: 'small' }],
  '--extended': ['\\pm', '\\mp', '\\ominus', '\\vert #0  \\vert'],
  '-': ['\\pm'],

  '/-extended': ['\\divideontimes', '/', '\\div', '\\%'],
  '/': ['/', '\\div', '\\%'],

  '(': ['\\lbrack', '\\langle', '\\lfloor', '\\lceil', '\\lbrace'],

  ')': ['\\rbrack', '\\rangle', '\\rfloor', '\\rceil', '\\rbrace'],

  '(-extended': [
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
  ')-extended': [
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
    '\\neq',
    '\\equiv',
    '\\varpropto',
    '\\thickapprox',
    '\\lt',
    '\\gt',
    '\\le',
    '\\ge',
  ],
  '=-extended': [
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

let variantPanelController: AbortController;

export function showVariantsPanel(
  element: HTMLElement,
  variantList: string | (string | Partial<VirtualKeyboardKeycap>)[],
  onClose?: () => void
): boolean {
  const variants = {};
  let markup = '';

  for (const variant of getVariants(variantList)) {
    const keycap = expandKeycap(variant);
    const id =
      Date.now().toString(36).slice(-2) +
      Math.floor(Math.random() * 0x186a0).toString(36);
    variants[id] = keycap;
    markup += `<li id=${id} class="MLK__keycap ${
      keycap.class ?? ''
    }">${renderKeycap(keycap)}</li>`;
  }

  const variantPanel = document.createElement('div');
  variantPanel.setAttribute('aria-hidden', 'true');
  variantPanel.className = 'ML__keyboard MLK__variant-panel';

  // Reset variant panel height
  variantPanel.style.height = 'auto';

  const l = Object.keys(variants).length;
  let w = 5; // l >= 14, width 5

  if (l === 1) w = 1;
  else if (l === 2 || l === 4) w = 2;
  else if (l === 3 || l === 5 || l === 6) w = 3;
  else if (l >= 7 && l < 14) w = 4;

  variantPanel.style.width = `calc(var(--variant-keycap-length) * ${w} + 12px)`;

  variantPanel.innerHTML = MathfieldElement.createHTML(`<ul>${markup}</ul>`);

  const keyboard = VirtualKeyboard.singleton;

  //
  // Create the scrim and attach the variants panel to it
  //
  if (!Scrim.scrim) Scrim.scrim = new Scrim();
  Scrim.scrim.open({ root: keyboard.container, child: variantPanel });

  variantPanelController?.abort();
  variantPanelController = new AbortController();
  variantPanel.addEventListener(
    'pointerup',
    (ev) => {
      let target = parentKeycap(ev.target);
      if (!target || !target.id || !variants[target.id]) return;

      executeKeycapCommand(variants[target.id]);

      hideVariantsPanel();
      onClose?.();
      ev.preventDefault();
    },
    { capture: true, signal: variantPanelController.signal }
  );

  window.addEventListener(
    'pointercancel',
    () => {
      hideVariantsPanel();
      onClose?.();
    },
    { signal: variantPanelController.signal }
  );

  window.addEventListener(
    'pointerup',
    (ev) => {
      hideVariantsPanel();
      onClose?.();
    },
    { signal: variantPanelController.signal }
  );

  //
  // Associate a command which each of the variant keycaps
  //
  // makeKeycaps(variantPanel.querySelectorAll('li'), 'performVariant');

  //
  // Position the variants panel
  //

  const position = element?.getBoundingClientRect();
  if (position) {
    if (position.top - variantPanel.clientHeight < 0) {
      // variantPanel.style.maxWidth = '320px';  // Up to six columns
      variantPanel.style.width = 'auto';
      if (l <= 6) variantPanel.style.height = '56px'; // 1 row
      else if (l <= 12) variantPanel.style.height = '108px'; // 2 rows
      else if (l <= 18) variantPanel.style.height = '205px'; // 3 rows
      else variantPanel.classList.add('compact');
    }

    const left = Math.max(
      0,
      Math.min(
        window.innerWidth - variantPanel.offsetWidth,
        (position.left + position.right - variantPanel.offsetWidth) / 2
      )
    );
    const top = position.top - variantPanel.clientHeight + 5;
    variantPanel.style.transform = `translate(${left}px, ${top}px)`;
    variantPanel.classList.add('is-visible');
  }

  return false;
}

export function hideVariantsPanel(): boolean {
  variantPanelController?.abort();
  Scrim.scrim?.close();

  return false;
}

function makeVariants(
  id: string
): undefined | (string | Partial<VirtualKeyboardKeycap>)[] {
  if (id === 'foreground-color') {
    const result: Partial<VirtualKeyboardKeycap>[] = [];
    for (const color of Object.keys(FOREGROUND_COLORS)) {
      result.push({
        class: 'swatch-button',
        label:
          '<span style="border: 3px solid ' +
          FOREGROUND_COLORS[color] +
          '"></span>',
        command: ['applyStyle', { color }],
      });
    }
    return result;
  }

  if (id === 'background-color') {
    const result: Partial<VirtualKeyboardKeycap>[] = [];
    for (const color of Object.keys(BACKGROUND_COLORS)) {
      result.push({
        class: 'swatch-button',
        label:
          '<span style="background:' + BACKGROUND_COLORS[color] + '"></span>',
        command: ['applyStyle', { backgroundColor: color }],
      });
    }
    return result;
  }

  return undefined;
}

function getVariants(
  id: string | (string | Partial<VirtualKeyboardKeycap>)[]
): (string | Partial<VirtualKeyboardKeycap>)[] {
  if (typeof id !== 'string') return id;
  if (!gVariants[id]) gVariants[id] = makeVariants(id) ?? [];
  return gVariants[id];
}
