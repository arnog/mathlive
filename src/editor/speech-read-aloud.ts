import { render } from './mathfield-render';
import { MathfieldConfig } from '../public/config';

function removeHighlight(node) {
    node.classList.remove('highlight');
    if (node.children) {
        for (const child of node.children) {
            removeHighlight(child);
        }
    }
}

/**
 * Highlights the span corresponding to the specified atomID.
 *
 * This is used for text-to-speech with synchronized highlighting (read aloud)
 *
 * @category Read Aloud
 * @param {string} atomID
 *
 */
function highlightAtomID(node, atomID?) {
    if (!atomID || node.dataset.atomId === atomID) {
        node.classList.add('highlight');
        if (node.children && node.children.length > 0) {
            Array.from(node.children).forEach((x) => {
                highlightAtomID(x);
            });
        }
    } else {
        node.classList.remove('highlight');
        if (node.children && node.children.length > 0) {
            Array.from(node.children).forEach((x) => {
                highlightAtomID(x, atomID);
            });
        }
    }
}

/**
 * "Read Aloud" is an asynchronous operation that reads the
 * reading with synchronized highlighting
 *
 * @param element - The DOM element to highlight
 * @param text - The text to speak
 */
export function defaultReadAloudHook(
    element: HTMLElement,
    text: string,
    config: MathfieldConfig
) {
    if (!window) {
        return;
    }
    if (!config && window['mathlive']) {
        config = window['mathlive'].config;
    }
    config = config || {};

    if (config.speechEngine !== 'amazon') {
        console.warn('Use Amazon TTS Engine for synchronized highlighting');
        if (config.speakHook) config.speakHook(text, config);
        return;
    }
    if (!window['AWS']) {
        console.warn(
            'AWS SDK not loaded. See https://www.npmjs.com/package/aws-sdk'
        );
        return;
    }
    const polly = new window['AWS'].Polly({ apiVersion: '2016-06-10' });

    const params = {
        OutputFormat: 'json',
        VoiceId: config.speechEngineVoice || 'Joanna',
        Engine: 'standard', // The neural engine does not appear to support ssml marks
        Text: text,
        TextType: 'ssml',
        SpeechMarkTypes: ['ssml'],
    };

    window['mathlive'] = window['mathlive'] ?? {};
    window['mathlive'].readAloudElement = element;

    const statusHook =
        config.onReadAloudStatus || window['mathlive'].onReadAloudStatus;

    // Request the mark points
    polly.synthesizeSpeech(params, (err, data) => {
        if (err) {
            console.warn('polly.synthesizeSpeech() error:', err, err.stack);
            return;
        }
        if (!data || !data.AudioStream) {
            console.log('polly.synthesizeSpeech():' + data);
            return;
        }
        const response = new TextDecoder('utf-8').decode(
            new Uint8Array(data.AudioStream)
        );
        window['mathlive'].readAloudMarks = response
            .split('\n')
            .map((x) => (x ? JSON.parse(x) : {}));
        window['mathlive'].readAloudTokens = [];
        for (const mark of window['mathlive'].readAloudMarks) {
            if (mark.value) {
                window['mathlive'].readAloudTokens.push(mark.value);
            }
        }
        window['mathlive'].readAloudCurrentMark = '';

        // Request the audio
        params.OutputFormat = 'mp3';
        params.SpeechMarkTypes = [];
        polly.synthesizeSpeech(params, function (err, data) {
            if (err) {
                console.warn(
                    'polly.synthesizeSpeech(',
                    text,
                    ') error:',
                    err,
                    err.stack
                );
                return;
            }
            if (!data || !data.AudioStream) {
                return;
            }
            const uInt8Array = new Uint8Array(data.AudioStream);
            const blob = new Blob([uInt8Array.buffer], {
                type: 'audio/mpeg',
            });
            const url = URL.createObjectURL(blob);

            if (!window['mathlive'].readAloudAudio) {
                window['mathlive'].readAloudAudio = new Audio();
                window['mathlive'].readAloudAudio.addEventListener(
                    'ended',
                    () => {
                        const mathfield = window['mathlive'].readAloudMathField;
                        if (statusHook) {
                            statusHook(mathfield, 'ended');
                        }
                        if (mathfield) {
                            render(mathfield);
                            window['mathlive'].readAloudElement = null;
                            window['mathlive'].readAloudMathField = null;
                            window['mathlive'].readAloudTokens = [];
                            window['mathlive'].readAloudMarks = [];
                            window['mathlive'].readAloudCurrentMark = '';
                        } else {
                            removeHighlight(
                                window['mathlive'].readAloudElement
                            );
                        }
                    }
                );
                window['mathlive'].readAloudAudio.addEventListener(
                    'timeupdate',
                    () => {
                        let value = '';
                        // The target, the atom we're looking for, is the one matching the current audio
                        // plus 100 ms. By anticipating it a little bit, it feels more natural, otherwise it
                        // feels like the highlighting is trailing the audio.
                        const target =
                            window['mathlive'].readAloudAudio.currentTime *
                                1000 +
                            100;

                        // Find the smallest element which is bigger than the target time
                        for (const mark of window['mathlive'].readAloudMarks) {
                            if (mark.time < target) {
                                value = mark.value;
                            }
                        }
                        if (window['mathlive'].readAloudCurrentMark !== value) {
                            window['mathlive'].readAloudCurrentToken = value;
                            if (
                                value &&
                                value === window['mathlive'].readAloudFinalToken
                            ) {
                                window['mathlive'].readAloudAudio.pause();
                            } else {
                                window['mathlive'].readAloudCurrentMark = value;
                                highlightAtomID(
                                    window['mathlive'].readAloudElement,
                                    window['mathlive'].readAloudCurrentMark
                                );
                            }
                        }
                    }
                );
            } else {
                window['mathlive'].readAloudAudio.pause();
            }

            window['mathlive'].readAloudAudio.src = url;
            if (statusHook) {
                statusHook(window['mathlive'].readAloudMathField, 'playing');
            }
            window['mathlive'].readAloudAudio.play();
        });
    });
}

/**
 * Returns the status of a Read Aloud operation (reading with synchronized
 * highlighting).
 *
 * Possible values are:
 * - `"ready"`
 * - `"playing"`
 * - `"paused"`
 * - `"unavailable"`
 *
 * **See** {@linkcode speak}
 * @category Read Aloud
 * @return {"ready" | "playing" | "paused" | "unavailable"}
 */
export function readAloudStatus() {
    if (!window) return 'unavailable';
    window['mathlive'] = window['mathlive'] || {};

    if (!window['mathlive'].readAloudAudio) return 'ready';
    if (window['mathlive'].readAloudAudio.paused) return 'paused';
    if (!window['mathlive'].readAloudAudio.ended) return 'playing';

    return 'ready';
}

/**
 * Pauses a read aloud operation if one is in progress.
 *
 * **See** {@linkcode speak}
 */
export function pauseReadAloud() {
    if (!window) return;
    window['mathlive'] = window['mathlive'] || {};
    if (window['mathlive'].readAloudAudio) {
        if (window['mathlive'].onReadAloudStatus) {
            window['mathlive'].onReadAloudStatus(
                window['mathlive'].readAloudMathField,
                'paused'
            );
        }
        window['mathlive'].readAloudAudio.pause();
    }
}

/**
 * Resumes a read aloud operation if one was paused.
 *
 * **See** {@linkcode speak}
 */
export function resumeReadAloud() {
    if (!window) return;
    window['mathlive'] = window['mathlive'] || {};
    if (window['mathlive'].readAloudAudio) {
        if (window['mathlive'].onReadAloudStatus) {
            window['mathlive'].onReadAloudStatus(
                window['mathlive'].readAloudMathField,
                'playing'
            );
        }
        window['mathlive'].readAloudAudio.play();
    }
}

/**
 * If a Read Aloud operation is in progress, read from a specified token
 *
 * **See** {@linkcode speak}
 *
 * @param {string} [token]
 * @param {number} [count] The number of tokens to read.
 */
export function playReadAloud(token, count) {
    if (!window) return;
    window['mathlive'] = window['mathlive'] || {};
    if (window['mathlive'].readAloudAudio) {
        let timeIndex = 0;
        window['mathlive'].readAloudFinalToken = null;
        if (token) {
            window['mathlive'].readAloudMarks =
                window['mathlive'].readAloudMarks || [];
            for (const mark of window['mathlive'].readAloudMarks) {
                if (mark.value === token) {
                    timeIndex = mark.time / 1000;
                }
            }
            let tokenIndex = window['mathlive'].readAloudTokens.indexOf(token);
            if (tokenIndex >= 0) {
                tokenIndex += count;
                if (tokenIndex < window['mathlive'].readAloudTokens.length) {
                    window['mathlive'].readAloudFinalToken = tokenIndex;
                }
            }
        }
        window['mathlive'].readAloudAudio.currentTime = timeIndex;
        if (window['mathlive'].onReadAloudStatus) {
            window['mathlive'].onReadAloudStatus(
                window['mathlive'].readAloudMathField,
                'playing'
            );
        }
        window['mathlive'].readAloudAudio.play();
    }
}
