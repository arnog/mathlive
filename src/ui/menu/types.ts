import { KeyboardModifiers } from 'ui/events/types';

export type MenuItem<T = unknown> = {
  /** If no type is specified, defaults to `"command"`, unless
   * a submenu is specified, in which case the type is "submenu"
   */
  type?: MenuItemType;

  /** User defined id string. Passed to the `onMenuSelect()` hook. */
  id?: string;

  /** User defined string identifying a set of related menu items,
   *  for example a group of radio buttons.
   */
  group?: string;

  /** User defined data payload. Passed to the `onMenuSelect()` hook. */
  data?: T;

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

  /** When the menu item is selected, a `menu-select` event is dispatched
   * and this hook is called.
   */
  onMenuSelect?: (props: {
    modifiers: KeyboardModifiers;
    label?: string;
    id?: string;
    data?: T;
  }) => void;

  /** If type is `"submenu"` the child items */
  submenu?: MenuItem[];
};

/**
 * The type of a menu item:
 * - `command`: a command that can be selected and executed
 * - `divider`: a visual separator
 * - `heading`: a heading, not selectable. If following items
 *   (until next divider or heading) are not visible, the heading is not
 *   visible either.
 * - `submenu`: a submenu
 * - `checkbox`: selecting the menu item toggles the checkbox
 * - `radio`: selecting the menu item selects the radio button and remove the
 *    checked state of other menu items in the same group: a group is defined
 *    as the menu items with the same `group` property.
 */
export type MenuItemType =
  | 'command'
  | 'divider'
  | 'heading'
  | 'submenu'
  | 'checkbox'
  | 'radio';

/**
 *
 * This event is dispatched when a menu item is selected.
 *
 * The `detail `property of the event is an object with the following properties:
 * - `id`: the `id` associated with the menu item.
 * - `group`: the `group` this menu item belongs to
 * - `data`: the `data` payload associated with the menu item
 * - `modifiers`: the keyboard modifiers that were pressed when the menu item was selected
 * - `label`: the current `label` of the menu item
 * - `element`: the DOM element of the menu item
 *
 */
export type MenuSelectEventDetail<T = unknown> = {
  id?: string;
  group?: string;
  data?: T;
  modifiers?: KeyboardModifiers;
  label?: string;
  element?: HTMLElement;
};

/**
 * These props passed to the `DynamicString()` and `DynamicBoolean()` functions
 */
export type MenuItemProps<T = unknown> = {
  id?: string;
  group?: string;
  data?: T;
  modifiers?: KeyboardModifiers;
};

export type DynamicString<T> = string | ((props: MenuItemProps<T>) => string);

export type DynamicBoolean<T> =
  | boolean
  | ((props: MenuItemProps<T>) => boolean);

declare global {
  /**
   * Map the custom event names to types
   * @internal
   */
  export interface DocumentEventMap {
    ['menu-select']: CustomEvent<MenuSelectEventDetail>;
  }
}
