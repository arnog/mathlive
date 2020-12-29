// Extract an array type of valid keys

/**
 * @internal
 */
type Filter<T, Cond, U extends keyof T = keyof T> = {
  [K in U]: T[K] extends Cond ? K : never;
}[U];

/**
 * @internal
 */
export type Keys<T> = Filter<T, (...args: any[]) => any> & string;
