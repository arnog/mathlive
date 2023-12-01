import { KeyboardModifiers } from 'public/events-types';
import { _MenuListState } from './menu-list';
import {
  MenuItem,
  MenuSelectEventDetail,
  MenuItemType,
  DynamicValue,
  MenuItemProps,
} from '../../public/menu-types';
import { icon } from 'ui/icons/icons';
import { getKeybindingMarkup } from 'ui/events/keyboard';
import { MenuItemState, MenuListState } from './private-types';
import { getEdge } from 'ui/geometry/utils';
import { getComputedDir } from 'ui/i18n/utils';

const BLINK_SPEED = 80;

/**
 *
 * A menu item is described by a `MenuItem<T>` object.
 *
 * The MenuItemState object keeps track of the current state of
 * the menu item (checked, current label given modifiers, etc...)
 *
 * Menu items are grouped in a menulist, which can be a root menu
 * or a submenu.
 *
 * @internal
 */
export class _MenuItemState<T> implements MenuItemState<T> {
  parentMenu: MenuListState;

  /** If this menu _type is 'submenu' */
  submenu?: _MenuListState;

  _template: MenuItem<T>;

  _type: MenuItemType;

  _label: string;
  _ariaLabel?: string;
  _ariaDetails?: string;
  _tooltip: string | undefined;

  _enabled: boolean;
  _visible: boolean;
  _checked: boolean | 'mixed';

  /** The DOM element the menu item is rendered as */
  _element: HTMLElement | null = null;

  _abortController: AbortController;

  constructor(template: MenuItem<T>, parentMenu: MenuListState) {
    this.parentMenu = parentMenu;

    this._abortController = new AbortController();

    this._template = template;

    if (template.submenu) {
      this._type = 'submenu';
      this.submenu = new _MenuListState(template.submenu, {
        parentMenu,
        containerClass: template.containerClass,
      });
    } else if (template.type === undefined && template.checked !== undefined)
      this._type = 'checkbox';
    else this._type = template.type ?? 'command';
  }

  dispose(): void {
    this._abortController.abort();
    this._element?.remove();
    this._element = null;
    if (this.submenu) this.submenu.dispose();
  }

  get menuItem(): MenuItem<T> {
    return this._template;
  }

  get type(): MenuItemType {
    return this._type;
  }

  get label(): string {
    return this._label ?? '';
  }
  set label(value: string | undefined) {
    if (value === undefined) value = '';
    if (value === this._label) return;
    this._label = value;
    this.dirty = true;
  }

  get visible(): boolean {
    return this._visible;
  }
  set visible(value: boolean) {
    if (value === this._visible) return;
    this._visible = value;
    // This could cause the parent menu to no longer be visible,
    // so dirty it so the dirty state can propagate up
    this.dirty = true;
  }

  get enabled(): boolean {
    return this._enabled;
  }
  set enabled(value: boolean) {
    this._enabled = value;
    if (this.element) {
      // We can modify the state directly, so no need to dirty it
      if (value) this.element.removeAttribute('aria-disabled');
      else this.element.setAttribute('aria-disabled', 'true');
    }
  }

  get checked(): boolean | 'mixed' {
    return this._checked;
  }
  set checked(value: boolean | 'mixed') {
    this._checked = value;
    this.dirty = true;
  }

  get tooltip(): string | undefined {
    return this._tooltip;
  }
  set tooltip(value: string | undefined) {
    if (value === this._tooltip) return;
    this._tooltip = value;
    this.dirty = true;
  }

  get ariaLabel(): string | undefined {
    return this._ariaLabel;
  }
  set ariaLabel(value: string | undefined) {
    if (value === this._ariaLabel) return;
    this._ariaLabel = value;
    this.dirty = true;
  }

  get ariaDetails(): string | undefined {
    return this._ariaDetails;
  }
  set ariaDetails(value: string | undefined) {
    if (value === this._ariaDetails) return;
    this._ariaDetails = value;
    this.dirty = true;
  }

  get active(): boolean {
    return this.element?.classList.contains('active') ?? false;
  }

  set active(value: boolean) {
    if (!this.element) return;
    // The active state is immediate, no need to dirty it
    if (value) this.element.classList.add('active');
    else this.element.classList.remove('active');
  }

  get items(): MenuItemState[] | undefined {
    return this.submenu?.items;
  }

  update(modifiers?: KeyboardModifiers): void {
    const template = this._template;

    if (template.type === 'divider') {
      this.enabled = false;
      this.checked = false;
      return;
    }

    if (template.type === 'heading') {
      this.enabled = false;
      this.checked = false;
      this.visible = true;
    } else {
      this.checked =
        dynamicValue<boolean | 'mixed', T>(
          template,
          template.checked,
          modifiers
        ) ?? false;
      this.enabled =
        dynamicValue<boolean, T>(template, template.enabled, modifiers) ?? true;
      this.visible =
        dynamicValue<boolean, T>(template, template.visible, modifiers) ?? true;
      if (this.visible && this.enabled && this.submenu) {
        this.submenu.update(modifiers);
        if (!this.submenu.visible) this.visible = false;
      }
    }

    this.label = dynamicValue<string, T>(template, template.label, modifiers);
    this.tooltip = dynamicValue<string, T>(
      template,
      template.tooltip,
      modifiers
    );
    this.ariaLabel = dynamicValue<string, T>(
      template,
      template.ariaLabel,
      modifiers
    );
    this.ariaDetails = dynamicValue<string, T>(
      template,
      template.ariaDetails,
      modifiers
    );

    if (this._element) this.updateElement();
  }

  set dirty(value: boolean) {
    console.assert(value === true);
    if (value && this.parentMenu) this.parentMenu.dirty = true;
  }

  private updateElement(): void {
    if (!this.visible || !this.element) return;

    const li = this.element;
    // Reset the content of the menu item
    li.textContent = '';

    if (!this.enabled) li.setAttribute('aria-disabled', 'true');
    else li.removeAttribute('aria-disabled');

    if (this.checked === true) {
      li.setAttribute('aria-checked', 'true');
      li.append(icon('checkmark')!);
    } else if (this.checked === 'mixed') {
      li.setAttribute('aria-checked', 'mixed');
      li.append(icon('mixedmark')!);
    } else li.removeAttribute('aria-checked');

    //
    // Create the label
    //
    if (this.ariaLabel) li.setAttribute('aria-label', this.ariaLabel);
    if (this.ariaDetails) li.setAttribute('aria-details', this.ariaDetails);

    const span = document.createElement('span');
    span.className = this.parentMenu.hasCheck ? 'label indent' : 'label';

    if (this.type === 'heading') span.classList.add('heading');

    span.innerHTML = this.label;

    li.append(span);

    //
    // Tooltip
    //

    if (this._tooltip) {
      // li.setAttribute('title', this._tooltip);
      li.setAttribute('data-tooltip', this._tooltip);
    }

    //
    // Keyboard shortcut
    //

    if (this._template.keyboardShortcut) {
      const kbd = document.createElement('kbd');
      kbd.innerHTML = getKeybindingMarkup(this._template.keyboardShortcut);
      li.append(kbd);
    }

    if (this.type === 'submenu') li.append(icon('trailing-chevron')!);
  }

  get element(): HTMLElement | null {
    if (this._element) return this._element;

    if (this.type === 'divider') {
      const li = document.createElement('li');
      if (this._template.class) li.className = this._template.class;
      li.setAttribute('part', 'menu-divider');
      li.setAttribute('role', 'divider');

      this._element = li;
      return li;
    }

    const li = document.createElement('li');
    this._element = li;
    if (this._template.class) li.className = this._template.class;

    li.setAttribute('part', 'menu-item');
    li.setAttribute('tabindex', '-1');
    if (this.type === 'radio') li.setAttribute('role', 'menuitemradio');
    else if (this.type === 'checkbox')
      li.setAttribute('role', 'menuitemcheckbox');
    else li.setAttribute('role', 'menuitem');

    if (this.type === 'submenu') {
      li.setAttribute('aria-haspopup', 'true');
      li.setAttribute('aria-expanded', 'false');
    }

    //
    // Add event listeners
    //
    const signal = this._abortController.signal;
    li.addEventListener('pointerenter', this, { signal });
    li.addEventListener('pointerleave', this, { signal });
    li.addEventListener('pointerup', this, { signal });
    li.addEventListener('click', this, { signal });

    return this._element;
  }

  /** Dispatch a `menu-select` event, and call the
   * `onMenuSelect()` hook if defined.
   */
  dispatchSelect(): void {
    const ev = new CustomEvent<MenuSelectEventDetail>('menu-select', {
      cancelable: true,
      bubbles: true,
      detail: {
        modifiers: this.parentMenu.rootMenu.modifiers,
        id: this._template.id,
        label: this.label,
        data: this._template.data,
        element: this.element ?? undefined,
      },
    });

    const notCanceled = this.parentMenu.dispatchEvent(ev);

    if (notCanceled && typeof this._template.onMenuSelect === 'function') {
      this._template.onMenuSelect({
        modifiers: this.parentMenu.rootMenu.modifiers,
        label: this.label,
        id: this._template.id,
        data: this._template.data,
      });
    }
  }

  handleEvent(event: Event): void {
    if (!this.visible || !this.enabled) return;

    if (event.type === 'click') {
      this.select();
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    if (event.type === 'pointerenter') {
      const ev = event as PointerEvent;
      this.parentMenu.rootMenu.cancelDelayedOperation();
      // If there is a submenu open, and the mouse is moving in the
      // triangle formed from the current mouse location and the two
      // adjacent corners of the open menu, schedule setting the new
      // active menuitem to later
      if (
        this.parentMenu.isSubmenuOpen &&
        this.parentMenu.activeMenuItem?.movingTowardSubmenu(ev)
      ) {
        this.parentMenu.rootMenu.scheduleOperation(() => {
          this.parentMenu.activeMenuItem = this;
          this.openSubmenu();
        });
      } else {
        this.parentMenu.activeMenuItem = this;
        this.openSubmenu({ withDelay: true });
      }
      return;
    }

    if (event.type === 'pointerleave') {
      if (this.parentMenu.rootMenu.activeSubmenu === this.parentMenu)
        this.parentMenu.activeMenuItem = null;
      return;
    }

    if (event.type === 'pointerup') {
      // When modal, the items are activated on click,
      // so ignore mouseup
      if (this.parentMenu.rootMenu.state !== 'modal') this.select();

      event.stopPropagation();
      event.preventDefault();
      return;
    }
  }

  /**
   * Called when a menu item is selected:
   * - either dismiss the menu and execute the command
   * - or display the submenu
   */
  select(): void {
    this.parentMenu.rootMenu.cancelDelayedOperation();

    if (this.type === 'submenu') {
      this.openSubmenu();
      return;
    }

    // Make the item blink, then execute the command
    this.active = false;
    setTimeout(() => {
      this.active = true;
      setTimeout(() => {
        this.parentMenu.rootMenu.hide();
        this.dispatchSelect();
      }, BLINK_SPEED);
    }, BLINK_SPEED);
  }

  /**
   * Open the submenu of this menu item, with a delay if options.delay
   * This delay improves targeting of submenus with the mouse.
   */
  openSubmenu(options?: { withDelay: boolean }): void {
    if (this.type !== 'submenu' || !this.element) return;

    if (options?.withDelay ?? false) {
      this.parentMenu.rootMenu.scheduleOperation(() => this.openSubmenu());
      return;
    }

    const bounds = this.element.getBoundingClientRect();
    const dir = getComputedDir(this.element);
    this.submenu!.show({
      container: this.parentMenu.rootMenu.element!.parentNode!,
      location: { x: getEdge(bounds, 'trailing', dir), y: bounds.top - 4 },
      alternateLocation: {
        x: getEdge(bounds, 'leading', dir),
        y: bounds.top - 4,
      },
    });
  }

  movingTowardSubmenu(ev: PointerEvent): boolean {
    if (!this.element) return false;
    if (this.type !== 'submenu') return false;
    const lastEv = this.parentMenu.rootMenu.lastMoveEvent;
    if (!lastEv) return false;

    const deltaT = ev.timeStamp - lastEv.timeStamp;
    if (deltaT > 500) return false;

    const deltaX = ev.clientX - lastEv.clientX;

    // Moving too slow?
    const s = speed(deltaX, lastEv.clientY - ev.clientY, deltaT);
    if (s <= 0.2) return false;

    // Moving horizontally towards the submenu?
    let position: 'left' | 'right' = 'right';
    if (this.submenu!.element) {
      const submenuBounds = this.submenu!.element.getBoundingClientRect();

      const bounds = this.element.getBoundingClientRect();
      if (submenuBounds.left < bounds.left + bounds.width / 2)
        position = 'left';
    }

    return position === 'right' ? deltaX > 0 : deltaX < 0;
  }
}

function speed(dx: number, dy: number, dt: number): number {
  return Math.hypot(dx, dy) / dt;
}

function dynamicValue<T, U>(
  item: MenuItem<U>,
  value: DynamicValue<T, U> | undefined,
  modifiers?: KeyboardModifiers
): T | undefined {
  if (value === undefined || typeof value !== 'function') return value;

  modifiers ??= { alt: false, control: false, shift: false, meta: false };

  return (value as (props: MenuItemProps<U>) => T)({
    modifiers,
    id: item.id,
    group: item.group,
    data: item.data,
  });
}
