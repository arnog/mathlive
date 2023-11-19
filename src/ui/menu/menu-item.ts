import { KeyboardModifiers } from 'ui/events/types';
import { keyboardModifiersFromEvent } from 'ui/events/utils';
import { MenuList } from './menu-list';
import {
  DynamicBoolean,
  DynamicString,
  MenuInterface,
  MenuItemInterface,
  MenuItem,
  MenuSelectEvent,
  MenuItemType,
} from './types';
import { icon } from 'ui/icons/icons';
import { getKeybindingMarkup } from 'ui/events/keyboard';

const BLINK_SPEED = 80;

/**
 * A single menu item.
 *
 * Menu items are grouped in a menulist, which can be a root menu or a submenu.
 *
 */
export class _MenuItem<T> implements MenuItemInterface {
  parentMenu: MenuInterface;
  /** If this menu _type is 'submenu' */
  submenu?: MenuList;

  _type: MenuItemType;
  _label?: string;
  _enabled: boolean;
  _visible: boolean;

  _keyboardShortcut?: string;

  _class?: string;

  id?: string;
  data?: T;

  ariaLabel?: string;
  ariaDetails?: string;
  checked: boolean;
  onMenuSelect?: (props: {
    modifiers: KeyboardModifiers;
    label?: string;
    id?: string;
    data?: T;
    element?: HTMLElement | null;
  }) => void;

  /** The DOM element the menu item is rendered as */
  _element: HTMLElement | null = null;

  constructor(
    template: MenuItem<T>,
    parentMenu: MenuInterface,
    modifiers?: KeyboardModifiers
  ) {
    this.parentMenu = parentMenu;

    this._visible =
      evalToBoolean(template, template.visible, modifiers) ?? true;
    this._enabled =
      evalToBoolean(template, template.enabled, modifiers) ?? true;
    this.checked =
      evalToBoolean(template, template.checked, modifiers) ?? false;

    this._class = template.class;
    this._keyboardShortcut = template.keyboardShortcut;

    this.id = template.id;
    this._label = evalToString(template, template.label, modifiers);
    this.ariaLabel = evalToString(template, template.ariaLabel, modifiers);
    this.ariaDetails = evalToString(template, template.ariaDetails, modifiers);
    if (typeof template.onMenuSelect === 'function')
      this.onMenuSelect = template.onMenuSelect;

    this.data = template.data;

    if (Array.isArray(template.submenu)) {
      this._type = 'submenu';
      this.submenu = new MenuList(template.submenu, {
        parentMenu,
        containerClass: template.containerClass,
      });
      this.submenu.updateMenu(modifiers);
    } else if (template.type === undefined && template.checked !== undefined)
      this._type = 'checkbox';
    else this._type = template.type ?? 'command';
  }
  get type(): MenuItemType {
    return this._type;
  }

  get label(): string {
    return this._label ?? this.ariaLabel ?? '';
  }

  get visible(): boolean {
    return this._visible;
  }
  set visible(value: boolean) {
    this._visible = value;
    if (this.element) this.element.hidden = !value;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get items(): MenuItemInterface[] | undefined {
    if (this.type === 'submenu' && this.submenu) return this.submenu.items;
    return undefined;
  }

  private render(): HTMLElement | null {
    if (!this.visible) return null;

    if (this.type === 'divider') {
      const li = document.createElement('li');
      if (this._class) li.className = this._class;
      li.setAttribute('part', 'menu-divider');
      li.setAttribute('role', 'divider');
      return li;
    }

    if (
      this.type !== 'command' &&
      this.type !== 'submenu' &&
      this.type !== 'radio' &&
      this.type !== 'checkbox'
    )
      return null;

    const li = document.createElement('li');
    if (this._class) li.className = this._class;
    li.setAttribute('part', 'menu-item');
    li.setAttribute('tabindex', '-1');
    if (this.type === 'radio') li.setAttribute('role', 'menuitemradio');
    else if (this.type === 'checkbox')
      li.setAttribute('role', 'menuitemcheckbox');
    else li.setAttribute('role', 'menuitem');

    if (this.checked) {
      li.setAttribute('aria-checked', 'true');
      li.append(icon('checkmark')!);
    }

    if (this.submenu) {
      li.setAttribute('aria-haspopup', 'true');
      li.setAttribute('aria-expanded', 'false');
    }

    if (this.ariaLabel) li.setAttribute('aria-label', this.ariaLabel);
    if (this.ariaDetails) li.setAttribute('aria-details', this.ariaDetails);

    if (!this.enabled) li.setAttribute('aria-disabled', 'true');
    else {
      li.addEventListener('pointerenter', this);
      li.addEventListener('pointerleave', this);
      li.addEventListener('pointerup', this);
    }

    const span = document.createElement('span');
    span.innerHTML = this.label;
    span.className =
      this.parentMenu.hasCheckbox || this.parentMenu.hasRadio
        ? 'label indent'
        : 'label';
    if (this.enabled) {
      span.addEventListener('click', (ev: MouseEvent) => {
        this.select(keyboardModifiersFromEvent(ev));
      });
    }

    li.append(span);

    if (this._keyboardShortcut) {
      const kbd = document.createElement('kbd');
      kbd.innerHTML = getKeybindingMarkup(this._keyboardShortcut);
      li.append(kbd);
    }

    if (this.submenu) li.append(icon('chevron-right')!);

    return li;
  }

  get active(): boolean {
    return this.element?.classList.contains('active') ?? false;
  }

  set active(value: boolean) {
    if (!this.element) return;
    if (value) this.element.classList.add('active');
    else this.element.classList.remove('active');
  }

  get element(): HTMLElement | null {
    if (this._element) return this._element;
    this._element = this.render();
    return this._element;
  }

  /** Dispatch a menu-select event, and call the
   * `onMenuSelect()` hook if defined.
   */
  dispatchSelect(modifiers?: KeyboardModifiers): void {
    modifiers ??= { alt: false, control: false, shift: false, meta: false };

    const ev = new CustomEvent<MenuSelectEvent>('menu-select', {
      cancelable: true,
      bubbles: true,
      detail: {
        modifiers,
        id: this.id,
        label: this.label,
        data: this.data,
        element: this.element ?? undefined,
      },
    });

    const notCanceled = this.parentMenu.dispatchEvent(ev);

    if (notCanceled && typeof this.onMenuSelect === 'function') {
      this.onMenuSelect({
        modifiers,
        label: this.label,
        id: this.id,
        data: this.data,
        element: this.element,
      });
    }
  }

  handleEvent(event: Event): void {
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
          if (this.submenu) this.openSubmenu(keyboardModifiersFromEvent(ev));
        });
      } else {
        this.parentMenu.activeMenuItem = this;
        if (this.submenu) {
          this.openSubmenu(keyboardModifiersFromEvent(ev), {
            withDelay: true,
          });
        }
      }
    } else if (event.type === 'pointerleave') {
      if (this.parentMenu.rootMenu.activeMenu === this.parentMenu)
        this.parentMenu.activeMenuItem = null;
    } else if (event.type === 'pointerup') {
      // When modal, the items are activated on click,
      // so ignore mouseup
      if (this.parentMenu.rootMenu.state !== 'modal')
        this.select(keyboardModifiersFromEvent(event));

      event.stopPropagation();
      event.preventDefault();
    }
  }

  /**
   * Called when a menu item is selected:
   * - either dismiss the menu and execute the command
   * - or display the submenu
   */
  select(kbd?: KeyboardModifiers): void {
    this.parentMenu.rootMenu.cancelDelayedOperation();

    if (this.submenu) {
      this.openSubmenu(kbd);
      return;
    }

    // Make the item blink, then execute the command
    this.active = false;
    setTimeout(() => {
      this.active = true;
      setTimeout(() => {
        this.parentMenu.rootMenu.hide();
        this.dispatchSelect(kbd);
      }, BLINK_SPEED);
    }, BLINK_SPEED);
  }

  /**
   * Open the submenu of this menu item, with a delay if options.delay
   * This delay improves targeting of submenus with the mouse.
   */
  openSubmenu(
    modifiers?: KeyboardModifiers,
    options?: { withDelay: boolean }
  ): void {
    if (!this.submenu || !this.element) return;
    if (options?.withDelay ?? false) {
      this.parentMenu.rootMenu.scheduleOperation(() => {
        this.openSubmenu(modifiers);
      });
      return;
    }

    const bounds = this.element.getBoundingClientRect();
    this.submenu.show({
      container: this.parentMenu.rootMenu.element!.parentNode!,
      location: { x: bounds.right, y: bounds.top - 4 },
      alternateLocation: { x: bounds.left, y: bounds.top - 4 },
      modifiers: modifiers,
    });
  }

  movingTowardSubmenu(ev: PointerEvent): boolean {
    if (!this.element) return false;
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
  // return Math.sqrt(dx * dx + dy * dy) / dt;
}

function evalToBoolean(
  item: MenuItem,
  value: DynamicBoolean | undefined,
  modifiers?: KeyboardModifiers
): boolean | undefined {
  if (typeof value === 'boolean') return value;
  modifiers ??= { alt: false, control: false, shift: false, meta: false };

  if (typeof value === 'function') {
    return value({
      modifiers,
      id: item.id,
      data: item.data,
    });
  }
  return undefined;
}

function evalToString(
  item: MenuItem,
  value: DynamicString | undefined,
  modifiers?: KeyboardModifiers
): string | undefined {
  if (typeof value === 'string') return value;
  modifiers ??= { alt: false, control: false, shift: false, meta: false };

  if (typeof value === 'function') {
    return value({
      modifiers,
      id: item.id,
      data: item.data,
    });
  }
  return undefined;
}
