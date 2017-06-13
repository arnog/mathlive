"use strict"
define(["mathlive/core/mathAtom"],function(t){return t.MathAtom.prototype.toLatex=function(){var t=""
switch(this.type){case"group":case"root":var r=!0,e=!1,a=void 0
try{for(var i,o=this.children[Symbol.iterator]();!(r=(i=o.next()).done);r=!0){t+=i.value.toLatex()}}catch(t){e=!0,a=t}finally{try{!r&&o.return&&o.return()}finally{if(e)throw a}}break
case"genfrac":t+="\\frac",t+="{"
var l=!0,n=!1,s=void 0
try{for(var c,h=this.numer[Symbol.iterator]();!(l=(c=h.next()).done);l=!0){t+=c.value.toLatex()}}catch(t){n=!0,s=t}finally{try{!l&&h.return&&h.return()}finally{if(n)throw s}}t+="}",t+="{"
var y=!0,f=!1,u=void 0
try{for(var v,m=this.denom[Symbol.iterator]();!(y=(v=m.next()).done);y=!0){t+=v.value.toLatex()}}catch(t){f=!0,u=t}finally{try{!y&&m.return&&m.return()}finally{if(f)throw u}}t+="}"
break
case"surd":if(t+="\\sqrt",this.index){t+="["
var d=!0,x=!1,b=void 0
try{for(var p,L=this.index[Symbol.iterator]();!(d=(p=L.next()).done);d=!0){t+=p.value.toLatex()}}catch(t){x=!0,b=t}finally{try{!d&&L.return&&L.return()}finally{if(x)throw b}}t+="]"}t+="{"
var w=!0,S=!1,g=void 0
try{for(var k,A=this.body[Symbol.iterator]();!(w=(k=A.next()).done);w=!0){t+=k.value.toLatex()}}catch(t){S=!0,g=t}finally{try{!w&&A.return&&A.return()}finally{if(S)throw g}}t+="}"
break
case"accent":break
case"leftright":t+="\\left"+this.leftDelim
var D=!0,_=!1,q=void 0
try{for(var z,M=this.body[Symbol.iterator]();!(D=(z=M.next()).done);D=!0){t+=z.value.toLatex()}}catch(t){_=!0,q=t}finally{try{!D&&M.return&&M.return()}finally{if(_)throw q}}t+="\\right"+this.rightDelim
break
case"delim":case"sizeddelim":case"line":case"rule":case"overunder":case"overlap":break
case"mord":case"minner":case"mbin":case"mrel":case"mpunct":case"mopen":case"mclose":case"textord":if(this.value)"​"!==this.value&&(t+=this.latex||this.value)
else{var j=!0,B=!1,C=void 0
try{for(var E,F=this.children[Symbol.iterator]();!(j=(E=F.next()).done);j=!0){t+=E.value.toLatex()}}catch(t){B=!0,C=t}finally{try{!j&&F.return&&F.return()}finally{if(B)throw C}}}break
case"op":case"mop":"​"!==this.value&&(t+=this.latex||this.value),this.explicitLimits&&("limits"===this.limits&&(t+="\\limits "),"nolimits"===this.limits&&(t+="\\nolimits "))}if(this.superscript){var G="",H=!0,I=!1,J=void 0
try{for(var K,N=this.superscript[Symbol.iterator]();!(H=(K=N.next()).done);H=!0){G+=K.value.toLatex()}}catch(t){I=!0,J=t}finally{try{!H&&N.return&&N.return()}finally{if(I)throw J}}t+=1===G.length?"^"+G:"^{"+G+"}"}if(this.subscript){var O="",P=!0,Q=!1,R=void 0
try{for(var T,U=this.subscript[Symbol.iterator]();!(P=(T=U.next()).done);P=!0){O+=T.value.toLatex()}}catch(t){Q=!0,R=t}finally{try{!P&&U.return&&U.return()}finally{if(Q)throw R}}t+=1===O.length?"_"+O:"_{"+O+"}"}return t},{}})
