import type { TextToSpeechOptions, MathfieldOptions } from '../public/options';
import type { SpeechScope } from '../public/commands';

import type { Atom } from '../core/atom';

import type { MathfieldPrivate } from '../editor-mathfield/mathfield-private';

import { atomToSpeakableText } from './atom-to-speakable-text';
import { register as registerCommand } from './commands';
import { render } from '../editor-mathfield/render';
import { isBrowser } from '../common/capabilities';
import { globalMathLive } from '../mathlive';

declare global {
  interface Window {
    AWS: { [key: string]: any };
    mathlive: { [key: string]: any };
  }
}

export function speakableText(
  speechOptions: Required<TextToSpeechOptions>,
  prefix: string,
  atoms: Atom | Atom[]
): string {
  const options: TextToSpeechOptions = {
    ...speechOptions,
    textToSpeechMarkup: '',
    textToSpeechRulesOptions: {
      ...speechOptions.textToSpeechRulesOptions,
      markup: 'none',
    },
  };
  return prefix + atomToSpeakableText(atoms, options);
}

/**
 *
 * Speak some part of the expression, either with or without synchronized highlighting.
 *
 * @param speakOptions.withHighlighting - If true, synchronized
 * highlighting of speech will happen (if possible). Default is false.
 */

registerCommand(
  {
    speak: (
      mathfield: MathfieldPrivate,
      scope: SpeechScope,
      options: { withHighlighting: boolean }
    ): boolean => {
      return speak(mathfield, scope, options);
    },
  },
  { target: 'mathfield', category: 'speech' }
);

function speak(
  mathfield: MathfieldPrivate,
  scope: SpeechScope,
  speakOptions: { withHighlighting: boolean }
): boolean {
  speakOptions = speakOptions ?? { withHighlighting: false };
  const { model } = mathfield;
  function getAtoms(scope: SpeechScope): Atom | Atom[] | null {
    let result: Atom | Atom[] | null = null;
    switch (scope) {
      case 'all':
        result = model.root;
        break;

      case 'selection':
        result = model.getAtoms(model.selection);
        break;

      case 'left': {
        result = model.getAtoms(
          model.offsetOf(model.at(model.position).leftSibling),
          model.position
        );
        break;
      }

      case 'right': {
        result = model.getAtoms(
          model.position,
          model.offsetOf(model.at(model.position).rightSibling)
        );
        break;
      }

      case 'group':
        result = model.getAtoms(model.getSiblingsRange(model.position));
        break;

      case 'parent': {
        const { parent } = model.at(model.position);
        if (parent && parent.type !== 'root') result = parent;
        else result = model.root;

        break;
      }
      default:
        result = model.root;
    }

    return result;
  }

  function getFailedSpeech(scope: SpeechScope): string {
    let result = '';
    switch (scope) {
      case 'all':
        console.log('Internal failure: speak all failed');
        break;
      case 'selection':
        result = 'no selection';
        break;
      case 'left':
        result = 'at start';
        break;
      case 'right':
        result = 'at end';
        break;
      case 'group':
        console.log('Internal failure: speak group failed');
        break;
      case 'parent':
        result = 'no parent';
        break;
      default:
        console.log('unknown speak_ param value: "' + scope + '"');
        break;
    }

    return result;
  }

  const atoms = getAtoms(scope);
  if (atoms === null) {
    mathfield.options.speakHook?.(getFailedSpeech(scope), mathfield.options);
    return false;
  }

  const options = { ...mathfield.options };
  if (speakOptions.withHighlighting || options.speechEngine === 'amazon') {
    options.textToSpeechMarkup =
      globalThis.sre && options.textToSpeechRules === 'sre'
        ? 'ssml_step'
        : 'ssml';
  }
  // Chrome and Safari support ssml, but FireFox doesn't
  if (!options.textToSpeechMarkup) {
    if (!/firefox/i.test(navigator.userAgent))
      options.textToSpeechMarkup = 'ssml';
  }

  const text = atomToSpeakableText(atoms, options);
  if (isBrowser() && speakOptions.withHighlighting) {
    globalMathLive().readAloudMathField = mathfield;
    render(mathfield, { forHighlighting: true });
    if (mathfield.options.readAloudHook) {
      mathfield.options.readAloudHook(
        mathfield.field!,
        text,
        mathfield.options
      );
    }
  } else if (mathfield.options.speakHook)
    mathfield.options.speakHook(text, options);

  return false;
}

export function defaultSpeakHook(
  text: string,
  config?: Partial<MathfieldOptions>
): void {
  if (!isBrowser()) {
    console.log('Speak:', text);
    return;
  }

  config ??= globalMathLive().config ?? {};

  // Sigh... Not really necessary, but the version of the typescript
  // compiler used by `grok` will complain about this
  if (!config) return;

  if (!config.speechEngine || config.speechEngine === 'local') {
    // On ChromeOS: chrome.accessibilityFeatures.spokenFeedback
    // See also https://developer.chrome.com/apps/tts
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  } else if (config.speechEngine === 'amazon') {
    if (!('AWS' in window)) {
      console.warn(
        'AWS SDK not loaded. See https://www.npmjs.com/package/aws-sdk'
      );
    } else {
      const polly = new globalThis.AWS.Polly({ apiVersion: '2016-06-10' });
      const parameters = {
        OutputFormat: 'mp3',
        VoiceId: config.speechEngineVoice ?? 'Joanna',
        Engine: [
          'Amy',
          'Emma',
          'Brian',
          'Ivy',
          'Joanna',
          'Kendra',
          'Kimberly',
          'Salli',
          'Joey',
          'Justin',
          'Matthew',
        ].includes(config.speechEngineVoice ?? 'Joanna')
          ? 'neural'
          : 'standard',
        // SampleRate: '24000',
        Text: text,
        TextType: 'ssml',
        // SpeechMarkTypes: ['ssml]'
      };
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Polly.html#synthesizeSpeech-property
      polly.synthesizeSpeech(parameters, (err, data) => {
        if (err)
          console.warn('polly.synthesizeSpeech() error:', err, err.stack);
        // Announce('plonk');
        else if (data?.AudioStream) {
          const uInt8Array = new Uint8Array(data.AudioStream);
          const blob = new Blob([uInt8Array.buffer], {
            type: 'audio/mpeg',
          });
          const url = URL.createObjectURL(blob);

          const audioElement = new Audio(url);
          audioElement.play().catch((error) => console.log(error));
        } else console.log('polly.synthesizeSpeech():', data);
      });

      // Can call AWS.Request() on the result of synthesizeSpeech()
    }
  } else if (config.speechEngine === 'google') {
    console.warn(
      'The Google speech engine is not supported yet. Please come again.'
    );
    // @todo: implement support for Google Text-to-Speech API,
    // using config.speechEngineToken, config.speechEngineVoice and
    // config.speechEngineAudioConfig

    // curl -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) \
    //   -H "Content-Type: application/json; charset=utf-8" \
    //   --data "{
    //     'input':{
    //       'text':'Android is a mobile operating system developed by Google,
    //          based on the Linux kernel and designed primarily for
    //          touchscreen mobile devices such as smartphones and tablets.'
    //     },
    //     'voice':{
    //       'languageCode':'en-gb',
    //       'name':'en-GB-Standard-A',
    //       'ssmlGender':'FEMALE'
    //     },
    //     'audioConfig':{
    //       'audioEncoding':'MP3'
    //     }
    //   }" "https://texttospeech.googleapis.com/v1beta1/text:synthesize" > synthesize-text.txt
  }
}
