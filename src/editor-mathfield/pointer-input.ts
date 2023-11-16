import { on, off, getAtomBounds, Rect } from './utils';
import type { _Mathfield } from './mathfield-private';
import { requestUpdate } from './render';
import { Offset } from '../public/mathfield';
import { Atom } from '../core/atom-class';
import { acceptCommandSuggestion } from './autocomplete';
import { selectGroup } from '../editor-model/commands-select';

let gLastTap: { x: number; y: number; time: number } | null = null;
let gTapCount = 0;

function isPointerEvent(evt: Event | null): evt is PointerEvent {
  return (
    evt !== null &&
    globalThis.PointerEvent !== undefined &&
    evt instanceof PointerEvent
  );
}

export function onPointerDown(mathfield: _Mathfield, evt: PointerEvent): void {
  //Reset the atom bounds cache
  mathfield.atomBoundsCache = new Map<string, Rect>();

  const that = mathfield;
  let anchor: Offset;
  let trackingPointer = false;
  let trackingWords = false;
  let dirty: 'none' | 'selection' | 'all' = 'none';

  // If a mouse button other than the main one was pressed, return.
  if (evt.buttons > 1) return;

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
  function endPointerTracking(evt: null | PointerEvent | MouseEvent): void {
    if ('PointerEvent' in window) {
      off(field, 'pointermove', onPointerMove);
      off(
        field,
        'pointerup pointercancel',
        endPointerTracking as EventListener
      );
      if (isPointerEvent(evt)) field.releasePointerCapture(evt.pointerId);
    } else {
      off(window, 'mousemove', onPointerMove);
      off(window, 'mouseup blur', endPointerTracking as EventListener);
    }

    trackingPointer = false;
    clearInterval(scrollInterval);
    mathfield.element!.classList.remove('tracking');
    if (evt) evt.preventDefault();
  }

  function onPointerMove(evt: PointerEvent | MouseEvent): void {
    // If we've somehow lost focus, end tracking
    if (!that.hasFocus()) {
      endPointerTracking(null);
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

    // Prevent synthetic mouseMove event when this is a touch event
    evt.preventDefault();
    evt.stopPropagation();
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
  if (
    anchorX >= bounds.left &&
    anchorX <= bounds.right &&
    anchorY >= bounds.top &&
    anchorY <= bounds.bottom
  ) {
    // Clicking or tapping the field resets the keystroke buffer
    mathfield.flushInlineShortcutBuffer();
    mathfield.adoptStyle = 'left';

    anchor = offsetFromPoint(mathfield, anchorX, anchorY, {
      bias: 0,
    });
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
      } else if (mathfield.model.at(anchor).type === 'placeholder') {
        mathfield.model.setSelection(anchor - 1, anchor);
        dirty = 'selection';
      } else if (
        mathfield.model.at(anchor).rightSibling?.type === 'placeholder'
      ) {
        mathfield.model.setSelection(anchor, anchor + 1);
        dirty = 'selection';
      } else {
        mathfield.model.position = anchor;
        if (acceptCommandSuggestion(mathfield.model)) dirty = 'all';
        else dirty = 'selection';
      }

      // Reset any user-specified style
      mathfield.style = {};
      // `evt.detail` contains the number of consecutive clicks
      // for double-click, triple-click, etc...
      // (note that `evt.detail` is not set when using pointerEvent)
      if (evt.detail === 3 || gTapCount > 2) {
        endPointerTracking(evt);
        if (evt.detail === 3 || gTapCount === 3) {
          // This is a triple-click
          mathfield.model.selection = {
            ranges: [[0, mathfield.model.lastOffset]],
          };
          dirty = 'all';
        }
      } else if (!trackingPointer) {
        trackingPointer = true;
        if ('PointerEvent' in window) {
          on(field, 'pointermove', onPointerMove);
          on(
            field,
            'pointerup pointercancel',
            endPointerTracking as EventListener
          );
          if (isPointerEvent(evt)) field.setPointerCapture(evt.pointerId);
        } else {
          on(window, 'blur', endPointerTracking as EventListener);
          on(window, 'mousemove', onPointerMove);
          on(window, 'mouseup', endPointerTracking as EventListener);
        }

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
      mathfield.focus({ preventScroll: true });
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

  //
  // 1. Consider any children within the horizontal bounds
  //
  if (
    atom.hasChildren &&
    !atom.captureSelection &&
    x >= bounds.left &&
    x <= bounds.right
  ) {
    for (const child of atom.children) {
      const r = nearestAtomFromPointRecursive(mathfield, cache, child, x, y);
      if (r[0] <= result[0]) result = r;
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
 * is considered to return the sibling. If <0, the left sibling is
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
  const bounds = mathfield.fieldContent?.getBoundingClientRect();
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
    if (options.bias === 0 && atom.type !== 'placeholder') {
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
