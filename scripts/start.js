#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const { build } = require('estrella');
const open = require('open');
const less = require('@arnog/esbuild-plugin-less');

// function getOutputFilename(rootName, format) {
//   switch (format) {
//     case 'esm':
//       return `${rootName}.mjs`;
//     default:
//       return `${rootName}.js`;
//   }
// }

let server = null;

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
    if (server === null && buildResult.errors.length === 0) {
      const url = `http://localhost:8080/examples/test-cases/`;
      console.log(` 🚀 Server ready:\u001b[1;35m ${url}\u001b[0m`);

      server = require('serve-http').createServer({
        host: 'localhost',
        port: 8080,
        pubdir: '.',
        quiet: true,
        defaultMimeType: 'text/javascript',
        // livereload: { disable: true },
      });
      open(url);
    }
  },
});

// } else {
//   ['esm', 'iife'].forEach((format) => {
//     const outputFilename = getOutputFilename('mathlive', format);
//     build({
//       watch:
//         process.env.BUILD !== 'watch'
//           ? false
//           : {
//               onRebuild(error) {
//                 if (!error) {
//                   console.log('Build succeeded');
//                 }
//               },
//             },
//       entryPoints: ['./src/mathlive.ts'],
//       bundle: true,
//       format,
//       globalName: 'MathLive',
//       // outdir: path.resolve(__dirname, 'build'),
//       outfile: `./dist/${outputFilename}`,
//       plugins: [cssFilePlugin()],
//       loader: {
//         '.ts': 'ts',
//       },
//     })
//       .then(() => {
//         console.info(`— ${outputFilename} was built`);
//       })
//       .catch((e) => {
//         console.info(`🚨 ${outputFilename} build error:`);
//         console.error(e);
//       });
//   });
// }
