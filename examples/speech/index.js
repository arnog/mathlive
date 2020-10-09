'use strict';

function init_interactive_atoms() {
    add_class_to_all_atoms();
    add_onmouseover_to_atoms();
}

// Add a class name to each of the atoms so that it is easy to access
function add_class_to_all_atoms() {
    var elements_to_iter = [document.getElementById('mf')];
    while (elements_to_iter.length > 0) {
        let element = elements_to_iter.pop();
        elements_to_iter.push.apply(elements_to_iter, element.children);
        if (element.hasAttribute('data-atom-id')) {
            element.className += ' data-atom';
            element.className = element.className.trim();
        }
    }
}

// Add onhover functionality to the atoms
function add_onmouseover_to_atoms() {
    var atom_elements = document.getElementsByClassName('data-atom');
    for (let atom_idx = 0; atom_idx < atom_elements.length; atom_idx++) {
        let atom_element = atom_elements[atom_idx];

        atom_element.onmouseover = function () {
            var curr_token = atom_element.getAttribute('data-atom-id');
            MathLive.playReadAloud(curr_token);

            for (
                let atom_idx = 0;
                atom_idx < atom_elements.length;
                atom_idx++
            ) {
                let atom_element = atom_elements[atom_idx];

                atom_element.onmouseover = undefined;
            }
        };
    }
}

function select_text_in_element(element) {
    console.log(element);
    if (document.body.createTextRange) {
        let range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        let selection = window.getSelection();
        let range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        console.warn('Could not select text in node: Unsupported browser.');
    }
}

function speak_all() {
    mf.executeCommand(['speak', 'all', { withHighlighting: true }]);
}

function speak_pause_resume() {
    if (window.mathlive === undefined) {
        speak_all();
        return;
    }
    if (window.mathlive.readAloudAudio.paused) {
        var curr_token = window.mathlive.readAloudCurrentToken;
        if (window.mathlive.readAloudAudio.ended) {
            curr_token = window.mathlive.readAloudTokens[0];
        }
        MathLive.playReadAloud(curr_token);
    } else {
        MathLive.pauseReadAloud();
    }
}

function speak_stop() {
    if (window.mathlive === undefined) {
        return;
    }

    MathLive.pauseReadAloud();
    window.mathlive.readAloudCurrentToken = window.mathlive.readAloudTokens[0];

    var elements_to_iter = [document.getElementById('mf')];
    while (elements_to_iter.length > 0) {
        let element = elements_to_iter.pop();
        elements_to_iter.push.apply(elements_to_iter, element.children);
        if (element.className.indexOf('ML__highlight') >= 0) {
            element.className = element.className.substr(
                0,
                element.className.length - 10
            );
        }
    }
}

function speak_2prev() {
    if (window.mathlive === undefined) {
        speak_all();
        return;
    }

    var prev_token_idx =
        window.mathlive.readAloudTokens.indexOf(
            window.mathlive.readAloudCurrentToken
        ) - 2;

    if (prev_token_idx < 0) {
        prev_token_idx = 0;
    }

    var is_paused = window.mathlive.readAloudAudio.paused;
    MathLive.playReadAloud(window.mathlive.readAloudTokens[prev_token_idx]);
    // if (is_paused) {
    //     MathLive.pauseReadAloud();
    // }
}

function speak_prev() {
    if (window.mathlive === undefined) {
        speak_all();
        return;
    }

    var prev_token_idx =
        window.mathlive.readAloudTokens.indexOf(
            window.mathlive.readAloudCurrentToken
        ) - 1;

    if (prev_token_idx < 0) {
        prev_token_idx = 0;
    }

    var is_paused = window.mathlive.readAloudAudio.paused;
    MathLive.playReadAloud(window.mathlive.readAloudTokens[prev_token_idx]);
    // if (is_paused) {
    //     MathLive.pauseReadAloud();
    // }
}

function speak_next() {
    if (window.mathlive === undefined) {
        speak_all();
        return;
    }

    var next_token_idx =
        window.mathlive.readAloudTokens.indexOf(
            window.mathlive.readAloudCurrentToken
        ) + 1;
    if (next_token_idx === window.mathlive.readAloudTokens.length - 1) {
        speak_stop();
    }
    if (window.mathlive.readAloudAudio.ended) {
        next_token_idx = 0;
    }
    if (next_token_idx < window.mathlive.readAloudTokens.length) {
        var is_paused = window.mathlive.readAloudAudio.paused;
        MathLive.playReadAloud(window.mathlive.readAloudTokens[next_token_idx]);
        // if (is_paused) {
        //     MathLive.pauseReadAloud();
        // }
    }
}

function speak_goto() {
    if (window.mathlive === undefined) {
        speak_all();
        // too bad...
    }

    add_class_to_all_atoms();
    add_onmouseover_to_atoms();

    // var next_token_idx =
    //     window.mathlive.readAloudTokens.indexOf(window.mathlive.readAloudCurrentToken) + 1;
    // if (next_token_idx === window.mathlive.readAloudTokens.length - 1) {
    //     speak_stop();
    // }
    // if (window.mathlive.readAloudAudio.ended) {
    //     next_token_idx = 0;
    // }
    // if (next_token_idx < window.mathlive.readAloudTokens.length) {
    //     var is_paused = window.mathlive.readAloudAudio.paused;
    //     MathLive.playReadAloud(window.mathlive.readAloudTokens[next_token_idx]);
    //     // if (is_paused) {
    //     //     MathLive.pauseReadAloud();
    //     // }
    // }
}
