import { distance } from 'ui/geometry/utils';
import { eventLocation } from './utils';

export class LongPress {
  static DELAY = 300; // Amount of time before showing the context menu, in ms
  static MAX_DISTANCE = 10; // Maximum distance between the start and end of the gesture, in pixels
}

export function onLongPress(triggerEvent: Event): Promise<boolean> {
  return new Promise((resolve, _reject) => {
    const startPoint = eventLocation(triggerEvent);
    if (!startPoint) resolve(false);

    let lastPoint = startPoint!;

    const timer = setTimeout(() => {
      // Remove the event listeners
      controller.abort();
      resolve(distance(lastPoint, startPoint!) < LongPress.MAX_DISTANCE);
    }, LongPress.DELAY);

    const controller = new AbortController();
    const signal = controller.signal;

    for (const eventType of ['pointermove', 'pointerup', 'pointercancel']) {
      window.addEventListener(
        eventType,
        (evt) => {
          if (evt.type === 'pointerup' || evt.type === 'pointercancel') {
            clearTimeout(timer);
            controller.abort();
            resolve(false);
          } else if (evt.type === 'pointermove') {
            const location = eventLocation(evt);
            if (location) lastPoint = location;
          }
        },
        { passive: true, signal }
      );
    }
  });
}
