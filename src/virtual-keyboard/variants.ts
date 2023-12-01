import { Scrim } from '../ui/utils/scrim';
import {
  executeKeycapCommand,
  normalizeKeycap,
  parentKeycap,
  renderKeycap,
} from './utils';
import { VirtualKeyboard } from './virtual-keyboard';
import { FOREGROUND_COLORS, BACKGROUND_COLORS } from '../core/color';
import MathfieldElement from '../public/mathfield-element';
import type { VirtualKeyboardKeycap } from '../public/virtual-keyboard';

const VARIANTS: {
  [variantID: string]: (string | Partial<VirtualKeyboardKeycap>)[];
} = {
  // '0-extended': [
  //   '\\emptyset',
  //   '\\varnothing',
  //   '\\infty',
  //   { latex: '#?_0', insert: '#@_0' },
  //   '\\circ',
  //   '\\bigcirc',
  //   '\\bullet',
  // ],
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
  ',': ['{,}', '.', ';', '\\colon'],
  'a': [
    { latex: '\\aleph', aside: 'aleph' },
    { latex: '\\forall', aside: 'for all' },
    'à',
    'á',
    'â',
    'ä',
    'æ',
  ],
  'b': [{ latex: '\\beth', aside: 'beth' }],
  'c': [{ latex: '\\C', aside: 'set of complex numbers' }, 'ç'],
  'd': [{ latex: '\\daleth', aside: 'daleth' }],
  'e': [
    { latex: '\\exponentialE', aside: 'exponential e' },
    { latex: '\\exists', aside: 'there is' },
    { latex: '\\nexists', aside: 'there isn’t' },
    'è',
    'é',
    'ê',
    'ë',
  ],
  'g': [{ latex: '\\gimel', aside: 'gimel' }],
  'h': [
    { latex: '\\hbar', aside: 'h bar' },
    { latex: '\\hslash', aside: 'h slash' },
  ],
  'i': [{ latex: '\\imaginaryI', aside: 'imaginary i' }, 'ì', 'í', 'î', 'ï'],
  'j': [{ latex: '\\imaginaryJ', aside: 'imaginary j' }],
  'l': [{ latex: '\\ell', aside: 'ell' }],
  'n': [{ latex: '\\mathbb{N}', aside: 'set of natural numbers' }, 'ñ'],
  'o': ['ø', 'œ', 'ò', 'ó', 'ô', 'ö', 'œ'],
  'p': [{ latex: '\\mathbb{P}', aside: 'set of primes' }],
  'q': [{ latex: '\\mathbb{Q}', aside: 'set of rational numbers' }],
  'r': [{ latex: '\\mathbb{R}', aside: 'set of real numbers' }],
  'u': ['ù', 'ú', 'û', 'ü'],
  'z': [{ latex: '\\mathbb{Z}', aside: 'set of integers' }],
  'y': ['ý', 'ÿ'],

  'space': [
    {
      latex: '\\char"203A\\!\\char"2039',
      insert: '\\!',
      aside: 'negative thin space<br>⁻³⧸₁₈ em',
    },
    {
      latex: '\\char"203A\\,\\char"2039',
      insert: '\\,',
      aside: 'thin space<br>³⧸₁₈ em',
    },
    {
      latex: '\\char"203A\\:\\char"2039',
      insert: '\\:',
      aside: 'medium space<br>⁴⧸₁₈ em',
    },
    {
      latex: '\\char"203A\\;\\char"2039',
      insert: '\\;',
      aside: 'thick space<br>⁵⧸₁₈ em',
    },
    {
      latex: '\\char"203A\\ \\char"2039',
      insert: '\\ ',
      aside: '⅓ em',
    },
    {
      latex: '\\char"203A\\enspace\\char"2039',
      insert: '\\enspace',
      aside: '½ em',
    },
    {
      latex: '\\char"203A\\quad\\char"2039',
      insert: '\\quad',
      aside: '1 em',
    },
    {
      latex: '\\char"203A\\qquad\\char"2039',
      insert: '\\qquad',
      aside: '2 em',
    },
  ],
};

let variantPanelController: AbortController | null;

export function showVariantsPanel(
  element: HTMLElement,
  onClose?: () => void
): void {
  const keyboard = VirtualKeyboard.singleton;
  if (!keyboard) return;
  const keycap = parentKeycap(element);
  const variantDef = keyboard.getKeycap(keycap?.id)?.variants ?? '';
  if (
    (typeof variantDef === 'string' && !hasVariants(variantDef)) ||
    (Array.isArray(variantDef) && variantDef.length === 0)
  ) {
    onClose?.();
    return;
  }

  const variants = {};
  let markup = '';

  for (const variant of getVariants(variantDef)) {
    const keycap = normalizeKeycap(variant);
    const id =
      Date.now().toString(36).slice(-2) +
      Math.floor(Math.random() * 0x186a0).toString(36);
    variants[id] = keycap;
    const [keycapMarkup, keycapCls] = renderKeycap(keycap);
    markup += `<div id=${id} class="item ${keycapCls}">${keycapMarkup}</div>`;
  }

  const variantPanel = document.createElement('div');
  variantPanel.setAttribute('aria-hidden', 'true');
  variantPanel.className = 'MLK__variant-panel';

  // Reset variant panel height
  variantPanel.style.height = 'auto';

  const l = Object.keys(variants).length;
  let w = 5; // l >= 14, width 5

  if (l === 1) w = 1;
  else if (l === 2 || l === 4) w = 2;
  else if (l === 3 || l === 5 || l === 6) w = 3;
  else if (l >= 7 && l < 14) w = 4;

  variantPanel.style.width = `calc(var(--variant-keycap-length) * ${w} + 12px)`;

  variantPanel.innerHTML = MathfieldElement.createHTML(markup);

  //
  // Create the scrim and attach the variants panel to it
  //
  if (!Scrim.scrim) Scrim.scrim = new Scrim();
  Scrim.scrim.open({
    root: keyboard?.container?.querySelector('.ML__keyboard'),
    child: variantPanel,
  });

  variantPanelController = new AbortController();
  const { signal } = variantPanelController;

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
    // Add the events handlers (which may dismiss the panel) only after the
    // panel has been displayed
    requestAnimationFrame(() => {
      variantPanel.addEventListener(
        'pointerup',
        (ev) => {
          const target = parentKeycap(ev.target);
          if (!target?.id || !variants[target.id]) return;

          executeKeycapCommand(variants[target.id]);

          hideVariantsPanel();
          onClose?.();
          ev.preventDefault();
        },
        { capture: true, passive: false, signal }
      );

      variantPanel.addEventListener(
        'pointerenter',
        (ev) => {
          const target = parentKeycap(ev.target);
          if (!target?.id || !variants[target.id]) return;

          target.classList.add('is-active');
        },
        { capture: true, signal }
      );

      variantPanel.addEventListener(
        'pointerleave',
        (ev) => {
          const target = parentKeycap(ev.target);
          if (!target?.id || !variants[target.id]) return;

          target.classList.remove('is-active');
        },
        { capture: true, signal }
      );

      window.addEventListener(
        'pointercancel',
        () => {
          hideVariantsPanel();
          onClose?.();
        },
        { signal }
      );

      window.addEventListener(
        'pointerup',
        () => {
          hideVariantsPanel();
          onClose?.();
        },
        { signal }
      );
    });
  }

  return;
}

export function hideVariantsPanel(): void {
  variantPanelController?.abort();
  variantPanelController = null;
  Scrim.scrim?.close();
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

export function hasVariants(id: string): boolean {
  return VARIANTS[id] !== undefined;
}

function getVariants(
  id: string | (string | Partial<VirtualKeyboardKeycap>)[]
): (string | Partial<VirtualKeyboardKeycap>)[] {
  if (typeof id !== 'string') return id;

  if (!VARIANTS[id]) VARIANTS[id] = makeVariants(id) ?? [];
  return VARIANTS[id];
}
