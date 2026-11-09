import { normalizeKeybindings } from '../src/editor/keybindings';
import { DEFAULT_KEYBINDINGS } from '../src/editor/keybindings-definitions';
import type { KeyboardLayout } from '../src/editor/keyboard-layouts/types';
import {
  APPLE_ENGLISH,
  WINDOWS_ENGLISH,
  LINUX_ENGLISH,
} from '../src/editor/keyboard-layouts/english';
import {
  APPLE_FRENCH,
  WINDOWS_FRENCH,
  LINUX_FRENCH,
} from '../src/editor/keyboard-layouts/french';
import {
  APPLE_GERMAN,
  WINDOWS_GERMAN,
  LINUX_GERMAN,
} from '../src/editor/keyboard-layouts/german';
import {
  APPLE_SPANISH,
  WINDOWS_SPANISH,
  LINUX_SPANISH,
} from '../src/editor/keyboard-layouts/spanish';
import { DVORAK } from '../src/editor/keyboard-layouts/dvorak';

const LAYOUTS: KeyboardLayout[] = [
  APPLE_ENGLISH,
  WINDOWS_ENGLISH,
  LINUX_ENGLISH,
  APPLE_FRENCH,
  WINDOWS_FRENCH,
  LINUX_FRENCH,
  APPLE_GERMAN,
  WINDOWS_GERMAN,
  LINUX_GERMAN,
  APPLE_SPANISH,
  WINDOWS_SPANISH,
  LINUX_SPANISH,
  DVORAK,
];

// A layout with a score of 0 is one that has not been detected yet; layout-specific
// keybindings are skipped for it, so detect it for the purpose of this test
function detected(layout: KeyboardLayout): KeyboardLayout {
  return { ...layout, score: 1 };
}

describe('DEFAULT_KEYBINDINGS', () => {
  test.each(LAYOUTS.map((x) => [x.id, x] as const))(
    'normalize without conflicts for the %s layout',
    (_id, layout) => {
      const [, errors] = normalizeKeybindings(
        DEFAULT_KEYBINDINGS,
        detected(layout)
      );
      expect(errors).toEqual([]);
    }
  );

  // On the German Mac layout the `^` dead key maps to [IntlBackslash], not a `\`.
  // The binding that starts a LaTeX command on that key, meant for UK keyboards,
  // turned the composed `^` into a `\` (#2529, #3066).
  test('[IntlBackslash] does not start a LaTeX command on the German Mac layout', () => {
    const [bindings] = normalizeKeybindings(
      DEFAULT_KEYBINDINGS,
      detected(APPLE_GERMAN)
    );
    expect(bindings.filter((x) => x.key === '[IntlBackslash]')).toEqual([]);
  });

  test('[IntlBackslash] starts a LaTeX command on the UK layout, where it types `\\`', () => {
    const [bindings] = normalizeKeybindings(
      DEFAULT_KEYBINDINGS,
      detected(WINDOWS_ENGLISH)
    );
    const commands = bindings
      .filter((x) => x.key === '[IntlBackslash]')
      .map((x) => x.command);
    expect(commands).toEqual([['switchMode', 'latex', '', '\\']]);
  });
});
