import { pathFromString, clone as clonePath } from './path';
import {
    setPath,
    selectGroup,
    setRange,
    selectAll,
    filter,
} from './model-selection';
import { on, off } from './mathfield-utils';
import type { MathfieldPrivate } from './mathfield-class';
import { requestUpdate } from './mathfield-render';

let gLastTap: { x: number; y: number; time: number };
let gTapCount = 0;

export function onPointerDown(
    mathfield: MathfieldPrivate,
    evt: PointerEvent
): void {
    const that = mathfield;
    let anchor;
    let trackingPointer = false;
    let trackingWords = false;
    let dirty = false;

    // If a mouse button other than the main one was pressed, return.
    // On iOS 12.4 Safari and Firefox on Android (which do not support
    // PointerEvent) the touchstart event is sent with event.buttons = 0
    // which for a mouse event would normally be an
    // invalid button. Accept this button 0.
    if (evt.buttons !== 1 && evt.buttons !== 0) {
        return;
    }
    let scrollLeft = false;
    let scrollRight = false;
    // Note: evt['touches'] is for touchstart (when PointerEvent is not supported)
    const anchorX = evt['touches'] ? evt['touches'][0].clientX : evt.clientX;
    const anchorY = evt['touches'] ? evt['touches'][0].clientY : evt.clientY;
    const anchorTime = Date.now();
    const scrollInterval = setInterval(() => {
        if (scrollLeft) {
            that.field.scroll({ top: 0, left: that.field.scrollLeft - 16 });
        } else if (scrollRight) {
            that.field.scroll({ top: 0, left: that.field.scrollLeft + 16 });
        }
    }, 32);
    function endPointerTracking(evt: PointerEvent): void {
        if (window.PointerEvent) {
            off(that.field, 'pointermove', onPointerMove);
            off(that.field, 'pointerup pointercancel', endPointerTracking);
            // off(window, 'pointermove', onPointerMove);
            // off(window, 'pointerup blur', endPointerTracking);
            that.field.releasePointerCapture(evt.pointerId);
        } else {
            off(that.field, 'touchmove', onPointerMove);
            off(that.field, 'touchcancel touchend', endPointerTracking);
            off(window, 'mousemove', onPointerMove);
            off(window, 'mouseup blur', endPointerTracking);
        }
        trackingPointer = false;
        clearInterval(scrollInterval);
        that.element
            .querySelectorAll('.ML__scroller')
            .forEach((x) => x.parentNode.removeChild(x));
        evt.preventDefault();
        evt.stopPropagation();
    }

    function onPointerMove(evt: PointerEvent) {
        const x = evt['touches'] ? evt['touches'][0].clientX : evt.clientX;
        const y = evt['touches'] ? evt['touches'][0].clientY : evt.clientY;
        // Ignore events that are within small spatial and temporal bounds
        // of the pointer down
        const hysteresis = evt.pointerType === 'touch' ? 20 : 5;
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
        let actualAnchor = anchor;
        if (window.PointerEvent) {
            if (!evt.isPrimary) {
                actualAnchor = pathFromPoint(that, evt.clientX, evt.clientY, {
                    bias: 0,
                });
            }
        } else {
            if (evt['touches'] && evt['touches'].length === 2) {
                actualAnchor = pathFromPoint(
                    that,
                    evt['touches'][1].clientX,
                    evt['touches'][1].clientY,
                    { bias: 0 }
                );
            }
        }
        const focus = pathFromPoint(that, x, y, {
            bias: x <= anchorX ? (x === anchorX ? 0 : -1) : +1,
        });
        if (
            focus &&
            setRange(that.model, actualAnchor, focus, {
                extendToWordBoundary: trackingWords,
            })
        ) {
            // Re-render if the range has actually changed
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
        if (!mathfield.$hasFocus()) {
            dirty = true;
            if (mathfield.textarea.focus) {
                mathfield.textarea.focus();
            }
        }

        // Clicking or tapping the field resets the keystroke buffer and
        // smart mode
        mathfield.resetKeystrokeBuffer();
        mathfield.smartModeSuppressed = false;

        const wrapperBounds = mathfield.field
            .querySelector('.ML__mathlive')
            .getBoundingClientRect();
        if (anchorX > wrapperBounds.right) {
            // If outside the bounds of the rendered formula,
            // set the anchor to the last element of the root
            anchor = [
                {
                    relation: 'body',
                    offset: mathfield.model.root.body.length - 1,
                },
            ];
        } else {
            anchor = pathFromPoint(mathfield, anchorX, anchorY, { bias: 0 });
        }
        if (anchor) {
            // Create divs to block out pointer tracking to the left and right of
            // the mathfield (to avoid triggering the hover of the virtual
            // keyboard toggle, for example)
            let div = document.createElement('div');
            div.className = 'ML__scroller';
            mathfield.element.appendChild(div);
            div.style.left = bounds.left - 200 + 'px';
            div = document.createElement('div');
            div.className = 'ML__scroller';
            mathfield.element.appendChild(div);
            div.style.left = bounds.right + 'px';

            if (evt.shiftKey) {
                // Extend the selection if the shift-key is down
                setRange(mathfield.model, mathfield.model.path, anchor);
                anchor = clonePath(mathfield.model.path);
                anchor[anchor.length - 1].offset -= 1;
            } else {
                setPath(mathfield.model, anchor, 0);
            }

            // The selection has changed, so we'll need to re-render
            dirty = true;

            // Reset any user-specified style
            mathfield.style = {};
            // evt.detail contains the number of consecutive clicks
            // for double-click, triple-click, etc...
            // (note that evt.detail is not set when using pointerEvent)
            if (evt.detail === 3 || gTapCount > 2) {
                endPointerTracking(evt);
                if (evt.detail === 3 || gTapCount === 3) {
                    // This is a triple-click
                    selectAll(mathfield.model);
                }
            } else if (!trackingPointer) {
                trackingPointer = true;
                if (window.PointerEvent) {
                    on(that.field, 'pointermove', onPointerMove);
                    on(
                        that.field,
                        'pointerup pointercancel',
                        endPointerTracking
                    );
                    that.field.setPointerCapture(evt.pointerId);
                } else {
                    on(window, 'blur', endPointerTracking);
                    if (evt['touches']) {
                        // This is a touchstart event (and PointerEvent is not supported)
                        // To receive the subsequent touchmove/touch, need to
                        // listen to this evt.target.
                        // This was a touch event
                        on(evt.target, 'touchmove', onPointerMove);
                        on(
                            evt.target,
                            'touchcancel touchend',
                            endPointerTracking
                        );
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
    // Prevent the browser from handling, in particular when this is a
    // touch event prevent the synthetic mouseDown event from being generated
    evt.preventDefault();
}

/**
 * Return a tuple of an element and a distance from point (x, y)
 */
function nearestElementFromPoint(
    el: HTMLElement,
    x: number,
    y: number
): { distance: number; element: HTMLElement } {
    let result = { element: null, distance: Number.POSITIVE_INFINITY };

    // This element may not have a matching atom, but its children might
    let considerChildren = true;

    if (el.getAttribute('data-atom-id')) {
        result.element = el;

        // Calculate the (square of the) distance to the rectangle
        const r = el.getBoundingClientRect();
        const dx = x - (r.left + r.right) / 2;
        const dy = y - (r.top + r.bottom) / 2;
        result.distance = dx * dx + dy * dy;

        // Only consider children if the target is inside the (horizontal)
        // bounds of the element.
        // This avoid searching the numerator/denominator when a fraction
        // is the last element in the formula.
        considerChildren = x >= r.left && x <= r.right;
    }

    if (considerChildren && el.children) {
        for (const child of el.children) {
            const nearest = nearestElementFromPoint(child as HTMLElement, x, y);
            if (nearest.element && nearest.distance <= result.distance) {
                result = nearest;
            }
        }
    }

    return result;
}

/**
 * @param options.bias  if 0, the midpoint of the bounding box
 * is considered to return the sibling. If <0, the left sibling is
 * favored, if >0, the right sibling
 */
export function pathFromPoint(
    mathfield: MathfieldPrivate,
    x: number,
    y: number,
    options?: { bias?: number }
) {
    options = options ?? {};
    options.bias = options.bias ?? 0;
    let result;
    // Try to find the deepest element that is near the point that was
    // clicked on (the point could be outside of the element)
    const nearest = nearestElementFromPoint(mathfield.field, x, y);
    const el = nearest.element;
    const id = el ? el.getAttribute('data-atom-id') : null;
    if (id) {
        // Let's find the atom that has a matching ID with the element that
        // was clicked on (or near)
        const paths = filter(mathfield.model, (_path, atom) => {
            // If the atom allows children to be selected, match only if
            // the ID of  the atom matches the one we're looking for.
            if (!atom.captureSelection) {
                return atom.id === id;
            }
            // If the atom does not allow children to be selected
            // (captureSelection === true), the element matches if any of
            // its children has an ID that matches.
            return atom.filter((childAtom) => childAtom.id === id).length > 0;
        });
        if (paths && paths.length > 0) {
            // (There should be exactly one atom that matches this ID...)
            // Set the result to the path to this atom
            result = pathFromString(paths[0]).path;
            if (options.bias === 0) {
                // If the point clicked is to the left of the vertical midline,
                // adjust the path to *before* the atom (i.e. after the
                // preceding atom)
                const bounds = el.getBoundingClientRect();
                if (
                    x < bounds.left + bounds.width / 2 &&
                    !el.classList.contains('ML__placeholder')
                ) {
                    result[result.length - 1].offset = Math.max(
                        0,
                        result[result.length - 1].offset - 1
                    );
                }
            } else if (options.bias < 0) {
                result[result.length - 1].offset = Math.min(
                    mathfield.model.siblings().length - 1,
                    Math.max(0, result[result.length - 1].offset + options.bias)
                );
            }
        }
    }
    return result;
}
