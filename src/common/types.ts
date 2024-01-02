export function isArray<T = any>(x: unknown): x is T[] {
  return Array.isArray(x);
}
