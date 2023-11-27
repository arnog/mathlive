import { KeyboardModifiers } from 'ui/events/types';
import { MenuItem, MenuItemType } from './types';

/** @internal */
export interface MenuItemState<T = unknown> {
  parentMenu: MenuListState;

  active: boolean;
  visible: boolean;

  readonly type: MenuItemType;
  readonly label: string;
  readonly enabled: boolean;
  readonly checked: boolean;
  readonly submenu?: MenuListState;
  readonly items?: MenuItemState[]; // if a list of items
  readonly id?: string;
  readonly data?: T;
  readonly ariaLabel?: string;
  readonly ariaDetails?: string;
  readonly tooltip?: string;

  readonly element: HTMLElement | null;

  readonly menuItem: MenuItem<T>;

  /** Set to true if needs to be refreshed */
  dirty: boolean;

  dispose(): void;

  update(modifiers?: KeyboardModifiers): void;

  /**
   * Open the submenu of this menu item, with a delay if options.delay
   * This delay improves targeting of submenus with the mouse.
   */
  openSubmenu(options?: { withDelay: boolean }): void;
  movingTowardSubmenu(ev: PointerEvent): boolean;

  /**
   * Called when a menu item is selected:
   * - either dismiss the menu and execute the command
   * - or display the submenu
   */
  select(kbd?: KeyboardModifiers): void;
}

/** @internal */
export interface MenuListState {
  parentMenu: MenuListState | null;
  readonly rootMenu: RootMenuState;

  readonly element: HTMLElement | null;
  isSubmenuOpen: boolean;

  activeMenuItem: MenuItemState | null;
  readonly firstMenuItem: MenuItemState | null;
  readonly lastMenuItem: MenuItemState | null;

  openSubmenu: MenuListState | null;
  readonly hasCheck?: boolean;

  /** True if at least one item (except a divider) is enabled */
  readonly enabled: boolean;
  /** True if at least one item (execept a divider) is visible */
  readonly visible: boolean;

  /** Set to true by one of its menu items when the menu item need to be refreshed (flows up) */
  dirty: boolean;

  dispose(): void;
  hide(): void;
  show(options: {
    container: Node | null;
    location?: { x: number; y: number };
    alternateLocation?: { x: number; y: number };
    modifiers?: KeyboardModifiers;
  }): boolean;
  nextMenuItem(dir: number): MenuItemState | null;
  findMenuItem(text: string): MenuItemState | null;
  dispatchEvent(ev: Event): boolean;
}

/** @internal */
export interface RootMenuState extends MenuListState {
  lastMoveEvent?: PointerEvent;
  modifiers: KeyboardModifiers;
  activeSubmenu: MenuListState;
  state: 'closed' | 'open' | 'modal';
  readonly scrim: Element;

  cancelDelayedOperation(): void;
  scheduleOperation(op: () => void): void;
}
