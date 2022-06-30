# `src/core/`

This directory contains the code necessary to parse and render LaTeX (but not
edit it).

It uses the definitions of LaTeX commands in the `core-definitions/` directory
to interpret the commands in the LaTeX input, and the layout primitives in
`core-atoms/` to render it to `Box` objects (virtual DOM nodes) which are then
renderer to HTML/SVG markup.
