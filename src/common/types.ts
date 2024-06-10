export function isArray<T = any>(x: unknown): x is Readonly<T[]> {
  return Array.isArray(x);
}
