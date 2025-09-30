import { Atom } from '../core/atom';

import { toMathML } from './atom-to-math-ml';
import { LeftRightAtom } from '../atoms/leftright';
import { isArray } from '../common/types';
import { osPlatform } from '../ui/utils/capabilities';
import { ArrayAtom } from '../atoms/array';
import { getMacros } from '../latex-commands/definitions-utils';
import { PromptAtom } from '../atoms/prompt';

declare global {
  interface Window {
    sre: any;
  }
}

// Markup
// Two common flavor of markups: SSML and 'mac'. The latter is only available
// when using the native TTS synthesizer on Mac OS.
// Use SSML in the production rules below. The markup will either be striped
// off or replaced with the 'mac' markup as necessary.
//
// SSML                                             Mac
// ----                                             ----
// <emphasis>WORD</emphasis>                        [[emph +]]WORD
// <break time="150ms"/>                            [[slc 150]]
// <say-as interpret-as="character">A</say-as>      [[char LTRL] A [[char NORM]]

// https://developer.apple.com/library/content/documentation/UserExperience/Conceptual/SpeechSynthesisProgrammingGuide/FineTuning/FineTuning.html#//apple_ref/doc/uid/TP40004365-CH5-SW3

// https://pdfs.semanticscholar.org/8887/25b82b8dbb45dd4dd69b36a65f092864adb0.pdf

// "<audio src='non_existing_file.au'>File could not be played.</audio>"

// "I am now <prosody rate='+0.06'>speaking 6% faster.</prosody>"

const PRONUNCIATION: Record<string, string> = {
  '\\alpha': 'alpha ',
  '\\mu': 'mew ',
  '\\sigma': 'sigma ',
  '\\pi': 'pie ',
  '\\imaginaryI': 'imaginary eye ',
  '\\imaginaryJ': 'imaginary jay ',

  '\\sum': 'Summation ',
  '\\prod': 'Product ',

  '+': 'plus ',
  '-': 'minus ',
  ';': '<break time="150ms"/> semi-colon <break time="150ms"/>',
  ',': '<break time="150ms"/> comma  <break time="150ms"/>',
  '|': '<break time="150ms"/>Vertical bar<break time="150ms"/>',
  '(': '<break time="150ms"/>Open paren. <break time="150ms"/>',
  ')': '<break time="150ms"/> Close paren. <break time="150ms"/>',
  '=': 'equals ',
  '<': 'is less than ',
  '\\lt': 'is less than ',
  '<=': 'is less than or equal to ',
  '\\le': 'is less than or equal to ',
  '\\gt': 'is greater than ',
  '>': 'is greater than ',
  '\\pm': 'plus or minus',
  '\\mp': 'minus or plus',
  '\\ge': 'is greater than or equal to ',
  '\\geq': 'is greater than or equal to ',
  '\\leq': 'is less than or equal to ',
  '\\ne': 'is not equal to ',
  '\\neq': 'is not equal to ',
  '!': 'factorial ',
  '\\sin': 'sine ',
  '\\cos': 'cosine ',
  '\u200B': '',
  '\u2212': 'minus ',
  ':': '<break time="150ms"/> such that <break time="200ms"/> ',
  '\\colon': '<break time="150ms"/> such that <break time="200ms"/> ',
  '\\hbar': 'etch bar ',
  '\\iff': '<break time="200ms"/>if, and only if, <break time="200ms"/>',
  '\\Longleftrightarrow':
    '<break time="200ms"/>if, and only if, <break time="200ms"/>',
  '\\land': 'and ',
  '\\lor': 'or ',
  '\\neg': 'not ',
  '\\div': 'divided by ',

  '\\forall': 'for all ',
  '\\exists': 'there exists ',
  '\\nexists': 'there does not exists ',

  '\\in': 'element of ',

  '\\N':
    'the set <break time="150ms"/><say-as interpret-as="character">n</say-as>',
  '\\C':
    'the set <break time="150ms"/><say-as interpret-as="character">c</say-as>',
  '\\Z':
    'the set <break time="150ms"/><say-as interpret-as="character">z</say-as>',
  '\\Q':
    'the set <break time="150ms"/><say-as interpret-as="character">q</say-as>',

  '\\infty': 'infinity ',

  '\\nabla': 'nabla ',

  '\\partial': 'partial derivative of ',

  '\\cdot': 'times ',
  '\\cdots': 'dot dot dot ',

  '\\Rightarrow': 'implies ',

  '\\lparen': '<break time="150ms"/>open paren<break time="150ms"/>',
  '\\rparen': '<break time="150ms"/>close paren<break time="150ms"/>',
  '\\lbrace': '<break time="150ms"/>open brace<break time="150ms"/>',
  '\\{': '<break time="150ms"/>open brace<break time="150ms"/>',
  '\\rbrace': '<break time="150ms"/>close brace<break time="150ms"/>',
  '\\}': '<break time="150ms"/>close brace<break time="150ms"/>',
  '\\langle': '<break time="150ms"/>left angle bracket<break time="150ms"/>',
  '\\rangle': '<break time="150ms"/>right angle bracket<break time="150ms"/>',
  '\\lfloor': '<break time="150ms"/>open floor<break time="150ms"/>',
  '\\rfloor': '<break time="150ms"/>close floor<break time="150ms"/>',
  '\\lceil': '<break time="150ms"/>open ceiling<break time="150ms"/>',
  '\\rceil': '<break time="150ms"/>close ceiling<break time="150ms"/>',
  '\\vert': '<break time="150ms"/>vertical bar<break time="150ms"/>',
  '\\mvert': '<break time="150ms"/>divides<break time="150ms"/>',
  '\\lvert': '<break time="150ms"/>left vertical bar<break time="150ms"/>',
  '\\rvert': '<break time="150ms"/>right vertical bar<break time="150ms"/>',
  // '\\lbrack':		'left bracket',
  // '\\rbrack':		'right bracket',
  '\\lbrack': '<break time="150ms"/> open square bracket <break time="150ms"/>',
  '\\rbrack':
    '<break time="150ms"/> close square bracket <break time="150ms"/>',

  // Need to add code to detect singluar/plural. Until then spoken as plural since that is vastly more common
  // note: need to worry about intervening &InvisibleTimes;.
  // note: need to also do this when in numerator of fraction and number preceeds fraction
  // note: need to do this for <msup>
  'mm': 'millimeters',
  'cm': 'centimeters',
  'km': 'kilometers',
  'kg': 'kilograms',
};

const ENVIRONMENTS_NAMES = {
  'array': 'array',
  'matrix': 'matrix',
  'pmatrix': 'parenthesis matrix',
  'bmatrix': 'square brackets matrix',
  'Bmatrix': 'braces matrix',
  'vmatrix': 'bars matrix',
  'Vmatrix': 'double bars matrix',
  'matrix*': 'matrix',
  'smallmatrix': 'small matrix',
};

function getSpokenName(latex: string): string {
  let result = '';
  if (latex.startsWith('\\')) result = ' ' + latex.replace('\\', '') + ' ';

  return result;
}

function isAtomic(atoms: undefined | Readonly<Atom[]>): boolean {
  let count = 0;
  if (isArray<Atom>(atoms))
    for (const atom of atoms) if (atom.type !== 'first') count += 1;

  return count === 1;
}

function atomicID(atoms: undefined | Readonly<Atom[]>): string {
  if (isArray<Atom>(atoms)) {
    for (const atom of atoms)
      if (atom.type !== 'first' && atom.id) return atom.id.toString();
  }

  return '';
}

function atomicValue(atoms: undefined | Readonly<Atom[]>): string {
  let result = '';
  if (isArray<Atom>(atoms)) {
    for (const atom of atoms) {
      if (atom.type !== 'first' && typeof atom.value === 'string')
        result += atom.value;
    }
  }

  return result;
}

function atomsAsText(atoms: Readonly<Atom[]> | undefined): string {
  if (!atoms) return '';
  return atoms.map((atom) => atom.value).join('');
}

function atomsAsPotentialText(
  atoms: Readonly<Atom[]> | undefined
): string | undefined {
  if (!atoms) return undefined;
  if (atoms.some((x) => x.type !== 'first' && x.value === undefined))
    return undefined;
  return atoms.map((atom) => atom.value).join('');
}

function emph(s: string) {
  return `<emphasis>${s}</emphasis>`;
}

function atomsToSpeakableFragment(
  mode: 'text' | 'math',
  atom: Readonly<Atom[]>
) {
  let result = '';
  let isInDigitRun = false; // Need to group sequence of digits
  let isInTextRun = false; // Need to group text
  for (let i = 0; i < atom.length; i++) {
    if (atom[i].type === 'first') continue;

    if (atom[i].mode !== 'text') isInTextRun = false;

    if (
      i < atom.length - 2 &&
      atom[i].type === 'mopen' &&
      atom[i + 2].type === 'mclose' &&
      atom[i + 1].type === 'mord'
    ) {
      result += ' of ';
      result += emph(atomToSpeakableFragment(mode, atom[i + 1]));
      i += 2;
    } else if (atom[i].mode === 'text') {
      if (isInTextRun) result += atom[i].value ?? ' ';
      else {
        isInTextRun = true;
        result += atomToSpeakableFragment('text', atom[i]);
      }
      // '.' and ',' should only be allowed if prev/next entry is a digit
      // However, if that isn't the case, this still works because 'toSpeakableFragment' is called in either case.
      // Note: the first char in a digit/text run potentially needs to have a 'mark', hence the call to 'toSpeakableFragment'
    } else if (atom[i].isDigit()) {
      if (isInDigitRun) result += atom[i].asDigit();
      else {
        isInDigitRun = true;
        result += atomToSpeakableFragment(mode, atom[i]);
      }
    } else {
      isInDigitRun = false;
      result += atomToSpeakableFragment(mode, atom[i]);
    }
  }
  return result;
}

function atomToSpeakableFragment(
  mode: 'text' | 'math',
  atom: undefined | Atom | Readonly<Atom[]>
): string {
  function letter(c: string): string {
    if (!globalThis.MathfieldElement.textToSpeechMarkup) {
      if (/[a-z]/.test(c)) return " '" + c.toUpperCase() + "'";
      if (/[A-Z]/.test(c)) return " 'capital " + c.toUpperCase() + "'";
      return c;
    }

    if (/[a-z]/.test(c))
      return ` <say-as interpret-as="character">${c}</say-as>`;
    if (/[A-Z]/.test(c))
      return `capital <say-as interpret-as="character">${c.toLowerCase()}</say-as>`;
    return c;
  }

  if (!atom) return '';

  if (isArray(atom)) return atomsToSpeakableFragment(mode, atom);

  let result = '';

  if (atom.id && mode === 'math')
    result += '<mark name="' + atom.id.toString() + '"/>';

  if (atom.mode === 'text') return result + atom.value;

  let numer = '';
  let denom = '';
  let body = '';
  let supsubHandled = false;
  const { command } = atom;

  switch (command) {
    case '\\vec':
      return 'vector ' + atomToSpeakableFragment(mode, atom.body);
    case '\\acute':
      return atomToSpeakableFragment(mode, atom.body) + ' acute';
    case '\\grave':
      return atomToSpeakableFragment(mode, atom.body) + ' grave';
    case '\\dot':
      return 'dot over' + atomToSpeakableFragment(mode, atom.body);
    case '\\ddot':
      return 'double dot over' + atomToSpeakableFragment(mode, atom.body);
    case '\\mathring':
      return 'ring over' + atomToSpeakableFragment(mode, atom.body);
    case '\\tilde':
    case '\\widetilde':
      return 'tilde over' + atomToSpeakableFragment(mode, atom.body);
    case '\\bar':
      return atomToSpeakableFragment(mode, atom.body) + ' bar';
    case '\\breve':
      return atomToSpeakableFragment(mode, atom.body) + ' breve';
    case '\\check':
    case '\\widecheck':
      return 'check over ' + atomToSpeakableFragment(mode, atom.body);
    case '\\hat':
    case '\\widehat':
      return 'hat over' + atomToSpeakableFragment(mode, atom.body);

    case '\\overarc':
    case '\\overparen':
    case '\\wideparen':
      return 'arc over ' + atomToSpeakableFragment(mode, atom.body);
    case '\\underarc':
    case '\\underparen':
      return 'arc under ' + atomToSpeakableFragment(mode, atom.body);
    case '\\mathop':
      return (
        atomsAsPotentialText(atom.body) ??
        atomToSpeakableFragment(mode, atom.body)
      );
    case '\\mathit':
      return (
        atomsAsPotentialText(atom.body) ??
        atomToSpeakableFragment(mode, atom.body)
      );
    case '\\mathrm':
      return (
        atomsAsPotentialText(atom.body) ??
        atomToSpeakableFragment(mode, atom.body)
      );
    case '\\mathbb':
      return (
        'blackboard' +
        (atomsAsPotentialText(atom.body) ??
          atomToSpeakableFragment(mode, atom.body))
      );
  }

  switch (atom.type) {
    case 'prompt':
      const input =
        atom.body!.length > 1
          ? 'start input . <break time="500ms"/> ' +
            atomToSpeakableFragment(mode, atom.body) +
            '. <break time="500ms"/> end input'
          : 'blank';
      result +=
        ' <break time="300ms"/> ' +
        input +
        '. <break time="700ms"/>' +
        ((atom as PromptAtom).correctness ?? '') +
        ' . <break time="700ms"/> ';
      break;
    case 'array':
      const array = (atom as ArrayAtom).rows;
      const environment = (atom as ArrayAtom).environmentName;

      if (Object.keys(ENVIRONMENTS_NAMES).includes(environment)) {
        result += ` begin ${ENVIRONMENTS_NAMES[environment]} `;
        for (let i = 0; i < array.length; i++) {
          if (i > 0) result += ',';
          result += ` row ${i + 1} `;
          for (let j = 0; j < array[i].length; j++) {
            if (j > 0) result += ',';
            result += ` column ${j + 1}: `;
            result += atomToSpeakableFragment('math', array[i][j]);
          }
        }
        result += ` end ${ENVIRONMENTS_NAMES[environment]} `;
      }

      // @todo add support for other array environments
      break;
    case 'group':
      if (command === '\\ne') result += ' not equal ';
      else if (command === '\\not') {
        result += ' not ';
        result += atomToSpeakableFragment('math', atom.body);
      } else {
        // @todo add support for other groups
        result += atomToSpeakableFragment('math', atom.body);
      }
      break;
    case 'root':
      result += atomToSpeakableFragment('math', atom.body);
      break;

    case 'genfrac':
      numer = atomToSpeakableFragment('math', atom.above);
      denom = atomToSpeakableFragment('math', atom.below);
      if (isAtomic(atom.above) && isAtomic(atom.below)) {
        const COMMON_FRACTIONS = {
          '1/2': ' half ',
          '1/3': ' one third ',
          '2/3': ' two third',
          '1/4': ' one quarter ',
          '3/4': ' three quarter ',
          '1/5': ' one fifth ',
          '2/5': ' two fifths ',
          '3/5': ' three fifths ',
          '4/5': ' four fifths ',
          '1/6': ' one sixth ',
          '5/6': ' five sixths ',
          '1/8': ' one eight ',
          '3/8': ' three eights ',
          '5/8': ' five eights ',
          '7/8': ' seven eights ',
          '1/9': ' one ninth ',
          '2/9': ' two ninths ',
          '4/9': ' four ninths ',
          '5/9': ' five ninths ',
          '7/9': ' seven ninths ',
          '8/9': ' eight ninths ',
          // '1/10':     ' one tenth ',
          // '1/12':     ' one twelfth ',
          // 'x/2':     ' <say-as interpret-as="character">X</say-as> over 2',
        };
        const commonFraction =
          COMMON_FRACTIONS[
            atomicValue(atom.above) + '/' + atomicValue(atom.below)
          ];
        if (commonFraction) result = commonFraction;
        else result += numer + ' over ' + denom;
      } else {
        result +=
          ' the fraction <break time="150ms"/>' +
          numer +
          ' over <break time="150ms"/>' +
          denom +
          '.<break time="150ms"/> End fraction.<break time="150ms"/>';
      }

      break;
    case 'surd':
      body = atomToSpeakableFragment('math', atom.body);

      if (atom.hasEmptyBranch('above')) {
        result += isAtomic(atom.body)
          ? ' the square root of ' + body + ' , '
          : ' the square root of <break time="200ms"/>' +
            body +
            '. <break time="200ms"/> End square root';
      } else {
        let index = atomToSpeakableFragment('math', atom.above);
        index = index.trim();
        const index2 = index.replace(/<mark([^/]*)\/>/g, '');
        if (index2 === '3') {
          result +=
            ' the cube root of <break time="200ms"/>' +
            body +
            '. <break time="200ms"/> End cube root';
        } else if (index2 === 'n') {
          result +=
            ' the nth root of <break time="200ms"/>' +
            body +
            '. <break time="200ms"/> End root';
        } else {
          result +=
            ' the root with index: <break time="200ms"/>' +
            index +
            ', of <break time="200ms"/>' +
            body +
            '. <break time="200ms"/> End root';
        }
      }

      break;
    case 'leftright':
      {
        const delimAtom = atom as LeftRightAtom;
        result +=
          (delimAtom.leftDelim
            ? PRONUNCIATION[delimAtom.leftDelim]
            : undefined) ?? delimAtom.leftDelim;
        result += atomToSpeakableFragment('math', atom.body);
        result +=
          (delimAtom.rightDelim
            ? PRONUNCIATION[delimAtom.rightDelim]
            : undefined) ?? delimAtom.rightDelim;
      }

      break;
    case 'rule':
      // @todo
      break;
    case 'overunder':
      // @todo
      break;
    case 'overlap':
      // @todo
      break;
    case 'macro':
      // @todo implement custom speech for macros
      // Workaround: if the macro is expand = true, speak the atom body, otherwise speak the macro name
      const macroName = command.replace(/^\\/g, '');
      const macro = getMacros()[macroName];
      if (macro?.expand) {
        result += atomToSpeakableFragment('math', atom.body);
      }
      else {
        result += `${macroName} `;
      }
      break;
    case 'placeholder':
      result += 'placeholder ';
      break;
    case 'delim':
    case 'sizeddelim':
    case 'mord':
    case 'minner':
    case 'mbin':
    case 'mrel':
    case 'mpunct':
    case 'mopen':
    case 'mclose': {
      if (
        command === '\\mathbin' ||
        command === '\\mathrel' ||
        command === '\\mathopen' ||
        command === '\\mathclose' ||
        command === '\\mathpunct' ||
        command === '\\mathord' ||
        command === '\\mathinner'
      ) {
        result = atomToSpeakableFragment(mode, atom.body);
        break;
      }

      let atomValue = atom.isDigit() ? atom.asDigit() : atom.value;
      let latexValue = atom.command;
      if (atom.type === 'delim' || atom.type === 'sizeddelim') {
        latexValue = atom.value;
        atomValue = latexValue;
      }

      if (mode === 'text') result += atomValue;
      else {
        if (atom.type === 'mbin') result += '<break time="150ms"/>';

        if (atomValue) {
          const value =
            PRONUNCIATION[atomValue] ||
            (latexValue ? PRONUNCIATION[latexValue.trim()] : '');
          if (value) result += ' ' + value;
          else {
            const spokenName = latexValue
              ? getSpokenName(latexValue.trim())
              : '';

            result += spokenName ? spokenName : letter(atomValue);
          }
        } else result += atomToSpeakableFragment('math', atom.body);

        if (atom.type === 'mbin') result += '<break time="150ms"/>';
      }

      break;
    }

    case 'mop':
    case 'operator':
    case 'extensible-symbol':
      // @todo
      if (atom.value !== '\u200B') {
        // Not ZERO-WIDTH
        const trimLatex = atom.command;
        if (trimLatex === '\\sum') {
          if (
            !atom.hasEmptyBranch('superscript') &&
            !atom.hasEmptyBranch('subscript')
          ) {
            let sup = atomToSpeakableFragment('math', atom.superscript);
            sup = sup.trim();
            let sub = atomToSpeakableFragment('math', atom.subscript);
            sub = sub.trim();
            result +=
              ' the summation from <break time="200ms"/>' +
              sub +
              '<break time="200ms"/> to  <break time="200ms"/>' +
              sup +
              '<break time="200ms"/> of <break time="150ms"/>';
            supsubHandled = true;
          } else if (!atom.hasEmptyBranch('subscript')) {
            let sub = atomToSpeakableFragment('math', atom.subscript);
            sub = sub.trim();
            result +=
              ' the summation from <break time="200ms"/>' +
              sub +
              '<break time="200ms"/> of <break time="150ms"/>';
            supsubHandled = true;
          } else result += ' the summation of';
        } else if (trimLatex === '\\prod') {
          if (
            !atom.hasEmptyBranch('superscript') &&
            !atom.hasEmptyBranch('subscript')
          ) {
            let sup = atomToSpeakableFragment('math', atom.superscript);
            sup = sup.trim();
            let sub = atomToSpeakableFragment('math', atom.subscript);
            sub = sub.trim();
            result +=
              ' the product from <break time="200ms"/>' +
              sub +
              '<break time="200ms"/> to <break time="200ms"/>' +
              sup +
              '<break time="200ms"/> of <break time="150ms"/>';
            supsubHandled = true;
          } else if (!atom.hasEmptyBranch('subscript')) {
            let sub = atomToSpeakableFragment('math', atom.subscript);
            sub = sub.trim();
            result +=
              ' the product from <break time="200ms"/>' +
              sub +
              '<break time="200ms"/> of <break time="150ms"/>';
            supsubHandled = true;
          } else result += ' the product  of ';
        } else if (trimLatex === '\\int') {
          if (
            !atom.hasEmptyBranch('superscript') &&
            !atom.hasEmptyBranch('subscript')
          ) {
            let sup = atomToSpeakableFragment('math', atom.superscript);
            sup = sup.trim();
            let sub = atomToSpeakableFragment('math', atom.subscript);
            sub = sub.trim();
            result +=
              ' the integral from <break time="200ms"/>' +
              emph(sub) +
              '<break time="200ms"/> to <break time="200ms"/>' +
              emph(sup) +
              ' <break time="200ms"/> of ';
            supsubHandled = true;
          } else result += ' the integral of <break time="200ms"/> ';
        } else if (
          trimLatex === '\\operatorname' ||
          trimLatex === '\\operatorname*'
        )
          result += atomsAsText(atom.body) + ' ';
        else if (typeof atom.value === 'string') {
          const value =
            PRONUNCIATION[atom.value] ??
            (atom.command ? PRONUNCIATION[atom.command] : undefined);
          result += value ? value : ' ' + atom.value;
        } else if (atom.command) {
          if (atom.command === '\\mathop')
            result += atomToSpeakableFragment('math', atom.body);
          else {
            result += atom.command.startsWith('\\')
              ? ' ' + atom.command.slice(1)
              : ' ' + atom.command;
          }
        }
      }

      break;

    case 'enclose':
      body = atomToSpeakableFragment('math', atom.body);

      result += ' crossed out ' + body + '. End crossed out.';
      break;

    case 'space':
    case 'spacing':
      // @todo
      break;
  }

  if (!supsubHandled && !atom.hasEmptyBranch('superscript')) {
    let sup = atomToSpeakableFragment(mode, atom.superscript);
    sup = sup.trim();
    const sup2 = sup.replace(/<[^>]*>/g, '');
    if (isAtomic(atom.superscript)) {
      if (mode === 'math') {
        const id = atomicID(atom.superscript);
        if (id) result += '<mark name="' + id + '"/>';
      }

      if (sup2 === '\u2032') result += ' prime ';
      else if (sup2 === '2') result += ' squared ';
      else if (sup2 === '3') result += ' cubed ';
      else if (Number.isNaN(Number.parseInt(sup2)))
        result += ' to the ' + sup + '; ';
      else {
        result +=
          ' to the <say-as interpret-as="ordinal">' +
          sup2 +
          '</say-as> power; ';
      }
    } else if (Number.isNaN(Number.parseInt(sup2)))
      result += ' raised to the ' + sup + '; ';
    else {
      result +=
        ' raised to the <say-as interpret-as="ordinal">' +
        sup2 +
        '</say-as> power; ';
    }
  }

  if (!supsubHandled && !atom.hasEmptyBranch('subscript')) {
    let sub = atomToSpeakableFragment('math', atom.subscript);
    sub = sub.trim();
    result += isAtomic(atom.subscript)
      ? ' sub ' + sub
      : ' subscript ' + sub + '. End subscript. ';
  }

  return result;
}

/**
 * @param  atoms The atoms to represent as speakable text.
 */
export function atomToSpeakableText(atoms: Atom | Readonly<Atom[]>): string {
  const mfe = globalThis.MathfieldElement;
  if (mfe.textToSpeechRules === 'sre' && ('sre' in window || 'SRE' in window)) {
    const mathML = toMathML(atoms);
    if (mathML) {
      if (mfe.textToSpeechMarkup) {
        mfe.textToSpeechRulesOptions = mfe.textToSpeechRulesOptions ?? {};
        mfe.textToSpeechRulesOptions = {
          ...mfe.textToSpeechRulesOptions,
          markup: mfe.textToSpeechMarkup,
        };
        if (mfe.textToSpeechRulesOptions.markup === 'ssml') {
          mfe.textToSpeechRulesOptions = {
            ...mfe.textToSpeechRulesOptions,
            markup: 'ssml_step',
          };
        }

        mfe.textToSpeechRulesOptions = {
          ...mfe.textToSpeechRulesOptions,
          rate: mfe.speechEngineRate,
        };
      }

      const SRE = window['SRE'] ?? globalThis.sre.System.getInstance();

      if (mfe.textToSpeechRulesOptions)
        SRE.setupEngine(mfe.textToSpeechRulesOptions);

      let result = '';
      try {
        result = SRE.toSpeech(mathML);
      } catch (e) {
        console.error(
          `MathLive {{SDK_VERSION}}: \`SRE.toSpeech()\` runtime error`,
          e
        );
      }

      return result;
    }

    return '';
  }

  let result = atomToSpeakableFragment('math', atoms);

  if (mfe.textToSpeechMarkup === 'ssml') {
    let prosody = '';
    if (mfe.speechEngineRate)
      prosody = '<prosody rate="' + mfe.speechEngineRate + '">';

    result =
      `<?xml version="1.0"?><speak version="1.1" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">` +
      '<amazon:auto-breaths>' +
      prosody +
      '<p><s>' +
      result +
      '</s></p>' +
      (prosody ? '</prosody>' : '') +
      '</amazon:auto-breaths>' +
      '</speak>';
  } else if (mfe.textToSpeechMarkup === 'mac' && osPlatform() === 'macos') {
    // Convert SSML to Mac markup
    result = result
      .replace(/<mark([^/]*)\/>/g, '')
      .replace(/<emphasis>/g, '[[emph+]]')
      .replace(/<\/emphasis>/g, '')
      .replace(/<break time="(\d*)ms"\/>/g, '[[slc $1]]')
      .replace(/<say-as[^>]*>/g, '')
      .replace(/<\/say-as>/g, '');
  } else {
    // If no markup was requested, or 'mac' markup, but we're not on a mac,
    // remove any that we may have
    // Strip out the SSML markup
    result = result.replace(/<[^>]*>/g, '').replace(/\s{2,}/g, ' ');
  }

  return result;
}
