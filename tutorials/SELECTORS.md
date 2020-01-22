The following selectors can be passed to [`"MathField.$perform()"`]{@link MathField#\$perform}.

#### Moving the insertion point

| Name                          | Description |
| ----------------------------- | ----------- |
| `"moveToNextChar"`            |             |
| `"moveToPreviousChar"`        |             |
| `"moveUp"`                    |             |
| `"moveDown"`                  |             |
| `"moveToNextPlaceholder"`     |             |
| `"moveToPreviousPlaceholder"` |             |
| `"moveToNextWord"`            |             |
| `"moveToPreviousWord"`        |             |
| `"moveToGroupStart"`          |             |
| `"moveToGroupEnd"`            |             |
| `"moveToMathFieldStart"`      |             |
| `"moveToMathFieldEnd"`        |             |
| `"moveToSuperscript"`         |             |
| `"moveToSubscript"`           |             |
| `"moveToOpposite"`            |             |
| `"moveBeforeParent"`          |             |
| `"moveAfterParent"`           |             |

#### Selection

| Name            | Description                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"selectGroup"` | Select all the atoms in the current group, that is all the siblings.<br> When the selection is in a numerator, the group is the numerator.<br>When the selection is a superscript or subscript, the group is the supsub. |
| `"selectAll"`   | Select all the atoms in the mathfield                                                                                                                                                                                    |

#### Extending the selection

| Name                         | Description |
| ---------------------------- | ----------- |
| `"extendToNextChar"`         |             |
| `"extendToPreviousChar"`     |             |
| `"extendToNextWord"`         |             |
| `"extendToPreviousWord"`     |             |
| `"extendUp"`                 |             |
| `"extendDown"`               |             |
| `"extendToNextBoundary"`     |             |
| `"extendToPreviousBoundary"` |             |
| `"extendToGroupStart"`       |             |
| `"extendToGroupEnd"`         |             |
| `"extendToMathFieldStart"`   |             |
| `"extendToMathFieldEnd"`     |             |

#### Editing / deleting

| Name                     | Description                    |
| ------------------------ | ------------------------------ |
| `"deleteAll"`            | Delete everything in the field |
| `"delete"`               | Delete the current selection   |
| `"deleteNextChar"`       |                                |
| `"deletePreviousChar"`   |                                |
| `"deleteNextWord"`       |                                |
| `"deletePreviousWord"`   |                                |
| `"deleteToGroupStart"`   |                                |
| `"deleteToGroupEnd"`     |                                |
| `"deleteToMathFieldEnd"` |                                |
| `"transpose"`            |                                |

#### Editing a matrix

| Name                | Description |
| ------------------- | ----------- |
| `"addRowAfter"`     |             |
| `"addRowBefore"`    |             |
| `"addColumnAfter"`  |             |
| `"addColumnBefore"` |             |

#### Other editing commands

| Name                       | Description |
| -------------------------- | ----------- |
| `"scrollIntoView"`         |             |
| `"scrollToStart"`          |             |
| `"switchMode"`             |             |
| `"complete"`               |             |
| `"nextSuggestion"`         |             |
| `"previousSuggestion"`     |             |
| `"toggleKeystrokeCaption"` |             |
| `"applyStyle"`             |             |

#### Clipboard

| Name                   | Description |
| ---------------------- | ----------- |
| `"undo"`               |             |
| `"redo"`               |             |
| `"copyToClipboard"`    |             |
| `"cutToClipboard"`     |             |
| `"pasteFromClipboard"` |             |

#### Virtual Keyboard

| Name                              | Description |
| --------------------------------- | ----------- |
| `"toggleVirtualKeyboard"`         |             |
| `"showVirtualKeyboard"`           |             |
| `"hideVirtualKeyboard"`           |             |
| `"toggleVirtualKeyboardAlt"`      |             |
| `"toggleVirtualKeyboardShift"`    |             |
| `"showAlternateKeys"`             |             |
| `"hideAlternateKeys"`             |             |
| `"performAlternateKeys"`          |             |
| `"switchKeyboardLayer"`           |             |
| `"shiftKeyboardLayer"`            |             |
| `"unshiftKeyboardLayer"`          |             |
| `"insertAndUnshiftKeyboardLayer"` |             |
| `"performWithFeedback"`           |             |

#### Speech

| Name      | Description                                         |
| --------- | --------------------------------------------------- |
| `"speak"` | speaks the amount specified by the first parameter. |
