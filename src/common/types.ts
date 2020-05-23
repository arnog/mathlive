/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export function isArray(x: any): x is any[] {
    return Array.isArray(x);
}

export function isString(x: any): x is string {
    return typeof x === 'string';
}

export function isNumber(x: any): x is number {
    return typeof x === 'number' && !Number.isNaN(x);
}

export function isFunction(x: any): x is (...args: any[]) => void {
    return typeof x === 'function';
}
