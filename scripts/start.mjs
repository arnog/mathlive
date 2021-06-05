import { serve, build } from 'esbuild';
import path from 'path';
import { promises as fs } from 'fs';
import less from 'less';

process.env.BUILD = process.env.BUILD || 'development';
const PRODUCTION = process.env.BUILD === 'production';
const BUILD_ID =
  Date.now().toString(36).slice(-2) +
  Math.floor(Math.random() * 0x186a0).toString(36);
const BUILD_DIRECTORY = 'dist';

const importRegex = /@import(?:\s+\((.*)\))?\s+['"](.*)['"]/;
const globalImportRegex = /@import(?:\s+\((.*)\))?\s+['"](.*)['"]/g;
const importCommentRegex = /(?:\/\*(?:[\s\S]*?)\*\/)|(\/\/(?:.*)$)/gm;

const extWhitelist = ['.css', '.less'];

/** Recursively get .less/.css imports from file */
export const getLessImports = (filePath) => {
  try {
    const dir = path.dirname(filePath);
    const content = fs.readFileSync(filePath).toString('utf8');

    const cleanContent = content.replace(importCommentRegex, '');
    const match = cleanContent.match(globalImportRegex) || [];

    const fileImports = match
      .map((el) => {
        const match = el.match(importRegex);
        return match[2];
      })
      .filter((el) => !!el)
      // NOTE: According to the docs, extensionless imports are interpreted as '.less' files.
      // http://lesscss.org/features/#import-atrules-feature-file-extensions
      // https://github.com/iam-medvedev/esbuild-plugin-less/issues/13
      .map((el) => path.resolve(dir, path.extname(el) ? el : `${el}.less`));

    const recursiveImports = fileImports.reduce((result, el) => {
      return [...result, ...getLessImports(el)];
    }, fileImports);

    const result = recursiveImports.filter((el) =>
      extWhitelist.includes(path.extname(el).toLowerCase())
    );

    return result;
  } catch (e) {
    return [];
  }
};

/** Convert less error into esbuild error */
export const convertLessError = (error) => {
  // const sourceLine = error.extract.filter((line) => line);
  // const lineText = sourceLine.length === 3 ? sourceLine[1] : sourceLine[0];

  return {
    text: error.message,
    location: {
      namespace: 'file',
      file: error.filename,
      line: error.line,
      column: error.column,
      lineText: '',
    },
  };
};

const cssFilePlugin = (options = {}) => {
  return {
    name: 'css-file',
    setup(buildArg) {
      buildArg.onResolve({ filter: /\.less$/ }, (args) => {
        const filePath = path.resolve(
          process.cwd(),
          path.relative(process.cwd(), args.resolveDir),
          args.path
        );

        return {
          path: filePath,
          watchFiles: !!buildArg.initialOptions.watch
            ? [filePath, ...getLessImports(filePath)]
            : undefined,
          namespace: 'css-file',
        };
      });

      buildArg.onLoad({ filter: /.*/, namespace: 'css-file' }, async (args) => {
        const content = await fs.readFile(args.path, 'utf-8');
        const dir = path.dirname(args.path);
        const filename = path.basename(args.path);
        try {
          const result = await less.render(content, {
            filename,
            rootpath: dir,
            // ...options,
            paths: [...(options.paths || []), dir],
          });

          return {
            contents: result.css,
            loader: 'text',
            // resolveDir: dir,
          };
        } catch (e) {
          return {
            errors: [convertLessError(e)],
            resolveDir: dir,
          };
        }
      });
    },
  };
};

function getOutputFilename(rootName, format) {
  switch (format) {
    case 'esm':
      return `${rootName}.mjs`;
    default:
      return `${rootName}.js`;
  }
}

serve(
  {
    servedir: '.',
  },
  {
    entryPoints: ['./src/mathlive.ts'],
    bundle: true,
    // outdir: path.resolve(__dirname, 'build'),
    format: 'esm',
    sourcemap: true,
    outfile: './dist/mathlive.mjs',
    plugins: [cssFilePlugin()],
    loader: {
      '.ts': 'ts',
    },
  }
).then((server) => {
  console.log(
    ` 🚀 Server ready: http://${server.host}:${server.port}/examples/test-cases/`
  );
  // Call "stop" on the web server when you're done
  // server.stop();
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
