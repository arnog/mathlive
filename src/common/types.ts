export function isArray(x: unknown): x is any[] {
  return Array.isArray(x);
}

export function isString(x: unknown): x is string {
  return typeof x === 'string';
}

export function isNumber(x: unknown): x is number {
  return typeof x === 'number' && !Number.isNaN(x);
}

export function isFunction(x: unknown): x is (...args: any[]) => void {
  return typeof x === 'function';
}
