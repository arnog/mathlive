"use strict";
/* eslint no-console:0 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports._renderMathInElement = void 0;
var stylesheet_1 = require("../common/stylesheet");
var fonts_1 = require("../core/fonts");
var parse_math_string_1 = require("../formats/parse-math-string");
require("../core/atom");
function findEndOfMath(delimiter, text, startIndex) {
    // Adapted from
    // https://github.com/Khan/perseus/blob/master/src/perseus-markdown.jsx
    var index = startIndex;
    var braceLevel = 0;
    var delimLength = delimiter.length;
    while (index < text.length) {
        var character = text[index];
        if (braceLevel <= 0 && text.slice(index, index + delimLength) === delimiter)
            return index;
        if (character === '\\')
            index++;
        else if (character === '{')
            braceLevel++;
        else if (character === '}')
            braceLevel--;
        index++;
    }
    return -1;
}
function splitAtDelimiters(startData, leftDelim, rightDelim, mathstyle, format) {
    var _a;
    if (format === void 0) { format = 'latex'; }
    var finalData = [];
    for (var _i = 0, startData_1 = startData; _i < startData_1.length; _i++) {
        var startDatum = startData_1[_i];
        if (startDatum.type === 'text') {
            var text = startDatum.data;
            var lookingForLeft = true;
            var currIndex = 0;
            var nextIndex = void 0;
            nextIndex = text.indexOf(leftDelim);
            if (nextIndex !== -1) {
                currIndex = nextIndex;
                if (currIndex > 0) {
                    finalData.push({
                        type: 'text',
                        data: text.slice(0, currIndex)
                    });
                }
                lookingForLeft = false;
            }
            var done = false;
            while (!done) {
                if (lookingForLeft) {
                    nextIndex = text.indexOf(leftDelim, currIndex);
                    if (nextIndex === -1) {
                        done = true;
                        break;
                    }
                    if (currIndex !== nextIndex) {
                        finalData.push({
                            type: 'text',
                            data: text.slice(currIndex, nextIndex)
                        });
                    }
                    currIndex = nextIndex;
                }
                else {
                    nextIndex = findEndOfMath(rightDelim, text, currIndex + leftDelim.length);
                    if (nextIndex === -1) {
                        done = true;
                        break;
                    }
                    var formula = text.slice(currIndex + leftDelim.length, nextIndex);
                    if (format === 'ascii-math')
                        _a = (0, parse_math_string_1.parseMathString)(formula, { format: 'ascii-math' }), formula = _a[1];
                    finalData.push({
                        type: 'math',
                        data: formula,
                        rawData: text.slice(currIndex, nextIndex + rightDelim.length),
                        mathstyle: mathstyle
                    });
                    currIndex = nextIndex + rightDelim.length;
                }
                lookingForLeft = !lookingForLeft;
            }
            if (currIndex < text.length) {
                finalData.push({
                    type: 'text',
                    data: text.slice(currIndex)
                });
            }
        }
        else
            finalData.push(startDatum);
    }
    return finalData;
}
function splitWithDelimiters(text, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var data = [{ type: 'text', data: text }];
    // We need to check `display` first because `$$` is a common prefix
    // and `$` would match it first.
    if ((_b = (_a = options.TeX) === null || _a === void 0 ? void 0 : _a.delimiters) === null || _b === void 0 ? void 0 : _b.display) {
        options.TeX.delimiters.display.forEach(function (_a) {
            var openDelim = _a[0], closeDelim = _a[1];
            data = splitAtDelimiters(data, openDelim, closeDelim, 'displaystyle');
        });
    }
    if ((_d = (_c = options.TeX) === null || _c === void 0 ? void 0 : _c.delimiters) === null || _d === void 0 ? void 0 : _d.inline) {
        options.TeX.delimiters.inline.forEach(function (_a) {
            var openDelim = _a[0], closeDelim = _a[1];
            data = splitAtDelimiters(data, openDelim, closeDelim, 'textstyle');
        });
    }
    if ((_f = (_e = options.asciiMath) === null || _e === void 0 ? void 0 : _e.delimiters) === null || _f === void 0 ? void 0 : _f.inline) {
        options.asciiMath.delimiters.inline.forEach(function (_a) {
            var openDelim = _a[0], closeDelim = _a[1];
            data = splitAtDelimiters(data, openDelim, closeDelim, 'textstyle', 'ascii-math');
        });
    }
    if ((_h = (_g = options.asciiMath) === null || _g === void 0 ? void 0 : _g.delimiters) === null || _h === void 0 ? void 0 : _h.display) {
        options.asciiMath.delimiters.display.forEach(function (_a) {
            var openDelim = _a[0], closeDelim = _a[1];
            data = splitAtDelimiters(data, openDelim, closeDelim, 'displaystyle', 'ascii-math');
        });
    }
    return data;
}
function createMathMLNode(latex, options) {
    // Create a node for AT (Assistive Technology, e.g. screen reader) to speak, etc.
    // This node has a style that makes it be invisible to display but is seen by AT
    var span = document.createElement('span');
    span.setAttribute('translate', 'no');
    try {
        var html = "<math xmlns='http://www.w3.org/1998/Math/MathML'>" +
            options.renderToMathML(latex) +
            '</math>';
        span.innerHTML = globalThis.MathfieldElement.createHTML(html);
    }
    catch (error) {
        console.error("MathLive {{SDK_VERSION}}:  Could not convert \"".concat(latex, "\"' to MathML with ").concat(error));
        span.textContent = latex;
    }
    span.className = 'ML__sr-only';
    return span;
}
function createMarkupNode(text, options, mathstyle, createNodeOnFailure) {
    // Create a node for displaying math.
    //   This is slightly ugly because in the case of failure to create the markup,
    //   sometimes a text node is desired and sometimes not.
    //   'createTextNodeOnFailure' controls this and null is returned when no node is created.
    // This node is made invisible to AT (screen readers)
    try {
        var html = options.renderToMarkup(text, __assign(__assign({}, options), { defaultMode: mathstyle === 'displaystyle' ? 'math' : 'inline-math' }));
        var element = document.createElement('span');
        element.dataset.latex = text;
        element.style.display =
            mathstyle === 'displaystyle' ? 'flex' : 'inline-flex';
        element.setAttribute('aria-hidden', 'true');
        element.setAttribute('translate', 'no');
        element.innerHTML = globalThis.MathfieldElement.createHTML(html);
        return element;
    }
    catch (error) {
        console.error("Could not parse'" + text + "' with ", error);
        if (createNodeOnFailure)
            return document.createTextNode(text);
    }
    return null;
}
function createAccessibleMarkupPair(latex, mathstyle, options, createNodeOnFailure) {
    var _a;
    // Create a math node (a span with an accessible component and a visual component)
    // If there is an error in parsing the latex, 'createNodeOnFailure' controls whether
    //   'null' is returned or an accessible node with the text used.
    var markupNode = createMarkupNode(latex, options, mathstyle ? mathstyle : 'textstyle', createNodeOnFailure);
    var accessibleContent = (_a = options.renderAccessibleContent) !== null && _a !== void 0 ? _a : '';
    if (markupNode && /\b(mathml|speakable-text)\b/i.test(accessibleContent)) {
        var fragment = document.createElement('span');
        if (/\bmathml\b/i.test(accessibleContent) && options.renderToMathML)
            fragment.append(createMathMLNode(latex, options));
        if (/\bspeakable-text\b/i.test(accessibleContent) &&
            options.renderToSpeakableText) {
            var span = document.createElement('span');
            span.setAttribute('translate', 'no');
            var html = options.renderToSpeakableText(latex);
            span.innerHTML = globalThis.MathfieldElement.createHTML(html);
            span.className = 'ML__sr-only';
            fragment.append(span);
        }
        fragment.append(markupNode);
        return fragment;
    }
    return markupNode;
}
function scanText(text, options) {
    var _a;
    // If the text starts with '\begin'... (this is a MathJAX behavior)
    var fragment = null;
    if (((_a = options.TeX) === null || _a === void 0 ? void 0 : _a.processEnvironments) && /^\s*\\begin/.test(text)) {
        fragment = document.createDocumentFragment();
        var node = createAccessibleMarkupPair(text, '', options, true);
        if (node)
            fragment.appendChild(node);
    }
    else {
        if (!text.trim())
            return null;
        var data = splitWithDelimiters(text, options);
        if (data.length === 1 && data[0].type === 'text') {
            // This text contains no math. No need to continue processing
            return null;
        }
        fragment = document.createDocumentFragment();
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var datum = data_1[_i];
            if (datum.type === 'text')
                fragment.appendChild(document.createTextNode(datum.data));
            else {
                var node = createAccessibleMarkupPair(datum.data, datum.mathstyle === 'textstyle' ? 'textstyle' : 'displaystyle', options, true);
                if (node)
                    fragment.appendChild(node);
            }
        }
    }
    return fragment;
}
function scanElement(element, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
        // This is a node with textual content only. Perhaps an opportunity
        // to simplify and avoid creating extra nested elements...
        var text = (_a = element.childNodes[0].textContent) !== null && _a !== void 0 ? _a : '';
        if (((_b = options.TeX) === null || _b === void 0 ? void 0 : _b.processEnvironments) && /^\s*\\begin/.test(text)) {
            element.textContent = '';
            var node = createAccessibleMarkupPair(text, '', options, true);
            if (node)
                element.append(node);
            return;
        }
        var data = splitWithDelimiters(text, options);
        if (data.length === 1 && data[0].type === 'math') {
            // The entire content is a math expression: we can replace the content
            // with the latex markup without creating additional wrappers.
            element.textContent = '';
            var node = createAccessibleMarkupPair(data[0].data, data[0].mathstyle === 'textstyle' ? 'textstyle' : 'displaystyle', options, true);
            if (node)
                element.append(node);
            return;
        }
        if (data.length === 1 && data[0].type === 'text') {
            // This element only contained text with no math. No need to
            // do anything.
            return;
        }
    }
    // Iterate backward, as we will be replacing childNode with a documentfragment
    // which may insert multiple nodes (one for the accessible markup, one for
    // the formula)
    for (var i = element.childNodes.length - 1; i >= 0; i--) {
        var childNode = element.childNodes[i];
        if (childNode.nodeType === 3) {
            //
            // A text node
            //
            // Look for math mode delimiters inside the text
            var content = (_c = childNode.textContent) !== null && _c !== void 0 ? _c : '';
            // Coalesce adjacent text nodes
            while (i > 0 && element.childNodes[i - 1].nodeType === 3) {
                i--;
                content = ((_d = element.childNodes[i].textContent) !== null && _d !== void 0 ? _d : '') + content;
            }
            content = content.trim();
            if (!content)
                continue;
            var frag = scanText(content, options);
            if (frag) {
                i += frag.childNodes.length - 1;
                childNode.replaceWith(frag);
            }
        }
        else if (childNode.nodeType === 1) {
            //
            // An element node
            //
            var el = childNode;
            var tag = childNode.nodeName.toLowerCase();
            if (tag === 'script') {
                var scriptNode = childNode;
                var textContent = undefined;
                if ((_e = options.processScriptTypePattern) === null || _e === void 0 ? void 0 : _e.test(scriptNode.type))
                    textContent = (_f = scriptNode.textContent) !== null && _f !== void 0 ? _f : '';
                else if ((_g = options.processMathJSONScriptTypePattern) === null || _g === void 0 ? void 0 : _g.test(scriptNode.type)) {
                    try {
                        textContent = (_h = options.serializeToLatex) === null || _h === void 0 ? void 0 : _h.call(options, JSON.parse((_j = scriptNode.textContent) !== null && _j !== void 0 ? _j : ''));
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                if (textContent) {
                    var style = 'textstyle';
                    for (var _i = 0, _t = scriptNode.type.split(';'); _i < _t.length; _i++) {
                        var l = _t[_i];
                        var _u = l.toLowerCase().split('='), key = _u[0], value = _u[1];
                        if (key.trim() === 'mode')
                            style = value.trim() === 'display' ? 'displaystyle' : 'textstyle';
                    }
                    var span = createAccessibleMarkupPair(textContent, style, options, true);
                    if (span)
                        scriptNode.parentNode.replaceChild(span, scriptNode);
                }
            }
            else {
                if ((_k = options.texClassDisplayPattern) === null || _k === void 0 ? void 0 : _k.test(el.className)) {
                    var formula = el.textContent;
                    el.textContent = '';
                    var node = createAccessibleMarkupPair(formula !== null && formula !== void 0 ? formula : '', 'displaystyle', options, true);
                    if (node)
                        el.append(node);
                    continue;
                }
                if ((_l = options.texClassInlinePattern) === null || _l === void 0 ? void 0 : _l.test(el.className)) {
                    var formula = el.textContent;
                    el.textContent = '';
                    var node = createAccessibleMarkupPair(formula !== null && formula !== void 0 ? formula : '', 'textstyle', options, true);
                    if (node)
                        element.append(node);
                    continue;
                }
                var shouldProcess = ((_o = (_m = options.processClassPattern) === null || _m === void 0 ? void 0 : _m.test(el.className)) !== null && _o !== void 0 ? _o : false) ||
                    !(((_q = (_p = options.skipTags) === null || _p === void 0 ? void 0 : _p.includes(tag)) !== null && _q !== void 0 ? _q : false) ||
                        ((_s = (_r = options.ignoreClassPattern) === null || _r === void 0 ? void 0 : _r.test(el.className)) !== null && _s !== void 0 ? _s : false));
                if (shouldProcess)
                    scanElement(el, options);
            }
        }
        // Otherwise, it's something else, and ignore it.
    }
}
var DEFAULT_AUTO_RENDER_OPTIONS = {
    // Name of tags whose content will not be scanned for math delimiters
    skipTags: [
        'math-field',
        'noscript',
        'style',
        'textarea',
        'pre',
        'code',
        'annotation',
        'annotation-xml',
    ],
    // <script> tags of the following types will be processed. Others, ignored.
    processScriptType: 'math/tex',
    // <script> tag with this type will be processed as MathJSON
    processMathJSONScriptType: 'math/json',
    // Regex pattern of the class name of elements whose contents should not
    // be processed
    ignoreClass: 'tex2jax_ignore',
    // Regex pattern of the class name of elements whose contents should
    // be processed when they appear inside ones that are ignored.
    processClass: 'tex2jax_process',
    // Indicate the format to use to render accessible content
    renderAccessibleContent: 'mathml',
    asciiMath: {
        delimiters: {
            inline: [
                ['`', '`'], // ASCII Math delimiters
            ]
        }
    },
    TeX: {
        processEnvironments: true,
        delimiters: {
            inline: [['\\(', '\\)']],
            display: [
                ['$$', '$$'],
                ['\\[', '\\]'],
            ]
        }
    }
};
/** @internal */
function _renderMathInElement(element, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        var optionsPrivate = __assign(__assign({}, DEFAULT_AUTO_RENDER_OPTIONS), options);
        optionsPrivate.ignoreClassPattern = new RegExp((_a = optionsPrivate.ignoreClass) !== null && _a !== void 0 ? _a : '');
        optionsPrivate.processClassPattern = new RegExp((_b = optionsPrivate.processClass) !== null && _b !== void 0 ? _b : '');
        optionsPrivate.processScriptTypePattern = new RegExp((_c = optionsPrivate.processScriptType) !== null && _c !== void 0 ? _c : '');
        optionsPrivate.processMathJSONScriptTypePattern = new RegExp((_d = optionsPrivate.processMathJSONScriptType) !== null && _d !== void 0 ? _d : '');
        if ((_f = (_e = optionsPrivate.TeX) === null || _e === void 0 ? void 0 : _e.className) === null || _f === void 0 ? void 0 : _f.display) {
            optionsPrivate.texClassDisplayPattern = new RegExp(optionsPrivate.TeX.className.display);
        }
        if ((_h = (_g = optionsPrivate.TeX) === null || _g === void 0 ? void 0 : _g.className) === null || _h === void 0 ? void 0 : _h.inline) {
            optionsPrivate.texClassInlinePattern = new RegExp(optionsPrivate.TeX.className.inline);
        }
        // Load the fonts and inject the stylesheet once to
        // avoid having to do it many times in the case of a `renderMathInDocument()`
        // call.
        void (0, fonts_1.loadFonts)();
        (0, stylesheet_1.injectStylesheet)('core');
        scanElement(element, optionsPrivate);
    }
    catch (error) {
        if (error instanceof Error)
            console.error('renderMathInElement(): ' + error.message);
        else {
            console.error('renderMathInElement(): Could not render math for element', element);
        }
    }
}
exports._renderMathInElement = _renderMathInElement;
