# The MASTON Format

The **Math Abstract Syntax Tree Object Notation** is a lightweight data 
interchange format for mathematical notation.

It is human-readable, while being easy for machines to generate and parse.

It is built on the JSON [1] format. Its focus is on interoperability between 
software programs to facilitate the exchange of mathematical data, as well as 
the building of complex software through the integration of software components communicating with 
a common format.

It is not suitable as a visual representation of arbitrary mathematical 
notations, and as such is not a replacement for LaTeX or MathML.

## Examples

### Euler's Identity
In TeX
```tex
e^{\imaginaryI \pi }+1=0
```
In MASTON:
```JSON
    {
        "fn":"=",
        "arg":[{
            "fn":"+",
            "arg":[
                {
                    "sym":"e",
                    "sup":{
                        "fn":"*",
                        "arg":["ⅈ","π"]
                        }
                },
                1
            ]
        },
        0]
    }
```


### An approximation of Pi
```tex
\frac {63}{25}\times \frac {17+15\sqrt{5}}{7+15\sqrt{5}}
```

```JSON
{"fn":"*","arg":[{"fn":"/","arg":[63,25]},{"fn":"/","arg":[{"fn":"+","arg":[17,{"fn":"*","arg":[15,{"fn":"sqrt","arg":5}]}]},{"fn":"+","arg":[7,{"fn":"*","arg":[15,{"fn":"sqrt","arg":5}]}]}]}]}
```

## Design Goals

### Definitions
* **producer** software that generates a MASTON data structure
* **consumer** software that parses and acts on a MASTON data structure

### Goals
- Easy to consume, even if that's at the expense of complexity to generate.
- Extensibility. It should be possible to add information to the data structure
that can help its interpretation or its rendition. This information should be
optional and can be ignored by any consumer.

### Non-goals
- Be suitable as an internal data structure
- Be suitable as a display format
- Capture complete semantic information with no ambiguity and in a self-sufficient manner.


## Encoding

A MASTON expression is an [abstract syntax tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) 
encoded as a JSON object. 

The root element is an &langle;expression&rangle;, with child nodes according 
to the grammar below.



### Native Numbers

A native number is encoded following the JSON grammar, with two extensions:
* support for arbitrary precision numbers. The number of digits included may be
 more than supported by consuming software. The software can handle this 
 situation by either reading only as many digits as can be supported internally 
 or by treating it as an error.
* support for `NaN` and `infinity`

&langle;native-number&rangle; := `'"NaN"'` | &langle;native-infinity&rangle; | 
    [`'-'`] &langle;native-int&rangle; [ &langle;native-frac&rangle;] [ &langle;native-exp&rangle; ]

&langle;native-infinity&rangle; := `'"'` [`'+'` | `'-'`] `'infinity'` `'"'`

&langle;native-int&rangle; := `'0'` | [ `'1'` - `'9'` ]*

&langle;native-frac&rangle; := `'.'` (`'0'` - `'9'`)*

&langle;native-exp&rangle; := [`'e'` | `'E'`] [`'+'` | `'-'`] (`'0'` - `'9'` )*

### Native Strings
Native strings are a sequence of Unicode characters.

As per JSON, any Unicode character may be escaped using a `\u` escape sequence.

MATSON producing software should not generate character entities in 
strings.

Whenever applicable, a specific Unicode symbol should be used.

For example, the set of complex numbers should be represented with U+2102 ℂ,
not with U+0043 C and a math variant styling attribute.

See [Unicode Chapter 22 - Symbols](http://www.unicode.org/versions/Unicode10.0.0/ch22.pdf)

> When used with markup languages—for example, with Mathematical Markup Language
> (MathML)—the characters are expected to be used directly, instead of indirectly via
> entity references or by composing them from base letters and style markup.

### Optional keys
All elements may have the following keys:
* `comment`: A human readable string to annotate an expression, since JSON does not allow comments in its encoding
* `error`: A human readable string that can be used to indicate a syntax error or other problem when parsing or evaluating an expression.
* `latex`: A visual representation in LaTeX of the expression. This can be useful to preserve non-semantic details, for example parentheses in an expression.
* `mathml`: A visual representation in MathML of the expression.
* `class`: A CSS class to be associated with a representation of this element
* `id`: A CSS id to be associated with a representation of this element
* `style`: A CSS style string
* `wikidata`: A short string indicating an entry in a wikibase. For example, 
    `"Q2111"`
* `wikibase`: A base URL for the wikidata key. A full URL can be produced 
by concatenating this key with the wikidata key. This key applies to 
this element and all its children. The default value is "https://www.wikidata.org/wiki/"
* `openmathcd`: A base URL for an OpenMath content dictionary. This key applies to 
this element and all its children. The default value is "http://www.openmath.org/cd".
* `openmathsymbol`: A short string indicating an entry in an OpenMath Content
Dictionary. For example: `arith1/#abs`.

### Key order
The order of the keys in an element is not significant. That is, all these 
expressions are equivalent:

```JSON
   {"fn":"+", "arg":[1, 2]}
   {"arg":[1, 2], "fn":"+"}
```

Howeve, the order of the elements in an array *is* significant. These two
expressions are *not* equivalent:
```JSON
   {"fn":"-", "arg":[3, 1]}
   {"fn":"-", "arg":[1, 3]}
```

## Grammar

&langle;expression&rangle; := &langle;num&rangle; |
    &langle;complex&rangle; | 
    &langle;symbol&rangle; | 
    &langle;function&rangle; | 
    &langle;group&rangle; |
    &langle;range&rangle; |
    &langle;array&rangle; |
    &langle;dictionary&rangle; |
    &langle;text&rangle; |
    &langle;block&rangle;

An expression is an Abstract Syntax Tree. As such, there is no need to introduce parentheses or to resort to operator precedence in order to parse the expression correctly.

### &langle;num&rangle; 

A native number or an object with the following key
* `num`: &langle;native-number&rangle; or &langle;native-string&rangle;

**Note:** When only the `num` key is present a shortcut may be used by 
replacing the element with the number. That is, both representations are equivalent:
```JSON
   {"fn":"+", "arg":[{"num":1}, {"num":2}]}
   {"fn":"+", "arg":[1, 2]}
```

### &langle;complex&rangle;
* `re`: &langle;native-number&rangle;
* `im`: &langle;native-number&rangle;

### &langle;symbol&rangle;

A string or an object with the following keys
* `sym`: &langle;native-string&rangle;
* `type`: the data type of the symbol, as a string. See table below.
* `index`: A 0-based index into a vector or array. An index can be a number or an array of numbers.
* `accent`: &langle;string&rangle;, a single unicode character representing the accent to display over the symbol.

### Type

The data type of a symbol can be used to refine the interpretation of operations performed upon it.

 Data Type          | Value           |  Meanings
 -------------      |:--------------- |:----------
 Scalar             | `scalar`        | scalar number
 Complex            | `complex`       | complex number
 Vector             | `vector`        | an element composed of n scalars or complex numbers
 Matrix             | `matrix`        | an element composed of n vectors
 Function           | `function`
 String             | `string`        | an array of characters
 Dictionary         | `dictionary`    | a collection of key/value pairs
 Boolean            | `boolean`       | true or false
 Table              | `table         | a two-dimensional array of cells. Each cell can be of a different type.
 Date               | `date`          | 
 Duration           | `duration`      |

### Accent
An accent is a decoration over a symbol that provides the proper context to interpret the symbol or modifies it in some way. For example, an accent can indicate that a symbol is a vector, or to represent the mean, complex conjugate or complement of the symbol.

The following values are recommended:

 Accent             | Value           | Unicode   | Possible Meanings
 -------------      |:---------------:|----------:|---
 Vector             | &#9676;&#x20d7; | U+20d7    |
 Bar                | &#9676;&#x00af; | U+00af    | Mean, complex conjugate, set complement.
 Hat                | &#9676;&#x005e; | U+005e    | Unit vector, estimator
 Dot                | &#9676;&#x02d9; | U+02d9    | Derivative with respect to time
 Double dot         | &#9676;&#x00a8; | U+00a8    | Second derivative with respect to time.
 Acute              | &#9676;&#x00b4; | U+00b4 | 
 Grave              | &#9676;&#x0060; | U+0060 | 
 Tilde              | &#9676;&#x007e; | U+007e | 
 Breve              | &#9676;&#x02d8; | U+02d8 | 
 Check              | &#9676;&#x02c7; | U+02c7 | 


### &langle;function&rangle;
* `fn`: &langle;native-string&rangle;, the name of the function.
* `arg`: &langle;expression&rangle; | array of &langle;expression&rangle;, the arguments to the function. If there's a single argument, it should be represented as an expression. If there's more than one, they should be represented as an array of expressions.
* `fence`: &langle;string&rangle;, one to three characters indicating the delimiters used for the expression. The first character is the opening delimiter, the second character, if present, is the closing delimiter. The third character, if present, is the delimiters separating the arguments. If no value is provided for this key, the default value `(),` is used. The character `.` can be used to indicate the absence of a delimiter, for example `..;`.
* `sub`: &langle;expression&rangle;
* `sup`: &langle;expression&rangle;
* `accent`: &langle;native-string&rangle;, a single unicode character representing the accent to display over the function. See the SYMBOL section for more details.

The `fn` key is the only required key.

When using common functions, the following values are recommended:

 Name (and common synonyms) | Value       | Arity | Comment
 -------------------------- |:------------|:------| :-------
 Conjugate                  | `+`         | 1   | Conjugate of the argument
 Addition                   | `+`         | 2 |
 Signum                     | `*`         | 1  | -1 if the argument is negative, 0 if it is zero, 1 if it is positive; more generally, the intersection of the unit circle with the line from the origin through the argument in the complex plane
 Multiplication             | `*`         | 2   | 
 Reciprocal                 | `/`         | 1   | The reciprocal of the argument
 Division                   | `/`         | 2   | The first argument divided  by the second argument
 Negate                     | `-`         | 1   | Negate the argument
 Substraction               | `-`         | 2   | Substract the second from the first.
 Exponential                | `^`         | 1   | e to the power of the argument.
 Power                      | `^`         | 2   | The first argument to the power of the second argument
 Square Root                | `root`      | 1   | 
 Root                       | `root`      | 2   | The second argument is the degree of the root
 Natural log                | `ln`        | 1   | 
 Logarithm                  | `ln`        | 2   | The second argument is the base.
 List                       | `list`      | n   | comma separated list
 List                       | `list2`     | n   | semi-colon separated list
 Floor                      | `floor`     | 1 | The largest integer less than or equal to the argument
 Minimum                    | `min`       | 2, n | The smallest of the arguments
 Ceiling                    | `ceiling`   | 1 | The smallest integer greater than or equal to the argument
 Maximum                    | `max`       | 2, n | The largest of the arguments
 Greatest Common Divisor    | `gcd`       | 2 | 
 Least Common Multiple      | `lcm`       | 2 | 


#### Trigonometry


Note that for inverse functions, no assumptions is made about the branch 
cuts of those functions. The interpretation is left up to the consuming software.
 Name (and common synonyms) | Value       | Arity | Comment
 -------------------------- |:------------|:------| :-------
 Cosine                     | `cos`       | 1   | angle in radians
 Sin                        | `sin`       | 1   | angle in radians
 Tangent (tan, tg)          | `tan`       | 1   | angle in radians
 Co-tangent (cot, ctg, cotg, ctn) | `cotangent` | 1| 
 Secant                     | `sec`       | 1 | 
 Cosecant                   | `csc`       | 1 | 
 Arc cosine                 ' `acos`      | 1   | angle in radians
 Arc sine                   ' `asin`      | 1   | angle in radians
 Arctangent (arctan, arctg) | `atan`      | 1   | angle in radians
 Arctangent (arctan, arctg) | `atan`      | 2   | See https://en.wikipedia.org/wiki/Atan2
 Arc-cotangent              | `arccot` | 1 | 
 Arc-secant                 | `arcsec` | 1 | 
 Arc-cosecant               | `arccsc` | 1 |
 Hyperbolic tangent (th, tan) | `tanh`  | 1 | 


#### Relational operators

 Operation              | Value     | Unicode   | Comment
 -------------          |:---------:|----------:|---
 Equal to               | `=`       | U+003D    |
 Definition/assignment  | `:=`    | U+003D    | Used with `a := 5` or `f(x) := sin(x)`
 Identity               | `:=:`     | U+003D    | Used with `1 + 1 :=: 2`
 Approximately equal to | `≈`   | ≈ U+2248    |
 Not equal to           | `≠`       | U+2260    |
 Less than              | `<`       | U+003C    |
 Less than or equal to  | `<=`   | ≤ U+2264    |
 Greater than           | `>`       | U+003C    |
 Greater than or equal to | `>=` | ≥ U+2265    |

There are three semantically distinct use for "equal to" which are often all represented with `=` in mathematical notation:
* conditional equality: the expression is true when the left hand side and the right hand side are equal, for example when defining a curve representin the unit circle: `x^2 + y^2 = 1`
* definition or assignment: the symbol (or expression) on the left hand side is defined by the expression on the right hand side. For example `f(x) := sin x`, `a = 5`
* identity: the right hand side expression is a syntactic derivation from the left hand size expression. For example, `1 + 1 :=: 2`

#### Big operators

Big operators, such as ∑, "sum", and ∏, "product", are represented as a function with the following arguments:
* first argument: body of the operation
* second argument (optional): inferior argument of the operation
* third argument (optional): superior argument of the operation

For example:
```tex
\sum ^n_{i=0}i
```
```json
{
    "fn":"sum",
    "arg":[
        "i", 
        {"fn":"=","arg":["i", 0]},
        "n"
    ]
}
```

If necessary, an empty argument can be represented by an empty structure.

The following values should be used to represent these common big operators:

 Operation          | Value             | Comment
 -------------      |:------------------|:----------
 Sum                | `sum`             | ∑ U+2211
 Product            | `product`         | ∏ U+220f
 Intersection       | `intersection`    | ⋂ U+22c2
 Union              | `union`           | ⋃ U+22c3
 Integral           | `integral`        | ∫ U+222b
 Double integral    | `integral2`       | ∬ U+222c
 Triple integral    | `integral3`       | ∭ U+222d
 Contour integral   | `contour_integral`| ∮ U+222e
 Circle Plus        | `circle_plus`     | U+2a01
 Circle Times       | `circle_times`    | U+2a02
 And                | `n_and`           | U+22c1
 Or                 | `n_or`            | U+22c0
 Coproduct          | `coproduct`       | ∐ U+2210
 Square cup         | `square_cup`      | U+2a06
 U plus             | `union_plus`      | U+2a04
 O dot              | `odot`            | U+2a00


#### Other functions
 Operation          | Value                | Comment
 -------------      |:------------------|:----------
 Factorial          | `factorial`       | `!`
 Double factorial   | `factorial2`      | `!!`



### &langle;group&rangle;
* `group`:  &langle;expression&rangle;
* `sup`:    &langle;expression&rangle;
* `sub`:    &langle;expression&rangle;
* `accent`: &langle;string&rangle;

The `group` key is the only one required.

This element is used when a `sup`, `sub` or `accent` need to be applied to an expression, as in `(x+1)^2`.

### &langle;range&rangle;
* `range_start`: &langle;expression&rangle;
* `range_end`: &langle;expression&rangle;
* `range_step`: &langle;expression&rangle;

The `range_start` key is the only one required. If absent, `range_end` is assumed to be `infinity`. If absent, `range_step` is assumed to be `1`.

### &langle;array&rangle;
* `rows`: array of &langle;expression&rangle;
* `fence`: &langle;native-string&rangle;
* `index`: A 0-based index into the vector or array. An index can be a number or an array of numbers.

The `rows` key is the only one required.

### &langle;dictionary&rangle;
* `keys`: object mapping keys to values

Example:
```JSON
{keys:{"a":1, "b":"one"}}
```
defines the following dictionary:

 Key          | Value
 -------------|:------------------
 `a`          | `1`
 `b`          | `"one"`
 
### &langle;text&rangle;
* `text`: &langle;native-string&rangle;
* `format`: "plain" | "markdown" | "html". This key is optional and its default value is `plain`

The `text` key is the only one required. 

### &langle;block&rangle;
* `block`: array of &langle;expression&rangle;
* `conditions`: array of &langle;expression&rangle;

A sequence of expressions, such as in a system of equations or a piecewise definition.

The `block` key is the only one required.

Example: piecewise definition of absolute value.
```text
\begin{cases}x & \mbox{if }x\ge 0 \\ -x & \mbox{if }x<0 \end{cases}
```
```json
{"block":[
    "x",
    {fn:"-",arg:"x"}
],
"conditions":[
    {fn:">=",arg:["x",0]},
    {fn:"<",arg:["x",0]},
]}
```

### OPEN QUESTIONS
1. How should exponents be represented? I.e. `x^2` or `A^\dagger`. They could literally be represented with a `sup` attribute, or as an explicit function, i.e. `fn:'pow'` or `fn:'transjugate'`
2. Clarify how to represent variants for multiplications, e.g. `a \times b`, `a . b`, `a * b`, `ab`, etc...
3. How to encode logarithm and exponential (see 1.)
4. What should the effect of n-ary versions of divide, substract? One option is to apply a left-reduce to the arguments.
5. How should accents (i.e. arrow over symbol) be encoded? As an additional property? As a function? How about other stylistic variant (i.e. bold symbol, fraktur, blackboard, etc...)

### REFERENCES
[1] https://www.json.org/
