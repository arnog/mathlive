/* eslint no-console:0 */
define(function() {

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

function scanText(text, options, latexToMarkup) {
    const fragment = document.createDocumentFragment();
    // If the text starts with '\begin'...
    // (this is a MathJAX behavior)
    if (options.TeX.processEnvironments && text.match(/^\s*\\begin/)) {
        const span = document.createElement('span');
        if (options.preserveOriginalContent) {
            span.setAttribute('data-' + options.namespace + 'original-content', text);
        }
        fragment.appendChild(span);
        try {
            span.innerHTML = latexToMarkup(text, 'displaystyle');
        } catch (e) {
            console.error(
                'Could not parse\'' + text + '\' with ', e
            );
            fragment.appendChild(document.createTextNode(text));
        }
    } else {
        const data = splitWithDelimiters(text, options.TeX.delimiters);

        for (let i = 0; i < data.length; i++) {
            if (data[i].type === 'text') {
                fragment.appendChild(document.createTextNode(data[i].data));
            } else {
                const span = document.createElement('span');
                if (options.preserveOriginalContent) {
                    span.setAttribute('data-' + options.namespace + 'original-content', data[i].data);
                }
                try {
                    span.innerHTML = latexToMarkup(data[i].data, data[i].mathstyle);
                } catch (e) {
                    console.error(
                        'Could not parse\'' + data[i].data + '\' with ', e
                    );
                    fragment.appendChild(document.createTextNode(data[i].rawData));
                    continue;
                }
                fragment.appendChild(span);
            }
        }
    }

    return fragment;
}

function scanElement(elem, options, latexToMarkup) {
    let handled = false;
    if (elem.childNodes.length === 1 && elem.childNodes[0].nodeType === 3) {
        // This is a node with textual content only. Perhaps an opportunity
        // to simplify and avoid creating extra nested elements...
        const text = elem.childNodes[0].textContent;
        let innerContent;
        if (options.TeX.processEnvironments && text.match(/^\s*\\begin/)) {
            innerContent = latexToMarkup(text, 'displaystyle');
        } 
        if (!innerContent) {
            const data = splitWithDelimiters(text, options.TeX.delimiters);
            if (data.length === 1 && data[0].type === 'math') {
                // The entire content is a math expression: we can replace the content
                // with the latex markup without creating additional wrappers.
                innerContent = latexToMarkup(data[0].data, data[0].mathstyle);
            }
        }
        if (innerContent) {
            elem.innerHTML = innerContent;
            if (options.preserveOriginalContent) {
                elem.setAttribute('data-' + options.namespace + 'original-content', text);
            }
            handled = true;
        }
    }
    if (!handled) {
        for (let i = 0; i < elem.childNodes.length; i++) {
            const childNode = elem.childNodes[i];
            if (childNode.nodeType === 3) {
                // Text node
                const frag = scanText(childNode.textContent, options, latexToMarkup);
                i += frag.childNodes.length - 1;
                elem.replaceChild(frag, childNode);
            } else if (childNode.nodeType === 1) {
                // Element node
                const shouldRender = 
                    options.processClassPattern.test(childNode.className) ||
                    !(options.skipTags.includes(childNode.nodeName.toLowerCase()) || 
                        options.ignoreClassPattern.test(childNode.className));

                if (shouldRender) {
                    scanElement(childNode, options, latexToMarkup);
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
    skipTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 
        'annotation', 'annotation-xml'],
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
    options = Object.assign({}, defaultOptions, options);
    options.ignoreClassPattern = new RegExp(options.ignoreClass);
    options.processClassPattern = new RegExp(options.processClass);

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
}

    return {
        renderMathInElement: renderMathInElement,
    }
})