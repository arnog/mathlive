import { ParseMode } from '../core/context';
import { Atom, makeRoot } from '../core/atom';
import { Path, clone as clonePath, pathToString } from './path';

export class SelectionIterator {
    root: Atom;

    path: Path; // @revisit: could be called anchor
    extent: number; // @revisit: could group anchor + extent = Selection

    constructor(mode: ParseMode = 'math') {
        this.root = makeRoot(mode);
        this.path = [{ relation: 'body', offset: 0 }];
        this.extent = 0;
    }
    clone(): SelectionIterator {
        const result = new SelectionIterator();
        result.root = this.root;
        result.path = clonePath(this.path);
        result.extent = this.extent;
        return result;
    }
}
