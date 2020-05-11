/* v0.50.4-10-g9cb3b2c-dirty */r/**
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
