import { gScriptUrl } from '../common/script-url';
import { ErrorListener, MathfieldErrorCode } from '../public/core';

// The URL of the bundled MathLive library. Used later to locate the `fonts`
// directory, relative to the library

// If loaded via a <script> tag, `document.currentScript.src` is this location
// If loaded via a module (e.g. `import ...`),`import.meta.url` is this location.
// However, `import.meta` is not supported by WebPack. So, use a super-hacky-alternative
// to get the URL.
// See https://github.com/webpack/webpack/issues/6719

export async function loadFonts(
  fontsDirectory?: string,
  onError?: ErrorListener<MathfieldErrorCode>
): Promise<void> {
  function makeFontFace(
    name: string,
    source: string,
    descriptors: Record<string, string> = {}
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
    // For (const fontFace of document.fonts.values()) { console.log(fontFace.family)}
    let fontsLoaded = false;

    // Firefox returns true for fonts that are not loaded...
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1252821 🤦‍♂️
    // So, if on Firefox, always assume that the fonts are not loaded.
    if (!/firefox/i.test(navigator.userAgent)) {
      try {
        fontsLoaded = fontFamilies.every((x) =>
          document.fonts.check('16px ' + x)
        );
      } catch {
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
      ] as [string, Record<string, string>][]).map((x) =>
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
            } catch (error: unknown) {
              if (typeof onError === 'function') {
                onError({
                  code: 'font-not-found',
                  arg: error as string,
                });
              }
            }

            return undefined;
          })
        )) as unknown) as FontFace[];
        // Render them at the same time
        loadedFonts.forEach((font) => document.fonts.add(font));
      } catch (error: unknown) {
        console.error(error);
      }

      // Event if an error occur, give up and pretend the fonts are
      // loaded (displayign somehting is better than nothing)
      document.body.classList.remove('ML__fonts-loading');
    }
  }
}
