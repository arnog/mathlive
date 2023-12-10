import { getComputedDir } from 'ui/i18n/utils';

export function getOppositeEdge(
  bounds: DOMRectReadOnly,
  position: 'leading' | 'trailing' | 'left' | 'end',
  direction: 'ltr' | 'rtl'
): number {
  if (
    position === 'left' ||
    (position === 'leading' && direction === 'ltr') ||
    (position === 'trailing' && direction === 'rtl')
  )
    return bounds.right;

  return bounds.left;
}

export function getEdge(
  bounds: DOMRectReadOnly,
  position: 'leading' | 'trailing' | 'left' | 'end',
  direction: 'ltr' | 'rtl'
): number {
  if (
    position === 'left' ||
    (position === 'leading' && direction === 'ltr') ||
    (position === 'trailing' && direction === 'rtl')
  )
    return bounds.left;

  return bounds.right;
}

/**
 * Calculate the effective position (width or height) given a starting pos,
 * a placement (left, top, middle, etc...) and dir (ltr/rtl).
 */
function getEffectivePos(
  pos: number,
  length: number,
  placement: 'start' | 'end' | 'middle' | 'left' | 'right' | 'top' | 'bottom',
  dir: 'ltr' | 'rtl'
): number {
  if (placement === 'middle') return pos - length / 2;

  if (
    (placement === 'start' && dir === 'rtl') ||
    (placement === 'end' && dir === 'ltr') ||
    placement === 'top' ||
    placement === 'right'
  )
    return Math.max(0, pos - length);

  return pos;
}

export function getOppositeEffectivePos(
  pos: number,
  length: number,
  placement: 'start' | 'end' | 'middle' | 'left' | 'right' | 'top' | 'bottom',
  dir: 'ltr' | 'rtl'
): number {
  if (placement === 'middle') return pos - length / 2;

  if (
    (placement === 'start' && dir === 'ltr') ||
    (placement === 'end' && dir === 'rtl') ||
    placement === 'top' ||
    placement === 'right'
  )
    return pos;

  return pos - length;
}

/**
 * Set the position of the element so that it fits in the viewport.
 *
 * The element is first positioned at `location`.
 * If it overflows and there is an alternate location, use the alternate
 * location to fit the topright at the alternate location.
 *
 * The locations are in viewport coordinates.
 *
 * If the element still overflows, adjust its location moving it up and to the
 * left as necessary until it fits (and adjusting its width/height as a result)
 */
export function fitInViewport(
  element: HTMLElement,
  options: {
    location: { x: number; y: number };
    alternateLocation?: { x: number; y: number };
    verticalPos: 'bottom' | 'top' | 'middle' | 'start' | 'end';
    horizontalPos: 'left' | 'right' | 'middle' | 'start' | 'end';
    width?: number;
    height?: number;
    maxWidth?: number;
    maxHeight?: number;
  }
): void {
  const dir = getComputedDir(element) ?? 'ltr';

  // Reset any location, so we can get the natural width/height
  element.style.position = 'fixed';
  element.style.left = '';
  element.style.top = '';
  element.style.right = '';
  element.style.bottom = '';
  element.style.height = '';
  element.style.width = '';

  const elementBounds = element.getBoundingClientRect();

  //
  // Vertical positioning
  //
  const maxHeight = Number.isFinite(options.maxHeight)
    ? Math.min(options.maxHeight!, window.innerHeight)
    : window.innerHeight;

  let height = Math.min(maxHeight, options.height ?? elementBounds.height);

  let top: number | undefined = getEffectivePos(
    options.location.y,
    height,
    options.verticalPos,
    dir
  );
  if (top + height > window.innerHeight - 8) {
    if (options.alternateLocation) {
      top = getEffectivePos(
        options.alternateLocation.y,
        height,
        options.verticalPos,
        dir
      );
      if (top + height > window.innerHeight - 8) top = undefined;
    } else top = undefined;
  }

  if (!Number.isFinite(top)) {
    // Move element as high as possible
    top = Math.max(8, window.innerHeight - 8 - height);
    if (8 + height > window.innerHeight - 8) {
      // Still doesn't fit, we'll clamp it
      element.style.bottom = '8px';
    }
  }

  height = Math.min(top! + height, window.innerHeight - 8) - top!;

  //
  // Horizontal positioning
  //
  const maxWidth = Number.isFinite(options.maxWidth)
    ? Math.min(options.maxWidth!, window.innerWidth)
    : window.innerWidth;

  let width = Math.min(maxWidth, options.width ?? elementBounds.width);

  let left: number | undefined = getEffectivePos(
    options.location.x,
    width,
    options.horizontalPos,
    dir
  );
  if (left + width > window.innerWidth - 8) {
    if (options.alternateLocation) {
      left = getOppositeEffectivePos(
        options.alternateLocation.x,
        width,
        options.verticalPos,
        dir
      );
      if (left + width > window.innerWidth - 8) left = undefined;
    } else left = undefined;
  }

  if (!Number.isFinite(left)) {
    // Move element as far left as possible
    left = Math.max(8, window.innerWidth - 8 - width);
    if (8 + width > window.innerWidth - 8) {
      // Still doesn't fit, we'll clamp it
      element.style.right = '8px';
    }
  }

  width = Math.min(left! + width, window.innerWidth - 8) - left!;

  if (dir === 'rtl') {
    element.style.right = `${Math.ceil(
      window.innerWidth - left! - width
    ).toString()}px`;
  } else element.style.left = `${Math.ceil(left!).toString()}px`;
  element.style.top = `${Math.ceil(top!).toString()}px`;
  if (height !== elementBounds.height)
    element.style.height = `${Math.ceil(height).toString()}px`;
  if (width !== elementBounds.width)
    element.style.width = `${Math.ceil(width).toString()}px`;
}

export function distance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}
