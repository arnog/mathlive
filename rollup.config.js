import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
// import { eslint } from 'rollup-plugin-eslint';
import postcss from 'rollup-plugin-postcss';

import pkg from './package.json';
import path from 'path';
import chalk from 'chalk';

process.env.BUILD = process.env.BUILD || 'development';
const PRODUCTION = process.env.BUILD === 'production';
const BUILD_ID =
  Date.now().toString(36).slice(-2) +
  Math.floor(Math.random() * 0x186a0).toString(36);
const BUILD_DIRECTORY = 'dist';

const TYPESCRIPT_OPTIONS = {
  // typescript: require('typescript'),
  // clean: PRODUCTION,
  // verbosity: 3,
  include: ['*.ts+(|x)', '**/*.ts+(|x)', '*.js+(|x)', '**/*.js+(|x)'],
};

const SDK_VERSION = pkg.version || 'v?.?.?';

const TERSER_OPTIONS = {
  compress: {
    drop_console: true,
    drop_debugger: true,
    ecma: 8, // Use "5" to support older browsers
    module: true,
    warnings: true,
    passes: 4,
    global_defs: {
      ENV: JSON.stringify(process.env.BUILD),
      SDK_VERSION: SDK_VERSION,
      BUILD_ID: JSON.stringify(BUILD_ID),
      GIT_VERSION: process.env.GIT_VERSION || '?.?.?',
    },
  },
  output: {
    preamble: '/* MathLive ' + SDK_VERSION + '  */',
    ascii_only: true, // The project has some characters (”) which can
    // confuse Safari when the charset is not set to UTF-8 on the page.
    // This workaround that.
  },
};

function normalizePath(id) {
  return path.relative(process.cwd(), id).split(path.sep).join('/');
}

function clearLine() {
  if (process.stdout.isTTY && typeof process.stdout.clearLine === 'function') {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
  }
}

// Rollup plugin to display build progress and launch server
function buildProgress() {
  return {
    name: 'rollup.config.js',
    transform(_code, id) {
      const file = normalizePath(id);
      if (file.includes(':')) {
        return;
      }

      if (
        process.stdout.isTTY &&
        typeof process.stdout.clearLine === 'function'
      ) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(
          chalk.green(' ●') + '  Building ' + chalk.grey(file)
        );
      } else {
        console.log(chalk.grey(file));
      }
    },
    buildEnd() {
      clearLine();
    },
  };
}

const ROLLUP = [
  // MathLive main module
  {
    onwarn(warning, warn) {
      // The use of #private class variables seem to trigger this warning.
      if (warning.code === 'THIS_IS_UNDEFINED') return;
      warn(warning);
    },
    input: 'src/mathlive.ts',
    plugins: [
      buildProgress(),
      // PRODUCTION && eslint({ exclude: ['**/*.less'] }),
      postcss({
        extract: false, // extract: path.resolve('dist/mathlive.css')
        modules: false,
        inject: false,
        extensions: ['.css', '.less'],
        plugins: [],
        minimize: PRODUCTION,
      }),
      resolve(),
      typescript(TYPESCRIPT_OPTIONS),
    ],
    output: [
      // JavaScript native module
      // (stricly speaking not necessary, since the UMD output is module
      // compatible, but this gives us a "clean" module)
      {
        format: 'es',
        file: `${BUILD_DIRECTORY}/mathlive.mjs`,
        sourcemap: !PRODUCTION,
        exports: 'named',
      },
      // UMD file, suitable for import, <script> and require()
      {
        format: 'umd',
        name: 'MathLive',
        file: `${BUILD_DIRECTORY}/mathlive.js`,
        sourcemap: !PRODUCTION,
        exports: 'named',
      },
    ],
  },
];

// MathLive Vue-js adapter
ROLLUP.push({
  input: 'src/vue-mathlive.js',
  plugins: [PRODUCTION && terser(TERSER_OPTIONS)],
  output: {
    // JavaScript native module
    sourcemap: !PRODUCTION,
    file: 'dist/vue-mathlive.mjs',
    format: 'es',
  },
});

if (PRODUCTION) {
  // Minified versions
  ROLLUP.push({
    onwarn(warning, warn) {
      // The use of #private class variables seem to trigger this warning.
      if (warning.code === 'THIS_IS_UNDEFINED') return;
      warn(warning);
    },
    input: 'src/mathlive.ts',
    plugins: [
      buildProgress(),
      postcss({
        extract: false, // extract: path.resolve('dist/mathlive.css')
        modules: false,
        inject: false,
        extensions: ['.css', '.less'],
        plugins: [],
        minimize: true,
      }),
      resolve(),
      typescript(TYPESCRIPT_OPTIONS),
      terser(TERSER_OPTIONS),
    ],
    output: [
      // JavaScript native module
      // (stricly speaking not necessary, since the UMD output is module
      // compatible, but this gives us a "clean" module)
      {
        format: 'es',
        file: `${BUILD_DIRECTORY}/mathlive.min.mjs`,
        sourcemap: false,
      },
      // UMD file, suitable for import, <script> and require()
      {
        format: 'umd',
        name: 'MathLive',
        file: `${BUILD_DIRECTORY}/mathlive.min.js`,
        sourcemap: false,
      },
    ],
  });
}

export default ROLLUP;
