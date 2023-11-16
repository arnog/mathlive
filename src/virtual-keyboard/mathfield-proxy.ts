import { _Mathfield } from '../editor-mathfield/mathfield-private';
import { MathfieldProxy } from '../public/virtual-keyboard';

export function makeProxy(mf: _Mathfield): MathfieldProxy {
  return {
    value: mf.model.getValue(),
    selectionIsCollapsed: mf.model.selectionIsCollapsed,
    canUndo: mf.canUndo(),
    canRedo: mf.canRedo(),
    style: mf.selectionStyle,
    mode: mf.model.mode,
  };
}
