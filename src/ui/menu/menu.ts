import { KeyboardModifiers } from 'public/ui-events-types';
import {
  keyboardModifiersFromEvent,
  equalKeyboardModifiers,
  mightProducePrintableCharacter,
} from '../events/utils';
import { Scrim } from '../utils/scrim';
import { _MenuListState } from './menu-list';
import {
  MenuItem,
  isCommand,
  isDivider,
  isSubmenu,
} from '../../public/ui-menu-types';
import { RootMenuState, MenuListState } from './private-types';

/**
 *
 * A root menu.
 *
 * It may include submenus.
 *
 */
export class Menu extends _MenuListState implements RootMenuState {
  /**
   * Delay (in milliseconds) before displaying a submenu.
   *
   * Prevents distracting flashing of submenus when moving quickly
   * through the options in a menu.
   */

  static SUBMENU_DELAY = 120;

  /**
   * - 'closed': the menu is not visible
   * - 'open': the menu is visible as long as the mouse button is pressed
   * - 'modal': the menu is visible until dismissed, even with
   *   the mouse button released
   */
  state: 'closed' | 'open' | 'modal' = 'closed';

  /** If true, the state of some of the menu items in this menu are
   * provided by a function and may need to be updated dynamically depending on the state of the keyboard modifiers
   */
  isDynamic: boolean;

  /** @private */
  lastMoveEvent?: PointerEvent;

  /** @private */
  _modifiers: KeyboardModifiers;

  private typingBufferResetTimer = 0;
  private typingBuffer: string;
  private _openTimestamp?: number;
  private _onDismiss?: () => void;
  private hysteresisTimer = 0;
  private _host: HTMLElement | null;

  private _updating = false;

  /**
   * The host is the element that the events will be dispatched from
   *
   */
  constructor(
    menuItems: Readonly<MenuItem[]>,
    options?: { host?: HTMLElement | null }
  ) {
    super(menuItems);
    this._host = options?.host ?? null;
    this.isDynamic = menuItems.some(isDynamic);
    this._modifiers = {
      shift: false,
      control: false,
      alt: false,
      meta: false,
    };
    this.typingBuffer = '';
    this.state = 'closed';
  }

  get modifiers(): KeyboardModifiers {
    return this._modifiers;
  }

  set modifiers(value: KeyboardModifiers) {
    if (equalKeyboardModifiers(this._modifiers, value)) return;
    this._modifiers = value;
    this.dirty = true;
  }

  /**
   * The currently active menu: could be the root menu or a submenu
   */
  get activeSubmenu(): MenuListState {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let result: MenuListState = this;

    while (result.isSubmenuOpen) result = result.activeMenuItem!.submenu!;

    return result;
  }

  set dirty(value: boolean) {
    if (this._updating) return;

    console.assert(value === true);
    if (this._dirty === value) return;

    this._dirty = true;
    if (value) {
      setTimeout(() => {
        this.updateState(this.modifiers);
        this.updateElement();
      });
    }
  }

  updateState(modifiers?: KeyboardModifiers): void {
    this._updating = true;
    this.modifiers = modifiers ?? this.modifiers;
    super.updateState(this.modifiers);
    this._updating = false;
  }

  handleKeyupEvent(ev: KeyboardEvent): void {
    if (this.isDynamic) this.modifiers = keyboardModifiersFromEvent(ev);

    // Capture any keyup event to prevent ancestors from handling it
    ev.stopImmediatePropagation();
  }

  handleKeydownEvent(ev: KeyboardEvent): void {
    if (ev.key === 'Tab' || ev.key === 'Escape') {
      // Close and bubble
      this.hide();
      return;
    }

    // Update menu if the keyboard modifiers have changed
    if (this.isDynamic) this.modifiers = keyboardModifiersFromEvent(ev);

    let handled = true;
    const menu = this.activeSubmenu;
    const menuItem = menu.activeMenuItem;
    switch (ev.key) {
      case ' ':
      case 'Space':
      case 'Return':
      case 'Enter':
        menuItem?.select(keyboardModifiersFromEvent(ev));
        break;

      case 'ArrowRight':
        if (menuItem?.type === 'submenu') {
          menuItem.select(keyboardModifiersFromEvent(ev));
          this.activeSubmenu.activeMenuItem = this.activeSubmenu.firstMenuItem;
        } else if (!menuItem) menu.activeMenuItem = menu.firstMenuItem;
        else {
          const col = menu.getMenuItemColumn(menuItem) ?? -1;
          if (col >= 0 && col < (menu.columnCount ?? 1) - 1) {
            const next = menu.nextMenuItem(1);
            if (next) menu.activeMenuItem = next;
          }
        }
        break;

      case 'ArrowLeft':
        if (menu === this.rootMenu) {
          if (!menuItem) menu.activeMenuItem = menu.firstMenuItem;
        } else {
          const col = menuItem ? menu.getMenuItemColumn(menuItem) ?? -1 : -1;
          if (col <= 0 || !menuItem) {
            menu.hide();
            const activeMenu = menu.parentMenu!.activeMenuItem;
            if (activeMenu) {
              const { element } = activeMenu;
              element?.focus();
              element?.classList.remove('is-submenu-open');
            }
          } else {
            const next = menu.nextMenuItem(-1);
            if (next) menu.activeMenuItem = next;
          }
        }

        break;

      case 'ArrowDown':
        menu.activeMenuItem = menu.nextMenuItem(menu.columnCount);
        break;

      case 'ArrowUp':
        menu.activeMenuItem = menu.nextMenuItem(-menu.columnCount);
        break;

      case 'Home':
      case 'PageUp':
        menu.activeMenuItem = menu.firstMenuItem;
        break;

      case 'End':
      case 'PageDown':
        menu.activeMenuItem = menu.lastMenuItem;
        break;

      case 'Backspace':
        if (this.typingBuffer) {
          this.typingBuffer = this.typingBuffer.slice(0, -1);
          if (this.typingBuffer) {
            clearTimeout(this.typingBufferResetTimer);
            const newItem = menu.findMenuItem(this.typingBuffer);
            if (newItem) menu.activeMenuItem = newItem;

            this.typingBufferResetTimer = setTimeout(() => {
              this.typingBuffer = '';
            }, 500);
          }
        }
        break;

      default:
        if (mightProducePrintableCharacter(ev)) {
          if (isFinite(this.typingBufferResetTimer))
            clearTimeout(this.typingBufferResetTimer);

          this.typingBuffer += ev.key;
          const newItem = menu.findMenuItem(this.typingBuffer);
          if (newItem) menu.activeMenuItem = newItem;

          this.typingBufferResetTimer = setTimeout(() => {
            this.typingBuffer = '';
          }, 500);
        } else handled = false;
    }

    if (handled) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  handleEvent(event: Event): void {
    if (event.type === 'keydown')
      this.handleKeydownEvent(event as KeyboardEvent);
    else if (event.type === 'keyup')
      this.handleKeyupEvent(event as KeyboardEvent);
    else if (event.type === 'pointermove')
      this.lastMoveEvent = event as PointerEvent;
    else if (event.type === 'pointerup') {
      if (
        Number.isFinite(this.rootMenu._openTimestamp!) &&
        Date.now() - this.rootMenu._openTimestamp! < 120
      ) {
        // "modal" = pointerdown + pointerup within 120ms : keep menu open
        this.state = 'modal';
      } else if (this.state === 'modal' && event.target === this.scrim) {
        // Cancel
        this.hide();
      }
    } else if (event.type === 'contextmenu') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    super.handleEvent(event);
  }

  /** Return true if the event is **not** canceled */
  dispatchEvent(ev: Event): boolean {
    if (!this._host) return true;
    return this._host.dispatchEvent(ev);
  }

  get host(): HTMLElement | null {
    return this._host;
  }

  get scrim(): Element {
    return Scrim.element;
  }

  private connectScrim(target?: Node | null): void {
    const scrim = this.scrim!;
    scrim.addEventListener('pointerup', this, true);

    scrim.addEventListener('contextmenu', this);

    scrim.addEventListener('keydown', this);
    scrim.addEventListener('keyup', this);
    scrim.addEventListener('pointermove', this);

    Scrim.open({ root: target, onDismiss: () => this.hide() });
  }

  private disconnectScrim(): void {
    const scrim = this.scrim!;
    scrim.removeEventListener('pointerup', this, true);

    scrim.removeEventListener('contextmenu', this);

    scrim.removeEventListener('keydown', this);
    scrim.removeEventListener('keyup', this);
    scrim.removeEventListener('pointermove', this);
    if (Scrim.state === 'open') Scrim.scrim.close();
  }

  get rootMenu(): Menu {
    // I AM THE ONE WHO KNOCKS
    return this;
  }

  /** Locations are in viewport coordinate. */
  show(options?: {
    target?: Node | null; // Where the menu should attach
    location?: { x: number; y: number };
    alternateLocation?: { x: number; y: number };
    modifiers?: KeyboardModifiers;
    onDismiss?: () => void;
  }): boolean {
    this._onDismiss = options?.onDismiss;

    if (options?.modifiers) this.modifiers = options.modifiers;

    // On first showing, always update the state to account not only
    // for the keyboard modifiers, but the state of the environment
    this.updateState();

    // Connect the scrim now, so that the menu can be measured and placed
    this.connectScrim(options?.target);
    if (!super.show({ ...options, container: this.scrim })) {
      // There was nothing to show: remove the scrim
      this.disconnectScrim();
      return false;
    }

    // Record the opening time.
    // If we receive a mouseup within a small delta of the open time stamp
    // hold the menu open until it is dismissed, otherwise close it.
    this._openTimestamp = Date.now();
    this.state = 'open';
    return true;
  }

  hide(): void {
    this.cancelDelayedOperation();
    if (this.state !== undefined) {
      if (this.state !== 'closed') {
        this.activeMenuItem = null;

        // Prevent spurious blur event by resetting the focus
        Scrim.element!.parentElement!.focus();

        super.hide();
        this.state = 'closed';
        this.disconnectScrim();
      }
      if (this._onDismiss) {
        this._onDismiss();
        this._onDismiss = undefined;
      }
    }
  }

  scheduleOperation(fn: () => void): void {
    this.cancelDelayedOperation();

    const delay = Menu.SUBMENU_DELAY;
    if (delay <= 0) {
      fn();
      return;
    }

    this.hysteresisTimer = setTimeout(() => {
      this.hysteresisTimer = 0;
      fn();
    }, delay);
  }

  cancelDelayedOperation(): void {
    if (this.hysteresisTimer) {
      clearTimeout(this.hysteresisTimer);
      this.hysteresisTimer = 0;
    }
  }
}

function isDynamic(item: MenuItem): boolean {
  if (isDivider(item)) return false;

  if (
    typeof item.label === 'function' ||
    typeof item.ariaLabel === 'function' ||
    typeof item.tooltip === 'function'
  )
    return true;

  if (
    (isCommand(item) || isSubmenu(item)) &&
    (typeof item.enabled === 'function' || typeof item.visible === 'function')
  )
    return true;

  if (isCommand(item) && typeof item.checked === 'function') return true;

  if (isSubmenu(item)) return item.submenu.some(isDynamic);

  return false;
}
