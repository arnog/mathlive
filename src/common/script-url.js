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
var _a, _b;
exports.__esModule = true;
exports.resolveUrl = void 0;
// Adapted from https://jakedeichert.com/blog/2020/02/a-super-hacky-alternative-to-import-meta-url/
function getFileUrl() {
    var stackTraceFrames = String(new Error().stack)
        .replace(/^Error.*\n/, '')
        .split('\n');
    if (stackTraceFrames.length === 0) {
        console.error("Can't use relative paths to specify assets location because the source" +
            'file location could not be determined (unexpected stack trace format' +
            " \"".concat(new Error().stack, "\")."));
        return '';
    }
    // 0 = this getFileUrl frame (because the Error is created here)
    // 1 = the caller of getFileUrl (the file path we want to grab)
    var callerFrame = stackTraceFrames[1];
    // Extract the script's complete url
    var m = callerFrame.match(/http.*\.ts[\?:]/);
    if (m) {
        // This is a Typescript file, therefore there's a source map that's
        // remapping to the source file. Use an entry further in the stack trace.
        callerFrame = stackTraceFrames[2];
    }
    m = callerFrame.match(/(https?:.*):[0-9]+:[0-9]+/);
    if (!m) {
        // We might be running under node, in which case we have a file path, not a URL
        m = callerFrame.match(/at (.*(\.ts))[\?:]/);
        if (!m)
            m = callerFrame.match(/at (.*(\.mjs|\.js))[\?:]/);
    }
    if (!m) {
        console.error(stackTraceFrames);
        console.error("Can't use relative paths to specify assets location because the source " +
            'file location could not be determined ' +
            "(unexpected location \"".concat(callerFrame, "\")."));
        return '';
    }
    return m[1];
}
// When using a CDN, there might be some indirections (i.e. to deal
// with version numbers) before finding the actual location of the library.
// When resolving relative (to find fonts/sounds), we need to have the resolved
// URL
var gResolvedScriptUrl = null;
// The URL of the bundled MathLive library. Used later to locate the `fonts`
// directory, relative to the library
// If loaded via a <script> tag, `document.currentScript.src` is this location
// If loaded via a module (e.g. `import ...`),`import.meta.url` is this location.
// However, `import.meta` is not supported by WebPack. So, use a
// super-hacky-alternative to get the URL.
// See https://github.com/webpack/webpack/issues/6719
// Note that in some circumstances, document.currentScript.src can be ""
// (the empty string). Therefore, use the "||" operator rather than "??"
// to properly apply the alternative value in this case.
var gScriptUrl = ((_b = (_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.document) === null || _a === void 0 ? void 0 : _a.currentScript) === null || _b === void 0 ? void 0 : _b.src) ||
    getFileUrl();
function resolveUrl(url) {
    return __awaiter(this, void 0, void 0, function () {
        var response, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Is  it an absolute URL?
                    if (/^(?:[a-z+]+:)?\/\//i.test(url)) {
                        try {
                            return [2 /*return*/, new URL(url).href];
                        }
                        catch (e) { }
                        if (url.startsWith('//')) {
                            // Add the protocol
                            try {
                                return [2 /*return*/, new URL("".concat(window.location.protocol).concat(url)).href];
                            }
                            catch (e) { }
                        }
                        return [2 /*return*/, url];
                    }
                    if (!(gResolvedScriptUrl === null)) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch(gScriptUrl, { method: 'HEAD' })];
                case 2:
                    response = _a.sent();
                    if (response.status === 200)
                        gResolvedScriptUrl = response.url;
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    console.error("Invalid URL \"".concat(url, "\" (relative to \"").concat(gScriptUrl, "\")"));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, new URL(url, gResolvedScriptUrl !== null && gResolvedScriptUrl !== void 0 ? gResolvedScriptUrl : gScriptUrl).href];
            }
        });
    });
}
exports.resolveUrl = resolveUrl;
