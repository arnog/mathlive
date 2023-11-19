import { KeyboardModifiers } from 'ui/events/types';

export type MenuSelectEvent<T = any> = {
  modifiers?: KeyboardModifiers;
  id?: string;
  label?: string;
  data?: T;
  element?: HTMLElement;
};

export type DynamicString =
  | string
  | ((props: {
      modifiers?: KeyboardModifiers;
      id?: string;
      data?: any;
    }) => string);

export type DynamicPredicate =
  | boolean
  | ((props: {
      modifiers?: KeyboardModifiers;
      id?: string;
      data?: any;
    }) => boolean);

export type MenuItemType =
  | 'command'
  | 'divider'
  | 'submenu'
  | 'checkbox'
  | 'radio';

export type MenuItem<T = any> = {
  type?: MenuItemType;

  // className?: string;

  label?: DynamicString;
  ariaLabel?: DynamicString;
  ariaDetails?: DynamicString;

  submenu?: MenuItem[];

  visible?: DynamicPredicate;

  enabled?: DynamicPredicate;

  checked?: DynamicPredicate;

  /** Caller defined id string. Passed to the `onMenuSelect()` hook. */
  id?: string;

  /** Caller defined data block. Passed to the `onMenuSelect()` hook. */
  data?: T;

  /** When the menu item is selected,  */
  onMenuSelect?: (props: { label?: string; id?: string; data?: T }) => void;
};

export interface MenuItemInterface<T = any> {
  parentMenu: MenuInterface;
  active: boolean;

  readonly type: MenuItemType;
  readonly label: string;
  readonly enabled: boolean;
  readonly visible: boolean;
  readonly checked: boolean;
  readonly submenu?: MenuInterface;
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
