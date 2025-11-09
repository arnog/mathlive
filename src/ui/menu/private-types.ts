import { KeyboardModifiers } from 'public/ui-events-types';
import { MenuItem, MenuItemType } from '../../public/ui-menu-types';

/** @internal */
export interface MenuItemState<T = unknown> {
  readonly rootMenu: RootMenuState;
  readonly parentMenu: MenuListState;

  active: boolean;
  visible: boolean;

  readonly hasCheck: boolean;

  readonly type: MenuItemType;
  readonly label: string;
  readonly ariaLabel?: string;
  readonly tooltip?: string;

  readonly enabled: boolean;
  readonly checked: boolean | 'mixed';

  readonly submenu?: MenuListState;
  readonly id?: string;
  readonly data?: T;

  readonly element: HTMLElement;

  readonly menuItem: MenuItem<T>;

  /** Set to true if needs to be refreshed */
  dirty: boolean;

  dispose(): void;

  updateState(modifiers?: KeyboardModifiers): void;

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
  readonly rootMenu: RootMenuState;
  readonly parentMenu: MenuListState | null;
  readonly children: readonly MenuItemState[];

  readonly element: HTMLElement | null;
  isSubmenuOpen: boolean;

  readonly columnCount: number;

  activeMenuItem: MenuItemState | null;
  readonly firstMenuItem: MenuItemState | null;
  readonly lastMenuItem: MenuItemState | null;

  openSubmenu: MenuListState | null;
  readonly hasCheck?: boolean;

  /** True if at least one item (except a divider) is enabled */
  readonly enabled: boolean;
  /** True if at least one item (except a divider) is visible */
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
  nextMenuItem(stride: number): MenuItemState | null;
  findMenuItem(text: string): MenuItemState | null;
  getMenuItemColumn(menuItem: MenuItemState): number;
  dispatchEvent(ev: Event): boolean;
  host: HTMLElement | null;
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
