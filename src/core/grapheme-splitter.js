"use strict";
exports.__esModule = true;
exports.splitGraphemes = exports.stringToCodepoints = void 0;
function stringToCodepoints(string) {
    var result = [];
    for (var i = 0; i < string.length; i++) {
        var code = string.charCodeAt(i);
        if (code === 0x0d && string.charCodeAt(i + 1) === 0x0a) {
            code = 0x0a;
            i++;
        }
        if (code === 0x0d || code === 0x0c)
            code = 0x0a;
        if (code === 0x00)
            code = 0xfffd;
        // Decode a surrogate pair into an astral codepoint.
        if (code >= 0xd800 && code <= 0xdbff) {
            var nextCode = string.charCodeAt(i + 1);
            if (nextCode >= 0xdc00 && nextCode <= 0xdfff) {
                var lead = code - 0xd800;
                var trail = nextCode - 0xdc00;
                code = Math.pow(2, 16) + lead * Math.pow(2, 10) + trail;
                // N = ((H - 0xD800) * 0x400) + (L - 0xDC00) + 0x10000;
                i++;
            }
        }
        result.push(code);
    }
    return result;
}
exports.stringToCodepoints = stringToCodepoints;
var ZWJ = 0x200d; // Zero-width joiner
// const ZWSP = 0x200b; // Zero-width space
/* The following codepoints should combine with the previous ones */
var EMOJI_COMBINATOR = [
    [ZWJ, 1],
    [0xfe0e, 2],
    [0x1f3fb, 5],
    [0x1f9b0, 4],
    [0xe0020, 96], // EMOJI_TAG
];
var emojiCombinator;
// Regional indicator: a pair of codepoints indicating some flags
var REGIONAL_INDICATOR = [0x1f1e6, 0x1f1ff];
function isEmojiCombinator(code) {
    var _a;
    if (emojiCombinator === undefined) {
        emojiCombinator = {};
        for (var _i = 0, EMOJI_COMBINATOR_1 = EMOJI_COMBINATOR; _i < EMOJI_COMBINATOR_1.length; _i++) {
            var x = EMOJI_COMBINATOR_1[_i];
            for (var i = x[0]; i <= x[0] + x[1] - 1; i++)
                emojiCombinator[i] = true;
        }
    }
    return (_a = emojiCombinator[code]) !== null && _a !== void 0 ? _a : false;
}
function isRegionalIndicator(code) {
    return code >= REGIONAL_INDICATOR[0] && code <= REGIONAL_INDICATOR[1];
}
/**
 * Return a string or an array of graphemes.
 * This includes:
 * - emoji with skin and hair modifiers
 * - emoji combination (for example "female pilot")
 * - text emoji with an emoji presentation style modifier
 *      - U+1F512 U+FE0E 🔒︎
 *      - U+1F512 U+FE0F 🔒️
 * - flags represented as two regional indicator codepoints
 * - flags represented as a flag emoji + zwj + an emoji tag
 * - other combinations (for example, rainbow flag)
 */
function splitGraphemes(string) {
    // If it's all ASCII, short-circuit the grapheme splitting...
    if (/^[\u0020-\u00FF]*$/.test(string))
        return string;
    var result = [];
    var codePoints = stringToCodepoints(string);
    var index = 0;
    while (index < codePoints.length) {
        var code = codePoints[index++];
        var next = codePoints[index];
        // Combine sequences
        if (next === ZWJ) {
            // Zero-width joiner sequences are:
            // ZWJ_SEQUENCE := (CHAR + ZWJ)+
            var baseIndex = index - 1;
            index += 2;
            while (codePoints[index] === ZWJ)
                index += 2;
            result.push(String.fromCodePoint.apply(String, codePoints.slice(baseIndex, index - baseIndex + 1)));
        }
        else if (isEmojiCombinator(next)) {
            // Combine emoji sequences
            // See http://unicode.org/reports/tr51/#def_emoji_tag_sequence
            var baseIndex = index - 1; // The previous character is the 'base'
            while (isEmojiCombinator(codePoints[index]))
                index += codePoints[index] === ZWJ ? 2 : 1;
            result.push(String.fromCodePoint.apply(String, codePoints.slice(baseIndex, 2 * index - baseIndex - 1)));
        }
        else if (isRegionalIndicator(code)) {
            // Some (but not all) flags are represented by a sequence of two
            // "regional indicators" codepoints.
            index += 1;
            result.push(String.fromCodePoint.apply(String, codePoints.slice(index - 2, 2)));
        }
        else
            result.push(String.fromCodePoint(code));
    }
    return result;
}
exports.splitGraphemes = splitGraphemes;
