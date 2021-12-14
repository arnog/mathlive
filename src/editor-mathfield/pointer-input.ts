import { on, off, getAtomBounds, Rect } from './utils';
import type { MathfieldPrivate } from './mathfield-private';
import { requestUpdate } from './render';
import { Offset } from '../public/mathfield';
import { Atom } from '../core/atom-class';
import { acceptCommandSuggestion } from './autocomplete';
import { selectGroup } from '../editor-model/commands-select';

let gLastTap: { x: number; y: number; time: number } | null = null;
let gTapCount = 0;

function isTouchEvent(evt: Event): evt is TouchEvent {
  return globalThis.TouchEvent !== undefined && evt instanceof TouchEvent;
}

export function onPointerDown(
  mathfield: MathfieldPrivate,
  evt: PointerEvent | TouchEvent
): void {
  //Reset the atom bounds cache
  mathfield._atomBoundsCache = new Map<string, Rect>();

  const that = mathfield;
  let anchor: Offset;
  let trackingPointer = false;
  let trackingWords = false;
  let dirty: 'none' | 'selection' | 'all' = 'none';

  // If a mouse button other than the main one was pressed, return.
  // On iOS 12.4 Safari and Firefox on Android (which do not support
  // PointerEvent) the touchstart event is sent with event.buttons = 0
  // which for a mouse event would normally be an invalid button.
  // Accept this button 0.
  if (evt instanceof PointerEvent && evt.buttons !== 1 && evt.buttons !== 0) {
    return;
  }

  let scrollLeft = false;
  let scrollRight = false;
  // Note: evt['touches'] is for touchstart (when PointerEvent is not supported)
  const anchorX = isTouchEvent(evt) ? evt.touches[0].clientX : evt.clientX;
  const anchorY = isTouchEvent(evt) ? evt.touches[0].clientY : evt.clientY;
  const anchorTime = Date.now();
  const field = that.field!;
  const scrollInterval = setInterval(() => {
    if (scrollLeft) {
      field.scroll({ top: 0, left: field.scrollLeft - 16 });
    } else if (scrollRight) {
      field.scroll({ top: 0, left: field.scrollLeft + 16 });
    }
  }, 32);
  function endPointerTracking(evt: null | PointerEvent | TouchEvent): void {
    if (window.PointerEvent) {
      off(field, 'pointermove', onPointerMove);
      off(
        field,
        'pointerup pointercancel',
        endPointerTracking as EventListener
      );
      if (evt instanceof PointerEvent) {
        field.releasePointerCapture(evt.pointerId);
      }
    } else {
      off(field, 'touchmove', onPointerMove);
      off(field, 'touchcancel touchend', endPointerTracking as EventListener);
      off(window, 'mousemove', onPointerMove);
      off(window, 'mouseup blur', endPointerTracking as EventListener);
    }

    trackingPointer = false;
    clearInterval(scrollInterval);
    mathfield.element!.classList.remove('tracking');
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
  }

  function onPointerMove(evt: PointerEvent | TouchEvent): void {
    // If we've somehow lost focus, end tracking
    if (!that.hasFocus()) {
      endPointerTracking(null);
      return;
    }

    const x = isTouchEvent(evt) ? evt.touches[0].clientX : evt.clientX;
    const y = isTouchEvent(evt) ? evt.touches[0].clientY : evt.clientY;
    // Ignore events that are within small spatial and temporal bounds
    // of the pointer down
    const hysteresis =
      isTouchEvent(evt) || evt.pointerType === 'touch' ? 20 : 5;
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
    let actualAnchor: Offset = anchor;
    if (evt instanceof PointerEvent) {
      if (!evt.isPrimary) {
        actualAnchor = offsetFromPoint(that, evt.clientX, evt.clientY, {
          bias: 0,
        });
      }
    } else if (evt.touches && evt.touches.length === 2) {
      actualAnchor = offsetFromPoint(
        that,
        evt.touches[1].clientX,
        evt.touches[1].clientY,
        { bias: 0 }
      );
    }

    const focus = offsetFromPoint(that, x, y, {
      bias: x <= anchorX ? (x === anchorX ? 0 : -1) : +1,
    });
    if (trackingWords) {
      // @revisit: extend focus, actualAnchor to word boundary
    }

    if (actualAnchor >= 0 && focus >= 0) {
      that.model.extendSelectionTo(actualAnchor, focus);
      requestUpdate(mathfield);
    }

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
    // Focus the mathfield
    if (!mathfield.hasFocus()) {
      dirty = 'all';
      mathfield.keyboardDelegate!.focus();
    }

    // Clicking or tapping the field resets the keystroke buffer and
    // smart mode
    mathfield.resetKeystrokeBuffer();
    mathfield.smartModeSuppressed = false;

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
        if (acceptCommandSuggestion(mathfield.model) || wasCollapsed) {
          dirty = 'all';
        } else {
          dirty = 'selection';
        }
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
        if (acceptCommandSuggestion(mathfield.model)) {
          dirty = 'all';
        } else {
          dirty = 'selection';
        }
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
        if (window.PointerEvent) {
          on(field, 'pointermove', onPointerMove);
          on(
            field,
            'pointerup pointercancel',
            endPointerTracking as EventListener
          );
          if (evt instanceof PointerEvent) {
            field.setPointerCapture(evt.pointerId);
          }
        } else {
          on(window, 'blur', endPointerTracking as EventListener);
          if (isTouchEvent(evt) && evt.touches) {
            // This is a touchstart event (and PointerEvent is not supported)
            // To receive the subsequent touchmove/touch, need to
            // listen to this evt.target.
            // This was a touch event
            on(evt.target!, 'touchmove', onPointerMove);
            on(
              evt.target!,
              'touchcancel touchend',
              endPointerTracking as EventListener
            );
          } else {
            on(window, 'mousemove', onPointerMove);
            on(window, 'mouseup', endPointerTracking as EventListener);
          }
        }

        if (evt.detail === 2 || gTapCount === 2) {
          // This is a double-click
          trackingWords = true;
          selectGroup(mathfield.model);
          dirty = 'all';
        }
      }
    }
  } else {
    gLastTap = null;
  }

  if (dirty !== 'none') {
    if (mathfield.model.selectionIsCollapsed) dirty = 'all';
    requestUpdate(mathfield);
  }

  // Prevent the browser from handling. In particular when this is a
  // touch event, prevent the synthetic mouseDown event from being generated
  evt.preventDefault();
}

function distance(x: number, y: number, r: Rect): number {
  const dx = x - (r.left + r.right) / 2;
  const dy = y - (r.top + r.bottom) / 2;
  return dx * dx + dy * dy;
}

function nearestAtomFromPointRecursive(
  mathfield: MathfieldPrivate,
  cache: Map<string, [distance: number, atom: Atom | null]>,
  atom: Atom,
  x: number,
  y: number
): [distance: number, atom: Atom | null] {
  if (!atom.id) return [Infinity, null];
  if (cache.has(atom.id)) return cache.get(atom.id)!;

  const bounds = getAtomBounds(mathfield, atom);
  if (!bounds) return [Infinity, null];

  let result: [distance: number, atom: Atom | null] = [
    distance(x, y, bounds),
    atom,
  ];
  /**
  let latex = String.raw`\begin{bmatrix}
    {\placeholder{}} &{\placeholder{}}   \\
    {\placeholder{}} &{\placeholder{}}   \\
    {\placeholder{}} &{\placeholder{}}   
  \end{bmatrix}`

  when a latex with placeholder like this, the group atom's distance less than it's children. so ignore the gourp distance
   */
  if (atom.type === 'group') {
    result[0] = Infinity;
  }
  //
  // 1. Consider any children within the horizontal bounds
  //
  if (
    !atom.captureSelection &&
    x >= bounds.left &&
    x <= bounds.right &&
    atom.hasChildren
  ) {
    for (const child of atom.children) {
      const r = nearestAtomFromPointRecursive(mathfield, cache, child, x, y);
      if (r[0] < result[0]) result = r;
    }
  }

  //
  // 2. If no children matched, this atom matches
  //
  if (!result[1]) {
    result = [distance(x, y, bounds), atom];
  }
  cache.set(atom.id, result);
  return result;
}

function nearestAtomFromPoint(
  mathfield: MathfieldPrivate,
  x: number,
  y: number
): Atom {
  const [, atom] = nearestAtomFromPointRecursive(
    mathfield,
    new Map(),
    mathfield.model.root,
    x,
    y
  )!;
  return atom!;
}

/**
 * @param options.bias  if 0, the midpoint of the bounding box
 * is considered to return the sibling. If <0, the left sibling is
 * favored, if >0, the right sibling
 */
export function offsetFromPoint(
  mathfield: MathfieldPrivate,
  x: number,
  y: number,
  options?: { bias?: -1 | 0 | 1 }
): Offset {
  //
  // 1/ Check if we're inside the mathfield bounding box
  //
  const bounds = mathfield.fieldContent!.getBoundingClientRect();
  if (x > bounds.right || y > bounds.bottom + 8) {
    return mathfield.model.lastOffset;
  }

  if (x < bounds.left || y < bounds.top - 8) {
    return 0;
  }

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
  // 4/ Account for the desired biad
  //
  if (atom.leftSibling) {
    if (options.bias === 0 && atom.type !== 'placeholder') {
      // If the point clicked is to the left of the vertical midline,
      // adjust the offset to *before* the atom (i.e. after the
      // preceding atom)
      const bounds = getAtomBounds(mathfield, atom);
      if (bounds && x < (bounds.left + bounds.right) / 2) {
        result = mathfield.model.offsetOf(atom.leftSibling);
      }
    } else if (options.bias < 0) {
      result = mathfield.model.offsetOf(atom.leftSibling);
    }
  }

  return result;
}
