/**
 *
 * Use MathLive to render and edit mathematical formulas.
 *
 *
 * Read {@tutorial mathfield-getting-started | Getting Started} for more info.
 *
 * @example
 * <script type="module">
 * // Load the `Mathlive` module from a CDN
 * import { convertLatexToSpeakableText } from 'https://unpkg.com/mathlive?module';
 *
 * console.log(convertLatexToSpeakableText('e^{i\\pi}+1=0'));
 * </script>
 *
 * @packageDocumentation MathLive SDK Reference {{SDK_VERSION}}
 * @version {{SDK_VERSION}}
 *
 */

import {
  MacroDictionary,
  Registers,
  ErrorListener,
  ParserErrorCode,
  MathfieldErrorCode,
} from './core';
import {
  RemoteVirtualKeyboardOptions,
  TextToSpeechOptions,
  AutoRenderOptions,
} from './options';

export * from './commands';
export * from './core';
export * from './options';
export * from './mathfield';
export * from './mathfield-element';

export declare function makeSharedVirtualKeyboard(
  options?: Partial<RemoteVirtualKeyboardOptions>
): void;

export declare function convertLatexToMarkup(
  text: string,
  options?: {
    mathstyle?: 'displaystyle' | 'textstyle';
    letterShapeStyle?: 'tex' | 'french' | 'iso' | 'upright' | 'auto';
    macros?: MacroDictionary;
    registers?: Registers;
    colorMap?: (name: string) => string | undefined;
    backgroundColorMap?: (name: string) => string | undefined;
    onError?: ErrorListener<ParserErrorCode>;
    format?: string;
  }
): string;

export declare function convertLatexToMathMl(
  latex: string,
  options?: Partial<{
    macros: MacroDictionary;
    registers?: Registers;
    colorMap?: (name: string) => string | undefined;
    backgroundColorMap?: (name: string) => string | undefined;
    onError: ErrorListener<ParserErrorCode>;
    generateID: boolean;
  }>
): string;

export declare function convertLatexToSpeakableText(
  latex: string,
  options?: Partial<
    TextToSpeechOptions & {
      macros?: MacroDictionary;
      registers?: Registers;
      colorMap?: (name: string) => string | undefined;
      backgroundColorMap?: (name: string) => string | undefined;
      onError?: ErrorListener<ParserErrorCode | MathfieldErrorCode>;
    }
  >
): string;

export declare function renderMathInDocument(options?: AutoRenderOptions): void;

export declare function renderMathInElement(
  element: string | HTMLElement,
  options?: AutoRenderOptions
): void;

export declare const version: {
  mathlive: string;
  computeEngine: string;
};
