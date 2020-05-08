import { Mathfield } from './public/mathfield';
import { MathfieldConfig, TextToSpeechOptions } from './public/config';
import { ParserErrorListener } from './public/core';

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
import { atomsToMathML } from './addons/math-ml';

import './addons/definitions-metadata';

function latexToMarkup(
    text: string,
    options: {
        mathstyle?: 'displaystyle' | 'textstyle';
        letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
        macros?: MacroDictionary;
        onError?: ParserErrorListener;
        format?: string;
    }
): string | Atom[] | Span[] {
    options = options || {};
    options.mathstyle = options.mathstyle || 'displaystyle';
    options.letterShapeStyle = options.letterShapeStyle || 'auto';

    //
    // 1. Parse the formula and return a tree of atoms, e.g. 'genfrac'.
    //

    const atoms = parseString(
        text,
        'math',
        null,
        options.macros,
        false,
        options.onError
    );

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
    options?: {
        macros?: MacroDictionary;
        onError?: ParserErrorListener;
        generateID?: boolean;
    }
): string {
    options = options ?? {};
    options.macros = { ...MACROS, ...(options.macros ?? {}) };

    return atomsToMathML(
        parseString(
            latex,
            'math',
            null,
            options.macros,
            false,
            options.onError
        ),
        options
    );
}

function latexToAST(
    latex: string,
    options?: {
        macros?: MacroDictionary;
        onError?: ParserErrorListener;
    }
) {
    options = options ?? {};
    options.macros = { ...MACROS, ...(options.macros ?? {}) };

    return atomtoMathJson(
        parseString(
            latex,
            'math',
            null,
            options.macros,
            false,
            options.onError
        ),
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

function latexToSpeakableText(
    latex: string,
    options: TextToSpeechOptions & {
        macros?: MacroDictionary;
        onError?: ParserErrorListener;
    }
): string {
    options = options ?? {};
    options.macros = options.macros || {};
    Object.assign(options.macros, MACROS);

    const mathlist = parseString(
        latex,
        'math',
        null,
        options.macros,
        false,
        options.onError
    );

    return atomToSpeakableText(
        mathlist,
        options as Required<TextToSpeechOptions>
    );
}

function renderMathInDocument(options): void {
    renderMathInElement(document.body, options);
}

function getElement(element: string | HTMLElement): HTMLElement {
    if (typeof element === 'string') {
        const result: HTMLElement = document.getElementById(element);
        if (!result) {
            throw Error(`The element with ID "${element}" could not be found.`);
        }
        return result;
    }
    return element;
}

function renderMathInElement(element, options): void {
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

// This GIT_VERSION variable will be replaced by Terser during the
// rollup build process.
export declare const GIT_VERSION: string;
export const version: string = GIT_VERSION;

export default {
    version,
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
        FUNCTIONS: MathLiveDebug.FUNCTIONS,
        MATH_SYMBOLS: MathLiveDebug.MATH_SYMBOLS,
        TEXT_SYMBOLS: MathLiveDebug.TEXT_SYMBOLS,
        ENVIRONMENTS: MathLiveDebug.ENVIRONMENTS,
        MACROS: MathLiveDebug.MACROS,
        KEYBOARD_SHORTCUTS: MathLiveDebug.KEYBOARD_SHORTCUTS,
        getShortcutMarkup: MathLiveDebug.getShortcutMarkup,
    },
};
