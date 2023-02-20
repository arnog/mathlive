import { PromptAtom } from '../core-atoms/prompt';
import { Atom } from 'core/atom-class';
import { GlobalContext, PrivateStyle } from '../core/context';
import { Argument, defineFunction } from './definitions-utils';

defineFunction('prompt', '{body:auto}', {
  createAtom: (
    command: string,
    args: Argument[],
    style: PrivateStyle,
    context: GlobalContext
  ): Atom => {
    return new PromptAtom(command, args[0] as Atom[], context);
  },
});
