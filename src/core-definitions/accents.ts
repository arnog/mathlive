import { Atom } from '../core/atom-class';
import { AccentAtom } from '../core-atoms/accent';
import { OverunderAtom } from '../core-atoms/overunder';

import {
  argAtoms,
  defineFunction,
  parseArgAsString,
} from './definitions-utils';
import { atomsBoxType } from '../core/box';

const ACCENTS = {
  acute: 0x02ca,
  grave: 0x02cb,
  dot: 0x02d9,
  ddot: 0x00a8,
  mathring: 0x02da,
  tilde: 0x007e,
  bar: 0x02c9,
  breve: 0x02d8,
  check: 0x02c7,
  hat: 0x005e,
  vec: 0x20d7,
};

defineFunction(Object.keys(ACCENTS), '{body:auto}', {
  createAtom: (options) =>
    new AccentAtom({
      ...options,
      body: argAtoms(options.args![0]),
      accentChar: ACCENTS[options.command!.slice(1)],
    }),
});

defineFunction(['widehat', 'widecheck', 'widetilde'], '{body:auto}', {
  createAtom: (options) => {
    // Pick the correct SVG template based on the length of the body
    const baseString = parseArgAsString(argAtoms(options.args![0]));
    return new AccentAtom({
      ...options,
      body: argAtoms(options.args![0]),
      svgAccent:
        options.command!.slice(1) +
        (baseString.length > 5
          ? '4'
          : ['1', '1', '2', '2', '3', '3'][baseString.length]),
    });
  },
});

defineFunction(['overarc', 'overparen', 'wideparen'], '{body:auto}', {
  createAtom: (options) => {
    return new AccentAtom({
      ...options,
      body: argAtoms(options.args![0]),
      svgAccent: 'overarc',
    });
  },
});
defineFunction(['underarc', 'underparen'], '{body:auto}', {
  createAtom: (options) => {
    return new OverunderAtom({
      ...options,
      body: argAtoms(options.args![0]),
      svgBelow: 'underarc',
    });
  },
});

defineFunction('utilde', '{body:auto}', {
  createAtom: (options) => {
    const body = argAtoms(options.args![0]);
    const baseString = parseArgAsString(body);
    const accent =
      'widetilde' +
      (baseString.length > 5
        ? '4'
        : ['1', '1', '2', '2', '3', '3'][baseString.length]);
    return new OverunderAtom({
      ...options,
      body,
      svgBelow: accent,
      boxType: atomsBoxType(body),
    });
  },
});

/*
 * From plain.tex
 *
 */

defineFunction('^', '{:string}', {
  createAtom: (options) =>
    new Atom({
      ...options,
      type: 'mord',
      isFunction: false,
      limits: 'adjacent',
      value: options.args![0]
        ? {
            a: 'â',
            e: 'ê',
            i: 'î',
            o: 'ô',
            u: 'û',
            A: 'Â',
            E: 'Ê',
            I: 'Î',
            O: 'Ô',
            U: 'Û',
          }[options.args![0] as string] ?? '^'
        : '^',
    }),
});

defineFunction('`', '{:string}', {
  createAtom: (options) =>
    new Atom({
      ...options,
      type: 'mord',
      isFunction: false,
      limits: 'adjacent',
      value: options.args![0]
        ? {
            a: 'à',
            e: 'è',
            i: 'ì',
            o: 'ò',
            u: 'ù',
            A: 'À',
            E: 'È',
            I: 'Ì',
            O: 'Ò',
            U: 'Ù',
          }[options.args![0] as string] ?? '`'
        : '`',
    }),
});

defineFunction("'", '{:string}', {
  createAtom: (options) =>
    new Atom({
      ...options,
      type: 'mord',
      isFunction: false,
      limits: 'adjacent',
      value: options.args![0]
        ? {
            a: 'á',
            e: 'é',
            i: 'í',
            o: 'ó',
            u: 'ú',
            A: 'Á',
            E: 'É',
            I: 'Í',
            O: 'Ó',
            U: 'Ú',
          }[options.args![0] as string] ?? '\u005E'
        : '\u005E',
    }),
});

defineFunction('~', '{:string}', {
  createAtom: (options) =>
    new Atom({
      type: 'mord',
      ...options,
      isFunction: false,
      limits: 'adjacent',
      value: options.args![0]
        ? { n: 'ñ', N: 'Ñ', a: 'ã', o: 'õ', A: 'Ã', O: 'Õ' }[
            options.args![0] as string
          ] ?? '\u00B4'
        : '\u00B4',
    }),
});

defineFunction('c', '{:string}', {
  createAtom: (options) =>
    new Atom({
      ...options,
      type: 'mord',
      isFunction: false,
      limits: 'adjacent',
      value: options.args![0]
        ? { c: 'ç', C: 'Ç' }[options.args![0] as string] ?? ''
        : '',
    }),
});
