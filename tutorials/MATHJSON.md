# The MathJSON Format

The MathJSON format is a lightweight data interchange format for mathematical notation.

It is human-readable, while being easy for machines to generate and parse.

It is built on the JSON [1] format. Its focus is on interoperability between
software programs to facilitate the exchange of mathematical data, as well as
the building of complex software through the integration of software components
communicating with a common format.

It is not suitable as a visual representation of arbitrary mathematical
notations, and as such is not a replacement for LaTeX or MathML.

## Examples

### Euler's Identity

In TeX

```tex
e^{\imaginaryI \pi }+1=0
```

In MathJSON:

```json
{
    "fn":"equal",
    "arg":[{
        "fn":"add",
            "arg":[{
                "sym":"e",
                    "sup":{
                        "fn":"multiply",
                        "arg":[{"sym": "ⅈ"},{sym:"π"}]
                    }
                },
                {"num": "1"}
            ]
        },
        "num": "0"
    ]
}
```

### An approximation of Pi

```tex
\frac {63}{25}\times \frac {17+15\sqrt{5}}{7+15\sqrt{5}}
```

```JSON
{"fn":"multiply",
    "arg":[
        {"fn":"divide","arg":[{"num":"63"},{"num":"25"}]},
        {"fn":"divide","arg":[
            {"fn":"add","arg":[
                {"num":"17"},
                {"fn":"multiply","arg":[{"num":"15"},{"fn":"sqrt","arg":[{"num":"5"}]}]}
            ]},
            {"fn":"add","arg":[
                {"num":"7"},
                {"fn":"multiply","arg":[
                    {"num":"15"},
                    {"fn":"sqrt","arg":[
                        {"num":"5"}
                    ]}
                ]}
            ]}
        ]}
    ]
}
```

## Design Goals

### Definitions

-   **producer** software that generates a MathJSON data structure
-   **consumer** software that parses and acts on a MathJSON data structure

### Goals

-   Easy to consume, even if that's at the expense of complexity to generate.
-   Extensibility. It should be possible to add information to the data structure
    that can help its interpretation or its rendition. This information should be
    optional and can be ignored by any consumer.

### Non-goals

-   Be suitable as an internal data structure
-   Be suitable as a display format
-   Capture complete semantic information with no ambiguity and in a self-sufficient manner.

## Encoding

A MathJSON expression is an [abstract syntax tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
encoded as a JSON object.

The root element is an `expression`, with child nodes according
to the grammar below.

### Basic Number

A basic number is encoded following the JSON grammar, with the following extensions:

-   support for arbitrary precision numbers. JavaScript and many other languages
    only support limited precision numbers, generally 52-bit integers (about 15 digits).
    Therefore to support arbitrary precision, numbers should always be represented
    as a quoted string.
-   support for `NaN` and `infinity`

`basic-number` := `'"NaN"'` | `infinity` | `'"'` [`'-'`] `int` [ `frac`][ `exp` ]`'"'`

`infinity` := `'"'` [`'+'` | `'-'`] `'Infinity'` `'"'`

`int` := `'0'` | [ `'0'` - `'9'` ]\*

`frac` := `'.'` (`'0'` - `'9'`)\*

`exp` := [`'e'` | `'E'`][`'+'` | `'-'`] (`'0'` - `'9'` )\*

### Native Strings

Native strings are a sequence of Unicode characters.

MATSON producing software should not generate character entities in
strings.

As per JSON, any Unicode character may be escaped using a `\u` escape sequence.

Whenever applicable, a specific Unicode symbol should be used.

For example, the set of complex numbers should be represented with U+2102 ℂ,
not with U+0043 C and a math variant styling attribute.

See [Unicode Chapter 22 - Symbols](http://www.unicode.org/versions/Unicode10.0.0/ch22.pdf)

> When used with markup languages—for example, with Mathematical Markup Language
> (MathML)—the characters are expected to be used directly, instead of indirectly via
> entity references or by composing them from base letters and style markup.

### Optional keys

All nodes may have the following keys:

-   `sub`: `expression`, a subscript
-   `sup`: `expression`, a superscript
-   `comment`: A human readable string to annotate an expression, since JSON does not allow comments in its encoding
-   `error`: A human readable string that can be used to indicate a syntax error or other problem when parsing or evaluating an expression.
-   `latex`: A visual representation in LaTeX of the expression. This can be useful to preserve non-semantic details, for example parentheses in an expression or
    styling attributes.
-   `mathml`: A visual representation in MathML of the expression.
-   `class`: A CSS class to be associated with a representation of this node
-   `id`: A CSS id to be associated with a representation of this node
-   `style`: A CSS style string
-   `wikidata`: A short string indicating an entry in a wikibase. For example,
    `"Q2111"`
-   `wikibase`: A base URL for the wikidata key. A full URL can be produced
    by concatenating this key with the wikidata key. This key applies to
    this node and all its children. The default value is "https://www.wikidata.org/wiki/"
-   `openmathcd`: A base URL for an OpenMath content dictionary. This key applies to
    this node and all its children. The default value is "http://www.openmath.org/cd".
-   `openmathsymbol`: A short string indicating an entry in an OpenMath Content
    Dictionary. For example: `arith1/#abs`.

### Key order

The order of the keys in a node is not significant.

All these expressions are equivalent:

```JSON
   {"fn":"add", "arg":[{num:"1"}, {num:"2"}]}
   {"arg":[{num:"1"}, {num:"2"}], "fn":"add"}
```

However, the order of the elements in an array _is_ significant.

These two expressions are _not_ equivalent:

```JSON
   {"fn":"divide", "arg":[{num:"3"}, {num:"1"}]}
   {"fn":"divide", "arg":[{num:"3"}, {num:"1"}]}
```

## Grammar

An expression is an Abstract Syntax Tree. As such, there is no need to
introduce parentheses or to resort to operator precedence in order to parse
the expression correctly.

The type of each node is indicated by the presence of a specific key, for example `sym` for the "symbol" node or `fn` for the "function" node.

There are five types of nodes:

`expression` := `number` |
`symbol` |
`function` |
`group` |
`text` |

### `number`

A node with the following key:

-   `num`: `basic-number` | `complex-number`

`complex-number` := { "re": `basic-number`, "im": `basic-number`}

### `symbol`

A node with the following keys

-   `sym`: `native-string`
-   `type`: native-string`, the data type of the symbol. See table below.
-   `index`: A 0-based index into a vector or array. An index can be a number or an array of numbers.
-   `accent`: `string`, a modifier applied to a symbol, such as "hat" or "bar".

The `sym` key is the only required key.

#### Type

The data type of a symbol can be used to refine the interpretation of operations
performed upon it.

| Data Type  | Value        | Meanings                                                                |
| ---------- | :----------- | :---------------------------------------------------------------------- |
| Scalar     | `scalar`     | scalar number                                                           |
| Complex    | `complex`    | complex number                                                          |
| Vector     | `vector`     | an element composed of n scalars or complex numbers                     |
| Matrix     | `matrix`     | an element composed of n vectors                                        |
| Function   | `function`   |
| String     | `string`     | an array of characters                                                  |
| Dictionary | `dictionary` | a collection of key/value pairs                                         |
| Boolean    | `boolean`    | true or false                                                           |
| Table      | `table`      | a two-dimensional array of cells. Each cell can be of a different type. |
| Date       | `date`       |
| Duration   | `duration`   |

#### Accent

An accent is a decoration over a symbol that provides the proper context to
interpret the symbol or modifies it in some way. For example, an accent can
indicate that a symbol is a vector, or to represent the mean, complex conjugate
or complement of the symbol.

The following values are recommended:

| Accent     |      Value      | Unicode | Possible Meanings                        |
| ---------- | :-------------: | ------: | ---------------------------------------- |
| Vector     | &#9676;&#x20d7; |  U+20d7 |
| Bar        | &#9676;&#x00af; |  U+00af | Mean, complex conjugate, set complement. |
| Hat        | &#9676;&#x005e; |  U+005e | Unit vector, estimator                   |
| Dot        | &#9676;&#x02d9; |  U+02d9 | Derivative with respect to time          |
| Double dot | &#9676;&#x00a8; |  U+00a8 | Second derivative with respect to time.  |
| Acute      | &#9676;&#x00b4; |  U+00b4 |
| Grave      | &#9676;&#x0060; |  U+0060 |
| Tilde      | &#9676;&#x007e; |  U+007e |
| Breve      | &#9676;&#x02d8; |  U+02d8 |
| Check      | &#9676;&#x02c7; |  U+02c7 |

### `function`

-   `fn`: `native-string`, the name of the function.
-   `arg`: array of `expression`, the arguments to the function.
-   `fence`: `string`, one to three characters indicating the delimiters used for the expression. The first character is the opening delimiter, the second character, if present, is the closing delimiter. The third character, if present, is the delimiters separating the arguments. If no value is provided for this key, the default value `(),` is used. The character `.` can be used to indicate the absence of a delimiter, for example `..;`.
-   `sub`: `expression`
-   `sup`: `expression`
-   `accent`: `native-string`, a single unicode character representing the accent
    to display over the function. See the SYMBOL section for more details.

The `fn` key is the only required key.

When using common functions, the following values are recommended:

| Name (and common synonyms) | Arity | Comment                                           |
| -------------------------- | :---- | :------------------------------------------------ |
| `add`                      | 2+    |
| `multiply`                 | 2+    |
| `subtract`                 | 2     | Subtract the second from the first.               |
| `divide`                   | 2     | The first argument divided by the second argument |
| `negate`                   | 1     | Negate the argument                               |
| `list`                     | 1+    | comma separated list                              |
| `list2`                    | 1+    | semi-colon separated list                         |

| Name (and common synonyms) | Arity | Comment                                                                                                                                                                                           |
| -------------------------- | :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Signum                     | 1     | -1 if the argument is negative, 0 if it is zero, 1 if it is positive; more generally, the intersection of the unit circle with the line from the origin through the argument in the complex plane |
| Exponential                | 1     | e to the power of the argument.                                                                                                                                                                   |
| Power                      | 2     | The first argument to the power of the second argument                                                                                                                                            |
| Square Root                | 1     |
| Root                       | 2     | The second argument is the degree of the root                                                                                                                                                     |
| Natural log                | 1     |
| Logarithm                  | 2     | The second argument is the base.                                                                                                                                                                  |
| `abs`                      | 1     | Absolute value                                                                                                                                                                                    |
| `min`                      | 2, n  | The smallest of the arguments                                                                                                                                                                     |
| `max`                      | 2, n  | The largest of the arguments                                                                                                                                                                      |
| `floor`                    | 1     | The largest integer less than or equal to the argument                                                                                                                                            |
| `ceiling`                  | 1     | The smallest integer greater than or equal to the argument                                                                                                                                        |
| `gcd`                      | 2     | Greatest Common Divisor                                                                                                                                                                           |
| `lcm`                      | 2     | Least Common Multiple                                                                                                                                                                             |
| `compose`                  | 2, n  |

#### Complex Arithmetic

| Name      | Value       | Arity | Comment                   |
| --------- | :---------- | :---- | :------------------------ |
| Conjugate | `+`         | 1     | Conjugate of the argument |
| Real      | `real`      | 1     |
| Imaginary | `imaginary` | 1     |
| Argument  | `arg`       | 1     |

#### Logic

| Name                                  | Value    | Arity | Comment |
| ------------------------------------- | :------- | :---- | :------ |
| Implies                               |
| Logical equivalence                   |
| For All (universal quantifier)        | `forall` |
| There Exists (existential quantifier) | `exists` |

There Does Not Exists

#### Trigonometry

Note that for inverse functions, no assumptions is made about the branch
cuts of those functions. The interpretation is left up to the consuming software.

| Name (and common synonyms)       | Value       | Arity | Comment                                 |
| -------------------------------- | :---------- | :---- | :-------------------------------------- |
| Cosine                           | `cos`       | 1     | angle in radians                        |
| Sin                              | `sin`       | 1     | angle in radians                        |
| Tangent (tan, tg)                | `tan`       | 1     | angle in radians                        |
| Co-tangent (cot, ctg, cotg, ctn) | `cotangent` | 1     |
| Secant                           | `sec`       | 1     |
| Cosecant                         | `csc`       | 1     |
| Arc cosine                       | `acos`      | 1     | angle in radians                        |
| Arc sine                         | `asin`      | 1     | angle in radians                        |
| Arctangent (arctan, arctg)       | `atan`      | 1     | angle in radians                        |
| Arctangent (arctan, arctg)       | `atan`      | 2     | See https://en.wikipedia.org/wiki/Atan2 |
| Arc-cotangent                    | `arccot`    | 1     |
| Arc-secant                       | `arcsec`    | 1     |
| Arc-cosecant                     | `arccsc`    | 1     |
| Hyperbolic tangent (th, tan)     | `tanh`      | 1     |

#### Relational operators

| Operation                |  Value   | Comment                                |
| ------------------------ | :------: | -------------------------------------- |
| Equal to                 | `equal`  | General purpose equality               |
| Less than                |   `lt`   |
| Less than or equal to    |   `le`   |
| Greater than             |   `gt`   |
| Greater than or equal to |   `ge`   |
| Much less than           |   `ll`   | `x ≪ y`                                |
| Much greater than        |   `gg`   | `y ≫ x`                                |
| Definition/assignment    | `assign` | Used with `a := 5` or `f(x) := sin(x)` |
| Identity                 |  `:=:`   | Used with `1 + 1 :=: 2`                |
| Approximately equal to   | `approx` | Used with `π ≈ 3.14`                   |
| Not equal to             |   `ne`   |
| Similar to               |  `sim`   | `2 ~ 5`                                |
| Congruent to             |  `cong`  | `A ≅ B`                                |

There are three semantically distinct use for "equal to" which are often all represented with `=` in mathematical notation:

-   **conditional equality**: the expression is true when the left hand side and the right hand side are equal, for example when defining a curve representing the unit circle: `x^2 + y^2 = 1`
-   **definition** or assignment: the symbol (or expression) on the left hand side is defined by the expression on the right hand side. For example `f(x) := sin x`, `a := 5`
-   **identity**: the right hand side expression is a syntactic derivation from the left hand size expression. For example, `1 + 1 :=: 2`

When a more specific version cannot be determined from the context, the
general purpose `equal` function should be used.

#### Big operators

Big operators, such as ∑, "sum", and ∏, "product", are represented as a function
with the following arguments:

-   first argument: body of the operation
-   second argument (optional): inferior argument of the operation
-   third argument (optional): superior argument of the operation

For example:

```tex
\sum ^n_{i=0}i
```

```json
{
    "fn": "sum",
    "arg": [{ "sym": "i" }, { "fn": "=", "arg": ["i", 0] }, { "sym": "n" }]
}
```

If necessary, an empty argument can be represented by an empty structure.

The following values should be used to represent these common big operators:

| Operation        | Value              | Comment  |
| ---------------- | :----------------- | :------- |
| Sum              | `sum`              | ∑ U+2211 |
| Product          | `product`          | ∏ U+220f |
| Intersection     | `intersection`     | ⋂ U+22c2 |
| Union            | `union`            | ⋃ U+22c3 |
| Integral         | `integral`         | ∫ U+222b |
| Double integral  | `integral2`        | ∬ U+222c |
| Triple integral  | `integral3`        | ∭ U+222d |
| Contour integral | `contour_integral` | ∮ U+222e |
| Circle Plus      | `circle_plus`      | U+2a01   |
| Circle Times     | `circle_times`     | U+2a02   |
| And              | `n_and`            | U+22c1   |
| Or               | `n_or`             | U+22c0   |
| Coproduct        | `coproduct`        | ∐ U+2210 |
| Square cup       | `square_cup`       | U+2a06   |
| U plus           | `union_plus`       | U+2a04   |
| O dot            | `odot`             | U+2a00   |

#### Special Functions

These functions represent higher order data structures and operations common
in algebraic manipulation systems.

-   **bind** first argument is an expression, argument 2n is an identifier,
    argument 2n+1 is the value the identifier should be replaced with.

Argument 2n+1 can be a number, an expression, an array representing a list of
values, or a range. If an array or a range, the result is an array of expression.

For example:

```json
{
    "fn": "bind",
    "arg": [
        {
            "fn": "+",
            "arg": [
                { "sym": "x", "sup": 2 },
                { "fn": "*", "arg": [2, "x"] }
            ]
        },
        "x",
        "1"
    ]
}
```

would replace the `x`in the expression with `1`.

-   **solve** first argument is an expression. Return an array of identifier and
    their value. The first argument can be an array representing a system of equations.

*   **range** first argument is the start of the range, second argument is the end
    of the third. The third argument is optional and represent the step between
    elements of the range. If none is provided, the step is 1.

*   **`block`** the arguments are a list of expressions, such as in a system of
    equations.

*   **`case`** the arguments are a list of conditional expressions, such as in a
    piecewise definition of a function. Arguments 2n-1 are the expression, and 2n
    are the condition. The last condition is optional and the last value is
    applied if no other condition match.

#### Other functions

| Operation        | Value        | Comment |
| ---------------- | :----------- | :------ |
| Factorial        | `factorial`  | `!`     |
| Double factorial | `factorial2` | `!!`    |

Additional functions can be specified using an OpenMath content dictionary. For example, Euler's gamma function:

```json
{
    "fn": "gamma",
    "openmathsymbol": "hypergeo0#gamma",
    "arg": 1
}
```

If an `openmathsymbol` key is present it overrides the value of the `fn` key as far as the semantic of the operation is concerned. However, the `fn` key can still be used to display information about this expression to a user. For example:

```json
{
    "fn": "\u0393",
    "openmathsymbol": "hypergeo0#gamma",
    "arg": 1
}
```

where `\u0393` is the Unicode character `GREEK CAPITAL LETTER GAMMA` Γ.

### `group`

-   `group`: `expression`
-   `sup`: `expression`
-   `sub`: `expression`
-   `accent`: `string`

The `group` key is the only one required.

This element is used when a `sup`, `sub` or `accent` needs to be applied to an expression, as in `(x+1)^2`.

### `text`

-   `text`: `native-string`
-   `format`: "plain" | "markdown" | "html". This key is optional and its default value is `plain`

The `text` key is the only one required.

### OPEN QUESTIONS

1. How should exponents be represented? I.e. `x^2` or `A^\dagger`. They could literally be represented with a `sup` attribute, or as an explicit function, i.e. `fn:'pow'` or `fn:'transjugate'`
2. Clarify how to represent variants for multiplications, e.g. `a \times b`, `a . b`, `a * b`, `ab`, etc...
3. How to encode logarithm and exponential (see 1.)
4. What should the effect of n-ary versions of divide, substract? One option is to apply a left-reduce to the arguments.
5. How should accents (i.e. arrow over symbol) be encoded? As an additional property? As a function? How about other stylistic variant (i.e. bold symbol, fraktur, blackboard, etc...)
6. Should there be a node type to represent conditions, i.e. expressions whose value is a boolean.
7. For functions defined with an openmath identifier, the value of the `fn` key could be the openmath identifier, i.e. `fn:"hypergeo0#gamma"`

### REFERENCES

1. https://www.json.org/
2. http://www.openmath.org/cd
