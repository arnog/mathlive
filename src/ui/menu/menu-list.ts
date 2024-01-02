import { KeyboardModifiers } from 'public/ui-events-types';
import { fitInViewport } from 'ui/geometry/utils';
import { MenuItem } from '../../public/ui-menu-types';
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

  _menuItems: readonly MenuItemState[];

  private _element: HTMLElement | null = null;
  private _activeMenuItem: MenuItemState | null = null;

  private _submenuClass?: string;

  private _abortController?: AbortController;

  protected _dirty = true;

  readonly columnCount: number;

  constructor(
    items: readonly MenuItem[],
    options?: {
      parentMenu?: MenuListState;
      submenuClass?: string;
      columnCount?: number;
    }
  ) {
    this.parentMenu = options?.parentMenu ?? null;
    this._submenuClass = options?.submenuClass;
    this.columnCount = options?.columnCount ?? 1;

    this.isSubmenuOpen = false;

    this.menuItems = items;
  }

  get children(): readonly MenuItemState[] {
    return this._menuItems;
  }

  /** Setting the menu items will reset this item and
   * redefine a set of _MenuItem objects
   */
  set menuItems(items: readonly MenuItem[]) {
    // Clear any existing menu items
    const parent = this.parentMenu;
    this.dispose();
    this.parentMenu = parent;
    items = [...items];

    // Create the _MenuItemState objects
    this._menuItems = items.map((x) =>
      x['onCreate'] ? x['onCreate'](x, this) : new _MenuItemState(x, this)
    );

    this.hasCheck = undefined;
    this.dirty = true;
  }

  dispose(): void {
    this.hide();
    if (this._element) this._element.remove();
    if (this._abortController) this._abortController.abort();
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

  /**
   * Update the 'model' of this menu (i.e. list of menu items)
   */
  updateState(modifiers?: KeyboardModifiers): void {
    this._menuItems.forEach((x) => x.updateState(modifiers));

    const previousHasCheck = this.hasCheck;
    this.hasCheck = this._menuItems.some((x) => x.visible && x.hasCheck);
    if (this.hasCheck !== previousHasCheck) {
      // If the "hasCheck" state has changed, we need to update the
      // element to reflect the change (the label may need to be shifted)
      this._menuItems.forEach((x) => x.updateState(modifiers));
    }

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

    if (!this.activeMenuItem?.visible) this.activeMenuItem = null;
    if (
      !this.activeMenuItem?.enabled &&
      this.activeMenuItem?.type === 'submenu'
    )
      this._activeMenuItem!.submenu!.hide();

    this._dirty = false;
  }

  get enabled(): boolean {
    this.updateIfDirty();
    return this._menuItems.some(
      (x) => x.type !== 'divider' && x.visible && x.enabled
    );
  }

  get visible(): boolean {
    this.updateIfDirty();
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

  updateIfDirty(): void {
    if (this._dirty) this.updateState(this.rootMenu.modifiers);
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

    if (this._submenuClass) menu.classList.add(this._submenuClass);
    menu.classList.add('ui-menu-container');

    if (!this._abortController) this._abortController = new AbortController();
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

    if (value) value.element?.focus({ preventScroll: true });
    else this._element?.focus({ preventScroll: true });
  }

  /** First activable menu item */
  get firstMenuItem(): MenuItemState | null {
    this.updateIfDirty();
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
    this.updateIfDirty();
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

  nextMenuItem(stride: number): MenuItemState | null {
    if (stride === 0) return this._activeMenuItem;

    if (!this._activeMenuItem)
      return stride > 0 ? this.firstMenuItem : this.lastMenuItem;

    if (!this.firstMenuItem || !this.lastMenuItem || !this._activeMenuItem)
      return null;

    this.updateIfDirty();

    const first = this._menuItems.indexOf(this.firstMenuItem);
    const last = this._menuItems.indexOf(this.lastMenuItem);
    let index = this._menuItems.indexOf(this._activeMenuItem);
    let count = 1;
    while (index >= first && index <= last) {
      index += stride > 0 ? 1 : -1;
      const item = this._menuItems[index];
      if (!item) break;
      if (item.visible && item.enabled) {
        if (count === Math.abs(stride)) return this._menuItems[index];
        count += 1;
      }
    }

    return stride > 0 ? this.lastMenuItem : this.firstMenuItem;
  }

  getMenuItemColumn(menu: MenuItemState): number {
    this.updateIfDirty();
    // Return the column of the item in the menu
    const visibleItems = this._menuItems.filter((x) => x.visible && x.enabled);
    const index = visibleItems.indexOf(menu);
    if (index < 0) return -1;
    return index % this.columnCount;
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
    this.updateIfDirty();

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
   * @param location: in viewport coordinates
   * @param alternateLocation: in viewport coordinates
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
      // @ts-ignore
      this.element.popover = 'manual';
      // @ts-ignore
      this.element.showPopover();
    }

    if (options.location) {
      fitInViewport(this.element, {
        location: options.location,
        alternateLocation: options.alternateLocation,
        verticalPos: 'bottom',
        horizontalPos: 'start',
      });
    }

    this.element.focus({ preventScroll: true });

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

    // @ts-ignore
    if (supportPopover() && this._element?.popover) this.element.hidePopover();

    // Change the focus to avoid a spurious blur event
    this.parentMenu?.element?.focus();

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
