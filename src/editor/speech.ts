import { TextToSpeechOptions } from '../public/config';
import { SpeechScope } from '../public/commands';

import { Atom } from '../core/atom';

import { atomToSpeakableText } from './atom-to-speakable-text';
import { register as registerCommand } from './commands';
import { getSelectedAtoms, selectionIsCollapsed } from './model-selection';
import { Mathfield } from './mathfield-utils';
import { render } from './mathfield-render';

export function speakableText(
    speechOptions: Required<TextToSpeechOptions>,
    prefix: string,
    atoms: Atom | Atom[]
) {
    const options = {
        ...speechOptions,
        textToSpeechMarkup: '' as '', // @revisit: ts weirdness
        textToSpeechRulesOptions: {
            ...speechOptions.textToSpeechRulesOptions,
            markup: 'none',
        },
    };
    return prefix + atomToSpeakableText(atoms, options);
}

/**
 *
 * Speak some part of the expression, either with or without synchronized highlighting.
 *
 * @param speakOptions.withHighlighting - If true, synchronized
 * highlighting of speech will happen (if possible). Default is false.
 */

// @revisit: register 'speak' command with mathfield (to get access to SpeechOptions, which need to be passed down)
registerCommand(
    {
        speak: (
            mathfield: Mathfield,
            scope: SpeechScope,
            options: { withHighlighting: boolean }
        ): boolean => {
            return speak(mathfield, scope, options);
        },
    },
    { target: 'mathfield', category: 'speech' }
);

function speak(
    mathfield: Mathfield,
    scope: SpeechScope,
    speakOptions: { withHighlighting: boolean }
) {
    speakOptions = speakOptions ?? { withHighlighting: false };
    function getAtoms(mathfield: Mathfield, scope: SpeechScope) {
        let result = null;
        switch (scope) {
            case 'all':
                result = mathfield.model.root;
                break;
            case 'selection':
                if (!selectionIsCollapsed(mathfield.model)) {
                    result = getSelectedAtoms(mathfield.model);
                }
                break;
            case 'left': {
                const siblings = mathfield.model.siblings();
                const last = mathfield.model.startOffset();
                if (last >= 1) {
                    result = [];
                    for (let i = 1; i <= last; i++) {
                        result.push(siblings[i]);
                    }
                }
                break;
            }
            case 'right': {
                const siblings = mathfield.model.siblings();
                const first = mathfield.model.endOffset() + 1;
                if (first <= siblings.length - 1) {
                    result = [];
                    for (let i = first; i <= siblings.length - 1; i++) {
                        result.push(siblings[i]);
                    }
                }
                break;
            }
            case 'group':
                result = mathfield.model.siblings();
                break;
            case 'parent': {
                const parent = mathfield.model.parent();
                if (parent && parent.type !== 'root') {
                    result = mathfield.model.parent();
                }
                break;
            }
            // case 'start':
            // case 'end':
            // not yet implemented
            // break;
            default:
                break;
        }
        return result;
    }
    function getFailedSpeech(scope: string): string {
        let result = '';
        switch (scope) {
            case 'all':
                console.log('Internal failure: speak all failed');
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
                console.log('Internal failure: speak group failed');
                break;
            case 'parent':
                result = 'no parent';
                break;
            default:
                console.log('unknown speak_ param value: "' + scope + '"');
                break;
        }
        return result;
    }
    const atoms = getAtoms(mathfield, scope);
    if (atoms === null) {
        mathfield.config.speakHook(getFailedSpeech(scope), mathfield.config);
        return false;
    }
    const options = { ...mathfield.config };
    if (speakOptions.withHighlighting || options.speechEngine === 'amazon') {
        options.textToSpeechMarkup =
            window['sre'] && options.textToSpeechRules === 'sre'
                ? 'ssml_step'
                : 'ssml';
    }
    const text = atomToSpeakableText(atoms, options);
    if (speakOptions.withHighlighting) {
        window['mathlive'].readAloudMathField = mathfield;
        render(mathfield, { forHighlighting: true });
        if (mathfield.config.readAloudHook) {
            mathfield.config.readAloudHook(
                mathfield.field,
                text,
                mathfield.config
            );
        }
    } else {
        if (mathfield.config.speakHook) {
            mathfield.config.speakHook(text, options);
        }
    }

    return false;
}

export function defaultSpeakHook(text, config) {
    if (!config && window && window['mathlive']) {
        config = window['mathlive'].config;
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
        if (!window || !window['AWS']) {
            console.warn(
                'AWS SDK not loaded. See https://www.npmjs.com/package/aws-sdk'
            );
        } else {
            const polly = new window['AWS'].Polly({ apiVersion: '2016-06-10' });
            const params = {
                OutputFormat: 'mp3',
                VoiceId: config.speechEngineVoice,
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
                ].includes(config.speechEngineVoice)
                    ? 'neural'
                    : 'standard',
                // SampleRate: '24000',
                Text: text,
                TextType: 'ssml',
                // SpeechMarkTypes: ['ssml]'
            };
            // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Polly.html#synthesizeSpeech-property
            polly.synthesizeSpeech(params, function (err, data) {
                if (err) {
                    console.warn(
                        'polly.synthesizeSpeech() error:',
                        err,
                        err.stack
                    );
                    // announce('plonk');
                } else if (data?.AudioStream) {
                    const uInt8Array = new Uint8Array(data.AudioStream);
                    const blob = new Blob([uInt8Array.buffer], {
                        type: 'audio/mpeg',
                    });
                    const url = URL.createObjectURL(blob);

                    const audioElement = new Audio(url);
                    audioElement.play().catch((err) => console.log(err));
                } else {
                    console.log('polly.synthesizeSpeech():' + data);
                }
            });

            // Can call AWS.Request() on the result of synthesizeSpeech()
        }
    } else if (config.speechEngine === 'google') {
        console.warn(
            'The Google speech engine is not supported yet. Please come again.'
        );
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
