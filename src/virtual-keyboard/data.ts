import { VirtualKeyboardLayout } from 'mathlive';

export const LAYOUTS: Record<string, VirtualKeyboardLayout> = {
  numeric: {
    label: '123',
    classes: 'MLK__tex-math',
    tooltip: 'keyboard.tooltip.numeric',
    layers: ['numeric'],
  },
  alphabetic: {
    label: 'abc',
    classes: 'MLK__tex-math',
    tooltip: 'keyboard.tooltip.alphabetic',
    layers: ['lower-alphabetic', 'upper-alphabetic'],
  },
  greek: {
    label: '&alpha;&beta;&gamma;',
    classes: 'MLK__tex-math',
    tooltip: 'keyboard.tooltip.greek',
    layers: ['lower-greek', 'upper-greek'],
  },
  functions: {
    label: 'f&thinsp;()',
    classes: 'MLK__tex-math',
    tooltip: 'keyboard.tooltip.functions',
    layers: ['functions'],
  },
  symbols: {
    label: '&infin;≠∈',
    classes: 'MLK__tex-math',
    tooltip: 'keyboard.tooltip.symbols',
    layers: ['symbols'],
  },
};

export const SHIFTED_KEYS = {
  '\\varphi ': ['&Phi;', '\\Phi '],
  '\\varsigma ': ['&Sigma;', '\\Sigma '],
  '\\epsilon ': ['&#x0190;', '\\char"0190'],
  '\\rho ': ['&#x3A1', '\\char"3A1'],
  '\\tau ': ['&#x3A4;', '\\char"3A4'],
  '\\upsilon ': ['&Upsilon;', '\\Upsilon '],
  '\\theta ': ['&Theta;', '\\Theta '],
  '\\iota ': ['&Iota;', '\\char"399'],
  '\\omicron ': ['&#x039F;', '\\char"39F'],
  '\\pi ': ['&Pi;', '\\Pi '],
  '\\alpha ': ['&Alpha;', '\\char"391'],
  '\\sigma ': ['&Sigma;', '\\Sigma '],
  '\\delta ': ['&Delta;', '\\Delta '],
  '\\phi ': ['&#x03a6;', '\\Phi '],
  '\\gamma ': ['&Gamma;', '\\Gamma '],
  '\\eta ': ['&Eta;', '\\char"397'],
  '\\xi ': ['&Xi;', '\\Xi '],
  '\\kappa ': ['&Kappa;', '\\char"39A'],
  '\\lambda ': ['&Lambda;', '\\Lambda '],
  '\\zeta ': ['&Zeta;', '\\char"396'],
  '\\chi ': ['&Chi;', '\\char"3A7'],
  '\\psi ': ['&Psi;', '\\Psi '],
  '\\omega ': ['&Omega;', '\\Omega '],
  '\\beta ': ['&Beta;', '\\char"392'],
  '\\nu ': ['&Nu;', '\\char"39D'],
  '\\mu ': ['&Mu;', '\\char"39C'],
};

export const LAYERS = {
  'numeric': `
<div class='MLK__rows'>
  <ul>
    <li class='MLK__keycap MLK__tex' data-variants='x-var'><i>x</i></li>
    <li class='MLK__keycap MLK__tex' data-variants='n-var'><i>n</i></li>
    <li class='separator w5'></li>
    <row name='numpad-1'/>
    <li class='separator w5'></li>
    <li class='MLK__keycap MLK__tex' data-latex='\\exponentialE' data-variants='ee'>e</li>
    <li class='MLK__keycap MLK__tex' data-latex='\\imaginaryI' data-variants='ii'>i</li>
    <li class='MLK__keycap MLK__tex' data-latex='\\pi' data-variants='numeric-pi'></li>
  </ul>
  <ul>
    <li class='MLK__keycap MLK__tex' data-key='<' data-variants='<'>&lt;</li>
    <li class='MLK__keycap MLK__tex' data-key='>' data-variants='>'>&gt;</li>
    <li class='separator w5'></li>
    <row name='numpad-2'/>
    <li class='separator w5'></li>
    <li class='MLK__keycap MLK__tex' data-latex='#@^{2}' data-latex='x^2'></li>
    <li class='MLK__keycap MLK__tex' data-variants='^' data-insert='#@^{#?}' data-latex='x^\\placeholder'></li>
    <li class='MLK__keycap MLK__tex small' data-insert='\\sqrt{#0}' data-latex='\\sqrt{#0}'></li>
  </ul>
  <ul>
    <li class='MLK__keycap MLK__tex' data-variants='(' >(</li>
    <li class='MLK__keycap MLK__tex' data-variants=')' >)</li>
    <li class='separator w5'></li>
    <row name='numpad-3'/>
    <li class='separator w5'></li>
    <li class='MLK__keycap small' data-variants='int' data-latex='\\int_0^\\infty'></li>
    <li class='MLK__keycap' data-latex='\\forall' data-variants='logic' ></li>
    <li class='action font-glyph bottom right' data-variants='delete' data-command='["performWithFeedback","deleteBackward"]'><svg class="svg-glyph"><use xlink:href="#svg-delete-backward" /></svg></li></ul>
  </ul>
  <ul>
    <li class='MLK__keycap' data-variants='foreground-color' data-command='["applyStyle",{"color":"red"}]'><span style='border-radius: 50%;width:22px;height:22px; border: 3px solid #cc2428; box-sizing: border-box'></span></li>
    <li class='MLK__keycap' data-variants='background-color' data-command='["applyStyle",{"backgroundColor":"yellow"}]'><span style='border-radius: 50%;width:22px;height:22px; background:#fff590; box-sizing: border-box'></span></li>
    <li class='separator w5'></li>
    <row name='numpad-4'/>
    <li class='separator w5'></li>
    <arrows/>
  </ul>
</div>
    `,
  'lower-alphabetic': `
<div class='MLK__rows'>
  <ul>
    <row name='numpad-1' class='if-wide'/>
    <row name='lower-1' shift-layer='upper-alphabetic'/>
  </ul>
  <ul>
    <row name='numpad-2' class='if-wide'/>
    <row name='lower-2'  shift-layer='upper-alphabetic''/>
  </ul>
  <ul>
    <row name='numpad-3' class='if-wide'/>
    <row name='lower-3'  shift-layer='upper-alphabetic''/>
  </ul>
  <ul>
    <row name='numpad-4' class='if-wide'/>
    <li class='MLK__keycap' >;</li>
    <li class='MLK__keycap' >,</li>
    <li class='MLK__keycap w50' data-key=' ' data-variants='space'>&nbsp;</li>
    <arrows/>
  </ul>
</div>`,
  'upper-alphabetic': `<div class='MLK__rows'>
<ul>
  <row name='numpad-1' class='if-wide'/>
  <row name='upper-1'  shift-layer='lower-alphabetic'/>
</ul>
<ul>
  <row name='numpad-2' class='if-wide'/>
  <row name='upper-2' shift-layer='lower-alphabetic'/>
</ul>
<ul>
  <row name='numpad-3' class='if-wide'/>
  <row name='upper-3' shift-layer='lower-alphabetic'/>
</ul>
<ul>
  <row name='numpad-4' class='if-wide'/>
  <li class='MLK__keycap' >;</li>
  <li class='MLK__keycap' data-variants='.'>;</li>
  <li class='MLK__keycap w50' data-key=' '>&nbsp;</li>
  <arrows/>
</ul>
</div>`,
  'symbols': `
<div class='MLK__rows'>
  <ul>
    <row name='numpad-1' class='if-wide'/>
    <li class='MLK__keycap MLK__tex' data-variants='(' data-insert='\\lbrace '>{</li>
    <li class='MLK__keycap MLK__tex' data-variants=')' data-insert='\\rbrace '>}</li>
    <li class='separator w5'></li>
    <li class='MLK__keycap MLK__tex small' data-variants='xleftarrows' data-latex='\\leftarrow' ></li>
    <li class='MLK__keycap MLK__tex small' data-variants='xrightarrows' data-latex='\\rightarrow' ></li>
    <li class='MLK__keycap MLK__tex' data-variants='overline' data-latex='\\overline{#@}' data-aside='overline'></li>
    <li class='MLK__keycap MLK__tex' data-variants='underline' data-latex='\\underline{#@}' data-aside='underline'></li>
    <li class='MLK__keycap w15' data-insert='\\ulcorner#0\\urcorner '><span><sup>&#x250c;</sup><span><span style='color:#ddd'>o</span><sup>&#x2510;</sup></span><aside>ceil</aside></li>
    <li class='MLK__keycap MLK__tex' data-variants='nabla' data-insert='\\nabla '>&#x2207;<aside>nabla</aside></li>
    <li class='MLK__keycap MLK__tex' data-variants='infinity' data-insert='\\infty '>&#x221e;</li>

  </ul>
  <ul>
    <row name='numpad-2' class='if-wide'/>
    <li class='MLK__keycap MLK__tex' data-variants='(' data-insert='\\lbrack '>[</li>
    <li class='MLK__keycap MLK__tex' data-variants=')' data-insert='\\rbrack '>]</li>
    <li class='separator w5'></li>

    <li class='MLK__keycap MLK__tex' data-variants='in' data-insert='\\in '>&#x2208;</li>
    <li class='MLK__keycap MLK__tex' data-variants='!in' data-insert='\\notin '>&#x2209;</li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Re '>&#x211c;<aside>Real</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Im '>&#x2111;<aside>Imaginary</aside></li>
    <li class='MLK__keycap w15' data-insert='\\llcorner#0\\lrcorner '><span><sub>&#x2514;</sub><span style='color:#ddd'>o</span><sub>&#x2518;</sub></span><aside>floor</aside></li>

    <li class='MLK__keycap MLK__tex' data-insert='\\partial '>&#x2202;<aside>partial<br>derivative</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\emptyset '>&#x2205;<aside>empty set</aside></li>

  </ul>
  <ul>
    <row name='numpad-3' class='if-wide'/>
    <li class='MLK__keycap MLK__tex' data-variants='(' data-insert='\\langle '>&#x27e8;</li>
    <li class='MLK__keycap MLK__tex' data-variants=')' data-insert='\\rangle '>&#x27e9;</li>
    <li class='separator w5'></li>
    <li class='MLK__keycap MLK__tex' data-variants='subset' data-insert='\\subset '>&#x2282;</li>
    <li class='MLK__keycap MLK__tex' data-variants='superset' data-insert='\\supset '>&#x2283;</li>

    <li class='MLK__keycap MLK__tex' data-variants='accents' data-insert='\\vec{#@}' data-latex='\\vec{#?}' data-aside='vector'></li>
    <li class='MLK__keycap MLK__tex' data-variants='absnorm' data-insert='\\left| #0 \\right|' data-latex='\\left| #? \\right|' data-aside='abs'></li>

    <li class='MLK__keycap MLK__tex' data-key='!' data-variants='!'>!<aside>factorial</aside></li>
    <li class='MLK__keycap' data-latex='^{\\prime} '><span><sup><span><span style='color:#ddd'>o</span>&#x2032</sup></span><aside>prime</aside></li>

    <li class='action font-glyph bottom right w15'
        data-shifted='<span class="warning"><svg class="svg-glyph"><use xlink:href="#svg-trash" /></svg></span>'
        data-shifted-command='"deleteAll"'
        data-variants='delete' data-command='["performWithFeedback","deleteBackward"]'
    ><svg class="svg-glyph"><use xlink:href="#svg-delete-backward" /></svg></li>
  </ul>
  <ul>
    <row name='numpad-4' class='if-wide'/>
    <li class='MLK__keycap MLK__tex' data-insert=','>,</li>
    <li class='MLK__keycap MLK__tex' data-insert='\\cdot '>&#x22c5;<aside>centered dot</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\colon '>:<aside>colon</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\circ '>&#x2218;<aside>circle</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\approx '>&#x2248;<aside>approx.</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\ne '>&#x2260;</li>
    <li class='MLK__keycap MLK__tex' data-insert='\\pm '>&#x00b1;</li>
    <arrows/>
  </ul>
</div>`,
  'lower-greek': `
<div class='MLK__rows'>
  <ul><li class='MLK__keycap MLK__tex' data-insert='\\varphi '><i>&#x03c6;</i><aside>phi var.</aside></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\varsigma '><i>&#x03c2;</i><aside>sigma var.</aside></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\epsilon '><i>&#x03f5;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\rho '><i>&rho;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\tau '><i>&tau;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\upsilon '><i>&upsilon;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\theta '><i>&theta;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\iota '><i>&iota;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\omicron '>&omicron;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\pi '><i>&pi;</i></li>
  </ul>
  <ul><li class='MLK__keycap MLK__tex' data-insert='\\alpha ' data-shifted='&Alpha;' data-shifted-command='["insert","\\\\char\\"391"]'><i>&alpha;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\sigma '><i>&sigma;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\delta '><i>&delta;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\phi '><i>&#x03d5;</i></i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\gamma '><i>&gamma;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\eta '><i>&eta;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\xi '><i>&xi;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\kappa '><i>&kappa;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\lambda '><i>&lambda;</i></li>
  </ul>
  <ul><li class='shift modifier font-glyph bottom left w15 layer-switch' data-layer='upper-greek'><svg class="svg-glyph"><use xlink:href="#svg-shift" /></svg></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\zeta '><i>&zeta;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\chi '><i>&chi;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\psi '><i>&psi;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\omega '><i>&omega;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\beta '><i>&beta;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\nu '><i>&nu;</i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\mu '><i>&mu;</i></li>
      <li class='action font-glyph bottom right w15'
          data-shifted='<span class="warning"><svg class="svg-glyph"><use xlink:href="#svg-trash" /></svg></span>'
          data-shifted-command='"deleteAll"'
          data-variants='delete' data-command='["performWithFeedback","deleteBackward"]'
      ><svg class="svg-glyph"><use xlink:href="#svg-delete-backward" /></svg></li>
  </ul>
  <ul>
      <li class='MLK__keycap ' data-key=' '>&nbsp;</li>
      <li class='MLK__keycap'>,</li>
      <li class='MLK__keycap MLK__tex' data-insert='\\varepsilon '><i>&#x03b5;</i><aside>epsilon var.</aside></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\vartheta '><i>&#x03d1;</i><aside>theta var.</aside></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\varkappa '><i>&#x3f0;</i><aside>kappa var.</aside></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\varpi '><i>&#x03d6;<aside>pi var.</aside></i></li>
      <li class='MLK__keycap MLK__tex' data-insert='\\varrho '><i>&#x03f1;</i><aside>rho var.</aside></li>
      <arrows/>
  </ul>
</div>`,
  'upper-greek': `
<div class='MLK__rows'>
  <ul><li class='MLK__keycap MLK__tex' data-insert='\\Phi '>&Phi;<aside>phi</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Sigma '>&Sigma;<aside>sigma</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\char"0190'>&#x0190;<aside>epsilon</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\char"3A1'>&#x3A1;<aside>rho</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\char"3A4'>&#x3A4;<aside>tau</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Upsilon '>&Upsilon;<aside>upsilon</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Theta '>&Theta;<aside>theta</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\char"399'>&Iota;<aside>iota</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\char"39F'>&#x039F;<aside>omicron</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Pi '>&Pi;<aside>pi</aside></li></ul>
  <ul><li class='MLK__keycap MLK__tex' data-insert='\\char"391'>&#x391;<aside>alpha</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Sigma '>&Sigma;<aside>sigma</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Delta '>&Delta;<aside>delta</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Phi '>&#x03a6;<aside>phi</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Gamma '>&Gamma;<aside>gamma</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\char"397'>&Eta;<aside>eta</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Xi '>&Xi;<aside>xi</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\char"39A'>&Kappa;<aside>kappa</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Lambda '>&Lambda;<aside>lambda</aside></li></ul>
  <ul><li class='shift modifier font-glyph bottom left selected w15 layer-switch' data-layer='lower-greek'><svg class="svg-glyph"><use xlink:href="#svg-shift" /></svg></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\char"396'>&Zeta;<aside>zeta</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\char"3A7'>&Chi;<aside>chi</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Psi '>&Psi;<aside>psi</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\Omega '>&Omega;<aside>omega</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\char"392'>&Beta;<aside>beta</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\char"39D'>&Nu;<aside>nu</aside></li>
    <li class='MLK__keycap MLK__tex' data-insert='\\char"39C'>&Mu;<aside>mu</aside></li>
    <li class='action font-glyph bottom right w15' data-command='["performWithFeedback","deleteBackward"]'><svg class="svg-glyph"><use xlink:href="#svg-delete-backward" /></svg></li></ul>
<ul>
    <li class='separator w10'>&nbsp;</li>
    <li class='MLK__keycap'>.</li>
    <li class='MLK__keycap w50' data-key=' '>&nbsp;</li>
    <arrows/>
  </ul>
</div>`,

  'functions': `
<div class='MLK__rows'>
  <ul>
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
  <ul>
    <li class='fnbutton' data-latex='\\cos'></li>
    <li class='fnbutton' data-latex='\\cos^{-1}'></li>
    <li class='fnbutton' data-latex='\\log'></li>
    <li class='fnbutton' data-latex='10^{#?}'></li>
    <li class='bigfnbutton' data-insert='\\operatorname{gcd}(#?)' data-latex='\\operatorname{gcd}()'></li>
    <li class='bigfnbutton' data-insert='\\operatorname{floor}(#?)' data-latex='\\operatorname{floor}()'></li>
    <li class='bigfnbutton' data-latex='\\sum_{n\\mathop=0}^{\\infty}'></li>
    <li class='bigfnbutton' data-latex='\\int_{0}^{\\infty}'></li>
    <li class='bigfnbutton' data-insert='\\operatorname{sign}(#?)' data-latex='\\operatorname{sign}()'></li>
  </ul>
  <ul>
    <li class='fnbutton' data-latex='\\tan'></li>
    <li class='fnbutton' data-latex='\\tan^{-1}'></li>
    <li class='fnbutton' data-latex='\\log_{#?}'></li>
    <li class='fnbutton' data-latex='\\sqrt[#?]{#0}'></li>
    <li class='bigfnbutton' data-insert='#0 \\mod' data-latex='\\mod'></li>
    <li class='bigfnbutton' data-insert='\\operatorname{round}(#?) ' data-latex='\\operatorname{round}()'></li>
    <li class='bigfnbutton' data-insert='\\prod_{n\\mathop=0}^{\\infty}' data-latex='{ \\prod_{n=0}^{\\infty}}'></li>
    <li class='bigfnbutton' data-insert='\\frac{\\differentialD #0}{\\differentialD x}'></li>
    <li class='action font-glyph bottom right' data-command='["performWithFeedback","deleteBackward"]'><svg class="svg-glyph"><use xlink:href="#svg-delete-backward" /></svg></li></ul>
  <ul>
    <li class='fnbutton'>(</li>
    <li class='fnbutton'>)</li>
    <li class='fnbutton' data-insert='^{#?}' data-latex='x^{#?}'></li>
    <li class='fnbutton' data-insert='_{#?}' data-latex='x_{#?}'></li>
    <li class='MLK__keycap w20 ' data-key=' '>&nbsp;</li>
    <arrows/>
  </ul>
</div>`,
  'style': `
<div class='MLK__rows'>
  <ul>
    <li class='MLK__keycap' data-variants='foreground-color' data-command='["applyStyle",{"color":"red"}]'><span style='border-radius: 50%;width:22px;height:22px; border: 3px solid #cc2428'></span></li>
    <li class='MLK__keycap' data-variants='background-color' data-command='["applyStyle",{"backgroundColor":"yellow"}]'><span style='border-radius: 50%;width:22px;height:22px; background:#fff590'></span></li>
    <li class='separator w5'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"size":"3"}]' data-latex='\\scriptsize\\text{small}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"size":"5"}]' data-latex='\\scriptsize\\text{normal}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"size":"9"}]' data-latex='\\huge\\text{big}'></li>
    <li class='separator w5'></li>
    <li class='MLK__keycap' data-latex='\\langle' data-command='["insert", "\\\\langle", {"smartFence":true}]'></li>
  </ul>
  <ul>
    <li class='MLK__keycap' data-command='["applyStyle",{"series":"l"}]' data-latex='\\fontseries{l}\\text{Ab}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"series":"m"}]' data-latex='\\fontseries{m}\\text{Ab}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"series":"b"}]' data-latex='\\fontseries{b}\\text{Ab}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"series":"bx"}]' data-latex='\\fontseries{bx}\\text{Ab}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"series":"sb"}]' data-latex='\\fontseries{sb}\\text{Ab}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"series":"c"}]' data-latex='\\fontseries{c}\\text{Ab}'></li>
  </ul>
  <ul>
    <li class='MLK__keycap' data-command='["applyStyle",{"shape":"up"}]' data-latex='\\textup{Ab}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"shape":"it"}]' data-latex='\\textit{Ab}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"shape":"sl"}]' data-latex='\\textsl{Ab}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"shape":"sc"}]' data-latex='\\textsc{Ab}'></li>
    <li class='separator w5'></li>
    <li class='MLK__keycap' data-insert='\\emph{#@} ' data-latex='\\text{\\emph{emph}}'></li>
  </ul>
  <ul>
    <li class='MLK__keycap' data-command='["applyStyle",{"fontFamily":"cmr"}]' data-latex='\\textrm{Az}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"fontFamily":"cmtt"}]' data-latex='\\texttt{Az}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"fontFamily":"cmss"}]' data-latex='\\textsf{Az}'></li>

    <li class='MLK__keycap' data-command='["applyStyle",{"fontFamily":"bb"}]'  data-latex='\\mathbb{AZ}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"fontFamily":"scr"}]'  data-latex='\\mathscr{AZ}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"fontFamily":"cal"}]' data-latex='\\mathcal{A1}'></li>
    <li class='MLK__keycap' data-command='["applyStyle",{"fontFamily":"frak"}]' data-latex='\\mathfrak{Az}'></li>
  </ul>
</div>`,
};
