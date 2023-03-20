#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

import { build } from 'esbuild';
import less from '@arnog/esbuild-plugin-less';

import pkg from '../package.json' assert { type: 'json' };

process.env.BUILD = process.env.BUILD || 'development';
const PRODUCTION = process.env.BUILD.toLowerCase() === 'production';
const SDK_VERSION = pkg.version || 'v?.?.?';

// UMD wrapper
// (while iife works for `<script>` loading, sadly, some environemnts use
// `require()` which needs the UMD wrapper. See #1833)
const UMD_OPTIONS = {
  banner: {
    js: `/** MathLive ${SDK_VERSION} ${
      process.env.GIT_VERSION ? ' -- ' + process.env.GIT_VERSION : ''
    }*/
    (function(global,factory){typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'],factory):(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MathLive = {}));})(this, (function (exports) { 'use strict';`,
  },
  footer: {
    js: `Object.assign(exports, MathLive); Object.defineProperty(exports, '__esModule', { value: true });}));`,
  },
};

const BUILD_OPTIONS = {
  banner: {
    js: `/** MathLive ${SDK_VERSION} ${
      process.env.GIT_VERSION ? ' -- ' + process.env.GIT_VERSION : ''
    }*/`,
  },
  bundle: true,
  define: {
    ENV: JSON.stringify(process.env.BUILD),
    SDK_VERSION: JSON.stringify(SDK_VERSION),
    GIT_VERSION: JSON.stringify(process.env.GIT_VERSION || '?.?.?'),
  },
  plugins: [less()],
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
  ...UMD_OPTIONS,
  globalName: 'MathLive',
});

build({
  ...BUILD_OPTIONS,
  drop: ['debugger'],
  pure: ['console.assert', 'console.log'],
  entryPoints: ['./src/mathlive.ts'],
  outfile: './dist/mathlive.min.mjs',
  format: 'esm',
  minify: true,
});

build({
  ...BUILD_OPTIONS,
  entryPoints: ['./src/mathlive.ts'],
  drop: ['debugger'],
  pure: ['console.assert', 'console.log'],
  outfile: './dist/mathlive.min.js',
  format: 'iife',
  ...UMD_OPTIONS,
  globalName: 'MathLive',
  minify: true,
});

build({
  ...BUILD_OPTIONS,
  entryPoints: ['./src/public/mathlive-ssr.ts'],
  drop: ['debugger'],
  pure: ['console.assert', 'console.log'],
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
