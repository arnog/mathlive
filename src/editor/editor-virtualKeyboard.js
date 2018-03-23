define([
    'mathlive/core/definitions', 
    'mathlive/core/mathAtom', 
    'mathlive/core/span', 
    'mathlive/core/lexer', 
    'mathlive/core/parser', 
    'mathlive/editor/editor-keyboard', 
    'mathlive/editor/editor-shortcuts', 
    'mathlive/editor/editor-commands',
    'mathlive/addons/outputLatex'], 
    function(Definitions, MathAtom, Span, Lexer, ParserModule, 
    Keyboard, Shortcuts, Commands, 
// eslint-disable-next-line no-unused-vars
    OutputLatex) {

const KEYBOARDS = {
    'numeric': {
        tooltip: 'Numeric',
        layer: 'math',
        label: '123',
        layers: ['math']
    },
    'latin': {
        tooltip: 'Symbols and Latin Letters',
        layer: 'lower-latin',
        label: 'ABC',
        layers: ['lower-latin', 'upper-latin', 'symbols']
    },
    'greek': {
        tooltip: 'Greek letters',
        layer: 'lower-greek',
        label: '&alpha;&beta;&gamma;',
        classes: 'tex-math',
        layers: ['lower-greek', 'upper-greek']
    },
    'functions': {
        tooltip: 'Functions',
        layer: 'functions',
        label: '<i>f</i>&thinsp;()',
        classes: 'tex',
        layers: ['functions']
    },
    'command': {
        tooltip: 'LaTeX Command Mode',
        // For the command keyboard, perform a command rather than 
        // doing a simple layer switch, as we want to enter command mode
        // when the keyboard is activated
        command: 'enterCommandMode',
        label: `<svg><use xlink:href='#svg-command' /></svg>`,
        layers: ['lower-command', 'upper-command', 'symbols-command']
    }
}

// const FUNCTIONS = [
//     'Basic',
//         ['\\sin', '\\cos', '\\tan', '\\min', '\\max', '\\gcd', '\\lcm', '\\repeat', 'encapsulate', 'recognize'],
//     'Operators',
//         ['\\sum', '\\prod', '\\bigcup_x']
// ]

const LAYERS = {
    'math': `
        <div class='rows'>
            <ul>
                <li class='keycap tex'><i>x</i></li>
                <li class='keycap tex'><i>y</i></li>
                <li class='separator w5'></li>
                <li class='keycap tex'>7</li>
                <li class='keycap tex'>8</li>
                <li class='keycap tex'>9</li>
                <li class='keycap tex' data-insert='\\frac{#0}{#?}'>&divide;</li>
                <li class='separator w5'></li>
                <li class='keycap tex' data-key='ee'>e</li>
                <li class='keycap tex' data-key='ii'>i</li>
                <li class='keycap tex' data-key='pi'>π</li>
            </ul>
            <ul>
                <li class='keycap tex' data-key='<'>&lt;</li>
                <li class='keycap tex' data-key='>'>&gt;</li>
                <li class='separator w5'></li>
                <li class='keycap tex'>4</li>
                <li class='keycap tex'>5</li>
                <li class='keycap tex'>6</li>
                <li class='keycap tex' data-insert='\\times '>&times;</li>
                <li class='separator w5'></li>
                <li class='keycap tex' data-insert='#0^{2}'><span><i>x</i>&thinsp;²</span></li>
                <li class='keycap tex' data-command='"moveToSuperscript"'><span><i>x</i><sup>&thinsp;<small>&#x2b1a;</small></sup></span></li>
                <li class='keycap tex' data-insert='\\sqrt{#0}'><span>√<small style='padding-top: 3px; vertical-align:-2px; border-top:1px solid black'>&#x2b1a;</small></span></li>
            </ul>
            <ul>
                <li class='keycap tex' data-insert='\\le '>&#x2264;</li>
                <li class='keycap tex' data-insert='\\ge '>&#x2265;</li>
                <li class='separator w5'></li>
                <li class='keycap tex'>1</li>
                <li class='keycap tex'>2</li>
                <li class='keycap tex'>3</li>
                <li class='keycap tex' data-key='-'>&#x2212;</li>
                <li class='separator w5'></li>
                <li class='keycap tex' data-insert='|#0|'><span>|<small>&#x2b1a;</small>|</span></li>
                <li class='keycap tex' >,</li>
                <li class='action font-glyph' data-command='"deletePreviousChar"'>&#x232b;</li></ul>
            </ul>
            <ul>
                <li class='keycap tex'>(</li>
                <li class='keycap tex'>)</li>
                <li class='separator w5'></li>
                <li class='keycap tex'>0</li>
                <li class='keycap tex'>.</li>
                <li class='keycap tex'>=</li>
                <li class='keycap tex' data-key='+'>+</li>
                <li class='separator w5'></li>
                <li class='action' data-command='"moveToPreviousChar"'><svg><use xlink:href='#svg-arrow-left' /></svg></li>
                <li class='action' data-command='"moveToNextChar"'><svg><use xlink:href='#svg-arrow-right' /></svg></li>
                <li class='action' data-command='"moveToNextPlaceholder"'><svg><use xlink:href='#svg-tab' /></svg></li>
            </ul>
        </div>
    `,
    'lower-latin': `
        <div class='rows'>
            <ul><li class='keycap'>q</li><li class='keycap'>w</li><li class='keycap'>e</li><li class='keycap'>r</li><li class='keycap'>t</li><li class='keycap'>y</li><li class='keycap'>u</li><li class='keycap'>i</li><li class='keycap'>o</li><li class='keycap'>p</li></ul>
            <ul><li class='keycap'>a</li><li class='keycap'>s</li><li class='keycap'>d</li><li class='keycap'>f</li><li class='keycap'>g</li><li class='keycap'>h</li><li class='keycap'>j</li><li class='keycap'>k</li><li class='keycap'>l</li></ul>
            <ul><li class='modifier font-glyph bottom left w15 layer-switch' data-layer='upper-latin'>&#x21e7;</li><li class='keycap'>z</li><li class='keycap'>x</li><li class='keycap'>c</li><li class='keycap'>v</li><li class='keycap'>b</li><li class='keycap'>n</li><li class='keycap'>m</li>
                <li class='action font-glyph bottom right w15' data-command='"deletePreviousChar"'>&#x232b;</li></ul>
            <ul>
                <li class='layer-switch font-glyph modifier bottom left' data-layer='symbols'>&infin;≠</li>
                <li class='keycap'>,</li>
                <li class='keycap w50' data-key=' '>&nbsp;</li>
                <li class='action' data-command='"moveToPreviousChar"'><svg><use xlink:href='#svg-arrow-left' /></svg></li>
                <li class='action' data-command='"moveToNextChar"'><svg><use xlink:href='#svg-arrow-right' /></svg></li>
                <li class='action' data-command='"moveToNextPlaceholder"'><svg><use xlink:href='#svg-tab' /></svg></li>
            </ul>
        </div>`,
    'upper-latin': `
    <div class='rows'>
        <ul><li class='keycap'>Q</li><li class='keycap'>W</li><li class='keycap'>E</li><li class='keycap'>R</li><li class='keycap'>T</li><li class='keycap'>Y</li><li class='keycap'>U</li><li class='keycap'>I</li><li class='keycap'>O</li><li class='keycap'>P</li></ul>
        <ul><li class='keycap'>A</li><li class='keycap'>S</li><li class='keycap'>D</li><li class='keycap'>F</li><li class='keycap'>G</li><li class='keycap'>H</li><li class='keycap'>J</li><li class='keycap'>K</li><li class='keycap'>L</li></ul>
        <ul><li class='modifier font-glyph selected bottom left w15 layer-switch' data-layer='lower-latin'>&#x21e7;</li><li class='keycap'>Z</li><li class='keycap'>X</li><li class='keycap'>C</li><li class='keycap'>V</li><li class='keycap'>B</li><li class='keycap'>N</li><li class='keycap'>M</li>
            <li class='action font-glyph bottom right w15' data-command='"deletePreviousChar"'>&#x232b;</li></ul>
        <ul>
            <li class='layer-switch font-glyph modifier bottom left' data-layer='symbols'>&infin;≠</li>
            <li class='keycap'>;</li>
            <li class='keycap w50' data-key=' '>&nbsp;</li>
            <li class='action' data-command='"moveToPreviousChar"'><svg><use xlink:href='#svg-arrow-left' /></svg></li>
            <li class='action' data-command='"moveToNextChar"'><svg><use xlink:href='#svg-arrow-right' /></svg></li>
            <li class='action' data-command='"moveToNextPlaceholder"'><svg><use xlink:href='#svg-tab' /></svg></li>
        </ul>
    </div>`,
    'symbols': `
        <div class='rows'>
            <ul>
                <li class='keycap tex' data-insert='\\lbrace '>{</li>
                <li class='keycap tex' data-insert='\\rbrace '>}</li>
                <li class='separator w5'></li>
                <li class='keycap tex' data-insert='\\in '>&#x2208;</li>
                <li class='keycap tex' data-insert='\\notin '>&#x2209;</li>
                <li class='keycap tex' data-insert='\\Re '>&#x211c;<aside>Real</aside></li>
                <li class='keycap tex' data-insert='\\Im '>&#x2111;<aside>Imaginary</aside></li>
                <li class='keycap w15' data-insert='\\ulcorner#0\\urcorner '><span><sup>&#x250c;</sup><span><span style='color:#ddd'>o</span><sup>&#x2510;</sup></span><aside>ceil</aside></li>
                <li class='keycap tex' data-insert='\\nabla '>&#x2207;<aside>nabla</aside></li>
                <li class='keycap tex' data-insert='\\infty '>&#x221e;</li>
                    
            </ul>
            <ul>
                <li class='keycap tex' data-insert='\\lbrack '>[</li>
                <li class='keycap tex' data-insert='\\rbrack '>]</li>
                <li class='separator w5'></li>
                <li class='keycap tex' data-insert='\\subset '>&#x2282;</li>
                <li class='keycap tex' data-insert='\\supset '>&#x2283;</li>
                <li class='keycap tex' data-key='!'>!<aside>factorial</aside></li>
                <li class='keycap' data-insert='^\\prime '><span><sup><span><span style='color:#ddd'>o</span>&#x2032</sup></span><aside>prime</aside></li>
                <li class='keycap w15' data-insert='\\llcorner#0\\lrcorner '><span><sub>&#x2514;</sub><span style='color:#ddd'>o</span><sub>&#x2518;</sub></span><aside>floor</aside></li>
                <li class='keycap tex' data-insert='\\partial '>&#x2202;<aside>partial<br>derivative</aside></li>
                <li class='keycap tex' data-insert='\\emptyset '>&#x2205;<aside>empty set</aside></li>

            </ul>
            <ul>
                <li class='keycap tex' data-insert='\\langle '>&#x27e8;</li>
                <li class='keycap tex' data-insert='\\rangle '>&#x27e9;</li>
                <li class='separator w5'></li>
                <li class='keycap tex' data-insert='\\subseteq '>&#x2286;</li>
                <li class='keycap tex' data-insert='\\supseteq '>&#x2287;</li>
                <li class='keycap tex' data-insert='\\vec{#0}'><span><span style='color:#ddd'>o</span>&#x20d7;</span><aside>vector</aside></li>
                <li class='keycap tex' data-insert='\\bar{#0}'><span><span style='color:#ddd'>o</span>&#x0305;</span><aside>bar</aside></li>
                <li class='keycap tex' data-insert='\\lVert #0 \\rVert '><span>&#x2225;<span style='color:#ddd'>o</span>&#x2225;</span><aside>norm</aside></li>
                <li class='keycap tex' data-insert='\\ast '>&#x2217;<aside>asterisk</aside></li>
                
                <li class='action font-glyph bottom right w15' data-command='"deletePreviousChar"'>&#x232b;</li>
            </ul>
            <ul>
                <li class='layer-switch font-glyph modifier bottom left' data-layer='lower-latin'>abc</li>
                <li class='keycap tex' data-insert='\\cdot '>&#x22c5;<aside>centered dot</aside></li>
                <li class='keycap tex' data-insert='\\colon '>:<aside>colon</aside></li>
                <li class='keycap tex' data-insert='\\circ '>&#x2218;<aside>circle</aside></li>
                <li class='keycap tex' data-insert='\\approx '>&#x2248;<aside>approx.</aside></li>
                <li class='keycap tex' data-insert='\\ne '>&#x2260;</li>
                <li class='keycap tex' data-insert='\\pm '>&#x00b1;</li>
                <li class='action' data-command='"moveToPreviousChar"'><svg><use xlink:href='#svg-arrow-left' /></svg></li>
                <li class='action' data-command='"moveToNextChar"'><svg><use xlink:href='#svg-arrow-right' /></svg></li>
                <li class='action' data-command='"moveToNextPlaceholder"'><svg><use xlink:href='#svg-tab' /></svg></li>
            </ul>
        </div>`,
    'lower-greek': `
        <div class='rows'>
            <ul><li class='keycap tex-math' data-insert='\\varphi '><i>&#x03c6;</i><aside>phi var.</aside></li>
                <li class='keycap tex-math' data-insert='\\varsigma '><i>&#x03c2;</i><aside>sigma var.</aside></li>
                <li class='keycap tex-math' data-insert='\\epsilon '><i>&#x03f5;</i></li>
                <li class='keycap tex-math' data-insert='\\rho '><i>&rho;</i></li>
                <li class='keycap tex-math' data-insert='\\tau '><i>&tau;</i></li>
                <li class='keycap tex-math' data-insert='\\upsilon '><i>&upsilon;</i></li>
                <li class='keycap tex-math' data-insert='\\theta '><i>&theta;</i></li>
                <li class='keycap tex-math' data-insert='\\iota '><i>&iota;</i></li>
                <li class='keycap tex-math' data-insert='\\omicron'>&omicron;</i></li>
                <li class='keycap tex-math' data-insert='\\pi '><i>&pi;</i></li></ul>
            <ul><li class='keycap tex-math' data-insert='\\alpha '><i>&alpha;</i></li>
                <li class='keycap tex-math' data-insert='\\sigma '><i>&sigma;</i></li>
                <li class='keycap tex-math' data-insert='\\delta '><i>&delta;</i></li>
                <li class='keycap tex-math' data-insert='\\phi '><i>&#x03d5;</i></i></li>
                <li class='keycap tex-math' data-insert='\\gamma '><i>&gamma;</i></li>
                <li class='keycap tex-math' data-insert='\\eta '><i>&eta;</i></li>
                <li class='keycap tex-math' data-insert='\\xi '><i>&xi;</i></li>
                <li class='keycap tex-math' data-insert='\\kappa '><i>&kappa;</i></li>
                <li class='keycap tex-math' data-insert='\\lambda '><i>&lambda;</i></li></ul>
            <ul><li class='modifier font-glyph bottom left w15 layer-switch' data-layer='upper-greek'>&#x21e7;</li>
                <li class='keycap tex-math' data-insert='\\zeta '><i>&zeta;</i></li>
                <li class='keycap tex-math' data-insert='\\chi '><i>&chi;</i></li>
                <li class='keycap tex-math' data-insert='\\psi '><i>&psi;</i></li>
                <li class='keycap tex-math' data-insert='\\omega '><i>&omega;</i></li>
                <li class='keycap tex-math' data-insert='\\beta '><i>&beta;</i></li>
                <li class='keycap tex-math' data-insert='\\nu '><i>&nu;</i></li>
                <li class='keycap tex-math' data-insert='\\mu '><i>&mu;</i></li>
            <li class='action font-glyph bottom right w15' data-command='"deletePreviousChar"'>&#x232b;</li></ul>
            <ul>
                <li class='keycap ' data-key=' '>&nbsp;</li>
                <li class='keycap'>,</li>
                <li class='keycap tex-math' data-insert='\\varepsilon '><i>&#x03b5;</i><aside>epsilon var.</aside></li>
                <li class='keycap tex-math' data-insert='\\vartheta '><i>&#x03d1;</i><aside>theta var.</aside></li>
                <li class='keycap tex-math' data-insert='\\varkappa '><i>&#x3f0;</i><aside>kappa var.</aside></li>
                <li class='keycap tex-math' data-insert='\\varpi '><i>&#x03d6;<aside>pi var.</aside></i></li>
                <li class='keycap tex-math' data-insert='\\varrho '><i>&#x03f1;</i><aside>rho var.</aside></li>
                <li class='action' data-command='"moveToPreviousChar"'><svg><use xlink:href='#svg-arrow-left' /></svg></li>
                <li class='action' data-command='"moveToNextChar"'><svg><use xlink:href='#svg-arrow-right' /></svg></li>
                <li class='action' data-command='"moveToNextPlaceholder"'><svg><use xlink:href='#svg-tab' /></svg></li>
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
            <ul><li class='modifier font-glyph bottom left selected w15 layer-switch' data-layer='lower-greek'>&#x21e7;</li>
                <li class='keycap tex' data-insert='{\\char"396}'>&Zeta;<aside>zeta</aside></li>
                <li class='keycap tex' data-insert='{\\char"3A7}'>&Chi;<aside>chi</aside></li>
                <li class='keycap tex' data-insert='\\Psi '>&Psi;<aside>psi</aside></li>
                <li class='keycap tex' data-insert='\\Omega '>&Omega;<aside>omega</aside></li>
                <li class='keycap tex' data-insert='{\\char"392}'>&Beta;<aside>beta</aside></li>
                <li class='keycap tex' data-insert='{\\char"39D}'>&Nu;<aside>nu</aside></li>
                <li class='keycap tex' data-insert='{\\char"39C}'>&Mu;<aside>mu</aside></li>
                <li class='action font-glyph bottom right w15' data-command='"deletePreviousChar"'>&#x232b;</li></ul>
            <ul>
                <li class='separator w10'>&nbsp;</li>
                <li class='keycap'>.</li>
                <li class='keycap w50' data-key=' '>&nbsp;</li>
                <li class='action' data-command='"moveToPreviousChar"'><svg><use xlink:href='#svg-arrow-left' /></svg></li>
                <li class='action' data-command='"moveToNextChar"'><svg><use xlink:href='#svg-arrow-right' /></svg></li>
                <li class='action' data-command='"moveToNextPlaceholder"'><svg><use xlink:href='#svg-tab' /></svg></li>
            </ul>
        </div>`,
    'lower-command': `
        <div class='rows'>
            <ul><li class='keycap tt'>q</li><li class='keycap tt'>w</li><li class='keycap tt'>e</li><li class='keycap tt'>r</li><li class='keycap tt'>t</li><li class='keycap tt'>y</li><li class='keycap tt'>u</li><li class='keycap tt'>i</li><li class='keycap tt'>o</li><li class='keycap tt'>p</li></ul>
            <ul><li class='keycap tt'>a</li><li class='keycap tt'>s</li><li class='keycap tt'>d</li><li class='keycap tt'>f</li><li class='keycap tt'>g</li><li class='keycap tt'>h</li><li class='keycap tt'>j</li><li class='keycap tt'>k</li><li class='keycap tt'>l</li></ul>
            <ul><li class='modifier font-glyph bottom left w15 layer-switch' data-layer='upper-command'>&#x21e7;</li><li class='keycap tt'>z</li><li class='keycap tt'>x</li><li class='keycap tt'>c</li><li class='keycap tt'>v</li><li class='keycap tt'>b</li><li class='keycap tt'>n</li><li class='keycap tt'>m</li>
                <li class='action font-glyph bottom right w15' data-command='"deletePreviousChar"'>&#x232b;</li></ul>
            <ul>
                <li class='layer-switch font-glyph modifier bottom left' data-layer='symbols-command'>01#</li>
                <li class='keycap tt'>{</li>
                <li class='keycap tt'>}</li>
                <li class='keycap tt'>^</li>
                <li class='keycap tt'>_</li>
                <li class='keycap w20' data-key=' '>&nbsp;</li>
                <li class='action' data-command='"moveToPreviousChar"'><svg><use xlink:href='#svg-arrow-left' /></svg></li>
                <li class='action' data-command='"moveToNextChar"'><svg><use xlink:href='#svg-arrow-right' /></svg></li>
                <li class='action' data-command='"complete"'><svg><use xlink:href='#svg-tab' /></svg></li>
            </ul>
        </div>`,
        'upper-command': `
            <div class='rows'>
                <ul><li class='keycap tt'>Q</li><li class='keycap tt'>W</li><li class='keycap tt'>E</li><li class='keycap tt'>R</li><li class='keycap tt'>T</li><li class='keycap tt'>Y</li><li class='keycap tt'>U</li><li class='keycap tt'>I</li><li class='keycap tt'>O</li><li class='keycap tt'>P</li></ul>
                <ul><li class='keycap tt'>A</li><li class='keycap tt'>S</li><li class='keycap tt'>D</li><li class='keycap tt'>F</li><li class='keycap tt'>G</li><li class='keycap tt'>H</li><li class='keycap tt'>J</li><li class='keycap tt'>K</li><li class='keycap tt'>L</li></ul>
                <ul><li class='modifier font-glyph selected bottom left w15 layer-switch' data-layer='lower-command'>&#x21e7;</li><li class='keycap tt'>Z</li><li class='keycap tt'>X</li><li class='keycap tt'>C</li><li class='keycap tt'>V</li><li class='keycap tt'>B</li><li class='keycap tt'>N</li><li class='keycap tt'>M</li>
                    <li class='action font-glyph bottom right w15' data-command='"deletePreviousChar"'>&#x232b;</li></ul>
                <ul>
                    <li class='layer-switch font-glyph modifier bottom left' data-layer='symbols-command'01#</li>
                    <li class='keycap tt'>[</li>
                    <li class='keycap tt'>]</li>
                    <li class='keycap tt'>(</li>
                    <li class='keycap tt'>)</li>
                    <li class='keycap w20' data-key=' '>&nbsp;</li>
                    <li class='action' data-command='"moveToPreviousChar"'><svg><use xlink:href='#svg-arrow-left' /></svg></li>
                    <li class='action' data-command='"moveToNextChar"'><svg><use xlink:href='#svg-arrow-right' /></svg></li>
                    <li class='action' data-command='"complete"'><svg><use xlink:href='#svg-tab' /></svg></li>
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
                    <li class='action font-glyph bottom right' data-command='"deletePreviousChar"'>&#x232b;</li></ul>
                <ul>
                    <li class='layer-switch font-glyph modifier bottom left' data-layer='lower-command'>abc</li>
                    <li class='keycap tt'>&lt;</li>
                    <li class='keycap tt'>&gt;</li>
                    <li class='keycap tt'>~</li>
                    <li class='keycap tt'>,</li>
                    <li class='keycap tt'>.</li>
                    <li class='keycap' data-key=' '>&nbsp;</li>
                    <li class='action' data-command='"moveToPreviousChar"'><svg><use xlink:href='#svg-arrow-left' /></svg></li>
                    <li class='action' data-command='"moveToNextChar"'><svg><use xlink:href='#svg-arrow-right' /></svg></li>
                    <li class='action' data-command='"complete"'><svg><use xlink:href='#svg-tab' /></svg></li>
                </ul>
            </div>`,
        'functions': `
            <div class='rows'>
                <ul><li class='fnbutton' data-insert='\\sin'></li>
                    <li class='fnbutton' data-insert='\\sin^{-1}'></li>
                    <li class='fnbutton' data-insert='\\ln'></li>
                    <li class='fnbutton' data-insert='\\exponentialE^{#?}'></li>
                    <li class='bigfnbutton' data-insert='\\mathrm{lcm}(#?)' data-latex='\\mathrm{lcm}()'></li>
                    <li class='bigfnbutton' data-insert='\\mathrm{ceil}(#?)' data-latex='\\mathrm{ceil}()'></li>
                    <li class='bigfnbutton' data-insert='\\lim_{n\\to\\infty}'></li>
                    <li class='bigfnbutton' data-insert='\\int'></li>
                    <li class='bigfnbutton' data-insert='\\mathrm{abs}(#?)' data-latex='\\mathrm{abs}()'></li>
                </ul>
                <ul><li class='fnbutton' data-insert='\\cos'></li>
                    <li class='fnbutton' data-insert='\\cos^{-1}'></li>
                    <li class='fnbutton' data-insert='\\ln_{10}'></li>
                    <li class='fnbutton' data-insert='10^{#?}'></li>
                    <li class='bigfnbutton' data-insert='\\mathrm{gcd}(#?)' data-latex='\\mathrm{gcd}()'></li>
                    <li class='bigfnbutton' data-insert='\\mathrm{floor}(#?)' data-latex='\\mathrm{floor}()'></li>
                    <li class='bigfnbutton' data-insert='\\sum_{n=0}^{\\infty}'></li>
                    <li class='bigfnbutton' data-insert='\\int_{0}^{\\infty}'></li>
                    <li class='bigfnbutton' data-insert='\\mathrm{sign}(#?)' data-latex='\\mathrm{sign}()'></li>
                </ul>
                <ul><li class='fnbutton' data-insert='\\tan'></li>
                    <li class='fnbutton' data-insert='\\tan^{-1}'></li>
                    <li class='fnbutton' data-insert='\\log_{#?}'></li>
                    <li class='fnbutton' data-insert='\\sqrt[#?]{#0}'></li>
                    <li class='bigfnbutton' data-insert='#0 \\mod' data-latex='\\mod'></li>
                    <li class='bigfnbutton' data-insert='\\mathrm{round}(#?) ' data-latex='\\mathrm{round}()'></li>
                    <li class='bigfnbutton' data-insert='\\prod_{n=0}^{\\infty}' data-latex='{\\tiny \\prod_{n=0}^{\\infty}}'></li>
                    <li class='bigfnbutton' data-insert='\\frac{\\differentialD #0}{\\differentialD x}'></li>
                    <li class='action font-glyph bottom right' data-command='"deletePreviousChar"'>&#x232b;</li></ul>
                <ul>
                    <li class='fnbutton'>(</li>
                    <li class='fnbutton'>)</li>
                    <li class='fnbutton' data-insert='^{#?} ' data-latex='x^{#?} '></li>
                    <li class='fnbutton' data-insert='_{#?} ' data-latex='x_{#?} '></li>
                    <li class='keycap w20 ' data-key=' '>&nbsp;</li>
                    <li class='action' data-command='"moveToPreviousChar"'><svg><use xlink:href='#svg-arrow-left' /></svg></li>
                    <li class='action' data-command='"moveToNextChar"'><svg><use xlink:href='#svg-arrow-right' /></svg></li>
                    <li class='action' data-command='"complete"'><svg><use xlink:href='#svg-tab' /></svg></li>
                </ul>
            </div>`,
            // 'functions': makeFunctionsLayer.bind(null, FUNCTIONS),

}

function latexToMarkup(latex, arg) {
    const args = [];
    
    if (arg && arg.length > 0) {
        for (let i = 0; i < arg.length; i++) {
            args.push(ParserModule.parseTokens(Lexer.tokenize(arg[i]), 'math'));
        }
    }

    const parse = ParserModule.parseTokens(Lexer.tokenize(latex), 'math', args);
    const spans = MathAtom.decompose({mathstyle: 'displaystyle'}, parse);
    
    const base = Span.makeSpan(spans, 'ML__base');

    const topStrut = Span.makeSpan('', 'ML__strut');
    topStrut.setStyle('height', base.height, 'em');
    const bottomStrut = Span.makeSpan('', 'ML__strut ML__bottom');
    bottomStrut.setStyle('height', base.height + base.depth, 'em');
    bottomStrut.setStyle('vertical-align', -base.depth, 'em');
    const wrapper = Span.makeSpan([topStrut, bottomStrut, base], 'ML__mathlive');

    return wrapper.toMarkup();
}

function makeFunctionsLayer(functions) {
    let result = '';

    for (const f of functions) {
        if (typeof f === 'string') {
            // It's a section heading
            result += '<section>';
            result += '<h3>' + f + '</h3>';
        } else if (Array.isArray(f)) {
            // result += '<ul>';
            result += '<div class="functions_section_content">';
            for (let i = 0; i < f.length; i++) {
                // if ((i + 1) % 3) {
                //     result += '</ul><ul>';
                // }
                const command = f[i];
                const command_markup =  latexToMarkup(
                    Definitions.SAMPLES[command] || command,
                    ['{\\color{#550000}{\\tiny x}}']            // \\char"2B1A
                );
                const command_note = Definitions.getNote(command);
                // const command_shortcuts = Shortcuts.stringify(
                //     Shortcuts.getShortcutsForCommand(command)) || '';


                result += '<div>' + command_markup + command_note + '</div>';
            }
            result += '</div>';
            // if (f.length % 3) {
            //     result += '</ul>';
            // }
            result += '</section>';
        }
    }

    return "<div class='functions-list'>" + result + "</div>";
}


/**
 * Return a markup string for the keyboard toolbar for the specified layer.
 */
function makeKeyboardToolbar(keyboards, currentKeyboard) {
    // The left hand side of the toolbar has a list of all the available keyboards
    let result = "<div class='left'>";
    const keyboardList = keyboards.replace(/\s+/g, ' ').split(' ');
    if (keyboardList.length > 1) {
        for (const keyboard of keyboardList) {
            if (!KEYBOARDS[keyboard]) {
                console.error('Unknown virtual keyboard "' + keyboard + '"');
                break;
            }
            result += '<div class=\'';
            if (keyboard === currentKeyboard) {
                result += 'selected ';
            } else {
                if (KEYBOARDS[keyboard].command) {
                    result += 'action ';
                } else {
                    result += 'layer-switch ';
                }
            }

            result += (KEYBOARDS[keyboard].classes || '') + "'";

            if (KEYBOARDS[keyboard].tooltip) {
                result += "data-tooltip='" + KEYBOARDS[keyboard].tooltip + "' ";
                result += "data-placement='top' data-delay='1s'";
            }
            
            if (keyboard !== currentKeyboard) {
                if (KEYBOARDS[keyboard].command) {
                    result += "data-command='\"" + KEYBOARDS[keyboard].command + "\"'";
                }

                if (KEYBOARDS[keyboard].layer) {
                    result += "data-layer='" + KEYBOARDS[keyboard].layer + "'";
                }
            }
            result += '>' + KEYBOARDS[keyboard].label + '</div>';
        }
    }
    result += '</div>';

    // The right hand side of the toolbar, with the undo/redo commands
    result += `
        <div class='right'>
            <div class='action disabled' 
                data-command='"undo"'
                data-tooltip='Undo' data-placement='top' data-delay='1s'>
                <svg><use xlink:href='#svg-undo' /></svg>
            </div>
            <div class='action disabled' 
                data-command='"redo"'
                data-tooltip='Redo' data-placement='top' data-delay='1s'>
                <svg><use xlink:href='#svg-redo' /></svg>
            </div>
        </div>
    `;

    return "<div class='keyboard-toolbar'>" + result + "</div>";
}



/**
 * Construct a virtual keyboard element based on the config options in the 
 * mathfield and an optional theme.
 * @param {Object} mf 
 * @param {string} theme 
 * @result {} A DOM element
 */
function make(mf, theme) {
    const svgIcons = 
        `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">

            <symbol id="svg-command" viewBox="0 0 640 512">
                <path d="M34.495 36.465l211.051 211.05c4.686 4.686 4.686 12.284 0 16.971L34.495 475.535c-4.686 4.686-12.284 4.686-16.97 0l-7.071-7.07c-4.686-4.686-4.686-12.284 0-16.971L205.947 256 10.454 60.506c-4.686-4.686-4.686-12.284 0-16.971l7.071-7.07c4.686-4.687 12.284-4.687 16.97 0zM640 468v-10c0-6.627-5.373-12-12-12H300c-6.627 0-12 5.373-12 12v10c0 6.627 5.373 12 12 12h328c6.627 0 12-5.373 12-12z"/>                        <!-- <path>s and whatever other shapes in here -->  
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
            <symbol id="svg-wikipedia" viewBox="0 0 640 512">
                    <path d="M640 51.2l-.3 12.2c-28.1.8-45 15.8-55.8 40.3-25 57.8-103.3 240-155.3 358.6H415l-81.9-193.1c-32.5 63.6-68.3 130-99.2 193.1-.3.3-15 0-15-.3C172 352.3 122.8 243.4 75.8 133.4 64.4 106.7 26.4 63.4.2 63.7c0-3.1-.3-10-.3-14.2h161.9v13.9c-19.2 1.1-52.8 13.3-43.3 34.2 21.9 49.7 103.6 240.3 125.6 288.6 15-29.7 57.8-109.2 75.3-142.8-13.9-28.3-58.6-133.9-72.8-160-9.7-17.8-36.1-19.4-55.8-19.7V49.8l142.5.3v13.1c-19.4.6-38.1 7.8-29.4 26.1 18.9 40 30.6 68.1 48.1 104.7 5.6-10.8 34.7-69.4 48.1-100.8 8.9-20.6-3.9-28.6-38.6-29.4.3-3.6 0-10.3.3-13.6 44.4-.3 111.1-.3 123.1-.6v13.6c-22.5.8-45.8 12.8-58.1 31.7l-59.2 122.8c6.4 16.1 63.3 142.8 69.2 156.7L559.2 91.8c-8.6-23.1-36.4-28.1-47.2-28.3V49.6l127.8 1.1.2.5z"/>
            </symbol>
            <symbol id="svg-link" viewBox="0 0 512 512">
                    <path d="M301.148 394.702l-79.2 79.19c-50.778 50.799-133.037 50.824-183.84 0-50.799-50.778-50.824-133.037 0-183.84l79.19-79.2a132.833 132.833 0 0 1 3.532-3.403c7.55-7.005 19.795-2.004 20.208 8.286.193 4.807.598 9.607 1.216 14.384.481 3.717-.746 7.447-3.397 10.096-16.48 16.469-75.142 75.128-75.3 75.286-36.738 36.759-36.731 96.188 0 132.94 36.759 36.738 96.188 36.731 132.94 0l79.2-79.2.36-.36c36.301-36.672 36.14-96.07-.37-132.58-8.214-8.214-17.577-14.58-27.585-19.109-4.566-2.066-7.426-6.667-7.134-11.67a62.197 62.197 0 0 1 2.826-15.259c2.103-6.601 9.531-9.961 15.919-7.28 15.073 6.324 29.187 15.62 41.435 27.868 50.688 50.689 50.679 133.17 0 183.851zm-90.296-93.554c12.248 12.248 26.362 21.544 41.435 27.868 6.388 2.68 13.816-.68 15.919-7.28a62.197 62.197 0 0 0 2.826-15.259c.292-5.003-2.569-9.604-7.134-11.67-10.008-4.528-19.371-10.894-27.585-19.109-36.51-36.51-36.671-95.908-.37-132.58l.36-.36 79.2-79.2c36.752-36.731 96.181-36.738 132.94 0 36.731 36.752 36.738 96.181 0 132.94-.157.157-58.819 58.817-75.3 75.286-2.651 2.65-3.878 6.379-3.397 10.096a163.156 163.156 0 0 1 1.216 14.384c.413 10.291 12.659 15.291 20.208 8.286a131.324 131.324 0 0 0 3.532-3.403l79.19-79.2c50.824-50.803 50.799-133.062 0-183.84-50.802-50.824-133.062-50.799-183.84 0l-79.2 79.19c-50.679 50.682-50.688 133.163 0 183.851z"/>
            </symbol>
            <symbol id="svg-external-link" viewBox="0 0 448 512">
                <path d="M400 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zm16 400c0 8.822-7.178 16-16 16H48c-8.822 0-16-7.178-16-16V80c0-8.822 7.178-16 16-16h352c8.822 0 16 7.178 16 16v352zM99.515 374.828c-4.686-4.686-4.686-12.284 0-16.971l195.15-195.15-.707-.707-89.958.342c-6.627 0-12-5.373-12-12v-9.999c0-6.628 5.372-12 12-12L340 128c6.627 0 12 5.372 12 12l-.343 136c0 6.627-5.373 12-12 12h-9.999c-6.627 0-12-5.373-12-12l.342-89.958-.707-.707-195.15 195.15c-4.686 4.686-12.284 4.686-16.971 0l-5.657-5.657z"/>
            </symbol>
            <symbol id="svg-external-link" viewBox="0 0 512 512">
                <path d="M256 40c118.621 0 216 96.075 216 216 0 119.291-96.61 216-216 216-119.244 0-216-96.562-216-216 0-119.203 96.602-216 216-216m0-32C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm-36 344h12V232h-12c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12h48c6.627 0 12 5.373 12 12v140h12c6.627 0 12 5.373 12 12v8c0 6.627-5.373 12-12 12h-72c-6.627 0-12-5.373-12-12v-8c0-6.627 5.373-12 12-12zm36-240c-17.673 0-32 14.327-32 32s14.327 32 32 32 32-14.327 32-32-14.327-32-32-32z"/>
            </symbol>

        </svg>
        `;
    
    let markup = svgIcons;

    let keyboards = mf.config.virtualKeyboards;
    if (!keyboards || keyboards === 'all') {
        keyboards = 'numeric latin greek functions command';
    }

    const keyboardList = keyboards.replace(/\s+/g, ' ').split(' ');
    for (const keyboard of keyboardList) {
        if (!KEYBOARDS[keyboard]) {
            console.error('Unknown virtual keyboard "' + keyboard + '"');
            break;
        }
        for (const layer of KEYBOARDS[keyboard].layers) {
            if (!LAYERS[layer]) {
                console.error('Unknown virtual keyboard layer: "' + layer + '"');
                break;
            }
            markup += `<div class='keyboard-layer' id='` + layer + `'>`;
            markup += makeKeyboardToolbar(keyboards, keyboard);
            markup += typeof LAYERS[layer] === 'function' ? LAYERS[layer]() : LAYERS[layer];
            markup += '</div>';
        }
    }

    const result = document.createElement('div');
    result.id = 'ML__keyboard';
    if (theme) {
        result.classList.add(theme);
    } else if (mf.config.virtualKeyboardTheme) {
        result.classList.add(mf.config.virtualKeyboardTheme);
    } else if (/(android)/i.test(navigator.userAgent)) {
        result.classList.add('material');
    }
    result.innerHTML = markup;

    // Attach the element handlers
    let elList = result.querySelectorAll('.keycap, .action, .fnbutton, .bigfnbutton');
    for (const el of  elList) {
        if (el.getAttribute('data-latex')) {
            el.innerHTML = latexToMarkup(el.getAttribute('data-latex'));
        } else if (el.innerHTML === '') {
            el.innerHTML = latexToMarkup(el.getAttribute('data-insert') || '', 
                ['{\\color{#555}{\\tiny \\char"2B1A}}', '{\\color{#555}{\\tiny \\char"2B1A}}']);
        }
        if (el.getAttribute('data-command')) {
            mf._attachButtonHandlers(el, JSON.parse(el.getAttribute('data-command')));
        } else if (el.getAttribute('data-insert')) {
            mf._attachButtonHandlers(el, ['insert', 
                el.getAttribute('data-insert')]);
        } else {
            mf._attachButtonHandlers(el, ['typedText', 
                el.getAttribute('data-key') || el.textContent]);
        }
    }
    elList = result.getElementsByClassName('layer-switch');
    for (const el of  elList) {
        mf._attachButtonHandlers(el, ['switchKeyboardLayer', 
            el.getAttribute('data-layer')]);
    }

    // Select the first keyboard as the initial one.
    result.getElementsByClassName('keyboard-layer')[0].style.display = 'flex';

    return result;
}


return {
    make,
    makeFunctionsLayer
}


})