import { KeyboardModifiers } from 'ui/events/types';

/** This event is dispatched when a menu item is
 * selected.
 *
 * The `detail `property of the event is an object with the following properties:
 * - `modifiers`: the keyboard modifiers that were pressed when the menu item was selected
 * - `id`: the `id` associated with the menu item
 * - `data`: the `data` payload associated with the menu item
 * - `label`: the current `label` of the menu item
 * - `element`: the DOM element hosting the menu item
 *
 */
export type MenuSelectEvent<T = unknown> = {
  modifiers?: KeyboardModifiers;
  id?: string;
  data?: T;
  label?: string;
  element?: HTMLElement;
};

export type DynamicString<T = unknown> =
  | string
  | ((props: {
      modifiers?: KeyboardModifiers;
      id?: string;
      data?: T;
    }) => string);

export type DynamicBoolean<T = unknown> =
  | boolean
  | ((props: {
      modifiers?: KeyboardModifiers;
      id?: string;
      data?: T;
    }) => boolean);

/**
 * The type of a menu item:
 * - `command`: a command that can be executed
 * - `group`: a group of menu items, represented as a section with an optional header
 * - `divider`: a visual separator
 * - `submenu`: a submenu
 * - `checkbox`: a checkbox: selecting the menu item toggles the checkbox
 * - `radio`: a radio button: selecting the menu item selects the radio button and remove the checked state of other menu items in the same group
 */
export type MenuItemType =
  | 'command'
  | 'group'
  | 'divider'
  | 'submenu'
  | 'checkbox'
  | 'radio';

export type MenuItem<T = unknown> = {
  /** If no type is specified, defaults to "command", unless
   * a submenu is specified, in which case the type is "submenu"
   */
  type?: MenuItemType;

  /** The label is a string of HTML markup used to describe the item */
  label?: DynamicString<T>;
  ariaLabel?: DynamicString<T>;
  ariaDetails?: DynamicString<T>;

  tooltip?: DynamicString<T>;
  keyboardShortcut?: string;

  /**
   *
   * If the menu is arranged in a custom grid, this the number of columns.
   * This is used for keyboard navigation with the arrow keys.
   *
   * **Default**: 1.
   *
   */
  columns?: number;

  visible?: DynamicBoolean<T>;
  enabled?: DynamicBoolean<T>;
  checked?: DynamicBoolean<T>;

  /** Optional CSS class applied to the menu item */
  class?: string;

  /** If the menu item has an associated container (e.g. submenu)
   * this is the CSS class applied to the container.
   */
  containerClass?: string;

  /** User defined id string. Passed to the `onMenuSelect()` hook. */
  id?: string;

  /** User defined data payload. Passed to the `onMenuSelect()` hook. */
  data?: T;

  /** When the menu item is selected, a `menu-select` event is dispatched
   * and this hook is called.
   */
  onMenuSelect?: (props: {
    modifiers: KeyboardModifiers;
    label?: string;
    id?: string;
    data?: T;
  }) => void;

  /** If type is `"submenu"`, the items of the submenu */
  submenu?: MenuItem[];
};

declare global {
  /**
   * Map the custom event names to types
   * @internal
   */
  export interface DocumentEventMap {
    ['menu-select']: CustomEvent<MenuSelectEvent>;
  }
}
