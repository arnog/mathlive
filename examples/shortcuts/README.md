# Key Bindings and Inline Shortcuts

MathLive.js supports two methods to speed up input using a physical keyboard.

-   key bindings
-   inline shortcuts

## Key bindings

Key bindings are typically a combination of keys pressed simultaneously that
triggers a command.

For example, pressing `alt/option` and the `V` key at the same time will insert
a square root. Pressing `ctrl/cmd` and the `Z` key at the same time will undo
the last command.

MathLive has an extensive set of default key bindings. To override,
customize or add to the list of supported key bindings, provide an
appropriate handler as part of MathLive's configuration:

### **config.onKeystroke**: function(mathfield, keystroke: string, ev:Event)

Invoked when a keystroke is about to be processed.

-   `keystroke` is a string describing the keystroke, for example `Ctrl-KeyA`
-   `ev` is the native JavaScript keyboard event.

Return `false` to stop handling of the event, otherwise the default command
(if any) associated with this keystroke will be processed.

## Inline Shortcuts

An inline shortcut is a sequence of keystrokes typed on the keyboard that get
replaced with another symbol. Unlike keystroke shortcuts they cannot be used to
trigger a command.

For example, typing the `p` key followed by the `i` key will result in the \*_π_(`\pi`) symbol being inserted.

If a substitution was undesirable, use **undo** to revert to the raw input.

MathLive has some built-in inline shortcuts defined, but they can be replaced or
enhanced with new shortcuts.

### **config.overrideDefaultInlineShortcuts**: boolean=false

If `true` the default inline shortcuts are ignored.

Use this if you want to completely override (or turn off) the default inline shortcuts.

### **config.inlineShortcuts**: Object.<string, string>

A map of shortcuts → replacement value.

For example `{ 'pi': '\\pi'}`.

If `overrideDefaultInlineShortcuts` is false, these shortcuts are applied after any default ones, and can therefore override them.

A shortcut can also be specified with additional options:

```javascript
config.inlineShortcuts = {
    in: {
        mode: 'math',
        after: 'space+letter+digit+symbol+fence',
        value: '\\in',
    },
};
```

The `value` key is required an indicate the shortcut substitution.

The `mode` key, if present, indicate in which mode this shortcut should apply, either `'math'` or `'text'`. If the key is not present the shortcut apply in both modes.

The `'after'` key, if present, indicate in what context the shortcut should apply. One or more values can be specified, separated by a '+' sign. If any of the values match, the shortcut will be applicable. Possible values are:

-   `'space'` A spacing command, such as `\quad`
-   `'nothing'` The begining of a group
-   `'surd'` A square root or n-th root
-   `'frac'` A fraction
-   `'function'` A function such as `\sin` or `f`
-   `'letter'` A letter, such as `x` or `n`
-   `'digit'` `0` through `9`
-   `'binop'` A binary operator, such as `+`
-   `'relop'` A relational operator, such as `=`
-   `'punct'` A punctuation mark, such as `,`
-   `'array'` An array, such as a matrix or cases statement
-   `'openfence'` An opening fence, such as `(`
-   `'closefence'` A closing fence such as `}`
-   `'text'` Some plain text

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

### ASCIIMath Inline Shortcuts

[ASCIIMath](https://github.com/asciimath/asciimathml/blob/master/ASCIIMathML.js) defines a series of shortcuts that can be typed with ASCII characters to
represent mathematical symbols and expressions.

The most common ASCIIMath shortcuts are part of the default inline shortcuts.
To support additional ASCIIMath shortcuts, add them to the `inlineShortcuts`
setting.

```javascript
inlineShortcuts: {
    //
    // ASCIIIMath
    //
   // Binary operation symbols
    '*': '\\cdot',
    '**': '\\ast',
    '***': '\\star',
    '//': '\\slash',
    '\\\\\': '\\backslash',
    'setminus': '\\backslash',
    '|><': '\\ltimes',
    '><|': '\\rtimes',
    '|><|': '\\bowtie',
    '-:': '\\div',
    'divide': '\\div',
    '@': '\\circ',
    'o+': '\\oplus',
    'ox': '\\otimes',
    'o.': '\\odot',
    '^^': '\\wedge',
    '^^^': '\\bigwedge',
    'vv': '\\vee',
    'vvv': '\\bigvee',
    'nn': '\\cap',
    'nnn': '\\bigcap',
    'uu': '\\cup',
    'uuu': '\\bigcup',

    // Binary relation symbols
    '-=': '\\equiv',
    '~=': '\\cong',
    'lt':                   '<',
    'lt=': '\\leq',
    'gt':                   '>',
    'gt=': '\\geq',
    '-<': '\\prec',
    '-lt': '\\prec',
    '-<=': '\\preceq',
    // '>-': '\\succ',
    '>-=': '\\succeq',
    'prop': '\\propto',
    'diamond': '\\diamond',
    'square': '\\square',
    'iff': '\\iff',

    'sub': '\\subset',
    'sup': '\\supset',
    'sube': '\\subseteq',
    'supe': '\\supseteq',
    'uarr': '\\uparrow',
    'darr': '\\downarrow',
    'rarr': '\\rightarrow',
    'rArr': '\\Rightarrow',
    'larr': '\\leftarrow',
    'lArr': '\\Leftarrow',
    'harr': '\\leftrightarrow',
    'hArr': '\\Leftrightarrow',
    'aleph': '\\aleph',

    // Logic
    'and': '\\land',
    'or': '\\lor',
    'not': '\\neg',
    '_|_': '\\bot',
    'TT': '\\top',
    '|--': '\\vdash',
    '|==': '\\models',

    // Other functions
    '|__': '\\lfloor',
    '__|': '\\rfloor',

    '|~': '\\lceiling',
    '~|': '\\rceiling',

    // Arrows
    '>->': '\\rightarrowtail',
    '->>': '\\twoheadrightarrow',
    '>->>': '\\twoheadrightarrowtail'
    },
```
