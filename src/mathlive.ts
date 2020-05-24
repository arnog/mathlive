import type { Mathfield } from './public/mathfield';
import type { MathfieldConfig, TextToSpeechOptions } from './public/config';
import type { ErrorListener } from './public/core';

import { decompose } from './core/atom-utils';
import { parseString } from './core/parser';
import { coalesce, makeSpan, makeStruts } from './core/span';
import { MACROS, MacroDictionary } from './core/definitions';
import { MathfieldPrivate } from './editor/mathfield-class';
import AutoRender from './addons/auto-render';
import {
    jsonToLatex,
    atomtoMathJson,
    MathJsonLatexOptions,
    MathJson,
} from './addons/math-json';
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
import { AutoRenderOptionsPrivate } from './addons/auto-render';

function latexToMarkup(
    text: string,
    options: {
        mathstyle?: 'displaystyle' | 'textstyle';
        letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
        macros?: MacroDictionary;
        onError?: ErrorListener;
        format?: string;
    }
): string {
    options = options ?? {};
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

    if (options.format === 'span') return (spans as unknown) as string;

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
        onError?: ErrorListener;
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
    options?: MathJsonLatexOptions & {
        macros?: MacroDictionary;
        onError?: ErrorListener;
    }
): MathJson {
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

function astToLatex(ast: MathJson, options: MathJsonLatexOptions): string {
    return jsonToLatex(
        typeof ast === 'string' ? JSON.parse(ast) : ast,
        options
    );
}

function latexToSpeakableText(
    latex: string,
    options: TextToSpeechOptions & {
        macros?: MacroDictionary;
        onError?: ErrorListener;
    }
): string {
    options = options ?? {};
    options.macros = options.macros ?? {};
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

function renderMathInDocument(options: AutoRenderOptionsPrivate): void {
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

function renderMathInElement(
    element: HTMLElement,
    options: AutoRenderOptionsPrivate
): void {
    options = options ?? {};
    options.renderToMarkup = options.renderToMarkup ?? latexToMarkup;
    options.renderToMathML = options.renderToMathML ?? latexToMathML;
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

function revertToOriginalContent(
    element: string | HTMLElement | MathfieldPrivate,
    options: AutoRenderOptionsPrivate
): void {
    if (element instanceof MathfieldPrivate) {
        element.$revertToOriginalContent();
    } else {
        // element is a pair: accessible span, math -- set it to the math part
        element = getElement(element).children[1] as HTMLElement;
        options = options ?? {};
        validateNamespace(options);
        const html = element.getAttribute(
            'data-' + (options.namespace ?? '') + 'original-content'
        );
        element.innerHTML = options.createHTML
            ? options.createHTML(html)
            : html;
    }
}

function getOriginalContent(
    element: string | HTMLElement,
    options: AutoRenderOptionsPrivate
): string {
    if (element instanceof MathfieldPrivate) {
        return element.originalContent;
    }
    // element is a pair: accessible span, math -- set it to the math part
    element = getElement(element).children[1] as HTMLElement;
    options = options ?? {};
    validateNamespace(options);
    return element.getAttribute(
        'data-' + (options.namespace ?? '') + 'original-content'
    );
}

// This SDK_VERSION variable will be replaced during the build process.
const version = '{{SDK_VERSION}}';

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
        DEFAULT_KEYBINDINGS: MathLiveDebug.DEFAULT_KEYBINDINGS,
        getKeybindingMarkup: MathLiveDebug.getKeybindingMarkup,
    },
};
