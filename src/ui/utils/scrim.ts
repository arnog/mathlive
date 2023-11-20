import { deepActiveElement } from 'ui/events/utils';

export class Scrim {
  static scrim: Scrim;

  private _element?: HTMLElement;

  private readonly preventOverlayClose: boolean;
  private readonly onClose?: () => void;

  private savedOverflow?: string;
  private savedMarginRight?: string;

  private savedActiveElement?: HTMLOrSVGElement | null;

  state: 'closed' | 'opening' | 'open' | 'closing';

  private readonly translucent: boolean;

  /**
   * - If `options.preventOverlayClose` is false, the scrim is closed if the
   * user clicks on the scrim. That's the behavior for menus, for example.
   * When you need a fully modal situation until the user has made an
   * explicit choice (validating cookie usage, for example), set
   * `preventOverlayClose` to true.
   * - `onClose()` is called when the scrim is being closed
   * -
   */
  constructor(options?: {
    translucent?: boolean;
    preventOverlayClose?: boolean;
    onClose?: () => void;
  }) {
    this.preventOverlayClose = options?.preventOverlayClose ?? false;
    this.translucent = options?.translucent ?? false;

    this.state = 'closed';
  }

  get element(): HTMLElement {
    if (this._element) return this._element;

    const element = document.createElement('div');
    element.setAttribute('role', 'presentation');

    element.style.position = 'fixed';
    element.style.contain = 'content';
    element.style.top = '0';
    element.style.left = '0';
    element.style.right = '0';
    element.style.bottom = '0';
    element.style.zIndex = 'var(--scrim-zindex, 10099)'; // Bootstrap modals are at 10050 (see #1201)
    element.style.outline = 'none';
    if (this.translucent) {
      element.style.background = 'rgba(255, 255, 255, .2)';
      element.style['backdropFilter' as any] = 'contrast(40%)';
    } else element.style.background = 'transparent';

    this._element = element;
    return element;
  }

  open(options: { root?: Node | null; child?: HTMLElement }): void {
    if (this.state !== 'closed') return;
    this.state = 'opening';

    // Remember the previously focused element. We'll restore it when we close.
    this.savedActiveElement = deepActiveElement();

    const { element } = this;

    (options?.root ?? document.body).appendChild(element);

    element.addEventListener('click', this);
    document.addEventListener('touchmove', this, false);
    document.addEventListener('scroll', this, false);

    // Prevent (some) scrolling
    // (touch scrolling will still happen)
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    this.savedMarginRight = document.body.style.marginRight;

    this.savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const marginRight = Number.parseFloat(
      getComputedStyle(document.body).marginRight
    );

    document.body.style.marginRight = `${marginRight + scrollbarWidth}px`;

    if (options?.child) element.append(options.child);

    this.state = 'open';
  }

  close(): void {
    if (this.state !== 'open') {
      console.assert(this.element.parentElement !== null);
      return;
    }
    this.state = 'closing';

    if (typeof this.onClose === 'function') this.onClose();

    const { element } = this;
    element.removeEventListener('click', this);
    document.removeEventListener('touchmove', this, false);
    document.removeEventListener('scroll', this, false);

    element.remove();

    // Restore body state
    document.body.style.overflow = this.savedOverflow ?? '';
    document.body.style.marginRight = this.savedMarginRight ?? '';

    // Restore the previously focused element
    if (deepActiveElement() !== this.savedActiveElement)
      this.savedActiveElement?.focus?.();

    // Remove all children
    element.innerHTML = '';
    this.state = 'closed';
  }

  handleEvent(ev: Event): void {
    if (!this.preventOverlayClose) {
      if (ev.target === this._element && ev.type === 'click') {
        this.close();
        ev.preventDefault();
        ev.stopPropagation();
      } else if (
        ev.target === document &&
        (ev.type === 'touchmove' || ev.type === 'scroll')
      ) {
        // This is an attempt at scrolling on a touch-device
        this.close();
        ev.preventDefault();
        ev.stopPropagation();
      }
    }
  }
}
