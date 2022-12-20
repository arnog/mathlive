import { globalMathLive } from '../mathlive';
import { isBrowser } from '../common/capabilities';
import { render } from '../editor-mathfield/render';
import { MathfieldOptions } from '../public/options';

function removeHighlight(element: Element | null): void {
  if (!element) return;
  element.classList.remove('ML__highlight');
  if (element.children)
    for (const child of element.children) removeHighlight(child);
}

/**
 * Highlights the box corresponding to the specified atomID.
 *
 * This is used for text-to-speech with synchronized highlighting (read aloud)
 *
 * @category Read Aloud
 * @param {string} atomID
 *
 */
function highlightAtomID(element: HTMLElement | null, atomID?: string): void {
  if (!element) return;
  if (!atomID || element.dataset?.atomId === atomID) {
    element.classList.add('ML__highlight');
    if (element.children && element.children.length > 0) {
      [...element.children].forEach((x) => {
        if (x instanceof HTMLElement) highlightAtomID(x);
      });
    }
  } else {
    element.classList.remove('ML__highlight');
    if (element.children && element.children.length > 0) {
      [...element.children].forEach((x) => {
        if (x instanceof HTMLElement) highlightAtomID(x, atomID);
      });
    }
  }
}

/**
 * "Read Aloud" is an asynchronous operation that reads the
 * formula with synchronized highlighting
 *
 * @param element - The DOM element to highlight
 * @param text - The text to speak
 */
export function defaultReadAloudHook(
  element: HTMLElement,
  text: string,
  config: Partial<MathfieldOptions>
): void {
  if (!isBrowser()) return;

  config ??= globalMathLive().config;

  if (config.speechEngine !== 'amazon') {
    console.warn('Use Amazon TTS Engine for synchronized highlighting');
    if (config.speakHook) config.speakHook(text, config);
    return;
  }

  if (!globalThis.AWS) {
    console.warn(
      'AWS SDK not loaded. See https://www.npmjs.com/package/aws-sdk'
    );
    return;
  }

  const polly = new globalThis.AWS.Polly({ apiVersion: '2016-06-10' });

  const parameters = {
    OutputFormat: 'json',
    VoiceId: config.speechEngineVoice ?? 'Joanna',
    Engine: 'standard', // The neural engine does not appear to support ssml marks
    Text: text,
    TextType: 'ssml',
    SpeechMarkTypes: ['ssml'],
  };

  globalMathLive().readAloudElement = element;

  // Request the mark points
  polly.synthesizeSpeech(parameters, (err, data) => {
    if (err) {
      console.warn('polly.synthesizeSpeech() error:', err, err.stack);
      return;
    }

    if (!data?.AudioStream) {
      console.log('polly.synthesizeSpeech():', data);
      return;
    }

    const response = new TextDecoder('utf-8').decode(
      new Uint8Array(data.AudioStream)
    );
    globalMathLive().readAloudMarks = response
      .split('\n')
      .map((x) => (x ? JSON.parse(x) : {}));
    globalMathLive().readAloudTokens = [];
    for (const mark of globalMathLive().readAloudMarks)
      if (mark.value) globalMathLive().readAloudTokens.push(mark.value);

    globalMathLive().readAloudCurrentMark = '';

    // Request the audio
    parameters.OutputFormat = 'mp3';
    parameters.SpeechMarkTypes = [];
    polly.synthesizeSpeech(parameters, (err, data) => {
      if (err) {
        console.warn(
          'polly.synthesizeSpeech(',
          text,
          ') error:',
          err,
          err.stack
        );
        return;
      }

      if (!data?.AudioStream) return;

      const uInt8Array = new Uint8Array(data.AudioStream);
      const blob = new Blob([uInt8Array.buffer], {
        type: 'audio/mpeg',
      });
      const url = URL.createObjectURL(blob);
      const global = globalMathLive();
      if (!global.readAloudAudio) {
        global.readAloudAudio = new Audio();
        global.readAloudAudio.addEventListener('ended', () => {
          const mathfield = global.readAloudMathField;

          global.readAloudStatus = 'ended';
          document.body.dispatchEvent(
            new Event('read-aloud-status-change', {
              bubbles: true,
              composed: true,
            })
          );

          if (mathfield) {
            render(mathfield);
            global.readAloudElement = null;
            global.readAloudMathField = null;
            global.readAloudTokens = [];
            global.readAloudMarks = [];
            global.readAloudCurrentMark = '';
          } else removeHighlight(global.readAloudElement);
        });
        global.readAloudAudio.addEventListener('timeupdate', () => {
          let value = '';
          // The target, the atom we're looking for, is the one matching the current audio
          // plus 100 ms. By anticipating it a little bit, it feels more natural, otherwise it
          // feels like the highlighting is trailing the audio.
          const target = global.readAloudAudio.currentTime * 1000 + 100;

          // Find the smallest element which is bigger than the target time
          for (const mark of global.readAloudMarks)
            if (mark.time < target) value = mark.value;

          if (global.readAloudCurrentMark !== value) {
            global.readAloudCurrentToken = value;
            if (value && value === global.readAloudFinalToken)
              global.readAloudAudio.pause();
            else {
              global.readAloudCurrentMark = value;
              highlightAtomID(
                global.readAloudElement,
                global.readAloudCurrentMark
              );
            }
          }
        });
      } else global.readAloudAudio.pause();

      global.readAloudAudio.src = url;

      global.readAloudStatus = 'playing';
      document.body.dispatchEvent(
        new Event('read-aloud-status-change', {
          bubbles: true,
          composed: true,
        })
      );

      global.readAloudAudio.play();
    });
  });
}

/**
 * Returns the status of a Read Aloud operation (reading with synchronized
 * highlighting).
 *
 * Possible values are:
 * - `"ready"`
 * - `"playing"`
 * - `"paused"`
 * - `"unavailable"`
 *
 * **See** {@linkcode speak}
 * @category Read Aloud
 */
export function readAloudStatus():
  | 'ready'
  | 'playing'
  | 'paused'
  | 'unavailable' {
  if (!isBrowser()) return 'unavailable';
  const audio = globalMathLive().readAloudAudio;
  if (!audio) return 'ready';
  if (audio.paused) return 'paused';
  if (!audio.ended) return 'playing';

  return 'ready';
}

/**
 * Pauses a read aloud operation if one is in progress.
 *
 * **See** {@linkcode speak}
 */
export function pauseReadAloud(): void {
  if (!isBrowser()) return;
  const audio = globalMathLive().readAloudAudio;
  if (audio) {
    globalMathLive().readAloudStatus = 'paused';

    document.body.dispatchEvent(
      new Event('read-aloud-status-change', {
        bubbles: true,
        composed: true,
      })
    );

    audio.pause();
  }
}

/**
 * Resumes a read aloud operation if one was paused.
 *
 * **See** {@linkcode speak}
 */
export function resumeReadAloud(): void {
  if (!isBrowser()) return;
  const audio = globalMathLive().readAloudAudio;
  if (audio) {
    globalMathLive().readAloudStatus = 'playing';

    document.body.dispatchEvent(
      new Event('read-aloud-status-change', {
        bubbles: true,
        composed: true,
      })
    );

    audio.play();
  }
}

/**
 * If a Read Aloud operation is in progress, read from a specified token
 *
 * **See** {@linkcode speak}
 *
 * @param count The number of tokens to read.
 */
export function playReadAloud(token: string, count: number): void {
  if (!isBrowser()) return;
  const global = globalMathLive();

  if (global.readAloudAudio) {
    let timeIndex = 0;
    global.readAloudFinalToken = null;
    if (token) {
      global.readAloudMarks = global.readAloudMarks ?? [];
      for (const mark of global.readAloudMarks)
        if (mark.value === token) timeIndex = mark.time / 1000;

      let tokenIndex = global.readAloudTokens.indexOf(token);
      if (tokenIndex >= 0) {
        tokenIndex += count;
        if (tokenIndex < global.readAloudTokens.length)
          global.readAloudFinalToken = global.readAloudTokens[tokenIndex];
      }
    }

    global.readAloudAudio.currentTime = timeIndex;

    global.readAloudStatus = 'playing';
    document.body.dispatchEvent(
      new Event('read-aloud-status-change', {
        bubbles: true,
        composed: true,
      })
    );

    global.readAloudAudio.play();
  }
}
