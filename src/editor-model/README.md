# `src/editor-model/`

This directory contains the code for the `ModelPrivate` class. The class
implementation is divided up across multiple source files (`delete`, `insert`,
`find`, etc...).

The model is the abstract representation of the state of the mathfield,
including its content (as a tree of `Atom`s) and the state of the selection.
