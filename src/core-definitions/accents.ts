import { Atom } from '../core/atom-class';
import { AccentAtom } from '../core-atoms/accent';
import { OverunderAtom } from '../core-atoms/overunder';
import type { Style } from '../public/core-types';
import type { GlobalContext } from '../core/types';

import {
  Argument,
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
  createAtom: (
    command: string,
    context: GlobalContext,
    style: Style,
    args: Argument[]
  ): Atom =>
    new AccentAtom(command, argAtoms(args[0]), context, {
      accentChar: ACCENTS[command.slice(1)],
      style,
    }),
});

defineFunction(['widehat', 'widecheck', 'widetilde'], '{body:auto}', {
  createAtom: (
    command: string,
    context: GlobalContext,
    style: Style,
    args: Argument[]
  ): Atom => {
    // Pick the correct SVG template based on the length of the body
    const baseString = parseArgAsString(argAtoms(args[0]));
    return new AccentAtom(command, argAtoms(args[0]), context, {
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
    context: GlobalContext,
    style: Style,
    args: Argument[]
  ): Atom => {
    return new AccentAtom(command, argAtoms(args[0]), context, {
      style,
      svgAccent: 'overarc',
    });
  },
});
defineFunction(['underarc', 'underparen'], '{body:auto}', {
  createAtom: (
    command: string,
    context: GlobalContext,
    style: Style,
    args: Argument[]
  ): Atom => {
    return new OverunderAtom(command, context, {
      body: argAtoms(args[0]),
      style,
      svgBelow: 'underarc',
    });
  },
});

defineFunction('utilde', '{body:auto}', {
  createAtom: (
    command: string,
    context: GlobalContext,
    style: Style,
    args: Argument[]
  ): Atom => {
    const baseString = parseArgAsString(argAtoms(args[0]));
    const accent =
      'widetilde' +
      (baseString.length > 5
        ? '4'
        : ['1', '1', '2', '2', '3', '3'][baseString.length]);
    return new OverunderAtom(command, context, {
      body: argAtoms(args[0]),
      svgBelow: accent,
      style,
      boxType: atomsBoxType(argAtoms(args[0])),
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
    context: GlobalContext,
    style: Style,
    args: Argument[]
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
    context: GlobalContext,
    style: Style,
    args: Argument[]
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
    context: GlobalContext,
    style: Style,
    args: Argument[]
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
    context: GlobalContext,
    style: Style,
    args: Argument[]
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
    context: GlobalContext,
    style: Style,
    args: Argument[]
  ): Atom =>
    new Atom('mord', context, {
      command,
      isFunction: false,
      limits: 'adjacent',
      style,
      value: args[0] ? { c: 'ç', C: 'Ç' }[args[0] as string] ?? '' : '',
    }),
});
