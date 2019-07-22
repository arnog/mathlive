
/**
 *
 * This modules exports the MathLive entry points.
 *
 * @module mathlive
 * @example
 * // To invoke the functions in this module, import the MathLive module. 
 * 
 * import MathLive from 'dist/mathlive.mjs';
 * 
 * const markup = MathLive.latexToMarkup('e^{i\\pi}+1=0');
 * 
 */

import Lexer from './core/lexer.js';
import MathAtom from './core/mathAtom.js';
import ParserModule from './core/parser.js';
import Span from './core/span.js';
import Definitions from './core/definitions.js';
import MathField from './editor/editor-mathfield.js';
import AutoRender from './addons/auto-render.js';

/**
 * Convert a LaTeX string to a string of HTML markup.
 *
 * @param {string} text A string of valid LaTeX. It does not have to start
 * with a mode token such as `$$` or `\(`.
 *
 * @param {string} mathstyle If `'displaystyle'` the "display" mode of TeX
 * is used to typeset the formula, which is most appropriate for formulas that are
 * displayed in a standalone block. If `'textstyle'` is used, the "text" mode
 * of TeX is used, which is most appropriate when displaying math "inline"
 * with other text (on the same line).
 *
 * @param {string} [format='html'] For debugging purposes, this function
 * can also return a text representation of internal data structures
 * used to construct the markup. Valid values include `'mathlist'` and `'span'`
 *
 * @return {string}
 * @function module:mathlive#latexToMarkup
 */
function toMarkup(text, mathstyle, format, macros) {
    mathstyle = mathstyle || 'displaystyle';

    console.assert(/displaystyle|textstyle|scriptstyle|scriptscriptstyle/.test(mathstyle),
        "Invalid style:", mathstyle);

    //
    // 1. Tokenize the text
    //
    const tokens = Lexer.tokenize(text);

    //
    // 2. Parse each token in the formula
    //    Turn the list of tokens in the formula into
    //    a tree of high-level MathAtom, e.g. 'genfrac'.
    //

    const mathlist = ParserModule.parseTokens(tokens, 'math', null, macros);

    if (format === 'mathlist') return mathlist;



    //
    // 3. Transform the math atoms into elementary spans
    //    for example from genfrac to vlist.
    //
    let spans = MathAtom.decompose({mathstyle: mathstyle}, mathlist);


    //
    // 4. Simplify by coalescing adjacent nodes
    //    for example, from <span>1</span><span>2</span>
    //    to <span>12</span>
    //
    spans = Span.coalesce(spans);

    if (format === 'span') return spans;

    //
    // 5. Wrap the expression with struts
    //
    const base = Span.makeSpan(spans, 'ML__base');

    const topStrut = Span.makeSpan('', 'ML__strut')
    topStrut.setStyle('height', base.height, 'em');
    const struts = [topStrut];
    if (base.depth !== 0) {
        const bottomStrut = Span.makeSpan('', 'ML__strut--bottom');
        bottomStrut.setStyle('height', base.height + base.depth, 'em');
        bottomStrut.setStyle('vertical-align', -base.depth, 'em');
        struts.push(bottomStrut);
    }
    struts.push(base);
    const wrapper = Span.makeSpan(struts, 'ML__mathlive');


    //
    // 6. Generate markup
    //

    return wrapper.toMarkup();
}



/**
 * Convert a DOM element into an editable math field.
 * 
 * After the DOM element has been created, the value `element.mathfield` will 
 * return a reference to the mathfield object. This value is also returned 
 * by `makeMathField`
 * 
 * @param {HTMLElement|string} element A DOM element, for example as obtained 
 * by `document.getElementById()`, or the ID of a DOM element as a string.
 * 
 * @param {MathFieldConfig} [config={}] See {@tutorial CONFIG} for details.
 *
 *
 * @return {MathField}
 * 
 * Given the HTML markup:
 * ```html
 * <span id='equation'>$f(x)=sin(x)$</span>
 * ```
 * The following code will turn the span into an editable mathfield.
 * ```
 * import MathLive from 'dist/mathlive.mjs';
 * MathLive.makeMathField('equation');
 * ```
 * 
 * @function module:mathlive#makeMathField
 */
function makeMathField(element, config) {
    if (!MathField) {
        throw Error('The MathField module is not loaded.');
    }
    config = config || {};
    config.handleSpeak = config.handleSpeak || speak;
    config.handleReadAloud = config.handleReadAloud || readAloud;
    return new MathField.MathField(getElement(element), config);
}

/**
 * Convert a LaTeX string to a string of MathML markup.
 *
 * @param {string} latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 * @param {object} options
 * @param {boolean} [options.generateID=false] - If true, add an `extid` attribute
 * to the MathML nodes with a value matching the `atomID`.
 * @return {string}
 * @function module:mathlive#latexToMathML
 */
function toMathML(latex, options) {
    if (!MathAtom.toMathML) {
        console.warn('The MathML module is not loaded.');
        return '';
    }
    options = options || {};
    options.macros = options.macros || {};
    Object.assign(options.macros, Definitions.MACROS);

    const mathlist = ParserModule.parseTokens(Lexer.tokenize(latex),
        'math', null, options.macros);

    return MathAtom.toMathML(mathlist, options);
}

/**
 * Convert a LaTeX string to an Abstract Syntax Tree
 *
 * **See:** {@tutorial MASTON}
 *
 * @param {string} latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 *
 * @return {object} The Abstract Syntax Tree as a JavaScript object.
 * @function module:mathlive#latexToAST
 */
function latexToAST(latex, options) {
    if (!MathAtom.toAST) {
        console.warn('The AST module is not loaded.');
        return {};
    }
    options = options || {};
    options.macros = options.macros || {};
    Object.assign(options.macros, Definitions.MACROS);

    const mathlist = ParserModule.parseTokens(Lexer.tokenize(latex),
        'math', null, options.macros);

    return MathAtom.toAST(mathlist, options);
}



/**
 * Convert a LaTeX string to a textual representation ready to be spoken
 *
 * @param {string} latex A string of valid LaTeX. It does not have to start
 * with a mode token such as a `$$` or `\(`.
 * 
 * @param {Object.<string, any>} options -
 * 
 * @param {string} [options.textToSpeechRules='mathlive'] Specify which
 * set of text to speech rules to use. 
 * 
 * A value of `mathlive` indicates that
 * the simple rules built into MathLive should be used. A value of `sre`
 * indicates that the Speech Rule Engine from Volker Sorge should be used.
 * Note that SRE is not included or loaded by MathLive and for this option to
 * work SRE should be loaded separately.
 * 
 * @param {string} [options.textToSpeechMarkup=''] The markup syntax to use 
 * for the output of conversion to spoken text. 
 * 
 * Possible values are `ssml` for 
 * the SSML markup or `mac` for the MacOS markup (e.g. `[[ltr]]`)
 *
 * @param {Object.<string, any>} [options.textToSpeechRulesOptions={}] A set of 
 * key/value pairs that can be used to configure the speech rule engine. 
 * 
 * Which options are available depends on the speech rule engine in use. There 
 * are no options available with MathLive's built-in engine. The options for 
 * the SRE engine are documented [here]{@link:https://github.com/zorkow/speech-rule-engine}
 * @return {string} The spoken representation of the input LaTeX.
 * @example
 * console.log(MathLive.latexToSpeakableText('\\frac{1}{2}'));
 * // ➡︎'half'
 * @function module:mathlive#latexToSpeakableText
 */
function latexToSpeakableText(latex, options) {
    if (!MathAtom.toSpeakableText) {
        console.warn('The outputSpokenText module is not loaded.');
        return "";
    }
    options = options || {};
    options.macros = options.macros || {};
    Object.assign(options.macros, Definitions.MACROS);

    const mathlist = ParserModule.parseTokens(Lexer.tokenize(latex),
        'math', null, options.macros);

    return MathAtom.toSpeakableText(mathlist, options);
}


function removeHighlight(node) {
    node.classList.remove('highlight');
    if (node.children) {
        Array.from(node.children).forEach(x => {
            removeHighlight(x);
        });
    }
}

/**
 * Highlight the span corresponding to the specified atomID
 * This is used for TTS with synchronized highlighting (read aloud)
 *
 * @param {string} atomID
 *
 */
function highlightAtomID(node, atomID) {
    if (!atomID || node.dataset.atomId === atomID) {
        node.classList.add('highlight');
        if (node.children && node.children.length > 0) {
            Array.from(node.children).forEach(x => {
                highlightAtomID(x);
            });
        }
    } else {
        node.classList.remove('highlight');
        if (node.children && node.children.length > 0) {
            Array.from(node.children).forEach(x => {
                highlightAtomID(x, atomID);
            });
        }
    }
}

function speak(text, config) {
    if (!config && window && window.mathlive) {
        config = window.mathlive.config;
    }
    config = config || {};

    if (!config.speechEngine || config.speechEngine === 'local') {
        // On ChromeOS: chrome.accessibilityFeatures.spokenFeedback
        // See also https://developer.chrome.com/apps/tts
        const utterance = new SpeechSynthesisUtterance(text);
        if (window) {
            window.speechSynthesis.speak(utterance);
        } else {
            console.log('Speak: ', text);
        }
    } else if (config.speechEngine === 'amazon') {
        if (!window || !window.AWS) {
            console.warn('AWS SDK not loaded. See https://www.npmjs.com/package/aws-sdk');
        } else {
            const polly = new window.AWS.Polly({apiVersion: '2016-06-10'});
            const params = {
                OutputFormat: 'mp3',
                VoiceId: config.speechEngineVoice || 'Joanna',
                // SampleRate: '16000',
                Text: text,
                TextType: 'ssml',
                // SpeechMarkTypes: ['ssml]'
            };
            polly.synthesizeSpeech(params, function(err, data) {
                if (err) {
                    console.warn('polly.synthesizeSpeech() error:', err, err.stack);
                } else {
                    if (data && data.AudioStream) {
                        const uInt8Array = new Uint8Array(data.AudioStream);
                        const blob = new Blob([uInt8Array.buffer], {type: 'audio/mpeg'});
                        const url = URL.createObjectURL(blob);

                        const audioElement = new Audio(url);
                        audioElement.play().catch(err => console.log(err));
                    } else {
                        console.log('polly.synthesizeSpeech():' + data);
                    }
                }
            });

            // Can call AWS.Request() on the result of synthesizeSpeech()
        }
    } else if (config.speechEngine === 'google') {
        console.warn('The Google speech engine is not supported yet. Please come again.');
        // @todo: implement support for Google Text-to-Speech API,
        // using config.speechEngineToken, config.speechEngineVoice and
        // config.speechEngineAudioConfig

// curl -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) \
//   -H "Content-Type: application/json; charset=utf-8" \
//   --data "{
//     'input':{
//       'text':'Android is a mobile operating system developed by Google,
//          based on the Linux kernel and designed primarily for
//          touchscreen mobile devices such as smartphones and tablets.'
//     },
//     'voice':{
//       'languageCode':'en-gb',
//       'name':'en-GB-Standard-A',
//       'ssmlGender':'FEMALE'
//     },
//     'audioConfig':{
//       'audioEncoding':'MP3'
//     }
//   }" "https://texttospeech.googleapis.com/v1beta1/text:synthesize" > synthesize-text.txt
    }
}

/**
 * "Read Aloud" is an asynchronous operation that reads the 
 * reading with synchronized highlighting
 * 
 * @param {DOMElement} element - The DOM element to highlight
 * @param {string} text - The text to speak
 * @param {object} config
 * @private
 * @function module:mathlive#readAloud
 */
function readAloud(element, text, config) {
    if (!window) {
        return;
    }
    if (!config && window.mathlive) {
        config = window.mathlive.config;
    }
    config = config || {};

    if (config.speechEngine !== 'amazon') {
        console.warn('Use Amazon TTS Engine for synchronized highlighting');
        if (config.handleSpeak) config.handleSpeak(text);
        return;
    }
    if (!window.AWS) {
        console.warn('AWS SDK not loaded. See https://www.npmjs.com/package/aws-sdk');
        return;
    }
    const polly = new window.AWS.Polly({apiVersion: '2016-06-10'});

    const params = {
        OutputFormat: 'json',
        VoiceId: config.speechEngineVoice || 'Joanna',
        Text: text,
        TextType: 'ssml',
        SpeechMarkTypes: ['ssml']
    };

    window.mathlive = window.mathlive || {};
    window.mathlive.readAloudElement = element;

    const status = config.onReadAloudStatus || window.mathlive.onReadAloudStatus;

    // Request the mark points
    polly.synthesizeSpeech(params, function(err, data) {
        if (err) {
            console.warn('polly.synthesizeSpeech() error:', err, err.stack);
        } else {
            if (data && data.AudioStream) {
                const response = new TextDecoder('utf-8').decode(new Uint8Array(data.AudioStream));
                window.mathlive.readAloudMarks = response.split('\n').map(x => x ? JSON.parse(x) : {});
                window.mathlive.readAloudTokens = [];
                for (const mark of window.mathlive.readAloudMarks) {
                    if (mark.value) {
                        window.mathlive.readAloudTokens.push(mark.value);
                    }
                }
                window.mathlive.readAloudCurrentMark = '';

                // Request the audio
                params.OutputFormat = 'mp3';
                params.SpeechMarkTypes = [];
                polly.synthesizeSpeech(params, function(err, data) {
                    if (err) {
                        console.warn('polly.synthesizeSpeech(', text , ') error:', err, err.stack);
                    } else {
                        if (data && data.AudioStream) {
                            const uInt8Array = new Uint8Array(data.AudioStream);
                            const blob = new Blob([uInt8Array.buffer], {type: 'audio/mpeg'});
                            const url = URL.createObjectURL(blob);

                            if (!window.mathlive.readAloudAudio) {
                                window.mathlive.readAloudAudio = new Audio();
                                window.mathlive.readAloudAudio.addEventListener('ended', () => {
                                    if (status) status(window.mathlive.readAloudMathField, 'ended');
                                    if (window.mathlive.readAloudMathField) {
                                        window.mathlive.readAloudMathField._render();
                                        window.mathlive.readAloudElement = null;
                                        window.mathlive.readAloudMathField = null;
                                        window.mathlive.readAloudTokens = [];
                                        window.mathlive.readAloudMarks = [];
                                        window.mathlive.readAloudCurrentMark = '';
                                    } else {
                                        removeHighlight(window.mathlive.readAloudElement);
                                    }
                                });
                                window.mathlive.readAloudAudio.addEventListener('timeupdate', () => {
                                    let value = '';
                                    // The target, the atom we're looking for, is the one matching the current audio
                                    // plus 100 ms. By anticipating it a little bit, it feels more natural, otherwise it
                                    // feels like the highlighting is trailing the audio.
                                    const target = window.mathlive.readAloudAudio.currentTime * 1000 + 100;

                                    // Find the smallest element which is bigger than the target time
                                    for (const mark of window.mathlive.readAloudMarks) {
                                        if (mark.time < target) {
                                            value = mark.value;
                                        }
                                    }
                                    if (window.mathlive.readAloudCurrentMark !== value) {
                                        window.mathlive.readAloudCurrentToken = value;
                                        if (value && value === window.mathlive.readAloudFinalToken) {
                                            window.mathlive.readAloudAudio.pause();
                                        } else {
                                            window.mathlive.readAloudCurrentMark = value;
                                            highlightAtomID(window.mathlive.readAloudElement, window.mathlive.readAloudCurrentMark);
                                        }
                                    }
                                });
                            } else {
                                window.mathlive.readAloudAudio.pause();
                            }

                            window.mathlive.readAloudAudio.src = url;
                            if (status) {
                                status(window.mathlive.readAloudMathField, 'playing');
                            }
                            window.mathlive.readAloudAudio.play();
                        } else {
                            // console.log('polly.synthesizeSpeech():' + data);
                        }
                    }
                });
            } else {
                console.log('polly.synthesizeSpeech():' + data);
            }
        }
    });
}

/**
 * Return the status of a Read Aloud operation (reading with synchronized
 * highlighting). 
 * 
 * Possible values include:
 * - `ready`
 * - `playing`
 * - `paused`
 * - `unavailable`
 * 
 * **See** {@linkcode module:editor-mathfield#speak speak}
 * @return {string}
 * @function module:mathlive#readAloudStatus
 */
function readAloudStatus() {
    if (!window) return 'unavailable';
    window.mathlive = window.mathlive || {};

    if (!window.mathlive.readAloudAudio) return 'ready';
    if (window.mathlive.readAloudAudio.paused) return 'paused';
    if (!window.mathlive.readAloudAudio.ended) return 'playing';

    return 'ready';
}

/**
 * If a Read Aloud operation is in progress, stop it.
 * 
 * **See** {@linkcode module:editor/mathfield#speak speak}
 * @function module:mathlive#pauseReadAloud
 */
function pauseReadAloud() {
    if (!window) return;
    window.mathlive = window.mathlive || {};
    if (window.mathlive.readAloudAudio) {
        if (window.mathlive.onReadAloudStatus) {
            window.mathlive.onReadAloudStatus(window.mathlive.readAloudMathField, 'paused');
        }
        window.mathlive.readAloudAudio.pause();
    }
}

/**
 * If a Read Aloud operation is paused, resume it
 * 
 * **See** {@linkcode module:editor-mathfield#speak speak}
 * @function module:mathlive#resumeReadAloud
 */
function resumeReadAloud() {
    if (!window) return;
    window.mathlive = window.mathlive || {};
    if (window.mathlive.readAloudAudio) {
        if (window.mathlive.onReadAloudStatus) {
            window.mathlive.onReadAloudStatus(window.mathlive.readAloudMathField, 'playing');
        }
        window.mathlive.readAloudAudio.play();
    }
}

/**
 * If a Read Aloud operation is in progress, read from a specified token
 * 
 * **See** {@linkcode module:editor-mathfield#speak speak}
 *
 * @param {string} token
 * @param {number} [count]
 * @function module:mathlive#playReadAloud
 */
function playReadAloud(token, count) {
    if (!window) return;
    window.mathlive = window.mathlive || {};
    if (window.mathlive.readAloudAudio) {
        let timeIndex = 0;
        window.mathlive.readAloudFinalToken = null;
        if (token) {
            window.mathlive.readAloudMarks = window.mathlive.readAloudMarks || [];
            for (const mark of window.mathlive.readAloudMarks) {
                if (mark.value === token) {
                    timeIndex = mark.time / 1000;
                }
            }
            let tokenIndex = window.mathlive.readAloudTokens.indexOf(token);
            if (tokenIndex >= 0) {
                tokenIndex += count;
                if (tokenIndex < window.mathlive.readAloudTokens.length) {
                    window.mathlive.readAloudFinalToken = tokenIndex;
                }
            }
        }
        window.mathlive.readAloudAudio.currentTime = timeIndex;
        if (window.mathlive.onReadAloudStatus) {
            window.mathlive.onReadAloudStatus(window.mathlive.readAloudMathField, 'playing');
        }
        window.mathlive.readAloudAudio.play();
    }
}


/**
 * Transform all the elements in the document body that contain LaTeX code
 * into typeset math.
 * 
 * **Note:** This is a very expensive call, as it needs to parse the entire 
 * DOM tree to determine which elements need to be processed. In most cases 
 * this should only be called once per document, once the DOM has been loaded.
 * To render a specific element, use {@linkcode module:mathlive#renderMathInElement renderMathInElement()}
 *
 * **See:** {@tutorial USAGE_GUIDE}
 *
 * @param {object<string, any>} [options={}] See {@linkcode module:mathlive#renderMathInElement renderMathInElement()}
 * for details
 * @example
 * import MathLive from 'dist/mathlive.mjs';
 * document.addEventListener("load", () => { 
 *     MathLive.renderMathInDocument();
 * });
 * 
 */
function renderMathInDocument(options) {
    renderMathInElement(document.body, options);
}

function getElement(element) {
    let result = element;
    if (typeof element === 'string') {
        result = document.getElementById(element);
        if (!result) {
            throw Error(`The element with ID "${element}" could not be found.`);
        }
    }
    return result;
}

/**
 * Transform all the children of `element`, recursively, that contain LaTeX code
 * into typeset math.
 *
 * **See:** {@tutorial USAGE_GUIDE}
 *
 * @param {HTMLElement|string} element An HTML DOM element, or a string containing
 * the ID of an element.
 * @param {object} [options={}]
 *
 * @param {string} [options.namespace=''] - Namespace that is added to `data-`
 * attributes to avoid collisions with other libraries. 
 * 
 * It is empty by default.
 * 
 * The namespace should be a string of lowercase letters.
 * 
 * @param {object[]} [options.macros={}] - Custom LaTeX macros
 * 
 * @param {string[]} [options.skipTags=['noscript', 'style', 'textarea', 'pre', 'code', 'annotation', 'annotation-xml'] ] 
 * an array of tag names whose content will
 *  not be scanned for delimiters (unless their class matches the `processClass`
 * pattern below.
 * 
 * @param {string} [options.ignoreClass='tex2jax_ignore'] a string used as a
 * regular expression of class names of elements whose content will not be
 * scanned for delimiters

 * @param {string} [options.processClass='tex2jax_process']   a string used as a
 * regular expression of class names of elements whose content **will** be
 * scanned for delimiters,  even if their tag name or parent class name would
 * have prevented them from doing so.
 * 
 * @param {string} [options.processScriptType="math/tex"] `<script>` tags of the 
 * indicated type will be processed while others will be ignored.

 * 
 * @param {string} [options.renderAccessibleContent='mathml'] The format(s) in 
 * which to render the math for screen readers:
 * - `'mathml'` MathML
 * - `'speakable-text'` Spoken representation
 * 
 * You can pass an empty string to turn off the rendering of accessible content.
 * 
 * You can pass multiple values separated by spaces, e.g `'mathml speakable-text'`
 * 
 * @param {boolean} [options.preserveOriginalContent=true] if true, store the
 * original textual content of the element in a `data-original-content`
 * attribute. This value can be accessed for example to restore the element to
 * its original value:
 * ```javascript
 *      elem.innerHTML = elem.dataset.originalContent;
 * ```
 * @param {boolean} [options.readAloud=false] if true, generate markup that can
 * be read aloud later using {@linkcode module:editor-mathfield#speak speak}
 * 
 * @param {boolean} [options.TeX.processEnvironments=true] if false, math expression
 * that start with `\begin{` will not automatically be rendered.
 * 
 * @param {string[][]} [options.TeX.delimiters.inline=[['\\(','\\)']] ] arrays
 * of delimiter pairs that will trigger a render of the content in 'textstyle'
 *
 * @param {string[][]} [options.TeX.delimiters.display=[['$$', '$$'], ['\\[', '\\]']] ] arrays
 * of delimiter pairs that will trigger a render of the content in
 * 'displaystyle'.
 * 
 * @param {function} [renderToMarkup] a function that will convert any LaTeX found to
 * HTML markup. This is only useful to override the default MathLive renderer
 * 
 * @param {function} [renderToMathML] a function that will convert any LaTeX found to
 * MathML markup.
 * 
 * @param {function} [renderToSpeakableText] a function that will convert any LaTeX found to
 * speakable text markup.
 * 
 * @function module:mathlive#renderMathInElement
 */

function renderMathInElement(element, options) {
    if (!AutoRender) {
        console.warn('The AutoRender module is not loaded.');
        return;
    }
    options = options || {};
    options.renderToMarkup = options.renderToMarkup || toMarkup;
    options.renderToMathML = options.renderToMathML || toMathML;
    options.renderToSpeakableText = options.renderToSpeakableText || latexToSpeakableText;
    options.macros = options.macros || Definitions.MACROS;
    AutoRender.renderMathInElement(getElement(element), options);
}



function validateNamespace(options) {
    if (options.namespace) {
        if (!/^[a-z]+[-]?$/.test(options.namespace)) {
            throw Error('options.namespace must be a string of lowercase characters only');
        }
        if (!/-$/.test(options.namespace)) {
           options.namespace += '-';
        }
    }
}

/**
 *
 * @param {string|HTMLElement|MathField} element
 * @param {Object.<string, any>} [options={}]
 * @param {string} options.namespace The namespace used for the `data-`
 * attributes. If you used a namespace with `renderMathInElement`, you must
 * use the same namespace here.
 * @function module:mathlive#revertToOriginalContent
 */
function revertToOriginalContent(element, options) {
    element = getElement(element);

    // element is a pair: accessible span, math -- set it to the math part
    element = element.children[1];

    if (element instanceof MathField.MathField) {
        element.revertToOriginalContent();
    } else {
        options = options || {};
        validateNamespace(options);
        element.innerHTML = element.getAttribute('data-' +
            (options.namespace || '') + 'original-content');
    }
}



/**
 * After calling {@linkcode module:mathlive#renderMathInElement renderMathInElement}
 * or {@linkcode module:mathlive#makeMathField makeMathField} the original content
 * can be retrived by calling this function.
 * 
 * Given the following markup:
 * ```html
 * <span id='equation'>$$f(x)=sin(x)$$</span>
 * ```
 * The following code:
 * ```javascript
 * MathLive.renderMathInElement('equation');
 * console.log(MathLive.getOriginalContent('equation'));
 * ```
 * will output:
 * ```
 * $$f(x)=sin(x)$$
 * ```
 * @param {string | HTMLElement | MathField} element - A DOM element ID, a DOM 
 * element or a MathField.
 * @param {object} [options={}]
 * @param {string} [options.namespace=""] The namespace used for the `data-`
 * attributes. 
 * If you used a namespace with `renderMathInElement`, you must
 * use the same namespace here.
 * @return {string} the original content of the element.
 * @function module:mathlive#getOriginalContent
 */
function getOriginalContent(element, options) {
    element = getElement(element);

    // element is a pair: accessible span, math -- set it to the math part
    element = element.children[1];

    if (element instanceof MathField.MathField) {
        return element.originalContent;
    }
    options = options || {};
    validateNamespace(options);
    return element.getAttribute('data-' +
        (options.namespace || '') + 'original-content');
}

const MathLive = {
    latexToMarkup: toMarkup,
    latexToMathML: toMathML,
    latexToSpeakableText,
    latexToAST,
    makeMathField,
    renderMathInDocument,
    renderMathInElement,
    revertToOriginalContent,
    getOriginalContent,
    readAloud,
    readAloudStatus,
    pauseReadAloud,
    resumeReadAloud,
    playReadAloud
};

export default MathLive;



