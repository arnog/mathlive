import { ContentChangeOptions } from '../public/options';
import { ModelPrivate } from './model-private';

export type ModelListeners = {
  onContentWillChange: (
    sender: ModelPrivate,
    options: ContentChangeOptions
  ) => boolean;
  onContentDidChange: (
    sender: ModelPrivate,
    options: ContentChangeOptions
  ) => void;
  onSelectionWillChange: (
    sender: ModelPrivate,
    options: ContentChangeOptions
  ) => void;
  onSelectionDidChange: (sender: ModelPrivate) => void;
  onPlaceholderDidChange: (sender: ModelPrivate, placeholderId: string) => void;
};

export function selectionDidChange(model: ModelPrivate): void {
  if (
    typeof model.listeners?.onSelectionDidChange === 'function' &&
    !model.suppressChangeNotifications
  ) {
    model.suppressChangeNotifications = true;
    model.listeners.onSelectionDidChange(model);
    model.suppressChangeNotifications = false;
  }
}

export function contentWillChange(
  model: ModelPrivate,
  options: ContentChangeOptions = {}
): boolean {
  let result = true;
  if (
    typeof model.listeners?.onContentWillChange === 'function' &&
    !model.suppressChangeNotifications
  ) {
    model.suppressChangeNotifications = true;
    result = model.listeners.onContentWillChange(
      model,
      options as ContentChangeOptions
    );
    model.suppressChangeNotifications = false;
  }
  return result;
}

export function contentDidChange(
  model: ModelPrivate,
  options: ContentChangeOptions
): void {
  if (
    typeof model.listeners?.onContentDidChange === 'function' &&
    !model.suppressChangeNotifications
  ) {
    model.suppressChangeNotifications = true;
    model.listeners.onContentDidChange(model, options as ContentChangeOptions);
    model.suppressChangeNotifications = false;
  }
}

export function placeholderDidChange(
  model: ModelPrivate,
  placeholderId: string
): void {
  if (
    typeof model.listeners?.onPlaceholderDidChange === 'function' &&
    !model.suppressChangeNotifications
  ) {
    model.suppressChangeNotifications = true;
    model.listeners.onPlaceholderDidChange(model, placeholderId);
    model.suppressChangeNotifications = false;
  }
}

export interface Disposable {
  dispose(): void;
}

export type EventListener = (...payload: unknown[]) => void;

export class EventEmitter {
  events: Map<string, EventListener[]>;

  constructor() {
    this.events = new Map();
  }

  addListener(
    event: string,
    listener: EventListener,
    options?: { once?: boolean }
  ): Disposable {
    if (!this.events.has(event)) this.events.set(event, []);

    options = options ?? {};
    if (options.once ?? false) {
      listener = (...payload: unknown[]): void => {
        this.events.get(event)?.filter((x) => x !== listener);
        listener.apply(this, ...payload);
      };
    }

    this.events.get(event)?.push(listener);
    return {
      dispose: (): void => {
        this.events.set(
          event,
          this.events.get(event)!.filter((x) => x !== listener)
        );
      },
    };
  }

  on(event: string, listener: EventListener): Disposable {
    return this.addListener(event, listener);
  }

  once(event: string, listener: EventListener): Disposable {
    return this.addListener(event, listener, { once: true });
  }

  emit(event: string, ...payload: unknown[]): boolean {
    const listeners = this.events.get(event);
    if (listeners && listeners.length > 0) {
      for (const listener of listeners) listener.apply(this, ...payload);
      return true;
    }

    return false;
  }
}

/*
// type User = { name: string };

// interface UserEvents {
//     login(user: User): void;
//     logout(): string;
// }

type Filter<T, Cond, U extends keyof T = keyof T> = {
    [K in U]: T[K] extends Cond ? K : never;
}[U];

type In<T> = T extends (...args: infer U) => any ? U : [];
type Out<T> = T extends () => infer U ? U : never;

// Extract an array type of valid event keys
type EventKey<T> = Filter<T, Function> & string;

// Extract the argument/return types of a valid event
type Arguments<T> = T extends (...args: infer U) => any ? U : [];
type Result<T> = T extends () => infer U ? U : never;

type EventIn<T, K extends EventKey<T>> = In<T[K]>;
type EventOut<T, K extends EventKey<T>> = Out<T[K]> | void;

export type Listener<T, K extends EventKey<T> = EventKey<T>> = (
    ...args: EventIn<T, K>
) => EventOut<T, K>;

export type ListenerMap<T> = Partial<{ [K in EventKey<T>]: Listener<T, K> }>;

interface Emitter<T> {
    on<K extends EventKey<T>>(key: K, fn: Listener<T, K>): typeof fn;
}

// import { EventEmitter } from 'events';
// const ee = (new EventEmitter() as unknown) as Emitter<UserEvents>;

// ee.on('login', (user: string) => {});
// ee.on('logout', () => {
//     return 'done';
// });
*/
