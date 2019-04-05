The following selectors can be passed to [`MathField.$perform()`]{@link MathField#$perform}.

### Clipboard 

| Name                 | Description               |
| --------------------- | ------------------------- |
| `undo` | |
| `redo` | |
| `copyToClipboard` | |
| `cutToClipboard` | |
| `pasteFromClipboard` | |

### Selection 

| Name                 | Description               |
| --------------------- | ------------------------- |
| `selectGroup` | Select all the atoms in the current group, that is all the siblings. When the selection is in a numerator, the group is the numerator. When the selection is a superscript or subscript, the group is the supsub.|
| `selectAll` | Select all the atoms in the math field|


### Moving and extending the selection

| Name                 | Description               |
| --------------------- | ------------------------- |
| `moveToNextChar` | |
| `moveToPreviousChar` | |
| `moveUp` | |
| `moveDown` | |
| `moveToNextPlaceholder` | |
| `moveToPreviousPlaceholder` | |
| `moveToNextWord` | |
| `moveToPreviousWord` | |
| `moveToGroupStart` | |
| `moveToGroupEnd` | |
| `moveToMathFieldStart` | |
| `moveToMathFieldEnd` | |
| `moveToSuperscript` | |
| `moveToSubscript` | |
| `moveToOpposite` | |
| `moveBeforeParent` | |
| `moveAfterParent` | |
| `extendToNextChar` | |
| `extendToPreviousChar` | |
| `extendToNextWord` | |
| `extendToPreviousWord` | |
| `extendUp` | |
| `extendDown` | |
| `extendToNextBoundary` | |
| `extendToPreviousBoundary` | |
| `extendToGroupStart` | |
| `extendToGroupEnd` | |
| `extendToMathFieldStart` | |
| `extendToMathFieldEnd` | |

### Editing / deleting

| Name                 | Description               |
| --------------------- | ------------------------- |
| `deleteAll` | Delete everything in the field |
| `delete` | Delete the current selection |
| `deleteNextChar` | |
| `deletePreviousChar` | |
| `deleteNextWord` | |
| `deletePreviousWord` | |
| `deleteToGroupStart` | |
| `deleteToGroupEnd` | |
| `deleteToMathFieldEnd` | |
| `transpose` | |


### Other editing commands

| Name                 | Description               |
| --------------------- | ------------------------- |
| `addRowAfter` | |
| `addRowBefore` | |
| `addColumnAfter` | |
| `addColumnBefore` | |
| `scrollIntoView` | |
| `scrollToStart` | |
| `switchMode` | |
| `complete` | |
| `nextSuggestion` | |
| `previousSuggestion` | |
| `toggleKeystrokeCaption` | |
| `applyStyle` | |

### Virtual Keyboard

| Name                 | Description               |
| --------------------- | ------------------------- |
| `toggleVirtualKeyboard` | |
| `showVirtualKeyboard` | |
| `hideVirtualKeyboard` | |
| `toggleVirtualKeyboardAlt` | |
| `toggleVirtualKeyboardShift` | |
| `showAlternateKeys` | |
| `hideAlternateKeys` | |
| `performAlternateKeys` | |
| `switchKeyboardLayer` | |
| `shiftKeyboardLayer` | |
| `unshiftKeyboardLayer` | |
| `insertAndUnshiftKeyboardLayer` | |
| `performWithFeedback` | |


### Speech

| Name                 | Description               |
| --------------------- | ------------------------- |
| `speakSelection` | |
| `speakParent` | |
| `speakRightSibling` | |
| `speakLeftSibling` | |
| `speakGroup` | |
| `speakAll` | |
| `speakSelectionWithSynchronizedHighlighting` | |
| `speakAllWithSynchronizedHighlighting` | |
