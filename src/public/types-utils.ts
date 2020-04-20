// Extract an array type of valid keys
type Filter<T, Cond, U extends keyof T = keyof T> = {
    [K in U]: T[K] extends Cond ? K : never;
}[U];
export type Keys<T> = Filter<T, Function> & string;
