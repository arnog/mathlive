import { _Mathfield } from '../editor-mathfield/mathfield-private';
import { MathfieldProxy } from '../public/virtual-keyboard';
import type { _Model } from 'editor-model/model-private';
import type { Style } from 'public/core-types';

export function makeProxy(mf: _Mathfield): MathfieldProxy {
  return {
    value: mf.model.getValue(),
    selectionIsCollapsed: mf.model.selectionIsCollapsed,
    canUndo: mf.canUndo(),
    canRedo: mf.canRedo(),
    style: commonStyle(mf.model),
    mode: mf.model.mode,
  };
}

function commonStyle(model: _Model): Readonly<Style> {
  if (model.selectionIsCollapsed) return model.at(model.position)?.style;

  // Potentially multiple atoms selected, return the COMMON styles
  const selectedAtoms = model.getAtoms(model.selection);
  if (selectedAtoms.length === 0) return {};
  const style = { ...selectedAtoms[0].style };
  for (const atom of selectedAtoms) {
    for (const [key, value] of Object.entries(atom.style))
      if (style[key] !== value) delete style[key];
  }

  return style;
}
