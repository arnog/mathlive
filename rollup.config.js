import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";

// Note: Due to https://github.com/TrySound/rollup-plugin-terser/issues/5
// splits into multiple configs instead of multiple outputs
export default [{
  input: 'src/mathlive.js',
  plugins: [terser({
      sourcemap: false,
      compress: {
          drop_console: true,
          drop_debugger: true,
          ecma: 6,
          module: true,
          warnings: true
      }
    }),
        copy({
            "css/fonts": "dist/fonts",
            // verbose: true
        })
  ],
  output:
    {
        // JavaScript native module
      file: 'dist/mathlive.mjs',
      format: 'es'
    }
},
{
  input: 'src/mathlive.js',
  plugins: [terser({
        sourcemap: false,
        compress: {
        drop_console: true,
        drop_debugger: true,
        ecma: 6,
        module: true,
        warnings: true
      }
    })
  ],
  output:
    {
        // UMD file, suitable for <script>, require(), etc...
      file: 'dist/mathlive.js',
      format: 'umd',
      name: 'MathLive'
    }
}];
