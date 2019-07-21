/**
 * @module editor/virtualKeyboard
 * @private
 */
import MathAtom from '../core/mathAtom.js';
import Span from '../core/span.js';
import Lexer from '../core/lexer.js';
import ParserModule from '../core/parser.js';
import Color from '../core/color.js';
import '../addons/outputLatex.js';
import { l10n } from './l10n.js';

const KEYBOARDS = {
    'numeric': {
        tooltip: 'keyboard.tooltip.numeric',
        layer: 'math',
        label: '123',
        layers: ['math']
    },
    'roman': {
        tooltip: 'keyboard.tooltip.roman',
        layer: 'lower-roman',
        label: 'ABC',
        layers: ['lower-roman', 'upper-roman', 'symbols']
    },
    'greek': {
        tooltip: 'keyboard.tooltip.greek',
        layer: 'lower-greek',
        label: '&alpha;&beta;&gamma;',
        classes: 'tex-math',
        layers: ['lower-greek', 'upper-greek']
    },
    'functions': {
        tooltip: 'keyboard.tooltip.functions',
        layer: 'functions',
        label: '<i>f</i>&thinsp;()',
        classes: 'tex',
        layers: ['functions']
    },
    'command': {
        tooltip: 'keyboard.tooltip.command',
        // For the command keyboard, perform a command rather than
        // doing a simple layer switch, as we want to enter command mode
        // when the keyboard is activated
        command: 'enterCommandMode',
        label: `<svg><use xlink:href='#svg-command' /></svg>`,
        layers: ['lower-command', 'upper-command', 'symbols-command']
    },
    'style': {
        tooltip: 'keyboard.tooltip.style',
        layer: 'style',
        label: '<b>b</b><i>i</i>𝔹',
    }
}

const SHIFTED_KEYS = {
    '\\varphi ': {label: '&Phi;', insert: '\\Phi '},
    '\\varsigma ': {label: '&Sigma;', insert: '\\Sigma '},
    '\\epsilon ': {label: '&#x0190;', insert: '{\\char"0190}'},
    '\\rho ': {label: '&#x3A1', insert: '{\\char"3A1}'},
    '\\tau ': {label: '&#x3A4;', insert: '{\\char"3A4}'},
    '\\upsilon ': {label: '&Upsilon;', insert: '\\Upsilon '},
    '\\theta ': {label: '&Theta;', insert: '\\Theta '},
    '\\iota ': {label: '&Iota;', insert: '{\\char"399}'},
    '\\omicron ': {label: '&#x039F;', insert: '{\\char"39F}'},
    '\\pi ': {label: '&Pi;', insert: '\\Pi '},
    '\\alpha ': {label: '&Alpha;', insert: '{\\char"391}'},
    '\\sigma ': {label: '&Sigma;', insert: '\\Sigma '},
    '\\delta ': {label: '&Delta;', insert: '\\Delta '},
    '\\phi ': {label: '&#x03a6;', insert: '\\Phi '},
    '\\gamma ': {label: '&Gamma;', insert: '\\Gamma '},
    '\\eta ': {label: '&Eta;', insert: '{\\char"397}'},
    '\\xi ': {label: '&Xi;', insert: '\\Xi '},
    '\\kappa ': {label: '&Kappa;', insert: '{\\char"39A}'},
    '\\lambda ': {label: '&Lambda;', insert: '\\Lambda '},
    '\\zeta ': {label: '&Zeta;', insert: '{\\char"396}'},
    '\\chi ': {label: '&Chi;', insert: '{\\char"3A7}'},
    '\\psi ': {label: '&Psi;', insert: '\\Psi '},
    '\\omega ': {label: '&Omega;', insert: '\\Omega '},
    '\\beta ': {label: '&Beta;', insert: '{\\char"392}'},
    '\\nu ': {label: '&Nu;', insert: '{\\char"39D}'},
    '\\mu ': {label: '&Mu;', insert: '{\\char"39C}'}
}

// const FUNCTIONS = [
//     'Basic',
//         ['\\sin', '\\cos', '\\tan', '\\min', '\\max', '\\gcd', '\\lcm', '\\repeat', 'encapsulate', 'recognize'],
//     'Operators',
//         ['\\sum', '\\prod', '\\bigcup_x']
// ]
const ALT_KEYS_BASE = {
    '0': ['\\emptyset', '\\varnothing', '\\infty', {latex: '#?_0', insert: '#@_0'},
            '\\circ', '\\bigcirc', '\\bullet'],
    '2': ['\\frac{1}{2}', {latex: '#?^2', insert: '#@^2' }],
    '3': ['\\frac{1}{3}', {latex: '#?^3', insert: '#@^3' }],
    '.': [
        ',',  ';', '\\colon',  {latex:':', aside:'ratio'},
        {latex:'\\cdotp', aside:'center dot', classes:'box'},
        {latex:'\\cdots', aside:'center ellipsis', classes:'box'},
        {latex:'\\ldotp', aside:'low dot', classes:'box'} ,
        {latex:'\\ldots', aside:'low ellipsis', classes:'box'} ,
        {latex:'\\vdots', aside:'', classes:'box'} ,
        {latex:'\\ddots', aside:'', classes:'box'} ,
        '\\odot', '\\oslash', '\\circledcirc',

    ],

    '*': [
        '\\cdot', '\\ast', '\\star', '\\bigstar',
        '\\ltimes', '\\rtimes', '\\rightthreetimes','\\leftthreetimes',
        '\\intercal', '\\prod', {latex:'\\prod_{n\\mathop=0}^{\\infty}', classes:'small'},
    ],

    '+': [
        '\\pm', '\\mp',
        '\\sum', {latex:'\\sum_{n\\mathop=0}^{\\infty}', classes:'small'},
        '\\dotplus', '\\oplus'
    ],
    '-': [
        '\\pm', '\\mp',
        '\\ominus', '\\vert #0  \\vert'
    ],

    '/': ['\\divideontimes', '/', '\\div'],

    '(':[
        '\\left( #0\\right)', '\\left[ #0\\right]', '\\left\\{ #0\\right\\}', '\\left\\langle #0\\right\\rangle',
        '\\lfloor',    '\\llcorner',    '(',            '\\lbrack',
        '\\lvert',     '\\lVert',       '\\lgroup',     '\\langle',
        '\\lceil',     '\\ulcorner',    '\\lmoustache', '\\lbrace',
    ],

    ')':[
        '\\rfloor',    '\\lrcorner',    ')',            '\\rbrack',
        '\\rvert',     '\\rVert',       '\\rgroup',     '\\rangle',
        '\\rceil',     '\\urcorner',    '\\rmoustache', '\\rbrace',
    ],

    '=': [
        '\\cong',       '\\asymp', '\\equiv',
        '\\differencedelta',    '\\varpropto',
        '\\thickapprox', '\\approxeq', '\\thicksim', '\\backsim', '\\eqsim', '\\simeq',
        '\\Bumpeq', '\\bumpeq', '\\doteq', '\\Doteq',
        '\\fallingdotseq', '\\risingdotseq', '\\coloneq', '\\eqcirc', '\\circeq',
        '\\triangleq', '\\between',
    ],

    '!=': [
        '\\neq', '\\ncong',    '',
        '\\nsim',
    ],

    '<': [
        '\\leq', '\\leqq', '\\lneqq', '\\ll', '\\nless', '\\nleq',
        '\\precsim', '\\lesssim', '\\lessgtr', '\\prec', '\\preccurlyeq', '\\lessdot',
        '\\nprec',
    ],

    '>': [
        '\\geq', '\\geqq', '\\gneqq', '\\gg', '\\ngtr', '\\ngeq',
        '\\succsim', '\\gtrsim', '\\gtrless', '\\succ', '\\succcurlyeq', '\\gtrdot',
        '\\nsucc'
     ],

    'set': [
        '\\in', '\\owns',
        '\\subset', '\\nsubset', '\\supset', '\\nsupset'
    ],

    '!set': [
        '\\notin', '\\backepsilon'
    ],

    'subset': [],
    'supset': [],

    'infinity': ['\\aleph_0', '\\aleph_1', '\\omega', '\\mathfrak{m}'],


    'numeric-pi': ['\\prod', '\\theta', '\\rho',
        '\\sin', '\\cos', '\\tan'
    ],


    'ee': [
            '\\times 10^{#?}',
            '\\ln', '\\ln_{10}', '\\log'
        ],

    '^':  ['_{#?}'],

    // Integrals
    'int': [
            {latex:'\\int_{#?}^{#?}', classes:'small'},
            {latex:'\\int', classes:'small'},
            {latex:'\\smallint', classes:'small'},
            {latex:'\\iint', classes:'small'},
            {latex:'\\iiint', classes:'small'},
            {latex:'\\oint', classes:'small'},
            {latex: '\\dfrac{\\rd}{\\rd x}',  classes:'small'},
            {latex:'\\frac{\\partial}{\\partial x}', classes:'small'},

            '\\capitalDifferentialD', '\\rd',  '\\partial',
    ],

    'nabla': ['\\nabla\\times', '\\nabla\\cdot', '\\nabla^{2}'],

    '!':    ['!!', '\\Gamma', '\\Pi'],
    'accents': ['\\bar{#@}', '\\vec{#@}', '\\hat{#@}', '\\check{#@}',
        '\\dot{#@}', '\\ddot{#@}', '\\mathring{#@}', '\\breve{#@}',
        '\\acute{#@}', '\\tilde{#@}', '\\grave{#@}'],
    // 'absnorm': [{latex:'\\lVert #@ \\rVert', aside:'norm'},
    //     {latex:'\\lvert #@ \\rvert', aside:'determinant'},
    //     {latex:'\\begin{cardinality} #@ \\end{cardinality}', aside:'cardinality'},
    //     {latex:'\\lvert #@ \\rvert', aside:'length'},
    //     {latex:'\\lvert #@ \\rvert', aside:'order'},

    // ],
    'A':        [{latex:'\\aleph', aside:'aleph'},
                {latex:'\\forall', aside:'for all'},
    ],
    'a':        [{latex:'\\aleph', aside:'aleph'},
                {latex:'\\forall', aside:'for all'},
    ],
    'b':        [{latex:'\\beth', aside:'beth'}],
    'B':        [{latex:'\\beth', aside:'beth'}],
    'c':        [{latex:'\\C', aside:'set of complex numbers'}],
    'd':        [{latex:'\\daleth', aside:'daleth'}],
    'D':        [{latex:'\\daleth', aside:'daleth'}],
    'e':        [{latex:'\\exponentialE', aside:'exponential e'},
                {latex:'\\exists', aside:'there is'},
                {latex:'\\nexists', aside:'there isn’t'},
    ],
    'g':        [{latex:'\\gimel', aside:'gimel'}],
    'G':        [{latex:'\\gimel', aside:'gimel'}],
    'h':        [{latex:'\\hbar',  aside:'h bar'},
                    {latex: '\\hslash', aside:'h slash'}
    ],
    'i':        [{latex:'\\imaginaryI', aside:'imaginary i'}],
    'j':        [{latex:'\\imaginaryJ', aside:'imaginary j'}],
    'l':        [{latex:'\\ell', aside:'ell'}],
    'n':        [{latex:'\\N', aside:'set of natural numbers'}],
    'p':        [{latex:'\\P', aside:'set of primes'}],
    'q':        [{latex:'\\Q', aside:'set of rational numbers'}],
    'r':        [{latex:'\\R', aside:'set of real numbers'}],
    'z':        [{latex:'\\Z', aside:'set of integers'}],

    'x-var': ['y', 'z', 't', 'r',
            {latex:'f(#?)', classes:'small'}, {latex:'g(#?)', classes:'small'}, 'x^2', 'x^n',
            'x_n', 'x_{n+1}', 'x_i', 'x_{i+1}'],
    'n-var': ['i', 'j', 'p', 'k', 'a', 'u'],
    'ii': ['\\Re', '\\Im', '\\imaginaryJ', '\\Vert #0 \\Vert'],

    'logic': [
        {latex:'\\exists', aside:'there is'},
        {latex:'\\nexists', aside:'there isn’t'},

        {latex:'\\ni', aside:'such that'},
        {latex:'\\Colon', aside:'such that'},

        {latex:'\\implies', aside:'implies'},
        {latex:'\\impliedby', aside:'implied by'},

        {latex:'\\iff', aside:'if and only if'},


        {latex:'\\land', aside:'and'},
        {latex:'\\lor', aside:'or'},
        {latex:'\\oplus', aside:'xor'},
        {latex:'\\lnot', aside:'not'},

        {latex:'\\downarrow', aside:'nor'},
        {latex:'\\uparrow', aside:'nand'},

        {latex:'\\curlywedge', aside:'nor'},
        {latex:'\\bar\\curlywedge', aside:'nand'},


        // {latex:'\\barwedge', aside:'bar wedge'},
        // {latex:'\\curlyvee', aside:'curly vee'},
        // {latex:'\\veebar', aside:'vee bar'},

        {latex:'\\therefore', aside:'therefore'},
        {latex:'\\because', aside:'because'},

        {latex:'^\\biconditional', aside:'biconditional'},

        '\\leftrightarrow', '\\Leftrightarrow', '\\to',
        '\\models', '\\vdash', '\\gets', '\\dashv',
        '\\roundimplies'],

    'set-operators':
        ['\\cap', '\\cup', '\\setminus', '\\smallsetminus',
        '\\complement'],

    'set-relations': [
        '\\in', '\\notin', '\\ni', '\\owns', '\\subset', '\\supset',
        '\\subseteq', '\\supseteq', '\\subsetneq', '\\supsetneq',
        '\\varsubsetneq', '\\subsetneqq', '\\nsubset', '\\nsupset',
        '\\nsubseteq', '\\nsupseteq'
    ],

    'space': [
        {latex: '\\char"203A\\!\\char"2039', insert: '\\!', aside:'negative thin space<br>⁻³⧸₁₈ em'},
        {latex: '\\unicode{"203A}\\,\\unicode{"2039}', insert: '\\,', aside:'thin space<br>³⧸₁₈ em'},
        {latex: '\\unicode{"203A}\\:\\unicode{"2039}', insert: '\\:', aside:'medium space<br>⁴⧸₁₈ em'},
        {latex: '\\unicode{"203A}\\;\\unicode{"2039}', insert: '\\;', aside:'thick space<br>⁵⧸₁₈ em'},
        {latex: '\\unicode{"203A}\\ \\unicode{"2039}', insert: '\\ ', aside:'⅓ em'},
        {latex: '\\unicode{"203A}\\enspace\\unicode{"2039}', insert: '\\enspace', aside:'½ em'},
        {latex: '\\unicode{"203A}\\quad\\unicode{"2039}', insert: '\\quad', aside:'1 em'},
        {latex: '\\unicode{"203A}\\qquad\\unicode{"2039}', insert: '\\qquad', aside:'2 em'}
    ],

    // @todo could also delete to end
    'delete': [{label: '<span class="warning"><svg><use xlink:href="#svg-trash" /></svg></span>',
                command: '"deleteAll"' }],

    // @todo Tab: could turn on speech, visible keyboard...
    '->|': []

};
let ALT_KEYS = {};

const LAYERS = {
    'math': `
        <div class='rows'>
            <ul>
                <li class='keycap tex' data-alt-keys='x-var'><i>x</i></li>
                <li class='keycap tex' data-alt-keys='n-var'><i>n</i></li>
                <li class='separator w5'></li>
                <row name='numpad-1'/>
                <li class='separator w5'></li>
                <li class='keycap tex' data-key='ee' data-alt-keys='ee'>e</li>
                <li class='keycap tex' data-key='ii' data-alt-keys='ii'>i</li>
                <li class='keycap tex' data-latex='\\pi' data-alt-keys='numeric-pi'></li>
            </ul>
            <ul>
                <li class='keycap tex' data-key='<' data-alt-keys='<'>&lt;</li>
                <li class='keycap tex' data-key='>' data-alt-keys='>'>&gt;</li>
                <li class='separator w5'></li>
                <row name='numpad-2'/>
                <li class='separator w5'></li>
                <li class='keycap tex' data-alt-keys='x2' data-insert='#@^{2}'><span><i>x</i>&thinsp;²</span></li>
                <li class='keycap tex' data-alt-keys='^' data-insert='#@^{#?}'><span><i>x</i><sup>&thinsp;<small>&#x2b1a;</small></sup></span></li>
                <li class='keycap tex' data-alt-keys='sqrt' data-insert='\\sqrt{#0}' data-latex='\\sqrt{#0}'></li>
            </ul>
            <ul>
                <li class='keycap tex' data-alt-keys='(' >(</li>
                <li class='keycap tex' data-alt-keys=')' >)</li>
                <li class='separator w5'></li>
                <row name='numpad-3'/>
                <li class='separator w5'></li>
                <li class='keycap tex small' data-alt-keys='int' data-latex='\\int_0^\\infty'><span></span></li>
                <li class='keycap tex' data-latex='\\forall' data-alt-keys='logic' ></li>
                <li class='action font-glyph bottom right' data-alt-keys='delete' data-command='["performWithFeedback","deletePreviousChar"]'>&#x232b;</li></ul>
            </ul>
            <ul>
                <li class='keycap' data-alt-keys='foreground-color' data-command='["applyStyle",{"color":"#cc2428"}]'><span style='border-radius: 50%;width:22px;height:22px; border: 3px solid #cc2428; box-sizing: border-box'></span></li>
                <li class='keycap' data-alt-keys='background-color' data-command='["applyStyle",{"backgroundColor":"#fff590"}]'><span style='border-radius: 50%;width:22px;height:22px; background:#fff590; box-sizing: border-box'></span></li>
                <li class='separator w5'></li>
                <row name='numpad-4'/>
                <li class='separator w5'></li>
                <arrows/>
            </ul>
        </div>
    `,
    'lower-roman': `
        <div class='rows'>
            <ul>
                <row name='numpad-1' class='if-wide'/>
                <row name='lower-1' shift-layer='upper-roman'/>
            </ul>
            <ul>
                <row name='numpad-2' class='if-wide'/>
                <row name='lower-2'  shift-layer='upper-roman''/>
            </ul>
            <ul>
                <row name='numpad-3' class='if-wide'/>
                <row name='lower-3'  shift-layer='upper-roman''/>
            </ul>
            <ul>
                <row name='numpad-4' class='if-wide'/>
                <li class='layer-switch font-glyph modifier bottom left' data-layer='symbols'>&infin;≠</li>
                <li class='keycap' data-alt-keys=','>,</li>
                <li class='keycap w50' data-key=' ' data-alt-keys='space'>&nbsp;</li>
                <arrows/>
            </ul>
        </div>`,
    'upper-roman': `
        <div class='rows'>
            <ul>
                <row name='numpad-1' class='if-wide'/>
                <row name='upper-1'  shift-layer='lower-roman'/>
            </ul>
            <ul>
                <row name='numpad-2' class='if-wide'/>
                <row name='upper-2' shift-layer='lower-roman'/>
            </ul>
            <ul>
                <row name='numpad-3' class='if-wide'/>
                <row name='upper-3' shift-layer='lower-roman'/>
            </ul>
            <ul>
                <row name='numpad-4' class='if-wide'/>
                <li class='layer-switch font-glyph modifier bottom left' data-layer='symbols'>&infin;≠</li>
                <li class='keycap' data-alt-keys='.'>;</li>
                <li class='keycap w50' data-key=' '>&nbsp;</li>
                <arrows/>
            </ul>
        </div>`,
    'symbols': `
        <div class='rows'>
            <ul>
                <row name='numpad-1' class='if-wide'/>
                <li class='keycap tex' data-alt-keys='(' data-insert='\\lbrace '>{</li>
                <li class='keycap tex' data-alt-keys=')' data-insert='\\rbrace '>}</li>
                <li class='separator w5'></li>
                <li class='keycap tex' data-alt-keys='set' data-insert='\\in '>&#x2208;</li>
                <li class='keycap tex' data-alt-keys='!set' data-insert='\\notin '>&#x2209;</li>
                <li class='keycap tex' data-insert='\\Re '>&#x211c;<aside>Real</aside></li>
                <li class='keycap tex' data-insert='\\Im '>&#x2111;<aside>Imaginary</aside></li>
                <li class='keycap w15' data-insert='\\ulcorner#0\\urcorner '><span><sup>&#x250c;</sup><span><span style='color:#ddd'>o</span><sup>&#x2510;</sup></span><aside>ceil</aside></li>
                <li class='keycap tex' data-alt-keys='nabla' data-insert='\\nabla '>&#x2207;<aside>nabla</aside></li>
                <li class='keycap tex' data-alt-keys='infinity' data-insert='\\infty '>&#x221e;</li>

            </ul>
            <ul>
                <row name='numpad-2' class='if-wide'/>
                <li class='keycap tex' data-alt-keys='(' data-insert='\\lbrack '>[</li>
                <li class='keycap tex' data-alt-keys=')' data-insert='\\rbrack '>]</li>
                <li class='separator w5'></li>
                <li class='keycap tex' data-alt-keys='subset' data-insert='\\subset '>&#x2282;</li>
                <li class='keycap tex' data-alt-keys='supset' data-insert='\\supset '>&#x2283;</li>
                <li class='keycap tex' data-key='!' data-alt-keys='!'>!<aside>factorial</aside></li>
                <li class='keycap' data-insert='^{\\prime} '><span><sup><span><span style='color:#ddd'>o</span>&#x2032</sup></span><aside>prime</aside></li>
                <li class='keycap w15' data-insert='\\llcorner#0\\lrcorner '><span><sub>&#x2514;</sub><span style='color:#ddd'>o</span><sub>&#x2518;</sub></span><aside>floor</aside></li>
                <li class='keycap tex' data-insert='\\partial '>&#x2202;<aside>partial<br>derivative</aside></li>
                <li class='keycap tex' data-insert='\\emptyset '>&#x2205;<aside>empty set</aside></li>

            </ul>
            <ul>
                <row name='numpad-3' class='if-wide'/>
                <li class='keycap tex' data-alt-keys='(' data-insert='\\langle '>&#x27e8;</li>
                <li class='keycap tex' data-alt-keys=')' data-insert='\\rangle '>&#x27e9;</li>
                <li class='separator w5'></li>
                <li class='keycap tex' data-insert='\\subseteq '>&#x2286;</li>
                <li class='keycap tex' data-insert='\\supseteq '>&#x2287;</li>
                <li class='keycap tex' data-alt-keys='accents' data-insert='\\vec{#@}' data-latex='\\vec{#?}' data-aside='vector'></li>
                <li class='keycap tex' data-alt-keys='accents' data-insert='\\bar{#@}' data-latex='\\bar{#?}' data-aside='bar'></li>
                <li class='keycap tex' data-alt-keys='absnorm' data-insert='\\lvert #@ \\rvert ' data-latex='\\lvert #? \\rvert' data-aside='abs'></li>
                <li class='keycap tex' data-insert='\\ast '>&#x2217;<aside>asterisk</aside></li>

                <li class='action font-glyph bottom right w15'
                    data-shifted='<span class="warning"><svg><use xlink:href="#svg-trash" /></svg></span>'
                    data-shifted-command='"deleteAll"'
                    data-alt-keys='delete' data-command='["performWithFeedback","deletePreviousChar"]'
                >&#x232b;</li>
            </ul>
            <ul>
                <row name='numpad-4' class='if-wide'/>
                <li class='layer-switch font-glyph modifier bottom left' data-layer='lower-roman'>abc</li>
                <li class='keycap tex' data-insert='\\cdot '>&#x22c5;<aside>centered dot</aside></li>
                <li class='keycap tex' data-insert='\\colon '>:<aside>colon</aside></li>
                <li class='keycap tex' data-insert='\\circ '>&#x2218;<aside>circle</aside></li>
                <li class='keycap tex' data-insert='\\approx '>&#x2248;<aside>approx.</aside></li>
                <li class='keycap tex' data-insert='\\ne '>&#x2260;</li>
                <li class='keycap tex' data-insert='\\pm '>&#x00b1;</li>
                <arrows/>
            </ul>
        </div>`,
    'lower-greek': `
        <div class='rows'>
            <ul><li class='keycap tex' data-insert='\\varphi '><i>&#x03c6;</i><aside>phi var.</aside></li>
                <li class='keycap tex' data-insert='\\varsigma '><i>&#x03c2;</i><aside>sigma var.</aside></li>
                <li class='keycap tex' data-insert='\\epsilon '><i>&#x03f5;</i></li>
                <li class='keycap tex' data-insert='\\rho '><i>&rho;</i></li>
                <li class='keycap tex' data-insert='\\tau '><i>&tau;</i></li>
                <li class='keycap tex' data-insert='\\upsilon '><i>&upsilon;</i></li>
                <li class='keycap tex' data-insert='\\theta '><i>&theta;</i></li>
                <li class='keycap tex' data-insert='\\iota '><i>&iota;</i></li>
                <li class='keycap tex' data-insert='\\omicron '>&omicron;</i></li>
                <li class='keycap tex' data-insert='\\pi '><i>&pi;</i></li>
            </ul>
            <ul><li class='keycap tex' data-insert='\\alpha ' data-shifted='&Alpha;' data-shifted-command='["insert","{\\\\char\\"391}"]'><i>&alpha;</i></li>
                <li class='keycap tex' data-insert='\\sigma '><i>&sigma;</i></li>
                <li class='keycap tex' data-insert='\\delta '><i>&delta;</i></li>
                <li class='keycap tex' data-insert='\\phi '><i>&#x03d5;</i></i></li>
                <li class='keycap tex' data-insert='\\gamma '><i>&gamma;</i></li>
                <li class='keycap tex' data-insert='\\eta '><i>&eta;</i></li>
                <li class='keycap tex' data-insert='\\xi '><i>&xi;</i></li>
                <li class='keycap tex' data-insert='\\kappa '><i>&kappa;</i></li>
                <li class='keycap tex' data-insert='\\lambda '><i>&lambda;</i></li>
            </ul>
            <ul><li class='shift modifier font-glyph bottom left w15 layer-switch' data-layer='upper-greek'>&#x21e7;</li>
                <li class='keycap tex' data-insert='\\zeta '><i>&zeta;</i></li>
                <li class='keycap tex' data-insert='\\chi '><i>&chi;</i></li>
                <li class='keycap tex' data-insert='\\psi '><i>&psi;</i></li>
                <li class='keycap tex' data-insert='\\omega '><i>&omega;</i></li>
                <li class='keycap tex' data-insert='\\beta '><i>&beta;</i></li>
                <li class='keycap tex' data-insert='\\nu '><i>&nu;</i></li>
                <li class='keycap tex' data-insert='\\mu '><i>&mu;</i></li>
                <li class='action font-glyph bottom right w15'
                    data-shifted='<span class="warning"><svg><use xlink:href="#svg-trash" /></svg></span>'
                    data-shifted-command='"deleteAll"'
                    data-alt-keys='delete' data-command='["performWithFeedback","deletePreviousChar"]'
                >&#x232b;</li>
            </ul>
            <ul>
                <li class='keycap ' data-key=' '>&nbsp;</li>
                <li class='keycap'>,</li>
                <li class='keycap tex' data-insert='\\varepsilon '><i>&#x03b5;</i><aside>epsilon var.</aside></li>
                <li class='keycap tex' data-insert='\\vartheta '><i>&#x03d1;</i><aside>theta var.</aside></li>
                <li class='keycap tex' data-insert='\\varkappa '><i>&#x3f0;</i><aside>kappa var.</aside></li>
                <li class='keycap tex' data-insert='\\varpi '><i>&#x03d6;<aside>pi var.</aside></i></li>
                <li class='keycap tex' data-insert='\\varrho '><i>&#x03f1;</i><aside>rho var.</aside></li>
                <arrows/>
            </ul>
        </div>`,
    'upper-greek': `
        <div class='rows'>
            <ul><li class='keycap tex' data-insert='\\Phi '>&Phi;<aside>phi</aside></li>
                <li class='keycap tex' data-insert='\\Sigma '>&Sigma;<aside>sigma</aside></li>
                <li class='keycap tex' data-insert='{\\char"0190}'>&#x0190;<aside>epsilon</aside></li>
                <li class='keycap tex' data-insert='{\\char"3A1}'>&#x3A1;<aside>rho</aside></li>
                <li class='keycap tex' data-insert='{\\char"3A4}'>&#x3A4;<aside>tau</aside></li>
                <li class='keycap tex' data-insert='\\Upsilon '>&Upsilon;<aside>upsilon</aside></li>
                <li class='keycap tex' data-insert='\\Theta '>&Theta;<aside>theta</aside></li>
                <li class='keycap tex' data-insert='{\\char"399}'>&Iota;<aside>iota</aside></li>
                <li class='keycap tex' data-insert='{\\char"39F}'>&#x039F;<aside>omicron</aside></li>
                <li class='keycap tex' data-insert='\\Pi '>&Pi;<aside>pi</aside></li></ul>
            <ul><li class='keycap tex' data-insert='{\\char"391}'>&#x391;<aside>alpha</aside></li>
                <li class='keycap tex' data-insert='\\Sigma '>&Sigma;<aside>sigma</aside></li>
                <li class='keycap tex' data-insert='\\Delta '>&Delta;<aside>delta</aside></li>
                <li class='keycap tex' data-insert='\\Phi '>&#x03a6;<aside>phi</aside></li>
                <li class='keycap tex' data-insert='\\Gamma '>&Gamma;<aside>gamma</aside></li>
                <li class='keycap tex' data-insert='{\\char"397}'>&Eta;<aside>eta</aside></li>
                <li class='keycap tex' data-insert='\\Xi '>&Xi;<aside>xi</aside></li>
                <li class='keycap tex' data-insert='{\\char"39A}'>&Kappa;<aside>kappa</aside></li>
                <li class='keycap tex' data-insert='\\Lambda '>&Lambda;<aside>lambda</aside></li></ul>
            <ul><li class='shift modifier font-glyph bottom left selected w15 layer-switch' data-layer='lower-greek'>&#x21e7;</li>
                <li class='keycap tex' data-insert='{\\char"396}'>&Zeta;<aside>zeta</aside></li>
                <li class='keycap tex' data-insert='{\\char"3A7}'>&Chi;<aside>chi</aside></li>
                <li class='keycap tex' data-insert='\\Psi '>&Psi;<aside>psi</aside></li>
                <li class='keycap tex' data-insert='\\Omega '>&Omega;<aside>omega</aside></li>
                <li class='keycap tex' data-insert='{\\char"392}'>&Beta;<aside>beta</aside></li>
                <li class='keycap tex' data-insert='{\\char"39D}'>&Nu;<aside>nu</aside></li>
                <li class='keycap tex' data-insert='{\\char"39C}'>&Mu;<aside>mu</aside></li>
                <li class='action font-glyph bottom right w15' data-command='["performWithFeedback","deletePreviousChar"]'>&#x232b;</li></ul>
            <ul>
                <li class='separator w10'>&nbsp;</li>
                <li class='keycap'>.</li>
                <li class='keycap w50' data-key=' '>&nbsp;</li>
                <arrows/>
            </ul>
        </div>`,
    'lower-command': `
        <div class='rows'>
            <ul><row name='lower-1' class='tt' shift-layer='upper-command'/></ul>
            <ul><row name='lower-2' class='tt' shift-layer='upper-command'/></ul>
            <ul><row name='lower-3' class='tt' shift-layer='upper-command'/></ul>
            <ul>
                <li class='layer-switch font-glyph modifier bottom left' data-layer='symbols-command'>01#</li>
                <li class='keycap tt' data-shifted='[' data-shifted-command='["insertAndUnshiftKeyboardLayer", "["]'>{</li>
                <li class='keycap tt' data-shifted=']' data-shifted-command='["insertAndUnshiftKeyboardLayer", "]"]'>}</li>
                <li class='keycap tt' data-shifted='(' data-shifted-command='["insertAndUnshiftKeyboardLayer", "("]'>^</li>
                <li class='keycap tt' data-shifted=')' data-shifted-command='["insertAndUnshiftKeyboardLayer", ")"]'>_</li>
                <li class='keycap w20' data-key=' '>&nbsp;</li>
                <arrows/>
            </ul>
        </div>`,
    'upper-command': `
        <div class='rows'>
            <ul><row name='upper-1' class='tt' shift-layer='lower-command'/></ul>
            <ul><row name='upper-2' class='tt' shift-layer='lower-command'/></ul>
            <ul><row name='upper-3' class='tt' shift-layer='lower-command'/></ul>
            <ul>
                <li class='layer-switch font-glyph modifier bottom left' data-layer='symbols-command'01#</li>
                <li class='keycap tt'>[</li>
                <li class='keycap tt'>]</li>
                <li class='keycap tt'>(</li>
                <li class='keycap tt'>)</li>
                <li class='keycap w20' data-key=' '>&nbsp;</li>
                <arrows/>
            </ul>
        </div>`,
    'symbols-command': `
        <div class='rows'>
            <ul><li class='keycap tt'>1</li><li class='keycap tt'>2</li><li class='keycap tt'>3</li><li class='keycap tt'>4</li><li class='keycap tt'>5</li><li class='keycap tt'>6</li><li class='keycap tt'>7</li><li class='keycap tt'>8</li><li class='keycap tt'>9</li><li class='keycap tt'>0</li></ul>
            <ul><li class='keycap tt'>!</li><li class='keycap tt'>@</li><li class='keycap tt'>#</li><li class='keycap tt'>$</li><li class='keycap tt'>%</li><li class='keycap tt'>^</li><li class='keycap tt'>&</li><li class='keycap tt'>*</li><li class='keycap tt'>+</li><li class='keycap tt'>=</li></ul>
            <ul>
                <li class='keycap tt'>\\</li>
                <li class='keycap tt'>|</li>
                <li class='keycap tt'>/</li>
                <li class='keycap tt'>\`</li>
                <li class='keycap tt'>;</li>
                <li class='keycap tt'>:</li>
                <li class='keycap tt'>?</li>
                <li class='keycap tt'>'</li>
                <li class='keycap tt'>"</li>
                <li class='action font-glyph bottom right'
                    data-shifted='<span class="warning"><svg><use xlink:href="#svg-trash" /></svg></span>'
                    data-shifted-command='"deleteAll"'
                    data-alt-keys='delete' data-command='["performWithFeedback","deletePreviousChar"]'
                >&#x232b;</li>
            </ul>
            <ul>
                <li class='layer-switch font-glyph modifier bottom left' data-layer='lower-command'>abc</li>
                <li class='keycap tt'>&lt;</li>
                <li class='keycap tt'>&gt;</li>
                <li class='keycap tt'>~</li>
                <li class='keycap tt'>,</li>
                <li class='keycap tt'>.</li>
                <li class='keycap' data-key=' '>&nbsp;</li>
                <arrows/>
            </ul>
        </div>`,
    'functions': `
        <div class='rows'>
            <ul><li class='separator'></li>
                <li class='fnbutton' data-insert='\\sin'></li>
                <li class='fnbutton' data-insert='\\sin^{-1}'></li>
                <li class='fnbutton' data-insert='\\ln'></li>
                <li class='fnbutton' data-insert='\\exponentialE^{#?}'></li>
                <li class='bigfnbutton' data-insert='\\operatorname{lcm}(#?)' data-latex='\\operatorname{lcm}()'></li>
                <li class='bigfnbutton' data-insert='\\operatorname{ceil}(#?)' data-latex='\\operatorname{ceil}()'></li>
                <li class='bigfnbutton' data-insert='\\lim_{n\\to\\infty}'></li>
                <li class='bigfnbutton' data-insert='\\int'></li>
                <li class='bigfnbutton' data-insert='\\operatorname{abs}(#?)' data-latex='\\operatorname{abs}()'></li>
            </ul>
            <ul><li class='separator'></li>
                <li class='fnbutton' data-insert='\\cos'></li>
                <li class='fnbutton' data-insert='\\cos^{-1}'></li>
                <li class='fnbutton' data-insert='\\ln_{10}'></li>
                <li class='fnbutton' data-insert='10^{#?}'></li>
                <li class='bigfnbutton' data-insert='\\operatorname{gcd}(#?)' data-latex='\\operatorname{gcd}()'></li>
                <li class='bigfnbutton' data-insert='\\operatorname{floor}(#?)' data-latex='\\operatorname{floor}()'></li>
                <li class='bigfnbutton' data-insert='\\sum_{n\\mathop=0}^{\\infty}'></li>
                <li class='bigfnbutton' data-insert='\\int_{0}^{\\infty}'></li>
                <li class='bigfnbutton' data-insert='\\operatorname{sign}(#?)' data-latex='\\operatorname{sign}()'></li>
            </ul>
            <ul><li class='separator'></li>
                <li class='fnbutton' data-insert='\\tan'></li>
                <li class='fnbutton' data-insert='\\tan^{-1}'></li>
                <li class='fnbutton' data-insert='\\log_{#?}'></li>
                <li class='fnbutton' data-insert='\\sqrt[#?]{#0}'></li>
                <li class='bigfnbutton' data-insert='#0 \\mod' data-latex='\\mod'></li>
                <li class='bigfnbutton' data-insert='\\operatorname{round}(#?) ' data-latex='\\operatorname{round}()'></li>
                <li class='bigfnbutton' data-insert='\\prod_{n\\mathop=0}^{\\infty}' data-latex='{\\tiny \\prod_{n=0}^{\\infty}}'></li>
                <li class='bigfnbutton' data-insert='\\frac{\\differentialD #0}{\\differentialD x}'></li>
                <li class='action font-glyph bottom right' data-command='["performWithFeedback","deletePreviousChar"]'>&#x232b;</li></ul>
            <ul><li class='separator'></li>
                <li class='fnbutton'>(</li>
                <li class='fnbutton'>)</li>
                <li class='fnbutton' data-insert='^{#?} ' data-latex='x^{#?} '></li>
                <li class='fnbutton' data-insert='_{#?} ' data-latex='x_{#?} '></li>
                <li class='keycap w20 ' data-key=' '>&nbsp;</li>
                <arrows/>
            </ul>
        </div>`,
    'style': `
        <div class='rows'>
            <ul>
                <li class='keycap' data-alt-keys='foreground-color' data-command='["applyStyle",{"color":"#cc2428"}]'><span style='border-radius: 50%;width:22px;height:22px; border: 3px solid #cc2428'></span></li>
                <li class='keycap' data-alt-keys='background-color' data-command='["applyStyle",{"backgroundColor":"#fff590"}]'><span style='border-radius: 50%;width:22px;height:22px; background:#fff590'></span></li>
                <li class='separator w5'></li>
                <li class='keycap' data-command='["applyStyle",{"size":"size3"}]' data-latex='\\scriptsize\\text{small}'></li>
                <li class='keycap' data-command='["applyStyle",{"size":"size5"}]' data-latex='\\scriptsize\\text{normal}'></li>
                <li class='keycap' data-command='["applyStyle",{"size":"size9"}]' data-latex='\\huge\\text{big}'></li>
                <li class='separator w5'></li>
                <li class='keycap' data-latex='\\langle' data-command='["insert", "\\\\langle", {"smartFence":true}]'></li>
            </ul>
            <ul>
                <li class='keycap' data-command='["applyStyle",{"series":"l"}]' data-latex='\\fontseries{l}\\text{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"series":"m"}]' data-latex='\\fontseries{m}\\text{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"series":"b"}]' data-latex='\\fontseries{b}\\text{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"series":"bx"}]' data-latex='\\fontseries{bx}\\text{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"series":"sb"}]' data-latex='\\fontseries{sb}\\text{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"series":"c"}]' data-latex='\\fontseries{c}\\text{Ab}'></li>
            </ul>
            <ul>
                <li class='keycap' data-command='["applyStyle",{"shape":"up"}]' data-latex='\\textup{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"shape":"it"}]' data-latex='\\textit{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"shape":"sl"}]' data-latex='\\textsl{Ab}'></li>
                <li class='keycap' data-command='["applyStyle",{"shape":"sc"}]' data-latex='\\textsc{Ab}'></li>
                <li class='separator w5'></li>
                <li class='keycap' data-insert='\\emph{#?} ' data-latex='\\text{\\emph{emph}}'></li>
            </ul>
            <ul>
                <li class='keycap' data-command='["applyStyle",{"fontFamily":"cmr"}]' data-latex='\\textrm{Az}'></li>
                <li class='keycap' data-command='["applyStyle",{"fontFamily":"cmtt"}]' data-latex='\\texttt{Az}'></li>
                <li class='keycap' data-command='["applyStyle",{"fontFamily":"cmss"}]' data-latex='\\textsf{Az}'></li>

                <li class='keycap' data-command='["applyStyle",{"fontFamily":"bb"}]'  data-latex='\\mathbb{AZ}'></li>
                <li class='keycap' data-command='["applyStyle",{"fontFamily":"scr"}]'  data-latex='\\mathscr{AZ}'></li>
                <li class='keycap' data-command='["applyStyle",{"fontFamily":"cal"}]' data-latex='\\mathcal{A1}'></li>
                <li class='keycap' data-command='["applyStyle",{"fontFamily":"frak"}]' data-latex='\\mathfrak{Az}'></li>
            </ul>
        </div>`,
}

function latexToMarkup(latex, arg, mf) {
    // Since we don't have preceding atoms, we'll interpret #@ as a placeholder
    latex = latex.replace(/(^|[^\\])#@/g, '$1#?');

    const parse = ParserModule.parseTokens(Lexer.tokenize(latex), 'math',
        arg, mf.config.macros);
    const spans = MathAtom.decompose({
            mathstyle: 'displaystyle',
            macros: mf.config.macros
        }, parse);

    const base = Span.makeSpan(spans, 'ML__base');

    const topStrut = Span.makeSpan('', 'ML__strut');
    topStrut.setStyle('height', base.height, 'em');
    const bottomStrut = Span.makeSpan('', 'ML__strut--bottom');
    bottomStrut.setStyle('height', base.height + base.depth, 'em');
    bottomStrut.setStyle('vertical-align', -base.depth, 'em');
    const wrapper = Span.makeSpan([topStrut, bottomStrut, base], 'ML__mathlive');

    return wrapper.toMarkup();
}


/**
 * Return a markup string for the keyboard toolbar for the specified layer.
 * @private
 */
function makeKeyboardToolbar(mf, keyboardIDs, currentKeyboard) {
    // The left hand side of the toolbar has a list of all the available keyboards
    let result = "<div class='left'>";
    const keyboardList = keyboardIDs.replace(/\s+/g, ' ').split(' ');
    if (keyboardList.length > 1) {
        const keyboards = Object.assign({}, KEYBOARDS, mf.config.customVirtualKeyboards || {});
        

        for (const keyboard of keyboardList) {
            if (!keyboards[keyboard]) {
                console.error('Unknown virtual keyboard "' + keyboard + '"');
                break;
            }
            result += '<div class=\'';
            if (keyboard === currentKeyboard) {
                result += 'selected ';
            } else {
                if (keyboards[keyboard].command) {
                    result += 'action ';
                } else {
                    result += 'layer-switch ';
                }
            }

            result += (keyboards[keyboard].classes || '') + "'";

            if (keyboards[keyboard].tooltip) {
                result += "data-tooltip='" + l10n(keyboards[keyboard].tooltip) + "' ";
                result += "data-placement='top' data-delay='1s'";
            }

            if (keyboard !== currentKeyboard) {
                if (keyboards[keyboard].command) {
                    result += "data-command='\"" + keyboards[keyboard].command + "\"'";
                }

                if (keyboards[keyboard].layer) {
                    result += "data-layer='" + keyboards[keyboard].layer + "'";
                }

            }
            result += '>' + keyboards[keyboard].label + '</div>';
        }
    }
    result += '</div>';

    // The right hand side of the toolbar, with the copy/undo/redo commands
    result += `
        <div class='right'>
            <div class='action'
                data-command='"copyToClipboard"'
                data-tooltip='${l10n('tooltip.copy to clipboard')}' data-placement='top' data-delay='1s'>
                <svg><use xlink:href='#svg-copy' /></svg>
            </div>
            <div class='action disabled'
                data-command='"undo"'
                data-tooltip='${l10n('tooltip.undo')}' data-placement='top' data-delay='1s'>
                <svg><use xlink:href='#svg-undo' /></svg>
            </div>
            <div class='action disabled'
                data-command='"redo"'
                data-tooltip='${l10n('tooltip.redo')}' data-placement='top' data-delay='1s'>
                <svg><use xlink:href='#svg-redo' /></svg>
            </div>
        </div>
    `;

    return "<div class='keyboard-toolbar' role='toolbar'>" + result + "</div>";
}


function makeKeycap(mf, elList, chainedCommand) {
    for (let i = 0; i < elList.length; ++i) {
        const el = elList[i];
        // Display
        if (el.getAttribute('data-latex')) {
            el.innerHTML = latexToMarkup(el.getAttribute('data-latex').replace(/&quot;/g, '"'),
                    {'?':'{\\color{#555}{\\tiny \\char"2B1A}}'}, mf);
        } else if (el.innerHTML === '' && el.getAttribute('data-insert')) {
            el.innerHTML = latexToMarkup(el.getAttribute('data-insert').replace(/&quot;/g, '"'),
                    {'?':'{\\color{#555}{\\tiny \\char"2B1A}}'}, mf);
        } else if (el.getAttribute('data-content')) {
            el.innerHTML = el.getAttribute('data-content').replace(/&quot;/g, '"');
        }
        if (el.getAttribute('data-aside')) {
            el.innerHTML += '<aside>' + el.getAttribute('data-aside').replace(/&quot;/g, '"') + '</aside>';
        }
        if (el.getAttribute('data-classes')) {
            el.classList.add(el.getAttribute('data-classes'));
        }

        let key = el.getAttribute('data-insert');
        if (key) key = key.replace(/&quot;/g, '"');
        if (key && SHIFTED_KEYS[key]) {
            el.setAttribute('data-shifted', SHIFTED_KEYS[key].label);
            el.setAttribute('data-shifted-command',
                JSON.stringify(['insertAndUnshiftKeyboardLayer', SHIFTED_KEYS[key].insert]));
        }

        // Commands
        let handlers;
        if (el.getAttribute('data-command')) {
            handlers = JSON.parse(el.getAttribute('data-command'));
        } else if (el.getAttribute('data-insert')) {
            handlers = ['insert', el.getAttribute('data-insert'),
                {focus:true, feedback:true, mode:'math', format:'auto', resetStyle:true}];
        } else if (el.getAttribute('data-latex')) {
            handlers = ['insert', el.getAttribute('data-latex'),
                {focus:true, feedback:true, mode:'math', format:'auto', resetStyle:true}];
        } else {
            handlers = ['typedText', el.getAttribute('data-key') || el.textContent,
                {focus:true, feedback:true, simulateKeystroke:true}];
        }
        if (chainedCommand) {
            handlers = [chainedCommand, handlers];
        }
        if (el.getAttribute('data-alt-keys')) {
            const altKeys = ALT_KEYS[el.getAttribute('data-alt-keys')];
            if (altKeys) {
                handlers = {
                    default: handlers,
                    pressAndHoldStart: ['showAlternateKeys', el.getAttribute('data-alt-keys'), altKeys],
                    pressAndHoldEnd: 'hideAlternateKeys'
                }
            } else {
                console.warn('Unknown alt key set: "' + el.getAttribute('data-alt-keys'));
            }
        }

        mf._attachButtonHandlers(el, handlers);

    }
}

/**
 * Expand the shortcut tags (e.g. <row>) inside a layer.
 * @param {object} mf
 * @param {string} layer
 * @private
 */
function expandLayerMarkup(mf, layer) {
    const ROWS = {
        // First row should be 10 key wide
        // Second row should be 10 key wide
        // Third row should be 8.5 key wide
        // One row should have ^ (shift key) which is 1.5 key wide
        // One row should have ~ (delete key) which is .5 or 1.5 key wide
        'qwerty': {
                'lower-1': 'qwertyuiop',
                'lower-2': ' asdfghjkl ',
                'lower-3': '^zxcvbnm~',
                'upper-1': 'QWERTYUIOP',
                'upper-2': ' ASDFGHJKL ',
                'upper-3': '^ZXCVBNM~',
                'numpad-1': '789/',
                'numpad-2': '456*',
                'numpad-3': '123-',
                'numpad-4': '0.=+',
        },
        'azerty': {
                'lower-1': 'azertyuiop',
                'lower-2': 'qsdfghjklm',
                'lower-3': '^ wxcvbn ~',
                'upper-1': 'AZERTYUIOP',
                'upper-2': 'QSDFGHJKLM',
                'upper-3': '^ WXCVBN ~'
        },
        'qwertz': {
                'lower-1': 'qwertzuiop',
                'lower-2': ' asdfghjkl ',
                'lower-3': '^yxcvbnm~',
                'upper-1': 'QWERTZUIOP',
                'upper-2': ' ASDFGHJKL',
                'upper-3': '^YXCVBNM~'
        },
        'dvorak': {
                'lower-1': '^  pyfgcrl ',
                'lower-2': 'aoeuidhtns',
                'lower-3': 'qjkxbmwvz~',
                'upper-1': '^  PYFGCRL ',
                'upper-2': 'AOEUIDHTNS',
                'upper-3': 'QJKXBMWVZ~'
        },
        'colemak': {
                'lower-1': ' qwfpgjluy ',
                'lower-2': 'arstdhneio',
                'lower-3': '^zxcvbkm~',
                'upper-1': ' QWFPGNLUY ',
                'upper-2': 'ARSTDHNEIO',
                'upper-3': '^ZXCVBKM~'
        },


    }
    const layout = ROWS[mf.config.virtualKeyboardLayout] ?
        ROWS[mf.config.virtualKeyboardLayout] : ROWS['qwerty'];

    let result = layer;
    let row;

    result = result.replace(/<arrows\/>/g, `
        <li class='action' data-command='["performWithFeedback","moveToPreviousChar"]'
            data-shifted='<svg><use xlink:href="#svg-angle-double-left" /></svg>'
            data-shifted-command='["performWithFeedback","extendToPreviousChar"]'>
            <svg><use xlink:href='#svg-arrow-left' /></svg>
        </li>
        <li class='action' data-command='["performWithFeedback","moveToNextChar"]'
            data-shifted='<svg><use xlink:href="#svg-angle-double-right" /></svg>'
            data-shifted-command='["performWithFeedback","extendToNextChar"]'>
            <svg><use xlink:href='#svg-arrow-right' /></svg>
        </li>
        <li class='action' data-command='["performWithFeedback","moveToNextPlaceholder"]'>
        <svg><use xlink:href='#svg-tab' /></svg></li>`);


    let m = result.match(/(<row\s+)(.*)((?:<\/row|\/)>)/);
    while (m) {
        row = '';
        const attributesArray = m[2].match(/[a-zA-Z][a-zA-Z0-9-]*=(['"])(.*?)\1/g);
        const attributes = {};
        for (const attribute of attributesArray) {
            const m2 = attribute.match(/([a-zA-Z][a-zA-Z0-9-]*)=(['"])(.*?)\2/);
            attributes[m2[1]] = m2[3];
        }


        let keys = layout[attributes['name']];
        if (!keys) keys = ROWS['qwerty'][attributes['name']];
        if (!keys) {
            console.warn('Unknown roman keyboard row: ' + attributes['name']);
        } else {
            for (const c of keys) {
                let cls = attributes['class'] || '';
                if (cls) cls = ' ' + cls;
                if (c === '~') {
                    row += `<li class='action font-glyph bottom right `;
                    row += keys.length -
                        ((keys.match(/ /g) || []).length / 2) === 10 ? 'w10' : 'w15';
                    row += `' data-shifted='<span class="warning"><svg><use xlink:href="#svg-trash" /></svg></span>'
                        data-shifted-command='"deleteAll"'
                        data-alt-keys='delete' data-command='["performWithFeedback","deletePreviousChar"]'
                        >&#x232b;</li>`;

                } else if (c === ' ') {
                    // Separator
                    row += "<li class='separator w5'></li>";
                } else if (c === '^') {
                    // Shift key
                    row += `<li class='shift modifier font-glyph bottom left w15 layer-switch' data-layer='` +
                        attributes['shift-layer'] + `'>&#x21e7;</li>`;
                } else if (c === '/') {
                    row += "<li class='keycap" + cls + "' data-alt-keys='/' data-insert='\\frac{#0}{#?}'>&divide;</li>";
                } else if (c === '*') {
                    row += "<li class='keycap" + cls + "' data-alt-keys='*' data-insert='\\times '>&times;</li>";
                } else if (c === '-') {
                    row += "<li class='keycap" + cls + "' data-alt-keys='*' data-key='-' data-alt-keys='-'>&#x2212;</li>";
                } else if (/tt/.test(cls)) {
                    row += "<li class='keycap" + cls + "' data-alt-keys='" + c + "'" +
                    ` data-command='["typedText","` + c + `",{"commandMode":true, "focus":true, "feedback":true}]'` +
                    ">" + c + "</li>"
                } else {
                    row += "<li class='keycap" + cls + "' data-alt-keys='" + c + "'>" + c + "</li>"
                }
            }

        }
        result = result.replace(new RegExp(m[1] + m[2] + m[3]), row);

        m = result.match(/(<row\s+)(.*)((?:<\/row|\/)>)/);
    }


    return result;
}

/**
 * Construct a virtual keyboard element based on the config options in the
 * mathfield and an optional theme.
 * @param {object} mf
 * @param {string} theme
 * @result {} A DOM element
 * @private
 */
function make(mf, theme) {
    const svgIcons =
        `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">

            <symbol id="svg-command" viewBox="0 0 640 512">
                <path d="M34.495 36.465l211.051 211.05c4.686 4.686 4.686 12.284 0 16.971L34.495 475.535c-4.686 4.686-12.284 4.686-16.97 0l-7.071-7.07c-4.686-4.686-4.686-12.284 0-16.971L205.947 256 10.454 60.506c-4.686-4.686-4.686-12.284 0-16.971l7.071-7.07c4.686-4.687 12.284-4.687 16.97 0zM640 468v-10c0-6.627-5.373-12-12-12H300c-6.627 0-12 5.373-12 12v10c0 6.627 5.373 12 12 12h328c6.627 0 12-5.373 12-12z"/>
            </symbol>

            <symbol id="svg-undo" viewBox="0 0 512 512">
                <path d="M20 8h10c6.627 0 12 5.373 12 12v110.625C85.196 57.047 165.239 7.715 256.793 8.001 393.18 8.428 504.213 120.009 504 256.396 503.786 393.181 392.834 504 256 504c-63.926 0-122.202-24.187-166.178-63.908-5.113-4.618-5.354-12.561-.482-17.433l7.069-7.069c4.503-4.503 11.749-4.714 16.482-.454C150.782 449.238 200.935 470 256 470c117.744 0 214-95.331 214-214 0-117.744-95.331-214-214-214-82.862 0-154.737 47.077-190.289 116H180c6.627 0 12 5.373 12 12v10c0 6.627-5.373 12-12 12H20c-6.627 0-12-5.373-12-12V20c0-6.627 5.373-12 12-12z"/>
            </symbol>
            <symbol id="svg-redo" viewBox="0 0 512 512">
                <path d="M492 8h-10c-6.627 0-12 5.373-12 12v110.625C426.804 57.047 346.761 7.715 255.207 8.001 118.82 8.428 7.787 120.009 8 256.396 8.214 393.181 119.166 504 256 504c63.926 0 122.202-24.187 166.178-63.908 5.113-4.618 5.354-12.561.482-17.433l-7.069-7.069c-4.503-4.503-11.749-4.714-16.482-.454C361.218 449.238 311.065 470 256 470c-117.744 0-214-95.331-214-214 0-117.744 95.331-214 214-214 82.862 0 154.737 47.077 190.289 116H332c-6.627 0-12 5.373-12 12v10c0 6.627 5.373 12 12 12h160c6.627 0 12-5.373 12-12V20c0-6.627-5.373-12-12-12z"/>
            </symbol>
            <symbol id="svg-arrow-left" viewBox="0 0 192 512">
                <path d="M25.1 247.5l117.8-116c4.7-4.7 12.3-4.7 17 0l7.1 7.1c4.7 4.7 4.7 12.3 0 17L64.7 256l102.2 100.4c4.7 4.7 4.7 12.3 0 17l-7.1 7.1c-4.7 4.7-12.3 4.7-17 0L25 264.5c-4.6-4.7-4.6-12.3.1-17z"/>
            </symbol>
            <symbol id="svg-arrow-right" viewBox="0 0 192 512">
                    <path d="M166.9 264.5l-117.8 116c-4.7 4.7-12.3 4.7-17 0l-7.1-7.1c-4.7-4.7-4.7-12.3 0-17L127.3 256 25.1 155.6c-4.7-4.7-4.7-12.3 0-17l7.1-7.1c4.7-4.7 12.3-4.7 17 0l117.8 116c4.6 4.7 4.6 12.3-.1 17z"/>
            </symbol>
            <symbol id="svg-tab" viewBox="0 0 448 512">
                    <path d="M32 217.1c0-8.8 7.2-16 16-16h144v-93.9c0-7.1 8.6-10.7 13.6-5.7l143.5 143.1c6.3 6.3 6.3 16.4 0 22.7L205.6 410.4c-5 5-13.6 1.5-13.6-5.7v-93.9H48c-8.8 0-16-7.2-16-16v-77.7m-32 0v77.7c0 26.5 21.5 48 48 48h112v61.9c0 35.5 43 53.5 68.2 28.3l143.6-143c18.8-18.8 18.8-49.2 0-68L228.2 78.9c-25.1-25.1-68.2-7.3-68.2 28.3v61.9H48c-26.5 0-48 21.6-48 48zM436 64h-8c-6.6 0-12 5.4-12 12v360c0 6.6 5.4 12 12 12h8c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12z"/>
            </symbol>
            <symbol id="svg-copy" viewBox="0 0 448 512">
                <path d="M433.941 65.941l-51.882-51.882A48 48 0 0 0 348.118 0H176c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h224c26.51 0 48-21.49 48-48v-48h80c26.51 0 48-21.49 48-48V99.882a48 48 0 0 0-14.059-33.941zM352 32.491a15.88 15.88 0 0 1 7.431 4.195l51.882 51.883A15.885 15.885 0 0 1 415.508 96H352V32.491zM288 464c0 8.822-7.178 16-16 16H48c-8.822 0-16-7.178-16-16V144c0-8.822 7.178-16 16-16h80v240c0 26.51 21.49 48 48 48h112v48zm128-96c0 8.822-7.178 16-16 16H176c-8.822 0-16-7.178-16-16V48c0-8.822 7.178-16 16-16h144v72c0 13.2 10.8 24 24 24h72v240z"/>
            </symbol>
            <symbol id="svg-angle-double-right" viewBox="0 0 320 512">
                <path d="M166.9 264.5l-117.8 116c-4.7 4.7-12.3 4.7-17 0l-7.1-7.1c-4.7-4.7-4.7-12.3 0-17L127.3 256 25.1 155.6c-4.7-4.7-4.7-12.3 0-17l7.1-7.1c4.7-4.7 12.3-4.7 17 0l117.8 116c4.6 4.7 4.6 12.3-.1 17zm128-17l-117.8-116c-4.7-4.7-12.3-4.7-17 0l-7.1 7.1c-4.7 4.7-4.7 12.3 0 17L255.3 256 153.1 356.4c-4.7 4.7-4.7 12.3 0 17l7.1 7.1c4.7 4.7 12.3 4.7 17 0l117.8-116c4.6-4.7 4.6-12.3-.1-17z"/>
            </symbol>
            <symbol id="svg-angle-double-left" viewBox="0 0 320 512">
                <path d="M153.1 247.5l117.8-116c4.7-4.7 12.3-4.7 17 0l7.1 7.1c4.7 4.7 4.7 12.3 0 17L192.7 256l102.2 100.4c4.7 4.7 4.7 12.3 0 17l-7.1 7.1c-4.7 4.7-12.3 4.7-17 0L153 264.5c-4.6-4.7-4.6-12.3.1-17zm-128 17l117.8 116c4.7 4.7 12.3 4.7 17 0l7.1-7.1c4.7-4.7 4.7-12.3 0-17L64.7 256l102.2-100.4c4.7-4.7 4.7-12.3 0-17l-7.1-7.1c-4.7-4.7-12.3-4.7-17 0L25 247.5c-4.6 4.7-4.6 12.3.1 17z"/>
            </symbol>
            <symbol id="svg-trash" viewBox="0 0 448 512">
                <path d="M336 64l-33.6-44.8C293.3 7.1 279.1 0 264 0h-80c-15.1 0-29.3 7.1-38.4 19.2L112 64H24C10.7 64 0 74.7 0 88v2c0 3.3 2.7 6 6 6h26v368c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V96h26c3.3 0 6-2.7 6-6v-2c0-13.3-10.7-24-24-24h-88zM184 32h80c5 0 9.8 2.4 12.8 6.4L296 64H152l19.2-25.6c3-4 7.8-6.4 12.8-6.4zm200 432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V96h320v368zm-176-44V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12zm-80 0V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12zm160 0V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12z"/>
            </symbol>
        </svg>
        `;
            // <symbol id="svg-wikipedia" viewBox="0 0 640 512">
            //         <path d="M640 51.2l-.3 12.2c-28.1.8-45 15.8-55.8 40.3-25 57.8-103.3 240-155.3 358.6H415l-81.9-193.1c-32.5 63.6-68.3 130-99.2 193.1-.3.3-15 0-15-.3C172 352.3 122.8 243.4 75.8 133.4 64.4 106.7 26.4 63.4.2 63.7c0-3.1-.3-10-.3-14.2h161.9v13.9c-19.2 1.1-52.8 13.3-43.3 34.2 21.9 49.7 103.6 240.3 125.6 288.6 15-29.7 57.8-109.2 75.3-142.8-13.9-28.3-58.6-133.9-72.8-160-9.7-17.8-36.1-19.4-55.8-19.7V49.8l142.5.3v13.1c-19.4.6-38.1 7.8-29.4 26.1 18.9 40 30.6 68.1 48.1 104.7 5.6-10.8 34.7-69.4 48.1-100.8 8.9-20.6-3.9-28.6-38.6-29.4.3-3.6 0-10.3.3-13.6 44.4-.3 111.1-.3 123.1-.6v13.6c-22.5.8-45.8 12.8-58.1 31.7l-59.2 122.8c6.4 16.1 63.3 142.8 69.2 156.7L559.2 91.8c-8.6-23.1-36.4-28.1-47.2-28.3V49.6l127.8 1.1.2.5z"/>
            // </symbol>
            // <symbol id="svg-link" viewBox="0 0 512 512">
            //         <path d="M301.148 394.702l-79.2 79.19c-50.778 50.799-133.037 50.824-183.84 0-50.799-50.778-50.824-133.037 0-183.84l79.19-79.2a132.833 132.833 0 0 1 3.532-3.403c7.55-7.005 19.795-2.004 20.208 8.286.193 4.807.598 9.607 1.216 14.384.481 3.717-.746 7.447-3.397 10.096-16.48 16.469-75.142 75.128-75.3 75.286-36.738 36.759-36.731 96.188 0 132.94 36.759 36.738 96.188 36.731 132.94 0l79.2-79.2.36-.36c36.301-36.672 36.14-96.07-.37-132.58-8.214-8.214-17.577-14.58-27.585-19.109-4.566-2.066-7.426-6.667-7.134-11.67a62.197 62.197 0 0 1 2.826-15.259c2.103-6.601 9.531-9.961 15.919-7.28 15.073 6.324 29.187 15.62 41.435 27.868 50.688 50.689 50.679 133.17 0 183.851zm-90.296-93.554c12.248 12.248 26.362 21.544 41.435 27.868 6.388 2.68 13.816-.68 15.919-7.28a62.197 62.197 0 0 0 2.826-15.259c.292-5.003-2.569-9.604-7.134-11.67-10.008-4.528-19.371-10.894-27.585-19.109-36.51-36.51-36.671-95.908-.37-132.58l.36-.36 79.2-79.2c36.752-36.731 96.181-36.738 132.94 0 36.731 36.752 36.738 96.181 0 132.94-.157.157-58.819 58.817-75.3 75.286-2.651 2.65-3.878 6.379-3.397 10.096a163.156 163.156 0 0 1 1.216 14.384c.413 10.291 12.659 15.291 20.208 8.286a131.324 131.324 0 0 0 3.532-3.403l79.19-79.2c50.824-50.803 50.799-133.062 0-183.84-50.802-50.824-133.062-50.799-183.84 0l-79.2 79.19c-50.679 50.682-50.688 133.163 0 183.851z"/>
            // </symbol>
            //     <symbol id="svg-external-link" viewBox="0 0 448 512">
            //     <path d="M400 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zm16 400c0 8.822-7.178 16-16 16H48c-8.822 0-16-7.178-16-16V80c0-8.822 7.178-16 16-16h352c8.822 0 16 7.178 16 16v352zM99.515 374.828c-4.686-4.686-4.686-12.284 0-16.971l195.15-195.15-.707-.707-89.958.342c-6.627 0-12-5.373-12-12v-9.999c0-6.628 5.372-12 12-12L340 128c6.627 0 12 5.372 12 12l-.343 136c0 6.627-5.373 12-12 12h-9.999c-6.627 0-12-5.373-12-12l.342-89.958-.707-.707-195.15 195.15c-4.686 4.686-12.284 4.686-16.971 0l-5.657-5.657z"/>
            // </symbol>
            // <symbol id="svg-external-link" viewBox="0 0 512 512">
            //     <path d="M256 40c118.621 0 216 96.075 216 216 0 119.291-96.61 216-216 216-119.244 0-216-96.562-216-216 0-119.203 96.602-216 216-216m0-32C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm-36 344h12V232h-12c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h48c6.627 0 12 5.373 12 12v140h12c6.627 0 12 5.373 12 12v8c0 6.627-5.373 12-12 12h-72c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12zm36-240c-17.673 0-32 14.327-32 32s14.327 32 32 32 32-14.327 32-32-14.327-32-32-32z"/>
            // </symbol>

    let markup = svgIcons;

    // Auto-populate the ALT_KEYS table
    ALT_KEYS_BASE['foreground-color'] = [];
    for (const color of Color.LINE_COLORS) {
        ALT_KEYS_BASE['foreground-color'].push({
            classes: 'small-button',
            content: '<span style="border-radius:50%;width:32px;height:32px; box-sizing: border-box; border: 3px solid ' + color + '"></span>',
            command:'["applyStyle",{"color":"' + color + '"}]'
        });
    }
    ALT_KEYS_BASE['background-color'] = [];
    for (const color of Color.AREA_COLORS) {
        ALT_KEYS_BASE['background-color'].push({
            classes: 'small-button',
            content: '<span style="border-radius:50%;width:32px;height:32px; background:' + color + '"></span>',
            command:'["applyStyle",{"backgroundColor":"' + color + '"}]'
        });
    }

    ALT_KEYS = {...ALT_KEYS_BASE};
    Object.keys(ALT_KEYS).forEach(key => { ALT_KEYS[key] = ALT_KEYS[key].slice() });


    const upperAlpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerAlpha = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    for (let i = 0; i < 26; i++) {
        const key = upperAlpha[i];
        if (!ALT_KEYS[key]) ALT_KEYS[key] = [];
        ALT_KEYS[key].unshift({
                latex: '\\mathbb{' + key + '}',
                aside: 'blackboard',
                insert: '\\mathbb{' + key + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathbf{' + key + '}',
                aside: 'bold',
                insert: '\\mathbf{' + key + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathsf{' + key + '}',
                aside: 'sans',
                insert: '\\mathsf{' + key + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathtt{' + key + '}',
                aside: 'monospace',
                insert: '\\mathtt{' + key + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathcal{' + key + '}',
                aside: 'script',
                insert: '\\mathcal{' + key + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathfrak{' + key + '}',
                aside: 'fraktur',
                insert: '\\mathfrak{' + key + '}'});

        ALT_KEYS[key].unshift({
                latex: '\\mathbb{' + lowerAlpha[i] + '}',
                aside: 'blackboard',
                insert: '\\mathbb{' + lowerAlpha[i] + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathbf{' + lowerAlpha[i] + '}',
                aside: 'bold',
                insert: '\\mathbf{' + lowerAlpha[i] + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathsf{' + lowerAlpha[i] + '}',
                aside: 'sans',
                insert: '\\mathsf{' + lowerAlpha[i] + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathcal{' + lowerAlpha[i] + '}',
                aside: 'script',
                insert: '\\mathcal{' + lowerAlpha[i] + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathfrak{' + lowerAlpha[i] + '}',
                aside: 'fraktur',
                insert: '\\mathfrak{' + lowerAlpha[i] + '}'});
    }
    for (let i = 0; i <= 26; i++) {
        const key = lowerAlpha[i];
        if (!ALT_KEYS[key]) ALT_KEYS[key] = [];
        ALT_KEYS[key].unshift({
                latex: '\\mathsf{' + key + '}',
                aside: 'sans',
                insert: '\\mathbb{' + key + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathbf{' + key + '}',
                aside: 'bold',
                insert: '\\mathbf{' + key + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathtt{' + key + '}',
                aside: 'monospace',
                insert: '\\mathtt{' + key + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathfrak{' + key + '}',
                aside: 'fraktur',
                insert: '\\mathfrak{' + key + '}'});
    }
    for (let i = 0; i < 10; i++) {
        const key = digits[i];
        if (!ALT_KEYS[key]) ALT_KEYS[key] = [];
        // The mathbb font does not appear to include digits,
        // although it's supposed to.
        // ALT_KEYS[key].push({
        //         latex: '\\underset{\\textsf{\\footnotesize blackboard}}{\\mathbb{' + key + '}}',
        //         insert: '\\mathbb{' + key + '}}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathbf{' + key + '}',
                aside: 'bold',
                insert: '\\mathbf{' + key + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathsf{' + key + '}',
                aside: 'sans',
                insert: '\\mathsf{' + key + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathtt{' + key + '}',
                aside: 'monospace',
                insert: '\\mathtt{' + key + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathcal{' + key + '}',
                aside: 'script',
                insert: '\\mathcal{' + key + '}'});
        ALT_KEYS[key].unshift({
                latex: '\\mathfrak{' + key + '}',
                aside: 'fraktur',
                insert: '\\mathfrak{' + key + '}'});
    }




    let keyboardIDs = mf.config.virtualKeyboards;
    if (!keyboardIDs) {
        keyboardIDs = 'all';
    }
    keyboardIDs = keyboardIDs.replace(/\ball\b/i, 
        'numeric roman greek functions command')

    const layers = Object.assign({}, LAYERS, mf.config.customVirtualKeyboardLayers || {});


    const keyboards = Object.assign({}, KEYBOARDS, mf.config.customVirtualKeyboards || {});

    const keyboardList = keyboardIDs.replace(/\s+/g, ' ').split(' ');
    for (const keyboard of keyboardList) {
        if (!keyboards[keyboard]) {
            console.error('Unknown virtual keyboard "' + keyboard + '"');
            break;
        }
        // Add the default layer to the list of layers,
        // and make sure the list of layers is uniquified.
        let keyboardLayers = keyboards[keyboard].layers || [];
        if (keyboards[keyboard].layer) {
            keyboardLayers.push(keyboards[keyboard].layer);
        }
        keyboardLayers = Array.from(new Set(keyboardLayers));

        for (const layer of keyboardLayers) {
            if (!layers[layer]) {
                console.error('Unknown virtual keyboard layer: "' + layer + '"');
                break;
            }

            if (typeof layers[layer] === 'object') {
                // Process JSON layer to web element based layer.

                let tempLayer = ``;
                if (layers[layer].styles) {
                    tempLayer += `<style>${layers[layer].styles}</style>`
                }

                if (layers[layer].backdrop) {
                    tempLayer += `<div class='${layers[layer].backdrop}'>`
                }

                if (layers[layer].container) {
                    tempLayer += `<div class='${layers[layer].container}'>`
                }

                if (layers[layer].rows) {
                    tempLayer += `<div class='rows'>`;
                    for (const row of layers[layer].rows) {
                        tempLayer += `<ul>`;
                        for (const col of row) {
                            tempLayer += `<li`;
                            if (col.class) {
                                tempLayer += ` class="${col.class}"`;
                            }
                            if (col.key) {
                                tempLayer += ` data-key="${col.key}"`;
                            }

                            if (col.command) {
                                if (typeof col.command === 'string') {
                                    tempLayer += ` data-command='"${col.command}"'`;
                                } else {
                                    tempLayer += ` data-command='`;
                                    tempLayer += JSON.stringify(col.command);
                                    tempLayer += `'`;
                                }
                            }
                            if (col.insert) {
                                tempLayer += ` data-insert="${col.insert}"`;
                            }

                            if (col.latex) {
                                tempLayer += ` data-latex="${col.latex}"`;
                            }

                            if (col.aside) {
                                tempLayer += ` data-aside="${col.aside}"`;
                            }

                            if (col.altKeys) {
                                tempLayer += ` data-alt-keys="${col.altKeys}"`;
                            }

                            if (col.shifted) {
                                tempLayer += ` data-shifted="${col.shifted}"`;
                            }

                            if (col.shiftedCommand) {
                                tempLayer += ` data-shifted-command="${col.shiftedCommand}"`;
                            }

                            tempLayer += `>${col.label ? col.label : ''}</li>`;
                        }
                        tempLayer += `</ul>`;
                    }
                    tempLayer += `</div>`;

                    if (layers[layer].container) {
                        tempLayer += `</div'>`
                    }

                    if (layers[layer].backdrop) {
                        tempLayer += `</div'>`
                    }
                }
                layers[layer] = tempLayer;
            }

            markup += `<div tabindex="-1" class='keyboard-layer' id='` + layer + `'>`;
            markup += makeKeyboardToolbar(mf, keyboardIDs, keyboard);
            const layerMarkup = typeof layers[layer] === 'function' ?
                layers[layer]() : layers[layer];
            // A layer can contain 'shortcuts' (i.e. <row> tags) that need to
            // be expanded
            markup += expandLayerMarkup(mf, layerMarkup);
            markup += '</div>';
        }
    }

    const result = document.createElement('div');
    result.className = 'ML__keyboard';
    if (theme) {
        result.classList.add(theme);
    } else if (mf.config.virtualKeyboardTheme) {
        result.classList.add(mf.config.virtualKeyboardTheme);
    } else if (/android|cros/i.test(navigator.userAgent)) {
        result.classList.add('material');
    }
    result.innerHTML = markup;

    // Attach the element handlers
    makeKeycap(mf, result.querySelectorAll('.keycap, .action, .fnbutton, .bigfnbutton'));

    const elList = result.getElementsByClassName('layer-switch');
    for (let i = 0; i < elList.length; ++i) {
        if (elList[i].classList.contains('shift')) {
            // This is a potential press-and-hold layer switch
            mf._attachButtonHandlers(elList[i], {
                // When the modifier is initially pressed, we will shift the labels
                // (if available)
                pressed: ['shiftKeyboardLayer', 'shift'],

                // If the key is released before a delay, we switch to the target layer
                default: ['switchKeyboardLayer', elList[i].getAttribute('data-layer')],

                // If the key is released after a longer delay, we restore the
                // shifted labels
                pressAndHoldEnd: 'unshiftKeyboardLayer',
            });
        } else {
            // This is a simple layer switch
            mf._attachButtonHandlers(elList[i], {
                default: ['switchKeyboardLayer', elList[i].getAttribute('data-layer')]
            });
        }
    }

    // Select the first keyboard as the initial one.
    const layerElements = result.getElementsByClassName('keyboard-layer');
    Array.from(layerElements).forEach(x => {
        x.addEventListener('mousedown', evt => {
            evt.preventDefault();
            evt.stopPropagation();
        });
        x.addEventListener('touchstart', evt => {
            evt.preventDefault();
            evt.stopPropagation();
        });
    });
    layerElements[0].classList.add('is-visible');

    // Listen to know when the mouse has been released without being
    // captured to remove the alternate keys panel and the shifted state of the
    // keyboard.
    window.addEventListener('mouseup', function() {
        mf.hideAlternateKeys_();
        mf.unshiftKeyboardLayer_();
    });
    window.addEventListener('blur', function() {
        mf.hideAlternateKeys_();
        mf.unshiftKeyboardLayer_();
    });
    window.addEventListener('touchend', function() {
        mf.hideAlternateKeys_();
        mf.unshiftKeyboardLayer_();
    });
    window.addEventListener('touchcancel', function() {
        mf.hideAlternateKeys_();
        mf.unshiftKeyboardLayer_();
    });

    return result;
}




export default {
    make,
    makeKeycap
}


