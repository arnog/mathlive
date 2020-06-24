import { Expression } from '../public';

export function getApplyFunctionStyle(
    _expr: Expression,
    _level: number
): 'paren' | 'leftright' | 'big' | 'none' {
    return 'paren';
}

export function getGroupStyle(
    _expr: Expression,
    _level: number
): 'paren' | 'leftright' | 'big' | 'none' {
    return 'paren';
}

export function getRootStyle(
    _expr: Expression,
    level: number
): 'radical' | 'quotient' | 'solidus' {
    if (level > 1) return 'solidus';
    return 'radical';
}

export function getFractionStyle(
    _expr: Expression,
    level: number
): 'quotient' | 'inline-solidus' | 'nice-solidus' | 'reciprocal' | 'factor' {
    if (level > 3) return 'inline-solidus';
    return 'quotient';
}
export function getLogicStyle(
    _expr: Expression,
    _level: number
): 'word' | 'boolean' | 'uppercase-word' | 'punctuation' {
    return 'boolean';
}

export function getPowerStyle(
    _expr: Expression,
    _level: number
): 'root' | 'solidus' | 'quotient' {
    return 'solidus';
}
