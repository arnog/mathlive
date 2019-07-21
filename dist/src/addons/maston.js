/**
 * This module parses and outputs an Abstract Syntax Tree representing the 
 * formula using the {@tutorial MASTON} format. 
 * 
 * To use it, use the {@linkcode MathAtom#toAST MathAtom.toAST()}  method.
 * @module addons/maston
 * @private
 */

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
    '\\cdot':           '*',
    '⨉':                '*',        // N-ARY TIMES OPERATOR U+
    '️✖':                '*',        // MULTIPLICATION SYMBOL
    '️×':                '*',        // MULTIPLICATION SIGN
    '.':                '*',
    '÷':                '/',        // DIVISION SIGN
    // '/':             '/',        // SOLIDUS
    '⁄':                 '/',        // FRACTION SLASH
    '／':                '/',        // FULLWIDTH SOLIDUS
    '!':                'factorial',
    '\\mp':             'minusplus', // MINUS-PLUS SIGN
    '\\ne':             '!=',
    '\\coloneq':        ':=',
    '\\questeq':        '?=',
    '\\approx':         'approx',
    '\\cong':           'congruent',
    '\\sim':            'similar',
    '\\equiv':          'equiv',
    '\\pm':             'plusminus',    // PLUS-MINUS SIGN

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

// The OP_NAME table maps a canonical name to a function name
const OP_NAME = {
    '+':            'add',
    '*':            'multiply',
    '-':            'subtract',
    '/':            'divide',
    '=':            'equal',
    ':=':           'assign',
    '!=':           'ne',
    '?=':           'questeq',
    'approx':       'approx',
    'congruent':    'congruent',
    'similar':       'similar',
    'equiv':        'equiv',
    '<':            'lt',
    '>':            'gt',
    '<=':           'le',
    '>=':           'ge',
    '≤':            'le',
    '≥':            'ge',
    '>>':           'gg',
    '<<':           'll',
    '**':           'pow',
    '++':           'increment',
    '--':           'decrement',
}


// The FUNCTION_TEMPLATE table maps a canonical name to a LaTeX template
const FUNCTION_TEMPLATE = {
    'equal':                    '%0 = %1',
    'ne':                       '%0 \\ne %1',
    'questeq':                  '%0 \\questeq %1',
    'approx':                   '%0 \\approx %1',
    'congruent':                '%0 \\cong %1',
    'similar':                  '%0 \\sim %1',
    'equiv':                    '%0 \\equiv %1',
    'assign':                   '%0 := %1',
    'lt':                       '%0 < %1',
    'gt':                       '%0 > %1',
    'le':                       '%0 \\le %1',
    'ge':                       '%0 \\ge %1',

    // TRIGONOMETRY
    'sin':                      '\\sin%_%^ %0',
    'cos':                      '\\cos%_%^ %0',
    'tan':                      '\\tan%_%^ %0',
    'cot':                      '\\cot%_%^ %0',
    'sec':                      '\\sec%_%^ %0',
    'csc':                      '\\csc%_%^ %0',

    'sinh':                     '\\sinh %0',
    'cosh':                     '\\cosh %0',
    'tanh':                     '\\tanh %0',
    'csch':                     '\\csch %0',
    'sech':                     '\\sech %0',
    'coth':                     '\\coth %0',

    'arcsin':                   '\\arcsin %0',
    'arccos':                   '\\arccos %0',
    'arctan':                   '\\arctan %0',
    'arccot':                   '\\arcctg %0',        // Check
    'arcsec':                   '\\arcsec %0',
    'arccsc':                   '\\arccsc %0',

    'arsinh':                   '\\arsinh %0',
    'arcosh':                   '\\arcosh %0',
    'artanh':                   '\\artanh %0',
    'arcsch':                   '\\arcsch %0',
    'arsech':                   '\\arsech %0',
    'arcoth':                   '\\arcoth %0',

    // LOGARITHMS
    'ln':                       '\\ln%_%^ %',     // Natural logarithm
    'log':                      '\\log%_%^ %',    // General logarithm, e.g. log_10
    'lg':                       '\\lg %',     // Common, base-10, logarithm
    'lb':                       '\\lb %',     // Binary, base-2, logarithm

    // Big operator
    'sum':                      '\\sum%_%^ %0',
    'prod':                     '\\prod%_%^ %0',

    // OTHER
    'Zeta':     '\\zeta%_%^ %', // Riemann Zeta function
    'Gamma':    '\\Gamma %',    // Gamma function, such that Gamma(n) = (n - 1)!
    'min':      '\\min%_%^ %',
    'max':      '\\max%_%^ %',
    'mod':      '\\mod%_%^ %',
    'lim':      '\\lim%_%^ %',      // BIG OP
    'binom':    '\\binom %',
    'nabla':    '\\nabla %',
    'curl':     '\\nabla\\times %0',
    'div':      '\\nabla\\cdot %0',
    'floor':    '\\lfloor %0 \\rfloor%_%^',
    'ceil':     '\\lceil %0 \\rceil%_%^',
    'abs':      '\\left| %0 \\right|%_%^',
    'norm':     '\\lVert %0 \\rVert%_%^',
    'ucorner':  '\\ulcorner %0 \\urcorner%_%^',
    'lcorner':  '\\llcorner %0 \\lrcorner%_%^',
    'angle':    '\\langle %0 \\rangle%_%^',
    'group':    '\\lgroup %0 \\rgroup%_%^',
    'moustache':'\\lmoustache %0 \\rmoustache%_%^',
    'brace':    '\\lbrace %0 \\rbrace%_%^',
    'sqrt[]':   '\\sqrt[%^]{%0}',       // Template used when there's an index
    'sqrt':     '\\sqrt{%0}',
    'lcm':      '\\operatorname{lcm}%',
    'gcd':      '\\operatorname{gcd}%',
    'erf':      '\\operatorname{erf}%',
    'erfc':     '\\operatorname{erfc}%',
    'randomReal': '\\operatorname{randomReal}%',
    'randomInteger': '\\operatorname{randomInteger}%',


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
    'Re':       '\\Re{%0}',
    'Im':       '\\Im{%0}',
    'factorial': '%0!',
    'factorial2': '%0!!',
}





// From www.w3.org/TR/MathML3/appendixc.html
// The keys of OP_PRECEDENCE are "canonical names" 
// (the values of the CANONICAL_NAMES table above, e.g. "?=")
// Those are different from the latex names (e.g. \\questeq)
// and from the function names (e.g. "questeq")
const OP_PRECEDENCE = {
    'degree':               880,
    'nabla':                740,
    'curl':                 740,    // not in MathML
    'partial':              740,
    'differentialD':        740,    // not in MathML
    'capitalDifferentialD': 740,    // not in MathML

    '**':                   720,    // not in MathML

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

    '|':                    261,    // Not in MathML    (bind is the |_ operator)


    // Relational
    'congruent':            265,
    'equiv':                260,    // MathML: "identical to"
    '=':                    260,
    '!=':                   255,
    '?=':                   255,
    'similar':              250,    // tilde operator in MathML

    'approx':               247,
    '<':                    245,
    '>':                    243,
    '>=':                   242,
    '≥':                    242,
    '<=':                   241,

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


    // Assignment
    'assign':            80,       
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


function getArg(ast, index) {
    return Array.isArray(ast.arg) ? ast.arg[index] : undefined;
}


/**
 * Given a canonical name, return its precedence
 * @param {string} canonicalName, for example "and"
 * @return {number}
 * @private
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
 * @private
 */
function getLatexTemplateForFunction(name) {
    let result = FUNCTION_TEMPLATE[name];
    if (!result) {
        result = name.length > 1 ? '\\operatorname{' + name + '}%^%_ %' : (name + '%^%_ %');
    }

    return result;
}

/**
 *
 * @param {string} name symbol name, e.g. "alpha"
 * @return {string}
 * @private
 */
function getLatexForSymbol(name) {
    let result = FUNCTION_TEMPLATE[name];
    if (result) {
        return result.replace('%1', '').replace('%0', '').replace('%', '');
    }
    if (name.length > 1) {
        const info = Definitions.getInfo('\\' + name, 'math');
        if (info &&
            (!info.fontFamily || info.fontFamily === 'cmr' || info.fontFamily === 'ams')) {
            result = '\\' + name;
        }
    }
    if (!result) {
        result = Definitions.unicodeStringToLatex('math', name);
    }        

    return result;
}


function isFunction(canonicalName) {        
    if (canonicalName === 'f' || canonicalName === 'g') return true;

    const t = FUNCTION_TEMPLATE[canonicalName];
    if (!t) return false;

    // A plain "%" is a placeholder for an argument list, indicating a function
    if (/%[^01_^]?/.test(t)) return true;

    return false;
}


/**
 *
 * @param {string} latex, for example '\\times'
 * @return {string} the canonical name for the input, for example '*'
 * @private
 */
function getCanonicalName(latex) {
    latex = (latex || '').trim();
    let result = CANONICAL_NAMES[latex];
    if (!result) {
        if (/^\\[^{}]+$/.test(latex)) {
            const info = Definitions.getInfo(latex, 'math', {});
            if (info) {
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
 * @param {object} atom
 * @return {number}
 * @private
 */
function opPrec(atom) {
    if (!atom) return null;
    const name = getCanonicalName(getString(atom));
    const result = [getPrecedence(name), getAssociativity(name)];
    if (result[0] <= 0) return null
    return result;
}

function isOperator(atom) {
    return opPrec(atom) !== null;
}


const DELIM_FUNCTION = {
    '\\lfloor\\rfloor':         'floor',
    '\\lceil\\rceil':           'ceil',
    '\\vert\\vert':             'abs',
    '\\lvert\\rvert':           'abs',
    '||':                       'abs',
    '\\Vert\\Vert':             'norm',
    '\\lVert\\rVert':           'norm',
    '\\ulcorner\\urcorner':     'ucorner',
    '\\llcorner\\lrcorner':     'lcorner',
    '\\langle\\rangle':         'angle',
    '\\lgroup\\rgroup':         'group',
    '\\lmoustache\\rmoustache': 'moustache',
    '\\lbrace\\rbrace':         'brace'
}

const POSTFIX_FUNCTION = {
    '!':                    'factorial',
    '\\dag':                'dagger',
    '\\dagger':             'dagger',
    '\\ddagger':            'dagger2',
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
    '+':                    'add',
    '-':                    'add',      // Subtraction is add(), but it's
                                        // handled specifically so that the
                                        // argument is negated
    '*':                    'multiply',

    '=':                    'equal',

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
    if (Array.isArray(atom)) {
        let result = '';
        for (const subAtom of atom) {
            result += getString(subAtom);
        }
        return result;
    }
    if (atom.latex && 
        !/^\\math(op|bin|rel|open|punct|ord|inner)/.test(atom.latex)) {
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
 * @param {object} expr - Abstract Syntax Tree object
 * @return {string} A string, the symbol, or undefined
 * @private
 */
function asSymbol(node) {
    return typeof node.sym === 'string' ? (getLatexForSymbol(node.sym) || node.sym) : '';
}



/**
 *
 * @param {object} node - Abstract Syntax Tree node
 * @return {number} A JavaScript number, the value of the AST or NaN
 * @private
 * @private
 */
function asMachineNumber(node) {
    return parseFloat(node.num);
}

function isNumber(node) {
    return typeof node === 'object' && typeof node.num !== 'undefined';
}

function numberRe(node) {
    let result = 0;
    if (isNumber(node)) {
        if (typeof node.num === 'object') {
            result = typeof node.num.re !== 'undefined' ? parseFloatToPrecision(node.num.re) : 0;
        } else {
            result = parseFloat(node.num); 
        }
    }
    return result;
}

function numberIm(node) {
    let result = 0;
    if (isNumber(node)) {
        if (typeof node.num === 'object') {
            result = typeof node.num.im !== 'undefined' ? parseFloatToPrecision(node.num.im) : 0;
        }
    }
    return result;
}


function isComplexWithRealAndImaginary(node) {
    return numberRe(node) !== 0 && numberIm(node) !== 0;
}

function hasSup(node) {
    return node && typeof node.sup !== 'undefined';
}

function hasSub(node) {
    return node && typeof node.sub !== 'undefined';
}

/**
 * Return true if the current atom is of the specified type and value.
 * @param {object} expr
 * @param {string} type
 * @param {string} value
 * @private
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
 * 
 * @param {string} functionName 
 * @param {object} params 
 * @private
 */
function wrapFn(functionName, ...params) {
    const result = { fn: functionName };
    if (params) {
        const args = [];
        for (const arg of params) {
            if (arg) args.push(arg);
        }
        if (args.length > 0) result.arg = args;
    }
    return result;
}

function wrapNum(num) {
    if (typeof num === 'number') {
        return {num: num.toString() }
    } else if (typeof num === 'string') {
        return {num: num}
    } else if (typeof num === 'object') {
        // This is a complex number
        console.assert(typeof num.re === 'string' || typeof num.im === 'string');
        return {num: num};
    }
    return undefined;
}

/**
 * Return the negative of the expression. Usually { fn:'negate', arg }
 * but for numbers, the negated number
 * @param {object} node
 * @private
 */
function negate(node) {
    if (isNumber(node)) {
        const re = numberRe(node);
        const im = numberIm(node);
        if (im !== 0) {
            if (re !== 0) {
                node.num.re = (-re).toString();
            }
            node.num.im = (-im).toString();
        } else {
            node.num = (-re).toString();
        }
        return node;
    }
    return wrapFn('negate', node);
}

function nextIsSupsub(expr) {
    const atom = expr.atoms[expr.index + 1];
    return atom && atom.type === 'msubsup';
}

/**
 * Parse for a possible sup/sub attached directly to the current atom
 * or to a following 'msubsup' atom.
 * After the call, the index points to the next atom to process.
 * @param {object} expr
 * @private
 */
function parseSupsub(expr, options) {
    let atom = expr.atoms[expr.index];

    // Is there a supsub directly on this atom?
    if (atom && (typeof atom.superscript !== 'undefined' || typeof atom.subscript !== 'undefined')) {
        // Move to the following atom
        expr.index += 1;
    } else {
        atom = null;
    }

    // If this atom didn't have a sup/sub,
    // is the following atom a subsup atom?
    if (!atom) {
        atom = expr.atoms[expr.index + 1];
        if (!atom || atom.type !== 'msubsup' || !(atom.superscript || atom.subscript)) {
            atom = null;
        } else {
            // Yes. Skip the current atom and the supsub
            expr.index += 2;
        }
    }

    if (atom) {
        if (typeof atom.subscript !== 'undefined') {
            expr.ast.sub = parse(atom.subscript, options);
        }
        if (typeof atom.superscript !== 'undefined') {
            if (atom.type === 'msubsup') {
                if (/['\u2032]|\\prime/.test(getString(atom.superscript))) {
                    expr.index += 1;
                    atom = expr.atoms[expr.index + 1];
                    if (atom && atom.type === 'msubsup' && /['\u2032]|\\prime/.test(getString(atom.superscript))) {
                        expr.ast.sup = {sym: '\u2033'}; // DOUBLE-PRIME
                    } else {
                        expr.ast.sup = {sym: '\u2032'}; // PRIME
                        expr.index -= 1;
                    }
                } else if (/['\u2033]|\\doubleprime/.test(getString(atom.superscript))) {
                    expr.ast.sup = {sym: '\u2033'}; // DOUBLE-PRIME
                } else if (expr.ast) {
                    expr.ast.sup = parse(atom.superscript, options);
                }
            } else {
                expr.ast.sup = parse(atom.superscript, options);
            }
        }
    } else {
        // Didn't find a supsup either on this atom and there was no 'msubsup'
        // Time to move on to the next atom.
        expr.index += 1;
    }

    return expr;
}


/**
 * Parse postfix operators, such as "!" (factorial)
 * @private
 */
function parsePostfix(expr, options) {
    const lhs = expr.ast;
    if (nextIsDigraph(expr, '!!')) {
        expr.index += 1;
        expr.ast = wrapFn('factorial2', lhs);
        expr = parseSupsub(expr, options);
        expr = parsePostfix(expr, options);
        return expr;
    }
    if (nextIsDigraph(expr, '++')) {
        expr.index += 1;
        expr.ast = wrapFn('increment', lhs);
        expr = parseSupsub(expr, options);
        expr = parsePostfix(expr, options);
        return expr;
    }
    if (nextIsDigraph(expr, '--')) {
        expr.index += 1;
        expr.ast = wrapFn('decrement', lhs);
        expr = parseSupsub(expr, options);
        expr = parsePostfix(expr, options);
        return expr;
    }
    const atom = expr.atoms[expr.index];
    if (atom && atom.latex && POSTFIX_FUNCTION[atom.latex.trim()]) {
        expr.ast = wrapFn(POSTFIX_FUNCTION[atom.latex.trim()], lhs);
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
 * @private
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
            // If we have an unclosed smart fence, assume the right delim is
            // matching the left delim
            if (rdelim === '?') rdelim = Definitions.RIGHT_DELIM[ldelim];
        } else if (atom.type === 'textord') {
            ldelim = atom.latex.trim();
            rdelim = Definitions.RIGHT_DELIM[ldelim];
        }
        if (ldelim && rdelim) {
            if (ldelim === '|' && rdelim === '|') {
                // Check if this could be a ||x|| instead of |x|
                const atom = expr.atoms[expr.index + 1];
                if (atom && atom.type === 'textord' && atom.latex === '|') {
                    // Yes, it's a ||x||
                    ldelim = '\\lVert';
                    rdelim = '\\rVert';
                }
            }
            expr = parseDelim(expr, ldelim, rdelim);
            if (expr) {
                if (pairedDelim) expr.index += 1;
                expr.ast = {
                    fn: DELIM_FUNCTION[ldelim + rdelim] || (ldelim + rdelim),
                    arg: [expr.ast]};
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
            if (nextIsSupsub(expr)) {
                // Wrap in a group if we have an upcoming superscript or subscript
                expr.ast = {group: expr.ast};
            }
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

    } else if (ldelim === '\\lVert' && atom.type === 'textord' && atom.latex === '|') {
        atom = expr.atoms[expr.index + 1];
        if (atom && atom.type === 'textord' && atom.latex === '|') {
            // This is an opening ||
            expr.index += 2;    // Skip the open delim
            expr = parseExpression(expr, options);
            atom = expr.atoms[expr.index];
            const atom2 = expr.atoms[expr.index + 1];
            if (atom && atom.type === 'textord' && atom.latex === '|' && 
                atom2 && atom2.type === 'textord' && atom2.latex === '|') {
                // This was a closing ||
                expr.index += 2;
                expr = parseSupsub(expr, options);
                expr = parsePostfix(expr, options);
            }
        }

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
        if (nextIsSupsub(expr)) {
            // Wrap in a group if we have an upcoming superscript or subscript
            expr.ast = {group: expr.ast};
        }
        expr = parseSupsub(expr, options);
        expr = parsePostfix(expr, options);

    } else {
        return undefined;
    }

    expr.minPrec = savedPrec;
    return expr;
}


function nextIsDigraph(expr, digraph) {
    expr.index = expr.index || 0;

    if (expr.atoms.length <= 1 || expr.index >= expr.atoms.length - 1) {
        return false;
    }

    return digraph === getString(expr.atoms[expr.index]) + 
        getString(expr.atoms[expr.index + 1]);
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
 * @private
 *
*/
function parseDigraph(expr) {
    expr.index = expr.index || 0;

    if (expr.atoms.length <= 1 || expr.index >= expr.atoms.length - 1) {
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
    } else {
        const digraph = expr.atoms[expr.index].latex + 
            expr.atoms[expr.index + 1].latex;
        const result = /^(>=|<=|>>|<<|:=|!=|\*\*|\+\+|--)$/.test(digraph) ? digraph : '';
        if (result) {
            expr.index += 1;
        }
        return result;
    }

    return undefined;
}


function parsePrimary(expr, options) {

    // <primary> := ('-'|'+) <primary> | <number> | 
    //              '(' <expression> ')' | <symbol> | <text> (<expression>)

     expr.index = expr.index || 0;
     expr.ast = undefined;

    if (expr.atoms.length === 0 || expr.index >= expr.atoms.length) {
        return expr;
    }

    let atom = expr.atoms[expr.index];

    const val = getCanonicalName(getString(atom));

    const digraph = parseDigraph(expr);
    if (digraph) {
        expr.ast = wrapFn(expr.ast, parsePrimary(expr, options).ast);

    } else if (atom.type === 'root') {
        expr.index = 0;
        expr.atoms = atom.body;
        return parsePrimary(expr, options);

    } else if (atom.type === 'mbin' && val === '-') {
        // Prefix - sign
        expr.index += 1;  // Skip the '-' symbol
        expr = parsePrimary(expr, options);
        expr.ast = negate(expr.ast);

    } else if (atom.type === 'mbin' && val === '+') {
        // Prefix + sign
        expr.index += 1;  // Skip the '+' symbol
        expr = parsePrimary(expr, options);
        expr.ast = wrapFn('add', expr.ast);

    } else if (atom.type === 'mord' && /^[0-9.]$/.test(atom.latex)) {
        // Looks like a number
        let num = '';
        let done = false;
        let pat = /^[0-9.eEdD]$/;
        while (expr.index < expr.atoms.length && !done && (isAtom(expr, 'spacing') ||
                (
                    (
                        isAtom(expr, 'mord') ||
                        isAtom(expr, 'mpunct', ',') ||
                        isAtom(expr, 'mbin')
                    ) &&
                        pat.test(expr.atoms[expr.index].latex)
                    )
                )
            ) {
            if (expr.atoms[expr.index].type === 'spacing') {
                expr.index += 1;
            } else if (typeof expr.atoms[expr.index].superscript !== 'undefined' || 
                typeof expr.atoms[expr.index].subscript !== 'undefined') {
                done = true;
            } else {
                let digit = expr.atoms[expr.index].latex;
                if (digit === 'd' || digit === 'D') {
                    digit = 'e';
                    pat = /^[0-9+-.]$/;
                } else if (digit === 'e' || digit === 'E') {
                    if (nextIsSupsub(expr)) {
                        digit = '';
                        expr.index -= 1;
                        done = true;
                    } else {
                        digit = 'E';
                        pat = /^[0-9+-.]$/
                    }
                } else if (pat === /^[0-9+-.]$/) {
                    pat = /^[0-9]$/;
                }
                num += digit === ',' ? '' : digit;
                expr.index += 1;
            }
        }
        expr.ast = num ? wrapNum(num) : undefined;

        // This was a number. Is it followed by a fraction, e.g. 2 1/2
        atom = expr.atoms[expr.index];
        if (atom && atom.type === 'genfrac' && !isNaN(expr.ast.num)) {
            // Add an invisible plus, i.e. 2 1/2 = 2 + 1/2
            const lhs = expr.ast;
            expr = parsePrimary(expr, options);
            expr.ast = wrapFn('add', lhs, expr.ast);
        }
        if (atom && atom.type === 'group' && atom.latex && atom.latex.startsWith('\\nicefrac')) {
            // \nicefrac macro, add an invisible plus
            const lhs = expr.ast;
            expr = parsePrimary(expr, options);
            expr.ast = wrapFn('add', lhs, expr.ast);
        }
        if (atom && atom.type === 'msubsup') {
            expr = parseSupsub(expr, options);
        }
        expr = parsePostfix(expr, options);

    } else if (atom.type === 'genfrac' || atom.type === 'surd') {
        // A fraction or a square/cube root
        expr.ast = atom.toAST(options);
        expr = parseSupsub(expr, options);
        expr = parsePostfix(expr, options);

    } else if (atom.type === 'mord' || atom.type === 'mbin') {
        // A 'mord' but not a number: either an identifier ('x') or 
        // a function ('\\Zeta')
        if (isFunction(val) && !isOperator(atom)) {
            // A function
            expr.ast = { fn: val };
            expr = parseSupsub(expr, options);

            const fn = expr.ast;
            const arg = parsePrimary(expr, options).ast;
            if (arg && /^(list0|list|list2)$/.test(arg.fn)) {
                fn.arg = fn.arg ? fn.arg.arg : undefined;
            } else if (arg) {
                fn.arg = [arg]
            }
            expr.ast = fn;
        } else {
            // An identifier
            expr.ast = atom.toAST(options);
            if (expr.ast.sym === 'ⅈ') {
                // It's 'i', the imaginary unit
                expr.ast = wrapNum({im: "1"});
            }
            expr = parseSupsub(expr);
        }
        expr = parsePostfix(expr, options);

    } else if (atom.type === 'textord') {
        // Note that 'textord' can also be operators, and are handled as such
        // in parseExpression()
        if (!isOperator(atom)) {
            // This doesn't look like a textord operator
            if (!Definitions.RIGHT_DELIM[atom.latex ? atom.latex.trim() : atom.body]) {
                // Not an operator, not a fence, it's a symbol or a function
                if (isFunction(val)) {
                    // It's a function
                    expr.ast = { fn: val };
                    expr = parseSupsub(expr, options);

                    const fn = expr.ast;
                    expr.index += 1;  // Skip the function name
                    fn.arg = [parsePrimary(expr, options).ast];
                    expr.ast = fn;

                    expr = parsePostfix(expr, options);

                } else {
                    // It was a symbol...
                    expr.ast = atom.toAST(options);
                    if (typeof atom.superscript === 'undefined') {
                        expr.index += 1;
                    }
                    expr = parseSupsub(expr, options);
                    expr = parsePostfix(expr, options);
                }
            }
        }

    } else if (atom.type === 'mop') {
        // Could be a function or an operator.
        if ((/^\\(mathop|operatorname|operatorname\*)/.test(atom.latex) || isFunction(val)) && 
            !isOperator(atom)) {

            expr.ast = { fn: /^\\(mathop|operatorname|operatorname\*)/.test(atom.latex) ? atom.body : val};
            expr = parseSupsub(expr, options);

            if (hasSup(expr.ast)) {
                // There was an exponent with the function.
                // This may be an inverse function
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
                if (asMachineNumber(expr.ast.sup) === -1 && INVERSE_FUNCTION[val]) {
                    expr.ast = wrapFn(INVERSE_FUNCTION[val], parsePrimary(expr, options).ast);
                } else {
                    // Keep the exponent, add the argument
                    const fn = expr.ast;
                    fn.arg = [parsePrimary(expr, options).ast];
                    expr.ast = fn;
                }

            } else {
                const fn = expr.ast;
                const arg = parsePrimary(expr, options).ast;
                if (arg && /^(list0|list|list2)$/.test(arg.fn)) {
                    fn.arg = arg.arg;
                } else if (arg) {
                    fn.arg = [arg]
                }

                expr.ast = fn;
            }
        }
    } else if (atom.type === 'array') {
       expr.index += 1;
       expr.ast = atom.toAST(options);

    } else if (atom.type === 'group') {
        expr.index += 1;
        expr.ast = atom.toAST(options);

    } else if (atom.type === 'mclose') {
        return expr;

    } else if (atom.type === 'error') {
        expr.index += 1;
        expr.ast = { error: atom.latex };
        return expr;
    }


    if (expr.ast === undefined) {
        // Parse either a group of paren, and return their content as the result
        // or a pair of delimiters, and return them as a function applied
        // to their content, i.e. "|x|" -> {fn: "||", arg: "x"}
        const delim = parseDelim(expr, '(', ')', options) || parseDelim(expr, null, null, options);
        if (delim) {
            expr = delim;
        } else if (!isOperator(atom)) {
            // This is not an operator (if it is, it may be an operator
            // dealing with an empty lhs. It's possible.
            // Couldn't interpret the expression. Output an error.
            if (atom.type === 'placeholder') {
                // Default value for a placeholder is 0
                // (except for the denominator of a 'genfrac')
                expr.ast = wrapNum(0);
            } else {
                expr.ast = {text: '?'};
                expr.ast.error = 'Unexpected token ' + "'" + atom.type + "'";
                if (atom.latex) {
                    expr.ast.latex = atom.latex;
                } else if (atom.body && atom.toLatex) {
                    expr.ast.latex = atom.toLatex();
                }
            }
            expr.index += 1;    // Skip the unexpected token, and attempt to continue
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
        expr.ast = {};
        expr = parsePrimary(expr, options);
        if (expr && expr.ast && lhs) {
            if (isFunction(lhs.fn) && 
                typeof lhs.arg === 'undefined' || 
                (Array.isArray(lhs.arg) && lhs.arg.length === 0)) {
                // A function with no arguments followed by a list -> 
                // the list becomes the argument to the function
                if (expr.ast.fn === 'list2' || expr.ast.fn === 'list') {
                    expr.ast = wrapFn(lhs.fn, expr.ast.arg);
                } else {
                    // A function "f(x)" or "√x" followed by something else:
                    // implicit multiply
                    expr.ast = wrapFn('multiply', lhs, expr.ast);
                }
            } else {
                // Invisible times, e.g. '2x'
                if (expr.ast.fn === 'multiply') {
                    expr.ast.arg.unshift(lhs);
                } else if (numberIm(lhs) === 0 && numberRe(lhs) !== 0 && 
                    numberIm(expr.ast) === 1 && numberRe(expr.ast) === 0) {
                    // Imaginary number, i.e. "3i"
                    expr.ast = wrapNum({im: numberRe(lhs).toString()});
                } else {
                    expr.ast = wrapFn('multiply', lhs, expr.ast);
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
 * @param {object} expr An expressions, including expr.atoms, expr.index,
 * expr.minPrec the minimum precedence that this parser should parse
 * before returning; expr.lhs (optional); expr.ast, the resulting AST.
 * @return {object} the expr object, updated
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
        const digraph = parseDigraph(expr);
        done = !atom || atom.mode === 'text' || (!digraph && !isOperator(atom));
        let prec, assoc;
        if (!done) {
            [prec, assoc] = digraph ? 
                [getPrecedence(digraph), getAssociativity(digraph)] : 
                opPrec(atom);
            done = prec < minPrec
        }
        if (!done) {
            const opName = digraph || getCanonicalName(getString(atom));
            if (assoc === 'left') {
                expr.minPrec = prec + 1;
            } else {
                expr.minPrec = prec;
            }
            expr.index += 1;
            if (opName === '|') {
                if (typeof atom.subscript !== 'undefined' || 
                    (expr.atoms[expr.index] && 
                    typeof expr.atoms[expr.index].subscript !== 'undefined' &&
                    expr.atoms[expr.index].type === 'msubsup')
                        ) {
                    // Bind is a special function. It doesn't have a rhs, and 
                    // its argument is a subscript.
                    expr.ast = {};
                    const sub_arg = parseSupsub(expr, options).ast.sub;
                    lhs = wrapFn('bind', lhs);
                    if (sub_arg && sub_arg.fn === 'equal' && lhs.arg) {
                        // This is a subscript of the form "x=..."
                        lhs.arg.push(getArg(sub_arg, 0));
                        lhs.arg.push(getArg(sub_arg, 1));
                    } else if (sub_arg && lhs.arg && (sub_arg.fn === 'list' || sub_arg.fn === 'list2')) {
                        // Form: "x=0;n=3;z=5"
                        let currentSym = {sym: "x"};
                        for (let i = 0; i < sub_arg.arg.length; i++) {
                            if (sub_arg.arg[i].fn === 'equal') {
                                currentSym = getArg(sub_arg.arg[i], 0);
                                lhs.arg.push(currentSym);
                                lhs.arg.push(getArg(sub_arg.arg[i], 1));
                            } else {
                                lhs.arg.push(currentSym);
                                lhs.arg.push(sub_arg.arg[i]);
                            }
                        }
                    } else if (sub_arg) {
                        // Default identifier if none provided
                        lhs.arg.push({sym: "x"});
                        lhs.arg.push(sub_arg);
                    }
                } else {
                    // That was a "|", but not with a subscript after, so 
                    // it's the end of the expression, might be a right fence.
                    done = true;
                }

            } else {
                const rhs = parseExpression(expr, options).ast;

                // Some operators (',' and ';' for example) convert into a function
                // even if there's only two arguments. They're super associative...
                let fn = SUPER_ASSOCIATIVE_FUNCTION[opName];
                if (fn && lhs && lhs.fn !== fn) {
                    // Only promote them if the lhs is not already the same function.
                    // If it is, we'll combine it below.
                    lhs = wrapFn(fn, lhs);
                }

                // Promote subtraction to an addition
                if (opName === '-') {
                    if (lhs && lhs.arg && lhs.fn === 'add') {
                        // add(x,y) - z -> add(x, y, -z)
                        if (rhs !== undefined) lhs.arg.push(negate(rhs));
                    } else if (lhs && lhs.fn === 'subtract') {
                        // x-y - z      -> add(x, -y, -z)
                        lhs = wrapFn('add', getArg(lhs, 0), negate(getArg(lhs, 1)), negate(rhs));
                    } else if (isNumber(lhs) &&  !hasSup(lhs) && 
                        isNumber(rhs) && !hasSup(rhs) && 
                        (typeof rhs.num.re === 'undefined' || rhs.num.re === '0') && 
                        typeof rhs.num.im !== 'undefined') {
                        lhs = {num: {
                            re: lhs.num,
                            im: (-parseFloat(rhs.num.im)).toString()
                        }};
                    } else {
                        lhs = wrapFn('subtract', lhs, rhs);
                    }
                } else {
                    // Is there a function (e.g. 'add') implementing the
                    // associative version of this operator (e.g. '+')?
                    fn = ASSOCIATIVE_FUNCTION[opName];
                    if (fn === 'add' && lhs && lhs.fn === 'subtract') {
                        // subtract(x, y) + z -> add(x, -y, z)
                        lhs = wrapFn('add', getArg(lhs, 0), negate(getArg(lhs, 1)), rhs);
                    } else if (fn && lhs && lhs.fn === fn && !hasSup(lhs)) {
                        // add(x,y) + z -> add(x, y, z)
                        if (typeof rhs !== 'undefined') {
                            if (rhs.fn === fn && !hasSup(rhs) && rhs.arg) {
                                // add(x, y) = add (a, b)
                                lhs.arg = [...lhs.arg, ...rhs.arg];
                            } else if (lhs.arg) {
                                lhs.arg.push(rhs);
                            }
                        }
                    } else if (fn && rhs && rhs.arg && rhs.fn === fn) {
                        // x =    y = z -> equal(x, y, z)
                        rhs.arg.unshift(lhs);
                        lhs = rhs;
                    } else if (fn === 'multiply' && 
                        isNumber(lhs) && !hasSup(lhs) && 
                        rhs && asMachineNumber(rhs) === 10 && isNumber(rhs.sup)){
                        // n * 10^m
                        lhs = wrapNum(asMachineNumber(lhs) * Math.pow(10, asMachineNumber(rhs.sup)));
                    } else if ((fn === 'add') && 
                        isNumber(lhs) && !hasSup(lhs) && 
                        rhs && numberIm(rhs) !== 0 && !hasSup(rhs)) {
                            lhs = {num: {
                                re: lhs.num,
                                im: rhs.num.im
                            }};
                    } else {
                        lhs = wrapFn(fn || OP_NAME[opName] || opName, lhs, rhs);
                    }
                }
            }
        }
    }
    expr.ast = lhs;
    return expr;
}


/**
 * Return a string escaped as necessary to comply with the JSON format
 * @param {string} s
 * @return {string}
 * @private
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
 * @return {object}
 * @method MathAtom#toAST
 * @private
 */
MathAtom.MathAtom.prototype.toAST = function(options) {
    const MATH_VARIANTS = {
        'bb':       'double-struck',
        'cal':      'script',
        'scr':      'script',
        'frak':     'fraktur',
        'cmrss':    'sans-serif',
        'cmrtt':    'monospace'
    };
    // TODO: See https://www.w3.org/TR/MathML2/chapter6.html#chars.letter-like-tables

    let result = {};
    let sym = '';
    let m;
    let lhs, rhs;
    let variant = MATH_VARIANTS[this.baseFontFamily || this.fontFamily];
    let variantSym;

    let style = '';
    if (this.fontSeries === 'b') style += 'bold';
    if (this.fontShape === 'it') style += 'italic';

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

                    if (m[2].length === 1) {
                        rhs = m[2];
                    } else {
                        rhs = m[2].substr(1, m[2].length - 2);
                    }
                    rhs = ParserModule.parseTokens(Lexer.tokenize(rhs),
                        'math', null, options.macros);

                    result = wrapFn('divide', parse(lhs, options), parse(rhs, options));
                } else {
                    result.fn = 'divide';
                }
            } else {
                result.group = parse(this.body, options);
            }
            break;

        case 'genfrac':
            // If there's no denominator, or a placeholder, use "1" as the value
            result = wrapFn('divide', 
                parse(this.numer, options), 
                this.denom && this.denom[0] && this.denom[0].type === 'placeholder' ? 
                    wrapNum(1) : parse(this.denom, options));
            break;

        case 'surd':
            if (this.index) {
                result = wrapFn('pow', 
                    parse(this.body, options), 
                    wrapFn('divide', 1, parse(this.index, options)));
            } else {
                result = wrapFn('sqrt', parse(this.body, options));
            }
            break;

        case 'rule':
            break;

        case 'line':
        case 'overlap':
        case 'accent':
            break;

        case 'overunder':
            break;

        case 'mord':
        case 'textord':
        case 'mbin':
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
            variantSym = escapeText(
                Definitions.mathVariantToUnicode(sym, variant, style)
                );
            if (variantSym !== sym) {
                // If there's a specific Unicode character matching this one
                // no need to record a variant.
                result = {sym: variantSym}; 
                variant = 'normal';
            } else {
                result = {sym: sym}; 
            }
            break;

        // case 'mpunct':
        //     result = '<mo separator="true">' + command + '</mo>';
        //     break;

        case 'minner':
            break;

        case 'mop':
            break;

        case 'box':
            result = parse(this.body, options);
            break;

        case 'enclose':
            // result = '<menclose notation="';
            // for (const notation in this.notation) {
            //     if (Object.prototype.hasOwnProperty.call(this.notation, notation) &&
            //         this.notation[notation]) {
            //         result += sep + notation;
            //         sep = ' ';
            //     }
            // }
            // result += '">' + toAST(this.body).mathML + '</menclose>';
            break;

        case 'array':
            if (this.env.name === 'cardinality') {
                result = wrapFn('card', parse(this.array, options));

            } else if (/array|matrix|pmatrix|bmatrix/.test(this.env.name)) {                
                result = { fn: 'array', args: [] };
                for (const row of this.array) {
                    result.args.push(row.map(cell => parse(cell, options)));
                }

            } else if (this.env.name === 'cases') {
                result = { fn: 'cases', args: [] };
                for (const row of this.array) {
                    if (row[0]) {
                        const statement = [];
                        statement.push(parse(row[0], options));
                        let condition = parse(row[1], options);
                        if (condition) {
                            if (condition.fn === 'text' && condition.arg) {
                                if (/^(if|when|for)$/i.test(condition.arg[0].trim() )) {
                                    condition = condition.arg.filter(
                                        x => typeof x !== 'string')
;
                                }
                            }
                        }

                        statement.push(condition || {});
                        result.args.push(statement);
                    }
                }
            }
            break;

        case 'spacing':
        case 'space':
        case 'mathstyle':
            break;
        default:
            result = undefined;
            console.warn('Unhandled atom "' + this.type + '" in "' + (this.latex || this.body) + '"');
    }

    if (result && variant && variant !== 'normal') {
        result.variant = variant;
    }

    if (result && typeof this.cssClass === 'string') {
        result.class = this.cssClass;
    }
    if (result && typeof this.cssId === 'string') {
        result.id = this.cssId;
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
        } else if (atoms.type === 'first' || atoms.type === 'box') {
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
                atoms.array = atoms.array.map(row => row.map(cell => 
                    filterPresentationAtoms(cell)));
            }
            result = [atoms];
        }
    }
    return result;
}


/**
 * Parse a sequence of text zone and math zones:
 * <sentence> := ((<text>) <expression>)+
 * @param {object} expr 
 * @return  {object}
 * @private
 */
function parseSentence(expr, options) {
    expr.index = expr.index || 0;
    expr.ast = undefined;

    const zones = [];
    // Iterate while we have atoms to look at
    while (expr.atoms[expr.index]) {
        if (expr.atoms[expr.index].mode === 'text') {
            // Text mode atom...
            let text = '';
            while (expr.atoms[expr.index] && expr.atoms[expr.index].mode === 'text') {
                text += expr.atoms[expr.index].body;
                expr.index += 1;
            }
            zones.push(text);
        } else {
            const z = parseExpression(expr, options).ast;
            // Something went wrong in parsing the expression...
            if (!z) return undefined;
            zones.push(z);
        }
    }

    if (zones.length > 1) {
        return wrapFn('text', ...zones);
    }

    return zones[0] || undefined;
}

/**
 * @param {Atoms[]} atoms 
 * @return  {object}
 * @private
 */
function parse(atoms, options) {
    return parseSentence({atoms: filterPresentationAtoms(atoms)}, options);
}


MathAtom.toAST = function(atoms, options) {
    return parse(atoms, options);
}

/**
 *
 * @param {string} fence - The fence to wrap around the arguments
 * @return {string} - A string wrapped in the fence
 * @private
 */
function wrapFence(fence) {
    const args = Array.prototype.slice.call(arguments);
    args.shift();
    fence = fence || '.. ';
    let result = '';
    if (args.length > 0) {
        if (fence[0] !== '.') result += fence[0];
        let sep = '';
        for (const arg of args) {
            result += sep + arg;
            sep = fence[2];
        }
        if (fence[1] !== '.') result += fence[1];
    }

    return result;
}


/**
 * Return a formatted mantissa:
 * 1234567 -> 123 456 7...
 * 1233333 -> 12(3)
 * @param {string} m
 * @param {Object.<string, any>} config
 * @private
 */
function formatMantissa(m, config) {
    const originalLength = m.length;
    // The last digit may have been rounded, if it exceeds the precison,
    // which could throw off the
    // repeating pattern detection. Ignore   it.
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

function parseFloatToPrecision(num) {
    return parseFloat(parseFloat(num).toPrecision(15))
}

 /**
 *
 * @param {string|number} num - A number, represented as a string (e.g. "-12.45"
 *  particularly useful for arbitrary precision numbers) or a number (-12.45)
 * @return {string} A LaTeX representation of the AST
 * @private
 */
function numberAsLatex(num, config) {
    let result = '';

    if (typeof config.precision === 'number') {
        if (typeof num === 'number') {
            num = parseFloatToPrecision(num);
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
                const m = num.match(/(\d*).(\d*)([e|E]([-+]?[0-9]*))?/);
                const base = m[1];
                const mantissa = m[2].substring(0, 
                    Math.min(config.precision - base.length, m[2].length));
                exponent = m[4] || '';

                if (base === '0') {
                    let p = 0;  // Index of the first non-zero digit after the decimal
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
                        if (num.length - 1 > config.precision && !r.endsWith('}') && !r.endsWith('\\ldots')) {
                            r += '\\ldots';
                        }
                        if (p > 4) {
                            r += config.exponentProduct;
                            if (config.exponentMarker) {
                                r += config.exponentMarker + (1 - p).toString();
                            } else {
                                r += '10^{' + (1 - p).toString() + '}';
                            }
                        }
                    }
                    num = r;
                } else {
                    num = base.replace(/\B(?=(\d{3})+(?!\d))/g, config.groupSeparator);
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

            if (exponent) {
                // There is an exponent...
                if (config.exponentMarker) {
                    exponent = config.exponentMarker + exponent;
                } else {
                    exponent = config.exponentProduct + ' 10^{' + exponent + '}';
                }
            }


            return sign + num + exponent;
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
 * @param {object} ast - Abstract Syntax Tree object (in canonical form)
 * @return {string} A LaTeX representation of the AST
 * @private
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
    if (typeof ast === 'string') {
        ast = JSON.parse(ast);
    }

    if (ast.latex) {
        // If ast.latex key is present, use it to render the element
        result = ast.latex;

    } else if (isNumber(ast)) {
        const val = asMachineNumber(ast);
        if (val === -Infinity) {
            result = '-\\infty ';
        } else if (val === Infinity) {
            result = '\\infty ';
        } else if (typeof ast.num === 'object' && (typeof ast.num.re === 'string' || typeof ast.num.im === 'string')) {
            const re = numberRe(ast);
            const im = numberIm(ast);
            if (isNaN(re) || isNaN(im)) {
                result = '\\text{NaN}';
            } else if (Math.abs(im) <= Number.EPSILON && Math.abs(re) <= Number.EPSILON) {
                result = '0';
            } else {
                if (Math.abs(re) > Number.EPSILON) {
                    result = numberAsLatex(re, config);
                }
                if (Math.abs(im) > Number.EPSILON) {
                    if (Math.abs(re) > Number.EPSILON) {
                        result += im > 0 ? '+' : '';
                    }
                    result += (Math.abs(im) !== 1 ?
                        numberAsLatex(im, config) : '') + '\\imaginaryI ';
                }
            }
        } else if (isNaN(val)) {
            result = '\\text{NaN}';
        } else {
            result = numberAsLatex(ast.num, config);
        }
        if (hasSup(ast)) result += '^{' + asLatex(ast.sup, config) + '}';
        if (hasSub(ast)) result += '_{' + asLatex(ast.sub, config) + '}';
    
    } else if (ast.group) {
        result = asLatex(ast.group, config);
        if (!isNumber(ast.group) && !asSymbol(ast.group)) {
            result = wrapFence(ast.fence || '(),', result);
        } else if (numberIm(ast.group) !== 0) {
            result = wrapFence(ast.fence || '(),', result);
        }
        if (hasSup(ast)) result += '^{' + asLatex(ast.sup, config) + '}';
        if (hasSub(ast)) result += '_{' + asLatex(ast.sub, config) + '}';

    } else if (ast.fn) {
        if (ast.fn === 'bind') {
            result = asLatex(getArg(ast, 0), config) + '|_{';
            if (ast.arg && ast.arg.length === 2) {
                result += asLatex(getArg(ast, 1));
            } else {
                let sep = '';
                for (let i = 1; i < ast.arg.length; i += 2) {
                    result += sep + 
                        asLatex(getArg(ast, i)) + 
                        ' = ' + 
                        asLatex(getArg(ast, i + 1));
                    sep = ', ';
                }
            }
            result += '}';

        } else if (ast.fn === 'divide') {
            result = '\\frac{' + asLatex(getArg(ast, 0), config) + '}{' + asLatex(getArg(ast, 1), config) + '}';

        } else if (ast.fn === 'negate') {
            result = '-' + asLatex(getArg(ast, 0), config);

        } else if (ast.fn === 'subtract') {
            result = asLatex(getArg(ast, 0), config) + ' - ' + asLatex(getArg(ast, 1), config);

        } else if ((ast.fn === 'add' || ast.fn === 'multiply') && 
            Array.isArray(ast.arg)) {
            const a = [];
            for (const exp of ast.arg) {
                if (exp.fn === 'add' || exp.fn === 'subtract') {
                    a.push(wrapFence('() ', asLatex(exp, config)));
                } else if (isComplexWithRealAndImaginary(exp)) {
                    // Complex numbers that have both a real and imaginary part
                    // should be wrapped in parentheses
                    a.push(wrapFence('() ', asLatex(exp, config)));
                } else if (hasSup(ast) && !(numberIm(exp) === 0 || numberIm(exp) === 1)) {
                    // Wrap with parentheses if there's an exponent
                    // and the imaginary part is neither 0 nor 1
                    a.push(wrapFence('() ', asLatex(exp, config)));
                } else {
                    a.push(asLatex(exp, config));
                }
            }
            if (ast.fn === 'multiply') {
                if (ast.arg && ast.arg.length === 2 &&
                    (isNumber(ast.arg[0]) || ast.arg[0].fn === 'divide') && 
                    (!isNumber(ast.arg[1]) || (numberRe(ast.arg[1]) === 0 && numberIm(ast.arg[1]) === 1))
                ) {
                    // Invisible times: 
                    // (number or fraction) * not a number
                    // or (number or fraction) * imaginary unit
                    result = a[0] + a[1];
                } else {
                    result = a.join(' \\times ');
                }
            } else {
                // Addition (and subtraction)
                if (ast.arg && ast.arg.length === 1) {
                    if (ast.arg[0].fn === 'negate' ||
                        (isNumber(ast.arg[0]) && asMachineNumber(ast.arg[0]) < 0)) {
                        // a[0] has a negative sign
                        result = a[0];
                    } else {
                        // Single non-negative element, add a '+' in front
                        result = '+' + a[0];
                    }
                } else {
                    result = a[0];
                    for (let i = 1; i < ast.arg.length; i++) {
                        if (ast.arg[i].fn === 'negate' ||
                            (isNumber(ast.arg[i]) && asMachineNumber(ast.arg[i]) < 0)) {
                            // a[i] already has a negative sign, so we can do an 
                            // implicit add
                            result += a[i];
                        } else {
                            result += ' + ' + a[i];
                        }
                    }
                }
            }
        } else if (ast.fn === 'list' || ast.fn === 'list2') {
            const a = [];
            for (const exp of ast.arg) {
                a.push(asLatex(exp, config));
            }

            result = a.join(ast.fn === 'list2' ? '; ' : ', ');
        } else if (ast.fn === 'pow' && Array.isArray(ast.arg) && ast.arg.length >= 2) {
            result = asLatex(getArg(ast, 0), config);
            if (!isNumber(getArg(ast, 0)) && !asSymbol(getArg(ast, 0))) {
                result = wrapFence(ast.fence || '(),', result);
            }

            result += '^{' + asLatex(getArg(ast, 1), config) + '}';
        } else if (ast.fn === 'equal' && ast.arg && ast.arg.length > 2) {
            result = ast.arg.map(x => asLatex(x, config)).join(' = ');

        } else {
            const fn = getLatexTemplateForFunction(ast.fn);
            result = fn;
            let argstring = '';
            const parenRequired = /%(?![01_^])/.test(fn) && Array.isArray(ast.arg) && ast.arg.length > 1;
            if (parenRequired) {
                // Parenthesis are required if argument list is longer than 1
                result += wrapFence(ast.fence || '(),', 
                    ...ast.arg.map(x => asLatex(x, config)));

            } else if (Array.isArray(ast.arg) && ast.arg.length > 0) {
                // The parenthesis may be optional...
                const arg0 = asLatex(getArg(ast, 0), config);
                const arg1 = asLatex(getArg(ast, 1), config);
                const argsn = [...ast.arg];
                if (/%0/.test(fn)) {
                    result = result.replace('%0', arg0);
                    argsn.shift();
                }
                if (/%1/.test(fn)) {
                    result = result.replace('%1', arg1);
                    argsn.shift();
                }

                if (argsn.length > 0) {
                    argstring = wrapFence(ast.fence || '(),', 
                        ...argsn.map(x => asLatex(x, config)));
                }
            } else {
                // Empty argument list
                argstring = wrapFence(ast.fence || '(),', '');
            }

            if (hasSup(ast)) {
                result = result.replace('%^','^{' + asLatex(ast.sup, config) + '}');
            } else {
                result = result.replace('%^','');
            }
            if (hasSub(ast)) {
                result = result.replace('%_','_{' + asLatex(ast.sub, config) + '}');
            } else {
                result = result.replace('%_','');
            }

            // Insert the arguments in the function template (%)
            result = result.replace(/%(?![01_^])/, argstring);
            // If there are any placeholders left, remove them
            result = result.replace('%0', '').replace('%1', '');
        }

    } else if (typeof ast.sym === 'string') {
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
        if (typeof ast.variant === 'string') {
            const MATH_VARIANTS = {
                'normal':           'mathrm',
                'double-struck':    'mathbb',
                'bold':             'mathbf',
                // 'script': 'mathcal',
                'fraktur':          'mathfrak',
                'script':           'mathscr',
                'sans-serif':       'mathsf',
                'monospace':        'mathtt'
            };
            result = '\\' + MATH_VARIANTS[ast.variant] +
                '{' + result + '}';
        }
        if (hasSup(ast)) result += '^{' + asLatex(ast.sup, config) + '}';
        if (hasSub(ast)) result += '_{' + asLatex(ast.sub, config) + '}';

    } else if (typeof ast.text === 'string') {
        result = '\\text{' + ast.text + '}';

    }

    // If there was an error attached to this node,
    // display it on a red background
    if (typeof ast.error === 'string') {
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



