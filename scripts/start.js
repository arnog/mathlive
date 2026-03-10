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
    './test/mathfield-states/index.html',
    './test/prompts/index.html',
    './test/playwright-test-page/index.html',
    './test/playwright-test-page/iframe_test.html',
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
}).then(async (ctx) => {
  const startPort = 9029;
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { host: h, port } = await ctx.serve({
        host: '127.0.0.1',
        port: startPort + i,
        servedir: '.',
      });
      const displayHost = h === '0.0.0.0' || !h ? 'localhost' : h;
      console.log(
        ` 🚀 Server ready \u001b[1;35m http://${displayHost}:${port}/dist/smoke/\u001b[0m`
      );
      return;
    } catch (e) {
      if (e.message && e.message.includes('address already in use')) {
        console.log(` ⚠ Port ${startPort + i} in use, trying ${startPort + i + 1}...`);
        continue;
      }
      throw e;
    }
  }
  console.error(` ❌ Could not find an available port (tried ${startPort}-${startPort + maxAttempts - 1})`);
  process.exit(1);
});
