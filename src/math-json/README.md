# MathJson

The MathJSON format is a lightweight data interchange format for mathematical notation.

It is human-readable, while being easy for machines to generate and parse.
You do not need a library to generate, consume or manipulate MathJSON,
although a TypeScript/JavaScript one is available.

MathJSON is built on the [JSON format](https://www.json.org/). Its focus is on
interoperability between software programs to facilitate the exchange of
mathematical data, as well as the building of scientific software through the
integration of software components communicating with a common format.

Mathematical notation is used in a broad array of fields, from elementary
school arithmetic, engineering, applied mathematics to physics and more.
New notations are also invented regularly and need to be represented. Therefore
MathJSON is flexible, extensible and customizable.

However, MathJSON is not suitable as a visual representation of arbitrary
mathematical notations, and as such is not a replacement for LaTeX or MathML.

## Examples

| Latex                      | mathJSON                                                         |
| :------------------------- | :--------------------------------------------------------------- |
| `\frac{a}{1+x}`            | `["Divide", "a", ["Add", 1, "x"]]`                               |
| `e^{\imaginaryI \pi }+1=0` | `["Eq", ["Power", "E", ["Add", ["Multiply", "PI", "I"], 1]], 0]` |
| `\sin^{-1}\prime(x)`       | `[["Derivative", 1, ["InverseFunction", "Sin"]], "x"]`           |

## Structure of a MathJSON Expression

A MathJSON expression is a combination of

-   numbers
-   symbols and strings
-   functions

| Example  | mathJSON                             |
| :------- | :----------------------------------- |
| number   | `2`, `314.e-2`,                      |
| "        | `{"num": "3.1"}` ]`                  |
| "        | `{"num": "-Infinity"}` ]`            |
| symbol   | `"x"`, `"PI"`                        |
| "        | `{"sym": "PI", "wikidata": "Q167" }` |
| function | `["Add", 1, "x"]`                    |
| "        | `{"fn": ["Add", 1, {sym: "x"}]}`     |

## Numbers

A MathJSON number is either:

-   an object literal
-   a JSON number

### Numbers as Object Literals

The default representations of numbers is as an object literal with a `"num"`
key. The value of the key is a string representation of the number.

```typescript
{
    "num": string
}
```

### JSON numbers

When a number has no extra metadata and is compatible with the JSON representation
of numbers, a `number` can be used.

Specifically:

-   the number has to fit in a 64-bit float (IEEE 754-2008, about 15-digit of precision)
-   the number has to be finite (it cannot be `Infinity`, `-Infinity` or `NaN`)

### Examples

```json
0

-234.534e-46

{ "num": "-234.534e-46" }

{ "num": "3.1415926535 8979323846 2643383279 5028841971 6939937510 5820974944 5923078164 0628620899 8628034825 3421170679 8214808651 3282306647 0938446095 5058223172 5359408128 4811174502 8410270193 8521105559 6446229489 5493038196 4428810975 6659334461 2847564823 3786783165 2712019091 4564856692 3460348610 4543266482 1339360726 0249141273 7245870066 0631558817 4881520920 9628292540 9171536436 7892590360 0113305305 4882046652 1384146951 9415116094 3305727036 5759591953 0921861173 8193261179 3105118548 0744623799 6274956735"
}

{ "num": "-Infinity" }

```

## Symbols and strings

Symbols represent constants and variables.

Symbols are represented as strings of Unicode characters, except U+0020 (SPACE).
However, the following naming convention are recommended:

### Naming Convention for Variables

-   First character should match `/[a-zA-Z]/`
-   Subsequent characters should match `/[a-zA-Z0-9_-]/`
    So for example use, `gamma` rather than `ɣ` and `total` rather than `∑` (sum),
    which looks like `Σ` uppercase sigma. This visual ambiguity of some Unicode
    symbols frequently used in math is why we recommend a more restricted
    character set.
-   If a variable is made of several words, use camelCase, i.e. `newDeterminant`
-   Prefer clarity over brevity and avoid obscrure abbreviations: use
    `newDeterminant` rather than `newDet` or `nDet`
-   The following variables are usually real numbers: `x`, `y`, `t`
-   The following variables are usually integers: `i`, `n`, `p`, `q`
-   The following variables are usually complex numbers: `z`, `w`
-   The following variables are usually lists: `xs`, `ys`

### Naming Convention for Constants

-   First character of constants should match: `/[A-Z]/`
-   Subsequent characters of constants should match: `/[A-Z0-9_]/`
-   If a constant is made up of several words, separate them with `_`,
    e.g. `SPEED_OF_LIGHT`

## Functions

A MathJSON function is either:

-   an object literal
-   an JSON array

### Functions as Object Literal

The default representations of functions is as an object literal with a `"fn"`
key. The value of the key is an array representing the function head and its
arguments.

```typescript
{
    "fn": Expression[]
}
```

The 'head' of the function is the first element in the array. Its presence
is required. It indicates the 'function name' or 'what' the function is about.

It frequently is a string, but it can also be another expression. For example
in `\sin^{-1}(x)`, the corresponding expression is `[["InverseFunction", "Sin"], "x"]`
and the head is `["InverseFunction", "Sin"]`

Following the head are zero or more arguments to the function, which
are expressions as well.

### JSON array

If a function has no extra metadata it can be represented as a JSON array.

For example these two expressions are equivalent:

```typescript
expr = ['Cos', ['Add', 'x', 1]];

expr = {
    fn: ['Cos', ['Add', 'x', 1]],
};
```

## Metadata

MathJSON object can be annotated with supplemental information. If a number
represented as a JSON number or a symbol represented as a string needs to be
annotated, they must be transformed into the equivalent object literal first.

The following properties are recommended:

| Property   | Example  | Note                                                                                                                                                                    |
| :--------- | :------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wikidata` | `"Q167"` | A short string indicating an entry in a wikibase                                                                                                                        |
| `comment`  |          | A human readable string to annotate an expression, since JSON does not allow comments in its encoding                                                                   |
| `latex`    | `"\pi"`  | A visual representation in LaTeX of the expression. This can be useful to preserve non-semantic details, for example parentheses in an expression or styling attributes |

|

## Domains

A domain is roughly a combination of a type in traditional programming language
and an "assumption" is some CAS software.

## Translation Dictionary

## Function/Symbol Dictionary

## Default Dictionaries

### Categories

The dictionaries are organized in categories.
