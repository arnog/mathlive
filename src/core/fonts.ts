import type { ErrorListener } from '../public/core';

export async function loadFonts(
    fontsDirectory?: string,
    onError?: ErrorListener
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
    if ('fonts' in document) {
        const parentFolder = new URL('.', import.meta['url']).toString();
        const fontsFolder = new URL(
            fontsDirectory ?? './fonts',
            parentFolder
        ).toString();
        const fonts: FontFace[] = ([
            ['KaTeX_Main-Regular', { weight: 'normal' }],
            ['KaTeX_Main-BoldItalic', { style: 'italic', weight: 'bold' }],
            ['KaTeX_Main-Bold', { weight: 'bold' }],
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
        // for (const fontFace of document.fonts.values()) { console.log(fontFace.family)}
        let fontsLoaded = false;
        try {
            fontsLoaded = fonts.every((font) =>
                document['fonts'].check(font.family)
            );
        } catch (e) {
            fontsLoaded = false;
        }
        if (!fontsLoaded) {
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
            } catch (e) {
                console.log(e);
            }
        }
    }
}
