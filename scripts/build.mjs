#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

import { build } from 'esbuild';
import less from '@arnog/esbuild-plugin-less';

import pkg from '../package.json' assert { type: 'json' };

process.env.BUILD = process.env.BUILD || 'development';
const PRODUCTION = process.env.BUILD.toLowerCase() === 'production';
const SDK_VERSION = pkg.version || 'v?.?.?';

function preamble() {
  return `/** MathLive ${SDK_VERSION} ${
    process.env.GIT_VERSION ? ' -- ' + process.env.GIT_VERSION : ''
  }*/`;
}

const BUILD_OPTIONS = {
  banner: { js: preamble() },
  bundle: true,
  define: {
    ENV: JSON.stringify(process.env.BUILD),
    SDK_VERSION: JSON.stringify(SDK_VERSION),
    GIT_VERSION: JSON.stringify(process.env.GIT_VERSION || '?.?.?'),
  },
  drop: ['debugger', 'console'],
  plugins: [less({ compress: true })],
  loader: { '.ts': 'ts' },
  sourcemap: !PRODUCTION,
  sourceRoot: '../src',
  sourcesContent: false,
  target: ['es2017'],
  external: ['@cortex-js/compute-engine'],
};

// Build and serve the library
build({
  ...BUILD_OPTIONS,
  entryPoints: ['./src/mathlive.ts'],
  outfile: './dist/mathlive.mjs',
  format: 'esm',
});

build({
  ...BUILD_OPTIONS,
  entryPoints: ['./src/mathlive.ts'],
  outfile: './dist/mathlive.js',
  format: 'iife',
  globalName: 'MathLive',
});

build({
  ...BUILD_OPTIONS,
  entryPoints: ['./src/mathlive.ts'],
  outfile: './dist/mathlive.min.mjs',
  format: 'esm',
  minify: true,
});

build({
  ...BUILD_OPTIONS,
  entryPoints: ['./src/mathlive.ts'],
  outfile: './dist/mathlive.min.js',
  format: 'iife',
  globalName: 'MathLive',
  minify: true,
});

build({
  ...BUILD_OPTIONS,
  entryPoints: ['./src/public/mathlive-ssr.ts'],
  outfile: './dist/mathlive-ssr.min.mjs',
  format: 'esm',
  minify: true,
});

build({
  ...BUILD_OPTIONS,
  entryPoints: ['./src/vue-mathlive.js'],
  outfile: './dist/vue-mathlive.mjs',
  format: 'esm',
  minify: true,
});
