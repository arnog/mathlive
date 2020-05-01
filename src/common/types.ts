export function isArray(array: any): array is any[] {
    return Array.isArray(array);
}

export function isString(str: any): str is string {
    return typeof str === 'string';
}

export function isNumber(obj: any): obj is number {
    return typeof obj === 'number' && !isNaN(obj);
}

export function isFunction(obj: any): obj is Function {
    return typeof obj === 'function';
}
