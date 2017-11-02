/* eslint no-console:0 */
define(['mathlive/core/mathAtom'], function(MathAtom) {

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


function createAccessibleNode(latex, mathstyle) {
    // Create a node for AT to speak, etc.
    // This node has a style that makes it be invisible to display but is seen by AT
    // FIX: Currently this is text, but once MathML support is added, it should be MathML

    /* this style should be in the CSS
    .MathMLNoDisplay {
        clip: rect(1px, 1px, 1px, 1px);
        position: absolute !important;
        white-space: nowrap;
        height: 1px;
        width: 1px;
        overflow: hidden;
    }
    */
    let elem = document.createElement('span');
    elem.innerText = MathAtom.toSpeakableText(MathLive.latexToMarkup(latex, mathstyle, 'mathlist'));
    elem.setAttribute('class', 'MathMLNoDisplay');
    elem.setAttribute('style', 'clip: rect(1px, 1px, 1px, 1px); position: absolute !important;white-space: nowrap; height: 1px; width: 1px; overflow: hidden;');
    console.log(elem.outerHTML);
    return elem;
}
function scanText(text, options, latexToMarkup) {
    // If the text starts with '\begin'...
    // (this is a MathJAX behavior)
    let fragment = null;
    if (options.TeX.processEnvironments && text.match(/^\s*\\begin/)) {
        fragment = document.createDocumentFragment();
        const span = document.createElement('span');
        span.setAttribute('aria-hidden','true');
        if (options.preserveOriginalContent) {
            span.setAttribute('data-' + options.namespace + 'original-content', text);
        }
        try {
            span.innerHTML = latexToMarkup(text, 'displaystyle');
            fragment.appendChild(span);
            fragment.appendChild(createAccessibleNode(text, 'displaystyle'))
       } catch (e) {
            console.error(
                'Could not parse\'' + text + '\' with ', e
            );
            fragment.appendChild(document.createTextNode(text));
        }
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
                const span = document.createElement('span');
                span.setAttribute('aria-hidden','true');
                if (options.preserveOriginalContent) {
                    span.setAttribute('data-' + options.namespace + 'original-content', data[i].data);
                }
                try {
                    span.innerHTML = latexToMarkup(data[i].data, data[i].mathstyle);
                    fragment.appendChild(span);
                    fragment.appendChild(createAccessibleNode(data[i].data, data[i].mathstyle));
                } catch (e) {
                    console.error(
                        'Could not parse\'' + data[i].data + '\' with ', e
                    );
                    fragment.appendChild(document.createTextNode(data[i].rawData));
                    continue;
                }
            }
        }
    }
    return fragment;
}

function scanElement(elem, options, latexToMarkup) {
    let handled = false;
    const originalContent = elem.getAttribute('data-' + options.namespace + 
        'original-content');
    if (originalContent) {
        const mathstyle = elem.getAttribute('data-' + options.namespace + 
            'mathstyle') || 'displaystyle';
        try {
            const span = document.createElement('span');
            span.appendChild(latexToMarkup(originalContent, mathstyle));
            span.appendChild(createAccessibleNode(originalContent, mathstyle));
            elem.textContent = '';
            elem.appendChild(span);
        } catch (e) {
            console.error(
                'Could not parse\'' + originalContent + '\' with ', e
            );
        }
        handled = true;
    } else if (elem.childNodes.length === 1 && elem.childNodes[0].nodeType === 3) {
        // This is a node with textual content only. Perhaps an opportunity
        // to simplify and avoid creating extra nested elements...
        const text = elem.childNodes[0].textContent;
        let innerContent;
        let mathstyle;
        if (options.TeX.processEnvironments && text.match(/^\s*\\begin/)) {
            try {
                innerContent = latexToMarkup(text, 'displaystyle');
            } catch (e) {
                console.error(
                    'Could not parse\'' + text + '\' with ', e
                );
                innerContent = text;
            }
        } 
        if (!innerContent) {
            const data = splitWithDelimiters(text, options.TeX.delimiters);
            if (data.length === 1 && data[0].type === 'math') {
                // The entire content is a math expression: we can replace the content
                // with the latex markup without creating additional wrappers.
                try {
                    mathstyle = data[0].mathstyle;
                    innerContent = latexToMarkup(data[0].data, mathstyle);
                } catch (e) {
                    console.error(
                        'Could not parse\'' + data[0].data + '\' with ', e
                    );
                    innerContent = data[0].data;
                }
            } else if (data.length === 1 && data[0].type === 'text') {
                // This element only contained text with no math. No need to 
                // do anything.
                handled = true;
            }
        }
        if (innerContent) {
            let span = document.createElement('span');            
            span.innerHTML = innerContent;
            span.firstChild.setAttribute('aria-hidden','true');
           if (options.preserveOriginalContent) {
                span.setAttribute('data-' + options.namespace + 'original-content', text);
                if (mathstyle) {
                    span.setAttribute('data-' + options.namespace + 'original-mathstyle', mathstyle);
                }
            }
            span.appendChild(createAccessibleNode(text, mathstyle));
            elem.textContent = '';
            elem.appendChild(span);
            handled = true;
        }
    }
    if (!handled) {
        for (let i = 0; i < elem.childNodes.length; i++) {
            const childNode = elem.childNodes[i];
            if (childNode.nodeType === 3) {
                // A text node
                // Look for math mode delimiters inside the text
                const frag = scanText(childNode.textContent, options, latexToMarkup);
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

                    // for convenience, create a wrapper around the displayed and accessible math
                    const outterSpan = document.createElement('span');

                    const span = document.createElement('span');
                    span.setAttribute('aria-hidden','true');

                    try {
                        span.innerHTML = latexToMarkup(childNode.textContent, style);
                    } catch(e) {
                        console.error(
                            'Could not parse\'' + childNode.textContent + '\' with ', e
                        );
                        span.innerHTML = childNode.textContent;
                    }
                    if (options.preserveOriginalContent) {
                        span.setAttribute('data-' + options.namespace + 
                            'original-content', childNode.textContent);
                        span.setAttribute('data-' + options.namespace + 
                            'mathstyle', style);
                        
                    }
                        
                    childNode.appendChild(createAccessibleNode(childNode.textContent, style));

                    childNode.appendChild(span);
                    childNode.parentNode.replaceChild(outterSpan, childNode);
                } else {
                    // Element node
                    const shouldRender = 
                        options.processClassPattern.test(childNode.className) ||
                        !(options.skipTags.includes(tag) || 
                            options.ignoreClassPattern.test(childNode.className));

                    if (shouldRender) {
                        scanElement(childNode, options, latexToMarkup);
                    }
                }
            }
            // Otherwise, it's something else, and ignore it.
        }
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

function renderMathInElement(elem, options, latexToMarkup) {
    try {
        options = Object.assign({}, defaultOptions, options);
        options.ignoreClassPattern = new RegExp(options.ignoreClass);
        options.processClassPattern = new RegExp(options.processClass);
        options.processScriptTypePattern = new RegExp(options.processScriptType);

        // Validate the namespace (used for `data-` attributes)
        if (options.namespace) {
            if (!/^[a-z]+[-]?$/.test(options.namespace)) {
                throw Error('options.namespace must be a string of lowercase characters only');
            }
            if (!/-$/.test(options.namespace)) {
            options.namespace += '-';
            }
        }

        scanElement(elem, options, latexToMarkup);
    } catch(e) {
        if (e instanceof Error) {
            console.error('renderMathInElement(): ' + e.message);
        } else {
            console.error('renderMathInElement(): Could not render math for element ' + elem);
        }
    }
}

    return {
        renderMathInElement: renderMathInElement,
    }
})