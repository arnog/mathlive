import { eventLocation, keyboardModifiersFromEvent } from '../events/utils';
import { onLongPress } from '../events/longpress';

import { Menu } from './menu';

/**
 * Return `true` if the context menu was triggered by the event.
 *
 * The function is asynchronous because it may need to wait for a long press
 * to complete.
 *
 * @param event
 * @param target
 * @param menu
 * @returns
 */
export async function onContextMenu(
  event: Event,
  target: Element,
  menu: Menu
): Promise<boolean> {
  if (event.defaultPrevented) return false;
  //
  // The context menu gesture (right-click, control-click, etc..)
  // may have been triggered
  //
  if (event.type === 'contextmenu') {
    const evt = event as MouseEvent;
    if (
      menu.show({
        target,
        location: eventLocation(evt),
        modifiers: keyboardModifiersFromEvent(evt),
      })
    ) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }

  //
  // The context menu keyboard shortcut (shift+F10) was triggered
  //
  if (event.type === 'keydown') {
    const evt = event as KeyboardEvent;
    if (evt.code === 'ContextMenu' || (evt.code === 'F10' && evt.shiftKey)) {
      // Shift+F10 = context menu
      // Get the center of the parent
      const bounds = target?.getBoundingClientRect();
      if (
        acceptContextMenu(target) &&
        bounds &&
        menu.show({
          target: target,
          location: {
            x: Math.ceil(bounds.left + bounds.width / 2),
            y: Math.ceil(bounds.top + bounds.height / 2),
          },
          modifiers: keyboardModifiersFromEvent(evt),
        })
      ) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    }
  }

  //
  // This might be a long press...
  //
  if (
    event.type === 'pointerdown' &&
    (event as PointerEvent).pointerType !== 'mouse' &&
    (event as PointerEvent).button === 0
  ) {
    // Are we inside the target element?
    let eventTarget = event.target as HTMLElement;
    while (eventTarget && target !== eventTarget)
      eventTarget = eventTarget.parentNode as HTMLElement;
    if (!eventTarget) return false;

    // If no items visible, don't show anything
    if (!menu.visible) return false;

    const location = eventLocation(event);
    if (await onLongPress(event)) {
      if (menu.state !== 'closed') return false;
      if (!acceptContextMenu(target)) return false;
      menu.show({ target, location });
      return true;
    }
  }

  return false;
}

function acceptContextMenu(host: Element): boolean {
  return host.dispatchEvent(new Event('contextmenu', { cancelable: true }));
}
