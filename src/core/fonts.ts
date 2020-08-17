import { ErrorListener, MathfieldErrorCode } from '../public/core';

// The URL of the bundled MathLive library. Used later to locate the `fonts`
// directory, relative to the library

// If loaded via a <script> tag, `document.currentScript.src` is this location
// If loaded via a module (e.g. `import ...`),`import.meta.url` is this location.
// However, `import.meta` is not supported by WebPack. So, use a super-hacky-alternative
// to get the URL.
// See https://github.com/webpack/webpack/issues/6719

// Adapted from https://jakedeichert.com/blog/2020/02/a-super-hacky-alternative-to-import-meta-url/
function getFileUrl() {
    const stackTraceFrames = String(new Error().stack)
        .replace(/^Error.*\n/, '')
        .split('\n');

    if (stackTraceFrames.length === 0) return '';

    // 0 = this getFileUrl frame (because the Error is created here)
    // 1 = the caller of getFileUrl (the file path we want to grab)
    const callerFrame = stackTraceFrames[0];

    // Extract the script's complete url
    const m = callerFrame.match(/http.*js/);
    if (!m) return '';
    return m[0];
}

const gScriptUrl =
    (document.currentScript as HTMLScriptElement)?.src ?? getFileUrl();

export async function loadFonts(
    fontsDirectory?: string,
    onError?: ErrorListener<MathfieldErrorCode>
): Promise<void> {
    function makeFontFace(
        name: string,
        source: string,
        descriptors: { [key: string]: string } = {}
    ): FontFace {
        return new FontFace(
            name,
            `url(${source}.woff2) format('woff2'), url(${source}.woff) format('woff')`,
            descriptors
        );
    }

    // If the "mathlive-fonts.css" stylesheet is included in the <head> of the
    // page, it will include a `--ML__static-fonts` variable.
    // In that case, don't load the fonts dynamically
    const useStaticFonts =
        getComputedStyle(document.documentElement).getPropertyValue(
            '--ML__static-fonts'
        ) ?? false;

    if (useStaticFonts) return;

    if ('fonts' in document) {
        const fontFamilies = [
            'KaTeX_Main',
            'KaTeX_Math',
            'KaTeX_AMS',
            'KaTeX_Caligraphic',
            'KaTeX_Fraktur',
            'KaTeX_SansSerif',
            'KaTeX_Script',
            'KaTeX_Size1',
            'KaTeX_Size2',
            'KaTeX_Size3',
            'KaTeX_Size4',
        ];
        // for (const fontFace of document.fonts.values()) { console.log(fontFace.family)}
        let fontsLoaded = false;

        // Firefox returns true for fonts that are not loaded...
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1252821 🤦‍♂️
        // So, if on Firefox, always assume that the fonts are not loaded.
        if (!/firefox/i.test(navigator.userAgent)) {
            try {
                fontsLoaded = fontFamilies.every((x) =>
                    document['fonts'].check('16px ' + x)
                );
            } catch (e) {
                fontsLoaded = false;
            }
        }

        if (!fontsLoaded) {
            if (document.body.classList.contains('ML__fonts-loading')) {
                return;
            }
            document.body.classList.add('ML__fonts-loading');

            // Locate the `fonts` folder relative to the script URL
            const fontsFolder = new URL(
                fontsDirectory ?? './fonts',
                gScriptUrl
            ).toString();
            const fonts: FontFace[] = ([
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
                ['KaTeX_SansSerif-Regular', { style: 'italic' }],
                ['KaTeX_SansSerif-Bold', { weight: 'bold' }],
                ['KaTeX_SansSerif-Italic', { style: 'italic' }],
                ['KaTeX_Script-Regular'],
                ['KaTeX_Typewriter-Regular'],
                ['KaTeX_Size1-Regular'],
                ['KaTeX_Size2-Regular'],
                ['KaTeX_Size3-Regular'],
                ['KaTeX_Size4-Regular'],
            ] as [string, { [key: string]: string }][]).map((x) =>
                makeFontFace(
                    x[0].replace(/-[a-zA-Z]+$/, ''),
                    fontsFolder + '/' + x[0],
                    x[1]
                )
            );
            try {
                const loadedFonts = ((await Promise.all(
                    fonts.map((x) => {
                        try {
                            return x.load();
                        } catch (e) {
                            if (typeof onError === 'function') {
                                onError({
                                    code: 'font-not-found',
                                    arg: e,
                                });
                            }
                        }
                        return undefined;
                    })
                )) as unknown) as FontFace[];
                // Render them at the same time
                loadedFonts.forEach((font) => document['fonts'].add(font));
                document.body.classList.remove('ML__fonts-loading');
            } catch (err) {
                console.error(err);
            }
        }
    }
}
