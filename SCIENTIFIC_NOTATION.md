When a user types a scientific notation number, it can be formatted using the
`MathfieldElement.scientificNotationTemplate` property.

To trigger the number formatting, the user must type

- one or more digits
- followed by `e` or `E` (for e-notation)
- an optional sign (`+` or `-`)
- one or more digits (the exponent)

A scientific notation template is valid if:

- it is not null
- it is not the empty string
- it contains `#1` and `#2` placeholders

If a scientific notation template is valid, when the user types a non-digit
character after a scientific notation number, the number is reformatted using
the template.

The template is also applied after a short delay when the user stops typing.

When the template is applied, `#1` is replaced with the significand (the part
before the `e` or `E`), and `#2` is replaced with the exponent (the part after
the `e` or `E`).

For example, with the default template of `#1 \times 10^{#2}`:

- typing `3.14e2` followed by a space results in `3.14 \times 10^{2}`
- typing `5E-3` followed by `+` results in `5 \times 10^{-3}`
