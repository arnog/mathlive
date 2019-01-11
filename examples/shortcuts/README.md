# Keyboard Shortcuts

MathLive.js supports two methods to speed up input using a physical keyboard.
   * keystroke shortcuts
   * inline shortcuts

## Keystroke Shortcuts
Keystroke shortcuts are typically a combination of keys pressed simultaneously that triggers a command.

For example, pressing `alt/option` and the `V` key at the same time will insert a square root. Pressing `ctrl/cmd` and the `Z` key at the same time will undo
the last command.

MathLive has an extensive set of default keystroke shortcuts. To override, 
customize or add to the list of supported keyboard shortcuts, provide an 
appropriate handler as part of MathLive's configuration:

### **config.onKeystroke**: function(mathfield, keystroke: string, ev:Event)

Invoked when a keystroke is about to be processed. 
- `keystroke` is a string describing the keystroke, for example `Ctrl-KeyA`
- `ev` is the native JavaScript keyboard event.

Return `false` to stop handling of the event, otherwise the default command
(if any) associated with this keystroke will be processed.

### Standard Keystroke Shortcuts
    'Backspace':                'deletePreviousChar',
    'Alt-Backspace':            'deleteNextChar',

    'Del':                      'deleteNextChar',
    'Alt-Del':                  'deletePreviousChar',

    'Left':                     'moveToPreviousChar',
    'Shift-Left':               'extendToPreviousChar',
    'Ctrl-Left':                'moveToGroupStart',
    'Ctrl-Shift-Left':          'extendToGroupStart',
    'Alt-Left':                 'moveToPreviousWord',
    'Alt-Shift-Left':           'extendToPreviousWord',

    'Right':                    'moveToNextChar',
    'Ctrl-Right':               'moveToGroupEnd',
    'Ctrl-Shift-Right':         'extendToGroupEnd',
    'Shift-Right':              'extendToNextChar',
    'Alt-Right':                'moveToNextWord',
    'Alt-Shift-Right':          'extendToNextWord',

    'Home':                     'moveToMathFieldStart',
    'mac:Meta-Left':            'moveToMathFieldStart',
    'Shift-Home':               'extendToMathFieldStart',
    'mac:Meta-Shift-Left':      'extendToMathFieldStart',

    'End':                      'moveToMathFieldEnd',
    'mac:Meta-Right':           'moveToMathFieldEnd',
    'Shift-End':                'extendToMathFieldEnd',
    'mac:Meta-Shift-Right':     'extendToMathFieldEnd',

    'Up':                       'moveUp',
    'Shift-Up':                 'extendUp',
    'Down':                     'moveDown',
    'Shift-Down':               'extendDown',

    'Shift-Spacebar':           'moveBeforeParent',
    'Spacebar':                 'moveAfterParent',

    'PageUp':                   'moveToGroupStart',
    'PageDown':                 'moveToGroupEnd',

    'math:Tab':                 'moveToNextPlaceholder',
    'math:F8':                  'moveToNextPlaceholder',    // Visual Studio
    'math:Shift-Tab':           'moveToPreviousPlaceholder',
    'math:Shift-F8':            'moveToPreviousPlaceholder',    // Visual Studio

    'math:Esc':                 'enterCommandMode',
    'math:Backslash':           'enterCommandMode',
    'math:IntlBackslash':       'enterCommandMode',
    'command:Spacebar':         'complete',
    'command:Esc':              'complete',
    'command:Tab':              'complete',
    'ios:command:Tab':          'nextSuggestion',
    'command:Return':           'complete',
    'command:Enter':            'complete',
    'command:Shift-Esc':        'complete',     // Some keyboards can't generate 
            // this combination, for example in 60% keyboards it is mapped to ~
    'command:Down':             'nextSuggestion',
    'command:Up':               'previousSuggestion',

    '!mac:math:Ctrl-KeyA':      'selectAll',
    'mac:math:Meta-KeyA':       'selectAll',
    '!mac:Ctrl-KeyZ':           'undo',
    'mac:Meta-KeyZ':            'undo',
    '!mac:Ctrl-KeyY':           'redo',             // ARIA recommendation
    'mac:Meta-Shift-KeyY':      'redo',
    '!mac:Ctrl-Shift-KeyZ':     'redo',
    'mac:Meta-Shift-KeyZ':      'redo',

    // Rare keys on some extended keyboards
    'Cut':                      'cut',
    'Copy':                     'copy',
    'Paste':                    'paste',
    'Undo':                     'undo',
    'Redo':                     'redo',
    'Clear':                    'delete',
    'EraseEof':                 'deleteToGroupEnd',


    // EMACS/MACOS BINDINGS
    'mac:Ctrl-KeyB':            'moveToPreviousChar',
    'mac:Ctrl-Shift-KeyB':      'extendToPreviousChar',
    'mac:Ctrl-KeyF':            'moveToNextChar',
    'mac:Ctrl-Shift-KeyF':      'extendToNextChar',
    'mac:Ctrl-Alt-KeyB':        'moveToPreviousWord',
    'mac:Ctrl-Shift-Alt-KeyB':  'extendToPreviousWord',
    'mac:Ctrl-Alt-KeyF':        'moveToNextWord',
    'mac:Ctrl-Shift-Alt-KeyF':  'extendToNextWord',
    'mac:Ctrl-KeyA':            'moveToMathFieldStart',    
    'mac:Ctrl-Shift-KeyA':      'extendToMathFieldStart',    
    'mac:Ctrl-KeyE':            'moveToMathFieldEnd',
    'mac:Ctrl-Shift-KeyE':      'extendToMathFieldEnd',
    'mac:Ctrl-KeyP':            'moveUp',
    'mac:Ctrl-Shift-KeyP':      'extendUp',
    'mac:Ctrl-KeyN':            'extendDown',
    'mac:Ctrl-KeyH':            'deletePreviousChar',
    'mac:Ctrl-KeyD':            'deleteNextChar',
    'mac:Ctrl-KeyL':            'scrollIntoView',
    'mac:Ctrl-KeyT':            'transpose',

    // WOLFRAM MATHEMATICA BINDINGS
    'math:Ctrl-Digit2':          ['insert', '\\sqrt{#0}'],
    'math:Ctrl-Digit5':          'moveToOpposite',
    'math:Ctrl-Digit6':          'moveToSuperscript',
    'math:Ctrl-Minus':           'moveToSubscript',
    'math:Alt-BracketLeft':      ['insert', '\\left[ #0 \\right]'],
    'math:Alt-Shift-BracketLeft':  ['insert', '\\left{ #0 \\right}'],
    'math:Ctrl-Enter':           'addRowAfter',
    'math:Ctrl-Comma':           'addColumnAfter',

    // MATHLIVE BINDINGS
    'math:Alt-KeyQ':             ['insert', '\\theta'],
    'math:Alt-KeyV':             ['insert', '\\sqrt{#0}'],
    'math:Alt-KeyP':             ['insert', '\\pi'],
    'math:Alt-Shift-KeyP':       ['insert', '\\prod_{i=#?}^{#?}'],
    'math:Alt-KeyW':             ['insert', '\\sum_{i=#?}^{#?}'],
    'math:Alt-KeyB':             ['insert', '\\int_{#?}^{#?}'],
    'math:Alt-KeyU':             ['insert', '\\cup'],
    'math:Alt-KeyN':             ['insert', '\\cap'],
    'math:Alt-Shift-KeyU':       ['insert', '\\bigcup'],
    'math:Alt-Shift-KeyN':       ['insert', '\\bigcap'],
    'math:Alt-Shift-KeyA':       ['insert', '\\forall'],
    'math:Alt-Shift-KeyE':       ['insert', '\\exists'],
    'math:Alt-Digit5':           ['insert', '\\infty'],      // "%" key
    'math:Alt-Digit6':           ['insert', '\\wedge'],      // "^" key
    'math:Alt-Shift-Digit6':     ['insert', '\\vee'],        // "^" key
    'math:Alt-Digit9':           ['insert', '('],            // "(" key, override smartFence
    'math:Alt-Digit0':           ['insert', ')'],            // ")" key, override smartFence
    'math:Alt-keyD':             ['insert', '\\differentialD'],
    'math:Alt-Shift-KeyD':       ['insert', '\\partial'],
    'math:Slash':                ['insert', '\\frac{#@}{#?}'],
    'math:Alt-Slash':            ['insert', '\\frac{#?}{#@}'],
    'math:NumpadDivide':         ['insert', '\\frac{#@}{#?}'],
    'math:Alt-NumpadDivide':     ['insert', '\\frac{#?}{#@}'],
    'math:Alt-KeyO':             ['insert', '\\emptyset'],
    'math:Alt-Shift-KeyO':       ['insert', '\\varnothing'],
    'math:Shift-Backquote':      ['insert', '\\~'],
    'math:Alt-Shift-Slash':      ['insert', '\\/'],

    // ACCESSIBILITY
    'Alt-Shift-KeyK':           'toggleKeystrokeCaption',
    'Alt-Space':                'toggleVirtualKeyboard',

    // Note: On Mac OS (as of 10.12), there is a bug/behavior that causes
    // a beep to be generated with certain command+control key combinations.
    // The workaround is to create a default binding file to silence them.
    // In ~/Library/KeyBindings/DefaultKeyBinding.dict add these entries:
    /*
     {
        "^@\UF701" = "noop:";
        "^@\UF702" = "noop:";
        "^@\UF703" = "noop:";
    }
    */
    'mac:Ctrl-Meta-Up':         'speakParent',
    '!mac:Ctrl-Alt-Up':         'speakParent',
    'mac:Ctrl-Meta-Down':       'speakGroup',
    '!mac:Ctrl-Alt-Down':       'speakGroup',
    'mac:Ctrl-Meta-Left':       'speakLeftSibling',
    '!mac:Ctrl-Alt-Left':       'speakLeftSibling',
    'mac:Ctrl-Meta-Right':      'speakRightSibling',
    '!mac:Ctrl-Alt-Right':      'speakRightSibling',
    
    'mac:Ctrl-Meta-Shift-Down': 'speakAllWithSynchronizedHighlighting',
    '!mac:Ctrl-Alt-Shift-Down': 'speakAllWithSynchronizedHighlighting',


## Inline Shortcuts
An inline shortcut is a sequence of keystrokes typed on the keyboard that get replaced with another symbol. Unlike keystroke shortcuts they cannot be used to trigger a command.

For example, typing the `p` key followed by the `i` key will result in the **π*(`\pi`) symbol being inserted.

If a substitution was undesirable, use **undo** to revert to the raw input.

MathLive has some built-in inline shortcuts defined, but they can be replaced or enhanced with new shortcuts.

###  **config.overrideDefaultInlineShortcuts**: boolean=false

If `true` the default inline shortcuts are ignored.

Use this if you want to completely override (or turn off) the default inline shortcuts.

### **config.inlineShortcuts**: Object.<string, string>

A map of shortcuts → replacement value. 

For example `{ 'pi':   '\pi'}`. 

If `overrideDefaultInlineShortcuts` is false, these shortcuts are applied after any default ones, and can therefore override them.



### **config.inlineShortcutTimeout**: number = 0
Maximum time, in milliseconds, between consecutive characters for them to be
considered part of the same shortcut sequence. 

A value of 0 is the same as infinity: any consecutive 
character will be candidate for an inline shortcut, regardless of the 
interval between this character and the previous one. 

A value of 750 will indicate that the maximum interval between two 
characters to be considered part of the same inline shortcut sequence is 
3/4 of a second.

This is useful to enter "+-" as a sequence of two characters, while also 
supporting the "±" shortcut with the same sequence.

The first result can be entered by pausing slightly between the first and 
second character if this option is set to a value of 250 or so.

Note that some operations, such as clicking to change the selection, or losing
the focus on the mathfield, will automatically timeout the shortcuts.

### Default Inline Shortcuts


#### Greek letters
| Input         | Result        |
| ------------- |:-------------:|
| `alpha`   |   `\alpha`  |
| `delta`   |   `\delta`  |
| `Delta`   |   `\Delta`  |
| `pi`   |   `\pi`  |
| `π`   |   `\pi`  |
| `Pi`   |   `\Pi`  |
| `theta`   |   `\theta`  |
| `Theta`   |   `\Theta`  |

#### Letter-like
| Input         | Result        |
| ------------- |:-------------:|
| `ii`   |   `\imaginaryI`  |
| `jj`   |   `\imaginaryJ`  |
| `ee`   |   `\exponentialE`  |
| `nabla`   |   `\nabla`  |
| `grad`   |   `\nabla`  |
| `del`   |   `\partial`  |

| `oo`   |   `\infty`  |

#### Big operators
| Input         | Result        |
| ------------- |:-------------:|
| `∑`   |   `\sum`  |
| `sum`   |   `\sum_{#?}^{#?}`  |
| `prod`   |   `\prod_{#?}^{#?}`  |
| `√`   |   `\sqrt`  |
| `sqrt`   |   `\sqrt`  |
| `∫`   |   `\int`  |
| `∆`   |   `\diffd  |  
| `∂`   |   `\differentialD`  |

#### Functions
| Input         | Result        |
| ------------- |:-------------:|
| `sin`   |   `\sin`  |
| `cos`   |   `\cos`  |
| `tan`   |   `\tan`  |
| `tanh`   |   `\tanh`  |
| `log`   |   `\log`  |
| `ln`   |   `\ln`  |
| `exp`   |   `\exp`  |
| `lim`   |   `\lim_{#?}`  |

#### Logic
| Input         | Result        |
| ------------- |:-------------:|
| `AA`   |   `\forall`  |
| `EE`   |   `\exists`  |
| `!EE`   |   `\nexists`  |
| `&&`   |   `\land`  |
| `in`   |   `\in`  |
| `!in`   |   `\notin`  |

#### Sets
| Input         | Result        |
| ------------- |:-------------:|
| `NN`   |   `\N`  |  
| `ZZ`   |   `\Z` | 
| `QQ`   |   `\Q`  |      
| `RR`   |   `\R`  |      
| `CC`   |   `\C`  |      
| `PP`   |   `\P`  |     

#### Operators
| Input         | Result        |
| ------------- |:-------------:|
| `xx`   |   `\times`  |
| `+-`   |   `\pm`  |
| `?=`   |   `\questeq`  |
| `≈`   |   `\approx`  |
| `÷`   |   `\div`  |
| `¬`   |   `\neg`  |
| `:=`   |   `\coloneq`  |
| `::`   |   `\Colon`  |

#### Relational operators
| Input         | Result        |
| ------------- |:-------------:|
| `!=`   |   `\ne`  |
| `>=`   |   `\ge`  |
| `<=`   |   `\le`  |
| `~~`   |   `\approx  | 


#### Fences
| Input         | Result        |
| ------------- |:-------------:|
| `(:`   |   `\langle`  |
| `:)`   |   `\rangle`  |

#### More Greek letters
| Input         | Result        |
| ------------- |:-------------:|
| `beta`   |   `\beta`  |
| `chi`   |   `\chi`  |
| `epsilon`   |   `\epsilon`  |
| `varepsilon`   |   `\varepsilon`  |
| `eta`   |   `\eta`  |
| `gamma`   |   `\gamma`  |
| `Gamma`   |   `\Gamma`  |
| `iota`   |   `\iota`  |
| `kappa`   |   `\kappa`  |
| `lambda`   |   `\lambda`  |
| `Lambda`   |   `\Lambda`  |
| `mu`   |   `\mu`  |
| `nu`   |   `\nu`  |
| `µ`   |   `\mu  |    
| `phi`   |   `\phi`  |
| `Phi`   |   `\Phi`  |
| `varphi`   |   `\varphi`  |
| `psi`   |   `\psi`  |
| `Psi`   |   `\Psi`  |
| `rho`   |   `\rho`  |
| `sigma`   |   `\sigma`  |
| `Sigma`   |   `\Sigma`  |
| `tau`   |   `\tau`  |
| `vartheta`   |   `\vartheta`  |
| `upsilon`   |   `\upsilon`  |
| `xi`   |   `\xi`  |
| `Xi`   |   `\Xi`  |
| `zeta`   |   `\zeta`  |
| `omega`   |   `\omega`  |
| `Omega`   |   `\Omega`  |
| `Ω`   |   `\omega  |  


#### MORE FUNCTIONS
| Input         | Result        |
| ------------- |:-------------:|
| `liminf`   |   `\mathop{lim~inf}\\limits_{#?}`  |
| `limsup`   |   `\mathop{lim~sup}\\limits_{#?}`  |
| `argmin`   |   `\mathop{arg~min}\\limits_{#?}`  |
| `argmax`   |   `\mathop{arg~max}\\limits_{#?}`  |
| `det`   |   `\det`  |
| `mod`   |   `\mod`  |
| `max`   |   `\max`  |
| `min`   |   `\min`  |
| `erf`   |   `\mathop{erf}`  |
| `erfc`   |   `\mathop{erfc}`  |
| `bessel`   |   `\mathop{bessel}`  |
| `mean`   |   `\mathop{mean}`  |
| `median`   |   `\mathop{median}`  |
| `fft`   |   `\mathop{fft}`  |
| `lcm`   |   `\mathop{lcm}`  |
| `gcd`   |   `\mathop{gcd}`  |
| `randomReal`   |   `\mathop{randomReal}`  |
| `randomInteger`   |   `\mathop{randomInteger}`  |

#### UNITS
| Input         | Result        |
| ------------- |:-------------:|
| `mm`   |   `\mathop{mm}`  |        
| `cm`   |   `\mathop{cm}`  |         
| `km`   |   `\mathop{km}`  |         
| `kg`   |   `\mathop{kg}`  |         
    

#### More Logic
| Input         | Result        |
| ------------- |:-------------:|
| `forall`   |   `\forall`  |
| `exists`   |   `\exists`  |
| `!exists`   |   `\nexists`  |
| `:.`   |   `\therefore`  |

#### Arrows
| Input         | Result        |
| ------------- |:-------------:|
| `...`   |   `\ldots  |          
| `+...':                 '+\\cdots`  |
| `-...':                 '-\\cdots`  |
| `->...`   |   `\to\\cdots`  |
| `->`   |   `\to`  |
| `|->`   |   `\mapsto`  |
| `-->`   |   `\longrightarrow`  |
| `<--`   |   `\longleftarrow`  |
| `=>`   |   `\Rightarrow`  |
| `==>`   |   `\Longrightarrow`  |
| `<=>`   |   `\Leftrightarrow`  |
| `<->`   |   `\leftrightarrow`  |
| `<<`   |   `\ll`  |
| `>>`   |   `\gg`  |



#### Misc
| Input         | Result        |
| ------------- |:-------------:|
| `(.)`   |   `\odot`  |
| `(+)`   |   `\oplus  |      
| `(-)`   |   `\ominus`  |
| `(/)`   |   `\oslash`  |
| `(*)`   |   `\otimes`  |
| `||`   |   `\Vert`  |
| `{`   |   `\{`  |
| `}`   |   `\}`  |


### MathASCII Inline Shortcuts
[MathASCII](https://github.com/asciimath/asciimathml/blob/master/ASCIIMathML.js) defines a series of shortcuts that can be typed with ASCII characters to 
represent mathematical symbols and expressions.

The most common MathASCII shortcuts are part of the default inline shortcuts.
To support additional MathASCII shortcuts, add them to the `inlineShortcuts` 
setting.

```javascript
inlineShortcuts: {
    //
    // ASCIIIMath
    //
   // Binary operation symbols
    '*': '\cdot',
    '**': '\ast',
    '***': '\star',
    '//': '\slash',
    '\\\\': '\backslash',
    'setminus': '\backslash',
    '|><': '\ltimes',
    '><|': '\rtimes',
    '|><|': '\bowtie',
    '-:': '\div',
    'divide': '\div',
    '@': '\circ',
    'o+': '\oplus',
    'ox': '\otimes',
    'o.': '\odot',
    '^^': '\wedge',
    '^^^': '\bigwedge',
    'vv': '\vee',
    'vvv': '\bigvee',
    'nn': '\cap',
    'nnn': '\bigcap',
    'uu': '\cup',
    'uuu': '\bigcup',

    // Binary relation symbols
    '-=': '\equiv',
    '~=': '\cong',
    'lt':                   '<',
    'lt=': '\leq',
    'gt':                   '>',
    'gt=': '\geq',
    '-<': '\prec',
    '-lt': '\prec',
    '-<=': '\preceq',
    // '>-': '\succ',
    '>-=': '\succeq', 
    'prop': '\propto', 
    'diamond': '\diamond',
    'square': '\square',
    'iff': '\iff',

    'sub': '\subset',
    'sup': '\supset',
    'sube': '\subseteq',
    'supe': '\supseteq',
    'uarr': '\uparrow',
    'darr': '\downarrow',
    'rarr': '\rightarrow',
    'rArr': '\Rightarrow',
    'larr': '\leftarrow',
    'lArr': '\Leftarrow',
    'harr': '\leftrightarrow',
    'hArr': '\Leftrightarrow',
    'aleph': '\aleph',

    // Logic
    'and': '\land',
    'or': '\lor',
    'not': '\neg',
    '_|_': '\bot',
    'TT': '\top',
    '|--': '\vdash',
    '|==': '\models',
    
    // Other functions
    '|__': '\lfloor',
    '__|': '\rfloor',

    '|~': '\lceiling',
    '~|': '\rceiling',

    // Arrows
    '>->': '\rightarrowtail',
    '->>': '\twoheadrightarrow',
    '>->>': '\twoheadrightarrowtail'
    },
```