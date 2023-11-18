import { KeyboardModifiers } from 'ui/events/types';

export type MenuSelectEvent<T = any> = {
  keyboardModifiers?: KeyboardModifiers;
  id?: string;
  label?: string;
  data?: T;
  element?: HTMLElement;
};

export type DynamicString =
  | string
  | ((
      keyboardModifiers: KeyboardModifiers | undefined,
      item: MenuItemTemplate
    ) => string);

export type DynamicPredicate =
  | boolean
  | ((
      keyboardModifiers: KeyboardModifiers | undefined,
      item: MenuItemTemplate
    ) => boolean);

export type MenuItemTemplate<T = any> = {
  onSelect?: (ev: CustomEvent<MenuSelectEvent<T>>) => void;
  type?: 'normal' | 'divider' | 'submenu' | 'checkbox' | 'radio';
  className?: string;

  label?: DynamicString;
  ariaLabel?: DynamicString;
  ariaDetails?: DynamicString;

  submenu?: MenuItemTemplate[];

  visible?: DynamicPredicate;

  enabled?: DynamicPredicate;

  checked?: DynamicPredicate;

  /** Caller defined id string. Passed to the `onSelect()` hook. */
  id?: string;

  /** Caller defined data block. Passed to the `onSelect()` hook. */
  data?: T;
};

export interface MenuItemInterface {
  parentMenu: MenuInterface;
  active: boolean;

  readonly type: 'normal' | 'divider' | 'submenu' | 'checkbox' | 'radio';
  readonly label: string;
  readonly enabled: boolean;
  readonly visible: boolean;
  readonly checked: boolean;
  readonly submenu?: MenuInterface;
  readonly id?: string;
  readonly data?: any;
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
    parent: Node | null;
    location?: { x: number; y: number };
    alternateLocation?: { x: number; y: number };
    keyboardModifiers?: KeyboardModifiers;
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
