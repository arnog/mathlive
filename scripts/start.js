#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const { context } = require('esbuild');
const less = require('@arnog/esbuild-plugin-less');

// Copy and watch the smoke test file
context({
  entryPoints: [
    './test/style.css',
    './test/smoke/index.html',
    './test/virtual-keyboard/index.html',
  ],
  outdir: './dist',
  loader: {
    '.html': 'copy',
    '.css': 'copy',
  },
}).then((ctx) => ctx.watch());

// Build and serve the library
context({
  entryPoints: ['./src/mathlive.ts'],
  outfile: './dist/mathlive.mjs',
  format: 'esm',
  bundle: true,
  plugins: [less()],
  loader: {
    '.ts': 'ts',
  },
  sourcemap: true,
  sourceRoot: '../src',
  sourcesContent: false,
}).then((ctx) =>
  ctx.serve({ host: '127.0.0.1', servedir: '.' }).then(({ host, port }) => {
    if (host === '0.0.0.0') host = 'localhost';
    console.log(
      ` 🚀 Server ready \u001b[1;35m http://${host}:${port}/dist/\u001b[0m`
    );
  })
);
