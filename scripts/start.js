#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const { build } = require('estrella');
const open = require('open');
const less = require('@arnog/esbuild-plugin-less');
const { exec } = require('child_process');

let serverLaunched = false;

build({
  entry: './src/mathlive.ts',
  outfile: './dist/mathlive.mjs',
  format: 'esm',
  bundle: true,
  plugins: [less()],
  loader: {
    '.ts': 'ts',
  },
  watch: true,
  cwd: '.', // Required so that the tsc error message include a path relative to the project root
  debug: true,
  sourcemap: true,
  tslint: {
    mode: 'on',
    format: 'full',
  },
  silent: false,
  quiet: true,
  clear: false,
  onEnd: (_config, buildResult, _ctx) => {
    if (buildResult.errors.length === 0) {
      if (serverLaunched) {
        console.log(` 🚀 Build Complete`);
        return;
      }
      const url = `http://localhost:8080/examples/test-cases/`;
      console.log(` 🚀 Server ready:\u001b[1;35m ${url}\u001b[0m`);
      exec(
        "npx http-server . -s -c-1 --cors='*' --port 8080",
        (error, stdout, stderr) => {
          if (error) {
            throw Error(error);
          }
          console.log(stdout);
          console.error(stderr);
        }
      );
      serverLaunched = true;
      open(url);
    }
  },
});
