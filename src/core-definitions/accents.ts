import { Atom } from '../core/atom-class';
import { AccentAtom } from '../core-atoms/accent';
import { OverunderAtom } from '../core-atoms/overunder';
import type { Style } from 'public/core-types';
import type { GlobalContext } from 'core/types';

import {
  Argument,
  binRelType,
  defineFunction,
  parseArgAsString,
} from './definitions-utils';

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
  createAtom: (
    command: string,
    args: Argument[],
    style: Style,
    context: GlobalContext
  ): Atom =>
    new AccentAtom(command, args[0] as Atom[], context, {
      accentChar: ACCENTS[command.slice(1)],
      style,
    }),
});

defineFunction(['widehat', 'widecheck', 'widetilde'], '{body:auto}', {
  createAtom: (
    command: string,
    args: Argument[],
    style: Style,
    context: GlobalContext
  ): Atom => {
    // Pick the correct SVG template based on the length of the body
    const baseString = parseArgAsString(args[0] as Atom[]);
    return new AccentAtom(command, args[0] as Atom[], context, {
      style,
      svgAccent:
        command.slice(1) +
        (baseString.length > 5
          ? '4'
          : ['1', '1', '2', '2', '3', '3'][baseString.length]),
    });
  },
});

defineFunction(['overarc', 'overparen', 'wideparen'], '{body:auto}', {
  createAtom: (
    command: string,
    args: Argument[],
    style: Style,
    context: GlobalContext
  ): Atom => {
    return new AccentAtom(command, args[0] as Atom[], context, {
      style,
      svgAccent: 'overarc',
    });
  },
});
defineFunction(['underarc', 'underparen'], '{body:auto}', {
  createAtom: (
    command: string,
    args: Argument[],
    style: Style,
    context: GlobalContext
  ): Atom => {
    return new OverunderAtom(command, context, {
      body: args[0] as Atom[],
      style,
      svgBelow: 'underarc',
    });
  },
});

defineFunction('utilde', '{body:auto}', {
  createAtom: (
    command: string,
    args: Argument[],
    style: Style,
    context: GlobalContext
  ): Atom => {
    const baseString = parseArgAsString(args[0] as Atom[]);
    const accent =
      'widetilde' +
      (baseString.length > 5
        ? '4'
        : ['1', '1', '2', '2', '3', '3'][baseString.length]);
    return new OverunderAtom(command, context, {
      body: args[0] as Atom[],
      svgBelow: accent,
      style,
      boxType: binRelType(args[0] as Atom[]),
    });
  },
});

/*
 * From plain.tex
 *
 */

defineFunction('^', '{:string}', {
  createAtom: (
    command: string,
    args: Argument[],
    style: Style,
    context: GlobalContext
  ): Atom =>
    new Atom('mord', context, {
      command,
      isFunction: false,
      limits: 'adjacent',
      style,
      value: args[0]
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
          }[args[0] as string] ?? '^'
        : '^',
    }),
});

defineFunction('`', '{:string}', {
  createAtom: (
    command: string,
    args: Argument[],
    style: Style,
    context: GlobalContext
  ): Atom =>
    new Atom('mord', context, {
      command,
      isFunction: false,
      limits: 'adjacent',
      style,
      value: args[0]
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
          }[args[0] as string] ?? '`'
        : '`',
    }),
});

defineFunction("'", '{:string}', {
  createAtom: (
    command: string,
    args: Argument[],
    style: Style,
    context: GlobalContext
  ): Atom =>
    new Atom('mord', context, {
      command,
      isFunction: false,
      limits: 'adjacent',
      style,
      value: args[0]
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
          }[args[0] as string] ?? '\u005E'
        : '\u005E',
    }),
});

defineFunction('~', '{:string}', {
  createAtom: (
    command: string,
    args: Argument[],
    style: Style,
    context: GlobalContext
  ): Atom =>
    new Atom('mord', context, {
      command,
      isFunction: false,
      limits: 'adjacent',
      style,
      value: args[0]
        ? { n: 'ñ', N: 'Ñ', a: 'ã', o: 'õ', A: 'Ã', O: 'Õ' }[
            args[0] as string
          ] ?? '\u00B4'
        : '\u00B4',
    }),
});

defineFunction('c', '{:string}', {
  createAtom: (
    command: string,
    args: Argument[],
    style: Style,
    context: GlobalContext
  ): Atom =>
    new Atom('mord', context, {
      command,
      isFunction: false,
      limits: 'adjacent',
      style,
      value: args[0] ? { c: 'ç', C: 'Ç' }[args[0] as string] ?? '' : '',
    }),
});
