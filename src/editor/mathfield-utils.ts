import { MathfieldPrivate } from './mathfield-class';

export function on(
    el: EventTarget,
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
            el.addEventListener(m[1], listener, options2);
        } else {
            el.addEventListener(sel, listener, options);
        }
    }
}

export function off(
    el: EventTarget,
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
            el.removeEventListener(m[1], listener, options2);
        } else {
            el.removeEventListener(sel, listener, options);
        }
    }
}

export function getSharedElement(id: string, cls: string): HTMLElement {
    let result = document.getElementById(id);
    if (result) {
        result.setAttribute(
            'data-refcount',
            Number(
                parseInt(result.getAttribute('data-refcount')) + 1
            ).toString()
        );
    } else {
        result = document.createElement('div');
        result.setAttribute('aria-hidden', 'true');
        result.setAttribute('data-refcount', '1');
        result.className = cls;
        result.id = id;
        document.body.appendChild(result);
    }
    return result;
}

// @revisit: check the elements are correctly released
export function releaseSharedElement(el: HTMLElement): void {
    if (!el) return;
    const refcount = parseInt(el.getAttribute('data-refcount'));
    if (refcount <= 1) {
        el.remove();
    } else {
        el.setAttribute('data-refcount', Number(refcount - 1).toString());
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
    return mf.element && mf.element['mathfield'] === mf;
}

/**
 * Return the element which has the caret
 */
function findElementWithCaret(el: Element): Element {
    return (
        el.querySelector('.ML__caret') ??
        el.querySelector('.ML__text-caret') ??
        el.querySelector('.ML__command-carett')
    );
}

/**
 * Return the (x,y) client coordinates of the caret
 */
export function getCaretPoint(
    el: Element
): { x: number; y: number; height: number } | null {
    const caret = findElementWithCaret(el);
    if (caret) {
        const bounds = caret.getBoundingClientRect();
        const position = {
            x: bounds.right,
            y: bounds.bottom,
            height: bounds.height,
        };
        return position;
    }
    return null;
}
export function getSelectionBounds(
    field: Element
): { top: number; bottom: number; left: number; right: number } {
    const selectedNodes = field.querySelectorAll('.ML__selected');
    if (selectedNodes && selectedNodes.length > 0) {
        const selectionRect = {
            top: Infinity,
            bottom: -Infinity,
            left: Infinity,
            right: -Infinity,
        };
        // Calculate the union of the bounds of all the selected spans
        selectedNodes.forEach((node) => {
            const bounds = node.getBoundingClientRect();
            if (bounds.left < selectionRect.left) {
                selectionRect.left = bounds.left;
            }
            if (bounds.right > selectionRect.right) {
                selectionRect.right = bounds.right;
            }
            if (bounds.bottom > selectionRect.bottom) {
                selectionRect.bottom = bounds.bottom;
            }
            if (bounds.top < selectionRect.top) {
                selectionRect.top = bounds.top;
            }
        });
        const fieldRect = field.getBoundingClientRect();
        const w = selectionRect.right - selectionRect.left;
        const h = selectionRect.bottom - selectionRect.top;
        selectionRect.left = Math.ceil(
            selectionRect.left - fieldRect.left + field.scrollLeft
        );
        selectionRect.right = selectionRect.left + w;
        selectionRect.top = Math.ceil(selectionRect.top - fieldRect.top);
        selectionRect.bottom = selectionRect.top + h;
        return selectionRect;
    }
    return null;
}
