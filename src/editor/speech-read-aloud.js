"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.playReadAloud = exports.resumeReadAloud = exports.pauseReadAloud = exports.readAloudStatus = exports.defaultReadAloudHook = void 0;
var mathlive_1 = require("../mathlive");
var capabilities_1 = require("../ui/utils/capabilities");
var render_1 = require("../editor-mathfield/render");
function removeHighlight(element) {
    if (!element)
        return;
    element.classList.remove('ML__highlight');
    if (element.children)
        for (var _i = 0, _a = element.children; _i < _a.length; _i++) {
            var child = _a[_i];
            removeHighlight(child);
        }
}
/**
 * Highlights the box corresponding to the specified atomID.
 *
 * This is used for text-to-speech with synchronized highlighting (read aloud)
 *
 * @category Read Aloud
 * @param {string} atomID
 *
 */
function highlightAtomID(element, atomID) {
    var _a;
    if (!element)
        return;
    if (!atomID || ((_a = element.dataset) === null || _a === void 0 ? void 0 : _a.atomId) === atomID) {
        element.classList.add('ML__highlight');
        if (element.children && element.children.length > 0) {
            __spreadArray([], element.children, true).forEach(function (x) {
                if (x instanceof HTMLElement)
                    highlightAtomID(x);
            });
        }
    }
    else {
        element.classList.remove('ML__highlight');
        if (element.children && element.children.length > 0) {
            __spreadArray([], element.children, true).forEach(function (x) {
                if (x instanceof HTMLElement)
                    highlightAtomID(x, atomID);
            });
        }
    }
}
/**
 * "Read Aloud" is an asynchronous operation that reads the
 * formula with synchronized highlighting
 *
 * @param element - The DOM element to highlight
 * @param text - The text to speak
 */
function defaultReadAloudHook(element, text) {
    var _a;
    if (!(0, capabilities_1.isBrowser)())
        return;
    if (globalThis.MathfieldElement.speechEngine !== 'amazon') {
        console.error("MathLive {{SDK_VERSION}}: Use Amazon TTS Engine for synchronized highlighting");
        if (typeof globalThis.MathfieldElement.speakHook === 'function')
            globalThis.MathfieldElement.speakHook(text);
        return;
    }
    if (!globalThis.AWS) {
        console.error("MathLive {{SDK_VERSION}}: AWS SDK not loaded. See https://www.npmjs.com/package/aws-sdk");
        return;
    }
    var polly = new globalThis.AWS.Polly({ apiVersion: '2016-06-10' });
    var parameters = {
        OutputFormat: 'json',
        VoiceId: (_a = globalThis.MathfieldElement.speechEngineVoice) !== null && _a !== void 0 ? _a : 'Joanna',
        Engine: 'standard',
        Text: text,
        TextType: 'ssml',
        SpeechMarkTypes: ['ssml']
    };
    (0, mathlive_1.globalMathLive)().readAloudElement = element;
    // Request the mark points
    polly.synthesizeSpeech(parameters, function (err, data) {
        if (err) {
            console.trace("MathLive {{SDK_VERSION}}: `polly.synthesizeSpeech()` error: ".concat(err));
            return;
        }
        if (!(data === null || data === void 0 ? void 0 : data.AudioStream)) {
            console.log('polly.synthesizeSpeech():', data);
            return;
        }
        var response = new TextDecoder('utf-8').decode(new Uint8Array(data.AudioStream));
        (0, mathlive_1.globalMathLive)().readAloudMarks = response
            .split('\n')
            .map(function (x) { return (x ? JSON.parse(x) : {}); });
        (0, mathlive_1.globalMathLive)().readAloudTokens = [];
        for (var _i = 0, _a = (0, mathlive_1.globalMathLive)().readAloudMarks; _i < _a.length; _i++) {
            var mark = _a[_i];
            if (mark.value)
                (0, mathlive_1.globalMathLive)().readAloudTokens.push(mark.value);
        }
        (0, mathlive_1.globalMathLive)().readAloudCurrentMark = '';
        // Request the audio
        parameters.OutputFormat = 'mp3';
        parameters.SpeechMarkTypes = [];
        polly.synthesizeSpeech(parameters, function (err, data) {
            if (err) {
                console.trace("MathLive {{SDK_VERSION}}: `polly.synthesizeSpeech(\"".concat(text, "\") error:").concat(err));
                return;
            }
            if (!(data === null || data === void 0 ? void 0 : data.AudioStream))
                return;
            var uInt8Array = new Uint8Array(data.AudioStream);
            var blob = new Blob([uInt8Array.buffer], {
                type: 'audio/mpeg'
            });
            var url = URL.createObjectURL(blob);
            var global = (0, mathlive_1.globalMathLive)();
            if (!global.readAloudAudio) {
                global.readAloudAudio = new Audio();
                global.readAloudAudio.addEventListener('ended', function () {
                    var mathfield = global.readAloudMathfield;
                    global.readAloudStatus = 'ended';
                    document.body.dispatchEvent(new Event('read-aloud-status-change', {
                        bubbles: true,
                        composed: true
                    }));
                    if (mathfield) {
                        (0, render_1.render)(mathfield);
                        global.readAloudElement = null;
                        global.readAloudMathfield = null;
                        global.readAloudTokens = [];
                        global.readAloudMarks = [];
                        global.readAloudCurrentMark = '';
                    }
                    else
                        removeHighlight(global.readAloudElement);
                });
                global.readAloudAudio.addEventListener('timeupdate', function () {
                    var value = '';
                    // The target, the atom we're looking for, is the one matching the current audio
                    // plus 100 ms. By anticipating it a little bit, it feels more natural, otherwise it
                    // feels like the highlighting is trailing the audio.
                    var target = global.readAloudAudio.currentTime * 1000 + 100;
                    // Find the smallest element which is bigger than the target time
                    for (var _i = 0, _a = global.readAloudMarks; _i < _a.length; _i++) {
                        var mark = _a[_i];
                        if (mark.time < target)
                            value = mark.value;
                    }
                    if (global.readAloudCurrentMark !== value) {
                        global.readAloudCurrentToken = value;
                        if (value && value === global.readAloudFinalToken)
                            global.readAloudAudio.pause();
                        else {
                            global.readAloudCurrentMark = value;
                            highlightAtomID(global.readAloudElement, global.readAloudCurrentMark);
                        }
                    }
                });
            }
            else
                global.readAloudAudio.pause();
            global.readAloudAudio.src = url;
            global.readAloudStatus = 'playing';
            document.body.dispatchEvent(new Event('read-aloud-status-change', {
                bubbles: true,
                composed: true
            }));
            global.readAloudAudio.play();
        });
    });
}
exports.defaultReadAloudHook = defaultReadAloudHook;
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
 */
function readAloudStatus() {
    if (!(0, capabilities_1.isBrowser)())
        return 'unavailable';
    var audio = (0, mathlive_1.globalMathLive)().readAloudAudio;
    if (!audio)
        return 'ready';
    if (audio.paused)
        return 'paused';
    if (!audio.ended)
        return 'playing';
    return 'ready';
}
exports.readAloudStatus = readAloudStatus;
/**
 * Pauses a read aloud operation if one is in progress.
 *
 * **See** {@linkcode speak}
 */
function pauseReadAloud() {
    if (!(0, capabilities_1.isBrowser)())
        return;
    var audio = (0, mathlive_1.globalMathLive)().readAloudAudio;
    if (audio) {
        (0, mathlive_1.globalMathLive)().readAloudStatus = 'paused';
        document.body.dispatchEvent(new Event('read-aloud-status-change', {
            bubbles: true,
            composed: true
        }));
        audio.pause();
    }
}
exports.pauseReadAloud = pauseReadAloud;
/**
 * Resumes a read aloud operation if one was paused.
 *
 * **See** {@linkcode speak}
 */
function resumeReadAloud() {
    if (!(0, capabilities_1.isBrowser)())
        return;
    var audio = (0, mathlive_1.globalMathLive)().readAloudAudio;
    if (audio) {
        (0, mathlive_1.globalMathLive)().readAloudStatus = 'playing';
        document.body.dispatchEvent(new Event('read-aloud-status-change', {
            bubbles: true,
            composed: true
        }));
        audio.play();
    }
}
exports.resumeReadAloud = resumeReadAloud;
/**
 * If a Read Aloud operation is in progress, read from a specified token
 *
 * **See** {@linkcode speak}
 *
 * @param count The number of tokens to read.
 */
function playReadAloud(token, count) {
    var _a;
    if (!(0, capabilities_1.isBrowser)())
        return;
    var global = (0, mathlive_1.globalMathLive)();
    if (global.readAloudAudio) {
        var timeIndex = 0;
        global.readAloudFinalToken = null;
        if (token) {
            global.readAloudMarks = (_a = global.readAloudMarks) !== null && _a !== void 0 ? _a : [];
            for (var _i = 0, _b = global.readAloudMarks; _i < _b.length; _i++) {
                var mark = _b[_i];
                if (mark.value === token)
                    timeIndex = mark.time / 1000;
            }
            var tokenIndex = global.readAloudTokens.indexOf(token);
            if (tokenIndex >= 0) {
                tokenIndex += count;
                if (tokenIndex < global.readAloudTokens.length)
                    global.readAloudFinalToken = global.readAloudTokens[tokenIndex];
            }
        }
        global.readAloudAudio.currentTime = timeIndex;
        global.readAloudStatus = 'playing';
        document.body.dispatchEvent(new Event('read-aloud-status-change', {
            bubbles: true,
            composed: true
        }));
        global.readAloudAudio.play();
    }
}
exports.playReadAloud = playReadAloud;
