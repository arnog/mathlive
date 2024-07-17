"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
exports.__esModule = true;
exports.version = exports.renderMathInElement = exports.renderMathInDocument = exports.globalMathLive = void 0;
__exportStar(require("./public/mathlive"), exports);
var static_render_1 = require("./addons/static-render");
__exportStar(require("./addons/static-render"), exports);
require("./virtual-keyboard/commands");
var mathlive_ssr_1 = require("./public/mathlive-ssr");
// Note that this global is only global to the "browsing context". In the
// case of a page containing iframes, each iframe is a separate browsing
// context, and therefore will have its own `globalMathLive()`
/** @hidden */
function globalMathLive() {
    var _a;
    var _b;
    (_a = globalThis[_b = Symbol["for"]('io.cortexjs.mathlive')]) !== null && _a !== void 0 ? _a : (globalThis[_b] = {});
    return globalThis[Symbol["for"]('io.cortexjs.mathlive')];
}
exports.globalMathLive = globalMathLive;
/**
 * Transform all the elements in the document body that contain LaTeX code
 * into typeset math.
 *
 * **Caution**
 *
 * This is a very expensive call, as it needs to parse the entire
 * DOM tree to determine which elements need to be processed. In most cases
 * this should only be called once per document, once the DOM has been loaded.
 *
 * To render a specific element, use {@linkcode renderMathInElement | renderMathInElement()}
 *
 *
 * @example
 * import { renderMathInDocument } from 'https://unpkg.com/mathlive?module';
 * renderMathInDocument();
 *
 * @category Static Rendering
 * @keywords render, document, autorender
 */
function renderMathInDocument(options) {
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', function () {
            return renderMathInElement(document.body, options);
        });
    else
        renderMathInElement(document.body, options);
}
exports.renderMathInDocument = renderMathInDocument;
function getElement(element) {
    if (typeof element === 'string') {
        var result = document.getElementById(element);
        if (result === null)
            throw new Error("The element with ID \"".concat(element, "\" could not be found."));
        return result;
    }
    return element;
}
/**
 * Transform all the children of `element` that contain LaTeX code
 * into typeset math, recursively.
 *
 *
 * @param element An HTML DOM element, or a string containing
 * the ID of an element.
 *
 * @example
 * import { renderMathInElement } from 'https://unpkg.com/mathlive?module';
 * renderMathInElement("formula");
 *
 * @category Static Rendering
 * @keywords render, element, htmlelement
 */
function renderMathInElement(element, options) {
    var _a, _b, _c, _d;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            return renderMathInElement(element, options);
        });
        return;
    }
    var el = getElement(element);
    if (!el)
        return;
    var optionsPrivate = options !== null && options !== void 0 ? options : {};
    (_a = optionsPrivate.renderToMarkup) !== null && _a !== void 0 ? _a : (optionsPrivate.renderToMarkup = mathlive_ssr_1.convertLatexToMarkup);
    (_b = optionsPrivate.renderToMathML) !== null && _b !== void 0 ? _b : (optionsPrivate.renderToMathML = mathlive_ssr_1.convertLatexToMathMl);
    (_c = optionsPrivate.renderToSpeakableText) !== null && _c !== void 0 ? _c : (optionsPrivate.renderToSpeakableText = mathlive_ssr_1.convertLatexToSpeakableText);
    (_d = optionsPrivate.serializeToLatex) !== null && _d !== void 0 ? _d : (optionsPrivate.serializeToLatex = mathlive_ssr_1.convertMathJsonToLatex);
    (0, static_render_1._renderMathInElement)(el, optionsPrivate);
}
exports.renderMathInElement = renderMathInElement;
/**
 * Current version: `{{SDK_VERSION}}`
 *
 * The version string of the SDK using the [semver](https://semver.org/) convention:
 *
 * `MAJOR`.`MINOR`.`PATCH`
 *
 * * **`MAJOR`** is incremented for incompatible API changes
 * * **`MINOR`** is incremented for new features
 * * **`PATCH`** is incremented for bug fixes
 */
exports.version = {
    mathlive: '{{SDK_VERSION}}'
};
/** @internal */
// export const debug = {
//   FUNCTIONS: MathLiveDebug.FUNCTIONS,
//   MATH_SYMBOLS: MathLiveDebug.MATH_SYMBOLS,
//   ENVIRONMENTS: MathLiveDebug.ENVIRONMENTS,
//   DEFAULT_KEYBINDINGS: MathLiveDebug.DEFAULT_KEYBINDINGS,
//   getKeybindingMarkup: MathLiveDebug.getKeybindingMarkup,
// };
