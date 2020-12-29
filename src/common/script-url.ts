// Adapted from https://jakedeichert.com/blog/2020/02/a-super-hacky-alternative-to-import-meta-url/
function getFileUrl() {
  const stackTraceFrames = String(new Error().stack)
    .replace(/^Error.*\n/, '')
    .split('\n');

  if (stackTraceFrames.length === 0) return '';

  // 0 = this getFileUrl frame (because the Error is created here)
  // 1 = the caller of getFileUrl (the file path we want to grab)
  const callerFrame = stackTraceFrames[0];

  // Extract the script's complete url
  const m = callerFrame.match(/http.*js/);
  if (!m) return '';
  return m[0];
}

export const gScriptUrl =
  (document.currentScript as HTMLScriptElement)?.src ?? getFileUrl();
