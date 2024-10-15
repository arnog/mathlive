# Mathfield Architecture

## Overview

- Glyphs The basic building blocks of the mathfield are glyphs. A glyph is a
  visual representation of a character or symbol. Glyphs can be combined to form
  more complex structures, such as fractions, radicals, accents, etc...

  Glyphs are encoded using the Unicode standard, and are rendered using a font
  that supports the Math OpenType layout.

  Some LaTeX commands are represented by a single glyph, such as `\alpha`,
  `\subeq`, etc...

- Data Model  
  The data model is a tree structure that represents the content of the
  mathfield.

  The data model also includes a set of properties that describe the state of
  the mathfield, such as the selection, the insertion point, the current mode,
  etc...

  The data model includes the following types of nodes:

  - `text` nodes, which represent text content
  - `mathlist` nodes, which represent mathematical content as a sequence of
    symbols and nodes
  - `command` nodes, which represent commands
  - `placeholder` nodes, which represent placeholders
  - `error` nodes, which represent errors
  - `space` nodes, which represent spacing
  - `line` nodes, which represent line breaks
  - `box` nodes, which represent boxes
  - `rule` nodes, which represent rules
  - `genfrac` nodes, which represent general fractions
  - `surd` nodes, which represent square roots
  - `accent` nodes, which represent accents
  - `overunder` nodes, which represent over and under scripts
  - `delim` nodes, which represent delimiters. These include paired delimiters
  - (i.e. `\left`, `\right` commands).
  - `table` nodes, which represent tables (arrays, matrix, etc...)

  The data model is used to render the mathfield by generating a LaTeX render
  tree (or other render tree) and to serialize the content of the mathfield to a
  LaTeX string, MathASCII or MathJSON.

- Render Tree The render tree is a tree structure that represents the visual
  rendering of the mathfield. It is generated from the data model and is used to
  render the mathfield on the screen.

  It includes geometric information such as the position and size of each
  element, as well as the visual representation of each element.

  The nodes in the render tree can inherit properties from their parent nodes,
  such as the color, font, size, etc...

  The render tree can generate a rendering of the mathfield as a DOM tree, a
  canvas, a SVG or MathML tree.

  Some of the nodes in the render tree are:

  - `vbox` nodes, which represent boxes stacked vertically
  - `hbox` nodes, which represent boxes stacked horizontally, aligned on the
    baseline
  - `glyph` nodes, which represent a single character/symbol

- Input Handlers The input handlers are responsible for processing input events
  and updating the data model accordingly. They include handlers for:

  - Pointer Input
  - Keyboard Input
  - Virtual Keyboard

  This also includes utilities to handle inline shortcuts (used by both the
  keyboard and the virtual keyboard). Keyboard shortcuts are also handled as
  part of the keyboard input.
