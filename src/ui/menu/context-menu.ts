import { eventLocation, keyboardModifiersFromEvent } from 'ui/events/utils';
import { Menu } from './menu';
import { onLongPress } from 'ui/events/longpress';

export function onContextMenu(
  event: Event,
  target: Element,
  menu: Menu,
  onTrigger?: () => void
): boolean {
  //
  // The context menu gesture (right-click, control-click, etc..)
  // was triggered
  //
  if (event.type === 'contextmenu') {
    const evt = event as MouseEvent;
    onTrigger?.();
    menu.show({
      container: target,
      location: { x: Math.round(evt.clientX), y: Math.round(evt.clientY) },
      modifiers: keyboardModifiersFromEvent(evt),
    });
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  //
  // The context menu keyboard shortcut (shift+F10) was triggered
  //
  if (event.type === 'keydown') {
    const evt = event as KeyboardEvent;
    if (evt.code === 'ContextMenu' || (evt.code === 'F10' && evt.shiftKey)) {
      // Shift+F10 = contextual menu
      // Get the center of the parent
      const bounds = target?.getBoundingClientRect();
      if (bounds) {
        onTrigger?.();
        menu.show({
          container: target,
          location: {
            x: Math.round(bounds.left + bounds.width / 2),
            y: Math.round(bounds.top + bounds.height / 2),
          },
          modifiers: keyboardModifiersFromEvent(evt),
        });
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    }
  }

  //
  // This might be a long press...
  //
  if (event.type === 'pointerdown') {
    // Are we inside the target element?
    let eventTarget = event.target as HTMLElement;
    while (eventTarget && target !== eventTarget)
      eventTarget = eventTarget.parentNode as HTMLElement;
    if (!eventTarget) return false;

    const pt = eventLocation(event);
    const modifiers = keyboardModifiersFromEvent(event);
    onLongPress(event, () => {
      if (menu.state !== 'closed') return;
      onTrigger?.();
      menu.show({ container: target, location: pt, modifiers });
    });
    return true;
  }

  return false;
}
