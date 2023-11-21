import { KeyboardModifiers } from 'ui/events/types';
import { fitInViewport } from 'ui/geometry/utils';
import {
  MenuInterface,
  MenuItemInterface,
  MenuItem,
  RootMenuInterface,
  MenuSelectEvent,
} from './types';
import { _MenuItem } from './menu-item';

/**
 * A collection of menu items.
 *
 * Can be a main menu or a submenu.
 *
 */
export class MenuList implements MenuInterface {
  parentMenu: MenuInterface | null;
  isSubmenuOpen: boolean; // If true, _activeMenuItem.submenu_ is open

  hasCheckbox = false; // If true, has at least one checkbox menu item
  hasRadio = false; // If true, has at least one radio menu item

  private _element: HTMLElement | null = null;
  _menuItems: MenuItemInterface[] = [];
  private _activeMenuItem: MenuItemInterface | null = null;

  /*
   * The menu items template are preserved so that the actual menu items
   * can be recalculated, for example if the keyboard modifiers change.
   * (when Menu.isDynamic is true)
   */
  private _menuItemsDescriptions: MenuItem[];

  private _containerClass?: string;

  constructor(
    menuItems: MenuItem[],
    options?: {
      parentMenu?: MenuInterface;
      containerClass?: string;
    }
  ) {
    this.parentMenu = options?.parentMenu ?? null;

    this._menuItemsDescriptions = [...menuItems];
    this.isSubmenuOpen = false;
    this._containerClass = options?.containerClass;
  }

  handleEvent(event: Event): void {
    if (event.type === 'wheel' && this._element) {
      const ev = event as WheelEvent;
      // Scroll wheel: adjust scroll position
      this._element.scrollBy(0, ev.deltaY);

      // event.preventDefault();
      event.stopPropagation();
    }
  }

  get rootMenu(): RootMenuInterface {
    return this.parentMenu!.rootMenu;
  }

  dispatchEvent(ev: Event): boolean {
    return this.rootMenu.dispatchEvent(ev);
  }

  /**
   * Update the 'model' of this menu (i.e. list of menu items) based
   * on the state of the keyboard
   */
  updateMenu(modifiers?: KeyboardModifiers): void {
    // Save the current menu
    const element = this._element;

    let saveCurrentItem = -1;
    let left = 0;
    let top = 0;
    let parent: Node | undefined | null;
    if (element) {
      // If there is a cached element for this menu,
      // remove it (but save its state)
      saveCurrentItem = this.activeMenuItem
        ? this._menuItems!.indexOf(this.activeMenuItem)
        : -1;
      parent = element.parentNode;
      left = Number.parseInt(element.style.left);
      top = Number.parseInt(element.style.top);
      parent?.removeChild(element);
      this._element = null;
    }

    this._menuItems = this._menuItemsDescriptions.map(
      (x) => new _MenuItem(x, this, modifiers)
    );

    // Make any item list (submenus, etc..) empty, invisible
    for (const item of this._menuItems) {
      if (
        item.items &&
        item.items.reduce((acc, x) => (x.visible ? acc + 1 : acc), 0) === 0
      )
        item.visible = false;
    }
    this.hasCheckbox = this._menuItems.some((x) => x.type === 'checkbox');
    this.hasRadio = this._menuItems.some((x) => x.type === 'radio');

    if (element) {
      // If there was a previous version of the menu,
      // restore it and its state
      parent?.appendChild(this.element);

      fitInViewport(this.element, {
        location: { x: left, y: top },
        verticalPos: 'bottom',
        horizontalPos: 'right',
      });

      this.activeMenuItem =
        saveCurrentItem >= 0 ? this._menuItems[saveCurrentItem] : null;
      if (this.activeMenuItem?.submenu)
        this.activeMenuItem.openSubmenu(modifiers);
    }
  }

  get menuItems(): MenuItem[] {
    return this._menuItemsDescriptions;
  }

  set menuItems(items: MenuItem[]) {
    this._menuItemsDescriptions = items;

    this.updateMenu();

    if (this._menuItems.filter((x) => x.visible).length === 0) this.hide();
  }

  get items(): undefined | MenuItemInterface[] {
    return this._menuItems;
  }

  /** First activable menu item */
  get firstMenuItem(): MenuItemInterface | null {
    let result = 0;
    let found = false;
    const menuItems = this._menuItems;
    while (!found && result <= menuItems.length - 1) {
      const item = menuItems[result];
      found = item.type !== 'divider' && item.visible && item.enabled;
      result += 1;
    }

    return found ? menuItems[result - 1] : null;
  }

  /** Last activable menu item */
  get lastMenuItem(): MenuItemInterface | null {
    const menuItems = this._menuItems;
    let result = menuItems.length - 1;
    let found = false;
    while (!found && result >= 0) {
      const item = menuItems[result];
      found = item.type !== 'divider' && item.visible && item.enabled;
      result -= 1;
    }

    return found ? menuItems[result + 1] : null;
  }

  /**
   * The active menu is displayed on a colored background.
   */
  get activeMenuItem(): MenuItemInterface | null {
    return this._activeMenuItem;
  }

  /**
   * Set to undefined to have no active item.
   * Note that setting the active menu item doesn't automatically
   * open the submenu (e.g. when keyboard navigating).
   * Call `item.submenu.openSubmenu()` to open the submenu.
   */
  set activeMenuItem(value: MenuItemInterface | null) {
    this.parentMenu?.rootMenu.cancelDelayedOperation();
    if (value !== this._activeMenuItem) {
      // Remove previously active element
      if (this.activeMenuItem) {
        const item = this.activeMenuItem;
        item.active = false;
        // If there is a submenu, hide it
        item.submenu?.hide();
      }

      if (!(value?.visible ?? true)) {
        this._activeMenuItem = null;
        return;
      }

      this._activeMenuItem = value;

      // Make new element active
      if (value) value.active = true;
    }

    if (value) value.element?.focus();
    else this._element?.focus();
  }

  nextMenuItem(dir: number): MenuItemInterface | null {
    if (!this._activeMenuItem && dir > 0) return this.firstMenuItem;
    if (!this._activeMenuItem && dir < 0) return this.lastMenuItem;
    if (!this.firstMenuItem || !this.lastMenuItem || !this._activeMenuItem)
      return null;

    const first = this._menuItems.indexOf(this.firstMenuItem);
    const last = this._menuItems.indexOf(this.lastMenuItem);
    let found = false;
    let result = this._menuItems.indexOf(this._activeMenuItem) + dir;
    while (!found && result >= first && result <= last) {
      const item = this._menuItems[result];
      found = item.type !== 'divider' && item.visible && item.enabled;
      result += dir;
    }

    return found
      ? this._menuItems[result - dir]
      : dir > 0
        ? this.lastMenuItem
        : this.firstMenuItem;
  }

  static _collator: Intl.Collator;

  static get collator(): Intl.Collator {
    if (MenuList._collator) return MenuList._collator;
    MenuList._collator = new Intl.Collator(undefined, {
      usage: 'search',
      sensitivity: 'base',
    });
    return MenuList._collator;
  }

  findMenuItem(text: string): MenuItemInterface | null {
    const candidates = this._menuItems.filter(
      (x) => x.type !== 'divider' && x.visible && x.enabled
    );
    if (candidates.length === 0) return null;
    const last =
      Math.max(...candidates.map((x) => x.label.length)) - text.length;

    if (last < 0) return null;

    // Find a "contain" match
    let result: MenuItemInterface | null = null;
    let i = 0;
    while (i < last && !result) {
      result =
        candidates.find(
          (x) =>
            MenuList.collator.compare(
              text,
              x.label.substring(i, text.length)
            ) === 0
        ) ?? null;
      i++;
    }

    return result;
  }

  makeElement(): HTMLElement {
    const menu = document.createElement('menu');
    menu.setAttribute('role', 'menu');
    menu.setAttribute('tabindex', '-1');
    menu.setAttribute('aria-orientation', 'vertical');
    menu.setAttribute('part', 'ui-menu-container');
    if (this._containerClass) menu.classList.add(this._containerClass);
    menu.classList.add('ui-menu-container');
    menu.addEventListener('focus', this);
    menu.addEventListener('wheel', this, { passive: true });

    // Remove consecutive dividers
    let wasDivider = true; // Avoid divider as first item
    for (const item of this._menuItems) {
      if (item.type === 'divider') {
        // Avoid consecutive dividers
        if (wasDivider) item.visible = false;
        wasDivider = true;
      } else if (item.visible) wasDivider = false;
    }

    // Add all visible items
    for (const { element, visible } of this._menuItems)
      if (element && visible) menu.append(element);

    menu.querySelector('li:first-of-type')?.setAttribute('tabindex', '0');

    return menu;
  }

  /**
   * Construct (or return a cached version) of an element representing
   * the items in this menu (model -> view)
   */
  get element(): HTMLElement {
    if (!this._element) this._element = this.makeElement();

    return this._element;
  }

  /**
   * @param container: where the menu should be attached
   * @return false if no menu to show
   */
  show(options: {
    container: Node;
    location?: { x: number; y: number };
    alternateLocation?: { x: number; y: number };
    modifiers?: KeyboardModifiers;
  }): boolean {
    this.updateMenu(options?.modifiers);
    if (this._menuItems.filter((x) => x.visible).length === 0) return false;

    options.container.appendChild(this.element);

    if (options.location) {
      fitInViewport(this.element, {
        location: options.location,
        alternateLocation: options.alternateLocation,
        verticalPos: 'bottom',
        horizontalPos: 'right',
      });
    }

    this.element.focus();

    // Notify our parent we have opened
    // (so the parent can close any other open submenu and/or
    // change its state to display the active state correctly)
    if (this.parentMenu) this.parentMenu.openSubmenu = this;

    return true;
  }

  hide(): void {
    // Hide any of our child submenus
    this.openSubmenu = null;

    this.activeMenuItem = null;

    // Notify our parent
    if (this.parentMenu) this.parentMenu.openSubmenu = null;

    this._element?.parentNode?.removeChild(this._element);
    this._element = null;
  }

  /**
   * This method is called to record that one of our submenus has opened.
   * To open a submenu call openSubmenu() on the item with the submenu
   * or show() on the submenu.
   */
  set openSubmenu(submenu: MenuInterface | null) {
    const expanded = submenu !== null;
    // We're closing a submenu
    if (this.activeMenuItem?.submenu) {
      this.activeMenuItem.element?.setAttribute(
        'aria-expanded',
        expanded.toString()
      );
    }
    // Update secondary state of parent
    this.activeMenuItem?.element?.classList.toggle('is-submenu-open', expanded);

    this.isSubmenuOpen = expanded;
  }

  appendMenuItem(
    menuItem: MenuItem,
    keyboardModifiers?: KeyboardModifiers
  ): void {
    this.insertMenuItem(-1, menuItem, keyboardModifiers);
  }

  insertMenuItem(
    pos: number,
    menuItem: MenuItem,
    modifiers?: KeyboardModifiers
  ): void {
    if (pos < 0) pos = Math.max(0, this._menuItems.length - 1);

    const item = new _MenuItem(menuItem, this, modifiers);

    this._menuItems.splice(pos + 1, 0, item);
  }
}

export function evalToBoolean(
  item: MenuItem,
  value:
    | boolean
    | undefined
    | ((item: MenuItem, keyboardModifiers: KeyboardModifiers) => boolean),
  modifiers?: KeyboardModifiers
): boolean | undefined {
  if (typeof value === 'boolean') return value;

  modifiers ??= { alt: false, control: false, shift: false, meta: false };
  if (typeof value === 'function') return value(item, modifiers);

  return undefined;
}

export function evalToString(
  item: MenuItem,
  value:
    | string
    | undefined
    | ((item: MenuItem, keyboardModifiers: KeyboardModifiers) => string),
  modifiers?: KeyboardModifiers
): string | undefined {
  if (typeof value === 'string') return value;

  modifiers ??= { alt: false, control: false, shift: false, meta: false };

  if (typeof value === 'function') return value(item, modifiers);

  return undefined;
}

declare global {
  /**
   * Map the custom event names to types
   * @internal
   */
  export interface DocumentEventMap {
    ['menu-select']: CustomEvent<MenuSelectEvent>;
  }
}
