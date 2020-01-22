MathLive supports over 700 standard TeX and LaTeX commands and includes a few
non-standard extensions which are documented here.

# Decorations

## `\enclose`, `\cancel`, `\bcancel` and `\xcancel`

These commands render some decorating marks called **notations** on top of
their content. They can be used to highlight part of an expression, or
to indicate an expression has been canceled with a strike mark.

> **Note** `\enclose` is an extension to LaTeX that follows the `<menclose>` definition
> of [MathML]() and the LaTeX flavor defined by MathJax.

> **Note** The `\cancel`, `\bcancel` and `\xcancel` commands are part of the
> ["cancel"](https://www.ctan.org/pkg/cancel) LaTeX package.

### `\enclose`

The `\enclose` command is the most flexible. It accepts three arguments, two
of which are required:

```tex
    \enclose{notation:text}[style:text]{body:math}
```

-   `notation` a list of whitespace delimited values. Acceptable values are:
    -   `box`
    -   `roundedbox`
    -   `circle`
    -   `top`, `left`, `right` and `bottom`
    -   `horizontalstrike`, `verticalstrike`
    -   `updiagonalstrike`, `downdiagonalstrike`
    -   `updiagonalarrow`
    -   `phasorangle`
    -   `radical`
    -   `longdiv`
    -   `actuarial`
    -   `madruwb`
-   `style` an optional list of comma separated attributes including:
    -   `mathbackground="<color>"` background color of the expression
    -   `mathcolor="<color>"` color of the notation, for example `red` or
        `#cd0030` or `rgba(205, 0, 11, .4)`.
    -   `padding="<dimension>"` `"auto"` or an amount of padding around the
        content
    -   `shadow="<shadow>"`: `"auto"` or `"none"` or a CSS `box-shadow` expression
        for example, `"0 0 2px rgba(0, 0, 0, 0.5)"`.
    -   in addition the style property can include a stroke style expression that
        follows the shorthand syntax of the CSS `border` property, for example
        `"2px solid red"`.
-   `body` a math expression that is "enclosed" by the specified notations

### `\cancel`, `\bcancel` and `\xcancel`

| Command...       | is a shorthand for...                                 |
| :--------------- | :---------------------------------------------------- |
| `\cancel{body}`  | `\enclose{updiagonalstrike}{body}`                    |
| `\bcancel{body}` | `\enclose{downdiagonalstrike}{body}`                  |
| `\xcancel{body}` | `\enclose{updiagonalstrike downdiagonalstrike}{body}` |

### Examples

```tex
    \enclose{updiagonalstrike downdiagonalstrike}[4px solid rgba(205, 0, 11, .4)]{42}
```

<script type="math/tex">
    \enclose{updiagonalstrike downdiagonalstrike}[4px solid rgba(205, 0, 11, .4)]{42}
</script>

```tex
    \xcancel{42}
```

<script type="math/tex">
    \xcancel{42}
</script>

```tex
    \enclose{circle}[mathbackground="#fbc0bd"]{\frac1x}
```

<script type="math/tex">
    \enclose{circle}[mathbackground="#fbc0bd"]{\frac1x}
</script>

```tex
    \enclose{roundedbox}[1px dotted #cd0030]{\frac{x^2+y^2}{\sqrt{x^2+y^2}}}
```

<script type="math/tex">
    \enclose{roundedbox}[1px dotted #cd0030]{\frac{x^2+y^2}{\sqrt{x^2+y^2}}}
</script>

---
