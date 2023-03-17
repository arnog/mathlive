import { Scrim } from 'editor/scrim';
import { makeKeycap } from './utils';
import { VirtualKeyboard } from './virtual-keyboard';
import { FOREGROUND_COLORS, BACKGROUND_COLORS } from 'core/color';
import { VirtualKeyboardKeycap } from 'public/options';
import MathfieldElement from 'public/mathfield-element';

const gVariants: {
  [variantID: string]: (string | Partial<VirtualKeyboardKeycap>)[];
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

export function showVariantsPanel(variantsId: string): boolean {
  const variants = getVariants(variantsId);
  const variantPanel = document.createElement('div');
  variantPanel.setAttribute('aria-hidden', 'true');
  variantPanel.className = 'ML__keyboard MLK__variant-panel';

  if (variants.length >= 14) {
    // Width 5: 5 key wide
    variantPanel.style.width = '236px';
  } else if (variants.length >= 7) {
    // Width 4
    variantPanel.style.width = '286px';
  } else if (variants.length === 4 || variants.length === 2) {
    // Width 2
    variantPanel.style.width = '146px';
  } else if (variants.length === 1) {
    // Width 1
    variantPanel.style.width = '86px';
  } else {
    // Width 3
    variantPanel.style.width = '146px';
  }

  // Reset container height
  variantPanel.style.height = 'auto';
  let markup = '';
  for (const altKey of variants) {
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
  variantPanel.innerHTML = MathfieldElement.createHTML(markup);

  //
  // Associate a command which each of the variant keycaps
  //
  const keyboard = VirtualKeyboard.singleton;
  makeKeycap(
    keyboard,
    [...variantPanel.querySelectorAll('li')],
    'performVariant'
  );

  //
  // Create the scrim and attach the variants panel to it
  //
  if (!Scrim.scrim) Scrim.scrim = new Scrim();
  Scrim.scrim.open({
    root: keyboard.container,
    child: variantPanel,
  });

  //
  // Position the variants panel
  //
  const keycapElement = keyboard?.element?.querySelector(
    '.MLK__rows ul li[data-variants="' + variantsId + '"]'
  );

  const position = keycapElement?.getBoundingClientRect();
  if (position) {
    if (position.top - variantPanel.clientHeight < 0) {
      // AltContainer.style.maxWidth = '320px';  // Up to six columns
      variantPanel.style.width = 'auto';
      if (variants.length <= 6) variantPanel.style.height = '56px'; // 1 row
      else if (variants.length <= 12)
        variantPanel.style.height = '108px'; // 2 rows
      else if (variants.length <= 18)
        variantPanel.style.height = '205px'; // 3 rows
      else variantPanel.classList.add('compact');
    }

    const top =
      (position.top - variantPanel.clientHeight + 5).toString() + 'px';
    const left =
      Math.max(
        0,
        Math.min(
          window.innerWidth - variantPanel.offsetWidth,
          (position.left + position.right - variantPanel.offsetWidth) / 2
        )
      ) + 'px';
    variantPanel.style.transform = 'translate(' + left + ',' + top + ')';
    variantPanel.classList.add('is-visible');
  }

  return false;
}

export function hideVariantsPanel(): boolean {
  const variantPanel = document.querySelector<HTMLElement>(
    '.MLK__variant-panel'
  );
  if (variantPanel) {
    variantPanel.classList.remove('is-visible');
    variantPanel.innerHTML = '';
  }

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
        class: 'small-button',
        content:
          '<span style="border-radius:50%;width:32px;height:32px; box-sizing: border-box; border: 3px solid ' +
          FOREGROUND_COLORS[color] +
          '"></span>',
        command: ['applyStyle', { color }],
      });
      return result;
    }
  }

  if (id === 'background-color') {
    const result: Partial<VirtualKeyboardKeycap>[] = [];
    for (const color of Object.keys(BACKGROUND_COLORS)) {
      result.push({
        class: 'small-button',
        content:
          '<span style="border-radius:50%;width:32px;height:32px; background:' +
          BACKGROUND_COLORS[color] +
          '"></span>',
        command: ['applyStyle', { backgroundColor: color }],
      });
    }
    return result;
  }

  if (/^[A-Z]$/.test(id)) {
    const result: Partial<VirtualKeyboardKeycap>[] = [];
    result.unshift({
      latex: '\\mathbb{' + id + '}',
      aside: 'blackboard',
      insert: '\\mathbb{' + id + '}',
    });
    result.unshift({
      latex: '\\mathbf{' + id + '}',
      aside: 'bold',
      insert: '\\mathbf{' + id + '}',
    });
    result.unshift({
      latex: '\\mathsf{' + id + '}',
      aside: 'sans',
      insert: '\\mathsf{' + id + '}',
    });
    result.unshift({
      latex: '\\mathtt{' + id + '}',
      aside: 'monospace',
      insert: '\\mathtt{' + id + '}',
    });
    result.unshift({
      latex: '\\mathcal{' + id + '}',
      aside: 'calligraphy',
      insert: '\\mathcal{' + id + '}',
    });
    result.unshift({
      latex: '\\mathfrak{' + id + '}',
      aside: 'fraktur',
      insert: '\\mathfrak{' + id + '}',
    });

    return result;
  }

  if (/^[a-z]$/.test(id)) {
    const result: Partial<VirtualKeyboardKeycap>[] = [];
    result.unshift({
      latex: '\\mathsf{' + id + '}',
      aside: 'sans',
      insert: '\\mathsf{' + id + '}',
    });
    result.unshift({
      latex: '\\mathbf{' + id + '}',
      aside: 'bold',
      insert: '\\mathbf{' + id + '}',
    });
    result.unshift({
      latex: '\\mathtt{' + id + '}',
      aside: 'monospace',
      insert: '\\mathtt{' + id + '}',
    });
    result.unshift({
      latex: '\\mathfrak{' + id + '}',
      aside: 'fraktur',
      insert: '\\mathfrak{' + id + '}',
    });
    return result;
  }

  if (/^[0-9]$/.test(id)) {
    const result: Partial<VirtualKeyboardKeycap>[] = [];
    result.unshift({
      latex: '\\mathsf{' + id + '}',
      aside: 'sans',
      insert: '\\mathsf{' + id + '}',
    });
    result.unshift({
      latex: '\\mathbf{' + id + '}',
      aside: 'bold',
      insert: '\\mathbf{' + id + '}',
    });
    result.unshift({
      latex: '\\mathtt{' + id + '}',
      aside: 'monospace',
      insert: '\\mathtt{' + id + '}',
    });
    result.unshift({
      latex: '\\mathfrak{' + id + '}',
      aside: 'fraktur',
      insert: '\\mathfrak{' + id + '}',
    });
    return result;
  }

  return undefined;
}

export function getVariants(
  id: string
): (string | Partial<VirtualKeyboardKeycap>)[] {
  if (!gVariants[id]) gVariants[id] = makeVariants(id) ?? [];
  return gVariants[id];
}

export function setVariants(
  id: string,
  value: (string | Partial<VirtualKeyboardKeycap>)[]
): void {
  gVariants[id] = value;
}
