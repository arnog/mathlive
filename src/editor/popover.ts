import { isArray } from '../common/types';

import { MATHSTYLES, Span, makeStruts, parseLatex, Atom } from '../core/core';

import { getKeybindingsForCommand } from './keybindings';
import { attachButtonHandlers } from '../editor-mathfield/buttons';
import { getCaretPoint } from '../editor-mathfield/utils';

import type { MathfieldPrivate } from '../editor-mathfield/mathfield-private';

// A textual description of a LaTeX command.
// The value can be either a single string, or an array of string
// in order to provide alternatives or additional context.
// In that case, the first string in the array should be appropriate
// to be spoken for accessibility.
export const NOTES = {
  '\\text': 'roman text',
  '\\textrm': 'roman text',
  '\\textnormal': 'roman text',
  '\\textit': 'italic text',
  '\\textbf': 'bold text',
  '\\texttt': 'monospaced text',
  '\\textsf': 'sans-serif text',
  '\\mathrm': ['roman', '(upright)'],
  '\\mathbf': 'bold',
  '\\bf': 'bold',
  '\\bold': 'bold',
  '\\mathit': 'italic',
  '\\mathbb': 'blackboard',
  '\\mathscr': 'script',
  '\\mathtt': ['typewriter', '(monospaced)'],
  '\\mathsf': 'sans-serif',
  '\\mathcal': 'caligraphic',
  '\\frak': ['fraktur', '(gothic)'],
  '\\mathfrak': ['fraktur', '(gothic)'],

  '\\textcolor': 'text color',
  '\\color': 'color',

  '\\forall': 'for all',
  '\\exists': 'there exists',
  '\\nexists': 'there does not exist',
  '\\frac': 'fraction',
  '\\dfrac': 'display fraction',
  '\\cfrac': 'continuous fraction',
  '\\tfrac': 'text fraction',
  '\\binom': 'binomial coefficient',
  '\\dbinom': 'display binomial coefficient',
  '\\tbinom': 'text binomial coefficient',
  '\\pdiff': 'partial differential',

  '\\vec': 'vector',
  '\\check': 'caron',
  '\\acute': 'acute',
  '\\breve': 'breve',
  '\\tilde': 'tilde',
  '\\dot': 'dot',
  '\\hat': ['hat', 'circumflex'],
  '\\ddot': 'double dot',
  '\\bar': 'bar',

  '\\prime': 'prime',
  '\\doubleprime': 'double prime',
  '\\varnothing': 'empty set',
  '\\emptyset': 'empty set',
  '\\subseteq': 'subset of or <br>equal to',
  '\\supseteq': 'superset of or <br>equal to',
  '\\supset': 'superset of',
  '\\subset': 'subset of',
  '\\partial': 'partial derivative',
  '\\bigcup': 'union',
  '\\bigcap': 'intersection',
  '\\approx': 'approximately equal to',
  '\\notin': 'not an element of',
  '\\in': ['element of', 'included in'],
  '\\infty': 'infinity',
  '\\land': 'logical and',
  '\\sqrt': 'square root',
  '\\prod': 'product',
  '\\sum': 'summation',
  '\\amalg': ['amalgamation', 'coproduct', 'free product', 'disjoint union'],
  '\\cup': 'union with',
  '\\cap': 'intersection with',
  '\\int': 'integral',
  '\\iint': 'surface integral',
  '\\oint': 'curve integral',
  '\\iiint': 'volume integral',
  '\\iff': 'if and only if',
  '\\ln': 'natural logarithm',
  '\\boldsymbol': 'bold',
  '\\setminus': 'set subtraction',
  '\\stackrel': 'relation with symbol above',
  '\\stackbin': 'operator with symbol above',
  '\\underset': 'symbol with annotation below',
  '\\overset': 'symbol with annotation above',
  '\\hslash': ['h-bar', 'Planck constant'],
  '\\gtrsim': 'greater than or <br>similar to',
  '\\propto': 'proportional to',
  '\\equiv': 'equivalent to',

  '\\!': ['negative thin space', '(-3 mu)'],
  '\\ ': ['space', '(6 mu)'],
  '\\,': ['thin space', '(3 mu)'],
  '\\:': ['medium space', '(4 mu)'],
  '\\;': ['thick space', '(5 mu)'],
  '\\quad': ['1 em space', '(18 mu)'],
  '\\qquad': ['2 em space', '(36 mu)'],
  '\\enskip': ['&#189; em space', '(9 mu)'],

  '\\mp': 'minus or plus',
  '\\pm': 'plus or minus',
  '\\Im': 'Imaginary part of',
  '\\Re': 'Real part of',
  '\\gothicCapitalR': 'Real part of',
  '\\gothicCapitalI': 'Imaginary part part of',
  '\\differentialD': 'differential d',
  '\\aleph': [
    'aleph',
    'infinite cardinal',
    '<a target="_blank" href="https://en.wikipedia.org/wiki/Cardinal_number">Wikipedia <big>&#x203A;</big></a>',
  ],
  '\\beth': [
    'beth',
    'beth number',
    '<a target="_blank" href="https://en.wikipedia.org/wiki/Beth_number">Wikipedia <big>&#x203A;</big></a>',
  ],
  '\\gimel': [
    'gimel',
    'gimel function',
    '<a target="_blank" href="https://en.wikipedia.org/wiki/Gimel_function">Wikipedia <big>&#x203A;</big></a>',
  ],

  '\\O': 'empty set',
  '\\N': 'set of <br>natural numbers',
  '\\Z': 'set of <br>integers',
  '\\Q': 'set of <br>rational numbers',
  '\\C': 'set of <br>complex numbers',
  '\\R': 'set of <br>real numbers',
  '\\P': 'set of <br>prime numbers',

  '\\lesseqqgtr': 'less than, equal to or<br> greater than',
  '\\gnapprox': 'greater than and <br>not approximately',
  '\\lnapprox': 'lesser than and <br>not approximately',

  '\\j': 'dotless j',
  '\\i': 'dotless i',
  '\\cdot': 'centered dot',
  '\\lmoustache': 'left moustache',
  '\\rmoustache': 'right moustache',
  '\\nabla': ['nabla', 'del', 'differential vector operator'],

  '\\square': [
    'square',
    'd’Alembert operator',
    '<a target="_blank" href="https://en.wikipedia.org/wiki/D%27Alembert_operator">Wikipedia <big>&#x203A;</big></a>',
  ],
  '\\blacksquare': [
    'black square',
    'end of proof',
    'tombstone',
    'Halmos symbol',
  ],
  '\\Box': 'end of proof',
  '\\colon': ['such that', 'ratio'],
  '\\coloneq': ['is defined by', 'is assigned'],
  '\\Colon': ['is defined by', 'as'],
  '\\_': ['underbar', 'underscore'],
  '\\ll': 'much less than',
  '\\gg': 'much greater than',
  '\\doteq': 'approximately equal to',
  '\\Doteq': 'approximately equal to',
  '\\doteqdot': 'approximately equal to',
  '\\cong': ['isomorphism of', '(for algebras, modules...)'],
  '\\det': ['determinant of', '(of a matrix)'],
  '\\dotplus': 'Cartesian product algebra',
  '\\otimes': [
    'tensor product',
    '(of algebras)',
    'Kronecker product',
    '(of matrices)',
  ],
  '\\oplus': ['direct sum', '(of modules)'],
  '\\lb': 'base-2 logarithm',
  '\\lg': 'base-10 logarithm',
  '\\wp': [
    'Weierstrass P',
    '<a target="_blank" href="https://en.wikipedia.org/wiki/Weierstrass%27s_elliptic_functions">Wikipedia <big>&#x203A;</big></a>',
  ],
  '\\wr': [
    'wreath product',
    '<a target="_blank" href="https://en.wikipedia.org/wiki/Wreath_product">Wikipedia <big>&#x203A;</big></a>',
  ],
  '\\top': ['tautology', 'Proposition P is universally true'],
  '\\bot': ['contradiction', 'Proposition P is contradictory'],
  '\\mid': ['probability', 'of event A given B'],
  '\\mho': [
    'Siemens',
    'electrical conductance in SI unit',
    '<a target="_blank" href="https://en.wikipedia.org/wiki/Siemens_(unit)">Wikipedia <big>&#x203A;</big></a>',
  ],

  '\\Longrightarrow': 'implies',
  '\\Longleftrightarrow': 'if, and only if,',

  '\\prec': 'precedes',
  '\\preceq': 'precedes or is equal to',
  '\\succ': 'succeedes',
  '\\succeq': 'succeedes or is equal to',
  '\\perp': ['is perpendicular to', 'is independent of'],

  '\\models': [
    'entails',
    'double-turnstyle, models',
    'is a semantic consequence of',
    '<a target="_blank" href="https://en.wikipedia.org/wiki/Double_turnstile">Wikipedia <big>&#x203A;</big></a>',
  ],
  '\\vdash': [
    'satisfies',
    'turnstyle, assertion sign',
    'syntactic inference',
    '<a target="_blank" href="https://en.wikipedia.org/wiki/Turnstile_(symbol)">Wikipedia <big>&#x203A;</big></a>',
  ],

  '\\implies': ['implies', 'logical consequence'],
  '\\impliedby': ['implied by', 'logical consequence'],

  '\\surd': ['surd', 'root of', 'checkmark'],
  '\\ltimes': [
    'semi direct product',
    '<a target="_blank" href="https://en.wikipedia.org/wiki/Semidirect_product">Wikipedia <big>&#x203A;</big></a>',
  ],
  '\\rtimes': [
    'semi direct product',
    '<a target="_blank" href="https://en.wikipedia.org/wiki/Semidirect_product">Wikipedia <big>&#x203A;</big></a>',
  ],
  '\\leftthreetimes': [
    'semi direct product',
    '<a target="_blank" href="https://en.wikipedia.org/wiki/Semidirect_product">Wikipedia <big>&#x203A;</big></a>',
  ],
  '\\rightthreetimes': [
    'semi direct product',
    '<a target="_blank" href="https://en.wikipedia.org/wiki/Semidirect_product">Wikipedia <big>&#x203A;</big></a>',
  ],
  '\\divideontimes': ['divide on times'],
  '\\curlywedge': 'nor',
  '\\curlyvee': 'nand',

  '\\simeq': 'is group isomorphic with',
  '\\vartriangleleft': ['is a normal subgroup of', 'is an ideal ring of'],

  '\\circ': ['circle', 'ring', 'function composition'],

  '\\rlap': ['overlap right', '\\rlap{x}o'],
  '\\llap': ['overlap left', 'o\\llap{/}'],
  '\\colorbox': ['color box', '\\colorbox{#fbc0bd}{...}'],
  '\\ast': ['asterisk', 'reflexive closure (as a superscript)'],
  '\\bullet': 'bullet',

  '\\lim': 'limit',
};

function getNote(symbol): string {
  let result = NOTES[symbol] || '';
  if (isArray(result)) {
    result = result.join('<br>');
  }

  return result;
}

function latexToMarkup(latex: string, mf: MathfieldPrivate): string {
  const parse = parseLatex(latex, 'math', null, mf.options.macros);
  const spans = Atom.render(
    {
      mathstyle: MATHSTYLES.displaystyle,
      macros: mf.options.macros,
    },
    parse
  );

  const wrapper = makeStruts(new Span(spans, 'ML__base'), 'ML__mathlive');

  return wrapper.toMarkup();
}

export function showPopoverWithLatex(
  mf: MathfieldPrivate,
  latex: string,
  displayArrows: boolean
): void {
  if (!latex || latex.length === 0) {
    hidePopover(mf);
    return;
  }

  const command = latex;
  const commandMarkup = latexToMarkup(latex, mf);
  const commandNote = getNote(command);
  const keybinding = getKeybindingsForCommand(mf.keybindings, command).join(
    '<br>'
  );

  let template = displayArrows
    ? '<div class="ML__popover__prev-shortcut" role="button" aria-label="Previous suggestion"><span><span>&#x25B2;</span></span></div>'
    : '';
  template += '<span class="ML__popover__content" role="button">';
  template += '<div class="ML__popover__command">' + commandMarkup + '</div>';
  if (commandNote) {
    template += '<div class="ML__popover__note">' + commandNote + '</div>';
  }

  if (keybinding) {
    template += '<div class="ML__popover__shortcut">' + keybinding + '</div>';
  }

  template += '</span>';
  template += displayArrows
    ? '<div class="ML__popover__next-shortcut" role="button" aria-label="Next suggestion"><span><span>&#x25BC;</span></span></div>'
    : '';

  mf.popover.innerHTML = mf.options.createHTML(template);

  let element = mf.popover.querySelectorAll<HTMLElement>(
    '.ML__popover__content'
  );
  if (element && element.length > 0) {
    attachButtonHandlers((command) => mf.executeCommand(command), element[0], {
      default: ['complete', 'accept-suggestion'],
    });
  }

  element = mf.popover.querySelectorAll('.ML__popover__prev-shortcut');
  if (element && element.length > 0) {
    attachButtonHandlers(
      (command) => mf.executeCommand(command),
      element[0],
      'previousSuggestion'
    );
  }

  element = mf.popover.querySelectorAll('.ML__popover__next-shortcut');
  if (element && element.length > 0) {
    attachButtonHandlers(
      (command) => mf.executeCommand(command),
      element[0],
      'nextSuggestion'
    );
  }

  setTimeout(() => {
    const caretPoint = getCaretPoint(mf.field);
    if (caretPoint) setPopoverPosition(mf, caretPoint);

    mf.popover.classList.add('is-visible');
  }, 32);
}

export function updatePopoverPosition(
  mf: MathfieldPrivate,
  options?: { deferred: boolean }
): void {
  // Check that the mathfield is still valid
  // (we're calling ourselves from requestAnimationFrame() and the mathfield
  // could have gotten destroyed
  if (!mf.element || mf.element.mathfield !== mf) return;

  // If the popover pane is visible...
  if (!mf.popover.classList.contains('is-visible')) return;
  if (options?.deferred) {
    // Call ourselves again later, typically after the
    // rendering/layout of the DOM has been completed
    // (don't do it on next frame, it might be too soon)
    window.setTimeout(() => updatePopoverPosition(mf), 100);
    return;
  }

  if (mf.model.at(mf.model.position)?.type !== 'latex') {
    hidePopover(mf);
  } else {
    // ... get the caret position
    const caretPoint = getCaretPoint(mf.field);
    if (caretPoint) setPopoverPosition(mf, caretPoint);
  }
}

function setPopoverPosition(
  mf: MathfieldPrivate,
  position: { x: number; y: number; height: number }
): void {
  // Get screen width & height (browser compatibility)
  const screenHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  const screenWidth =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;

  // Get scrollbar size. This would be 0 in mobile device (also no needed).
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;
  const scrollbarHeight =
    window.innerHeight - document.documentElement.clientHeight;
  const virtualkeyboardHeight = mf.virtualKeyboard.height;
  // Prevent screen overflow horizontal.
  if (position.x + mf.popover.offsetWidth / 2 > screenWidth - scrollbarWidth) {
    mf.popover.style.left = `${
      screenWidth - mf.popover.offsetWidth - scrollbarWidth
    }px`;
  } else if (position.x - mf.popover.offsetWidth / 2 < 0) {
    mf.popover.style.left = '0';
  } else {
    mf.popover.style.left = `${position.x - mf.popover.offsetWidth / 2}px`;
  }

  // And position the popover right below or above the caret
  if (
    position.y + mf.popover.offsetHeight + 5 >
    screenHeight - scrollbarHeight - virtualkeyboardHeight
  ) {
    mf.popover.classList.add('ML__popover--reverse-direction');
    mf.popover.style.top = `${
      position.y - position.height - mf.popover.offsetHeight - 5
    }px`;
  } else {
    mf.popover.classList.remove('ML__popover--reverse-direction');
    mf.popover.style.top = `${position.y + 5}px`;
  }
}

export function hidePopover(mf: MathfieldPrivate): void {
  mf.suggestionIndex = 0;
  if (mf.popover) {
    mf.popover.classList.remove('is-visible');
    mf.popover.innerHTML = '';
  }
}
