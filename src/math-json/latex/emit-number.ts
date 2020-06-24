import { Expression } from '../public';
import { isNumberObject } from '../utils';
import { LatexNumberOptions } from './public';

/**
 * Return a formatted mantissa:
 * 1234567 -> 123 456 7...
 * 1233333 -> 12(3)
 */
function formatMantissa(
    m: string,
    config: Required<LatexNumberOptions>
): string {
    const originalLength = m.length;

    // The last digit may have been rounded, if it exceeds the precison,
    // which could throw off the repeating pattern detection. Ignore it.
    m = m.substr(0, config.precision - 2);

    for (let i = 0; i < m.length - 16; i++) {
        // Offset is the part of the mantissa that is not repeating
        const offset = m.substr(0, i);
        // Try to find a repeating pattern of length j
        for (let j = 0; j < 17; j++) {
            const cycle = m.substr(i, j + 1);
            const times = Math.floor((m.length - offset.length) / cycle.length);
            if (times > 1) {
                if ((offset + cycle.repeat(times + 1)).startsWith(m)) {
                    // We've found a repeating pattern!
                    if (cycle === '0') {
                        return offset.replace(
                            /(\d{3})/g,
                            '$1' + config.groupSeparator
                        );
                    }
                    return (
                        offset.replace(
                            /(\d{3})/g,
                            '$1' + config.groupSeparator
                        ) +
                        config.beginRepeatingDigits +
                        cycle.replace(
                            /(\d{3})/g,
                            '$1' + config.groupSeparator
                        ) +
                        config.endRepeatingDigits
                    );
                }
            }
        }
    }
    const hasDots = originalLength !== m.length;
    m = m.replace(/(\d{3})/g, '$1' + config.groupSeparator);
    if (m.endsWith(config.groupSeparator)) {
        m = m.slice(0, -1);
    }
    return m + (hasDots ? '\\ldots' : '');
}

function formatExponent(exp: string, options: LatexNumberOptions): string {
    if (!exp) return '';
    if (options.beginExponentMarker) {
        return (
            options.beginExponentMarker +
            exp +
            (options.endExponentMarker ?? '')
        );
    }
    return '10^{' + exp + '}';
}

function parseFloatToPrecision(num: number): number {
    return parseFloat(Number(num).toPrecision(15));
}

/*
 * @param expr - A number, can be represented as a string
 *  particularly useful for arbitrary precision numbers) or a number (-12.45)
 * @return A LaTeX representation of the expression
 */
export function emitNumber(
    options: Required<LatexNumberOptions>,
    expr: Expression
): string {
    let num: string | number;
    if (typeof expr === 'number') {
        num = expr;
    } else if (isNumberObject(expr)) {
        num = expr.num;
    } else {
        return '';
    }

    if (num === 'Infinity') {
        return '\\infty';
    } else if (num === '-Infinity') {
        return '-\\infty';
    } else if (num === 'NaN') {
        return '\\mathtt{NaN}';
    }

    let result = '';
    let value: number;
    const config = options;

    if (typeof num === 'number') {
        value = parseFloatToPrecision(num);
    } else {
        let sign = '';
        let exponent = '';
        if (num[0] === '-') {
            sign = '-';
            num = num.substr(1);
        } else if (num[0] === '+') {
            num = num.substr(1);
        }
        if (num.indexOf('.') >= 0) {
            const m = num.match(/(\d*)\.(\d*)([e|E]([-+]?[0-9]*))?/);
            if (!m) return '';
            const base = m[1];
            const mantissa = m[2].substring(
                0,
                Math.min(config.precision - base.length, m[2].length)
            );
            exponent = m[4] ?? '';

            if (base === '0') {
                let p = 0; // Index of the first non-zero digit after the decimal
                while (mantissa[p] === '0' && p < mantissa.length) {
                    p += 1;
                }
                let r = '';
                if (p <= 4) {
                    r = '0' + config.decimalMarker;
                    r += mantissa.substr(0, p);
                    r += formatMantissa(num.substr(r.length), config);
                } else if (p + 1 >= config.precision) {
                    r = '0';
                    sign = '';
                } else {
                    r = num[p];
                    const f = formatMantissa(num.substr(p + 1), config);
                    if (f) {
                        r += config.decimalMarker + f;
                    }
                }
                if (r !== '0') {
                    if (
                        num.length - 1 > config.precision &&
                        !r.endsWith('}') &&
                        !r.endsWith('\\ldots')
                    ) {
                        r += '\\ldots';
                    }
                    if (p > 4) {
                        r +=
                            config.exponentProduct +
                            formatExponent((1 - p).toString(), options);
                    }
                }
                num = r;
            } else {
                num = base.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    config.groupSeparator
                );
                const f = formatMantissa(mantissa, config);
                if (f) {
                    num += config.decimalMarker + f;
                    // if (num.length - 1 > config.precision && !num.endsWith('}') && !num.endsWith('\\ldots')) {
                    //     num += '\\ldots';
                    // }
                }
            }
        } else if (num.length > config.precision) {
            const len = num.length;
            let r = num[0];
            const f = formatMantissa(num.substr(1), config);
            if (f) {
                r += config.decimalMarker + f;
                if (r[r.length - 1] !== '}') {
                    r += '\\ldots';
                }
            }
            if (r !== '1') {
                r += config.exponentProduct;
            } else {
                r = '';
            }
            num = r + formatExponent((len - 2).toString(), options);
        } else {
            const m = num.match(/([0-9]*)\.?([0-9]*)([e|E]([-+]?[0-9]+))?/);
            if (m) {
                num = m[1];
                if (m[2]) num += options.decimalMarker + m[2];
                exponent = m[4] ?? '';
            }

            num = num.replace(/\B(?=(\d{3})+(?!\d))/g, config.groupSeparator);
        }
        const exponentString = formatExponent(exponent, options);

        return (
            sign +
            num +
            (exponentString ? options.exponentProduct + exponentString : '')
        );
    }
    if (config.notation === 'engineering') {
        // Ensure the exponent is a multiple of 3
        if (value === 0) {
            result = '0';
        } else {
            const y = Math.abs(value);
            let exponent: number = Math.round(Math.log10(y));
            exponent = exponent - (exponent % 3);
            if (y < 1000) exponent = 0;
            const mantissa = y / Math.pow(10, exponent);
            let mantissaString = '';
            const m = mantissa.toString().match(/^(.*)\.(.*)$/);
            if (m?.[1] && m[2]) {
                mantissaString = m[1] + config.decimalMarker + m[2];
            }
            if (config.groupSeparator) {
                mantissaString = formatMantissa(
                    mantissa.toExponential(),
                    config
                );
            }
            let exponentString = '';
            if (exponent !== 0) {
                exponentString = formatExponent(exponent.toString(), options);
            }
            result = (value < 0 ? '-' : '') + mantissaString + exponentString;
        }
    } else {
        const valString = typeof num === 'string' ? num : num.toString();
        let m = valString.match(/^(.*)[e|E]([-+]?[0-9]*)$/i);
        let base: string;
        let exponent: string;
        let mantissa: string;
        base = valString;
        mantissa = '';
        if (m?.[1] && m[2]) {
            // There is an exponent...
            base = m[1];
            exponent = formatExponent(m[2], options);
            if (exponent) {
                exponent = options.exponentProduct + exponent;
            }
        }
        m = base.match(/^(.*)\.(.*)$/);
        if (m?.[1] && m[2]) {
            base = m[1];
            mantissa = m[2];
        }
        if (config.groupSeparator) {
            base = base.replace(/\B(?=(\d{3})+(?!\d))/g, config.groupSeparator);
            mantissa = formatMantissa(mantissa, config);
        }
        if (mantissa) mantissa = config.decimalMarker + mantissa;
        result = base + mantissa + (exponent ?? '');
    }
    return result;
}
