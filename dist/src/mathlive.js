"use strict"
define(["mathlive/core/lexer","mathlive/core/mathAtom","mathlive/core/parser","mathlive/core/context","mathlive/core/span","mathlive/editor/editor-mathfield"],function(e,t,a,i,r,l){function h(i,l,h){var n=e.tokenize(i),o=a.parseTokens(n)
if("mathlist"===h)return o
var m=t.decompose({mathstyle:l?"displaystyle":"textstyle"},o)
if(m=r.coalesce(m),"span"===h)return m
var s=r.makeSpan(m,"ML__base"),p=r.makeSpan("","ML__strut")
p.setStyle("height",s.height,"em")
var c=r.makeSpan("","ML__strut ML__bottom")
return c.setStyle("height",s.height+s.depth,"em"),c.setStyle("vertical-align",-s.depth,"em"),r.makeSpan([p,c,s],"ML__mathlive").toMarkup()}function n(e,t){return new l.MathField(e,t)}function o(){t.toSpeakableText()}return{latexToMarkup:h,latexToSpeakableText:o,makeMathField:n,MathField:l.MathField}})
