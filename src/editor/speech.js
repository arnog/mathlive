"use strict";
exports.__esModule = true;
exports.defaultSpeakHook = void 0;
var atom_to_speakable_text_1 = require("../formats/atom-to-speakable-text");
var commands_1 = require("./commands");
var render_1 = require("../editor-mathfield/render");
var capabilities_1 = require("../ui/utils/capabilities");
var mathlive_1 = require("../mathlive");
/**
 *
 * Speak some part of the expression, either with or without synchronized highlighting.
 *
 * @param speakOptions.withHighlighting - If true, synchronized
 * highlighting of speech will happen (if possible). Default is false.
 */
(0, commands_1.register)({
    speak: function (mathfield, scope, options) {
        return speak(mathfield, scope, options);
    }
}, { target: 'mathfield' });
function speak(mathfield, scope, speakOptions) {
    var _a;
    speakOptions = speakOptions !== null && speakOptions !== void 0 ? speakOptions : { withHighlighting: false };
    var model = mathfield.model;
    function getAtoms(scope) {
        var result = null;
        switch (scope) {
            case 'all':
                result = model.root;
                break;
            case 'selection':
                result = model.getAtoms(model.selection);
                break;
            case 'left': {
                result = model.getAtoms(model.offsetOf(model.at(model.position).leftSibling), model.position);
                break;
            }
            case 'right': {
                result = model.getAtoms(model.position, model.offsetOf(model.at(model.position).rightSibling));
                break;
            }
            case 'group':
                result = model.getAtoms(model.getSiblingsRange(model.position));
                break;
            case 'parent': {
                var parent_1 = model.at(model.position).parent;
                if (parent_1 === null || parent_1 === void 0 ? void 0 : parent_1.parent)
                    result = parent_1;
                else
                    result = model.root;
                break;
            }
            default:
                result = model.root;
        }
        return result;
    }
    function getFailedSpeech(scope) {
        var result = '';
        switch (scope) {
            case 'all':
                console.error('Internal failure: speak all failed');
                break;
            case 'selection':
                result = 'no selection';
                break;
            case 'left':
                result = 'at start';
                break;
            case 'right':
                result = 'at end';
                break;
            case 'group':
                console.error('Internal failure: speak group failed');
                break;
            case 'parent':
                result = 'no parent';
                break;
            default:
                console.error('unknown speak_ param value: "' + scope + '"');
                break;
        }
        return result;
    }
    var mfe = globalThis.MathfieldElement;
    var atoms = getAtoms(scope);
    if (atoms === null) {
        (_a = mfe.speakHook) === null || _a === void 0 ? void 0 : _a.call(mfe, getFailedSpeech(scope));
        return false;
    }
    if (speakOptions.withHighlighting || mfe.speechEngine === 'amazon') {
        mfe.textToSpeechMarkup =
            globalThis.sre && mfe.textToSpeechRules === 'sre' ? 'ssml_step' : 'ssml';
    }
    var text = (0, atom_to_speakable_text_1.atomToSpeakableText)(atoms);
    if ((0, capabilities_1.isBrowser)() && speakOptions.withHighlighting) {
        (0, mathlive_1.globalMathLive)().readAloudMathfield = mathfield;
        (0, render_1.render)(mathfield, { forHighlighting: true });
        if (mfe.readAloudHook)
            mfe.readAloudHook(mathfield.field, text);
    }
    else if (mfe.speakHook)
        mfe.speakHook(text);
    return false;
}
function defaultSpeakHook(text) {
    var _a, _b;
    if (!(0, capabilities_1.isBrowser)()) {
        console.log('Speak:', text);
        return;
    }
    var mfe = globalThis.MathfieldElement;
    if (!mfe.speechEngine || mfe.speechEngine === 'local') {
        // On ChromeOS: chrome.accessibilityFeatures.spokenFeedback
        // See also https://developer.chrome.com/apps/tts
        var utterance = new SpeechSynthesisUtterance(text);
        globalThis.speechSynthesis.speak(utterance);
    }
    else if (mfe.speechEngine === 'amazon') {
        if (!('AWS' in window)) {
            console.error("MathLive {{SDK_VERSION}}: AWS SDK not loaded. See https://www.npmjs.com/package/aws-sdk");
        }
        else {
            var polly = new globalThis.AWS.Polly({ apiVersion: '2016-06-10' });
            var parameters = {
                OutputFormat: 'mp3',
                VoiceId: (_a = mfe.speechEngineVoice) !== null && _a !== void 0 ? _a : 'Joanna',
                Engine: [
                    'Amy',
                    'Emma',
                    'Brian',
                    'Ivy',
                    'Joanna',
                    'Kendra',
                    'Kimberly',
                    'Salli',
                    'Joey',
                    'Justin',
                    'Matthew',
                ].includes((_b = mfe.speechEngineVoice) !== null && _b !== void 0 ? _b : 'Joanna')
                    ? 'neural'
                    : 'standard',
                // SampleRate: '24000',
                Text: text,
                TextType: 'ssml'
            };
            // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Polly.html#synthesizeSpeech-property
            polly.synthesizeSpeech(parameters, function (err, data) {
                if (err) {
                    console.trace("MathLive {{SDK_VERSION}}: `polly.synthesizeSpeech()` error: ".concat(err));
                }
                else if (data === null || data === void 0 ? void 0 : data.AudioStream) {
                    // Announce('plonk');
                    var uInt8Array = new Uint8Array(data.AudioStream);
                    var blob = new Blob([uInt8Array.buffer], { type: 'audio/mpeg' });
                    var url = URL.createObjectURL(blob);
                    var audioElement = new Audio(url);
                    audioElement.play()["catch"](function (error) { return console.error(error); });
                }
                else
                    console.log('polly.synthesizeSpeech():', data);
            });
            // Can call AWS.Request() on the result of synthesizeSpeech()
        }
    }
    else if (mfe.speechEngine === 'google') {
        console.error("MathLive {{SDK_VERSION}}: The Google speech engine is not supported yet. Please come again.");
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
exports.defaultSpeakHook = defaultSpeakHook;
