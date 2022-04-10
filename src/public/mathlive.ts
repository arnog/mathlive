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

import { Mathfield } from './mathfield';
import { MathfieldElement } from './mathfield-element';
import { MacroDictionary, Registers } from './core';

export * from './options';

export { Mathfield };
export { MathfieldElement };
