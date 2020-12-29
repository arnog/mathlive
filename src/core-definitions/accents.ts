import {
  Argument,
  defineFunction,
  parseArgAsString,
} from './definitions-utils';
import { Atom } from '../core/atom-class';
import { AccentAtom } from '../core-atoms/accent';
import { OverunderAtom } from '../core-atoms/overunder';
import { Style } from '../public/core';

const ACCENTS = {
  acute: '\u02CA',
  grave: '\u02CB',
  dot: '\u02D9',
  ddot: '\u00A8',
  mathring: '\u02DA',
  tilde: '\u007E',
  bar: '\u02C9',
  breve: '\u02D8',
  check: '\u02C7',
  hat: '\u005E',
  vec: '\u20D7',
};

defineFunction(Object.keys(ACCENTS), '{body:auto}', {
  createAtom: (command: string, args: Argument[], style: Style): Atom =>
    new AccentAtom(command, args[0] as Atom[], {
      accentChar: ACCENTS[command.slice(1)],
      style,
    }),
});

defineFunction(['widehat', 'widecheck', 'widetilde'], '{body:auto}', {
  createAtom: (command: string, args: Argument[], style: Style): Atom => {
    // Pick the correct SVG template based on the length of the body
    const baseString = parseArgAsString(args[0] as Atom[]);
    return new AccentAtom(command, args[0] as Atom[], {
      style,
      svgAccent:
        command.slice(1) +
        (baseString.length > 5
          ? '4'
          : ['1', '1', '2', '2', '3', '3'][baseString.length]),
    });
  },
});

defineFunction('utilde', '{body:auto}', {
  createAtom: (command: string, args: Argument[], style: Style): Atom => {
    const baseString = parseArgAsString(args[0] as Atom[]);
    const accent =
      'widetilde' +
      (baseString.length > 5
        ? '4'
        : ['1', '1', '2', '2', '3', '3'][baseString.length]);
    return new OverunderAtom(command, {
      body: args[0] as Atom[],
      svgBelow: accent,
      style,
    });
  },
});

/*
 * From plain.tex
 *
 */

defineFunction('^', '{:string}', {
  createAtom: (command: string, args: Argument[], style: Style): Atom =>
    new Atom('mord', {
      command,
      isExtensibleSymbol: false,
      isFunction: false,
      limits: 'nolimits',
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
  createAtom: (command: string, args: Argument[], style: Style): Atom =>
    new Atom('mord', {
      command,
      isExtensibleSymbol: false,
      isFunction: false,
      limits: 'nolimits',
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
  createAtom: (command: string, args: Argument[], style: Style): Atom =>
    new Atom('mord', {
      command,
      isExtensibleSymbol: false,
      isFunction: false,
      limits: 'nolimits',
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
  createAtom: (command: string, args: Argument[], style: Style): Atom =>
    new Atom('mord', {
      command,
      isExtensibleSymbol: false,
      isFunction: false,
      limits: 'nolimits',
      style,
      value: args[0]
        ? { n: 'ñ', N: 'Ñ', a: 'ã', o: 'õ', A: 'Ã', O: 'Õ' }[
            args[0] as string
          ] ?? '\u00B4'
        : '\u00B4',
    }),
});

defineFunction('c', '{:string}', {
  createAtom: (command: string, args: Argument[], style: Style): Atom =>
    new Atom('mord', {
      command,
      isExtensibleSymbol: false,
      isFunction: false,
      limits: 'nolimits',
      style,
      value: args[0] ? { c: 'ç', C: 'Ç' }[args[0] as string] ?? '' : '',
    }),
});
