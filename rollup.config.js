import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';

import pkg from './package.json';
import path from 'path';
import chalk from 'chalk';

process.env.BUILD = process.env.BUILD || 'development';
const PRODUCTION = process.env.BUILD.toLowerCase() === 'production';
const BUILD_ID =
  Date.now().toString(36).slice(-2) +
  Math.floor(Math.random() * 0x186a0).toString(36);
const BUILD_DIRECTORY = 'dist';

const TYPESCRIPT_OPTIONS = {
  clean: PRODUCTION,
  // typescript: require('typescript'),
  // verbosity: 3,
  include: ['*.ts+(|x)', '**/*.ts+(|x)', '*.js+(|x)', '**/*.js+(|x)'],
};

const SDK_VERSION = pkg.version || 'v?.?.?';

function preamble() {
  return `/** MathLive ${SDK_VERSION} ${
    process.env.GIT_VERSION ? ' -- ' + process.env.GIT_VERSION : ''
  }*/`;
}

const TERSER_OPTIONS = {
  ecma: 2017, // Use "5" to support older browsers
  compress: {
    drop_console: true,
    drop_debugger: true,
    global_defs: {
      ENV: JSON.stringify(process.env.BUILD),
      SDK_VERSION: SDK_VERSION,
      BUILD_ID: JSON.stringify(BUILD_ID),
      GIT_VERSION: process.env.GIT_VERSION || '?.?.?',
    },
    module: true,
    passes: 4,
    warnings: true,
  },
  format: {
    ascii_only: true, // The project has some characters (”) which can
    // confuse Safari when the charset is not set to UTF-8 on the page.
    // This workaround that.
    comments: false,
    preamble: preamble(),
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

function basename() {
  return '\u001b[40m MathLive \u001b[0;0m ';
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

      clearLine();
      if (process.stdout.isTTY) {
        process.stdout.write(
          basename() + chalk.green(' 羽') + ' Building ' + chalk.grey(file)
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

const ROLLUP = [];
export default ROLLUP;

// MathLive main module
ROLLUP.push({
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
      banner: preamble(),
    },
    // UMD file, suitable for import, <script> and require()
    {
      format: 'umd',
      name: 'MathLive',
      file: `${BUILD_DIRECTORY}/mathlive.js`,
      sourcemap: !PRODUCTION,
      exports: 'named',
      banner: preamble(),
    },
  ],
});

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
        banner: preamble(),
      },
      // UMD file, suitable for import, <script> and require()
      {
        format: 'umd',
        name: 'MathLive',
        file: `${BUILD_DIRECTORY}/mathlive.min.js`,
        sourcemap: false,
        banner: preamble(),
      },
    ],
  });
}
