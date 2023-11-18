import { distance } from 'ui/geometry/utils';
import { eventLocation } from './utils';

// We use a class to encapsulate the state that needs to be tracked and,
// more importantly, to avoid memory leaks by using the `handleEvent()` hook
// to ensure proper disposal of event handlers
export class LongPressDetector {
  static DELAY = 300; // In ms
  static DISTANCE = 10; // In pixels

  private readonly startPoint?: { x: number; y: number };
  private lastPoint?: { x: number; y: number };

  private timer = 0;

  constructor(triggerEvent: Event, onLongPress: () => void) {
    const location = eventLocation(triggerEvent);
    if (!location) return;

    this.startPoint = location;
    this.lastPoint = location;

    this.timer = setTimeout(() => {
      this.dispose();
      const delta = distance(this.lastPoint!, this.startPoint!);
      if (delta < LongPressDetector.DISTANCE) onLongPress();
    }, LongPressDetector.DELAY);
    for (const evt of ['pointermove', 'pointerup', 'pointercancel'])
      window.addEventListener(evt, this, { passive: true });
  }

  dispose(): void {
    clearTimeout(this.timer);
    this.timer = 0;

    for (const evt of ['pointermove', 'pointerup', 'pointercancel'])
      window.removeEventListener(evt, this);
  }

  handleEvent(event: Event): void {
    if (event.type === 'pointerup' || event.type === 'pointercancel') {
      this.dispose();
      event.stopPropagation();
    } else if (event.type === 'pointermove') {
      const location = eventLocation(event);
      if (location) {
        this.lastPoint = location;
        event.stopPropagation();
      }
    }
  }
}

export function onLongPress(
  triggerEvent: Event,
  onLongPress: () => void
): LongPressDetector {
  return new LongPressDetector(triggerEvent, onLongPress);
}
