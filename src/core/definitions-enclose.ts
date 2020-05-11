import { defineFunction, ParseFunctionResult } from './definitions-utils';
import { convertDimenToPx } from './font-metrics';
import type { Atom } from './atom';

// \enclose, a MathJax extension mapping to the MathML `menclose` tag.
// The first argument is a comma delimited list of notations, as defined
// here: https://developer.mozilla.org/en-US/docs/Web/MathML/Element/menclose
// The second, optional, specifies the style to use for the notations.
defineFunction(
    'enclose',
    '{notation:string}[style:string]{body:auto}',
    null,
    (_name: string, args: (string | Atom[])[]): ParseFunctionResult => {
        const result: ParseFunctionResult = {
            type: 'enclose',
            strokeColor: 'currentColor',
            strokeWidth: 1,
            strokeStyle: 'solid',
            backgroundcolor: 'transparent',
            padding: 'auto',
            shadow: 'auto',
            captureSelection: true, // Do not let children be selected
            body: args[2],
        };

        // Extract info from style string
        if (args[1]) {
            // Split the string by comma delimited sub-strings, ignoring commas
            // that may be inside (). For example"x, rgb(a, b, c)" would return
            // ['x', 'rgb(a, b, c)']
            const styles = (args[1] as string).split(
                /,(?![^(]*\)(?:(?:[^(]*\)){2})*[^"]*$)/
            );
            for (const s of styles) {
                const shorthand = s.match(/\s*(\S+)\s+(\S+)\s+(.*)/);
                if (shorthand) {
                    result.strokeWidth = convertDimenToPx(shorthand[1], 'px');
                    if (!isFinite(result.strokeWidth)) {
                        result.strokeWidth = 1;
                    }
                    result.strokeStyle = shorthand[2];
                    result.strokeColor = shorthand[3];
                } else {
                    const attribute = s.match(/\s*([a-z]*)\s*=\s*"(.*)"/);
                    if (attribute) {
                        if (attribute[1] === 'mathbackground') {
                            result.backgroundcolor = attribute[2];
                        } else if (attribute[1] === 'mathcolor') {
                            result.strokeColor = attribute[2];
                        } else if (attribute[1] === 'padding') {
                            result.padding = convertDimenToPx(
                                attribute[2],
                                'px'
                            );
                        } else if (attribute[1] === 'shadow') {
                            result.shadow = attribute[2];
                        }
                    }
                }
            }
            if (result.strokeStyle === 'dashed') {
                result.svgStrokeStyle = '5,5';
            } else if (result.strokeStyle === 'dotted') {
                result.svgStrokeStyle = '1,5';
            }
        }
        result.borderStyle =
            result.strokeWidth +
            'px ' +
            result.strokeStyle +
            ' ' +
            result.strokeColor;

        // Normalize the list of notations.
        result.notation = {};
        (args[0] as string)
            .split(/[, ]/)
            .filter((v) => v.length > 0)
            .forEach((x) => {
                result.notation[x.toLowerCase()] = true;
            });
        if (result.notation['updiagonalarrow']) {
            result.notation['updiagonalstrike'] = false;
        }
        if (result.notation['box']) {
            result.notation['left'] = false;
            result.notation['right'] = false;
            result.notation['bottom'] = false;
            result.notation['top'] = false;
        }
        return result;
    }
);

defineFunction('cancel', '{body:auto}', null, function (
    _name,
    args
): ParseFunctionResult {
    return {
        type: 'enclose',
        strokeColor: 'currentColor',
        strokeWidth: 1,
        strokeStyle: 'solid',
        borderStyle: '1px solid currentColor',
        backgroundcolor: 'transparent',
        padding: 'auto',
        shadow: 'auto',
        notation: { updiagonalstrike: true },
        body: args[0],
    };
});

defineFunction('bcancel', '{body:auto}', null, function (
    name,
    args
): ParseFunctionResult {
    return {
        type: 'enclose',
        strokeColor: 'currentColor',
        strokeWidth: 1,
        strokeStyle: 'solid',
        borderStyle: '1px solid currentColor',
        backgroundcolor: 'transparent',
        padding: 'auto',
        shadow: 'auto',
        notation: { downdiagonalstrike: true },
        body: args[0],
    };
});

defineFunction('xcancel', '{body:auto}', null, function (
    name,
    args
): ParseFunctionResult {
    return {
        type: 'enclose',
        strokeColor: 'currentColor',
        strokeWidth: 1,
        strokeStyle: 'solid',
        borderStyle: '1px solid currentColor',
        backgroundcolor: 'transparent',
        padding: 'auto',
        shadow: 'auto',
        notation: { updiagonalstrike: true, downdiagonalstrike: true },
        body: args[0],
    };
});
