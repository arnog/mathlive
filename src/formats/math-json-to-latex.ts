import type { Expression } from '../public/core-types';

let gComputeEngine: any;

/**
 * Convert a MathJSON expression to a LaTeX string.
 *
 * MathLive does not include the Compute Engine. This function uses the
 * Compute Engine that the application loaded in the global scope, for
 * example with `import "https://esm.run/@cortex-js/compute-engine"`. If no
 * Compute Engine is loaded, it logs an error and returns an empty string.
 *
 * This function is private. The static rendering functions use it:
 * `renderMathInElement()` for `<script type="math/json">` tags, and
 * `<math-span>` and `<math-div>` with `format="math-json"`.
 */
export function mathJsonToLatex(json: Expression): string {
  if (!gComputeEngine) {
    const ComputeEngineCtor =
      globalThis[Symbol.for('io.cortexjs.compute-engine')]?.ComputeEngine;

    if (ComputeEngineCtor) gComputeEngine = new ComputeEngineCtor();
    else {
      console.error(
        `MathLive {{SDK_VERSION}}: The CortexJS Compute Engine library is not available.

        Load the library, for example with:

        import "https://esm.run/@cortex-js/compute-engine"`
      );
    }
  }
  return gComputeEngine?.box(json).latex ?? '';
}
