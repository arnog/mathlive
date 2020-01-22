define(['mathlive/mathlive'], function(MathLive) {
    // Render all the static math in the document
    // MathLive.renderMathInDocument({ignoreClass: "mathfield"});

    const mf1 = MathLive.makeMathField(document.getElementById('mf1'));

    // As a shortcut, makeMathField can be passed the ID of the element
    const mf2 = MathLive.makeMathField('mf2');
});
