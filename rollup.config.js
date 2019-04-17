import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";

export default [{
  input: 'src/mathlive.js',
  plugins: [
    terser({
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
      targets: ["css/fonts"],
      verbose: true
    })
  ],
  output: [
    {
      // JavaScript native module
      sourcemap: false,
      file: 'dist/mathlive.mjs',
      format: 'es',
    },
    {
      // UMD file, suitable for <script>, require(), etc...
      sourcemap: false,
      file: 'dist/mathlive.js',
      format: 'umd',
      name: 'MathLive'
    }
  ]
},
{
  input: 'src/vue-mathlive.js',
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
      // JavaScript native module
      sourcemap: false,
      file: 'dist/vue-mathlive.mjs',
      format: 'es'
    }
}];
