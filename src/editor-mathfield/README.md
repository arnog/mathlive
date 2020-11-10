# `src/editor-mathfield/`

This directory contains the code to handle user interactions with the
mathfield, including with a mouse or touch (`pointer-input.ts`) and keyboard
(`keyboard-input.ts`).

The `MathfieldPrivate` class interacts with the Model (which keeps track of
the state of the Mathfield) and with the core to turn the data in the model
into HTML/SVG markup.
