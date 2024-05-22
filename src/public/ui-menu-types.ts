import type { KeyboardModifiers } from './ui-events-types';

/**
 * The type of a menu item:
 * - `command`: a command that can be selected and executed
 * - `divider`: a visual separator
 * - `heading`: a heading, not selectable. If following items
 *   (until next divider or heading) are not visible, the heading is not
 *   visible either.
 * - `submenu`: a submenu
 */
export type MenuItemType = 'command' | 'divider' | 'heading' | 'submenu';

/**
 * These props are passed to the `menu-select` event and `onMenuSelect` hook
 * - `id`: the `id` associated with the menu item.
 * - `data`: the `data` payload associated with the menu item
 * - `modifiers`: the keyboard modifiers that were pressed when the menu item was selected
 */
export type MenuItemProps<T = unknown> = {
  id?: string;
  data?: T;
  modifiers?: KeyboardModifiers;
};

export type DynamicValue<T> = T | ((modifiers: KeyboardModifiers) => T);

declare global {
  /**
   * Map the custom event names to types
   * @internal
   */
  export interface DocumentEventMap {
    ['menu-select']: CustomEvent<MenuItemProps>;
  }
}

export type MenuItemCommand<T = unknown> = {
  type?: 'command';

  /** A string of HTML markup used to describe the item */
  label?: DynamicValue<string>;

  /** An accessible text string that describes the item.
   * Usually not necessary, as the `label` is used for this,
   * however if the menu item is for example a color swatch,
   * the `ariaLabel` can be used to describe the color.
   */
  ariaLabel?: DynamicValue<string>;

  tooltip?: DynamicValue<string>;

  /** A CSS class applied to the item */
  class?: string;

  keyboardShortcut?: string;

  visible?: DynamicValue<boolean>;
  enabled?: DynamicValue<boolean>;
  checked?: DynamicValue<boolean | 'mixed'>;

  /** This id string is passed to the `onMenuSelect()` hook and with the `menu-select` event */
  id?: string;

  /** This data payload is passed to the `onMenuSelect()` hook and with the `menu-select` event  */
  data?: T;

  /** When this menu item is selected, a `menu-select` event is dispatched
   * and this hook is called.
   */
  onMenuSelect?: (_: {
    target: EventTarget | undefined;
    modifiers: KeyboardModifiers;
    id?: string;
    data?: T;
  }) => void;
};

/** A divider is a visual separator between menu items.
 * It is not selectable.
 */
export type MenuItemDivider = {
  type: 'divider';
};

/** A heading is a menu item that is not selectable
 * and used to group menu items.
 *
 * If followiung items (until next divider or heading) are not visible, the heading is not
 *   visible either.
 */
export type MenuItemHeading = {
  type: 'heading';

  label?: DynamicValue<string>;
  ariaLabel?: DynamicValue<string>;
  tooltip?: DynamicValue<string>;
  class?: string;
};

export type MenuItemSubmenu = {
  type?: 'submenu';

  label?: DynamicValue<string>;
  ariaLabel?: DynamicValue<string>;
  tooltip?: DynamicValue<string>;
  class?: string;

  submenu: readonly MenuItem[];

  visible?: DynamicValue<boolean>;
  enabled?: DynamicValue<boolean>;

  /**
   *
   * If the menu is arranged in a custom grid, this is the number of columns.
   *
   * This property is used for keyboard navigation with the arrow keys.
   *
   * **Default**: 1.
   *
   */
  columnCount?: number;

  /** The class applied to the submenu container.
   */
  submenuClass?: string;
};

export function isSubmenu(item: MenuItem): item is MenuItemSubmenu {
  return 'submenu' in item;
}

export function isCommand<T>(item: MenuItem<T>): item is MenuItemCommand<T> {
  return (
    ('type' in item && item.type === 'command') ||
    'onMenuSelect' in item ||
    'id' in item
  );
}

export function isDivider(item: MenuItem): item is MenuItemDivider {
  return 'type' in item && item.type === 'divider';
}

export function isHeading(item: MenuItem): item is MenuItemHeading {
  return 'type' in item && item.type === 'heading';
}

/** Declaration of a menu item */
export type MenuItem<T = unknown> =
  | MenuItemDivider
  | MenuItemHeading
  | MenuItemSubmenu
  | MenuItemCommand<T>;
