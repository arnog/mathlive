export function isArray<T = any>(x: unknown): x is readonly T[] {
  return Array.isArray(x);
}
