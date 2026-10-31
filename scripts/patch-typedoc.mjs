#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';

const typedocUtilsUrl = new URL(
  '../node_modules/typedoc/dist/node-utils.js',
  import.meta.url
);

const vulnerableCall = `return mini.set.some((row) => mini.matchOne(
        childPath,
        row,
        /* partial */
        true
      ));`;
const safeCall = `return mini.match(childPath.join("/"), true);`;

const source = await readFile(typedocUtilsUrl, 'utf8');
if (source.includes(safeCall)) process.exit(0);
if (!source.includes(vulnerableCall)) {
  throw new Error(
    'Unable to apply the TypeDoc/minimatch compatibility patch. ' +
      'Review the installed TypeDoc release before continuing.'
  );
}

await writeFile(
  typedocUtilsUrl,
  source.replace(vulnerableCall, safeCall),
  'utf8'
);
