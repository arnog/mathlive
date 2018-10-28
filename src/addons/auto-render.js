/* eslint no-console:0 */
import MathAtom from '../core/mathAtom'; // eslint-disable-line no-unused-vars
import Definitions from '../core/definitions';

function findEndOfMath(delimiter, text, startIndex) {
    // Adapted from
    // https://github.com/Khan/perseus/blob/master/src/perseus-markdown.jsx
    let index = startIndex;
    let braceLevel = 0;

    const delimLength = delimiter.length;

    while (index < text.length) {
        const character = text[index];

        if (braceLevel <= 0 &&
            text.slice(index, index + delimLength) === delimiter) {
            return index;
        } else if (character === '\\') {
            index++;
        } else if (character === '{') {
            braceLevel++;
        } else if (character === '}') {
            braceLevel--;
        }

        index++;
    }

    return -1;
}

function splitAtDelimiters(startData, leftDelim, rightDelim, mathstyle) {
    const finalData = [];

    for (let i = 0; i < startData.length; i++) {
        if (startData[i].type === 'text') {
            const text = startData[i].data;

            let lookingForLeft = true;
            let currIndex = 0;
            let nextIndex;

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
            let done = false;
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
                } else {
                    nextIndex = findEndOfMath(
                        rightDelim,
                        text,
                        currIndex + leftDelim.length);
                    if (nextIndex === -1) {
                        done = true;
                        break;
                    }

                    finalData.push({
                        type: 'math',
                        data: text.slice(
                            currIndex + leftDelim.length,
                            nextIndex),
                        rawData: text.slice(
                            currIndex,
                            nextIndex + rightDelim.length),
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
        } else {
            finalData.push(startData[i]);
        }
    }

    return finalData;
}

function splitWithDelimiters(text, delimiters) {
    let data = [{type: 'text', data: text}];
    for (let i = 0; i < delimiters.inline.length; i++) {
        const delimiter = delimiters.inline[i];
        data = splitAtDelimiters(
            data, delimiter[0], delimiter[1], 'textstyle');
    }
    for (let i = 0; i < delimiters.display.length; i++) {
        const delimiter = delimiters.display[i];
        data = splitAtDelimiters(
            data, delimiter[0], delimiter[1], 'displaystyle');
    }

    return data;
}


function createAccessibleNode(latex, latexToMathML, options) {
    // Create a node for AT (Assistive Technology, e.g. screen reader) to speak, etc.
    // This node has a style that makes it be invisible to display but is seen by AT
    const span = document.createElement('span');
    try {
        span.innerHTML = "<math xmlns='http://www.w3.org/1998/Math/MathML'>" +
                            latexToMathML(latex, options) +
                         "</math>";
    } catch (e) {
        console.error( 'Could not convert\'' + latex + '\' to accessible format with ', e );
        span.innerText = latex;
    }
    span.setAttribute('class', 'ML__HiddenAccessibleMath');
    return span;
}

function createMarkupNode(text, options, mathstyle, latexToMarkup, createNodeOnFailure) {
    // Create a node for displaying math.
    //   This is slightly ugly because in the case of failure to create the markup,
    //   sometimes a text node is desired and sometimes not.
    //   'createTextNodeOnFailure' controls this and null is returned when no node is created.
    // This node is made invisible to AT (screen readers)
    let span = document.createElement('span');
    span.setAttribute('aria-hidden','true');
    if (options.preserveOriginalContent) {
        span.setAttribute('data-' + options.namespace + 'original-content', text);
        if (mathstyle) {
            span.setAttribute('data-' + options.namespace + 'original-mathstyle', mathstyle);
        }
    }

    try {
        span.innerHTML = latexToMarkup(text, mathstyle || 'displaystyle', options.macros);
     } catch (e) {
        console.error( 'Could not parse\'' + text + '\' with ', e );
        if (createNodeOnFailure) {
            span = document.createTextNode(text);
        } else {
            return null;
        }
    }
    return span;
}

function createAccessibleMarkupPair(text, mathstyle, options, latexToMarkup, latexToMathML, createNodeOnFailure) {
    // Create a math node (a span with an accessible component and a visual component)
    // If there is an error in parsing the latex, 'createNodeOnFailure' controls whether
    //   'null' is returned or an accessible node with the text used.
    const markupNode = createMarkupNode(text, options, mathstyle, latexToMarkup, createNodeOnFailure);
    if (markupNode === null) {
        return null;
    }

    const fragment = document.createDocumentFragment();
    fragment.appendChild(createAccessibleNode(text, latexToMathML, options));
    fragment.appendChild(markupNode);
    return fragment;
}

function scanText(text, options, latexToMarkup, latexToMathML) {
    // If the text starts with '\begin'...
    // (this is a MathJAX behavior)
    let fragment = null;
    if (options.TeX.processEnvironments && /^\s*\\begin/.test(text)) {
        fragment = document.createDocumentFragment();
        fragment.appendChild(createAccessibleMarkupPair(text, undefined, options, latexToMarkup, latexToMathML, true));
    } else {
        const data = splitWithDelimiters(text, options.TeX.delimiters);
        if (data.length === 1 && data[0].type === 'text') {
            // This text contains no math. No need to continue processing
            return null;
        }
        fragment = document.createDocumentFragment();

        for (let i = 0; i < data.length; i++) {
            if (data[i].type === 'text') {
                fragment.appendChild(document.createTextNode(data[i].data));
            } else {
                fragment.appendChild(createAccessibleMarkupPair(data[i].data, data[i].mathstyle, options, latexToMarkup, latexToMathML, true));
            }
        }
    }
    return fragment;
}

function scanElement(elem, options, latexToMarkup, latexToMathML) {
    const originalContent = elem.getAttribute('data-' + options.namespace +
        'original-content');
    if (originalContent) {
        const mathstyle = elem.getAttribute('data-' + options.namespace + 'mathstyle');
        const span = createAccessibleMarkupPair(originalContent, mathstyle, options, latexToMarkup, latexToMathML, false);
        if (span != null) {
            elem.textContent = '';
            elem.appendChild(span);
        }
        return;
    }


    if (elem.childNodes.length === 1 && elem.childNodes[0].nodeType === 3) {
        // This is a node with textual content only. Perhaps an opportunity
        // to simplify and avoid creating extra nested elements...
        const text = elem.childNodes[0].textContent;
        if (options.TeX.processEnvironments && /^\s*\\begin/.test(text)) {
            elem.textContent = '';
            elem.appendChild( createAccessibleMarkupPair(originalContent, undefined, options, latexToMarkup, true) );
            return;
        }

        const data = splitWithDelimiters(text, options.TeX.delimiters);
        if (data.length === 1 && data[0].type === 'math') {
            // The entire content is a math expression: we can replace the content
            // with the latex markup without creating additional wrappers.
            elem.textContent = '';
            elem.appendChild( createAccessibleMarkupPair(data[0].data, data[0].mathstyle, options, latexToMarkup, latexToMathML, true) );
            return;
        } else if (data.length === 1 && data[0].type === 'text') {
            // This element only contained text with no math. No need to
            // do anything.
            return;
        }
    }

    for (let i = 0; i < elem.childNodes.length; i++) {
        const childNode = elem.childNodes[i];
        if (childNode.nodeType === 3) {
            // A text node
            // Look for math mode delimiters inside the text
            const frag = scanText(childNode.textContent, options, latexToMarkup, latexToMathML);
            if (frag) {
                i += frag.childNodes.length - 1;
                elem.replaceChild(frag, childNode);
            }
        } else if (childNode.nodeType === 1) {
            // An element node
            const tag = childNode.nodeName.toLowerCase();
            if (tag === 'script' &&
                options.processScriptTypePattern.test(childNode.type)) {
                let style = 'displaystyle';
                for (const l of  childNode.type.split(';')) {
                    const v = l.split('=');
                    if (v[0].toLowerCase() === 'mode') {
                        if (v[1].toLoweCase() === 'display') {
                            style = 'displaystyle';
                        } else {
                            style = 'textstyle';
                        }

                    }
                }

                const span = createAccessibleMarkupPair(childNode.textContent,
                    style, options, latexToMarkup, latexToMathML, true)
                childNode.parentNode.replaceChild(span, childNode);
            } else {
                // Element node
                const shouldRender =
                    options.processClassPattern.test(childNode.className) ||
                    !(options.skipTags.includes(tag) ||
                        options.ignoreClassPattern.test(childNode.className));

                if (shouldRender) {
                    scanElement(childNode, options, latexToMarkup, latexToMathML);
                }
            }
        }
        // Otherwise, it's something else, and ignore it.
    }
}

const defaultOptions = {
    // Optional namespace for the `data-` attributes.
    namespace: '',

    // Name of tags whose content will not be scanned for math delimiters
    skipTags: ['noscript', 'style', 'textarea', 'pre', 'code',
        'annotation', 'annotation-xml'],

    // <script> tags of the following types will be processed. Others, ignored.
    processScriptType: "math/tex",

    // Regex pattern of the class name of elements whose contents should not
    // be processed
    ignoreClass: "tex2jax_ignore",

    // Regex pattern of the class name of elements whose contents should
    // be processed when they appear inside ones that are ignored.
    processClass: "tex2jax_process",

    // Indicate whether to preserve or discard the original content of the
    // elements being rendered in a 'data-original-content' attribute.
    preserveOriginalContent: true,

    TeX: {
        disabled: false,
        processEnvironments : true,
        delimiters: {
            inline:  [['\\(','\\)']],
            display: [['$$', '$$'], ['\\[', '\\]']],
        }
    }
}

function renderMathInElement(elem, options, latexToMarkup, latexToMathML) {
    try {
        options = Object.assign({}, defaultOptions);
        options.ignoreClassPattern = new RegExp(options.ignoreClass);
        options.processClassPattern = new RegExp(options.processClass);
        options.processScriptTypePattern = new RegExp(options.processScriptType);
        options.macros = Definitions.MACROS;

        // Validate the namespace (used for `data-` attributes)
        if (options.namespace) {
            if (!/^[a-z]+[-]?$/.test(options.namespace)) {
                throw Error('options.namespace must be a string of lowercase characters only');
            }
            if (!/-$/.test(options.namespace)) {
            options.namespace += '-';
            }
        }

        scanElement(elem, options, latexToMarkup, latexToMathML);
    } catch(e) {
        if (e instanceof Error) {
            console.error('renderMathInElement(): ' + e.message);
        } else {
            console.error('renderMathInElement(): Could not render math for element ' + elem);
        }
    }
}

    export default {
        renderMathInElement: renderMathInElement,
    }

