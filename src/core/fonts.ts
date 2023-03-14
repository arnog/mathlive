import { resolveUrl } from '../common/script-url';

function makeFontFace(
  name: string,
  source: string,
  descriptors: Record<string, string> = {}
): FontFace {
  return new FontFace(
    name,
    `url(${source}.woff2) format('woff2')`,
    descriptors
  );
}

export let gFontsState: 'error' | 'not-loaded' | 'loading' | 'ready' =
  'not-loaded';

export async function loadFonts(): Promise<void> {
  // If we're already loading the fonts, we're done.
  if (gFontsState !== 'not-loaded') return;
  gFontsState = 'loading';

  // If the "mathlive-fonts.css" stylesheet is included in the <head> of the
  // page, it will include a `--ML__static-fonts` variable.
  // In that case, don't load the fonts dynamically
  const useStaticFonts =
    getComputedStyle(document.documentElement).getPropertyValue(
      '--ML__static-fonts'
    ) ?? false;

  if (useStaticFonts) {
    gFontsState = 'ready';
    return;
  }

  document.body.classList.remove('ML__fonts-did-not-load');

  if ('fonts' in document) {
    const fontFamilies = [
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

    const fontsInDocument = Array.from(document.fonts).map((f) => f.family);
    if (fontFamilies.every((x) => fontsInDocument.includes(x))) {
      gFontsState = 'ready';
      return;
    }

    // Locate the `fonts` folder relative to the script URL
    const fontsFolder = await resolveUrl(
      window.MathfieldElement.fontsDirectory ?? './fonts'
    );
    if (!fontsFolder) {
      document.body.classList.add('ML__fonts-did-not-load');
      gFontsState = 'error';
      return;
    }

    const fonts: FontFace[] = (
      [
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
      ] as [string, Record<string, string>][]
    ).map((x) =>
      makeFontFace(
        x[0].replace(/-[a-zA-Z]+$/, ''),
        fontsFolder + '/' + x[0],
        x[1]
      )
    );
    try {
      const loadedFonts = (await Promise.all(
        fonts.map((x) => {
          try {
            return x.load();
          } catch {}

          return undefined;
        })
      )) as unknown as FontFace[];
      // Render them at the same time
      loadedFonts.forEach((font) => document.fonts.add(font));
      gFontsState = 'ready';
      return;
    } catch (error: unknown) {
      console.error(
        `MathLive: The math fonts could not be loaded from "${fontsFolder}"`,
        { cause: error }
      );
      document.body.classList.add('ML__fonts-did-not-load');
    }

    // If an error occurs, give up
    gFontsState = 'error';
  }
}
