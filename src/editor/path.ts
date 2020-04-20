export interface PathSegment {
    relation: string;
    offset: number;
}

export type Path = PathSegment[];

export interface Selection {
    path: Path;
    extent: number;
}

export function pathToString(path: Path, extent?: number): string {
    let result = '';
    for (const segment of path) {
        result += segment.relation + ':' + segment.offset + '/';
    }
    if (extent) {
        result += '#' + extent;
    }
    return result;
}

export function pathFromString(string: string): Selection {
    // Reset the path
    const result: Selection = { path: [], extent: 0 };

    // Parse the selection extent, if present
    const components = string.split('#');
    if (components.length > 1) {
        result.extent = parseInt(components[1]);
    }

    // Parse the segments
    const segments = components[0].split('/');
    for (const segment of segments) {
        const m2 = segment.match(/([^:]*):(.*)/);
        if (m2) {
            result.path.push({
                relation: m2[1],
                offset: parseInt(m2[2]),
            });
        }
    }

    return result;
}

/**
 * Given two paths, return a path representing their common ancestor.
 */
export function pathCommonAncestor(p: Path, q: Path): Path {
    const result: Path = [];
    const maxIndex = Math.min(p.length - 1, q.length - 1);
    let i = 0;
    while (
        i <= maxIndex &&
        p[i].relation === q[i].relation &&
        p[i].offset === q[i].offset
    ) {
        result.push(p[i]);
        i += 1;
    }
    return result;
}

/**
 *
 * @return 0 if the paths are identical
 *  - 1 if they are siblings
 *  - >1 if they are not siblings
 */
export function pathDistance(p: Path, q: Path): number {
    let result = 0;
    let i = -1;
    let done = false;
    while (!done) {
        i += 1;
        done = i >= p.length || i >= q.length;
        done =
            done ||
            !(p[i].relation === q[i].relation && p[i].offset === q[i].offset);
    }
    if (i === p.length && i === q.length) {
        // They're identical
        result = 0;
    } else if (
        i + 1 === p.length &&
        i + 1 === q.length &&
        p[i].relation === q[i].relation
    ) {
        // They're siblings
        result = 1;
    } else {
        result = 2;
    }

    return result;
}

export function clone(path: Path): Path {
    return pathFromString(pathToString(path)).path;
}
