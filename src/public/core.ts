export type ParseMode = 'math' | 'text' | 'command';

/**
 * Variants can map either to math characters in specific Unicode range
 * (see https://en.wikipedia.org/wiki/Mathematical_Alphanumeric_Symbols)
 * e.g. 𝒜, 𝔄, 𝖠, 𝙰, 𝔸, A, 𝐴
 * or to some built-in fonts (e.g. 'SansSerif-Regular').
 *
 * 'normal' is a synthetic variant that maps either to 'main' (roman) or
 * 'math' (italic) depending on the symbol and the letterShapeStyle.
 */
export type Variant =
    | 'ams'
    | 'double-struck'
    | 'calligraphic'
    | 'script'
    | 'fraktur'
    | 'sans-serif'
    | 'monospace'
    | 'normal' // 'main' (upright) or 'math' (italic) depending on letterShapeStyle
    | 'main'
    | 'math';
export type VariantStyle = 'up' | 'bold' | 'italic' | 'bolditalic' | '';

export type FontShape = 'auto' | 'n' | 'it' | 'sl' | 'sc' | '';

export type FontSeries = 'auto' | 'm' | 'b' | 'l' | '';

export interface Style {
    mode?: ParseMode | string;
    color?: string;
    backgroundColor?: string;
    variant?: Variant;
    variantStyle?: VariantStyle;
    fontFamily?: string;
    fontShape?: FontShape;
    fontSeries?: FontSeries;
    fontSize?: string;
    cssId?: string;
    cssClass?: string;
    letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
}

export type MacroDefinition = { def: string; args?: number };

export type MacroDictionary = { [name: string]: string | MacroDefinition };
