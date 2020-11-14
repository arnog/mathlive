# `src`

This directory contains all the source files for MathLive.

-   `src/public`: The TypeScript declaration files for the public API
-   `src/core`: The rendering engine that parses Latex and turns it into HTML
    markup
-   `src/core-atoms`: Code to render and generate latex for each kind of
    mathematical layout objects (fractions, delimiters, arrays, etc...)
-   `src/core-definitions`: Definitions of the supported Latex commands,
    interpreting their arguments and mapping them to appropriate atoms
-   `src/editor`: Some utilities to handle specific features of the editor:
    virtual keyboard, localization, keybindings, etc...
-   `src/editor-mathfield`: The interactive component of MathLive that deals
    with keyboard and pointer input and all the UI to edit a formula
-   `src/editor-model`: An object representing the state of the math expression
    including its content (a tree of atoms) and the selection, along with the
    code necessary to modify it
-   `src/addons`: Miscellaneous
