


define(['mathlive/core/definitions', 'mathlive/core/color', 'mathlive/core/fontMetrics', 'mathlive/core/mathAtom'],
    function(Definitions, Color, FontMetrics, MathAtomModule) {

const MathAtom = MathAtomModule.MathAtom;

/**
 * A parser transforms a list of tokens into a list of MathAtom.
 * 
 * @param {InputToken[]} tokens 
 * @param {*[]} args An optional list of arguments. `#n` tokens will be 
 * substituted with the corresponding element in the args array. This is used
 * when parsing macros.
 * @constructor
 */
function Parser(tokens, args) {
    // List of tokens to be parsed, an array of InputToken
    this.tokens = tokens;

    // The current token to be parsed, index in this.tokens
    this.index = 0;

    // Optional arguments to substitute the # token
    this.args = args;

    // The result of the parsing is accumulated by parseAtom() 
    // into this mathlist, an array of MathAtom
    this.mathList = [];

    // The parse mode indicates the syntax rules to use to 
    // parse the upcoming tokens.
    // Valid values include:
    // - 'math': spaces are ignored, math functions are allowed 
    // - 'text': spaces are accounted for, math functions are ignored
    // - 'string'
    // - 'color': color name, hex value (#fff, #a0a0a0)
    // - 'number': +/-12.56
    // - 'dimen': '25mu', '2pt'
    // - 'skip': '25mu plus 2em minus fiLll', '2pt'
    // - 'colspec' formating of a column in tabular environment, e.g. 'r@{.}l' 
    this.parseMode = 'math';

    // When in tabular mode, '&' is interpreted as a column separator
    // and '\\' as a row separator. Used for matrixes, etc...
    this.tabularMode = false;

    // Counter to prevent deadlock. If end() is called too many times (1,000)
    // in a row for the same token, bail.
    this.endCount = 0;
}

Parser.prototype.swapMathList = function(newMathList) {
    const result = this.mathList;
    this.mathList = newMathList || [];
    return result;
}

Parser.prototype.swapParseMode = function(mode) {
    const result = this.parseMode;
    this.parseMode = mode;
    return result;
}

Parser.prototype.end = function() {
    // To prevent a deadlock, count how many times end() is called without the 
    // index advancing. If it happens more than 1,000 times in a row, 
    // assume something is broken and pretend the stream is finished.
    this.endCount++;
    return this.index >= this.tokens.length || this.endCount > 1000;
}

Parser.prototype.get = function() {
    this.endCount = 0;
    return this.index < this.tokens.length ? this.tokens[this.index++] : null;
}

Parser.prototype.peek = function(offset) {
    const index = this.index + (offset ? offset : 0);
    return index < this.tokens.length ? this.tokens[index] : null;
}

/**
 * Return the last atom of the math list.
 * If force is true (or undefined) and the list is empty, a new empty
 * atom is created and returned as the result.
 */
Parser.prototype.lastMathAtom = function() {
    if (this.mathList.length === 0 || 
        this.mathList[this.mathList.length - 1].type !== 'mop') {
        // ZERO WIDTH SPACE
        const lastAtom = new MathAtom(this.parseMode, 'mord', '\u200b', 'main');
        lastAtom.attributes = {
            "aria-hidden": true
        };
        this.mathList.push(lastAtom);  
    }
    return this.mathList[this.mathList.length - 1];
}

/**
 * @param {string} type
 */
Parser.prototype.hasToken = function(type) {
    const index = this.index;
    return index < this.tokens.length ? 
        this.tokens[index].type === type : false;
}

Parser.prototype.hasLiteral = function(literal) {
    const index = this.index;
    return index < this.tokens.length ? 
        this.tokens[index].type === 'literal' &&
        (!literal || this.tokens[index].value === literal) : false;
}

Parser.prototype.hasCommand = function(command) {
    console.assert(command === '\\' || command.charAt(0) !== '\\',
        'hasCommand() does not require a \\');

    const index = this.index;
    return index < this.tokens.length ? 
        this.tokens[index].type === 'command' &&
        this.tokens[index].value === command : false;
}

Parser.prototype.hasInfixCommand = function() {
    const index = this.index;
    if (index < this.tokens.length && 
        this.tokens[index].type === 'command') {
        const info = Definitions.getInfo('\\' + this.tokens[index].value, this.parseMode);
        return info && info.infix;
    }
    return false;
}

/**
 * An implicit group is a sequence of atoms that terminates with 
 * a '}', '&', '\\', '\cr', '\end' or '\right' or the end of the stream
 */
function hasImplicitGroupEnd(token) {
    return token.type === '}' || 
        (token.type === 'literal' && token.value === '&') ||
        (token.type === 'command' && (
            token.value === 'end' || 
            token.value === 'cr' || 
            token.value === '\\' || 
            token.value === 'right'
        ))
}



Parser.prototype.hasColumnSeparator = function() {
    const index = this.index;
    return this.tabularMode && index < this.tokens.length ? 
        this.tokens[index].type === 'literal' &&
        this.tokens[index].value === '&' : false;
}

Parser.prototype.hasRowSeparator = function() {
    const index = this.index;
    return this.tabularMode && index < this.tokens.length ? 
        this.tokens[index].type === 'command' &&
        (this.tokens[index].value === '\\' || 
        this.tokens[index].value === 'cr') : false;
}

Parser.prototype.parseColumnSeparator = function() {
    if (this.hasColumnSeparator()) {
        this.index++;
        return true;
    }
    return false;
}



const SIZING_COMMANDS = [
    'tiny', 'scriptsize', 'footnotesize', 'small', 
    'normalsize',
    'large', 'Large', 'LARGE', 'huge', 'Huge',
];

Parser.prototype.hasImplicitSizingCommand = function() {
    if (this.index < this.tokens.length) {
        const token = this.tokens[this.index]
        if (token.type === 'command') {
            return SIZING_COMMANDS.indexOf(token.value) !== -1;
        }
    }
    return false;

}

const MATHSTYLE_COMMANDS = [
    'displaystyle', 'textstyle', 'scriptstyle', 'scriptscriptstyle',
]

Parser.prototype.hasImplicitMathstyleCommand = function() {
    if (this.index < this.tokens.length) {
        const token = this.tokens[this.index]
        if (token.type === 'command') {
            return MATHSTYLE_COMMANDS.indexOf(token.value) !== -1;
        }
    }
    return false;
}

Parser.prototype.parseRowSeparator = function() {
    if (this.hasRowSeparator()) {
        this.index++;
        return true;
    }
    return false;
}


/**
 * @param {string} type
 */
Parser.prototype.parseToken = function(type) {
    if (this.hasToken(type)) {
        this.index++;
        return true;
    }
    return false;
}

Parser.prototype.skipUntilToken = function(type) {
    while (!this.end() && !this.parseToken(type)) {
        this.get();
    }
}


Parser.prototype.parseCommand = function(command) {
    if (this.hasCommand(command)) {
        this.index++;
        return true;
    }
    return false;
}

Parser.prototype.parseLiteral = function(literal) {
    if (this.hasLiteral(literal)) {
        this.index++;
        return true;
    }
    return false;
}

Parser.prototype.parseFiller = function() {
    let skipped = false;
    let done = false;
    do {
        const skippedSpace = this.parseToken('space');
        const skippedRelax = this.parseCommand('relax');
        skipped = skipped || skippedSpace || skippedRelax;
        done = !skippedSpace && !skippedRelax;
    } while (!done);

    return skipped;
}

/**
 * Keywords are used to specify dimentions, and for various other 
 * syntactic constructs. Unlike commands, they are not case sensitive.
 * There are 25 keywords:
 * at by bp cc cm dd depth em ex fil fill filll height in minus
 * mm mu pc plus pt sp spread to true width
 * 
 * TeX: 8212
 * @return {boolean} true if the expected keyword is present
 */
Parser.prototype.parseKeyword = function(keyword) {
    const savedIndex = this.index;

    let done = this.end();
    let value = '';
    while(!done) {
        const token = this.get();
        if (token.type === 'literal') {
            value += token.value;
        }
        done = this.end() || token.type !== 'literal' || 
            value.length >= keyword.length;
    }

    const hasKeyword = keyword.toUpperCase() === value.toUpperCase();

    if (!hasKeyword) this.index = savedIndex;

    return hasKeyword;
}

/**
 * Return a sequence of characters as a string.
 * i.e. 'abcd' returns 'abcd'.
 * Terminates on the first non-character encountered 
 * e.g. '{', '}' etc...
 * Will also terminate on ']' 
 * @return {string}
 */
Parser.prototype.scanString = function() {
    let result = '';
    let done = this.end();
    while(!done) {
        if (this.hasLiteral(']')) {
            done = true;
        } else if (this.hasToken('literal')) {
            result += this.get().value;
            done = this.end();

        } else if (this.parseToken('space')) {
            result += ' ';
            done = this.end();

        } else if (this.hasToken('command')) {
            // TeX will give a 'Missing \endcsname inserted' error
            // if it encounters any command when expecting a string.
            // We're a bit more lax.
            const token = this.get();
            const info = Definitions.getInfo('\\' + token.value, this.parseMode);
            // If parseMode is 'math', info.type will never be 'textord'
            // Otherwise, info.type will never be 'mord'
            if ((info.type === 'mord' || info.type === 'textord') && info.value) {
                result += info.value;
            }
            done = this.end();

        } else {
            done = true;
        }
    }
    
    return result;
}


/**
 * Return a CSS color (#rrggbb)
 */
Parser.prototype.scanColor = function() {
    return Color.stringToColor(this.scanString());
}

/**
 * Return as a number a group of characters representing a 
 * numerical quantity.
 * 
 * From TeX:8695 (scan_int):
 * An integer number can be preceded by any number of spaces and `\.+' or
 * `\.-' signs. Then comes either a decimal constant (i.e., radix 10), an
 * octal constant (i.e., radix 8, preceded by~\.\'), a hexadecimal constant
 * (radix 16, preceded by~\."), an alphabetic constant (preceded by~\.\`), or
 * an internal variable.
 * @return {number}
 */
Parser.prototype.scanNumber = function(isInteger) {
    const negative = this.parseLiteral('-');

    // Optional (ignorable) '+' sign
    if (!negative) this.parseLiteral('+');
    this.parseToken('space');

    isInteger = !!isInteger;

    let radix = 10;
    let digits = '0123456789';
    if (this.parseLiteral("'")) {
        // Apostrophe indicates an octal value
        radix = 8;
        digits = '01234567';
        isInteger = true;
    } else if (this.parseLiteral('"') || this.parseLiteral('x')) {
        // Double-quote indicates a hex value
        // The 'x' prefix notation for the hexadecimal numbers is a MathJax extension.
        // For example: 'x3a'
        radix = 16;
        // Hex digits have to be upper-case
        digits = '0123456789ABCDEF';
        isInteger = true;
    }

    let value = '';
    let done = this.end();
    while (!done) {
        if (!this.hasToken('literal')) {
            done = true;
        } else {
            done = digits.indexOf(this.peek().value) === -1;
            if (!done) {
                value += this.get().value;
            }
        }
    }

    // Parse the fractional part, if applicable
    if (!isInteger &&  (this.parseLiteral('.') || this.parseLiteral(','))) {
        value += '.';
        done = this.end();
        while (!done) {
            if (!this.hasToken('literal')) {
                done = true;
            } else {
                done = digits.indexOf(this.peek().value) === -1;
                if (!done) {
                    value += this.get().value;
                }
            }
        }
    }

    const result = isInteger ? parseInt(value, radix) : parseFloat(value);
    return negative ? -result : result;
}

function convertDimenToEm(value, unit) {

    let f = 1;
    if (unit === 'pt') {
        f = 1;
    } else if (unit === 'mm') {
        f = 7227 / 2540;
    } else if (unit === 'cm') {
        f = 7227 / 254;
    } else if (unit === 'ex') {
        f = 35271 / 8192;
    } else if (unit === 'em') {
        f = FontMetrics.metrics.ptPerEm;
    } else if (unit === 'bp') {
        f = 803 / 800;
    } else if (unit === 'dd') {
        f = 1238 / 1157;
    } else if (unit === 'pc') {
        f = 12;
    } else if (unit === 'in') {
        f = 72.27;
    } else if (unit === 'mu') {
        f = 10 / 18;
    }
    // If the units are missing, TeX assumes 'pt'

    return value / FontMetrics.metrics.ptPerEm * f;
}

/**
 * Return as a floating point number a dimension in pt (1 em = 10 pt)
 * 
 * See TeX:8831
 * @todo: note that some units depend on the font (em, ex). So it might be
 * better to return a dimen struct witht the value + unit and resolve
 * later when we have a font context....
 * @return {number}
 */
Parser.prototype.scanDimen = function() {
    const value = this.scanNumber(false);

    this.parseToken('space');

    let result;

    if (this.parseKeyword('pt')) {
        result = convertDimenToEm(value, 'pt');
    } else if (this.parseKeyword('mm')) {
        result = convertDimenToEm(value, 'mm');
    } else if (this.parseKeyword('cm')) {
        result = convertDimenToEm(value, 'cm');
    } else if (this.parseKeyword('ex')) {
        result = convertDimenToEm(value, 'ex');
    } else if (this.parseKeyword('em')) {
        result = convertDimenToEm(value, 'em');
    } else if (this.parseKeyword('bp')) {
        result = convertDimenToEm(value, 'bp');
    } else if (this.parseKeyword('dd')) {
        result = convertDimenToEm(value, 'dd');
    } else if (this.parseKeyword('pc')) {
        result = convertDimenToEm(value, 'pc');
    } else if (this.parseKeyword('in')) {
        result = convertDimenToEm(value, 'in');
    } else if (this.parseKeyword('mu')) {
        result = convertDimenToEm(value, 'mu');
    } else {
        // If the units are missing, TeX assumes 'pt'
        result = convertDimenToEm(value, 'pt');
    }

    return result;
}

Parser.prototype.scanSkip = function() {
    const result = this.scanDimen();
    
    // We parse, but ignore the optional 'plus' and 'minus' 
    // arguments.

    this.parseToken('space');

    // 'plus', optionally followed by 'minus'
    // ('minus' cannot come before 'plus')
    // dimen or 'hfill'
    
    if (this.parseKeyword('plus')) {
        // @todo there could also be a \hFilLlL command here
        this.scanDimen();
    }

    this.parseToken('space');

    if (this.parseKeyword('minus')) {
        // @todo there could also be a \hFilLlL command here
        this.scanDimen();
    }
    
    return result;
}


Parser.prototype.scanColspec = function() {
    this.parseToken('space');
    const result = [];
    while (!this.end() && !(this.hasToken('}') || this.hasLiteral(']'))) {
        if (this.hasLiteral()) {
            const literal = this.get().value;
            if ('lcr'.includes(literal)) {
                result.push({align: literal});
            } else if (literal === '|') {
                result.push({rule: true});
            } else if (literal === '@') {
                if (this.parseToken('{')) {
                    const savedParsemode = this.swapParseMode('math');    
                    result.push({gap: this.scanImplicitGroup(
                        token => token.type === '}')});
                    this.swapParseMode(savedParsemode);
                }
                this.parseToken('}');
            }
        }
    }
    return result;
}

/**
 * Parse a \(...\) or \[...\] sequence
 * @return {?MathAtom} group for the sequence or null
 */
Parser.prototype.scanModeSet = function() {
    let final;
    if (this.parseCommand('(')) final = ')';
    if (!final && this.parseCommand('[')) final = ']';
    if (!final) return null;

    const savedParsemode = this.swapParseMode('math');

    const result = new MathAtom('math', 'group');
    result.mathstyle = final === ')' ? 'textstyle' : 'displaystyle';
    result.children = this.scanImplicitGroup(
        token => token.type === 'command' && token.value === final);
    this.parseCommand(final);
   
    this.swapParseMode(savedParsemode);

    if (!result.children || result.children.length === 0) return null;
    return result;
}

/**
 * Parse a $...$ or $$...$$ sequence
 */
Parser.prototype.scanModeShift = function() {
    if (!this.hasToken('$') && !this.hasToken('$$')) return null;

    const final = this.get().type;

    const result = new MathAtom('math', 'group');
    result.mathstyle = final === '$' ? 'textstyle' : 'displaystyle';
    const savedParsemode = this.swapParseMode('math');

    result.children = this.scanImplicitGroup(token => token.type === final);

    this.parseToken(final);

    this.swapParseMode(savedParsemode);

    if (!result.children || result.children.length === 0) return null;
    return result;
}




/**
 * Parse a \begin{env}...\end{end} sequence
 */
Parser.prototype.scanEnvironment = function() {
    // An environment starts with a \begin command
    if (!this.parseCommand('begin')) return null;

    // The \begin command is immediately followed by the environment
    // name, as a string argument
    const envName = this.scanArg('string');

    const env = Definitions.getEnvironmentInfo(envName);

    // If the environment has some arguments, parse them
    const args = [];
    if (env && env.params) {
        for (const param of env.params) {
            // Parse an argument
            if (param.optional) {
                // If it's not present, return the default argument value
                const arg = this.scanOptionalArg(param.type);
                // args.push(arg ? arg : param.defaultValue); @todo defaultvalue
                args.push(arg);

            } else {
                // If it's not present, scanArg returns null,
                // but push it on the list of arguments anyway.
                // The null vallue will be interpreted as unspecified
                // optional value by the command handler.
                args.push(this.scanArg(param.type));
            }
        }    
    }

    // Some environments change the mode
    const savedMode = this.parseMode;
    const savedTabularMode = this.tabularMode;
    const savedMathList = this.swapMathList([]);
    // @todo: since calling scanImplicitGroup(), may not need to save/restore the mathlist

    this.tabularMode = env.tabular;

    const array = [];
    const rowGaps = [];
    let row = [];

    let done = false;
    do {
        done = this.end();
        if (!done && this.parseCommand('end')) {
            done = this.scanArg('string') === envName;
        }
        if (!done) {
            if (this.parseColumnSeparator()) {
                row.push(this.swapMathList([]));

            } else if (this.parseRowSeparator()) {
                row.push(this.swapMathList([]));
                let gap = 0;
                this.parseToken('space');
                if (this.parseLiteral('[')) {
                    gap = this.scanDimen();
                    this.parseToken('space');
                    this.parseLiteral(']');
                }
                rowGaps.push(gap || 0);
                array.push(row);
                row = [];
            } else {
                this.mathList = this.mathList.concat(this.scanImplicitGroup());
            }
        }
    } while (!done);

    row.push(this.swapMathList([]));
    if (row.length > 0) array.push(row);

    const newMathList = this.swapMathList(savedMathList);

    // If we're in tabular mode, we should end up with an empty mathlist
    console.assert(!this.tabularMode || newMathList.length === 0,
        'Leftover atoms in tabular mode');

    this.parseMode = savedMode;
    this.tabularMode = savedTabularMode;

    if (!env.tabular && newMathList.length === 0) return null;
    if (env.tabular && array.length === 0) return null;

    const result = new MathAtom(this.parseMode, 'array', null, null,
        env.parser ? env.parser(envName, args, array) : {});
    result.array = array;
    result.children = newMathList;
    result.rowGaps = rowGaps;
    result.env = env;
    result.env.name = envName;

    return result;
}

// {black\color{red}red\color{green}green}black
/**
 * Parse a sequence terminated with a group end marker, such as 
 * '}', '\end', '&', etc...
 * Returns an array of MathAtom or an empty array if the sequence
 * terminates right away
 * @param {?function} done A predicate indicating if a token signals the 
 * end of an implicit group
 * @return {?MathAtom[]} 
 */
Parser.prototype.scanImplicitGroup = function(done) {
    if (!done) done = hasImplicitGroupEnd;
    // To handle infix operators, we'll keep track of their prefix
    // (tokens coming before them)
    let infix = null;     // A token
    let prefix = null;    // A mathlist

    const savedMathlist = this.swapMathList([]);
    // if (this.index >= this.tokens.length) return true;
    // const token = this.tokens[this.index];
    while(!this.end() && !done(this.peek())) {
        if (this.hasImplicitSizingCommand()) {
            // Implicit sizing command such as \Large, \small
            // affect the tokens following them
            // Note these commands are only appropriate in 'text' mode.
            const atom = new MathAtom(this.parseMode, 'sizing');
            atom.size = {
                'tiny' : 'size1', 
                'scriptsize': 'size2', 
                'footnotesize': 'size3',
                'small' : 'size4', 
                'normalsize': 'size5',
                'large': 'size6', 
                'Large': 'size7', 
                'LARGE': 'size8', 
                'huge': 'size9',
                'Huge': 'size10'
            }[this.get().value];
            this.mathList.push(atom);

        } else if (this.hasImplicitMathstyleCommand()) {
            // Implicit math style commands such as \displaystyle, \textstyle...
            // Note these commands switch to math mode and a specific size
            // \textsize is the mathstyle used for inlinemath, not for text
            this.parseMode = 'math';
            const atom = new MathAtom('math', 'mathstyle');
            atom.mathstyle = this.get().value;
            this.mathList.push(atom);

        } else if (this.hasInfixCommand() && !infix) {
            // The next token is an infix and we have not seen one yet
            // (there can be only one infix command per implicit group).
            infix = this.get();
            // Save the math list so far and start a new one
            prefix = this.swapMathList([]);

        } else {
            this.parseAtom();
        }
    }
    

    let result;

    if (infix) {
        const suffix = this.swapMathList(savedMathlist);
        // The current parseMode, this.parseMode, may no longer have the value
        // it had when we encountered the infix. However, since all infix are
        // only defined in 'math' mode, we can use the 'math' constant 
        // for the parseMode
        const info = Definitions.getInfo('\\' + infix.value, 'math');

        result =  [new MathAtom(
                this.parseMode, info.type || 'mop', 
                info.value || infix.value, 
                info.fontFamily,
                info.handler ? 
                    info.handler('\\' + infix.value, [prefix, suffix]) :
                    null)];
    } else {
        result = this.swapMathList(savedMathlist);
    }
    return result;
}

/**
 * Parse a group enclosed in a pair of braces: `{...}`
 * Return either a group MathAtom or null if not a group.
 * Return a group MathAtom with an empty children list if an empty
 * group (i.e. `{}`)
 * @return {MathAtom} 
 */
Parser.prototype.scanGroup = function() {
    if (!this.parseToken('{')) return null;

    const result = new MathAtom(this.parseMode, 'group');
    result.children = this.scanImplicitGroup(token => token.type === '}');
    this.parseToken('}');

    return result;
}

/**
 * Scan a delimiter, e.g. '(', '|', '\vert', '\ulcorner'
 * 
 * @return {?string} The delimiter (as a character or command) or null
 */
Parser.prototype.scanDelim = function() {
    this.parseToken('space');

    const token = this.get();
    if (!token) return null;

    let delim = '.';
    if (token.type === 'command') {
        delim = '\\' + token.value;
    } else if (token.type === 'literal') {
        delim = token.value;
    }
    const info = Definitions.getInfo(delim, 'math');
    if (!info) return null;

    if (info.type === 'mopen' || info.type === 'mclose') {
        return delim;
    }

    // Some symbols are not of type mopen/mclose, but are still 
    // valid delimiters...
    if (['|', '<', '>', '\\vert', '\\Vert', '\\|', '\\surd', 
        '\\uparrow', '\\downarrow', '\\Uparrow', '\\Downarrow', 
        '\\updownarrow', '\\Updownarrow', 
        '\\mid', '\\mvert', '\\mVert'].includes(delim)) {
        return delim;
    }

    return null;
}

/**
 * Parse a /left.../right sequence
 * Note: the /middle command can occur multiple times inside a 
 * /left.../right sequence, and is handled separately.
 * Return either a 'leftright' MathAtom or null
 * @return {MathAtom} 
 */
Parser.prototype.scanLeftRight = function() {
    if (!this.parseCommand('left')) return null;
    const leftDelim = this.scanDelim() || '.';

    const savedMathList = this.swapMathList([]);
    while(!this.end() && !this.parseCommand('right')) {
        this.parseAtom();
    }
    
    const rightDelim = this.scanDelim() || '.';

    const result = new MathAtom(this.parseMode, 'leftright');
    result.leftDelim = leftDelim;
    result.rightDelim = rightDelim;
    result.body = this.swapMathList(savedMathList);

    return result;
}

/**
 * Parse a subscript/superscript: ^ and _
 * Modify the last atom accordingly.
 * @return {MathAtom} 
 */
Parser.prototype.parseSupSub = function() {
    // No sup/sub in text or command mode.
    if (this.parseMode !== 'math') return false;

    // Apply the subscript/superscript to the last render atom.
    // If none is present (begining of the mathlist, i.e. {^2},
    // an empty atom will be created, equivalent to {{}^2}
    let result = false;

    while (this.hasToken('^') || this.hasToken('_') || this.hasLiteral('\'')) {
        if (this.parseToken('^')) {
            const arg = this.scanArg();
            if (arg) {
                const atom = this.lastMathAtom();
                atom.superscript = atom.superscript || [];
                atom.superscript = atom.superscript.concat(arg);
                result = result || true;
            }

        } else if (this.parseToken('_')) {
            const arg = this.scanArg();
            if (arg) {
                const atom = this.lastMathAtom();
                atom.subscript = atom.subscript || [];
                atom.subscript = atom.subscript.concat(arg);
                result = result || true;
            }

        } else if (this.parseLiteral("'")) {
            // A single quote (prime) is actually equivalent to a 
            // '^{\prime}'
            const atom = this.lastMathAtom();
            atom.superscript = atom.superscript || [];
            atom.superscript.push(
                new MathAtom(atom.parseMode, 'mord', '\u2032', 'main')
            );
                result = result || true;
        }
    }

    return result;
}

/**
 * Parse a \limits or \nolimits command
 * This will change the placement of limits to be either above or below
 * (if \limits) or in the superscript/subscript position (if \nolimits)
 * This overrides the calculation made for the placement, which is usually
 * dependent on the displaystyle (inlinemath prefers \nolimits, while 
 * displaymath prefers \limits).
 */
Parser.prototype.parseLimits = function() {
    // Note: technically, \limits and \nolimits are only applicable
    // after an operator. However, we apply them in all cases. They
    // will simply be ignored when not applicable (i.e. on a literal)
    // which is actually consistent with TeX.
    if (this.parseCommand('limits')) {
        const lastAtom = this.lastMathAtom()
        lastAtom.limits = 'limits';
        // Record that the limits was set through an explicit command
        // so we can generate the appropriate LaTeX later
        lastAtom.explicitLimits = true;
        return true;
    }
    if (this.parseCommand('nolimits')) {
        const lastAtom = this.lastMathAtom()
        lastAtom.limits = 'nolimits';
        // Record that the limits was set through an explicit command
        // so we can generate the appropriate LaTeX later
        lastAtom.explicitLimits = true;
        return true;
    }

    return false;
}

Parser.prototype.scanOptionalArg = function(parseMode) {
    parseMode = (!parseMode || parseMode === 'auto') ? this.parseMode : parseMode;
    this.parseToken('space');

    if (!this.parseLiteral('[')) return null;

    const savedParseMode = this.parseMode;
    this.parseMode = parseMode;
    const savedMathlist = this.swapMathList();
    let result;
    while (!this.end() && !this.parseLiteral(']')) {
        if (parseMode === 'string') {
            result = this.scanString();
        } else if (parseMode === 'number') {
            result = this.scanNumber();
        } else if (parseMode === 'dimen') {
            result = this.scanDimen();
        } else if (parseMode === 'skip') {
            result = this.scanSkip();
        } else if (parseMode === 'colspec') {
            result = this.scanColspec();
        } else if (parseMode === 'color') {
            result = this.scanColor() || '#ffffff';
        } else if (parseMode === 'bbox') {
            // The \bbox command takes a very particular argument:
            // a comma delimited list of up to three arguments:
            // a color, a dimension and a string.
            const list = this.scanString().toLowerCase().trim().split(',');
            for (const elem of list) {
                const color = Color.stringToColor(elem);
                if (color) {
                    result = result || {};
                    result.backgroundcolor = color;
                } else {
                    const m = elem.match(/^\s*([0-9.]+)\s*([a-z][a-z])/);
                    if (m) {
                        result = result || {};
                        result.padding = convertDimenToEm(parseFloat(m[1]), m[2]);
                    } else {
                        const m = elem.match(/^\s*border\s*:\s*(.*)/);
                        if (m) {
                            result = result || {};
                            result.border = m[1];
                        }
                    }
                }
            }
        } else {
            console.assert(parseMode === 'math', 
                'Unexpected parse mode: "' + parseMode + '"');
            this.mathList = this.mathList.concat(
                this.scanImplicitGroup(token => 
                    token.type === 'literal' && token.value === ']'));
        }
    }
    this.parseMode = savedParseMode;
    const mathList = this.swapMathList(savedMathlist);
    return result ? result : mathList;
}


/**
 * Parse a math field, an argument to a function.
 * An argument can either be a single atom or 
 * a sequence of atoms enclosed in braces.
 * The optional 'type' overrides temporarily the parsemode
 * {string} parseMode 'dimension', 'color', 'text'. A parsemode.
 */
Parser.prototype.scanArg = function(parseMode) {
    parseMode = (!parseMode || parseMode === 'auto') ? this.parseMode : parseMode;
    this.parseFiller();

    let result;

    // An argument (which is called a 'math field' in TeX)
    // could be a single character or symbol, as in \frac12
    // Note that ``\frac\sqrt{-1}\alpha\beta`` is equivalent to
    // ``\frac{\sqrt}{-1}{\beta}``
    if (!this.parseToken('{')) {
        if (parseMode === 'delim') {
            return this.scanDelim() || '.';
        } else if (parseMode === 'math') {
            // Parse a single atom.
            const savedParseMode = this.parseMode;
            this.parseMode = 'math';

            const atom = this.scanToken();

            this.parseMode = savedParseMode;

            return atom ? [atom] : null;
        }
    }

    // If this is a param token, substitute it with the
    // (optional) argument passed to the parser
    if (this.hasToken('#')) {
        const paramToken = this.get();
        this.skipUntilToken('}');
        if (paramToken.value === '?') {
            // '#?' indicates that a placeholder should be used
            // Returning null will trigger the placeholder insertion
            // U+2753 = BLACK QUESTION MARK ORNAMENT  
            return [new MathAtom(this.parseMode, 'placeholder', '\u2753')];
        }
        if (this.args) {
            return this.args[paramToken.value] || null;
        }
        return null;
    }

    const savedParseMode = this.parseMode;
    this.parseMode = parseMode;
    const savedMathList = this.swapMathList([]);

    
    if (parseMode === 'string') {
        result = this.scanString();
        this.skipUntilToken('}');

    } else if (parseMode === 'number') {
        result = this.scanNumber();
        this.skipUntilToken('}');

    } else if (parseMode === 'dimen') {
        result = this.scanDimen();
        this.skipUntilToken('}');

    } else if (parseMode === 'skip') {
        result = this.scanSkip();
        this.skipUntilToken('}');

    } else if (parseMode === 'colspec') {
        result = this.scanColspec();
        this.skipUntilToken('}');

    } else if (parseMode === 'color') {
        result = this.scanColor() || '#ffffff';
        this.skipUntilToken('}');

    } else if (parseMode === 'delim') {
        result = this.scanDelim() || '.';
        this.skipUntilToken('}');

    } else {
        console.assert(parseMode === 'math' || parseMode === 'text', 
            'Unexpected parse mode: "' + parseMode + '"');

        do {
            this.mathList = this.mathList.concat(this.scanImplicitGroup());
        } while(!this.parseToken('}') && !this.end());
    }

    this.parseMode = savedParseMode;
    const mathList = this.swapMathList(savedMathList);
    return result ? result : mathList;
}


/**
 * @return {MathAtom}
 */
Parser.prototype.scanToken = function() {
    const token = this.get();
    if (!token) return null;

    let result = null;

    if (token.type === 'space') {
        if (this.parseMode === 'text') {
            result = new MathAtom('text', 'textord', ' ');
        }
    } else if (token.type === 'esc') {
        // RENDER ESCAPE SEQUENCE INDICATOR
        result = new MathAtom(this.parseMode, 'esc', 'ESC');

    } else if (token.type === 'backslash') {
        // RENDER BACKSLASH INDICATOR
        result = new MathAtom(this.parseMode, 'command', '\\');

    } else if (token.type === 'commandliteral' || token.type === 'backslash') {
        // RENDER ESCAPE SEQUENCE
        let body = token.value;
        while (this.hasToken('commandliteral') || 
                this.hasToken('backslash')) {
            body += this.get().value;
        }

        result = new MathAtom(this.parseMode, 'command', body);

    } else if (token.type === 'placeholder') {
        // RENDER PLACEHOLDER
        result = new MathAtom(this.parseMode, 'placeholder', token.value);

    } else if (token.type === 'command') {
        // RENDER COMMAND
        if (token.value === 'char') {
            // \char has a special syntax and requires a non-braced integer 
            // argument
            let codepoint = this.scanNumber(true);
            if (isNaN(codepoint)) codepoint = 0x2753; // BLACK QUESTION MARK
            result = new MathAtom(this.parseMode,
                this.parseMode === 'math' ? 'mord' : 'textord', 
                String.fromCodePoint(codepoint), 
                'main');
            result.latex = '\\char"' + 
                ('000000' + codepoint.toString(16)).toUpperCase().substr(-6);

        } else if (token.value === 'hskip' || token.value === 'kern') {
            // \hskip and \kern have a special syntax and requires a non-braced 
            // 'skip' argument
            const width = this.scanSkip();
            if (!isNaN(width)) {
                result = new MathAtom(this.parseMode, 'spacing');
                result.width = width;
            }

        } else {
            const info = Definitions.getInfo('\\' + token.value, this.parseMode);
            const args = [];

            // Parse the arguments
            if (info && info.params) {
                for (const param of info.params) {
                    // Parse an argument
                    if (param.optional) {
                        // If it's not present, return the default argument value
                        const arg = this.scanOptionalArg(param.type);
                // args.push(arg ? arg : param.defaultValue); @todo defaultvalue
                        args.push(arg);

                    } else {
                        // If it's not present, scanArg returns null.
                        // Add a placeholder instead.
                        const arg = this.scanArg(param.type);
                        if (arg && arg.length === 1 && 
                            arg[0].type === 'placeholder' && param.placeholder) {
                            arg[0].value = param.placeholder;
                        }
                        if (arg) {
                            args.push(arg);
                        } else {
                            const placeholder = param.placeholder ||
                                '\u2753'; // U+2753 = BLACK QUESTION MARK ORNAMENT  
                            args.push([new MathAtom(this.parseMode, 'placeholder', placeholder)]);
                        }                            
                        // @todo should check for greediness of argument here 
                        // (should be < greediness of command)
                    }
                }
           }

            if (info && !info.infix) {
                // Infix commands should be handled in scanImplicitGroup
                // If we find an infix command here, it's a syntax error
                // (second infix command in an implicit group) and should be ignored.

                // Create the MathAtom
                // If a handler is present, invoke it with the arguments, 
                // and pass the result to be appended by the constructor.
                if (info.handler) {
                    result =  new MathAtom(
                            this.parseMode, info.type, 
                            null, 
                            info.fontFamily,
                            info.handler('\\' + token.value, args));
                } else {
                    result =  new MathAtom(
                            this.parseMode, info.type || 'mop', 
                            info.value || token.value, 
                            info.fontFamily);
                }
                result.latex = '\\' + token.value + ' ';
            }
        }

    } else if (token.type === 'literal') {
        const info = Definitions.getInfo(token.value, this.parseMode);
        if (info) {
            result = new MathAtom(this.parseMode,  info.type, 
                info.value || token.value, info.fontFamily);
        } else {
            console.warn('Unknown literal "' + token.value + 
                '" (U+' + ('000000' + token.value.charCodeAt(0).toString(16)).substr(-6) + ')');
            result = new MathAtom(this.parseMode, 
                this.parseMode === 'math' ? 'mord' : 'textord', 
                token.value, 'main');
        }
        result.latex = Definitions.matchCodepoint(token.value);

    } else if (token.type === '#') {
        // Parameter token in an implicit group (not as a parameter)
        if (token.value === '?') {
            // U+2753 = BLACK QUESTION MARK ORNAMENT  
            result = new MathAtom(this.parseMode, 'placeholder', '\u2753');
        } else if (this.args) {
            result = this.args[token.value] || null;
            if (Array.isArray(result) && result.length === 1) {
                result = result[0];
            } else if (Array.isArray(result)) {
                const group = new MathAtom(this.parseMode, 'group');
                group.children = result;
                result = group;
            }
        }
    } else {
        console.warn('Unexpected token type "' + token.type + '"');
    }
    return result;
}

/**
 * Make a MathAtom for the current token or token group and 
 * add it to the parser's current mathList
 */
Parser.prototype.parseAtom = function() {
    let result = this.scanEnvironment() ||
         this.scanModeShift() ||
         this.scanModeSet() ||
         this.scanGroup() || 
         this.scanLeftRight();

    if (!result && (this.parseSupSub() || this.parseLimits())) return true;

    if (!result) result = this.scanToken();

    // If we have an atom to add, push it at the end of the current math list
    // We could have no atom for tokens that were skipped, a ' ' in mathmode
    // for example
    if (result) this.mathList.push(result);
    
    return result !== null;
}


function parseTokens(tokens, parseMode, args) {
    let mathlist = [];
    const parser = new Parser(tokens, args);
    parser.parseMode = parseMode || 'math';  // other possible values: 'text', 'color', etc...
    while(!parser.end()) {
        mathlist = mathlist.concat(parser.scanImplicitGroup());
    }
    return mathlist;
}

// Export the public interface for this module
return { 
    Parser: Parser,
    parseTokens: parseTokens
}


})
