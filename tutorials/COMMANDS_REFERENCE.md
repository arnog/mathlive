MathLive supports over 700 standard TeX and LaTeX commands and includes a few
non-standard extensions which are documented here.

## `\enclose`
The `\enclose` command renders its content inside some decorating marks called
**notations**.

> This command is an extension to LaTeX that follows the `<menclose>` definition
> of [MathML]() and the LaTeX flavored defined by MathJax.

It accepts three arguments, two of which are required:

```tex
    \enclose{notation:text}[style:text]{body:math}
```
* `notation` a list of whitespace delimited values. Acceptable values are:
    * `box`
    * `roundedbox`
    * `circle`
    * `top`, `left`, `right` and `bottom`
    * `horizontalstrike`, `verticalstrike`
    * `updiagonalstrike`, `downdiagonalstrike`
    * `updiagonalarrow`
    * `phasorangle`
    * `radical`
    * `longdiv`
    * `actuarial`
    * `madruwb`
* `style` an optional list of comma separated attributes including:
    * `mathbackground="<color>"` background color of the expression
    * `mathcolor="<color>"` color of the notation, for example "`red`" or 
    `"#cd0030"`
    * `padding="<dimension>"` `"auto"` or an amount of padding around the 
    content
    * `shadow="<shadow>"`: `"auto"` or `"none"` or a CSS `box-shadow` expression 
    for example, `"0 0 2px rgba(0, 0, 0, 0.5)"`.
    * in addition the style property can include a stroke style expression that 
    follows the shorthand syntax of the CSS `border` property, for example 
    `"2px solid red"`.
* `body` a math expression that is "enclosed" by the specified notations

### Examples
```tex
    \enclose{updiagonalstrike downdiagonalstrike}[2px solid red]{42}

    \enclose{circle}[mathbackground="#fbc0bd"]{\frac1x}

    \enclose{roundedbox}[1px dotted #cd0030]{\frac{x^2+y^2}{\sqrt{x^2+y^2}}}
```