import { Mathfield } from './public/mathfield';
import { MathfieldConfig } from './public/config';

import { Atom } from './core/atom';
import { Span } from './core/span';
import { decompose } from './core/atom-utils';
import { parseString } from './core/parser';
import { coalesce, makeSpan, makeStruts } from './core/span';
import { MACROS, MacroDictionary } from './core/definitions';
import { MathfieldPrivate } from './editor/mathfield-class';
import AutoRender from './addons/auto-render';
import { jsonToLatex, atomtoMathJson } from './addons/math-json';
import MathLiveDebug from './addons/debug';
import { MATHSTYLES } from './core/mathstyle';
import { defaultSpeakHook } from './editor/speech';
import {
    defaultReadAloudHook,
    readAloudStatus,
    pauseReadAloud,
    resumeReadAloud,
    playReadAloud,
} from './editor/speech-read-aloud';
import { atomToSpeakableText } from './editor/atom-to-speakable-text';
import { atomToMathML } from './addons/math-ml';

function latexToMarkup(
    text: string,
    options: {
        mathstyle?: 'displaystyle' | 'textstyle';
        letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
        macros?: MacroDictionary;
        format?: string;
    }
): string | Atom[] | Span[] {
    options = options || {};
    options.mathstyle = options.mathstyle || 'displaystyle';
    options.letterShapeStyle = options.letterShapeStyle || 'auto';

    //
    // 1. Parse the formula and return a tree of atoms, e.g. 'genfrac'.
    //

    const atoms = parseString(text, 'math', null, options.macros);

    //
    // 2. Transform the math atoms into elementary spans
    //    for example from genfrac to vlist.
    //
    let spans = decompose(
        {
            mathstyle: MATHSTYLES[options.mathstyle],
            letterShapeStyle: options.letterShapeStyle,
        },
        atoms
    );

    //
    // 3. Simplify by coalescing adjacent nodes
    //    for example, from <span>1</span><span>2</span>
    //    to <span>12</span>
    //
    spans = coalesce(spans);

    if (options.format === 'span') return spans;

    //
    // 4. Wrap the expression with struts
    //
    const wrapper = makeStruts(makeSpan(spans, 'ML__base'), 'ML__mathlive');

    //
    // 5. Generate markup
    //

    return wrapper.toMarkup();
}

function makeMathField(
    element: HTMLElement,
    config?: MathfieldConfig
): Mathfield {
    config = config ?? {};
    config.speakHook = config.speakHook ?? defaultSpeakHook;
    config.readAloudHook = config.readAloudHook ?? defaultReadAloudHook;
    return new MathfieldPrivate(getElement(element), config);
}

function latexToMathML(
    latex: string,
    options?: { macros?: MacroDictionary }
): string {
    options = options ?? {};
    options.macros = { ...MACROS, ...(options.macros ?? {}) };

    return atomToMathML(
        parseString(latex, 'math', null, options.macros),
        options
    );
}

function latexToAST(latex: string, options?: { macros?: MacroDictionary }) {
    options = options ?? {};
    options.macros = { ...MACROS, ...(options.macros ?? {}) };

    return atomtoMathJson(
        parseString(latex, 'math', null, options.macros),
        options
    );
}

function astToLatex(
    ast,
    options: {
        precision?: number;
        decimalMarker?: string;
        groupSeparator?: string;
        product?: string;
        exponentProduct?: string;
        exponentMarker?: string;
        scientificNotation?: 'auto' | 'engineering' | 'on';
        beginRepeatingDigits?: string;
        endRepeatingDigits?: string;
    }
): string {
    return jsonToLatex(
        typeof ast === 'string' ? JSON.parse(ast) : ast,
        options
    );
}

function latexToSpeakableText(latex, options): string {
    options = options || {};
    options.macros = options.macros || {};
    Object.assign(options.macros, MACROS);

    const mathlist = parseString(latex, 'math', null, options.macros);

    return atomToSpeakableText(mathlist, options);
}

function renderMathInDocument(options): void {
    renderMathInElement(document.body, options);
}

function getElement(element): HTMLElement {
    let result = element;
    if (typeof element === 'string') {
        result = document.getElementById(element);
        if (!result) {
            throw Error(`The element with ID "${element}" could not be found.`);
        }
    }
    return result;
}

function renderMathInElement(element, options): void {
    if (!AutoRender) {
        console.warn('The AutoRender module is not loaded.');
        return;
    }
    options = options || {};
    options.renderToMarkup = options.renderToMarkup || latexToMarkup;
    options.renderToMathML = options.renderToMathML || latexToMathML;
    options.renderToSpeakableText =
        options.renderToSpeakableText || latexToSpeakableText;
    options.macros = options.macros || MACROS;
    AutoRender.renderMathInElement(getElement(element), options);
}

function validateNamespace(options): void {
    if (options.namespace) {
        if (!/^[a-z]+[-]?$/.test(options.namespace)) {
            throw Error(
                'options.namespace must be a string of lowercase characters only'
            );
        }
        if (!/-$/.test(options.namespace)) {
            options.namespace += '-';
        }
    }
}

function revertToOriginalContent(element: HTMLElement, options): void {
    // element is a pair: accessible span, math -- set it to the math part
    element = getElement(element).children[1] as HTMLElement;

    if (element instanceof MathfieldPrivate) {
        element.$revertToOriginalContent();
    } else {
        options = options || {};
        validateNamespace(options);
        element.innerHTML = element.getAttribute(
            'data-' + (options.namespace || '') + 'original-content'
        );
    }
}

function getOriginalContent(element: string | HTMLElement, options): string {
    // element is a pair: accessible span, math -- set it to the math part
    element = getElement(element).children[1] as HTMLElement;

    if (element instanceof MathfieldPrivate) {
        return element.originalContent;
    }
    options = options || {};
    validateNamespace(options);
    return element.getAttribute(
        'data-' + (options.namespace || '') + 'original-content'
    );
}

export default {
    latexToMarkup,
    latexToMathML,
    latexToSpeakableText,
    latexToAST,
    astToLatex,
    makeMathField,
    renderMathInDocument,
    renderMathInElement,
    revertToOriginalContent,
    getOriginalContent,

    readAloud: defaultReadAloudHook,
    readAloudStatus,
    pauseReadAloud,
    resumeReadAloud,
    playReadAloud,

    debug: {
        getStyle: MathLiveDebug.getStyle,
        getType: MathLiveDebug.getType,
        spanToString: MathLiveDebug.spanToString,
        hasClass: MathLiveDebug.hasClass,
        latexToAsciiMath: MathLiveDebug.latexToAsciiMath,
        asciiMathToLatex: MathLiveDebug.asciiMathToLatex,
    },
};
