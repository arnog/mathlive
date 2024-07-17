"use strict";
exports.__esModule = true;
exports.LAYOUTS = void 0;
exports.LAYOUTS = {
    'numeric': {
        label: '123',
        labelClass: 'MLK__tex-math',
        tooltip: 'keyboard.tooltip.numeric',
        rows: [
            [
                {
                    latex: 'x',
                    shift: 'y',
                    variants: [
                        'y',
                        'z',
                        't',
                        'r',
                        'x^2',
                        'x^n',
                        'x^{#?}',
                        'x_n',
                        'x_i',
                        'x_{#?}',
                        { latex: 'f(#?)', "class": 'small' },
                        { latex: 'g(#?)', "class": 'small' },
                    ]
                },
                { latex: 'n', shift: 'a', variants: ['i', 'j', 'p', 'k', 'a', 'u'] },
                '[separator-5]',
                '[7]',
                '[8]',
                '[9]',
                '[/]',
                '[separator-5]',
                {
                    latex: '\\exponentialE',
                    shift: '\\ln',
                    variants: ['\\exp', '\\times 10^{#?}', '\\ln', '\\log_{10}', '\\log']
                },
                {
                    latex: '\\imaginaryI',
                    variants: ['\\Re', '\\Im', '\\imaginaryJ', '\\Vert #0 \\Vert']
                },
                {
                    latex: '\\pi',
                    shift: '\\sin',
                    variants: [
                        '\\prod',
                        { latex: '\\theta', aside: 'theta' },
                        { latex: '\\rho', aside: 'rho' },
                        { latex: '\\tau', aside: 'tau' },
                        '\\sin',
                        '\\cos',
                        '\\tan',
                    ]
                },
            ],
            [
                {
                    label: '<',
                    latex: '<',
                    "class": 'hide-shift',
                    shift: { latex: '\\le', label: '≤' }
                },
                {
                    label: '>',
                    latex: '>',
                    "class": 'hide-shift',
                    shift: { latex: '\\ge', label: '≥' }
                },
                '[separator-5]',
                '[4]',
                '[5]',
                '[6]',
                '[*]',
                '[separator-5]',
                {
                    "class": 'hide-shift',
                    latex: '#@^2}',
                    shift: '#@^{\\prime}}'
                },
                {
                    latex: '#@^{#0}}',
                    "class": 'hide-shift',
                    shift: '#@_{#?}'
                },
                {
                    "class": 'hide-shift',
                    latex: '\\sqrt{#0}',
                    shift: { latex: '\\sqrt[#0]{#?}}' }
                },
            ],
            [
                '[(]',
                '[)]',
                '[separator-5]',
                '[1]',
                '[2]',
                '[3]',
                '[-]',
                '[separator-5]',
                {
                    latex: '\\int^{\\infty}_{0}\\!#?\\,\\mathrm{d}x',
                    "class": 'small hide-shift',
                    shift: '\\int',
                    variants: [
                        { latex: '\\int_{#?}^{#?}', "class": 'small' },
                        { latex: '\\int', "class": 'small' },
                        { latex: '\\iint', "class": 'small' },
                        { latex: '\\iiint', "class": 'small' },
                        { latex: '\\oint', "class": 'small' },
                        '\\mathrm{d}x',
                        { latex: '\\dfrac{\\mathrm{d}}{\\mathrm{d} x}', "class": 'small' },
                        { latex: '\\frac{\\partial}{\\partial x}', "class": 'small' },
                        '\\partial',
                    ]
                },
                {
                    "class": 'hide-shift',
                    latex: '\\forall',
                    shift: '\\exists'
                },
                { label: '[backspace]', width: 1.0 },
            ],
            [
                { label: '[shift]', width: 2.0 },
                '[separator-5]',
                '[0]',
                '[.]',
                '[=]',
                '[+]',
                '[separator-5]',
                '[left]',
                '[right]',
                { label: '[action]', width: 1.0 },
            ],
        ]
    },
    'greek': {
        label: '&alpha;&beta;&gamma;',
        labelClass: 'MLK__tex-math',
        tooltip: 'keyboard.tooltip.greek',
        rows: [
            [
                {
                    label: '<i>&#x03c6;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\varphi',
                    aside: 'phi var.',
                    shift: '\\Phi'
                },
                {
                    label: '<i>&#x03c2;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\varsigma',
                    aside: 'sigma var.',
                    shift: '\\Sigma'
                },
                {
                    label: '<i>&#x03f5;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\epsilon',
                    aside: 'epsilon',
                    shift: '\\char"0190'
                },
                {
                    label: '<i>&rho;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\rho',
                    aside: 'rho',
                    shift: '\\char"3A1'
                },
                {
                    label: '<i>&tau;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\tau',
                    aside: 'tau',
                    shift: '\\char"3A4'
                },
                {
                    label: '<i>&upsilon;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\upsilon',
                    aside: 'upsilon',
                    shift: '\\Upsilon'
                },
                {
                    label: '<i>&theta;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\theta',
                    aside: 'theta',
                    shift: '\\Theta'
                },
                {
                    label: '<i>&iota;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\iota',
                    aside: 'iota',
                    shift: '\\char"399'
                },
                {
                    label: '<i>&omicron;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\omicron',
                    aside: 'omicron',
                    shift: '\\char"39F'
                },
                {
                    label: '<i>&pi;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\pi',
                    aside: 'pi',
                    shift: '\\Pi'
                },
            ],
            [
                '[separator-5]',
                {
                    label: '<i>&alpha;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\alpha',
                    aside: 'alpha',
                    shift: '\\char"391'
                },
                {
                    label: '<i>&sigma;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\sigma',
                    aside: 'sigma',
                    shift: '\\Sigma'
                },
                {
                    label: '<i>&delta;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\delta',
                    aside: 'delta',
                    shift: '\\Delta'
                },
                {
                    latex: '\\phi',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\phi',
                    aside: 'phi',
                    shift: '\\Phi'
                },
                {
                    label: '<i>&gamma;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\gamma',
                    aside: 'gamma',
                    shift: '\\Gamma'
                },
                {
                    label: '<i>&eta;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\eta',
                    aside: 'eta',
                    shift: '\\char"397'
                },
                {
                    label: '<i>&xi;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\xi',
                    aside: 'xi',
                    shift: '\\Xi'
                },
                {
                    label: '<i>&kappa;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\kappa',
                    aside: 'kappa',
                    shift: '\\Kappa'
                },
                {
                    label: '<i>&lambda;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\lambda',
                    aside: 'lambda',
                    shift: '\\Lambda'
                },
                '[separator-5]',
            ],
            [
                '[shift]',
                {
                    label: '<i>&zeta;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\zeta',
                    aside: 'zeta',
                    shift: '\\char"396'
                },
                {
                    label: '<i>&chi;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\chi',
                    aside: 'chi',
                    shift: '\\char"3A7'
                },
                {
                    label: '<i>&psi;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\psi',
                    aside: 'zeta',
                    shift: '\\Psi'
                },
                {
                    label: '<i>&omega;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\omega',
                    aside: 'omega',
                    shift: '\\Omega'
                },
                {
                    label: '<i>&beta;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\beta',
                    aside: 'beta',
                    shift: '\\char"392'
                },
                {
                    label: '<i>&nu;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\nu',
                    aside: 'nu',
                    shift: '\\char"39D'
                },
                {
                    label: '<i>&mu;</i>',
                    "class": 'MLK__tex hide-shift',
                    insert: '\\mu',
                    aside: 'mu',
                    shift: '\\char"39C'
                },
                '[backspace]',
            ],
            [
                '[separator]',
                {
                    label: '<i>&#x03b5;</i>',
                    "class": 'MLK__tex',
                    insert: '\\varepsilon',
                    aside: 'epsilon var.'
                },
                {
                    label: '<i>&#x03d1;</i>',
                    "class": 'MLK__tex',
                    insert: '\\vartheta',
                    aside: 'theta var.'
                },
                {
                    label: '<i>&#x3f0;</i>',
                    "class": 'MLK__tex',
                    insert: '\\varkappa',
                    aside: 'kappa var.'
                },
                {
                    label: '<i>&#x03d6;</i>',
                    "class": 'MLK__tex',
                    insert: '\\varpi',
                    aside: 'pi var.'
                },
                {
                    label: '<i>&#x03f1;</i>',
                    "class": 'MLK__tex',
                    insert: '\\varrho',
                    aside: 'rho var.'
                },
                '[left]',
                '[right]',
                '[action]',
            ],
        ]
    },
    'symbols': {
        label: '&infin;≠∈',
        labelClass: 'MLK__tex',
        tooltip: 'keyboard.tooltip.symbols',
        rows: [
            [
                {
                    latex: '\\sin',
                    shift: '\\sin^{-1}',
                    variants: [
                        { "class": 'small', latex: '\\sinh' },
                        { "class": 'small', latex: '\\sin^{-1}' },
                        { "class": 'small', latex: '\\arsinh' },
                    ]
                },
                '\\ln',
                {
                    latex: '\\mathrm{abs}',
                    insert: '\\mathrm{abs}\\left(#0\\right)'
                },
                {
                    latex: '\\rarr',
                    shift: '\\rArr',
                    variants: [
                        { latex: '\\implies', aside: 'implies' },
                        { latex: '\\to', aside: 'to' },
                        '\\dashv',
                        { latex: '\\roundimplies', aside: 'round implies' },
                    ]
                },
                {
                    latex: '\\exists',
                    variants: ['\\nexists'],
                    shift: '\\nexists'
                },
                { latex: '\\in', shift: '\\notin', variants: ['\\notin', '\\owns'] },
                '\\cup',
                {
                    latex: '\\overrightarrow{#@}',
                    shift: '\\overleftarrow{#@}',
                    variants: [
                        '\\overleftarrow{#@}',
                        '\\bar{#@}',
                        '\\vec{#@}',
                        '\\hat{#@}',
                        '\\check{#@}',
                        '\\dot{#@}',
                        '\\ddot{#@}',
                        '\\mathring{#@}',
                        '\\breve{#@}',
                        '\\acute{#@}',
                        '\\tilde{#@}',
                        '\\grave{#@}',
                    ]
                },
                {
                    "class": 'small hide-shift',
                    latex: '\\lim_{#?}',
                    shift: '\\lim_{x\\to\\infty}',
                    variants: [
                        { "class": 'small', latex: '\\liminf_{#?}' },
                        { "class": 'small', latex: '\\limsup_{#?}' },
                    ]
                },
                '\\exponentialE',
            ],
            [
                {
                    latex: '\\cos',
                    shift: '\\cos^{-1}',
                    variants: [
                        { "class": 'small', latex: '\\cosh' },
                        { "class": 'small', latex: '\\cos^{-1}' },
                        { "class": 'small', latex: '\\arcosh' },
                    ]
                },
                {
                    latex: '\\log',
                    shift: '\\log_{10}',
                    variants: ['\\log_{#0}', '\\log_{10}']
                },
                '\\left\\vert#0\\right\\vert',
                {
                    latex: '\\larr',
                    shift: '\\lArr',
                    variants: [
                        { latex: '\\impliedby', aside: 'implied by' },
                        { latex: '\\gets', aside: 'gets' },
                        '\\lArr',
                        '\\vdash',
                        { latex: '\\models', aside: 'models' },
                    ]
                },
                {
                    latex: '\\forall',
                    shift: '\\lnot',
                    variants: [
                        { latex: '\\land', aside: 'and' },
                        { latex: '\\lor', aside: 'or' },
                        { latex: '\\oplus', aside: 'xor' },
                        { latex: '\\lnot', aside: 'not' },
                        { latex: '\\downarrow', aside: 'nor' },
                        { latex: '\\uparrow', aside: 'nand' },
                        { latex: '\\curlywedge', aside: 'nor' },
                        { latex: '\\bar\\curlywedge', aside: 'nand' },
                        // {latex:'\\barwedge', aside:'bar wedge'},
                        // {latex:'\\curlyvee', aside:'curly vee'},
                        // {latex:'\\veebar', aside:'vee bar'},
                    ]
                },
                { latex: '\\ni', shift: '\\not\\owns' },
                '\\cap',
                {
                    latex: '\\overline{#@}',
                    shift: '\\underline{#@}',
                    variants: [
                        '\\overbrace{#@}',
                        '\\overlinesegment{#@}',
                        '\\overleftrightarrow{#@}',
                        '\\overrightarrow{#@}',
                        '\\overleftarrow{#@}',
                        '\\overgroup{#@}',
                        '\\underbrace{#@}',
                        '\\underlinesegment{#@}',
                        '\\underleftrightarrow{#@}',
                        '\\underrightarrow{#@}',
                        '\\underleftarrow{#@}',
                        '\\undergroup{#@}',
                    ]
                },
                {
                    "class": 'hide-shift small',
                    latex: '\\int',
                    shift: '\\iint',
                    variants: [
                        { latex: '\\int_{#?}^{#?}', "class": 'small' },
                        { latex: '\\int', "class": 'small' },
                        { latex: '\\smallint', "class": 'small' },
                        { latex: '\\iint', "class": 'small' },
                        { latex: '\\iiint', "class": 'small' },
                        { latex: '\\oint', "class": 'small' },
                        '\\intop',
                        '\\iiint',
                        '\\oiint',
                        '\\oiiint',
                        '\\intclockwise',
                        '\\varointclockwise',
                        '\\ointctrclockwise',
                        '\\intctrclockwise',
                    ]
                },
                { latex: '\\pi', shift: '\\tau', variants: ['\\tau'] },
            ],
            [
                {
                    latex: '\\tan',
                    shift: '\\tan^{-1}',
                    variants: [
                        { "class": 'small', latex: '\\tanh' },
                        { "class": 'small', latex: '\\tan^{-1}' },
                        { "class": 'small', latex: '\\artanh' },
                        { "class": 'small', latex: '\\arctan' },
                        { "class": 'small', latex: '\\arctg' },
                        { "class": 'small', latex: '\\tg' },
                    ]
                },
                {
                    latex: '\\exp',
                    insert: '\\exp\\left(#0\\right)',
                    variants: ['\\exponentialE^{#0}']
                },
                '\\left\\Vert#0\\right\\Vert',
                {
                    latex: '\\lrArr',
                    shift: '\\leftrightarrow',
                    variants: [
                        { latex: '\\iff', aside: 'if and only if' },
                        '\\leftrightarrow',
                        '\\leftrightarrows',
                        '\\Leftrightarrow',
                        { latex: '^\\biconditional', aside: 'biconditional' },
                    ]
                },
                { latex: '\\vert', shift: '!' },
                {
                    latex: '#@^{\\complement}',
                    aside: 'complement',
                    variants: [
                        { latex: '\\setminus', aside: 'set minus' },
                        { latex: '\\smallsetminus', aside: 'small set minus' },
                    ]
                },
                {
                    latex: '\\subset',
                    shift: '\\subseteq',
                    variants: [
                        '\\subset',
                        '\\subseteq',
                        '\\subsetneq',
                        '\\varsubsetneq',
                        '\\subsetneqq',
                        '\\nsubset',
                        '\\nsubseteq',
                        '\\supset',
                        '\\supseteq',
                        '\\supsetneq',
                        '\\supsetneqq',
                        '\\nsupset',
                        '\\nsupseteq',
                    ]
                },
                {
                    latex: '#@^{\\prime}',
                    shift: '#@^{\\doubleprime}',
                    variants: ['#@^{\\doubleprime}', '#@\\degree']
                },
                {
                    latex: '\\mathrm{d}',
                    shift: '\\partial',
                    variants: [
                        '\\mathrm{d}x',
                        { latex: '\\dfrac{\\mathrm{d}}{\\mathrm{d} x}', "class": 'small' },
                        { latex: '\\frac{\\partial}{\\partial x}', "class": 'small' },
                        '\\partial',
                    ]
                },
                {
                    latex: '\\infty',
                    variants: ['\\aleph_0', '\\aleph_1', '\\omega', '\\mathfrak{m}']
                },
            ],
            [
                { label: '[shift]', width: 2.0 },
                {
                    "class": 'box',
                    latex: ',',
                    shift: ';',
                    variants: [';', '?']
                },
                {
                    "class": 'box',
                    latex: '\\colon',
                    shift: '\\Colon',
                    variants: [
                        { latex: '\\Colon', aside: 'such that', "class": 'box' },
                        { latex: ':', aside: 'ratio', "class": 'box' },
                        { latex: '\\vdots', aside: '', "class": 'box' },
                        { latex: '\\ddots', aside: '', "class": 'box' },
                        { latex: '\\ldotp', aside: 'low dot', "class": 'box' },
                        { latex: '\\cdotp', aside: 'center dot', "class": 'box' },
                        { latex: '\\ldots', aside: 'low ellipsis', "class": 'box' },
                        { latex: '\\cdots', aside: 'center ellipsis', "class": 'box' },
                        { latex: '\\therefore', aside: 'therefore', "class": 'box' },
                        { latex: '\\because', aside: 'because', "class": 'box' },
                    ]
                },
                {
                    "class": 'box',
                    latex: '\\cdot',
                    aside: 'centered dot',
                    shift: '\\ast',
                    variants: [
                        '\\circ',
                        '\\bigcirc',
                        '\\bullet',
                        '\\odot',
                        '\\oslash',
                        '\\circledcirc',
                        '\\ast',
                        '\\star',
                        '\\times',
                        '\\doteq',
                        '\\doteqdot',
                    ]
                },
                '[separator]',
                '[left]',
                '[right]',
                {
                    label: '[backspace]',
                    width: 1.0,
                    "class": 'action hide-shift'
                },
                { label: '[action]', width: 1.0 },
            ],
        ]
    },
    'compact': {
        label: 'compact',
        rows: [
            [
                '[+]',
                '[-]',
                '[*]',
                '[/]',
                '[=]',
                '[.]',
                '[(]',
                '[)]',
                '\\sqrt{#0}',
                '#@^{#?}',
            ],
            ['[1]', '[2]', '[3]', '[4]', '[5]', '[6]', '[7]', '[8]', '[9]', '[0]'],
            ['[hr]'],
            [
                '[undo]',
                '[redo]',
                '[separator]',
                '[separator]',
                '[separator]',
                '[left]',
                '[right]',
                { label: '[backspace]', "class": 'action hide-shift' },
                '[hide-keyboard]',
            ],
        ]
    },
    'minimalist': {
        label: 'minimalist',
        layers: [
            {
                style: "\n          .minimalist-backdrop {\n            display: flex;\n            justify-content: center;\n          }          \n          .minimalist-container {\n            --keycap-height: 40px;\n            --keycap-max-width: 53px;\n            --keycap-small-font-size: 12px;\n            background: var(--keyboard-background);\n            padding: 20px;\n            border-top-left-radius: 8px;\n            border-top-right-radius: 8px;\n            border: 1px solid var(--keyboard-border);\n            box-shadow: 0 0 32px rgb(0 0 0 / 30%);\n          }        \n        ",
                backdrop: 'minimalist-backdrop',
                container: 'minimalist-container',
                rows: [
                    [
                        '+',
                        '-',
                        '\\times',
                        { latex: '\\frac{#@}{#0}', "class": 'small' },
                        '=',
                        '[.]',
                        '(',
                        ')',
                        { latex: '\\sqrt{#0}', "class": 'small' },
                        { latex: '#@^{#?}', "class": 'small' },
                    ],
                    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
                    ['[hr]'],
                    [
                        '[undo]',
                        '[redo]',
                        '[separator]',
                        '[separator]',
                        '[separator]',
                        '[left]',
                        '[right]',
                        { label: '[backspace]', "class": 'action hide-shift' },
                        '[hide-keyboard]',
                    ],
                ]
            },
        ]
    },
    'numeric-only': {
        label: '123',
        labelClass: 'MLK__tex-math',
        tooltip: 'keyboard.tooltip.numeric',
        id: 'numeric-only',
        rows: [
            ['7', '8', '9', '[separator]', { label: '[backspace]', width: 2.0 }],
            ['4', '5', '6', '[separator]', '[separator]', '[separator]'],
            ['1', '2', '3', '[separator]', '[separator]', '[separator]'],
            [
                '0',
                { label: '[.]', variants: [] },
                '-',
                '[separator]',
                '[left]',
                '[right]',
            ],
        ]
    }
};
