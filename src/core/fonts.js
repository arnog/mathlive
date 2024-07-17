"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.loadFonts = exports.reloadFonts = exports.gFontsState = void 0;
var script_url_1 = require("../common/script-url");
function makeFontFace(name, source, descriptors) {
    if (descriptors === void 0) { descriptors = {}; }
    return new FontFace(name, "url(".concat(source, ".woff2) format('woff2')"), descriptors);
}
exports.gFontsState = 'not-loaded';
function reloadFonts() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            exports.gFontsState = 'not-loaded';
            return [2 /*return*/, loadFonts()];
        });
    });
}
exports.reloadFonts = reloadFonts;
function loadFonts() {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var useStaticFonts, fontFamilies, fontsInDocument_1, fontsFolder_1, fonts, loadedFonts, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // If we're already loading the fonts, we're done.
                    if (exports.gFontsState !== 'not-loaded')
                        return [2 /*return*/];
                    exports.gFontsState = 'loading';
                    useStaticFonts = (_a = getComputedStyle(document.documentElement).getPropertyValue('--ML__static-fonts')) !== null && _a !== void 0 ? _a : false;
                    if (useStaticFonts) {
                        exports.gFontsState = 'ready';
                        return [2 /*return*/];
                    }
                    document.body.classList.remove('ML__fonts-did-not-load');
                    if (!('fonts' in document)) return [3 /*break*/, 6];
                    fontFamilies = [
                        'KaTeX_Main',
                        'KaTeX_Math',
                        'KaTeX_AMS',
                        'KaTeX_Caligraphic',
                        'KaTeX_Fraktur',
                        'KaTeX_SansSerif',
                        'KaTeX_Script',
                        'KaTeX_Typewriter',
                        'KaTeX_Size1',
                        'KaTeX_Size2',
                        'KaTeX_Size3',
                        'KaTeX_Size4',
                    ];
                    fontsInDocument_1 = Array.from(document.fonts).map(function (f) { return f.family; });
                    if (fontFamilies.every(function (x) { return fontsInDocument_1.includes(x); })) {
                        exports.gFontsState = 'ready';
                        return [2 /*return*/];
                    }
                    if (!globalThis.MathfieldElement.fontsDirectory) {
                        exports.gFontsState = 'not-loaded';
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, script_url_1.resolveUrl)(globalThis.MathfieldElement.fontsDirectory)];
                case 1:
                    fontsFolder_1 = _b.sent();
                    if (!fontsFolder_1) {
                        document.body.classList.add('ML__fonts-did-not-load');
                        exports.gFontsState = 'error';
                        return [2 /*return*/];
                    }
                    fonts = [
                        ['KaTeX_Main-Regular'],
                        ['KaTeX_Main-BoldItalic', { style: 'italic', weight: 'bold' }],
                        ['KaTeX_Main-Bold', { weight: 'bold' }],
                        ['KaTeX_Main-Italic', { style: 'italic' }],
                        ['KaTeX_Math-Italic', { style: 'italic' }],
                        ['KaTeX_Math-BoldItalic', { style: 'italic', weight: 'bold' }],
                        ['KaTeX_AMS-Regular'],
                        ['KaTeX_Caligraphic-Regular'],
                        ['KaTeX_Caligraphic-Bold', { weight: 'bold' }],
                        ['KaTeX_Fraktur-Regular'],
                        ['KaTeX_Fraktur-Bold', { weight: 'bold' }],
                        ['KaTeX_SansSerif-Regular'],
                        ['KaTeX_SansSerif-Bold', { weight: 'bold' }],
                        ['KaTeX_SansSerif-Italic', { style: 'italic' }],
                        ['KaTeX_Script-Regular'],
                        ['KaTeX_Typewriter-Regular'],
                        ['KaTeX_Size1-Regular'],
                        ['KaTeX_Size2-Regular'],
                        ['KaTeX_Size3-Regular'],
                        ['KaTeX_Size4-Regular'],
                    ].map(function (x) {
                        return makeFontFace(x[0].replace(/-[a-zA-Z]+$/, ''), "".concat(fontsFolder_1, "/").concat(x[0]), x[1]);
                    });
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, Promise.all(fonts.map(function (x) {
                            try {
                                return x.load();
                            }
                            catch (_a) { }
                            return undefined;
                        }))];
                case 3:
                    loadedFonts = (_b.sent());
                    // Render them at the same time
                    loadedFonts.forEach(function (font) { return document.fonts.add(font); });
                    exports.gFontsState = 'ready';
                    return [2 /*return*/];
                case 4:
                    error_1 = _b.sent();
                    console.error("MathLive {{SDK_VERSION}}: The math fonts could not be loaded from \"".concat(fontsFolder_1, "\""), { cause: error_1 });
                    document.body.classList.add('ML__fonts-did-not-load');
                    return [3 /*break*/, 5];
                case 5:
                    // If an error occurs, give up
                    exports.gFontsState = 'error';
                    _b.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.loadFonts = loadFonts;
