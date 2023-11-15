import { Atom } from './atom-class';
import { Box } from './box';
import { Context } from './context';

// Atom.measure() --> GeometryWrapper.render() -> Box

// In GeometryWrapper.construtor(), adjust margins of children with horizontal
// layout

// In GeometryWrapper.render(), do what Atom.render() does, but with
// the adjusted margins

// In applyInterBoxSpacing(): no changes

/**
 *
 * ## Limitation of Current Implementation
 *
 * The current implementation follows these steps:
 *
 * 1/ render() in (render.ts) -> contentMarkup() -> makeBox()
 * 2/ makeBox() calls:
 *    2.1/ -> mathfield.model.root.render() -> createBox() -> new Box()
 *    2.2/ applyInterBoxSpacing() -> traverseBoxes() -> adjustType()
 *
 * The dimensions of the atom cannot be known accurately until the
 * interbox spacing is applied. For example, the width of an atom
 * depends on whether it is preceded by a 'bin' atom or not.
 *
 * The width of the fracline depends on the width of the numerator
 * and denominator, which in turn depends on the interbox spacing.
 *
 * As a result, in order for the atoms to display correctly they have to
 * rely on the CSS layout, and cannot be accurately measured.
 *
 * Ideally, render() (which is when the fracline is created, for example)
 * would have the correct dimensions for the numerator and denominator.
 *
 * Instead of two steps (Atom.render() and Box applyInterBoxSpacing()),
 * there should be three:
 * - Atom (with no notion of dimensions/geometry)
 *   - should have a measure() method that creates a GeometryWrapper
 * - GeometryWrapper (which would apply interbox spacing, and adjust
 *   dimensions)
 *   - should have a render() method that creates a Box (move the render
 *     method from the Atom class to here)
 * - Box which would not adjust dimensions, but would only render
 *   to markup
 *
 *
 *
 *
 * ## Theory of Operations
 *
 * The rendering pipleline is as follows:
 *
 * - An Atom represents a typographical representation of a mathematical
 *   object (an ordinary character, an operator, etc...)
 *
 * - A GeometryWrapper tree represents the formula, but accounting
 *   for adjustments to the type of the atoms (for example a 'mrel' atom
 *   is converted to an 'mord' atom if it's the first atom in a formula)
 *   and with some additional spacing atoms inserted (to represent
 *   additional spacing for example between an ordinary atom and
 *   a relational atom).
 *
 * - A tree of Box objects is created from the GeometryWrapper tree. A Box is a
 *   geometric representation of an atom. It has a width, height, depth.
 */
export class GeometryWrapper {
  private _atom: Atom;
  constructor(atom: Atom) {
    this._atom = atom;
  }

  render(context: Context): Box | null {
    return this._atom.render(context);
  }
}
