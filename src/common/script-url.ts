// Adapted from https://jakedeichert.com/blog/2020/02/a-super-hacky-alternative-to-import-meta-url/
function getFileUrl() {
  const stackTraceFrames = String(new Error().stack)
    .replace(/^Error.*\n/, '')
    .split('\n');

  if (stackTraceFrames.length === 0) {
    console.error(
      "Can't use relative paths to specify assets location because the source" +
        'file location could not be determined (unexpected stack trace format' +
        ` "${new Error().stack}").`
    );
    return '';
  }

  // 0 = this getFileUrl frame (because the Error is created here)
  // 1 = the caller of getFileUrl (the file path we want to grab)
  let callerFrame = stackTraceFrames[1];

  // Extract the script's complete url
  let m = callerFrame.match(/[^(@ ]+\.ts[\?:]/);
  if (m) {
    // This is a Typescript file, therefore there's a source map that's
    // remapping to the source file. Use an entry further in the stack trace.
    callerFrame = stackTraceFrames[2];
  }

  m = callerFrame.match(/([^(@ ]+js)[\?:]/);
  if (!m) {
    console.error(stackTraceFrames);
    console.error(
      "Can't use relative paths to specify assets location because the source " +
        'file location could not be determined ' +
        `(unexpected location "${callerFrame}").`
    );
    return '';
  }
  return m[1];
}

export function resolveRelativeUrl(url: string): string {
  let result = '';
  try {
    result = new URL(url, gScriptUrl).toString();
  } catch (e) {
    console.error(`Invalid URL "${url}" (relative to "${gScriptUrl}")`);
  }
  return result;
}

// The URL of the bundled MathLive library. Used later to locate the `fonts`
// directory, relative to the library

// If loaded via a <script> tag, `document.currentScript.src` is this location
// If loaded via a module (e.g. `import ...`),`import.meta.url` is this location.
// However, `import.meta` is not supported by WebPack. So, use a
// super-hacky-alternative to get the URL.
// See https://github.com/webpack/webpack/issues/6719

// Note that in some circumstances, document.currentScript.src can be ""
// (the empty string). Therefore, use the "||" operator rather than "??"
// to properly apply the alternative value in this case.

const gScriptUrl =
  (globalThis?.document?.currentScript as HTMLScriptElement)?.src ||
  getFileUrl();
