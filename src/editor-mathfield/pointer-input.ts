import { getAtomBounds, getRangeBoundingRect, Rect } from './utils';
import type { _Mathfield } from './mathfield-private';
import { requestUpdate } from './render';
import { Atom } from '../core/atom-class';
import { acceptCommandSuggestion } from './autocomplete';
import { selectGroup } from '../editor-model/commands-select';
import type { Offset, Range } from 'public/core-types';
import { ArrayAtom } from 'atoms/array';

let gLastTap: { x: number; y: number; time: number } | null = null;
let gTapCount = 0;

export class PointerTracker {
  private static controller: AbortController | undefined;
  private static pointerId: number | undefined;
  private static element: HTMLElement | undefined;

  static start(
    element: HTMLElement,
    evt: Event,
    onMove: (this: HTMLElement, ev: PointerEvent | MouseEvent) => any,
    onCancel: (this: HTMLElement, ev: Event) => any
  ): void {
    PointerTracker.element = element;

    // Have to create a new controller each time, as they can only be used once
    PointerTracker.controller?.abort();
    PointerTracker.controller = new AbortController();

    const options = { signal: PointerTracker.controller.signal };

    if ('PointerEvent' in window) {
      element.addEventListener('pointermove', onMove, options);
      element.addEventListener('pointerup', onCancel, options);
      element.addEventListener('pointercancel', onCancel, options);
      if (isPointerEvent(evt)) {
        PointerTracker.pointerId = evt.pointerId;
        element.setPointerCapture(evt.pointerId);
      }
    } else {
      // @ts-ignore
      window.addEventListener('mousemove', onMove, options);
      // @ts-ignore
      window.addEventListener('blur', onCancel, options);
      // @ts-ignore
      window.addEventListener('mouseup', onCancel, options);
    }
  }

  static stop(): void {
    PointerTracker.controller?.abort();
    PointerTracker.controller = undefined;

    if (typeof PointerTracker.pointerId === 'number') {
      PointerTracker.element!.releasePointerCapture(PointerTracker.pointerId);
      PointerTracker.pointerId = undefined;
    }
  }
}

function isPointerEvent(evt: Event | null): evt is PointerEvent {
  return (
    evt !== null &&
    globalThis.PointerEvent !== undefined &&
    evt instanceof PointerEvent
  );
}

function pointInRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function onPointerDown(mathfield: _Mathfield, evt: PointerEvent): void {
  // If a mouse button other than the main one was pressed, return.
  if (evt.buttons > 1) return;

  // Initialize the atom bounds cache if it doesn't exist
  if (!mathfield.atomBoundsCache)
    mathfield.atomBoundsCache = new Map<string, Rect>();
  else mathfield.atomBoundsCache.clear();

  const that = mathfield;
  let anchor: Offset;
  let trackingPointer = false;
  let trackingWords = false;
  let dirty: 'none' | 'selection' | 'all' = 'none';

  let scrollLeft = false;
  let scrollRight = false;

  const anchorX = evt.clientX;
  const anchorY = evt.clientY;
  const anchorTime = Date.now();
  const field = that.field!;
  const scrollInterval = setInterval(() => {
    if (scrollLeft) field.scroll({ top: 0, left: field.scrollLeft - 16 });
    else if (scrollRight) field.scroll({ top: 0, left: field.scrollLeft + 16 });
  }, 32);

  function endPointerTracking(): void {
    PointerTracker.stop();

    trackingPointer = false;
    clearInterval(scrollInterval);
    mathfield.element!.classList.remove('tracking');
    if (evt) evt.preventDefault();
  }

  function onPointerMove(evt: PointerEvent | MouseEvent): void {
    // If we've somehow lost focus, end tracking
    if (!that.hasFocus()) {
      endPointerTracking();
      return;
    }

    const x = evt.clientX;
    const y = evt.clientY;
    // Ignore events that are within small spatial and temporal bounds
    // of the pointer down
    const hysteresis =
      isPointerEvent(evt) && evt.pointerType === 'touch' ? 20 : 5;
    if (
      Date.now() < anchorTime + 500 &&
      Math.abs(anchorX - x) < hysteresis &&
      Math.abs(anchorY - y) < hysteresis
    ) {
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }

    const fieldBounds = field.getBoundingClientRect();
    scrollRight = x > fieldBounds.right;
    scrollLeft = x < fieldBounds.left;
    let actualAnchor = anchor;
    if (isPointerEvent(evt)) {
      if (!evt.isPrimary) {
        actualAnchor = offsetFromPoint(that, evt.clientX, evt.clientY, {
          bias: 0,
        });
      }
    }

    const focus = offsetFromPoint(that, x, y, {
      bias: x <= anchorX ? (x === anchorX ? 0 : -1) : +1,
    });

    if (actualAnchor >= 0 && focus >= 0) {
      that.model.extendSelectionTo(actualAnchor, focus);
      requestUpdate(mathfield);
    }

    if (trackingWords) selectGroup(that.model);
    // Note: do not prevent default, as we need to track
    // the pointer to prevent long press if the pointer has moved
  }

  // Calculate the tap count
  if (
    gLastTap &&
    Math.abs(gLastTap.x - anchorX) < 5 &&
    Math.abs(gLastTap.y - anchorY) < 5 &&
    Date.now() < gLastTap.time + 500
  ) {
    gTapCount += 1;
    gLastTap.time = anchorTime;
  } else {
    gLastTap = {
      x: anchorX,
      y: anchorY,
      time: anchorTime,
    };
    gTapCount = 1;
  }

  const bounds = field.getBoundingClientRect();
  const containerBounds =
    mathfield.container?.getBoundingClientRect() ??
    mathfield.element.getBoundingClientRect();
  const hostBounds =
    mathfield.element?.getBoundingClientRect() ?? containerBounds;
  const anchorInsideField = pointInRect(anchorX, anchorY, bounds);
  const anchorInsideContainer =
    !anchorInsideField && containerBounds
      ? pointInRect(anchorX, anchorY, containerBounds)
      : false;
  const anchorInsideHost =
    !anchorInsideField && !anchorInsideContainer && hostBounds
      ? pointInRect(anchorX, anchorY, hostBounds)
      : false;
  const selectionAnchorX = anchorInsideField
    ? anchorX
    : anchorInsideContainer || anchorInsideHost
    ? clamp(anchorX, bounds.left, bounds.right)
    : anchorX;
  const selectionAnchorY = anchorInsideField
    ? anchorY
    : anchorInsideContainer || anchorInsideHost
    ? clamp(anchorY, bounds.top, bounds.bottom)
    : anchorY;

  if (anchorInsideField || anchorInsideContainer || anchorInsideHost) {
    // Clicking or tapping the field resets the keystroke buffer
    mathfield.flushInlineShortcutBuffer();

    anchor = offsetFromPoint(mathfield, selectionAnchorX, selectionAnchorY, {
      bias: 0,
    });

    // Reset the style bias if the anchor is different
    // However, preserve explicit variantStyle settings to allow toggling
    if (anchor !== mathfield.model.anchor) {
      const preservedVariantStyle = mathfield.defaultStyle.variantStyle;
      mathfield.defaultStyle =
        preservedVariantStyle !== undefined
          ? { variantStyle: preservedVariantStyle }
          : {};
      mathfield.styleBias = 'left';
    }

    if (anchor >= 0) {
      // Set a `tracking` class to avoid triggering the hover of the virtual
      // keyboard toggle, for example
      mathfield.element!.classList.add('tracking');

      if (evt.shiftKey) {
        // If the Shift key is down, extend the selection
        // (in that case, 'anchor' is actually the focus
        const wasCollapsed = mathfield.model.selectionIsCollapsed;
        mathfield.model.extendSelectionTo(mathfield.model.anchor, anchor);
        if (acceptCommandSuggestion(mathfield.model) || wasCollapsed)
          dirty = 'all';
        else dirty = 'selection';
      } else if (
        mathfield.model.at(anchor).type === 'placeholder' ||
        mathfield.model.at(anchor).type === 'prompt'
      ) {
        // Position cursor inside the prompt/placeholder body
        const atom = mathfield.model.at(anchor);
        if (atom.hasChildren && atom.firstChild)
          mathfield.model.position = mathfield.model.offsetOf(atom.firstChild);
        else mathfield.model.setSelection(anchor - 1, anchor);

        dirty = 'selection';
      } else if (
        mathfield.model.at(anchor).rightSibling?.type === 'placeholder' ||
        mathfield.model.at(anchor).rightSibling?.type === 'prompt'
      ) {
        // Position cursor inside the prompt/placeholder body
        const atom = mathfield.model.at(anchor).rightSibling!;
        if (atom.hasChildren && atom.firstChild)
          mathfield.model.position = mathfield.model.offsetOf(atom.firstChild);
        else mathfield.model.setSelection(anchor, anchor + 1);

        dirty = 'selection';
      } else {
        // Check if this atom has captureSelection and contains a single
        // placeholder/prompt child - if so, position inside that child
        const atom = mathfield.model.at(anchor);
        if (
          atom.captureSelection &&
          atom.hasChildren &&
          atom.body &&
          atom.body.length > 0
        ) {
          const bodyAtom = atom.body.find((a) => a.type !== 'first');
          if (
            bodyAtom &&
            (bodyAtom.type === 'placeholder' || bodyAtom.type === 'prompt') &&
            bodyAtom.hasChildren &&
            bodyAtom.firstChild
          ) {
            mathfield.model.position = mathfield.model.offsetOf(
              bodyAtom.firstChild
            );
            dirty = 'selection';
          } else {
            mathfield.model.position = anchor;
            if (acceptCommandSuggestion(mathfield.model)) dirty = 'all';
            else dirty = 'selection';
          }
        } else {
          mathfield.model.position = anchor;
          if (acceptCommandSuggestion(mathfield.model)) dirty = 'all';
          else dirty = 'selection';
        }
      }

      // `evt.detail` contains the number of consecutive clicks
      // for double-click, triple-click, etc...
      // (note that `evt.detail` is not set when using pointerEvent)
      if (evt.detail === 3 || gTapCount > 2) {
        endPointerTracking();
        if (evt.detail === 3 || gTapCount === 3) {
          // This is a triple-click
          mathfield.model.selection = {
            ranges: [[0, mathfield.model.lastOffset]],
          };
          dirty = 'all';
        }
      } else if (!trackingPointer) {
        trackingPointer = true;

        PointerTracker.start(field, evt, onPointerMove, endPointerTracking);

        if (evt.detail === 2 || gTapCount === 2) {
          // This is a double-click
          trackingWords = true;
          selectGroup(mathfield.model);
          dirty = 'all';
        }
      }
    }
    // Focus the mathfield
    // (do it after the selection has been set, since the
    // logic on what to do on focus may depend on the selection)
    if (!mathfield.hasFocus()) {
      dirty = 'none'; // focus() will refresh
      // Call onFocus to focus the keyboard delegate
      // Events will fire normally
      mathfield.onFocus();
      mathfield.model.announce('line');
    }
  } else gLastTap = null;

  mathfield.stopCoalescingUndo();

  if (dirty !== 'none') {
    if (mathfield.model.selectionIsCollapsed) dirty = 'all';
    requestUpdate(mathfield);
  }

  // Prevent the browser from handling.
  evt.preventDefault();
}

function distance(x: number, y: number, r: Rect): number {
  if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return 0;

  const dx = x - (r.left + r.right) / 2;
  const dy = y - (r.top + r.bottom) / 2;
  return dx * dx + dy * dy;
}

function nearestAtomFromPointRecursive(
  mathfield: _Mathfield,
  cache: Map<string, [distance: number, atom: Atom | null]>,
  atom: Atom,
  x: number,
  y: number
): [distance: number, atom: Atom | null] {
  if (!atom.id) return [Infinity, null];
  if (cache.has(atom.id)) return cache.get(atom.id)!;

  const bounds = getAtomBounds(mathfield, atom);
  if (!bounds) return [Infinity, null];

  let result: ReturnType<typeof nearestAtomFromPointRecursive> = [
    Infinity,
    null,
  ];

  // @fixme: we should use a hitbox() method on the atom that would account for the actual layout or have a case statement for all the atom types. In the meantime, we assume each branch to be a stack of horizontally laid out boxes and consider branches whose top and bottom contain the 'y' coordinate
  const model = mathfield.model;

  //
  // Do we have an array of cells?
  //
  if (atom instanceof ArrayAtom) {
    // For arrays, we need to determine which row was clicked first
    // to avoid selecting atoms from the wrong row (fixes #2619)
    let targetRowIndex = -1;
    let minRowDistance = Infinity;

    // Find which row the click point is closest to vertically
    for (let rowIndex = 0; rowIndex < atom.rows.length; rowIndex++) {
      const row = atom.rows[rowIndex];
      if (!row || row.length === 0) continue;

      // Get bounds of all atoms in this row
      let rowTop = Infinity;
      let rowBottom = -Infinity;

      for (const cell of row) {
        if (cell) {
          for (const atom2 of cell) {
            const atomBounds = getAtomBounds(mathfield, atom2);
            if (atomBounds) {
              rowTop = Math.min(rowTop, atomBounds.top);
              rowBottom = Math.max(rowBottom, atomBounds.bottom);
            }
          }
        }
      }

      // Calculate vertical distance from click point to this row
      if (rowTop !== Infinity && rowBottom !== -Infinity) {
        let rowDistance: number;
        if (y < rowTop) rowDistance = rowTop - y;
        else if (y > rowBottom) rowDistance = y - rowBottom;
        else {
          // Point is within the row's vertical bounds
          rowDistance = 0;
        }

        if (rowDistance < minRowDistance) {
          minRowDistance = rowDistance;
          targetRowIndex = rowIndex;
        }
      }
    }

    // Search only in the target row, or all rows if we couldn't determine a target
    const rowsToSearch =
      targetRowIndex >= 0 ? [atom.rows[targetRowIndex]] : atom.rows;

    for (const row of rowsToSearch) {
      for (const cell of row) {
        if (cell) {
          for (const atom2 of cell) {
            const r2 = nearestAtomFromPointRecursive(
              mathfield,
              cache,
              atom2,
              x,
              y
            );
            if (r2[0] <= result[0]) result = r2;
          }
        }
      }
    }

    // Search children for additional atoms (like delimiters)
    for (const child of atom.children) {
      const r = nearestAtomFromPointRecursive(mathfield, cache, child, x, y);
      if (r[0] <= result[0]) result = r;
    }
  } else if (
    atom.hasChildren &&
    !atom.captureSelection &&
    x >= bounds.left &&
    x <= bounds.right
  ) {
    const children = atom.children;
    for (const child of children) {
      // Is the y within the vertical bounds of the branch?
      const r = nearestAtomFromPointRecursive(mathfield, cache, child, x, y);
      if (r[0] <= result[0]) result = r;
    }

    // Find a matching branch - enhanced script branch searching
    for (const branch of atom.branches) {
      const siblings = atom.branch(branch);
      if (!siblings || siblings.length === 0) continue;
      const siblingsRange: Range = [
        model.offsetOf(siblings[0]),
        model.offsetOf(siblings[siblings.length - 1]),
      ];
      const r = getRangeBoundingRect(mathfield, siblingsRange);
      // Is the y within the vertical bounds of the branch?
      if (y >= r.top && y <= r.bottom) {
        for (const atom of siblings) {
          const r = nearestAtomFromPointRecursive(mathfield, cache, atom, x, y);
          if (r[0] <= result[0]) result = r;
        }
      }
    }
  }

  //
  // 2. If no children matched (or there were no children), this atom matches
  //
  if (!result[1]) result = [distance(x, y, bounds), atom];

  cache.set(atom.id, result);
  return result;
}

export function nearestAtomFromPoint(
  mathfield: _Mathfield,
  x: number,
  y: number
): Atom {
  const [, atom] = nearestAtomFromPointRecursive(
    mathfield,
    new Map(),
    mathfield.model.root,
    x,
    y
  );
  return atom!;
}

/**
 * @param options.bias  if 0, the midpoint of the bounding box
 * is considered to return the sibling. If &lt;0, the left sibling is
 * favored, if >0, the right sibling
 */
export function offsetFromPoint(
  mathfield: _Mathfield,
  x: number,
  y: number,
  options?: { bias?: -1 | 0 | 1 }
): Offset {
  //
  // 1/ Check if we're inside the mathfield bounding box
  //
  const bounds = mathfield.field
    .querySelector('.ML__latex')!
    .getBoundingClientRect();
  if (!bounds) return 0;
  if (x > bounds.right || y > bounds.bottom + 8)
    return mathfield.model.lastOffset;

  if (x < bounds.left || y < bounds.top - 8) return 0;

  options = options ?? {};
  options.bias = options.bias ?? 0;

  //
  // 2/ Find the deepest element that is near the point that was
  // clicked on (the point could be outside of the element)
  //
  let atom = nearestAtomFromPoint(mathfield, x, y);

  //
  // 3/ Find the first parent from root that doesn't have a `captureSelection`
  //    flag
  //
  const parents: Atom[] = [];
  let parent = atom;
  while (parent) {
    parents.unshift(parent);
    parent = parent.parent!;
  }
  for (const x of parents) {
    if (x.captureSelection) {
      atom = x;
      break;
    }
  }

  let result = mathfield.model.offsetOf(atom);

  if (result < 0) return -1;

  //
  // 4/ Account for the desired bias
  //
  if (atom.leftSibling) {
    const skipMidlineBias =
      atom.type === 'placeholder' || atom.type === 'prompt';
    if (options.bias === 0 && !skipMidlineBias) {
      // If the point clicked is to the left of the vertical midline,
      // adjust the offset to *before* the atom (i.e. after the
      // preceding atom)
      const bounds = getAtomBounds(mathfield, atom);
      if (bounds && x < (bounds.left + bounds.right) / 2)
        result = mathfield.model.offsetOf(atom.leftSibling);
    } else if (options.bias < 0)
      result = mathfield.model.offsetOf(atom.leftSibling);
  }

  return result;
}
