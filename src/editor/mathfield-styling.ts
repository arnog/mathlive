import { Style, ParseMode, FontSeries, FontShape } from '../public/core';
import { selectionIsCollapsed, getAnchorMode } from './model-selection';
import { Mathfield } from './mathfield-utils';
import { applyStyle as applyStyleToModel } from './model-styling';

export function applyStyle(mathfield: Mathfield, style) {
    mathfield.resetKeystrokeBuffer();
    style = validateStyle(style);
    if (style.mode) {
        // There's a mode ('text', 'math', 'command') change
        if (selectionIsCollapsed(mathfield.model)) {
            // Nothing selected
            mathfield.switchMode(style.mode);
        } else {
            // Convert the selection from one mode to another
            const previousMode = mathfield.mode;
            const targetMode =
                (getAnchorMode(mathfield.model) ||
                    mathfield.config.defaultMode) === 'math'
                    ? 'text'
                    : 'math';
            let convertedSelection = mathfield.$selectedText('ASCIIMath');
            if (targetMode === 'math' && /^"[^"]+"$/.test(convertedSelection)) {
                convertedSelection = convertedSelection.slice(1, -1);
            }
            mathfield.$insert(convertedSelection, {
                mode: targetMode,
                selectionMode: 'item',
                format: targetMode === 'text' ? 'text' : 'ASCIIMath',
            });
            mathfield.mode = targetMode;
            if (mathfield.groupIsSelected()) {
                // The entire group was selected. Adjust parent mode if
                // appropriate
                const parent = mathfield.model.parent();
                if (
                    parent &&
                    (parent.type === 'group' || parent.type === 'root')
                ) {
                    parent.mode = targetMode;
                }
            }
            // Notify of mode change
            if (
                mathfield.mode !== previousMode &&
                typeof mathfield.config.onModeChange === 'function'
            ) {
                mathfield.config.onModeChange(mathfield, mathfield.mode);
            }
        }
        delete style.mode;
    }
    if (selectionIsCollapsed(mathfield.model)) {
        // No selection, let's update the 'current' style
        if (
            mathfield.style.fontSeries &&
            style.fontSeries === mathfield.style.fontSeries
        ) {
            style.fontSeries = 'auto';
        }
        if (style.fontShape && style.fontShape === mathfield.style.fontShape) {
            style.fontShape = 'auto';
        }
        if (style.color && style.color === mathfield.style.color) {
            style.color = 'none';
        }
        if (
            style.backgroundColor &&
            style.backgroundColor === mathfield.style.backgroundColor
        ) {
            style.backgroundColor = 'none';
        }
        if (style.fontSize && style.fontSize === mathfield.style.fontSize) {
            style.fontSize = 'auto';
        }
        mathfield.style = { ...mathfield.style, ...style };
        // This style will be used the next time an atom is inserted
    } else {
        // Change the style of the selection
        applyStyleToModel(mathfield.model, style);
        mathfield.undoManager.snapshot(mathfield.config);
    }
    return true;
}

/**
 * Validate a style specification object
 */
function validateStyle(style: { [key: string]: string }): Style {
    const result: Style = {};
    if (typeof style.mode === 'string') {
        result.mode = style.mode.toLowerCase() as ParseMode;
        console.assert(
            result.mode === 'math' ||
                result.mode === 'text' ||
                result.mode === 'command'
        );
    }

    if (typeof style.color === 'string') {
        result.color = style.color;
    }

    if (typeof style.backgroundColor === 'string') {
        result.backgroundColor = style.backgroundColor;
    }

    if (typeof style.fontFamily === 'string') {
        result.fontFamily = style.fontFamily;
    }

    if (typeof style.series === 'string') {
        result.fontSeries = style.series as FontSeries;
    }
    if (typeof style.fontSeries === 'string') {
        result.fontSeries = style.fontSeries.toLowerCase() as FontSeries;
    }
    if (result.fontSeries) {
        result.fontSeries =
            {
                bold: 'b',
                medium: 'm',
                normal: 'm',
            }[result.fontSeries] || result.fontSeries;
    }

    if (typeof style.shape === 'string') {
        result.fontShape = style.shape as FontShape;
    }
    if (typeof style.fontShape === 'string') {
        result.fontShape = style.fontShape.toLowerCase() as FontShape;
    }
    if (result.fontShape) {
        result.fontShape =
            {
                italic: 'it',
                up: 'n',
                upright: 'n',
                normal: 'n',
            }[result.fontShape] || result.fontShape;
    }

    if (typeof style.size === 'string') {
        result.fontSize = style.size;
    } else if (typeof style.size === 'number') {
        result.fontSize = 'size' + Math.min(0, Math.max(10, style.size));
    }
    if (typeof style.fontSize === 'string') {
        result.fontSize = style.fontSize.toLowerCase();
    }
    if (result.fontSize) {
        result.fontSize =
            {
                tiny: 'size1',
                scriptsize: 'size2',
                footnotesize: 'size3',
                small: 'size4',
                normal: 'size5',
                normalsize: 'size5',
                large: 'size6',
                Large: 'size7',
                LARGE: 'size8',
                huge: 'size9',
                Huge: 'size10',
            }[result.fontSize] || result.fontSize;
    }

    return result;
}
