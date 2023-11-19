import { KeyboardModifiers } from 'ui/events/types';

export type MenuSelectEvent<T = unknown> = {
  modifiers?: KeyboardModifiers;
  id?: string;
  label?: string;
  data?: T;
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

export type MenuItemType =
  | 'command'
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

  keyboardShortcut?: string;

  visible?: DynamicBoolean<T>;

  enabled?: DynamicBoolean<T>;

  checked?: DynamicBoolean<T>;

  /** Optional CSS class applied to the menu item */
  class?: string;

  /** If the menu item has an associated container (e.g. submenu)
   * this is the CSS class applied to the container.
   */
  containerClass?: string;

  /** Caller defined id string. Passed to the `onMenuSelect()` hook. */
  id?: string;

  /** Caller defined data block. Passed to the `onMenuSelect()` hook. */
  data?: T;

  /** When the menu item is selected, a `menu-select` event is dispatched
   * and this hook is called.
   */
  onMenuSelect?: (props: { label?: string; id?: string; data?: T }) => void;

  /** If type is `"submenu"`, the items of the submenu */
  submenu?: MenuItem[];
};

export interface MenuItemInterface<T = unknown> {
  parentMenu: MenuInterface;
  active: boolean;

  readonly type: MenuItemType;
  readonly label: string;
  readonly enabled: boolean;
  visible: boolean;
  readonly checked: boolean;
  readonly submenu?: MenuInterface;
  readonly items?: MenuItemInterface[]; // if a list of items
  readonly id?: string;
  readonly data?: T;
  readonly ariaLabel?: string;
  readonly ariaDetails?: string;

  readonly element: HTMLElement | null;

  /**
   * Open the submenu of this menu item, with a delay if options.delay
   * This delay improves targeting of submenus with the mouse.
   */
  openSubmenu(kbd?: KeyboardModifiers, options?: { withDelay: boolean }): void;
  movingTowardSubmenu(ev: PointerEvent): boolean;

  /**
   * Called when a menu item is selected:
   * - either dismiss the menu and execute the command
   * - or display the submenu
   */
  select(kbd?: KeyboardModifiers): void;
}

export interface MenuInterface {
  parentMenu: MenuInterface | null;
  readonly rootMenu: RootMenuInterface;

  readonly element: HTMLElement | null;
  readonly isSubmenuOpen: boolean;

  activeMenuItem: MenuItemInterface | null;
  readonly firstMenuItem: MenuItemInterface | null;
  readonly lastMenuItem: MenuItemInterface | null;

  openSubmenu: MenuInterface | null;
  readonly hasRadio: boolean;
  readonly hasCheckbox: boolean;

  hide(): void;
  show(options: {
    container: Node | null;
    location?: { x: number; y: number };
    alternateLocation?: { x: number; y: number };
    modifiers?: KeyboardModifiers;
  }): boolean;
  nextMenuItem(dir: number): MenuItemInterface | null;
  findMenuItem(text: string): MenuItemInterface | null;
  dispatchEvent(ev: Event): boolean;
}

export interface RootMenuInterface extends MenuInterface {
  lastMoveEvent?: PointerEvent;
  activeMenu: MenuInterface;
  state: 'closed' | 'open' | 'modal';
  readonly scrim: Element;

  cancelDelayedOperation(): void;
  scheduleOperation(op: () => void): void;
}
