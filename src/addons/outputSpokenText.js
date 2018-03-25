


define(['mathlive/core/mathAtom', 
    'mathlive/core/definitions', 
    'mathlive/editor/editor-popover'], 
    function(MathAtom, Definitions, Popover) {

const PRONUNCIATION = {
    '\\alpha':      ' alpha ',
    '\\mu':         ' mew ',
    '\\sigma':      ' sigma ',
    '\\pi':         ' pie ',
    '\\imaginaryI':   ' eye ',

    '\\sum':        ' Summation ',
    '\\prod':       ' Product ',

    '|':            ' Vertical bar',
    '(':            ' Open paren [[slnc 150]]',
    ')':            ' [[slnc 150]] Close paren',
    '=':            ' [[slnc 150]] equals ',
    '\\lt':         ' [[slnc 150]] is less than ',
    '\\le':         ' [[slnc 150]] is less than or equal to ',
    '\\gt':         ' [[slnc 150]] is greater than ',
    '\\ge':         ' [[slnc 150]] is greater than or equal to ',
    '\\geq':        ' [[slnc 150]]is greater than or equal to ',
    '\\leq':        ' [[slnc 150]]is less than or equal to ',
    '!':            ' factorial ',
    '\\sin':        ' sine ',
    '\\cos':        ' cosine ',
    '\u200b':       '',
    '\u2212':       ' minus ',
    '\\colon':      '[[slnc 150]] such that [[slnc 200]]',
    '\\hbar':       'etch bar',
    '\\iff':         ' if and only if ',
    '\\land':       ' and ',
    '\\lor':        ' or ',
    '\\neg':        ' not ',
    '\\div':        'divided by',
    
    '\\forall':     ' for all ',
    '\\exists':     ' there exists ',
    '\\nexists':    ' there does not exists ',

    '\\in':         ' element of ',

    '\\N':          ' the set [[char LTRL]]n[[char NORM]]',
    '\\C':          ' the set [[char LTRL]]c[[char NORM]]',
    '\\Z':          ' the set [[char LTRL]]z[[char NORM]]',
    '\\Q':          ' the set [[char LTRL]]q[[char NORM]]',

    '\\infty':      ' infinity ',

    '\\nabla':      ' nabla ',

    '\\partial':    ' partial derivative of ',

    '\\cdots':      ' dot dot dot ',

    '\\lbrace':		'left brace',
    '\\rbrace':		'right brace',
    '\\langle':		'left angle bracket',
    '\\rangle':		'right angle bracket',
    '\\lfloor':		'left floor',
    '\\rfloor':		'right floor',
    '\\lceil':		'left ceiling',
    '\\rceil':		'right ceiling',
    '\\vert':		'vertical bar',
    '\\mvert':		'divides',
    '\\lvert':		'left vertical bar',
    '\\rvert':		'right vertical bar',
    '\\lbrack':		'left bracket',
    '\\rbrack':		'right bracket',    
}


function getSpokenName(latex) {
    let result = Popover.NOTES[latex];
    if (!result && latex.charAt(0) === '\\') {
        result = latex.replace('\\', '');
    }

    // If we got more than one result (from NOTES), 
    // pick the first one.
    if (Array.isArray(result)) {
        result = result[0];
    }

    return result;
}


function platform(p) {
    let result = 'other';
    if (navigator && navigator.platform && navigator.userAgent) {
        if (/^(mac)/i.test(navigator.platform)) {
            result = 'mac';
        } else if (/^(win)/i.test(navigator.platform)) {
            result = 'win';
        } else if (/(android)/i.test(navigator.userAgent)) {
            result = 'android';
        } else if (/(iphone)/i.test(navigator.userAgent) ||
                    /(ipod)/i.test(navigator.userAgent) ||
                    /(ipad)/i.test(navigator.userAgent)) {
            result = 'ios';
        } else if (/\bCrOS\b/i.test(navigator.userAgent)) {
            result = 'chromeos';
        }
    }

    return result === p ? p : '!' + p;
}


function isAtomic(mathlist) {
    let count = 0;
    if (mathlist && Array.isArray(mathlist)) {
        for (const atom of mathlist) {
            if (atom.type !== 'first') {
                count += 1;
            }
        }
    }
    return count === 1;
}

function atomicValue(mathlist) {
    let result = '';
    if (mathlist && Array.isArray(mathlist)) {
        for (const atom of mathlist) {
            if (atom.type !== 'first') {
                result += atom.value;
            }
        }
    }
    return result;
}



// See https://pdfs.semanticscholar.org/8887/25b82b8dbb45dd4dd69b36a65f092864adb0.pdf

// "<audio src='non_existing_file.au'>File could not be played.</audio>"

// "I am now <prosody rate='+0.06'>speaking 6% faster.</prosody>"

// https://stackoverflow.com/questions/16635653/ssml-using-chrome-tts

// https://developer.apple.com/library/content/documentation/UserExperience/Conceptual/SpeechSynthesisProgrammingGuide/FineTuning/FineTuning.html#//apple_ref/doc/uid/TP40004365-CH5-SW3

// https://pdfs.semanticscholar.org/8887/25b82b8dbb45dd4dd69b36a65f092864adb0.pdf

MathAtom.MathAtom.prototype.toSpeakableText = function(atom) {
    return MathAtom.toSpeakableFragment(atom, {markup: false});
}

MathAtom.toSpeakableFragment = function(atom, options) {
function letter(c) {
    let result = '';
    if (!options.markup) {
        if (/[a-z]/.test(c)) {
            result += " '" + c.toUpperCase() + "'";
            // result += ' "' + atom.value.toUpperCase() + '"';
        } else if (/[A-Z]/.test(c)) {
            result += " 'capital " + c.toUpperCase() + "'";
        } else {
            result += c;
        }
    } else {
        if (/[a-z]/.test(c)) {
            result += ' [[char LTRL]]' + c + '[[char NORM]]';
            // result += ' "' + atom.value.toUpperCase() + '"';
        } else if (/[A-Z]/.test(c)) {
            result += 'capital ' + c.toLowerCase() + '';
        } else {
            result += c;
        }
    }
    return result;
}

function emph(s) {
    // if (options.markup === 'ssml') {
    // } else 
    if (options.markup) {
        return '[[emph +]]' + s;
    }
    return s;
}


    let result = '';
    if (Array.isArray(atom)) {
        for (let i = 0; i < atom.length; i++) {
            if (i < atom.length - 2 &&  
                atom[i].type === 'mopen' && 
                atom[i + 2].type === 'mclose' &&
                atom[i + 1].type === 'mord') {
                result += ' of ';
                result += emph(MathAtom.toSpeakableFragment(atom[i + 1], options));
                i += 2;
            } else {
                result += MathAtom.toSpeakableFragment(atom[i], options);
            }
        }
    } else {
        const markup = typeof options.markup === 'undefined' ? false : options.markup;
        let numer = '';
        let denom = '';
        let body = '';
        let supsubHandled = false;
        switch(atom.type) {
            case 'group':
            case 'root':
                result += MathAtom.toSpeakableFragment(atom.children, options);
                break;

            case 'genfrac':
                numer = MathAtom.toSpeakableFragment(atom.numer, options);
                denom = MathAtom.toSpeakableFragment(atom.denom, options);
                if (isAtomic(atom.numer) && isAtomic(atom.denom)) {
                    const COMMON_FRACTIONS = {
                        '1/2':      ' half ',
                        '1/3':      ' one third ',
                        '2/3':      ' two third',
                        '1/4':      ' one quarter ',
                        '3/4':      ' three quarter ',
                        '1/5':      ' one fifth ',
                        '2/5':      ' two fifths ',
                        '3/5':      ' three fifths ',
                        '4/5':      ' four fifths ',
                        '1/6':      ' one sixth ',
                        '5/6':      ' five sixts ',
                        '1/8':      ' one eight ',
                        '3/8':      ' three eights ',
                        '5/8':      ' five eights ',
                        '7/8':      ' seven eights ',
                        '1/9':      ' one ninth ',
                        '2/9':      ' two ninths ',
                        '4/9':      ' four ninths ',
                        '5/9':      ' five ninths ',
                        '7/9':      ' seven ninths ',
                        '8/9':      ' eight ninths ',
                        // '1/10':     ' one tenth ',
                        // '1/12':     ' one twelfth ',
                        'x/2':     ' half [[char LTRL]] X [[char NORM]] ',
                        // '/2':     ' half [[char LTRL]] X [[char NORM]] ',
                        // 'x/3':     ' a third of [[char LTRL]] X [[char NORM]] ',
                    };
                    const commonFraction = COMMON_FRACTIONS[
                        atomicValue(atom.numer) + '/' + atomicValue(atom.denom)];
                    if (commonFraction) {
                        result = commonFraction;
                    } else {
                        result += numer + ' over ' + denom + ' ';
                    }
                } else {
                    result += ' The fraction [[slnc 200]]' + numer + ', over [[slnc 150]]' + denom + ', End fraction';
                }

                break;
            case 'surd':
                body = MathAtom.toSpeakableFragment(atom.body, options);
                
                if (!atom.index) {
                    if (isAtomic(atom.body)) {
                        result += ' square root of ' + body + ' , ';
                    } else {
                        result += ' The square root of ' + body + ', End square root';
                    }
                } else {
                    let index = MathAtom.toSpeakableFragment(atom.index, options);
                    index = index.trim();
                    if (index === '3') {
                        result += ' The cube root of ' + body + ', End cube root';
                    } else if (index === 'n') {
                        result += ' The nth root of ' + body + ', End root';
                    } else {
                        result += ' root with index: ' + index + ', of :' + body + ', End root';
                    }
                }
                break;
            case 'accent':
                break;
            case 'leftright':
                result += atom.leftDelim;
                result += MathAtom.toSpeakableFragment(atom.body, options);
                result +=  atom.rightDelim;
                break;
            case 'line':
                // @todo
                break;
            case 'rule':
                // @todo
                break;
            case 'overunder':
                // @todo
                break;
            case 'overlap':
                // @todo
                break;
            case 'placeholder':
                result += 'placeholder ' + atom.value;
                break;
            case 'delim':
            case 'sizeddelim':
            case 'mord':
            case 'minner':
            case 'mbin':
            case 'mrel':
            case 'mpunct':
            case 'mopen':
            case 'mclose':
            case 'textord':
            {
                let atomValue = atom.value;
                let latexValue = atom.latex;
                if (atom.type === 'delim' || atom.type === 'sizeddelim') {
                    atomValue = latexValue = atom.delim;
                }
                if (options.mode === 'text') {
                    result += atomValue;
                } else {
                    if (atom.type === 'mbin') {
                        result += '[[slnc 150]]';
                    }

                    if (atomValue) {
                        const value = PRONUNCIATION[atomValue] || 
                            (latexValue ? PRONUNCIATION[latexValue.trim()] : '');
                        if (value) {
                            result += ' ' + value;
                        } else {
                            const spokenName = latexValue ? 
                                getSpokenName(latexValue.trim()) : '';
                            
                            result += spokenName ? spokenName : letter(atomValue);
                        }
                    } else {
                        result += MathAtom.toSpeakableFragment(atom.children, options);
                    }
                    if (atom.type === 'mbin') {
                        result += '[[slnc 150]]';
                    }
                }
                break;
            }
            case 'op':
            case 'mop':
            // @todo
                if (atom.value !== '\u200b') {
                    // Not ZERO-WIDTH
                    const trimLatex = atom.latex ? atom.latex.trim() : '' ;
                    if (trimLatex === '\\sum') {
                        if (atom.superscript && atom.subscript) {
                            let sup = MathAtom.toSpeakableFragment(atom.superscript, options);
                            sup = sup.trim();
                            let sub = MathAtom.toSpeakableFragment(atom.subscript, options);
                            sub = sub.trim();
                            result += ' The summation from ' + sub + ' to  [[slnc 150]]' + sup + ' of [[slnc 150]]';
                            supsubHandled = true;
                        } else {
                            result += ' The summation  of';
                        }
                    } else if (trimLatex === '\\prod') {
                        if (atom.superscript && atom.subscript) {
                            let sup = MathAtom.toSpeakableFragment(atom.superscript, options);
                            sup = sup.trim();
                            let sub = MathAtom.toSpeakableFragment(atom.subscript, options);
                            sub = sub.trim();
                            result += ' The product from ' + sub + ' to ' + sup + ' of [[slnc 150]]';
                            supsubHandled = true;
                        } else {
                            result += ' The product  of ';
                        }
                    } else if (trimLatex === '\\int') {
                        if (atom.superscript && atom.subscript) {
                            let sup = MathAtom.toSpeakableFragment(atom.superscript, options);
                            sup = sup.trim();
                            let sub = MathAtom.toSpeakableFragment(atom.subscript, options);
                            sub = sub.trim();
                            result += ' The integral from ' + emph(sub) + ' to ' + emph(sup) + ' [[slnc 200]] of ';
                            supsubHandled = true;
                        } else {
                            result += ' integral ';
                        }
                    } else if (atom.value) {
                        const value = PRONUNCIATION[atom.value] || 
                            PRONUNCIATION[atom.latex.trim()];
                        if (value) {
                            result += value;
                        } else {
                            result += ' ' + atom.value;
                        }
                    } else if (atom.latex && atom.latex.length > 0) {
                        if (atom.latex[0] === '\\') {
                            result += ' ' + atom.latex.substr(1);
                        } else {
                            result += ' ' + atom.latex;
                        }
                    }
                }
                break;
            case 'font':
                options.mode = 'text';
                result += '[[slnc 150]]';
                result += MathAtom.toSpeakableFragment(atom.body, options);
                result += '[[slnc 150]]';
                options.mode = 'math';
                break;

            case 'enclose':
                body = MathAtom.toSpeakableFragment(atom.body, options);
                
                if (isAtomic(atom.body)) {
                    result += ' crossed out ' + body + ' , ';
                } else {
                    result += ' crossed out ' + body + ' End cross out';
                }
                break;

            case 'space':
            case 'spacing':
            case 'color':
            case 'sizing':
            case 'mathstyle':
            case 'box':
                // @todo
                break;
                
        }
        if (!supsubHandled && atom.superscript) {
            let sup = MathAtom.toSpeakableFragment(atom.superscript, options);
            sup = sup.trim();
            if (isAtomic(atom.superscript)) {
                if (sup === '\u2032') {
                    result += ' prime ';
                } else if (sup === '2') {
                    result += ' squared ';
                } else if (sup === '3') {
                    result += ' cubed ';                
                } else {
                    result += ' to the ' + sup + '; ';
                }
            } else {
                result += ' raised to the [[pbas +4]]' + sup + ' [[pbas -4]] power. ';
            }
        }
        if (!supsubHandled && atom.subscript) {
            let sub = MathAtom.toSpeakableFragment(atom.subscript, options);
            sub = sub.trim();
            if (isAtomic(atom.subscript)) {
                result += ' sub ' + sub;
            } else {
                result += ' subscript ' + sub + ' End subscript. ';
            }
        }
        // If no markup was requested, remove any that we may have
        if (markup === 'ssml') {
            // @todo: convert VoiceOver markup to SSML
        } else if (!markup) {
            result = result.replace(/\[\[[^\]]*\]\]/g, '');
        }
    }


    return result;
}


/**
 * @param {MathAtom[]}  [atoms] The atoms to represent as speakable text.
 * If omitted, `this` is used.
 * @param {Object.<string, any>} [options]
*/
MathAtom.toSpeakableText = function(atoms, options) {
    if (!options) {
        options = {
            markup: false
        }
    }
    let result = '';
    if (options.markup === 'ssml') {
        result = `<!-- ?xml version="1.0"? -->
<speak xmlns="http://www.w3.org/2001/10/synthesis"
version="1.0"><p><s xml:lang="en-US">`;
    } else if (options.markup) {
        if (platform('mac') === '!mac') {
            options.markup = false;
        }
    }

    result += MathAtom.toSpeakableFragment(atoms, options);

    if (options.markup === 'ssml') {
        result += '</s></p></speak>';
    }
    return result;

}

// Export the public interface for this module
return {}
})
