/* v0.50.5-1-ga8f346d-dirty *//**
 * @internal
 */
declare type Filter<T, Cond, U extends keyof T = keyof T> = {
    [K in U]: T[K] extends Cond ? K : never;
}[U];
/**
 * @internal
 */
export declare type Keys<T> = Filter<T, Function> & string;
export {};
