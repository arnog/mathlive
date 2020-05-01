export declare type ParseMode = 'math' | 'text' | 'command';
/**
 * Variants can map either to math characters in specific Unicode range
 * (see https://en.wikipedia.org/wiki/Mathematical_Alphanumeric_Symbols)
 * e.g. 𝒜, 𝔄, 𝖠, 𝙰, 𝔸, A, 𝐴
 * or to some built-in fonts (e.g. 'SansSerif-Regular').
 *
 * 'normal' is a synthetic variant that maps either to 'main' (roman) or
 * 'math' (italic) depending on the symbol and the letterShapeStyle.
 */
export declare type Variant = 'ams' | 'double-struck' | 'calligraphic' | 'script' | 'fraktur' | 'sans-serif' | 'monospace' | 'normal' | 'main' | 'math';
export declare type VariantStyle = 'up' | 'bold' | 'italic' | 'bolditalic' | '';
export declare type FontShape = 'auto' | 'n' | 'it' | 'sl' | 'sc' | '';
export declare type FontSeries = 'auto' | 'm' | 'b' | 'l' | '';
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
export declare type MacroDefinition = {
    def: string;
    args?: number;
};
/**
 * A dictionary of LaTeX macros to be used to interpret and render the content.
 *
 * For example:
```typescript
mf.$setConfig({
    macros: {
        smallfrac: '^{#1}\\!\\!/\\!_{#2}',
    },
});
```
The code above will support the following notation:
```latex
\smallfrac{5}{16}
```
*/
export declare type MacroDictionary = {
    [name: string]: string | MacroDefinition;
};
