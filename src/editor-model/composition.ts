import { _Model } from './model-private';
import { CompositionAtom } from '../atoms/composition';

/**
 * Create, remove or update a composition atom at the current location
 */
export function updateComposition(model: _Model, s: string): void {
  const cursor = model.at(model.position);

  // We're creating or updating a composition
  if (cursor.type === 'composition') {
    // Composition already in progress, update it
    cursor.value = s;
  } else {
    // No composition yet, create one

    // Remove previous caret
    const { caret } = cursor;
    cursor.caret = undefined;

    // Create 'composition' atom, with caret
    const atom = new CompositionAtom(s, { mode: cursor.mode });
    atom.caret = caret;
    cursor.parent!.addChildAfter(atom, cursor);

    // Move cursor one past the composition zone
    model.position += 1;
  }
}

/**
 * Remove the composition zone
 */
export function removeComposition(model: _Model): void {
  const cursor = model.at(model.position);
  if (cursor.type === 'composition') {
    cursor.parent!.removeChild(cursor);
    model.position -= 1;
  }
}
