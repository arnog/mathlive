import type { Range } from '../public/mathfield';
import { ModelPrivate } from './model-private';

/**
 * @todo: handle RegExp
 */
export function find(model: ModelPrivate, value: string | RegExp): Range[] {
    if (typeof value !== 'string') return []; // @todo: handle RegExp

    const result = [];
    const lastOffset = model.lastOffset;

    for (let i = 0; i < lastOffset; i++) {
        const depth = model.at(i).treeDepth;
        // @todo: adjust for depth, use the smallest depth of start and end
        // and adjust start/end to be at the same depth
        // if parent of start and end is not the same,
        // look at common ancestor, if start's parent is common ancestor,
        // use start, otherwise start =  position of common ancestor.
        // if end's parent is common ancestor, use end, otherwise use position
        // of common ancestor + 1.
        // And maybe that "adjustment" need to be in getValue()? but then
        // the range result might include duplicates
        for (let j = i; j < lastOffset; j++) {
            let fragment = '';
            for (let k = i + 1; k <= j; k++) {
                if (model.at(k).treeDepth === depth) {
                    fragment += model.atomToString(model.at(k), 'latex');
                    console.log(
                        `fragment(${
                            i + 1
                        }, ${j}) = "${fragment}" = '${model.getValue(i, j)}'`
                    );
                }
            }
            if (
                (typeof value === 'string' && value === fragment) ||
                (typeof value !== 'string' && value.test(fragment))
            ) {
                result.push(model.normalizeRange([i, j]));
            }
        }
    }
    return result;
}
