import { on, off, getAtomBounds, Rect } from './utils';
import type { MathfieldPrivate } from './mathfield-private';
import { requestUpdate } from './render';
import { Offset } from '../public/mathfield';
import { Atom } from '../core/atom-class';
import { acceptCommandSuggestion } from './autocomplete';
import { selectGroup } from '../editor-model/commands-select';

let gLastTap: { x: number; y: number; time: number };
let gTapCount = 0;

export function onPointerDown(
  mathfield: MathfieldPrivate,
  evt: PointerEvent | TouchEvent
): void {
  const that = mathfield;
  let anchor: Offset;
  let trackingPointer = false;
  let trackingWords = false;
  let dirty = false;

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
  const anchorX =
    evt instanceof TouchEvent ? evt.touches[0].clientX : evt.clientX;
  const anchorY =
    evt instanceof TouchEvent ? evt.touches[0].clientY : evt.clientY;
  const anchorTime = Date.now();
  const scrollInterval = setInterval(() => {
    if (scrollLeft) {
      that.field.scroll({ top: 0, left: that.field.scrollLeft - 16 });
    } else if (scrollRight) {
      that.field.scroll({ top: 0, left: that.field.scrollLeft + 16 });
    }
  }, 32);
  function endPointerTracking(evt?: PointerEvent | TouchEvent): void {
    if (window.PointerEvent) {
      off(that.field, 'pointermove', onPointerMove);
      off(that.field, 'pointerup pointercancel', endPointerTracking);
      if (evt instanceof PointerEvent) {
        that.field.releasePointerCapture(evt.pointerId);
      }
    } else {
      off(that.field, 'touchmove', onPointerMove);
      off(that.field, 'touchcancel touchend', endPointerTracking);
      off(window, 'mousemove', onPointerMove);
      off(window, 'mouseup blur', endPointerTracking);
    }

    trackingPointer = false;
    clearInterval(scrollInterval);
    mathfield.element.classList.remove('tracking');
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
  }

  function onPointerMove(evt: PointerEvent | TouchEvent): void {
    // If we've somehow lost focus, end tracking
    if (!that.hasFocus()) {
      endPointerTracking();
      return;
    }

    const x = evt instanceof TouchEvent ? evt.touches[0].clientX : evt.clientX;
    const y = evt instanceof TouchEvent ? evt.touches[0].clientY : evt.clientY;
    // Ignore events that are within small spatial and temporal bounds
    // of the pointer down
    const hysteresis =
      evt instanceof TouchEvent || evt.pointerType === 'touch' ? 20 : 5;
    if (
      Date.now() < anchorTime + 500 &&
      Math.abs(anchorX - x) < hysteresis &&
      Math.abs(anchorY - y) < hysteresis
    ) {
      evt.preventDefault();
      evt.stopPropagation();
      return;
    }

    const fieldBounds = that.field.getBoundingClientRect();
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
      acceptCommandSuggestion(mathfield.model);
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

  const bounds = mathfield.field.getBoundingClientRect();
  if (
    anchorX >= bounds.left &&
    anchorX <= bounds.right &&
    anchorY >= bounds.top &&
    anchorY <= bounds.bottom
  ) {
    // Focus the mathfield
    if (!mathfield.hasFocus()) {
      dirty = true;
      mathfield.keyboardDelegate.focus();
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
      mathfield.element.classList.add('tracking');

      if (evt.shiftKey) {
        // If the Shift key is down, extend the selection
        // (in that case, 'anchor' is actually the focus
        mathfield.model.extendSelectionTo(mathfield.model.anchor, anchor);
        acceptCommandSuggestion(mathfield.model);
      } else if (mathfield.model.at(anchor).type === 'placeholder') {
        mathfield.model.setSelection(anchor - 1, anchor);
      } else if (
        mathfield.model.at(anchor).rightSibling?.type === 'placeholder'
      ) {
        mathfield.model.setSelection(anchor, anchor + 1);
      } else {
        mathfield.model.position = anchor;
        acceptCommandSuggestion(mathfield.model);
      }

      // The selection has changed, so we'll need to re-render
      dirty = true;

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
        }
      } else if (!trackingPointer) {
        trackingPointer = true;
        if (window.PointerEvent) {
          on(that.field, 'pointermove', onPointerMove);
          on(that.field, 'pointerup pointercancel', endPointerTracking);
          if (evt instanceof PointerEvent) {
            that.field.setPointerCapture(evt.pointerId);
          }
        } else {
          on(window, 'blur', endPointerTracking);
          if (evt instanceof TouchEvent && evt.touches) {
            // This is a touchstart event (and PointerEvent is not supported)
            // To receive the subsequent touchmove/touch, need to
            // listen to this evt.target.
            // This was a touch event
            on(evt.target, 'touchmove', onPointerMove);
            on(evt.target, 'touchcancel touchend', endPointerTracking);
          } else {
            on(window, 'mousemove', onPointerMove);
            on(window, 'mouseup', endPointerTracking);
          }
        }

        if (evt.detail === 2 || gTapCount === 2) {
          // This is a double-click
          trackingWords = true;
          selectGroup(mathfield.model);
        }
      }
    }
  } else {
    gLastTap = null;
  }

  if (dirty) {
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
  atom: Atom,
  x: number,
  y: number
): { distance: number; atom: Atom } {
  let result = { distance: Infinity, atom: null };

  const bounds = getAtomBounds(mathfield, atom);
  if (!bounds) return result;

  //
  // 1. Consider any children within the horizontal bounds
  //
  if (
    !atom.captureSelection &&
    x >= bounds.left &&
    x <= bounds.right &&
    atom.hasChildren
  ) {
    atom.children.forEach((atom) => {
      const r = nearestAtomFromPointRecursive(mathfield, atom, x, y);
      console.log('checking', atom);
      if (r.distance < result.distance) {
        console.log('match');
        result = r;
      }
    });
  }

  //
  // 2. If no children matched, this atom matches
  //
  if (!result.atom) {
    result.atom = atom;
    result.distance = distance(x, y, bounds);
  }

  return result;
}

function nearestAtomFromPoint(
  mathfield: MathfieldPrivate,
  x: number,
  y: number
): Atom {
  return nearestAtomFromPointRecursive(mathfield, mathfield.model.root, x, y)
    .atom;
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
  options?: { bias?: number }
): Offset {
  const bounds = mathfield.fieldContent.getBoundingClientRect();
  if (x > bounds.right || y > bounds.bottom + 8) {
    return mathfield.model.lastOffset;
  }

  if (x < bounds.left || y < bounds.top - 8) {
    return 0;
  }

  options = options ?? {};
  options.bias = options.bias ?? 0;

  // Try to find the deepest element that is near the point that was
  // clicked on (the point could be outside of the element)
  const atom = nearestAtomFromPoint(mathfield, x, y);
  let result = mathfield.model.offsetOf(atom);

  if (result < 0) return -1;

  // (There should be exactly one atom that matches this ID...)
  if (options.bias === 0) {
    // If the point clicked is to the left of the vertical midline,
    // adjust the offset to *before* the atom (i.e. after the
    // preceding atom)
    const bounds = getAtomBounds(mathfield, atom);
    if (x < (bounds.left + bounds.right) / 2 && atom.type !== 'placeholder') {
      result = Math.min(mathfield.model.lastOffset, result - 1);
    }
  } else if (options.bias < 0) {
    result = Math.max(0, result - 1);
  }

  return result;
}
