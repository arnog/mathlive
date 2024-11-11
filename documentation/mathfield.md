# Mathfield Architecture

## Overview

Each capability of the mathfield is provided through dependency injection. Thus
the mathfield can be configured or built minimally depending on the
requirements. For example, a readonly, non-editable mathfield, or a mathfield
without a virtual keyboard, or a mathfield that renders as SVG.

The capabilities include:

- rendering
- input handling
- completion

Each new atom type must be handled by

- rendering handlers
- navigation (enumerates the insertion points)
- pointer handling (hitbox)

## Glyphs

The basic building blocks of the mathfield are glyphs. A glyph is a visual
representation of a character or symbol. Glyphs can be combined to form more
complex structures, such as fractions, radicals, accents, etc...

Glyphs are encoded using the Unicode standard, and are rendered using a font
that supports the Math OpenType layout.

Some LaTeX commands are represented by a single glyph, such as `\alpha`,
`\subeq`, etc...

## Data Model

The data model is a tree structure that represents the content of the mathfield.

The data model also includes a set of properties that describe the state of the
mathfield, such as the insertion point, the current mode, etc...

When the data model is modified, an event is dispatched. This includes when
content, selection or style is changed. An accessibility plugin also listen for
those events and announce them as necessary. State change event include
`willChange` and `didChange` (to support cancelation).

The nodes include some common attributes including:

- hspace: when laying out nodes horizontally, the amount of space between them
  is determined based on their hspace ('op', 'bin', 'rel', etc...). The hspace
  is either 'default' (in which case it is determined based on the glyph or kind
  of the node), or a specific value if it has been overriden (i.e. with
  `\mathrel`, etc...)
- color/background color
- variant (double-struck, calligraphic, etc...)
- weight: ultra-light, extra-light, light, bold, extra-bold, ultra-bold, normal,
- shape: italic, slanted, normal
- fontsize
- font-family: roman, sans-serif, monospace, etc...

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

The data model is used to render the mathfield by generating a LaTeX render tree
(or other render tree) and to serialize the content of the mathfield to a LaTeX
string, MathASCII or MathJSON.

## Render Tree

The render tree is a tree structure that represents the visual rendering of the
mathfield. It is generated from the data model and is used to render the
mathfield on the screen.

It includes geometric information such as the position and size of each element,
as well as the visual representation of each element.

The nodes in the render tree can inherit properties from their parent nodes,
such as the color, font, size, etc...

The render tree can generate a rendering of the mathfield as a DOM tree, a
canvas, a SVG or MathML tree.

Some of the nodes in the render tree are:

- `vbox` nodes, which represent boxes stacked vertically
- `hbox` nodes, which represent boxes stacked horizontally, aligned on the
  baseline
- `glyph` nodes, which represent a single character/symbol

The output of the render tree must be passed to the hitbox handler.

## Input Handlers

The input handlers are responsible for processing input events and updating the
data model accordingly. They include handlers for:

- Pointer Input
- Keyboard Input
- Virtual Keyboard

Keyboard shortcuts are also handled as part of the keyboard input.

Inline shortcuts (used by both the keyboard and the virtual keyboard) may be
handled as completions.

## Completion

A completion is a subexpression that is a guess as to what the user might want
to type next. There can be multiple completion handlers, ordered. These include:

- closing delimiter (if there is an open delimiter in the current mathlist)
- inline shortcuts (if the preceding characters input match the beginning of an
  inline shortcut)
- result (if the last character is an = sign, the evaluation of the expression
  from the start of the expression to the = sign)

Completions are validated with 'space', dismissed with 'esc'.
