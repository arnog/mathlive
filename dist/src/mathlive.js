
/**
 *
 * The functions in this module are the main entry points to the MathLive
 * public API.
 *
 * To invoke these functions, use the global MathLive object. For example:
 * ```javascript
 * const markup = MathLive.toMarkup('e^{i\\pi}+1=0');
 * ```
 *
 * @module mathlive
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
 * @param {string} displayMode If `'displaystyle'` the "display" mode of TeX
 * is used to typeset the formula. Most appropriate for formulas that are
 * displayed in a standalone block. If `'textstyle'` is used, the "text" mode
 * of TeX is used, which is most appropriate when displaying math "inline"
 * with other text.
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
 * @param {HTMLElement|string} element An HTML DOM element, for example as obtained 
 * by `.getElementById()`, or a string representing the ID of a DOM element.
 * 
 * @param {Object<string, *>} [config]
 *
 * @param {number} [config.horizontalSpacingScale=1.0] - Scaling factor to be
 * applied to horizontal spacing between elements.
 *
 * @param {string} [config.namespace=''] - Namespace that is added to `data-`
 * attributes to avoid collisions with other libraries. It is empty by default.
 * The namespace should be a string of lowercase letters.
 *
 * @param {function} [config.substituteTextArea] - A function that returns a
 * focusable element that can be used to capture text input. This can be
 * useful when a `<textarea>` element would be undesirable. Note that by default
 * on mobile devices the TextArea is automatically replaced with a `<span>` to
 * prevent the device virtual keyboard from being displayed.
 *
 * @param {function(mathfield)} [config.onFocus] - Invoked when the mathfield has
 * gained focus
 *
 * @param {function(mathfield)} [config.onBlur] - Invoked when the mathfield has
 * lost focus
 * 
 * @param {function(mathfield, keystroke:string, ev:Event):boolean} [config.onKeystroke] - Invoked when a keystroke is
 * about to be processed. 
 * - `keystroke` is a string describing the keystroke
 * - `ev` is the keyboard event. 
 * 
 * Return false to stop handling of the event.
 *
 * @param {boolean} [config.overrideDefaultInlineShortcuts=false] - If true
 * the default inline shortcuts (e.g. 'p' + 'i' = 'π') are ignored.
 * 
 * @param {Object.<string, string>} [config.inlineShortcuts] - A map of 
 * shortcuts → replacement value. For example `{ 'pi': '\\pi'}`. 
 * If `overrideDefaultInlineShortcuts` is false, these shortcuts are applied 
 * after any default ones, and can therefore override them.
 * 
 * @param {number} [config.inlineShortcutTimeout=0] - Maximum time, in milliseconds, 
 * between consecutive characters for them to be considered part of the same 
 * shortcut sequence. 
 * 
 * A value of 0 is the same as infinity: any consecutive 
 * character will be candidate for an inline shortcut, regardless of the 
 * interval between this character and the previous one. 
 * 
 * A value of 250 will indicate that the maximum interval between two 
 * characters to be considered part of the same inline shortcut sequence is 
 * 1/4 of a second.
 * 
 * This is useful to enter "+-" as a sequence of two characters, while also 
 * supporting the "±" shortcut with the same sequence.
 * The first result can be entered by pausing slightly between the first and 
 * second character if this option is set to a value of 250 or so.
 * 
 * @param {number|string} [config.inlineShortcutConversionDelay=0] - Time, in 
 * milliseconds, before an inline shortcut is converted. 
 * 
 * If the value is 0, the inline shortcut is converted as soon as it is 
 * recognized. This can cause issues if there are overlapping shortcuts. 
 * For example, if there is a 'del' shortcut, the 'delta' shortcut would never 
 * get triggered. 
 * 
 * Setting a small value, for example 250 ms, ensures that the longer shortcut 
 * can be typed without triggering the first one. 
 * 
 * The value can also be set to 'auto', in which case the delay is 0 if the 
 * shortcut sequence is unambiguous and a small delay otherwise.
 * 
 * @param {boolean} [config.smartFence=true] - If true, when an open fence is
 * entered via `typedText()` it will generate a contextually appropriate markup,
 * for example using `\left...\right` if applicable. If false, the literal
 * value of the character will be inserted instead.
 * 
 * @param {boolean} [config.ignoreSpacebarInMathMode=true] - If true, when the 
 * spacebar is pressed, no space is inserted. If false, a space is inserted
 * when the spacebar is pressed.
 * 
 * @param {string} [config.virtualKeyboardToggleGlyph] - If specified, the markup 
 * to be used to display the virtual keyboard toggle glyph. If none is specified
 * a default keyboard icon is used.
 *
 * @param {string} [config.virtualKeyboardMode=''] - 
 * - `'manual'`: pressing the virtual keyboard toggle button will show or hide
 * the virtual keyboard. If hidden, the virtual keyboard is not shown when the 
 * field is focused until the toggle button is pressed.
 * - `'onfocus'`: the virtual keyboard will be displayed whenever the field is
 * focused and hidden when the field loses focus. In that case, the virtual 
 * keyboard toggle button is not displayed.
 * - `'off'`: the virtual keyboard toggle button is not displayed, and the
 * virtual keyboard is never triggered.
 * 
 * If the setting is empty, it will default to `'onfocus'` on touch-capable 
 * devices and to `'off'` otherwise.
 *
 * @param {string} [config.virtualKeyboards='all'] - A space separated list of
 * the keyboards that should be available. The keyboard `'all'` is synonym with:
 *
 * * `'numeric'`, `'roman'`, `'greek'`, `'functions'` and `'command'`
 *
 * The keyboards will be displayed in the order indicated.
 *
 * @param {string} [config.virtualKeyboardRomanLayout='qwerty'] - The
 * arrangement of the keys for the layers of the roman virtual keyboard.
 * One of `'qwerty'`, `'azerty'`, '`qwertz'`, '`dvorak`' or '`colemak`'.
 *
 * @param {Object} [config.customVirtualKeyboardLayers] - Some additional
 * custom virtual keyboard layers. A keyboard is made up of one or more
 * layers (think of the main layer and the shift layer on a hardware keyboard).
 * Each key in this object define a new keyboard layer (or replace an existing
 * one). The value of the key should be some HTML markup.
 *
 * @param {Object} [config.customVirtualKeyboards] - An object describing
 * additional keyboards. Each key in the object is an ID for a separate keyboard.
 * The key should have a value made up of an object with the following keys:
 *    * tooltip: a string label describing the keyboard.
 *    * label: a string, displayed in the keyboard switcher to identify this 
 *      keyboard
 *    * layers: an array of strings, the ID of the layers used by this keyboard.
 *     These layers should be defined using `customVirtualKeyboardLayers`.
 *    * classes: a string, the classes to be added to the label for this keyboard
 * Possible values are 'tex' to use a TeX font to display the label.
 *    * layer: optional, the ID of the layer to switch to when the label of this
 * keyboard is clicked on in the keyboard switcher.
 *    * command: optional, a selector to perform when the label is clicked.
 * Either the `command` or `layer` key must be present.
 *
 *
 * @param {boolean} [config.virtualKeyboardTheme=''] - The visual theme used
 * for the virtual keyboard. If empty, the theme will switch automatically
 * based on the device it's running on. The two supported themes are
 * 'material' and 'apple' (the default).
 * 
 * @param {boolean} [config.keypressVibration='on'] When a key on the virtual 
 * keyboard is pressed, produce a short haptic feedback, if the device supports
 * it.
 * 
 * @param {boolean} [config.keypressSound=''] When a key on the virtual 
 * keyboard is pressed, produce a short audio feedback. The value should be 
 * either a URL to a sound file or an object with the following keys:
 *    * `delete` URL to a sound file played when the delete key is pressed
 *    * `return` ... when the return/tab key is pressed
 *    * `spacebar` ... when the spacebar is pressed
 *    * `default` ... when any other key is pressed. This key is required, the
 * others are optional. If they are missing, this sound is played as well.
 *
 * @param {string} [config.plonkSound=''] Path to a URL to a sound file
 * which will be played to provide feedback when a command has no effect,
 * for example when pressing the spacebar at the root level.
 *
 * @param {string} [config.textToSpeechRules='mathlive'] Specify which
 * set of text to speech rules to use. A value of `mathlive` indicates that
 * the simple rules built into MathLive should be used. A value of `sre`
 * indicates that the Speech Rule Engine from Volker Sorge should be used.
 * Note that SRE is not included or loaded by MathLive and for this option to
 * work SRE should be loaded separately.
 * 
 * @param {string} [config.textToSpeechMarkup=''] The markup syntax to use 
 * for the output of conversion to spoken text. Possible values are `ssml` for 
 * the SSML markup or `mac` for the MacOS markup (e.g. `[[ltr]]`)
 *
 * @param {*} [config.textToSpeechRulesOptions={}] A set of value/pair that can
 * be used to configure the speech rule engine. Which options are available
 * depends on the speech rule engine in use. There are no options available with
 * MathLive's built-in engine. The options for the SRE engine are documented
 * [here]{@link:https://github.com/zorkow/speech-rule-engine}
 *
 * @param {string} [config.speechEngine='local'] Indicates which speech engine
 * to use for speech output. Use `local` to use the OS-specific TTS engine.
 * Use `amazon` for Amazon Text-to-Speech cloud API. You must include the AWS
 * API library and configure it with your API key before use. See the 'speech'
 * example project for more details.
 *
 * @param {string} [config.speechEngineVoice=''] Indicates the voice to use with
 *  the speech engine. This is dependent on the speech engine. For Amazon Polly,
 * see here: https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
 *
 * @param {string} [config.speechEngineRate=''] Sets the speed of the selected
 * voice. One of `x-slow, slow, medium, fast,x-fast` or a value as a percentage.
 * For example `200%` to indicate a speaking rate twice the default rate. Range
 * is `20%` to `200%`
 *
 * @param {function(mathfield, direction:string):boolean} [config.onMoveOutOf] - A handler
 * invoked when keyboard navigation would cause the insertion point to leave the
 * mathfield. 
 * 
 * The argument indicates the direction of the navigation, either 
 * `"forward"` or `"backward"`. 
 * 
 * Return `false` to prevent the move, `true` to
 * wrap around to the start of the field.
 *
 * By default, the insertion point will wrap around.
 *
 * @param {function(mathfield, direction:string)} [config.onTabOutOf] - A handler invoked when
 * pressing tab (or shift-tab) would cause the insertion point to leave the mathfield.
 * 
 * The argument indicates the direction of the navigation, either 
 * `"forward"` or `"backward"`. 
 *
 * By default, the insertion point jumps to the next/previous focussable element.
 *
 * @param {function(mathfield)} [config.onContentWillChange] - A handler invoked
 * just before the content is about to be changed.
 *
 * @param {function(mathfield)} [config.onContentDidChange] - A handler invoked
 * just after the content has been changed.
 *
 * @param {function(mathfield)} [config.onSelectionWillChange] - A handler invoked
 * just before the selection is about to be changed.
 *
 * @param {function(mathfield)} [config.onSelectionDidChange] - A handler invoked
 * just after the selection has been changed.
 *
 * @param {function(mathfield, command:string)} [config.onUndoStateWillChange] - A handler invoked
 * before a change in the undo stack state. The `command` argument is a string
 * indication what caused the state change: `"undo"`, `"redo"` or `"snapshot"`.
 *
 * @param {function(mathfield, command:string)} [config.onUndoStateDidChange] - A handler invoked
 * after a change in the undo stack state. The `command` argument is a string
 * indication what caused the state change: `"undo"`, `"redo"` or `"snapshot"`.
 *
 * @param {function(mathfield, visible:boolean, keyboard:HTMLDivElement)} [config.onVirtualKeyboardToggle] - A handler
 * invoked after the virtual keyboard visibility has changed. 
 * 
 * The `visible` argument is true if the virtual keyboard is visible.
 * 
 * The second argument is a DOM
 * element containing the virtual keyboard, which can be used to determine its
 * size, and therefore the portion of the screen it obscures.
 *
 * @param {function(mathfield, status:string)} [config.onReadAloudStatus] - A handler invoked
 * when the status of read aloud changes. 
 * 
 * The `status` argument is a string denoting the status:
 * - `"playing"` when reading begins
 * - `"done"` when reading has been completed,
 * - `"paused"` when reading has been temporarily paused by the user
 *
 * @param {function(string, config:object)} [config.handleSpeak] - A callback invoked to produce speech from
 * a string.
 *
 * @param {*} [config.handleReadAloud] - A callback invoked to produce speech
 * and highlight the relevant atoms in an equation. The input is SSML markup
 * with appropriate `<mark>` tags.
 *
 * @return {MathField}
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
 * to the MathML nodes with a value corresponding with the a matching atomID.
 * @return {string}
 * @function module:mathlive#latexToMathML
 */
function toMathML(latex, options) {
    if (!MathAtom.toMathML) {
        console.log('The MathML module is not loaded.');
        return '';
    }
    options = options || {macros:{}};
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
 * @return {Object} The Abstract Syntax Tree as a JavaScript object.
 * @function module:mathlive#latexToAST
 */
function latexToAST(latex, options) {
    if (!MathAtom.toAST) {
        console.log('The AST module is not loaded.');
        return {};
    }
    options = options || {macros:{}};
    Object.assign(options.macros, Definitions.MACROS);

    const mathlist = ParserModule.parseTokens(Lexer.tokenize(latex),
        'math', null, options.macros);

    return MathAtom.toAST(mathlist, options);
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
            console.log('AWS SDK not loaded. See https://www.npmjs.com/package/aws-sdk');
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
                    console.log('polly.synthesizeSpeech() error:', err, err.stack);
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
        console.log('The Google speech engine is not supported yet. Please come again.');
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
 * Start a Read Aloud operation (reading with synchronized highlighting).
 * 
 * @param {DOMElement} element - The DOM element to highlight
 * @param {string} text - The text to speak
 * @param {object} config
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
        console.log('Use Amazon TTS Engine for synchronized highlighting');
        if (config.handleSpeak) config.handleSpeak(text);
        return;
    }
    if (!window.AWS) {
        console.log('AWS SDK not loaded. See https://www.npmjs.com/package/aws-sdk');
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
            console.log('polly.synthesizeSpeech() error:', err, err.stack);
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
                        console.log('polly.synthesizeSpeech(', text , ') error:', err, err.stack);
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
 * highlighting). Possible values include:
 * - `ready`
 * - `playing`
 * - `paused`
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
 * @param {string} token
 * @param {number?} count
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
 * **See:** {@tutorial USAGE_GUIDE}
 *
 * @param {Object} [options] See [`renderMathInElement()`]{@link module:mathlive#renderMathInElement}
 * for details
 * @function module:mathlive#renderMathInDocument
 */
function renderMathInDocument(options) {
    if (!AutoRender) {
        console.log('The AutoRender module is not loaded.');
        return;
    }

    AutoRender.renderMathInElement(document.body, options, toMarkup, toMathML);

    // Ask to be notified when fonts are loaded, and re-render.
    // There are rare cases where the layout needs to be recomputed after
    // fonts are loaded, e.g. the \compose command.
    // if (document.fonts) {
    //     document.fonts.ready.then(() => renderMathInElement(document.body, options, toMarkup, toMathML));
    // }
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
 * @param {Element|string} element An HTML DOM element, or a string containing
 * the ID of an element.
 * @param {Object} [options]
 *
 * @param {string} [options.namespace=''] - Namespace that is added to `data-`
 * attributes to avoid collisions with other libraries. It is empty by default.
 * The namespace should be a string of lowercase letters.
 * @param {object[]} [options.macros={}] - Custom macros
 * @param {string[]} options.skipTags an array of tag names whose content will
 *  not be scanned for delimiters
 * @param {string} [options.ignoreClass='tex2jax_ignore'] a string used as a
 * regular expression of class names of elements whose content will not be
 * scanned for delimiters
 * @param {string} [options.processClass='tex2jax_process']   a string used as a
 * regular expression of class names of elements whose content **will** be
 * scanned for delimiters,  even if their tag name or parent class name would
 * have prevented them from doing so.
 * @param {boolean} [options.preserveOriginalContent=true] if true, store the
 * original textual content of the element in a `data-original-content`
 * attribute. This value can be accessed for example to restore the element to
 * its original value:
 * ```javascript
 *      elem.innerHTML = elem.dataset.originalContent;
 * ```
 * @param {boolean} [options.readAloud=false] if true, generate markup that can
 * be read aloud later using MathLive.readAloud()
 * @param {boolean} options.TeX.processEnvironments if false, math expression
 * that start with `\begin{` will not automatically be rendered. (true by default)
 * @param {Array} options.TeX.delimiters.inline
 * @param {Array} options.TeX.delimiters.display `TeX.delimiters.display` arrays
 * of delimiters that will trigger a render of the content in 'textstyle' or
 * 'displaystyle', respectively.
 * @function module:mathlive#renderMathInElement
 */
function renderMathInElement(element, options) {
    if (!AutoRender) {
        console.log('The AutoRender module is not loaded.');
        return;
    }
    AutoRender.renderMathInElement(getElement(element), options, toMarkup, toMathML);
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
 * @param {string|Element|MathField} element
 * @param {Object} [options={}]
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
 *
 * @param {string|Element|MathField} element
 * @param {Object} [options={}]
 * @param {string} options.namespace The namespace used for the `data-`
 * attributes. If you used a namespace with `renderMathInElement`, you must
 * use the same namespace here.
 * @return {string} the original content of the element.
 * @function module:mathlive#revertToOriginalContent
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



