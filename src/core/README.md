# `src/core/`

This directory contains the code necessary to parse and render Latex (but not
edit it).

It uses the definitions of Latex commands in the `core-definitions/` directory
to interpret the commands in the Latex input, and the layout primitives in
`core-atoms/` to render it to `Span` objects (virtual DOM nodes) which are
then renderer to HTML/SVG markup.
