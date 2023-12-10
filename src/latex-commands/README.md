# `src/core-definitions/`

This directory contains the definitions of the supported LaTeX commands.

A definition specify how to interpret each LaTeX command, either:

- `createAtom` which "atom" (layout primitives) to use to render it or
- `applyStyle` how to modify the current rendering context (color, size, etc...)
- `applyMode` what the mode ('math', 'text') should be changed to

In addition, some additional information such as the number and type of optional
(in square brackets) and required (in curly brackets) arguments to the LaTeX
command is provided.
