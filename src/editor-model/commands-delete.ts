import { register } from '../editor/commands';
import type { _Model } from './model-private';
import { deleteForward, deleteBackward, deleteRange } from './delete';
import { skip } from './commands';

register(
  {
    deleteAll: (model: _Model): boolean =>
      model.contentWillChange({ inputType: 'deleteContent' }) &&
      deleteRange(model, [0, -1], 'deleteContent'),
    deleteForward: (model: _Model): boolean => deleteForward(model),
    deleteBackward: (model: _Model): boolean => deleteBackward(model),
    deleteNextWord: (model: _Model): boolean =>
      model.contentWillChange({ inputType: 'deleteWordForward' }) &&
      skip(model, 'forward', { delete: true }),
    deletePreviousWord: (model: _Model): boolean =>
      model.contentWillChange({ inputType: 'deleteWordBackward' }) &&
      skip(model, 'backward', { delete: true }),
    deleteToGroupStart: (model: _Model): boolean => {
      if (!model.contentWillChange({ inputType: 'deleteSoftLineBackward' }))
        return false;
      const pos = model.offsetOf(model.at(model.position).firstSibling);
      if (pos === model.position) {
        model.announce('plonk');
        return false;
      }

      model.deferNotifications(
        { content: true, selection: true, type: 'deleteSoftLineBackward' },
        () => model.deleteAtoms([model.anchor, pos])
      );
      model.position = pos;
      return true;
    },
    deleteToGroupEnd: (model: _Model): boolean => {
      if (!model.contentWillChange({ inputType: 'deleteSoftLineForward' }))
        return false;
      const pos = model.offsetOf(model.at(model.position).lastSibling);
      if (pos === model.position) {
        model.announce('plonk');
        return false;
      }

      model.deferNotifications(
        { content: true, selection: true, type: 'deleteSoftLineForward' },
        () => model.deleteAtoms([model.anchor, pos])
      );
      return true;
    },
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
