import Lexer from '../core/lexer.js';
import MathAtom from '../core/mathAtom.js';
import ParserModule from '../core/parser.js';
import Definitions from '../core/definitions.js';

const CANONICAL_NAMES = {
    // CONSTANTS
    '\\imaginaryI':     '\u2148',
    '\\imaginaryJ':     '\u2149',
    '\\pi':             'π',
    '\\exponentialE':   '\u212f',

    // ARITHMETIC
    '﹢':               '+',        // SMALL PLUS SIGN
    '＋':               '+',        // FULL WIDTH PLUS SIGN
    '−':                '-',        // MINUS SIGN
    '-':                '-',        // HYPHEN-MINUS
    '﹣':               '-',        // SMALL HYPHEN-MINUS
    '－':               '-',        // FULLWIDTH HYPHEN-MINUS
    '\\times':          '*',
    '⨉':                '*',        // N-ARY TIMES OPERATOR U+
    '️✖':                '*',        // MULTIPLICATION SYMBOL
    '️×':                '*',        // MULTIPLICATION SIGN
    '.':                '*',
    '÷':                '/',        // DIVISION SIGN
    // '/':             '/',        // SOLIDUS
    '⁄':                 '/',        // FRACTION SLASH
    '／':                '/',        // FULLWIDTH SOLIDUS
    '!':                'factorial',
    '️\\pm':             'plusminus', // PLUS-MINUS SIGN
    '\\mp':             'minusplus', // MINUS-PLUS SIGN

    '\\land':           'and',
    '\\wedge':          'and',
    '\\lor':            'or',
    '\\vee':            'or',
    '\\oplus':          'xor',
    '\\veebar':         'xor',
    '\\lnot':           'not',
    '\\neg':            'not',

    '\\exists':         'exists',
    '\\nexists':        '!exists',
    '\\forall':         'forAll',
    '\\backepsilon':    'suchThat',
    '\\therefore':      'therefore',
    '\\because':        'because',

    '\\nabla':          'nabla',
    '\\circ':           'circle',
    // '\\oplus':       'oplus',
    '\\ominus':         'ominus',
    '\\odot':           'odot',
    '\\otimes':         'otimes',

    '\\zeta':           'Zeta',
    '\\Gamma':          'Gamma',
    '\\min':            'min',
    '\\max':            'max',
    '\\mod':            'mod',
    '\\lim':            'lim',  // BIG OP
    '\\sum':            'sum',
    '\\prod':           'prod',
    '\\int':            'integral',
    '\\iint':           'integral2',
    '\\iiint':          'integral3',

    '\\Re':             'Re',
    '\\gothicCapitalR': 'Re',
    '\\Im':             'Im',
    '\\gothicCapitalI': 'Im',

    '\\binom':          'nCr',

    '\\partial':        'partial',
    '\\differentialD':  'differentialD',
    '\\capitalDifferentialD': 'capitalDifferentialD',
    '\\Finv':           'Finv',
    '\\Game':           'Game',
    '\\wp':             'wp',
    '\\ast':            'ast',
    '\\star':           'star',
    '\\asymp':          'asymp',

    // Function domain, limits
    '\\to':             'to',       // Looks like \rightarrow
    '\\gets':           'gets',     // Looks like \leftarrow

    // Logic
    '\\rightarrow':     'shortLogicalImplies',
    '\\leftarrow':      'shortLogicalImpliedBy',
    '\\leftrightarrow': 'shortLogicalEquivalent',
    '\\longrightarrow': 'logicalImplies',
    '\\longleftarrow':  'logicalImpliedBy',
    '\\longleftrightarrow': 'logicalEquivalent',

    // Metalogic
    '\\Rightarrow':     'shortImplies',
    '\\Leftarrow':      'shortImpliedBy',
    '\\Leftrightarrow': 'shortEquivalent',

    '\\implies':        'implies',
    '\\Longrightarrow': 'implies',
    '\\impliedby':      'impliedBy',
    '\\Longleftarrow':  'impliedBy',
    '\\iff':            'equivalent',
    '\\Longleftrightarrow': 'equivalent',

}


const FUNCTION_TEMPLATE = {
    // TRIGONOMETRY
    'sin':      '\\sin%_%^ %',
    'cos':      '\\cos%_%^ %',
    'tan':      '\\tan%_%^ %',
    'cot':      '\\cot%_%^ %',
    'sec':      '\\sec%_%^ %',
    'csc':      '\\csc%_%^ %',

    'sinh':     '\\sinh %',
    'cosh':     '\\cosh %',
    'tanh':     '\\tanh %',
    'csch':     '\\csch %',
    'sech':     '\\sech %',
    'coth':     '\\coth %',

    'arcsin':      '\\arcsin %',
    'arccos':      '\\arccos %',
    'arctan':      '\\arctan %',
    'arccot':      '\\arcctg %',        // Check
    'arcsec':      '\\arcsec %',
    'arccsc':      '\\arccsc %',

    'arsinh':     '\\arsinh %',
    'arcosh':     '\\arcosh %',
    'artanh':     '\\artanh %',
    'arcsch':     '\\arcsch %',
    'arsech':     '\\arsech %',
    'arcoth':     '\\arcoth %',

    // LOGARITHMS
    'ln':       '\\ln%_%^ %',     // Natural logarithm
    'log':      '\\log%_%^ %',    // General logarithm, e.g. log_10
    'lg':       '\\lg %',     // Common, base-10, logarithm
    'lb':       '\\lb %',     // Binary, base-2, logarithm

    // Big operator
    'sum':      '\\sum%_%^ %',

    // OTHER
    'Zeta':     '\\zeta%_%^ %', // Riemann Zeta function
    'Gamma':    '\\Gamma %',    // Gamma function, such that Gamma(n) = (n - 1)!
    'min':      '\\min%_%^ %',
    'max':      '\\max%_%^ %',
    'mod':      '\\mod%_%^ %',
    'lim':      '\\lim%_%^ %',      // BIG OP
    'binom':    '\\binom %',
    'nabla':    '\\nabla %',
    'curl':     '\\nabla\\times %',
    'div':      '\\nabla\\cdot %',
    'floor':    '\\lfloor % \\rfloor%_%^',
    'ceil':     '\\lceil % \\rceil%_%^',
    'abs':      '\\vert % \\vert%_%^',
    'norm':     '\\lVert % \\rVert%_%^',
    'ucorner':  '\\ulcorner % \\urcorner%_%^',
    'lcorner':  '\\llcorner % \\lrcorner%_%^',
    'angle':    '\\langle % \\rangle%_%^',
    'group':    '\\lgroup % \\rgroup%_%^',
    'moustache':'\\lmoustache % \\rmoustache%_%^',
    'brace':    '\\lbrace % \\rbrace%_%^',
    'sqrt':     '\\sqrt[%^]{%}',
    'lcm':      '\\mathop{lcm}%',
    'gcd':      '\\mathop{gcd}%',
    'erf':      '\\mathop{erf}%',
    'erfc':     '\\mathop{erfc}%',
    'randomReal': '\\mathop{randomReal}%',
    'randomInteger': '\\mathop{randomInteger}%',


    // Arithmetic operators
    '*':        '%0 \\times %1',

    // Logic operators
    'and':      '%0 \\land %1',
    'or':       '%0 \\lor %1',
    'xor':      '%0 \\oplus %1',
    'not':      '%0 \\lnot %1',

    // Other operators
    'circle':   '%0 \\circ %1',
    'ast':      '%0 \\ast %1',
    'star':     '%0 \\star %1',
    'asymp':    '%0 \\asymp %1',
    '/':        '\\frac{%0}{%1}',
    'Re':       '\\Re{%}',
    'Im':       '\\Im{%}',
    'factorial': '%!',
    'factorial2': '%!!',
}





// From www.w3.org/TR/MathML3/appendixc.html

const OP_PRECEDENCE = {
    'degree':               880,
    'nabla':                740,
    'curl':                 740,    // not in MathML
    'partial':              740,
    'differentialD':        740,    // not in MathML
    'capitalDifferentialD': 740,    // not in MathML

    'odot':                 710,

    // Logical not
    'not':                  680,

    // Division
    'div':                  660,    // division sign
    'solidus':              660,
    '/':                    660,

    'setminus':             650,    // \setminus, \smallsetminus

    '%':                    640,

    'otimes':               410,

    // Set operators
    'union':                350,    // \cup
    'intersection':         350,    // \cap

    // Multiplication, division and modulo
    '*':                    390,
    'ast':                  390,
    '.':                    390,


    'oplus':                300,    // also logical XOR... @todo
    'ominus':               300,

    // Addition
    '+':                    275,
    '-':                    275,
    '+-':                   275,    // \pm
    '-+':                   275,    // \mp


    // Most circled-ops are 265
    'circle':               265,
    'circledast':           265,
    'circledcirc':          265,
    'star':                 265,    // Different from ast


    // Range
    '..':                   263,    // Not in MathML

    // Unit conversion
    'to':                   262,    // Not in MathLM
    'in':                   262,    // Not in MathML


    // Relational
    '=':                    260,
    '!=':                   255,

    'approx':               247,
    '<':                    245,
    '>':                    243,
    '≥':                    242,
    '≤':                    241,

    // Set operator
    'complement':           240,
    'subset':               240,    // \subset
    'superset':             240,    // \supset
    // @todo and equality and neg operators
    'elementof':            240,    // \in
    '!elementof':           240,    // \notin
    //
    'exists':                230,
    '!exists':               230,
    'forall':                230,

    // Logical operators
    'and':              200,
    'xor':              195,            // MathML had 190
    'or':               190,
    // Note: 'not' is 680

    // center, low, diag, vert ellipsis         150

    // Composition/sequence
    'suchThat':              110,   // \backepsilon
    ':':                     100,
    // '..':               100,
    // '...':               100,

    // Conditional (?:)


    // Assignement
    ':=':                80,       // MathML had 260 (same with U+2254 COLON EQUALS)

    'therefore':                70,
    'because':                70,

    // Arrows
    // Note: MathML had 270 for the arrows, but this
    // would not work for (a = b => b = a)
    // See also https://en.wikipedia.org/wiki/Logical_connective#Order_of_precedence
    // for a suggested precedence (note that in this page lower precedence
    // has the opposite meaning as what we use)
    'shortLogicalImplies': 52,  // ->
    'shortImplies':     51,     // =>
    'logicalImplies':   50,     // -->
    'implies':          49,     // ==>

    'shortLogicalImpliedBy': 48,// <-
    'shortImpliedBy':   47,     // <=
    'logicalImpliedBy': 46,     // <--
    'impliedBy':        45,     // <==

    'shortLogicalEquivalent':44,// <->
    'shortEquivalent':  43,     // <=>
    'logicalEquivalent':42,     // <-->
    'equivalent':       41,     // <==>


    ',':                40,
    ';':                30
}

/**
 * Given a canonical name, return its precedence
 * @param {string} canonicalName, for example "and"
 * @return {number}
 */
function getPrecedence(canonicalName) {
    return canonicalName ? (OP_PRECEDENCE[canonicalName] || -1) : -1;
}

function getAssociativity(canonicalName) {
    if (/=|=>/.test(canonicalName)) {
        return 'right';
    }
    return 'left';
}



/**
 *
 * @param {string} name function canonical name
 * @return {string}
 */
function getLatexTemplateForFunction(name) {
    let result = FUNCTION_TEMPLATE[name];
    if (!result) {
        result = name.length > 1 ? '\\mathop{' + name + '} %' : (name + ' %');
    }

    return result;
}

/**
 *
 * @param {string} name symbol name
 * @return {string}
 */
function getLatexForSymbol(name) {
    let result = FUNCTION_TEMPLATE[name];
    if (result) {
        return result.replace('%1', '').replace('%0', '').replace('%', '');
    }
    const info = Definitions.getInfo('\\' + name, 'math');
    if (info && info.type !== 'error' &&
        (!info.fontFamily || info.fontFamily === 'main' || info.fontFamily === 'ams')) {
        result = '\\' + name;
    }

    return result;
}

/**
 *
 * @param {string} name function or operator canonical name
 * @return {string}
 */
function getLatexTemplateForOperator(name) {
    let result = FUNCTION_TEMPLATE[name];
    if (!result) {
        result = '%0 \\mathbin{' + name + '} %1';
    }

    return result;
}

function isFunction(canonicalName) {
    if (canonicalName === 'f' || canonicalName === 'g') return true;
    let t = FUNCTION_TEMPLATE[canonicalName];
    if (!t) return false;
    // %0 and %1 are the lhs and rhs arguments. Remove those from the template
    t = t.replace('%0', '').replace('%1', '');
    // If we're left with a plain %, it's the argument list, and therefore
    // this is a function.
    if (/%/.test(t)) return true;
    return false;
}


/**
 *
 * @param {string} latex, for example '\\times'
 * @return {string} the canonical name for the input, for example '*'
 */
function getCanonicalName(latex) {
    latex = (latex || '').trim();
    let result = CANONICAL_NAMES[latex];
    if (!result) {
        if (latex.charAt(0) === '\\') {
            const info = Definitions.getInfo(latex, 'math', {});
            if (info && info.type !== 'error') {
                result = info.value || latex.slice(1);
            } else {
                result = latex.slice(1);
            }
        } else {
            result = latex;
        }
    }
    return result;
}


/**
 * Return the operator precedence of the atom
 * or -1 if not an operator
 * @param {*} atom
 * @return {number}
 */
function opPrec(atom) {
    if (!atom) return null;
    const name = getCanonicalName(getString(atom));
    const result = {
        prec: getPrecedence(name),
        assoc: getAssociativity(name)
    }
    if (result.prec <= 0) return null
    return result;
}

function isOperator(atom) {
    return opPrec(atom) !== null;
}


const DELIM_FUNCTION = {
    '\\lfloor\\rfloor': 'floor',
    '\\lceil\\rceil': 'ceil',
    '\\vert\\vert': 'abs',
    '\\lvert\\rvert': 'abs',
    '||': 'abs',
    '\\Vert\\Vert': 'norm',
    '\\lVert\\rVert': 'norm',
    '\\ulcorner\\urcorner': 'ucorner',
    '\\llcorner\\lrcorner': 'lcorner',
    '\\langle\\rangle': 'angle',
    '\\lgroup\\rgroup': 'group',
    '\\lmoustache\\rmoustache': 'moustache',
    '\\lbrace\\rbrace': 'brace'
}

const POSTFIX_FUNCTION = {
    '!':                    'factorial',
    '\\dag':                'dagger',
    '\\dagger':             'dagger',
    '\\ddager':             'dagger2',
    '\\maltese':            'maltese',
    '\\backprime':          'backprime',
    '\\backdoubleprime':    'backprime2',
    '\\prime':              'prime',
    '\\doubleprime':        'prime2',
    '\\$':                  '$',
    '\\%':                  '%',
    '\\_':                  '_',
    '\\degree':             'degree'
}

const ASSOCIATIVE_FUNCTION = {
    '+':                    '+',
    '-':                    '+',      // Substraction is add(), but it's
                                        // handled specifically so that the
                                        // argument is negated
    '*':                    '*',

    ',':                    'list',
    ';':                    'list2',

    'and':                  'and',
    'or':                   'or',
    'xor':                  'xor',
    'union':                'union',
    // shortLogicalEquivalent and logicalEquivalent map to the same function
    // they mean the same thing, but have a difference precedence.
    'shortLogicalEquivalent': 'logicalEquivalent',   // logical equivalent, iff, biconditional logical connective
    'logicalEquivalent':    'logicalEquivalent',     // same
    // shortEquivalent and equivalent map to the same function
    // they mean the same thing, but have a difference precedence.
    'shortEquivalent':      'equivalent',      // metalogic equivalent
    'equivalent':           'equivalent',      // same
}

const SUPER_ASSOCIATIVE_FUNCTION = {
    ',':                    'list',
    ';':                    'list2'
}

function getString(atom) {
    if (atom.latex && atom.latex !== '\\mathop ' && atom.latex !== '\\mathbin ' &&
        atom.latex !== '\\mathrel ' && atom.latex !== '\\mathopen ' &&
        atom.latex !== '\\mathpunct ' && atom.latex !== '\\mathord ' &&
        atom.latex !== '\\mathinner ' && atom.type !== 'font') {
        return atom.latex.trim();
    }
    if (atom.type === 'leftright') {
        return '';
    }
    if (typeof atom.body === 'string') {
        return atom.body;
    }
    if (Array.isArray(atom.body)) {
        let result = '';
        for (const subAtom of atom.body) {
            result += getString(subAtom);
        }
        return result;
    }
    return '';
}

/**
 *
 * @param {Object} expr -- Abstract Syntax Tree object
 * @return {string} -- A string, the symbol, or undefined
 */
function asSymbol(expr) {
    let result = expr;
    if (typeof result !== 'string') {
        result = expr !== undefined ? expr.sym : undefined;
    }
    if (result) {
        const latex = getLatexForSymbol(result);
        result = latex || result;
    }
    return result;
}



/**
 *
 * @param {Object} num -- Abstract Syntax Tree object
 * @return {number} -- A JavaScript number, the value of the AST or NaN
 */
function asMachineNumber(num) {
    let result = undefined;
    if (num !== undefined) {
        if (num.num !== undefined) {
            if (num.num.toString().match(/^[+-]?[0-9]*[.]?[0-9]*[eE]?[+-]?[0-9]?$/)) {
                result = parseFloat(num.num);
            }
        } else if (typeof num === 'number') {
            result = parseFloat(num);
        }
    }
    return result;
}

function isNumber(expr) {
    return typeof expr === 'number' ||
        (expr !== undefined && expr.num !== undefined);
}

/**
 * Return true if the current atom is of the specified type and value.
 * @param {Object} expr
 * @param {string} type
 * @param {string} value
 */
function isAtom(expr, type, value) {
    let result = false;
    const atom = expr.atoms[expr.index];
    if (atom && atom.type === type) {
        if (value === undefined) {
            result = true;
        } else {
            result = getString(atom) === value;
        }
    }
    return result;
}


/**
 * Return the negative of the expression. Usually {op:'-', lhs:expr}
 * but for numbers, the negated number
 * @param {*} expr
 */
function negate(expr) {
    if (typeof expr === 'number') {
        return -expr;
    } else if (expr && typeof expr.num === 'number') {
        expr.num = -expr.num;
        return expr;
    }
    return {op:'-', lhs:expr};
}


/**
 * Parse for a possible sup/sub at the current token location.
 * Handles both sup/sub attached directly to the current atom
 * as well as "empty" atoms with a sup/sub following the current
 * atom.
 * @param {Object} expr
 */
function parseSupsub(expr, options) {
    let atom = expr.atoms[expr.index - 1];

    // Is there a supsub directly on this atom?
    if (!atom || !(atom.superscript || atom.subscript)) {
        atom = null;
    }

    // Is the following atom a subsup atom?
    if (!atom) {
        atom = expr.atoms[expr.index];
        if (isAtom(expr, 'msubsup') && (atom.superscript || atom.subscript)) {
            expr.index += 1;
        } else {
            atom = null;
        }
    }

    if (atom) {
        if (typeof expr.ast === 'string') {
            expr.ast = {sym: expr.ast};
        } else if (typeof expr.ast === 'number') {
            expr.ast = {num: expr.ast};
        } else if (!expr.ast.group && !expr.ast.fn && !expr.ast.sym) {
            expr.ast = {group: expr.ast};
        }
        if (atom.subscript) expr.ast.sub = parse(atom.subscript, options);
        if (atom.superscript) expr.ast.sup = parse(atom.superscript, options);
    }

    return expr;
}


/**
 * Parse postfix operators, such as "!" (factorial)
 */
function parsePostfix(expr, options) {
    const atom = expr.atoms[expr.index];
    const lhs = expr.ast;
    const digraph = parseDigraph(expr);
    if (digraph) {
        expr.ast = {op: digraph.ast, lhs: lhs};
        expr = parseSupsub(expr, options);
        expr = parsePostfix(expr, options);
    } else if (atom && atom.latex && atom.latex.match(/\^{.*}/)) {
        expr.index += 1;
        // It's a superscript Unicode char (e.g. ⁰¹²³⁴⁵⁶⁷⁸⁹ⁱ⁺⁻⁼...)
        if (typeof expr.ast === 'string') {
            expr.ast = {sym: expr.ast};
        } else if (typeof expr.ast === 'number') {
            expr.ast = {num: expr.ast};
        } else if (!expr.ast.group && !expr.ast.fn && !expr.ast.sym) {
            expr.ast = {group: expr.ast};
        }
        const sup = atom.latex.match(/\^{(.*)}/)[1];
        const n = parseInt(sup);
        if (!isNaN(n)) {
            expr.ast.sup = n;
        } else {
            expr.ast.sup = sup;
        }

    } else if (atom && atom.type === 'textord' && POSTFIX_FUNCTION[atom.latex.trim()]) {
        expr.index += 1;
        expr.ast = {fn: POSTFIX_FUNCTION[atom.latex.trim()], arg: lhs};
        expr = parseSupsub(expr, options);
        expr = parsePostfix(expr, options);
    }
    return expr;
}



/**
 * Delimiters can be expressed:
 * - as a matching pair of regular characters: '(a)'
 * - a as 'leftright' expression: '\left(a\right)'
 * - as a matching pair of 'sizeddelim': '\Bigl(a\Bigr)
 *
 * Note that the '\delim' command is only used for delimiters in the middle
 * of a \left\right pair and not to represent pair-matched delimiters.
 *
 * This function handles all three cases
 *
 */
 function parseDelim(expr, ldelim, rdelim, options) {
    expr.index = expr.index || 0;

    if (expr.atoms.length === 0 || expr.index >= expr.atoms.length) {
        expr.ast = undefined;
        return expr;
    }

    const savedPrec = expr.minPrec;
    expr.minPrec = 0;
    let atom = expr.atoms[expr.index];

    if (!ldelim) {
        // If we didn't expect a specific delimiter, parse any delimiter
        // and return it as a function application
        let pairedDelim = true;
        if (atom.type === 'mopen') {
            ldelim = atom.latex.trim();
            rdelim = Definitions.RIGHT_DELIM[ldelim];
        } else if (atom.type === 'sizeddelim') {
            ldelim = atom.delim;
            rdelim = Definitions.RIGHT_DELIM[ldelim];
        } else if (atom.type === 'leftright') {
            pairedDelim = false;
            ldelim = atom.leftDelim;
            rdelim = atom.rightDelim;
        } else if (atom.type === 'textord') {
            ldelim = atom.latex.trim();
            rdelim = Definitions.RIGHT_DELIM[ldelim];
        }
        if (ldelim && rdelim) {
            expr = parseDelim(expr, ldelim, rdelim);
            if (expr) {
                if (pairedDelim) expr.index += 1;
                expr.ast = {
                    fn: DELIM_FUNCTION[ldelim + rdelim] || (ldelim + rdelim),
                    arg: expr.ast};
                expr.minPrec = savedPrec;
                return expr;
            }
        }
        return undefined;
    }

    if (atom.type === 'mopen' && getString(atom) === ldelim) {
        expr.index += 1;    // Skip the open delim
        expr = parseExpression(expr, options);
        atom = expr.atoms[expr.index];
        if (atom && atom.type === 'mclose' && getString(atom) === rdelim) {
            expr.index += 1;
            expr = parseSupsub(expr, options);
            expr = parsePostfix(expr, options);
        } // TODO: else, syntax error?

    } else if (atom.type === 'textord' && getString(atom) === ldelim) {
            expr.index += 1;    // Skip the open delim
            expr = parseExpression(expr, options);
            atom = expr.atoms[expr.index];
            if (atom && atom.type === 'textord' && getString(atom) === rdelim) {
                expr.index += 1;
                expr = parseSupsub(expr, options);
                expr = parsePostfix(expr, options);
            } // TODO: else, syntax error?

    } else if (atom.type === 'sizeddelim' && atom.delim === ldelim) {
        expr.index += 1;    // Skip the open delim
        expr = parseExpression(expr, options);
        atom = expr.atoms[expr.index];
        if (atom && atom.type === 'sizeddelim' && atom.delim === rdelim) {
            expr.index += 1;
            expr = parseSupsub(expr, options);
            expr = parsePostfix(expr, options);
        } // TODO: else, syntax error?

    } else if (atom.type === 'leftright' &&
        atom.leftDelim === ldelim &&
        (atom.rightDelim === '?' || atom.rightDelim === rdelim)) {
        // This atom type includes the content of the parenthetical expression
        // in its body
        expr.ast = parse(atom.body, options);
        expr.index += 1;
        expr = parseSupsub(expr, options);
        expr = parsePostfix(expr, options);

    } else {
        return undefined;
    }

    expr.minPrec = savedPrec;
    return expr;
}


/**
 * Some symbols are made up of two consecutive characters.
 * Handle them here. Return undefined if not a digraph.
 * TODO: other digraphs:
 * :=
 * ++
 * **
 * =:
 * °C U+2103
 * °F U+2109
 *
*/
function parseDigraph(expr) {
    expr.index = expr.index || 0;

    if (expr.atoms.length === 0 || expr.index >= expr.atoms.length) {
        return undefined;
    }

    if (isAtom(expr, 'textord', '\\nabla')) {
        expr.index += 1;
        if (isAtom(expr, 'mbin', '\\times')) {
            expr.index += 1;
            expr.ast = 'curl';   // divergence
            return expr;
        } else if (isAtom(expr, 'mbin', '\\cdot')) {
            expr.index += 1;
            expr.ast = 'div';
            return expr;
        }
        expr.index -= 1;
    } else if (isAtom(expr, 'textord', '!')) {
        expr.index += 1;
        if (isAtom(expr, 'textord', '!')) {
            expr.index += 1;
            expr.ast = 'factorial2';
            return expr;
        }
        expr.index -= 1;
    }

    return undefined;
}


function parsePrimary(expr, options) {

    // <primary> := ('-'|'+) <primary> | <number> | '(' <expression> ')' | <symbol>

     expr.index = expr.index || 0;
     expr.ast = undefined;

    if (expr.atoms.length === 0 || expr.index >= expr.atoms.length) {
        return expr;
    }

    let atom = expr.atoms[expr.index];
    const val = getCanonicalName(getString(atom));

    const digraph = parseDigraph(expr);
    if (digraph) {
        // expr = parseSupsub(expr, options);
        const fn = {op: expr.ast};
        fn.lhs = parsePrimary(expr, options).ast;
        expr.ast = fn;

    } else if (atom.type === 'mbin' && (val === '-' || val === '+')) {
        // Prefix + or - sign
        expr.index += 1;  // Skip the '+' or '-' symbol
        atom = expr.atoms[expr.index];
        expr = parsePrimary(expr, options);
        if (atom && '0123456789.'.indexOf(atom.latex) >= 0) {
            if (expr.ast.num && typeof expr.ast.num === 'number') {
                expr.ast.num = val === '-' ? -expr.ast.num : expr.ast.num;
            } else if (typeof expr.ast === 'number') {
                expr.ast = val === '-' ? -expr.ast : expr.ast;
            } else {
                expr.ast = {op: val, rhs: expr.ast};
            }
        } else {
            expr.ast = {op: val, rhs: expr.ast};
        }

    } else if ((atom.type === 'mord' && '0123456789.'.indexOf(atom.latex) >= 0)
         || isAtom(expr, 'mpunct', ',')) {
        // Looks like a number
        let num = '';
        let done = false;
        let pat = '0123456789.eEdD';
        while (expr.index < expr.atoms.length && !done && (isAtom(expr, 'spacing') ||
                (
                    (
                        isAtom(expr, 'mord') ||
                        isAtom(expr, 'mpunct', ',') ||
                        isAtom(expr, 'mbin')
                    ) &&
                        pat.indexOf(expr.atoms[expr.index].latex) >= 0
                    )
                )
            ) {
            if (expr.atoms[expr.index].type === 'spacing') {
                expr.index += 1;
            } else {
                let digit = expr.atoms[expr.index].latex;
                if (digit === 'd' || digit === 'D') {
                    digit = 'e';
                    pat = '0123456789.+-'
                } else if (digit === 'e' || digit === 'E') {
                    pat = '0123456789.+-'
                } else if (pat === '0123456789.+-') {
                    pat = '0123456789';
                }
                num += digit === ',' ? '' : digit;
                if (atom.superscript !== undefined || atom.underscript !== undefined) {
                    done = true;
                } else {
                    expr.index += 1;
                }
            }
        }
        expr.ast = parseFloat(num);

        // This was a number. Is it followed by a fraction, e.g. 2 1/2
        atom = expr.atoms[expr.index];
        if (atom && atom.type === 'genfrac' &&
            (expr.ast.num !== undefined || !isNaN(expr.ast))) {
            // Add an invisible plus, i.e. 2 1/2 = 2 + 1/2
            const lhs = expr.ast;
            expr = parsePrimary(expr, options);
            expr.ast = {lhs: lhs, op:'+', rhs: expr.ast};
        }
        if (atom && atom.type === 'group' && atom.latex && atom.latex.startsWith('\\nicefrac')) {
            // \nicefrac macro, add an invisible plus
            const lhs = expr.ast;
            expr = parsePrimary(expr, options);
            expr.ast = {lhs: lhs, op:'+', rhs: expr.ast};
        }
        expr = parseSupsub(expr, options);
        expr = parsePostfix(expr, options);

    } else if (atom.type === 'genfrac' || atom.type === 'surd') {
        expr.index += 1;
        expr.ast = atom.toAST(options);
        expr = parseSupsub(expr, options);
        expr = parsePostfix(expr, options);

    } else if (atom.type === 'font') {
        expr.ast = atom.toAST(options);
        if (expr.ast.sym && expr.ast.variant === 'normal' &&
            isFunction(expr.ast.sym)) {
            // This is a function (for example used with \\mathrm{foo}
            expr.ast = {fn: expr.ast.sym};
            expr = parseSupsub(expr, options);

            const fn = expr.ast;
            expr.index += 1;  // Skip the function name
            fn.arg = parsePrimary(expr, options).ast;
            expr.ast = fn;

        } else {
            // It's an identifier of some kind...
            if (atom.superscript === undefined) {
                expr.index += 1;
            }
            expr = parseSupsub(expr, options);
        }
        expr = parsePostfix(expr, options);

    } else if (atom.type === 'mord') {
        // A 'mord' but not a number, either an identifier ('x') or a function
        // ('\\Zeta')
        const name = getCanonicalName(getString(atom));
        if (isFunction(name) && !isOperator(atom)) {
            // A function
            expr.ast = {fn: name};
            expr = parseSupsub(expr, options);

            const fn = expr.ast;
            expr.index += 1;  // Skip the function name
            fn.arg = parsePrimary(expr, options).ast;
            if (fn.arg && (fn.arg.fn === 'list2' || fn.arg.fn === 'list')) {
                fn.arg = fn.arg.arg;
            }
            expr.ast = fn;
        } else {
            // An identifier
            expr.ast = atom.toAST(options);
            if (atom.superscript === undefined) {
                expr.index += 1;
            }
            expr = parseSupsub(expr);
        }
        expr = parsePostfix(expr, options);

    } else if (atom.type === 'textord') {
        // Note that 'textord' can also be operators, and are handled as such
        // in parseExpression()
        if (!isOperator(atom)) {
            // This doesn't look like a textord operator
            if (!Definitions.RIGHT_DELIM[atom.latex.trim()]) {
                // Not an operator, not a fence, it's a symbol or a function
                const name = getCanonicalName(getString(atom));
                if (isFunction(name)) {
                    // It's a function
                    expr.ast = {fn: name};
                    expr = parseSupsub(expr, options);

                    const fn = expr.ast;
                    expr.index += 1;  // Skip the function name
                    fn.arg = parsePrimary(expr, options).ast;
                    expr.ast = fn;

                    expr = parsePostfix(expr, options);

                } else {
                    // It was a symbol...
                    expr.ast = atom.toAST(options);
                    if (atom.superscript === undefined) {
                        expr.index += 1;
                    }
                    expr = parseSupsub(expr, options);
                    expr = parsePostfix(expr, options);
                }
            }
        }

    } else if (atom.type === 'mop') {
        // Could be a function or an operator.
        const name = getCanonicalName(getString(atom));
        if (isFunction(name) && !isOperator(atom)) {
            expr.index += 1;
            expr.ast = {fn: name};
            expr = parseSupsub(expr, options);

            if (expr.ast.sup) {
                // There was an exponent with the function.
                if (expr.ast.sup === -1 || (expr.ast.sup.op === '-' && expr.ast.sup.rhs === 1)) {
                    // This is the inverse function
                    const INVERSE_FUNCTION = {
                        'sin' : 'arcsin',
                        'cos':  'arccos',
                        'tan':  'arctan',
                        'cot':  'arccot',
                        'sec':  'arcsec',
                        'csc':  'arccsc',
                        'sinh': 'arsinh',
                        'cosh': 'arcosh',
                        'tanh': 'artanh',
                        'csch': 'arcsch',
                        'sech': 'arsech',
                        'coth': 'arcoth'
                    };
                    if (INVERSE_FUNCTION[expr.ast.fn]) {
                        const fn = {fn: INVERSE_FUNCTION[expr.ast.fn]};
                        fn.arg = parsePrimary(expr, options).ast;
                        expr.ast = fn;
                    } else {
                        const fn = expr.ast;
                        fn.arg = parsePrimary(expr, options).ast;
                        expr.ast = fn;
                    }
                } else {
                    // Keep the exponent, add the argument
                    const fn = expr.ast;
                    fn.arg = parsePrimary(expr, options).ast;
                    expr.ast = fn;
                }

            } else {
                const fn = expr.ast;
                fn.arg = parsePrimary(expr, options).ast;
                expr.ast = fn;
            }
        }
    } else if (atom.type === 'array') {
       expr.index += 1;
       expr.ast = atom.toAST(options);
    } else if (atom.type === 'sizing') {
       expr.index += 1;
       return parsePrimary(expr, options);
    } else if (atom.type === 'group') {
        expr.index += 1;
        expr.ast = atom.toAST(options);
    }


    if (expr.ast === undefined) {
        // Parse either a group of paren, and return their content as the result
        // or a pair of delimiters, and return them as a function applied
        // to their content, i.e. "|x|" -> {fn: "||", arg: "x"}
        const delim = parseDelim(expr, '(', ')', options) || parseDelim(expr, null, null, options);
        if (delim) {
            expr = delim;
        } else {
            if (!isOperator(atom)) {
                // This is not an operator (if it is, it may be an operator
                // dealing with an empty lhs. It's possible.
                // Couldn't interpret the expression. Output an error.
                expr.ast = {text: '?'};
                expr.ast.error = 'Unexpected token ' +
                    "'" + atom.type + "' = " + atom.body + ' = ' + atom.latex;
                expr.index += 1;    // Skip the unexpected token, and attempt to continue
            }
        }
    }

    atom = expr.atoms[expr.index];
    if (atom && (atom.type === 'mord' ||
            atom.type === 'surd' ||
            atom.type === 'mop' ||
            atom.type === 'mopen' ||
            atom.type === 'sizeddelim' ||
            atom.type === 'leftright')) {
        if (atom.type === 'sizeddelim') {
            for (const d in Definitions.RIGHT_DELIM) {
                if (atom.delim === Definitions.RIGHT_DELIM[d]) {
                    // This is (most likely) a closing delim, exit.
                    // There are ambiguous cases, for example |x|y|z|.
                    expr.index += 1;
                    return expr;
                }
            }
        }
        if ((atom.type === 'mord' || atom.type === 'textord' || atom.type === 'mop') &&
             isOperator(atom)) {
            // It's actually an operator
            return expr;
        }
        const lhs = expr.ast;
        expr = parsePrimary(expr, options);
       if (expr && expr.ast) {
            if (isFunction(lhs)) {
                // A function followed by a list -> the list becomes the
                // argument to the function
                if (expr.ast.fn === 'list2' || expr.ast.fn === 'list') {
                    expr.ast = {fn: lhs, arg: expr.ast.arg};
                } else {
                    expr.ast = {fn: lhs, arg: expr.ast};
                }
            } else {
                // Invisible times, e.g. '2x'
                if (expr.ast.fn === '*') {
                    expr.ast.arg.unshift(lhs);
                } else if (expr.ast.op === '*') {
                    expr.ast = {fn:'*', arg:[lhs, expr.ast.lhs, expr.ast.rhs]};
                } else {
                    expr.ast = {lhs: lhs, op:'*', rhs: expr.ast};
                }
            }
        } else {
            expr.ast = lhs;
        }
    }

    return expr;
}

/**
 * Given an atom or an array of atoms, return their AST representation as
 * an object.
 * @param {Object} expr An expressions, including expr.atoms, expr.index,
 * expr.minPrec the minimum precedence that this parser should parse
 * before returning; expr.lhs (optional); expr.ast, the resulting AST.
 * @return {Object} the expr object, updated
 * @private
 */
function parseExpression(expr, options) {
    expr.index = expr.index || 0;
    expr.ast = undefined;
    if (expr.atoms.length === 0 || expr.index >= expr.atoms.length) return expr;
    expr.minPrec = expr.minPrec || 0;

    let lhs = parsePrimary(expr, options).ast;

    let done = false;
    const minPrec = expr.minPrec;
    while (!done) {
        const atom = expr.atoms[expr.index];
        done = !atom || !isOperator(atom) || opPrec(atom).prec < minPrec;
        if (!done) {
            const opName = getCanonicalName(getString(atom));
            const {prec, assoc} = opPrec(atom);
            if (assoc === 'left') {
                expr.minPrec = prec + 1;
            } else {
                expr.minPrec = prec;
            }
            expr.index += 1;
            const rhs = parseExpression(expr, options).ast;

            // Some operators (',' and ';' for example) convert into a function
            // even if there's only two arguments. They're super associative...
            let fn = SUPER_ASSOCIATIVE_FUNCTION[opName];
            if (fn && lhs && lhs.fn !== fn) {
                // Only promote them if the lhs is not already the same function.
                // If it is, we'll combine it below.
                const arg = [];
                if (lhs !== undefined) arg.push(lhs);
                lhs = {fn: fn, arg:arg};
            }

            // Promote substraction to an addition
            if (opName === '-') {
                if (lhs && lhs.op === '+') {
                    // x+y - z      -> add(x, y, -z)
                    const arg = [];
                    if (lhs.lhs !== undefined) arg.push(lhs.lhs);
                    if (lhs.rhs !== undefined) arg.push(lhs.rhs);
                    if (rhs !== undefined) arg.push(negate(rhs));
                    lhs = {fn:'+', arg:arg}
                } else if (lhs && lhs.op === '-') {
                    // x-y - z      -> add(x, -y, -z)
                    const arg = [];
                    if (lhs.lhs !== undefined) arg.push(lhs.lhs);
                    if (lhs.rhs !== undefined) arg.push(negate(lhs.rhs));
                    if (rhs !== undefined) arg.push(negate(rhs));
                    lhs = {fn:'+', arg:arg}
                } else if (lhs && lhs.fn === '+') {
                    // add(x,y) - z -> add(x, y, -z)
                    if (rhs !== undefined) lhs.arg.push(negate(rhs));
                } else {
                    lhs = {lhs: lhs, op: opName, rhs: rhs};
                }
            } else {
                // Is there a function (e.g. '+') implementing the
                // associative version of this operator (e.g. '+')?
                fn = ASSOCIATIVE_FUNCTION[opName];
                if (fn === '+' && lhs && lhs.op === '-') {
                    const arg = [];
                    if (lhs.lhs !== undefined) arg.push(lhs.lhs);
                    if (lhs.rhs !== undefined) arg.push(negate(lhs.rhs));
                    if (rhs !== undefined) arg.push(rhs);
                    lhs = {fn: fn, arg:arg};
                } else if (fn && lhs && lhs.op === opName) {
                    // x+y + z -> add(x, y, z)
                    const arg = [];
                    if (lhs.lhs !== undefined) arg.push(lhs.lhs);
                    if (lhs.rhs !== undefined) arg.push(lhs.rhs);
                    if (rhs !== undefined) arg.push(rhs);
                    lhs = {fn: fn, arg:arg};
                } else if (fn && lhs && lhs.fn === fn) {
                    // add(x,y) + z -> add(x, y, z)
                    if (rhs !== undefined) lhs.arg.push(rhs);
                } else {
                    lhs = {lhs: lhs, op: opName, rhs: rhs};
                }
            }
        }
    }

    expr.ast = lhs;
    return expr;
}



function toString(atoms) {
    let result = '';
    for (const atom of atoms) {
        if (atom.type === 'textord' || atom.type === 'mord') {
            result += atom.body;
        }
    }
    return escapeText(result);
}


/**
 * Return a string escaped as necessary to comply with the JSON format
 * @param {string} s
 * @return {string}
 */
function escapeText(s) {
    return s
    .replace(/[\\]/g, '\\\\')
    .replace(/["]/g, '\\"')
    .replace(/[\b]/g, "\\b")
    .replace(/[\f]/g, "\\f")
    .replace(/[\n]/g, "\\n")
    .replace(/[\r]/g, "\\r")
    .replace(/[\t]/g, "\\t");
}

/**
 * Return an AST representation of a single atom
 *
 * @return {Object}
 */
MathAtom.MathAtom.prototype.toAST = function(options) {
    const MATH_VARIANTS = {
        'mathrm':   'normal',
        'mathbb':   'double-struck',
        'mathbf':   'bold',
        'mathcal':  'script',
        'mathfrak': 'fraktur',
        'mathscr':  'script',
        'mathsf':   'sans-serif',
        'mathtt':   'monospace'
    };
    // TODO: See https://www.w3.org/TR/MathML2/chapter6.html#chars.letter-like-tables

    let result = {};
    let sym = '';
    let m;
    let lhs, rhs;
    const variant = MATH_VARIANTS[this.fontFamily || this.font];

    const command = this.latex ? this.latex.trim() : null;
    switch(this.type) {
        case 'root':
        case 'group':
            // Macros appear as group as well. Handle some of them.
            if (this.latex && this.latex.startsWith('\\nicefrac')) {
                m = this.latex.slice(9).match(/({.*}|[^}])({.*}|[^}])/);
                if (m) {
                    if (m[1].length === 1) {
                        lhs = m[1];
                    } else {
                        lhs = m[1].substr(1, m[1].length - 2);
                    }
                    lhs = ParserModule.parseTokens(Lexer.tokenize(lhs),
                        'math', null, options.macros);
                    result.lhs = parse(lhs, options);

                    if (m[2].length === 1) {
                        rhs = m[2];
                    } else {
                        rhs = m[2].substr(1, m[2].length - 2);
                    }
                    rhs = ParserModule.parseTokens(Lexer.tokenize(rhs),
                        'math', null, options.macros);

                    result.op = '/';
                    result.rhs = parse(rhs, options);
                } else {
                    result.op = '/';
                }
            } else {
                result.group = parse(this.body, options);
            }
            break;

        case 'genfrac':
            lhs = parse(this.numer, options);
            rhs = parse(this.denom, options);
            result.lhs = lhs;
            result.op = '/';
            result.rhs = rhs;
            break;

        case 'surd':
            if (this.index) {
                result.fn = 'pow';
                result.arg = [parse(this.body, options)];
                result.arg[1] = {lhs: 1, op: '/', rhs: parse(this.index, options)};
            } else {
                result.fn = 'sqrt';
                result.arg = parse(this.body, options);
            }
            break;

        case 'rule':
            break;

        case 'font':
            if (this.latex === '\\text ') {
                result.text = toString(this.body);
                if (this.toLatex) {
                    result.latex = this.toLatex();
                }
            } else {
                result.sym = toString(this.body);
            }
            break;

        case 'line':
        case 'overlap':
        case 'accent':
            break;

        case 'overunder':
            break;

        case 'mord':
        case 'textord':
            // Check to see if it's a \char command
            m = !command ? undefined : command.match(/[{]?\\char"([0-9abcdefABCDEF]*)[}]?/);
            if (m) {
                sym = String.fromCodePoint(parseInt(m[1], 16));
            } else {
                sym = getCanonicalName(getString(this));
                if (sym.length > 0 && sym.charAt(0) === '\\') {
                    // This is an identifier with no special handling.
                    // Use the Unicode value if outside ASCII range
                    if (typeof this.body === 'string') {
                        // TODO: consider making this an option?
                        // if (this.body.charCodeAt(0) > 255) {
                        //     sym = '&#x' + ('000000' +
                        //         this.body.charCodeAt(0).toString(16)).substr(-4) + ';';
                        // } else {
                            sym = this.body;
                        // }
                    }
                }
            }
            result = escapeText(Definitions.mathVariantToUnicode(
                    sym, this.fontFamily || this.font));
            // if (variant) {
            //     result.sym = escapeText(sym);
            // } else {
            //     result = escapeText(sym);       // Shortcut: symbol as string
            // }
            break;

        // case 'mbin':
        // break;

        // case 'mpunct':
        //     result = '<mo separator="true">' + command + '</mo>';
        //     break;

        case 'minner':
            break;

        case 'mop':
            break;

        case 'color':
        case 'box':
            result = parse(this.body, options);
            break;

        case 'enclose':
            // result = '<menclose notation="';
            // for (const notation in this.notation) {
            //     if (this.notation.hasOwnProperty(notation) &&
            //         this.notation[notation]) {
            //         result += sep + notation;
            //         sep = ' ';
            //     }
            // }
            // result += '">' + toAST(this.body).mathML + '</menclose>';
            break;

        case 'array':
            if (this.env.name === 'cardinality') {
                result = {fn:'card', arg:[parse(this.array, options)]};
            }
            break;

        case 'spacing':
        case 'space':
        case 'sizing':
        case 'mathstyle':
            break;
        default:
            result = undefined;
            console.log('Unhandled atom ' + this.type + ' - ' + this.body);
    }

    if (variant && result) {
        result.variant = variant;
    }

    return result;
}


function filterPresentationAtoms(atoms) {
    if (!atoms) return [];
    let result;
    if (Array.isArray(atoms)) {
        result = [];
        for (const atom of atoms) {
            const filter = filterPresentationAtoms(atom);
            result = result.concat(filter);
        }
    } else {
        if (atoms.type === 'spacing') {
            return [];
        } else if (atoms.type === 'first' || atoms.type === 'color' || atoms.type === 'box' ||
                atoms.type === 'sizing') {
            result = filterPresentationAtoms(atoms.body);
        } else {
            if (atoms.body && Array.isArray(atoms.body)) {
                atoms.body = filterPresentationAtoms(atoms.body);
            }
            if (atoms.superscript && Array.isArray(atoms.superscript)) {
                atoms.superscript = filterPresentationAtoms(atoms.superscript);
            }
            if (atoms.subscript && Array.isArray(atoms.subscript)) {
                atoms.subscript = filterPresentationAtoms(atoms.subscript);
            }
            if (atoms.index && Array.isArray(atoms.index)) {
                atoms.index = filterPresentationAtoms(atoms.index);
            }
            if (atoms.denom && Array.isArray(atoms.denom)) {
                atoms.denom = filterPresentationAtoms(atoms.denom);
            }
            if (atoms.numer && Array.isArray(atoms.numer)) {
                atoms.numer = filterPresentationAtoms(atoms.numer);
            }
            if (atoms.array && Array.isArray(atoms.array)) {
                atoms.array = filterPresentationAtoms(atoms.array);
            }
            result = [atoms];
        }
    }
    return result;
}

/**
 *
 * @param {*} atoms an array of atoms
 * @return  {string}
 */
function parse(atoms, options) {

    return parseExpression({atoms: filterPresentationAtoms(atoms)}, options).ast;
}

function normalize(ast) {
    if (!ast) return ast;
    if (typeof ast === 'string') return ast;
    if (typeof ast === 'number') return ast;
    if (typeof ast === 'object') {
        if (ast.sup) {
            ast.sup = normalize(ast.sup);
        }
        if (ast.op) {
            if (ast.lhs && ast.rhs) {
                // if (ast.op === '+') ast.op = 'add';
                // if (ast.op === '*') ast.op = 'multiply';
                // if (ast.op === '-') ast.op = 'substract';
                // if (ast.op === '/') ast.op = 'divide';
                return {fn:ast.op, arg:[normalize(ast.lhs), normalize(ast.rhs)]};
            }
            return {fn:ast.op, arg:[normalize(ast.rhs)]};
        }
        if (ast.fn && Array.isArray(ast.arg)) {
            return {fn:ast.fn, arg:ast.arg.map(x => normalize(x))};
        }
        if (ast.fn) {
            return {fn:ast.fn, arg:normalize(ast.arg)};
        }
        if (ast.group) {
            return {group: normalize(ast.group)};
        }
    }


    return ast;
}

MathAtom.toAST = function(atoms, options) {
    return normalize(parse(atoms, options));
}

/**
 *
 * @param {string} fence -- The fence to validate
 * @param {string} -- Default values, in case no fence is provided
 * @return {string} -- A valid fence
 */
function validateFence(fence, defaultFence) {
    let result = fence || defaultFence;

    // Make sure there are some default values, even if no default fence was
    // provided.
    // A fence can be up to three characters:
    // - open fence
    // - close fence
    // - middle fence
    // '.' indicate and empty, invisible fence.

    result += '...';

    return result;
}


/**
 * Return a formatted mantissa:
 * 1234567 -> 123 456 7...
 * 1233333 -> 12(3)
 * @param {*} m
 * @param {*} config
 */
function formatMantissa(m, config) {
    const originalLength = m.length;
    // The last digit may have been rounded, if it exceeds the precison,
    // which could throw off the
    // repeating pattern detection. Ignore it.
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
                        return offset.replace(/(\d{3})/g, '$1' + config.groupSeparator);
                    }
                    return offset.replace(/(\d{3})/g, '$1' + config.groupSeparator) +
                        config.beginRepeatingDigits +
                        cycle.replace(/(\d{3})/g, '$1' + config.groupSeparator) +
                        config.endRepeatingDigits;
                }
            }
        }
    }
    if (originalLength !== m.length) {
        m += '\\ldots';
    }
    return  m.replace(/(\d{3})/g, '$1' + config.groupSeparator);
}

 /**
 *
 * @param {Object|number} num -- A number element, or a number or a bignumber or a fraction
 * @return {string} -- A LaTeX representation of the AST
 */
function numberAsLatex(num, config) {
    let result = '';

    if (typeof config.precision === 'number') {
        if (typeof num === 'number') {
            num = parseFloat(num.toFixed(Math.min(20, config.precision)));
        } else if (typeof num === 'string' && num.indexOf('/') >= 0) {
            // It's a fraction. We can ignore the precision
        } else {
            let sign = '';
            if (num[0] === '-') {
                sign = '-';
                num = num.substr(1);
            } else if (num[0] === '+') {
                num = num.substr(1);
            }
            if (num.indexOf('.') >= 0) {
                // if (num.length - 1 < config.precision) {
                //     //
                //     return sign + formatMantissa(num, config);
                // }
                const m = num.match(/(\d*).(\d*)/);
                const base = m[1];
                const mantissa = m[2];

                if (base === '0') {
                    let p = 2;  // Index of the first non-zero digit after the decimal
                    while (num[p] === '0' && p < num.length - 1) {
                        p += 1;
                    }
                    let r = '';
                    if (p <= 6) {
                        r = '0' + config.decimalMarker;
                        r += num.substr(2, p - 2);
                        r += formatMantissa(num.substr(r.length), config);
                    } else {
                        r = num[p];
                        const f = formatMantissa(num.substr(p + 1), config);
                        if (f) {
                            r += config.decimalMarker + f;
                        }
                    }
                    if (num.length - 1 > config.precision && !r.endsWith('}') && !r.endsWith('\\ldots')) {
                        r += '\\ldots';
                    }
                    if (p > 6) {
                        r += config.exponentProduct;
                        if (config.exponentMarker) {
                            r += config.exponentMarker + (1 - p).toString();
                        } else {
                            r += '10^{' + (1 - p).toString() + '}';
                        }
                    }
                    num = r;
                } else {
                    num = base.replace(/\B(?=(\d{3})+(?!\d))/g, config.groupSeparator);
                    const f = formatMantissa(mantissa, config);
                    if (f) {
                        num += config.decimalMarker + f;
                        if (num.length - 1 > config.precision && !num.endsWith('}') && !num.endsWith('\\ldots')) {
                            num += '\\ldots';
                        }
                    }
                }
            } else if (num.length > config.precision) {
                const len = num.length;
                let r = num[0];
                const f = formatMantissa(num.substr(2), config);
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
                if (config.exponentMarker) {
                    r += config.exponentMarker + (len - 2).toString();
                } else {
                    r += '10^{' + (len - 2).toString() + '}';
                }
                num = r;
            } else {
                num = num.replace(/\B(?=(\d{3})+(?!\d))/g, config.groupSeparator);
            }
            return sign + num;
        }
    }
    if (config.scientificNotation === 'engineering') {
        // Ensure the exponent is a multiple of 3
        if (num === 0) {
            result = '0';
        } else {
            const y = Math.abs(num);
            let exponent = Math.round(Math.log10(y));
            exponent = exponent - exponent % 3;
            if (y < 1000) exponent = 0;
            let mantissa = y / Math.pow(10, exponent);
            const m = mantissa.toString().match(/^(.*)\.(.*)$/);
            if (m && m[1] && m[2]) {
                mantissa = m[1] + config.decimalMarker + m[2];
            }
            if (config.groupSeparator) {
                mantissa = formatMantissa(mantissa.toExponential(), config);
            }
            if (exponent === 0) {
                exponent = '';
            } else if (config.exponentMarker) {
                exponent = config.exponentMarker + exponent;
            } else {
                exponent = config.exponentProduct + ' 10^{' + exponent + '}';
            }
            result = (num < 0 ? '-' : '') + mantissa + exponent;
        }
    } else {
        const valString = typeof num === 'string' ? num : num.toString();
        let m = valString.match(/^(.*)[e|E]([-+]?[0-9]*)$/i);
        let base, exponent, mantissa;
        base = valString;
        mantissa = '';
        if (m && m[1] && m[2]) {
            // There is an exponent...
            base = m[1];
            if (config.exponentMarker) {
                exponent = config.exponentMarker + m[2];
            } else {
                exponent = config.exponentProduct + ' 10^{' + m[2] + '}';
            }
        }
        m = base.match(/^(.*)\.(.*)$/);
        if (m && m[1] && m[2]) {
            base = m[1];
            mantissa = m[2];
        }
        if (config.groupSeparator) {
            base = base.replace(/\B(?=(\d{3})+(?!\d))/g, config.groupSeparator);
            mantissa = formatMantissa(mantissa, config);
        }
        if (mantissa) mantissa = config.decimalMarker + mantissa;
        result = base + mantissa + (exponent || '');
    }
    return result;
}



 /**
 *
 * @param {Object} ast -- Abstract Syntax Tree object
 * @return {string} -- A LaTeX representation of the AST
 */
function asLatex(ast, options) {
    const config = Object.assign({
        precision:              14,
        decimalMarker:          '.',
        groupSeparator:         '\\, ',
        product:                '\\cdot ',   // \\times, \\,
        exponentProduct:        '\\cdot ',
        exponentMarker:         '',
        arcSeparator:           '\\,',
        scientificNotation:     'auto', // 'engineering', 'auto', 'on'
        beginRepeatingDigits:   '\\overline{',
        endRepeatingDigits:     '}',
    }, options);

    let result = '';

    if (ast === undefined) return '';

    if (ast.latex) {
        // If ast.latex key is present, use it to render the element
        result = ast.latex;

    } else if (ast.num !== undefined && ast.num.match(/([+-]?[0-9]+)\/([0-9]+)/)) {
        result = numberAsLatex(ast.num, config);
        if (ast.sup) result += '^{' + asLatex(ast.sup, config) + '}';
        if (ast.sub) result += '_{' + asLatex(ast.sub, config) + '}';

    } else if (isNumber(ast)) {
        const val = typeof ast === 'number' ? ast : ast.num;
        if (isNaN(val)) {
            result = '\\text{NaN}';
        } else if (val === -Infinity) {
            result = '-\\infty ';
        } else if (val === Infinity) {
            result = '\\infty ';
        } else {
            result = numberAsLatex(ast.num || ast, config);
        }
        if (ast.sup) result += '^{' + asLatex(ast.sup, config) + '}';
        if (ast.sub) result += '_{' + asLatex(ast.sub, config) + '}';

    } else if (ast.re !== undefined || ast.im !== undefined ) {
        let wrap = false;
        if (Math.abs(ast.im) <= 1e-14 && Math.abs(ast.re) <= 1e-14) {
            result = '0';
        } else {
            if (ast.re && Math.abs(ast.re) > 1e-14) {
                result = numberAsLatex(ast.re, config);
            }
            if (Math.abs(ast.im) > 1e-14) {
                const im = asMachineNumber(ast.im);
                if (Math.abs(ast.re) > 1e-14) {
                    result += im > 0 ? '+' : '';
                    wrap = true;
                }
                result += (Math.abs(im) !== 1 ?
                    numberAsLatex(ast.im, config) : '') + '\\imaginaryI ';
            }
            if (wrap) {
                const fence = validateFence(ast.fence, '(),');
                result = fence[0] + result + fence[1];
            }
        }
        if (ast.sup) result += '^{' + asLatex(ast.sup, config) + '}';
        if (ast.sub) result += '_{' + asLatex(ast.sub, config) + '}';

    } else if (ast.group) {
        result = asLatex(ast.group);
        if (!isNumber(ast.group) && !asSymbol(ast.group)) {
            const fence = validateFence(ast.fence, '(),');
            result = fence[0] + result + fence[1];
        }
        if (ast.sup) result += '^{' + asLatex(ast.sup, config) + '}';
        if (ast.sub) result += '_{' + asLatex(ast.sub, config) + '}';

    } else if (ast.fn) {
        if (ast.fn === 'pow' && Array.isArray(ast.arg) && ast.arg.length >= 2) {
            result = asLatex(ast.arg[0], config);
            if (!isNumber(ast.arg[0]) && !asSymbol(ast.arg[0])) {
                const fence = validateFence(ast.fence, '(),');
                result = fence[0] + result + fence[1];
            }

            result += '^{' + asLatex(ast.arg[1], config) + '}';
        } else {
            const fn = getLatexTemplateForFunction(ast.fn);
            let argstring = '';
            const optionalParen = ast.fn.match(/^(factorial(2)?|(((ar|arc)?(sin|cos|tan|cot|sec|csc)h?)|ln|log|lb))$/);
            if (Array.isArray(ast.arg) || !optionalParen) {
                let sep = '';
                const fence = validateFence(ast.fence, '(),');
                if (fence[0] !== '.') argstring += fence[0];
                if (Array.isArray(ast.arg)) {
                    for (const arg of ast.arg) {
                        argstring += sep + asLatex(arg, config);
                        sep = ', ';
                    }
                } else if (ast.arg) {
                    argstring += asLatex(ast.arg, config);
                }
                if (fence[1] !== '.') argstring += fence[1];
            } else if (ast.arg !== undefined) {
                // The parenthesis may be option...
                if (typeof ast.arg === 'number' ||
                    typeof ast.arg === 'string' ||
                    ast.arg.num !== undefined ||
                    ast.arg.sym !== undefined ||
                    ast.arg.op === '/' ||
                    ast.arg.fn === 'sqrt') {
                    // A simple argument, no need for parentheses
                    argstring = asLatex(ast.arg, config);

                } else {
                    // A complex expression, use parentheses if the arguments
                    // are the last element of the function template.
                    // For example, for abs()... |%|, parenthesis are not necessary.
                    if (fn[fn.length - 1] === '%') {
                        const fence = validateFence(ast.fence, '(),');
                        argstring += fence[0];
                        argstring += asLatex(ast.arg, config);
                        argstring += fence[1];
                    } else {
                        argstring = asLatex(ast.arg, config);
                    }
                }
            }

            result = fn;
            if (ast.over || ast.sup) {
                result = result.replace('%^','^{' + asLatex(ast.over || ast.sup, config) + '}');
            } else {
                result = result.replace('%^','');
            }
            if (ast.under || ast.sub) {
                result = result.replace('%_','_{' + asLatex(ast.under || ast.sub, config) + '}');
            } else {
                result = result.replace('%_','');
            }

            // Insert the arguments in the function template
            result = result.replace('%', argstring);
        }

    } else if (ast.sym !== undefined || typeof ast === 'string') {
        result = asSymbol(ast);
        // Is it a Unicode value?
        let m = result.match(/^&#x([0-9a-f]+);$/i);
        if (m && m[1]) {
            result = String.fromCodePoint(parseInt(m[1], 16));
        } else {
            m = result.match(/^&#([0-9]+);$/i);
            if (m && m[1]) {
                result = String.fromCodePoint(parseInt(m[1]));
            }
        }

        // Is there a variant info attached to it?
        if (ast.variant) {
            const MATH_VARIANTS = {
                'normal':   'mathrm',
                'double-struck': 'mathbb',
                'bold': 'mathbf',
                // 'script': 'mathcal',
                'fraktur': 'mathfrak',
                'script': 'mathscr',
                'sans-serif': 'mathsf',
                'monospace': 'mathtt'
            };
            result = '\\' + MATH_VARIANTS[ast.variant] +
                '{' + result + '}';
        }
        if (ast.sup) result += '^{' + asLatex(ast.sup, config) + '}';
        if (ast.sub) result += '_{' + asLatex(ast.sub, config) + '}';

    } else if (ast.op) {
        if (ast.op === '/') {
            result = '\\frac{' + asLatex(ast.lhs, config) + '}{' + asLatex(ast.rhs, config) + '}';
            if (ast.sup || ast.sub) {
                result = '(' + result + ')';
                if (ast.sup) result += '^{' + asLatex(ast.sup, config) + '}';
                if (ast.sub) result += '_{' + asLatex(ast.sub, config) + '}';
            }
        } else {
            let lhs, rhs;
            lhs = asLatex(ast.lhs, config);
            if (ast.lhs && ast.lhs.op && getPrecedence(ast.lhs.op) < getPrecedence(ast.op)) {
                lhs = '(' + lhs + ')';
            }

            rhs = asLatex(ast.rhs, config);
            if (ast.rhs && ast.rhs.op && getPrecedence(ast.rhs.op) < getPrecedence(ast.op)) {
                rhs = '(' + rhs + ')';
            }

            if (ast.op === '*') {
                result = '%0 ' + config.product + ' %1';
            } else {
                result = getLatexTemplateForOperator(ast.op);
            }
            result = result.replace('%^', ast.sup ? '^{' + asLatex(ast.sup, config) + '}' : '');
            result = result.replace('%_', ast.sub ? '_{' + asLatex(ast.sub, config) + '}' : '');
            result = result.replace('%0', lhs).replace('%1', rhs).replace('%', lhs);
        }

    } else if (ast.text) {
        result = '\\text{' + ast.text + '}';

    } else if (ast.array) {
        // TODO
    }

    // If there was an error attached to this node,
    // display it on a red background
    if (ast.error) {
        result = '\\bbox[#F56165]{' + result + '}';
    }

    return result;
}


// Export the public interface for this module
export default {
    asLatex,
    asMachineNumber,
    isNumber,
    asSymbol,
}



