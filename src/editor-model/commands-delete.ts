import { register } from '../editor/commands';
import type { _Model } from './model-private';
import { deleteForward, deleteBackward, deleteRange } from './delete';
import { wordBoundaryOffset } from './commands';

register(
  {
    deleteAll: (model: _Model): boolean =>
      model.contentWillChange({ inputType: 'deleteContent' }) &&
      deleteRange(model, [0, -1], 'deleteContent'),
    deleteForward: (model: _Model): boolean => deleteForward(model),
    deleteBackward: (model: _Model): boolean => deleteBackward(model),
    deleteNextWord: (model: _Model): boolean =>
      model.contentWillChange({ inputType: 'deleteWordForward' }) &&
      deleteRange(
        model,
        [model.anchor, wordBoundaryOffset(model, model.position, 'forward')],
        'deleteWordForward'
      ),
    deletePreviousWord: (model: _Model): boolean =>
      model.contentWillChange({ inputType: 'deleteWordBackward' }) &&
      deleteRange(
        model,
        [model.anchor, wordBoundaryOffset(model, model.position, 'backward')],
        'deleteWordBackward'
      ),
    deleteToGroupStart: (model: _Model): boolean =>
      model.contentWillChange({ inputType: 'deleteSoftLineBackward' }) &&
      deleteRange(
        model,
        [model.anchor, model.offsetOf(model.at(model.position).firstSibling)],
        'deleteSoftLineBackward'
      ),
    deleteToGroupEnd: (model: _Model): boolean =>
      model.contentWillChange({ inputType: 'deleteSoftLineForward' }) &&
      deleteRange(
        model,
        [model.anchor, model.offsetOf(model.at(model.position).lastSibling)],
        'deleteSoftLineForward'
      ),
    deleteToMathFieldStart: (model: _Model): boolean =>
      model.contentWillChange({ inputType: 'deleteHardLineBackward' }) &&
      deleteRange(model, [model.anchor, 0], 'deleteHardLineBackward'),
    deleteToMathFieldEnd: (model: _Model): boolean =>
      model.contentWillChange({ inputType: 'deleteHardLineForward' }) &&
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
