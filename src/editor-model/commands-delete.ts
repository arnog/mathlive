import { register } from '../editor/commands';
import type { ModelPrivate } from './model-private';
import { deleteForward, deleteBackward, deleteRange } from './delete';
import { wordBoundaryOffset } from './commands';

register(
  {
    deleteAll: (model: ModelPrivate): boolean => {
      return deleteRange(model, [0, -1]);
    },
    deleteForward: (model: ModelPrivate): boolean => deleteForward(model),
    deleteBackward: (model: ModelPrivate): boolean => deleteBackward(model),
    deleteNextWord: (model: ModelPrivate): boolean =>
      deleteRange(model, [
        model.anchor,
        wordBoundaryOffset(model, model.position, 'forward'),
      ]),
    deletePreviousWord: (model: ModelPrivate): boolean =>
      deleteRange(model, [
        model.anchor,
        wordBoundaryOffset(model, model.position, 'backward'),
      ]),
    deleteToGroupStart: (model: ModelPrivate): boolean =>
      deleteRange(model, [
        model.anchor,
        model.offsetOf(model.at(model.position).firstSibling),
      ]),
    deleteToGroupEnd: (model: ModelPrivate): boolean =>
      deleteRange(model, [
        model.anchor,
        model.offsetOf(model.at(model.position).lastSibling),
      ]),
    deleteToMathFieldStart: (model: ModelPrivate): boolean =>
      deleteRange(model, [model.anchor, 0]),
    deleteToMathFieldEnd: (model: ModelPrivate): boolean =>
      deleteRange(model, [model.anchor, -1]),
  },
  { target: 'model', category: 'delete' }
);
