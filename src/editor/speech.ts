import type { SpeechScope } from '../public/commands';

import type { Atom } from '../core/atom';

import type { _Mathfield } from '../editor-mathfield/mathfield-private';

import { atomToSpeakableText } from './atom-to-speakable-text';
import { register as registerCommand } from './commands';
import { render } from '../editor-mathfield/render';
import { isBrowser } from '../ui/utils/capabilities';
import { globalMathLive } from '../mathlive';

declare global {
  interface Window {
    AWS: { [key: string]: any };
  }
}

export function speakableText(prefix: string, atoms: Atom | Atom[]): string {
  return prefix + atomToSpeakableText(atoms);
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
      mathfield: _Mathfield,
      scope: SpeechScope,
      options: { withHighlighting: boolean }
    ): boolean => {
      return speak(mathfield, scope, options);
    },
  },
  { target: 'mathfield' }
);

function speak(
  mathfield: _Mathfield,
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
        if (parent?.parent) result = parent;
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
    window.MathfieldElement.speakHook?.(getFailedSpeech(scope));
    return false;
  }

  if (
    speakOptions.withHighlighting ||
    window.MathfieldElement.speechEngine === 'amazon'
  ) {
    window.MathfieldElement.textToSpeechMarkup =
      window.sre && window.MathfieldElement.textToSpeechRules === 'sre'
        ? 'ssml_step'
        : 'ssml';
  }

  const text = atomToSpeakableText(atoms);
  if (isBrowser() && speakOptions.withHighlighting) {
    globalMathLive().readAloudMathfield = mathfield;
    render(mathfield, { forHighlighting: true });
    if (window.MathfieldElement.readAloudHook)
      window.MathfieldElement.readAloudHook(mathfield.field!, text);
  } else if (window.MathfieldElement.speakHook)
    window.MathfieldElement.speakHook(text);

  return false;
}

export function defaultSpeakHook(text: string): void {
  if (!isBrowser()) {
    console.log('Speak:', text);
    return;
  }

  if (
    !window.MathfieldElement.speechEngine ||
    window.MathfieldElement.speechEngine === 'local'
  ) {
    // On ChromeOS: chrome.accessibilityFeatures.spokenFeedback
    // See also https://developer.chrome.com/apps/tts
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  } else if (window.MathfieldElement.speechEngine === 'amazon') {
    if (!('AWS' in window)) {
      console.error(
        `MathLive {{SDK_VERSION}}: AWS SDK not loaded. See https://www.npmjs.com/package/aws-sdk`
      );
    } else {
      const polly = new window.AWS.Polly({ apiVersion: '2016-06-10' });
      const parameters = {
        OutputFormat: 'mp3',
        VoiceId: window.MathfieldElement.speechEngineVoice ?? 'Joanna',
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
        ].includes(window.MathfieldElement.speechEngineVoice ?? 'Joanna')
          ? 'neural'
          : 'standard',
        // SampleRate: '24000',
        Text: text,
        TextType: 'ssml',
        // SpeechMarkTypes: ['ssml]'
      };
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Polly.html#synthesizeSpeech-property
      polly.synthesizeSpeech(parameters, (err, data) => {
        if (err) {
          console.trace(
            `MathLive {{SDK_VERSION}}: \`polly.synthesizeSpeech()\` error: ${err}`
          );
        } else if (data?.AudioStream) {
          // Announce('plonk');
          const uInt8Array = new Uint8Array(data.AudioStream);
          const blob = new Blob([uInt8Array.buffer], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);

          const audioElement = new Audio(url);
          audioElement.play().catch((error) => console.log(error));
        } else console.log('polly.synthesizeSpeech():', data);
      });

      // Can call AWS.Request() on the result of synthesizeSpeech()
    }
  } else if (window.MathfieldElement.speechEngine === 'google') {
    console.error(
      `MathLive {{SDK_VERSION}}: The Google speech engine is not supported yet. Please come again.`
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
