import { MathfieldPrivate } from '../editor-mathfield/mathfield-private';
import { MathfieldProxy } from '../public/virtual-keyboard';

export function makeProxy(mf: MathfieldPrivate): MathfieldProxy {
  return {
    value: mf.model.getValue(),
    selectionIsCollapsed: mf.model.selectionIsCollapsed,
    canUndo: mf.canUndo(),
    canRedo: mf.canRedo(),
    style: mf.selectionStyle,
    array: mf.model.parentEnvironment,
    boundingRect: mf.field?.getBoundingClientRect(),
    mode: mf.mode,
  };
}
