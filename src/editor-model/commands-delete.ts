import { register } from '../editor/commands';
import { wordBoundaryOffset } from './commands';
import { deleteBackward, deleteForward, deleteRange } from './delete';
import { contentWillChange } from './listeners';

import type { ModelPrivate } from './model-private';
register(
  {
    deleteAll: (model: ModelPrivate): boolean =>
      contentWillChange(model, { inputType: 'deleteContent' }) &&
      deleteRange(model, [0, -1], 'deleteContent'),
    deleteForward: (model: ModelPrivate): boolean => deleteForward(model),
    deleteBackward: (model: ModelPrivate): boolean => deleteBackward(model),
    deleteNextWord: (model: ModelPrivate): boolean =>
      contentWillChange(model, { inputType: 'deleteWordForward' }) &&
      deleteRange(
        model,
        [model.anchor, wordBoundaryOffset(model, model.position, 'forward')],
        'deleteWordForward'
      ),
    deletePreviousWord: (model: ModelPrivate): boolean =>
      contentWillChange(model, { inputType: 'deleteWordBackward' }) &&
      deleteRange(
        model,
        [model.anchor, wordBoundaryOffset(model, model.position, 'backward')],
        'deleteWordBackward'
      ),
    deleteToGroupStart: (model: ModelPrivate): boolean =>
      contentWillChange(model, { inputType: 'deleteSoftLineBackward' }) &&
      deleteRange(
        model,
        [model.anchor, model.offsetOf(model.at(model.position).firstSibling)],
        'deleteSoftLineBackward'
      ),
    deleteToGroupEnd: (model: ModelPrivate): boolean =>
      contentWillChange(model, { inputType: 'deleteSoftLineForward' }) &&
      deleteRange(
        model,
        [model.anchor, model.offsetOf(model.at(model.position).lastSibling)],
        'deleteSoftLineForward'
      ),
    deleteToMathFieldStart: (model: ModelPrivate): boolean =>
      contentWillChange(model, { inputType: 'deleteHardLineBackward' }) &&
      deleteRange(model, [model.anchor, 0], 'deleteHardLineBackward'),
    deleteToMathFieldEnd: (model: ModelPrivate): boolean =>
      contentWillChange(model, { inputType: 'deleteHardLineForward' }) &&
      deleteRange(model, [model.anchor, -1], 'deleteHardLineForward'),
  },
  {
    target: 'model',
    audioFeedback: 'delete',
    canUndo: true,
    changeContent: true,
    changeSelection: true,
  }
);
