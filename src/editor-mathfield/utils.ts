import { Atom } from '../core/atom-class';
import type { Range } from '../public/mathfield';
import { OriginValidator } from '../public/options';
import { MathfieldPrivate } from './mathfield-private';

export type Rect = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export function on(
  element: EventTarget,
  inSelectors: string,
  listener: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions
): void {
  const selectors = inSelectors.split(' ');
  for (const sel of selectors) {
    const m = sel.match(/(.*):(.*)/);
    if (m) {
      const options2 = options ?? {};
      if (m[2] === 'active') {
        options2.passive = false;
      } else {
        options2[m[2]] = true;
      }

      element.addEventListener(m[1], listener, options2);
    } else {
      element.addEventListener(sel, listener, options);
    }
  }
}

export function off(
  element: EventTarget,
  inSelectors: string,
  listener: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions
): void {
  const selectors = inSelectors.split(' ');
  for (const sel of selectors) {
    const m = sel.match(/(.*):(.*)/);
    if (m) {
      const options2 = options ?? {};
      if (m[2] === 'active') {
        options2.passive = false;
      } else {
        options2[m[2]] = true;
      }

      element.removeEventListener(m[1], listener, options2);
    } else {
      element.removeEventListener(sel, listener, options);
    }
  }
}

export function getSharedElement(id: string, cls: string): HTMLElement {
  let result = document.getElementById(id);
  if (result) {
    result.dataset.refcount = Number(
      Number.parseInt(result.getAttribute('data-refcount')) + 1
    ).toString();
  } else {
    result = document.createElement('div');
    result.setAttribute('aria-hidden', 'true');
    result.dataset.refcount = '1';
    result.className = cls;
    result.id = id;
    document.body.append(result);
  }

  return result;
}

// @revisit: check the elements are correctly released
export function releaseSharedElement(element: HTMLElement): void {
  if (!element) return;
  const refcount = Number.parseInt(element.getAttribute('data-refcount'));
  if (refcount <= 1) {
    element.remove();
  } else {
    element.dataset.refcount = Number(refcount - 1).toString();
  }
}

/**
 * Checks if the argument is a valid Mathfield.
 * After a Mathfield has been destroyed (for example by calling `dispose()`
 * the Mathfield is no longer valid. However, there may be some pending
 * operations invoked via requestAnimationFrame() for example, that would
 * need to ensure the mathfield is still valid by the time they're executed.
 */
export function isValidMathfield(mf: MathfieldPrivate): boolean {
  return mf.element && mf.element.mathfield === mf;
}

/**
 * Return the element which has the caret
 */
function findElementWithCaret(element: Element): Element {
  return (
    element.querySelector('.ML__caret') ??
    element.querySelector('.ML__text-caret') ??
    element.querySelector('.ML__latex-caret')
  );
}

/**
 * Return the (x,y) client coordinates of the caret
 */
export function getCaretPoint(
  element: Element
): { x: number; y: number; height: number } | null {
  const caret = findElementWithCaret(element);
  if (!caret) return null;
  const bounds = caret.getBoundingClientRect();
  return {
    x: bounds.right,
    y: bounds.bottom,
    height: bounds.height,
  };
}

function branchId(atom: Atom): string {
  let result = atom.parent ? atom.parent.id : 'root';
  result +=
    typeof atom.treeBranch === 'string'
      ? '-' + atom.treeBranch
      : `-${atom.treeBranch[0]}/${atom.treeBranch[0]}`;
  return result;
}

function adjustForScrolling(
  mathfield: MathfieldPrivate,
  rect: Rect | null
): Rect | null {
  if (!rect) return null;
  const fieldRect = mathfield.field.getBoundingClientRect();
  const w = rect.right - rect.left;
  const h = rect.bottom - rect.top;
  const left = Math.ceil(
    rect.left - fieldRect.left + mathfield.field.scrollLeft
  );
  const top = Math.ceil(rect.top - fieldRect.top);
  return {
    left,
    right: left + w,
    top,
    bottom: top + h,
  };
}

function getNodeBounds(node: Element): Rect {
  const bounds = node.getBoundingClientRect();
  const result: Rect = {
    top: bounds.top,
    bottom: bounds.bottom,
    left: bounds.left,
    right: bounds.right,
  };
  if (node.tagName !== 'SVG') {
    [...node.children].forEach((x) => {
      if (x.nodeType === 1) {
        const r: Rect = getNodeBounds(x);
        result.left = Math.min(result.left, r.left);
        result.right = Math.max(result.right, r.right);
        result.top = Math.min(result.top, r.top);
        result.bottom = Math.max(result.bottom, r.bottom);
      }
    });
  }

  return result;
}

export function getAtomBounds(
  mathfield: MathfieldPrivate,
  atom: Atom
): Rect | null {
  const node = mathfield.field.querySelector(`[data-atom-id="${atom.id}"]`);
  if (!node) return null;
  return getNodeBounds(node);
}

/*
 * Return an array of bounds for the specified branch, at most
 * one rect per branch.
 */
export function getRangeBounds(
  mathfield: MathfieldPrivate,
  range: Range
): Rect[] {
  // The key of the map is a 'branchId', i.e. "atom id + branch"
  const rects = new Map<string, Rect>();

  mathfield.model
    .getAtoms(range, { includeChildren: true })
    .forEach((x: Atom) => {
      const bounds = adjustForScrolling(mathfield, getAtomBounds(mathfield, x));
      if (bounds) {
        const id = branchId(x);
        if (rects.has(id)) {
          const r = rects.get(id);
          rects.set(id, {
            top: Math.min(r.top, bounds.top),
            bottom: Math.max(r.bottom, bounds.bottom),
            left: Math.min(r.left, bounds.left),
            right: Math.max(r.right, bounds.right),
          });
        } else {
          rects.set(id, bounds);
        }
      }
    });

  return [...rects.values()];
}

export function getSelectionBounds(mathfield: MathfieldPrivate): Rect[] {
  return mathfield.model.selection.ranges.reduce(
    (acc, x) => acc.concat(...getRangeBounds(mathfield, x)),
    []
  );
}

export function validateOrigin(
  origin: string,
  originValidator: OriginValidator
): boolean {
  if (originValidator === 'none') {
    return true;
  }

  if (originValidator === 'same-origin') {
    return origin === window.origin;
  }

  if (typeof originValidator === 'function') {
    return originValidator(origin);
  }

  return false;
}
