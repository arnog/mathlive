# `src/core-atoms/`

This directory contains the definition of each of the supported layout primitives.

Each layout primitive is a subclass of the base `Atom` class.

It typically provides override for the following methods:

-   `render()` return an array of `Span` (virtual DOM nodes) representing a
    specific instance of the atom.
-   `toLatex()` (optional) returns a Latex string representing the atom instance.
    The base `Atom` class defaults to producing the command name + the arguments in curly brackets, which is often, but not always, sufficient.
