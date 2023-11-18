import { KeyboardModifiers } from 'ui/events/types';
import { keyboardModifiersFromEvent } from 'ui/events/utils';
import { MenuList } from './menu-list';
import {
  DynamicPredicate,
  DynamicString,
  MenuInterface,
  MenuItemInterface,
  MenuItemTemplate,
  MenuSelectEvent,
} from './types';
import { icon } from 'ui/icons/icons';

const BLINK_SPEED = 80;

/**
 * A single menu item.
 *
 * Menu items are grouped in a menulist, which can be a root menu or a submenu.
 *
 */
export class MenuItem implements MenuItemInterface {
  parentMenu: MenuInterface;
  /** If this menu _type is 'submenu' */
  submenu?: MenuInterface;

  _type: 'normal' | 'divider' | 'submenu' | 'checkbox' | 'radio';
  _label?: string;
  _enabled: boolean;
  _visible: boolean;

  ariaLabel?: string;
  ariaDetails?: string;
  checked: boolean;
  onSelect?: (ev: CustomEvent<MenuSelectEvent>) => void;
  id?: string;
  data?: any;

  /** The DOM element the menu item is rendered as */
  _element: HTMLElement | null = null;

  constructor(
    template: MenuItemTemplate,
    parentMenu: MenuInterface,
    options?: {
      keyboardModifiers?: KeyboardModifiers;
    }
  ) {
    this.parentMenu = parentMenu;

    this._visible =
      evalToBoolean(template, template.visible, options?.keyboardModifiers) ??
      true;
    this._enabled =
      evalToBoolean(template, template.enabled, options?.keyboardModifiers) ??
      true;
    this.checked =
      evalToBoolean(template, template.checked, options?.keyboardModifiers) ??
      false;

    this.id = template.id;
    this._label = evalToString(template, template.label, options);
    this.ariaLabel = evalToString(template, template.ariaLabel, options);
    this.ariaDetails = evalToString(template, template.ariaDetails, options);
    if (typeof template.onSelect === 'function')
      this.onSelect = template.onSelect;

    this.data = template.data;

    if (Array.isArray(template.submenu)) {
      this._type = 'submenu';
      this.submenu = new MenuList(template.submenu, {
        parentMenu,
      });
    } else if (template.type === undefined && template.checked !== undefined)
      this._type = 'checkbox';
    else this._type = template.type ?? 'normal';
  }
  get type(): 'normal' | 'divider' | 'submenu' | 'checkbox' | 'radio' {
    return this._type;
  }

  get label(): string {
    return this._label ?? this.ariaLabel ?? '';
  }

  get visible(): boolean {
    return this._visible;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  private render(): HTMLElement | null {
    if (!this.visible) return null;

    if (this.type === 'divider') {
      const li = document.createElement('li');
      li.setAttribute('part', 'menu-divider');
      li.setAttribute('role', 'divider');
      return li;
    }

    if (
      this.type !== 'normal' &&
      this.type !== 'submenu' &&
      this.type !== 'radio' &&
      this.type !== 'checkbox'
    )
      return null;

    const li = document.createElement('li');
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
      li.removeAttribute('aria-disabled');
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

  dispatchSelect(kbd?: KeyboardModifiers): void {
    const ev = new CustomEvent<MenuSelectEvent>('select', {
      detail: {
        keyboardModifiers: kbd,
        id: this.id,
        label: this.label,
        data: this.data,
      },
    });
    if (typeof this.onSelect === 'function') this.onSelect(ev);
    else this.parentMenu.dispatchEvent(ev);
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
  openSubmenu(kbd?: KeyboardModifiers, options?: { withDelay: boolean }): void {
    if (!this.submenu || !this.element) return;
    if (options?.withDelay ?? false) {
      this.parentMenu.rootMenu.scheduleOperation(() => {
        this.openSubmenu(kbd);
      });
      return;
    }

    const bounds = this.element.getBoundingClientRect();
    this.submenu.show({
      location: { x: bounds.right, y: bounds.top - 4 },
      alternateLocation: { x: bounds.left, y: bounds.top - 4 },
      parent: this.parentMenu.rootMenu.element?.parentNode ?? null,
      keyboardModifiers: kbd,
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
  item: MenuItemTemplate,
  value: DynamicPredicate | undefined,
  keyboardModifiers?: KeyboardModifiers
): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'function') return value(keyboardModifiers, item);

  return undefined;
}

function evalToString(
  item: MenuItemTemplate,
  value: DynamicString | undefined,
  options?: {
    keyboardModifiers?: KeyboardModifiers;
  }
): string | undefined {
  if (typeof value === 'string') return value;

  if (typeof value === 'function')
    return value(options?.keyboardModifiers, item);

  return undefined;
}
