/* 0.53.2 */import { Domain } from './domains';
export declare type FunctionDefinition = {
    /**
     * A short string indicating an entry in a wikibase. For example
     * `"Q167"` is the [wikidata entry](https://www.wikidata.org/wiki/Q167)
     *  for the Pi constant.
     */
    wikidata?: string;
    /** The domain of the result */
    domain?: Domain;
    /**  If true, the function will be automatically mapped to a list argument */
    isListable?: boolean;
    /** If true, [f, [f, a], b] is equivalent to [f, a, b] */
    isAssociative?: boolean;
    /** If true, [f, a, b] is equivalent to [f, b, a] */
    isCommutative?: boolean;
    /** If true, [f, [f, a]] is equivalent to [f, a] */
    isIdempotent?: boolean;
    /** If true, invoking the function wiht a given set of arguments will
     * always return the same value, i.e. 'sin()' is pure, 'random()' isn't.
     * This is used to cache the result of the function.
     */
    isPure?: boolean;
    /**
     * - **'all'**: The arguments will not be evaluated and will be passed as is
     * - **'none'**:  eval() is invoked for each argument.
     *  The function will be passed the result of the evaluation
     * - **'first'**: The first argument is not evaluated, the others are
     * - **'rest'**: The first argument is evaluated, the others aren't
     */
    hold?: 'none' | 'all' | 'first' | 'rest';
    /**
     * Number of arguments, or minimum or minimum and maximum number of arguments.
     *
     * These are the arguments in the expr representation (i.e. ["f", 1, 2])
     * and if `requiredLatexArg` is 0 (or undefined), these are also the expected
     * arguments in the latex stream, i.e. "f(1, 2)".
     *
     */
    argCount?: number | [number] | [number, number];
    argDomain?: Domain[];
};
export declare type SymbolDefinition = {
    /**
     * If true the value of the symbol is constant
     * If false, the symbol is a variable
     */
    isConstant: boolean;
    /**
     * A short string indicating an entry in a wikibase. For example
     * `"Q167"` is the [wikidata entry](https://www.wikidata.org/wiki/Q167)
     *  for the Pi constant.
     */
    wikidata?: string;
    domain?: Domain;
    value?: Expression;
    unit?: Expression;
};
/**
 * A dictionary maps a MathJSON name to a defition.
 *
 * A name can be a symbol name, as in the expression `"pi"`,
 * or the name of a function: "add" in the expression `["add", 2, 3]`.
 *
 * The name can be an arbitrary string of Unicode characters, however
 * the following conventions are recommended:
 *
 * - Use only letters, digits and `-`, and the first character should be
 * a letter: `/^[a-zA-Z][a-zA-Z0-9-]* /`
 * - Functions and symbols should start with a lowercase letter
 * - During parsing, camel-case names are converted to kebab-case, so that
 *  `"polynomialFactor"` becomes `"polynomial-factor"`
 *
 */
export declare type Dictionary = {
    [name: string]: SymbolDefinition | FunctionDefinition;
};
/**
 * * `unknown-symbol`: a symbol was encountered which does not have a
 * definition.
 *
 * * `unknown-operator`: a presumed operator was encountered which does not
 * have a definition.
 *
 * * `unknown-function`: a latex command was encountered which does not
 * have a definition.
 *
 * * `unbalanced-braces`: some latex braces (`{`, `}`) were not balanced
 *
 * * `unexpected-superscript`: a superscript was encountered in an unexpected
 * context, or no `powerFunction` was defined. By default, superscript can
 * be applied to numbers, symbols or expressions, but not to operators (e.g.
 * `2+^34`) or to punctuation.
 *
 * * `unexpected-subscript`: a subscript was encountered in an unexpected
 * context or no 'subscriptFunction` was defined. By default, subscripts
 * are not expected on numbers, operators or symbols. Some commands (e.g. `\sum`)
 * do expected a subscript.
 *
 * * `unexpected-sequence`: some adjacents elements were encountered ( for
 * example `xy`), but no `invisibleOperator` is defined, therefore the elements
 * can't be combined. The default `invisibleOperator` is `multiply`, but you
 * can also use `list`.
 *
 * * `expected-argument`: a Latex command that requires one or more argument
 * was encountered without the required arguments.
 *
 * * `expected-operand`: an operator was encountered without its required
 * operands.
 *
 * * `non-associative-operator`: an operator which is not associative was
 * encountered in an associative context, for example: 'a < b < c' (assuming
 * `<` is defined as non-associative)
 *
 * * `postfix-operator-requires-one-argument`: a postfix operator which requires
 * a single argument was encountered with no arguments or more than one argument
 *
 * * `prefix-operator-requires-one-argument`: a prefix operator which requires
 * a single argument was encountered with no arguments or more than one argument
 *
 */
export declare type ErrorCode = 'expected-argument' | 'unexpected-argument' | 'expected-operator' | 'expected-operand' | 'invalid-name' | 'unknown-symbol' | 'unknown-operator' | 'unknown-function' | 'unknown-command' | 'unbalanced-braces' | 'unbalanced-matchfix-operator' | 'unexpected-superscript' | 'unexpected-subscript' | 'unexpected-sequence' | 'non-associative-operator' | 'function-has-too-many-arguments' | 'function-has-too-few-arguments' | 'operator-requires-one-operand' | 'infix-operator-requires-two-operands' | 'prefix-operator-requires-one-operand' | 'postfix-operator-requires-one-operand' | 'associative-function-has-too-few-arguments' | 'commutative-function-has-too-few-arguments' | 'listable-function-has-too-few-arguments' | 'hold-first-function-has-too-few-arguments' | 'hold-rest-function-has-too-few-arguments' | 'syntax-error';
export declare type Attributes = {
    /** A human readable string to annotate an expression, since JSON does not
     * allow comments in its encoding */
    comment?: string;
    /** A human readable string that can be used to indicate a syntax error or
     *other problem when parsing or evaluating an expression.
     */
    error?: string;
    /** A visual representation in LaTeX of the expression. This can be useful
    to preserve non-semantic details, for example parentheses in an expression
    or styling attributes */
    latex?: string;
    /**
     * A short string indicating an entry in a wikibase. For example
     * `"Q167"` is the [wikidata entry](https://www.wikidata.org/wiki/Q167)
     *  for the Pi constant.
     */
    wikidata?: string;
    /** A base URL for the `wikidata` key. A full URL can be produced by
    concatenating this key with the `wikidata` key. This key applies to this
    node and all its children. The default value is
    "https://www.wikidata.org/wiki/"
     */
    wikibase?: string;
    /** A short string indicating an entry in an OpenMath Content
    Dictionary. For example: `arith1/#abs`. */
    openmathSymbol?: string;
    /** A base URL for an OpenMath content dictionary. This key applies to this
    node and all its children. The default value is
    "http://www.openmath.org/cd".
     */
    openmathCd?: string;
};
export declare type MathJsonBasicNumber = 'NaN' | '-Infinity' | '+Infinity' | string;
export declare type MathJsonRealNumber = {
    num: MathJsonBasicNumber;
} & Attributes;
export declare type MathJsonSymbol = {
    sym: string;
} & Attributes;
export declare type MathJsonFunction = {
    fn: Expression[];
} & Attributes;
export declare type Expression = MathJsonRealNumber | number | MathJsonSymbol | string | MathJsonFunction | (Expression | string | null)[];
/**
 * A given mathematical expression can be represented in multiple equivalent
 * ways as a MathJSON expression. `Form` is used to specify a
 * representation:
 * - **`'full'`**: only transformations applied are those necessary to make it
 *      valid JSON (for example making sure that `Infinity` and `NaN` are
 *      represented as strings)
 * - **`'flatten-associative'`**: associative functions are combined, e.g.
 *      f(f(a, b), c) -> f(a, b, c)
 * - **`'sorted'`**: the arguments of commutative functions are sorted such that:
 *       - numbers are first, sorted numerically
 *       - complex numbers are next, sorted numerically by imaginary value
 *       - symbols are next, sorted lexicographically
 *       - `add` functions are next
 *       - `multiply` functions are next
 *       - `power` functions are next, sorted by their first argument,
 *           then by their second argument
 *       - other functions follow, sorted lexicographically
 * - **`'stripped-metadata'`**: any metadata associated with elements of the
 *      expression is removed.
 * - *`'canonical-add'`**: `addition of 0 is simplified, associativity rules
 * are applied, unnecessary groups are moved, single argument 'add' are simplified
 * - *`'canonical-divide'`**: `divide` is replaced with `multiply` and `power',
 *       division by 1 is simplified,
 * - *`'canonical-exp'`**: `exp` is replaced with `power`
 * - *`'canonical-multiply'`**: multiplication by 1 or -1 is simplified
 * - *`'canonical-power'`**: `power` with a first or second argument of 1 is
 *     simplified
 * - *`'canonical-negate'`**: real or complex number is replaced by the
 * negative of that number. Negation of negation is simplified.
 * - *`'canonical-number'`**: complex numbers with no imaginary compnents are
 * simplified
 * - *`'canonical-root'`**: `root` is replaced with `power`
 * - *`'canonical-subtract'`**: `subtract` is replaced with `add` and `negate`
 * - **`'canonical'`**: the following transformations are performed, in this order:
 *      - 'canonical-number', // -> simplify number
 *      - 'canonical-exp', // -> power
 *      - 'canonical-root', // -> power, divide
 *      - 'canonical-subtract', // -> add, negate, multiply,
 *      - 'canonical-divide', // -> multiply, power
 *      - 'canonical-power', // simplify power
 *      - 'canonical-multiply', // -> multiply, power
 *      - 'canonical-negate', // simplify negate
 *      - 'canonical-add', // simplify add
 *      - 'flatten', // simplify associative, idempotent and groups
 *      - 'sorted',
 *      - 'full',
 */
export declare type Form = 'canonical' | 'canonical-add' | 'canonical-divide' | 'canonical-exp' | 'canonical-list' | 'canonical-multiply' | 'canonical-power' | 'canonical-negate' | 'canonical-number' | 'canonical-root' | 'canonical-subtract' | 'flatten' | 'full' | 'sorted' | 'stripped-metadata' | 'sum-product';
export declare type DictionaryCategory = 'algebra' | 'arithmetic' | 'calculus' | 'complex' | 'combinatorics' | 'dimensions' | 'intervals' | 'linear-algebra' | 'lists' | 'logic' | 'numeric' | 'quantifiers' | 'physics' | 'polynomials' | 'relations' | 'sets' | 'statistics' | 'core' | 'transcendentals' | 'trigonometry' | 'rounding' | 'units';
/**
 * Return a dictionary suitable for the specified category, or `"all"`
 * for all categories (`"arithmetic"`, `"algebra"`, etc...).
 *
 * The dictionary defines how the symbols and function names in a MathJSON
 * expression should be interpreted, i.e. how to evaluate and manipulate them.
 *
 */
export declare function getDefaultDictionary(domain: DictionaryCategory | 'all'): Dictionary;
