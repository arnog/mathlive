import { validateOrigin } from '../src/editor-mathfield/utils';

describe('keyboard message origin validation', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: { origin: 'https://host.example' },
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalWindow)
      Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  });

  test('same-origin requires an exact non-opaque origin', () => {
    expect(validateOrigin('https://host.example', 'same-origin')).toBe(true);
    for (const origin of [
      '*',
      '',
      'null',
      'http://host.example',
      'https://host.example:8443',
      'https://host.example.attacker.example',
    ])
      expect(validateOrigin(origin, 'same-origin')).toBe(false);
    window.origin = 'null';
    expect(validateOrigin('null', 'same-origin')).toBe(false);
  });

  test('only explicit policies allow a different origin', () => {
    const origin = 'https://math.example';
    expect(validateOrigin(origin, 'none')).toBe(true);
    expect(validateOrigin(origin, (value) => value === origin)).toBe(true);
    expect(validateOrigin(origin, () => false)).toBe(false);
    expect(validateOrigin('*', () => true)).toBe(false);
  });
});
