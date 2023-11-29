import { KeyboardModifiers } from 'ui/events/types';
import { fitInViewport } from 'ui/geometry/utils';
import { MenuItem } from './types';
import { _MenuItemState } from './menu-item';
import { supportPopover } from 'ui/utils/capabilities';
import { MenuListState, MenuItemState, RootMenuState } from './private-types';

/**
 * A collection of menu items.
 *
 * Can be the root menu or a submenu.
 *
 * @internal
 */
export class _MenuListState implements MenuListState {
  parentMenu: MenuListState | null;
  isSubmenuOpen: boolean; // If true, `activeMenuItem.submenu` is open

  hasCheck?: boolean; // If true, has at least one checkbox or radio menu item

  _menuItems: MenuItemState[];

  private _element: HTMLElement | null = null;
  private _activeMenuItem: MenuItemState | null = null;

  private _containerClass?: string;

  private _abortController: AbortController;

  protected _dirty = false;

  constructor(
    items: MenuItem[],
    options?: {
      parentMenu?: MenuListState;
      containerClass?: string;
    }
  ) {
    this.parentMenu = options?.parentMenu ?? null;
    this._containerClass = options?.containerClass;

    this.isSubmenuOpen = false;
    this._abortController = new AbortController();

    this.menuItems = items;
  }

  /** Setting the menu items will reset this item and
   * redefine a set of _MenuItem objects
   */
  set menuItems(items: MenuItem[]) {
    // Clear any existing menu items
    const parent = this.parentMenu;
    this.dispose();
    this.parentMenu = parent;
    items = [...items];

    // Create the _MenuItem objects
    this._menuItems = items.map((x) => new _MenuItemState(x, this));

    this.hasCheck = undefined;
  }

  dispose(): void {
    this.hide();
    if (this._element) this._element.remove();
    this._abortController.abort();
    this._menuItems?.forEach((x) => x.dispose());
    this._menuItems = [];
    this._activeMenuItem = null;
    this.parentMenu = null;
  }

  handleEvent(event: Event): void {
    if (event.type === 'wheel' && this._element) {
      const ev = event as WheelEvent;
      // Scroll wheel: adjust scroll position
      this._element.scrollBy(0, ev.deltaY);

      event.stopPropagation();
    }
  }

  dispatchEvent(ev: Event): boolean {
    return this.rootMenu.dispatchEvent(ev);
  }

  get rootMenu(): RootMenuState {
    return this.parentMenu!.rootMenu;
  }

  get items(): MenuItemState[] {
    return this._menuItems;
  }

  /**
   * Update the 'model' of this menu (i.e. list of menu items) based
   * on the state of the keyboard
   */
  update(modifiers?: KeyboardModifiers): void {
    this._menuItems.forEach((x) => x.update(modifiers));

    //
    // 1/ Hide headings with no items
    //
    let heading: MenuItemState | undefined = undefined;
    let itemInHeadingCount = 0;
    for (const item of this._menuItems) {
      if (item.type === 'heading') {
        if (heading && itemInHeadingCount === 0) heading.visible = false;
        heading = item;
        itemInHeadingCount = 0;
      } else if (item.type === 'divider' && heading) {
        heading.visible = itemInHeadingCount > 0;
        heading = undefined;
        itemInHeadingCount = 0;
      } else if (heading && item.visible) itemInHeadingCount += 1;
    }
    if (heading) heading.visible = itemInHeadingCount > 0;

    //
    // 2/ Hide consecutive dividers
    //
    let wasDivider = true; // Avoid divider as first item
    for (const item of this._menuItems) {
      if (item.type === 'divider') {
        // Avoid consecutive dividers
        item.visible = !wasDivider;

        wasDivider = true;
      } else if (item.visible) wasDivider = false;
    }

    this.hasCheck = this._menuItems.some(
      (x) => x.visible && (x.type === 'checkbox' || x.type === 'radio')
    );

    if (!this.activeMenuItem?.visible) this.activeMenuItem = null;
    if (
      !this.activeMenuItem?.enabled &&
      this.activeMenuItem?.type === 'submenu'
    )
      this._activeMenuItem!.submenu!.hide();
  }

  get enabled(): boolean {
    return this._menuItems.some(
      (x) => x.type !== 'divider' && x.visible && x.enabled
    );
  }

  get visible(): boolean {
    return this._menuItems.some((x) => x.type !== 'divider' && x.visible);
  }

  set dirty(value: boolean) {
    console.assert(value === true);
    if (this._dirty === value) return;
    if (value && this.parentMenu) {
      this._dirty = true;
      this.parentMenu.dirty = true;
    }
  }

  /** If the element has been created, update its content to reflect
   * the current state of the menu items
   */
  updateElement(): void {
    if (!this._element) return;

    // Remove all the children
    // Note: when we update a menu list, we do not recreate the element:
    // popover may depend on that element remaining the same
    this._element.textContent = '';

    // Add all visible items
    for (const { element, visible } of this._menuItems)
      if (element && visible) this._element.append(element);

    this._element
      .querySelector('li:first-of-type')
      ?.setAttribute('tabindex', '0');
  }

  /**
   * Construct (or return a cached version) of an element representing
   * the items in this menu (model -> view)
   */
  get element(): HTMLElement {
    if (this._element) return this._element;

    const menu = document.createElement('menu');

    menu.setAttribute('role', 'menu');
    menu.setAttribute('tabindex', '-1');
    menu.setAttribute('aria-orientation', 'vertical');
    menu.setAttribute('part', 'ui-menu-container');

    if (this._containerClass) menu.classList.add(this._containerClass);
    menu.classList.add('ui-menu-container');

    const signal = this._abortController.signal;
    menu.addEventListener('focus', this, { signal });
    menu.addEventListener('wheel', this, { passive: true, signal });

    this._element = menu;
    this.updateElement();

    return menu;
  }

  /**
   * The active menu is displayed on a colored background.
   */
  get activeMenuItem(): MenuItemState | null {
    return this._activeMenuItem;
  }

  /**
   * Set to null to have no active item.
   * Note that setting the active menu item doesn't automatically
   * open the submenu (e.g. when keyboard navigating).
   * Call `item.submenu.openSubmenu()` to open the submenu.
   */
  set activeMenuItem(value: MenuItemState | null) {
    this.rootMenu.cancelDelayedOperation();

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

  /** First activable menu item */
  get firstMenuItem(): MenuItemState | null {
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
  get lastMenuItem(): MenuItemState | null {
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

  nextMenuItem(dir: number): MenuItemState | null {
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

  private static _collator: Intl.Collator;

  private static get collator(): Intl.Collator {
    if (_MenuListState._collator) return _MenuListState._collator;
    _MenuListState._collator = new Intl.Collator(undefined, {
      usage: 'search',
      sensitivity: 'base',
    });
    return _MenuListState._collator;
  }

  findMenuItem(text: string): MenuItemState | null {
    const candidates = this._menuItems.filter(
      (x) => x.type !== 'divider' && x.visible && x.enabled
    );
    if (candidates.length === 0) return null;
    const last =
      Math.max(...candidates.map((x) => x.label.length)) - text.length;

    if (last < 0) return null;

    // Find a "contain" match
    let result: MenuItemState | null = null;
    let i = 0;
    while (i < last && !result) {
      result =
        candidates.find(
          (x) =>
            _MenuListState.collator.compare(
              text,
              x.label.substring(i, text.length)
            ) === 0
        ) ?? null;
      i++;
    }

    return result;
  }

  /**
   * @param container: where the menu should be attached
   * @return false if no menu to show
   */
  show(options: {
    container: Node | null;
    location?: { x: number; y: number };
    alternateLocation?: { x: number; y: number };
  }): boolean {
    if (!this.visible || !options.container) return false;

    this.updateElement();
    options.container.appendChild(this.element);

    if (supportPopover()) {
      this.element.popover = 'manual';
      this.element.showPopover();
    }

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

    if (supportPopover() && this._element?.popover) this.element.hidePopover();

    this._element?.parentNode?.removeChild(this._element);
  }

  /**
   * This method is called to record that one of our submenus has opened.
   * To open a submenu call openSubmenu() on the item with the submenu
   * or show() on the submenu.
   */
  set openSubmenu(submenu: MenuListState | null) {
    const expanded = submenu !== null;
    // We're closing a submenu
    if (this.activeMenuItem?.type === 'submenu') {
      this.activeMenuItem.element?.setAttribute(
        'aria-expanded',
        expanded.toString()
      );
    }
    // Update secondary state of parent
    this.activeMenuItem?.element?.classList.toggle('is-submenu-open', expanded);

    this.isSubmenuOpen = expanded;
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
