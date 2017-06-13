"use strict"
define(["mathlive/core/mathstyle","mathlive/core/context","mathlive/core/fontMetrics","mathlive/core/span","mathlive/core/delimiters"],function(t,e,i,r,s){var a=r.makeSpan,h=r.makeOrd,l=r.makeInner,n=r.makeHlist,o=r.makeVlist,p=i.metrics,m=i.getCharacterMetrics
function u(t,e,i,r,s){if(this.mode=t,this.type=e,this.value=i,this.fontFamily=r,s)for(var a in s)s.hasOwnProperty(a)&&(this[a]=s[a])
if("mord"===this.type||"textord"===this.type){if("mord"===this.type&&"main"===this.fontFamily&&1===this.value.length){var h=this.value.charCodeAt(0);(h>=65&&h<=90||h>=97&&h<=122||h>=945&&h<=969||1009===h||1013===h||977===h||1008===h||982===h||981===h)&&(this.fontFamily="mathit")}"textord"===this.type&&"main"===this.fontFamily&&(this.fontFamily="mathrm"),"main"===this.fontFamily?this.fontFamily="mord"===e?"mathrm":"textrm":"ams"===r&&(this.fontFamily="amsrm")}else"mbin"!==this.type&&"mrel"!==this.type&&"mopen"!==this.type&&"mclose"!==this.type&&"minner"!==this.type&&"mpunct"!==this.type&&"mop"!==this.type||("main"===this.fontFamily?this.fontFamily="mathrm":"ams"===this.fontFamily&&(this.fontFamily="amsrm"))}u.prototype.getBaseElement=function(){return"group"!==this.type&&"color"!==this.type||1!==this.children.length?this.body&&1===this.body.length?this.body[0].getBaseElement():this:this.children[0].getBaseElement()},u.prototype.getInitialBaseElement=function(){return this.children&&this.children.length>0?this.children[0].getFinalBaseElement():this.body&&this.body.length>0?this.body[0].getFinalBaseElement():this},u.prototype.getFinalBaseElement=function(){return this.children&&this.children.length>0?this.children[this.children.length-1].getFinalBaseElement():this.body&&this.body.length>0?this.body[this.body.length-1].getFinalBaseElement():this},u.prototype.isCharacterBox=function(){var t=this.getBaseElement()
return"mord"===t.type||"minner"===t.type||"mbin"===t.type||"mrel"===t.type||"mpunct"===t.type||"mopen"===t.type||"mclose"===t.type||"textord"===t.type},u.prototype.forEach=function(t){if(t(this),this.children){var e=!0,i=!1,r=void 0
try{for(var s,a=this.children[Symbol.iterator]();!(e=(s=a.next()).done);e=!0){s.value.forEach(t)}}catch(t){i=!0,r=t}finally{try{!e&&a.return&&a.return()}finally{if(i)throw r}}}if(this.superscript){var h=!0,l=!1,n=void 0
try{for(var o,p=this.superscript[Symbol.iterator]();!(h=(o=p.next()).done);h=!0){var m=o.value
m&&m.forEach(t)}}catch(t){l=!0,n=t}finally{try{!h&&p.return&&p.return()}finally{if(l)throw n}}}if(this.subscript){var u=!0,c=!1,y=void 0
try{for(var d,f=this.subscript[Symbol.iterator]();!(u=(d=f.next()).done);u=!0){var g=d.value
g&&g.forEach(t)}}catch(t){c=!0,y=t}finally{try{!u&&f.return&&f.return()}finally{if(c)throw y}}}if(this.numer){var v=!0,b=!1,S=void 0
try{for(var x,z=this.numer[Symbol.iterator]();!(v=(x=z.next()).done);v=!0){var M=x.value
M&&M.forEach(t)}}catch(t){b=!0,S=t}finally{try{!v&&z.return&&z.return()}finally{if(b)throw S}}}if(this.denom){var k=!0,w=!1,T=void 0
try{for(var R,F=this.denom[Symbol.iterator]();!(k=(R=F.next()).done);k=!0){var C=R.value
C&&C.forEach(t)}}catch(t){w=!0,T=t}finally{try{!k&&F.return&&F.return()}finally{if(w)throw T}}}if(this.body){var A=!0,L=!1,E=void 0
try{for(var O,D=this.body[Symbol.iterator]();!(A=(O=D.next()).done);A=!0){O.value.forEach(t)}}catch(t){L=!0,E=t}finally{try{!A&&D.return&&D.return()}finally{if(L)throw E}}}if(this.index){var B=!0,I=!1,j=void 0
try{for(var P,q=this.index[Symbol.iterator]();!(B=(P=q.next()).done);B=!0){P.value.forEach(t)}}catch(t){I=!0,j=t}finally{try{!B&&q.return&&q.return()}finally{if(I)throw j}}}if(this.array){var _=!0,H=!1,G=void 0
try{for(var X,Y=this.array[Symbol.iterator]();!(_=(X=Y.next()).done);_=!0){var Z=X.value,N=!0,W=!1,V=void 0
try{for(var J,K=Z[Symbol.iterator]();!(N=(J=K.next()).done);N=!0){J.value.forEach(t)}}catch(t){W=!0,V=t}finally{try{!N&&K.return&&K.return()}finally{if(W)throw V}}}}catch(t){H=!0,G=t}finally{try{!_&&Y.return&&Y.return()}finally{if(H)throw G}}}},u.prototype.filter=function(t){var e=[]
t(this)&&e.push(this)
for(var i=["children","superscript","subscript","numer","denom","body","index"],r=0;r<7;r++){var s=i[r]
if(this[s]){var a=!0,h=!1,l=void 0
try{for(var n,o=this[s][Symbol.iterator]();!(a=(n=o.next()).done);a=!0){var p=n.value
p&&(e=e.concat(p.filter(t)))}}catch(t){h=!0,l=t}finally{try{!a&&o.return&&o.return()}finally{if(h)throw l}}}}if(this.array){var m=!0,u=!1,c=void 0
try{for(var y,d=this.array[Symbol.iterator]();!(m=(y=d.next()).done);m=!0){var f=y.value,g=!0,v=!1,b=void 0
try{for(var S,x=f[Symbol.iterator]();!(g=(S=x.next()).done);g=!0){var z=S.value
z&&(e=e.concat(z.filter(t)))}}catch(t){v=!0,b=t}finally{try{!g&&x.return&&x.return()}finally{if(v)throw b}}}}catch(t){u=!0,c=t}finally{try{!m&&d.return&&d.return()}finally{if(u)throw c}}}return e},u.prototype.decomposeGroup=function(t){var e=t.withMathstyle(this.mathstyle)
return h(b(e,this.children))}
function c(t){var e=a(null,"arraycolsep")
return e.setWidth(t,"em"),e}function y(t,e,i,r){var s=[],h=!0,l=!1,n=void 0
try{for(var p,m=e[Symbol.iterator]();!(h=(p=m.next()).done);h=!0){var u=p.value,c=a(b(t,r))
c.depth=u.depth,c.height=u.height,s.push(c),s.push(u.pos-i)}}catch(t){l=!0,n=t}finally{try{!h&&m.return&&m.return()}finally{if(l)throw n}}return o(t,s,"individualShift")}u.prototype.decomposeArray=function(e){var i=this.colFormat
i&&0===i.length&&(i=[{align:"l"}]),i||(i=[{align:"l"},{align:"l"},{align:"l"},{align:"l"},{align:"l"},{align:"l"},{align:"l"},{align:"l"},{align:"l"},{align:"l"}])
var l=[],n=0,m=!0,u=!1,d=void 0
try{for(var f,g=i[Symbol.iterator]();!(m=(f=g.next()).done);m=!0){f.value.align&&n++}}catch(t){u=!0,d=t}finally{try{!m&&g.return&&g.return()}finally{if(u)throw d}}var v=!0,S=!1,x=void 0
try{for(var z,M=this.array[Symbol.iterator]();!(v=(z=M.next()).done);v=!0)for(var k=z.value,w=0;w<k.length;){for(var T=[],R=Math.min(k.length,w+n);w<R;)T.push(k[w++])
l.push(T)}}catch(t){S=!0,x=t}finally{try{!v&&M.return&&M.return()}finally{if(S)throw x}}1===l[l.length-1].length&&0===l[l.length-1][0].length&&l.pop()
for(var F=t.toMathstyle(this.mathstyle)||e.mathstyle,C=this.arraystretch||1,A=C*p.baselineskip,L=.7*A,E=.3*A,O=0,D=0,B=[],I=l.length,j=0;j<I;++j){var P=l[j]
D=Math.max(D,P.length)
for(var q=L,_=E,H=[],G=0;G<P.length;++G){var X=e.withMathstyle(this.mathstyle||"auto"),Y=b(X,P[G])
if(Y){var Z=[h(null)].concat(Y)
_=Math.max(_,r.depth(Z)),q=Math.max(q,r.height(Z)),H.push(Z)}}var N=j===I-1?0:this.jot||0
this.rowGaps&&this.rowGaps[j]&&(N=this.rowGaps[j])>0&&(N+=E,_<N&&(_=N),N=0),H.height=q,H.depth=_,O+=q,H.pos=O,O+=_+N,B.push(H)}for(var W=O/2+F.metrics.axisHeight,V=[],w=0;w<D;w++){var J=[],K=!0,Q=!1,U=void 0
try{for(var tt,et=B[Symbol.iterator]();!(K=(tt=et.next()).done);K=!0){var it=tt.value,rt=it[w]
rt&&(rt.depth=it.depth,rt.height=it.height,J.push(rt),J.push(it.pos-W))}}catch(t){Q=!0,U=t}finally{try{!K&&et.return&&et.return()}finally{if(Q)throw U}}J.length>0&&V.push(o(e,J,"individualShift"))}var st=[],at=!1,ht=!1,lt=0,nt=!this.lFence,ot=!0,pt=!1,mt=void 0
try{for(var ut,ct=i[Symbol.iterator]();!(ot=(ut=ct.next()).done);ot=!0){var yt=ut.value
if(yt.align&&lt>=V.length)break
if(yt.align&&lt<V.length)at?st.push(c(2*p.arraycolsep)):(ht||nt)&&st.push(c(p.arraycolsep)),st.push(a(V[lt],"col-align-"+yt.align)),lt++,at=!0,ht=!1,nt=!1
else if(void 0!==yt.gap)st.push("number"==typeof yt.gap?c(yt.gap):y(e,B,W,yt.gap)),at=!1,ht=!1,nt=!1
else if(yt.rule){var dt=a(null,"vertical-separator")
dt.setStyle("height",O,"em"),dt.setStyle("margin-top",3*e.mathstyle.metrics.axisHeight-W,"em"),dt.setStyle("vertical-align","top")
var ft=0
ht?ft=p.doubleRuleSep-p.arrayrulewidth:at&&(ft=p.arraycolsep-p.arrayrulewidth),dt.setLeft(ft,"em"),st.push(dt),at=!1,ht=!0,nt=!1}}}catch(t){pt=!0,mt=t}finally{try{!ot&&ct.return&&ct.return()}finally{if(pt)throw mt}}if(at&&!this.rFence&&st.push(c(p.arraycolsep)),!this.lFence&&!this.rFence)return h(st,"mtable")
var gt=a(st,"mtable"),vt=r.height(gt),bt=r.depth(gt)
return h([s.makeLeftRightDelim("mopen",this.lFence,vt,bt,e),gt,s.makeLeftRightDelim("mclose",this.rFence,vt,bt,e)])},u.prototype.decomposeGenfrac=function(e){var i="auto"===this.mathstyle?e.mathstyle:t.toMathstyle(this.mathstyle),r=e.withMathstyle(i),l=[]
this.numerPrefix&&l.push(h(this.numerPrefix,"mathrm"))
var m=this.continuousFraction?i:i.fracNum()
l=l.concat(b(r.withMathstyle(m),this.numer))
var u=n(l,e.mathstyle.adjustTo(m)),c=[]
this.denomPrefix&&c.push(h(this.denomPrefix,"mathrm"))
var y=this.continuousFraction?i:i.fracDen()
c=c.concat(b(r.withMathstyle(y),this.denom))
var d=n(c,e.mathstyle.adjustTo(y)),f=this.hasBarLine?p.defaultRuleThickness/i.sizeMultiplier:0,g=void 0,v=void 0,S=void 0
i.size===t.DISPLAY.size?(g=i.metrics.num1,v=f>0?3*f:7*p.defaultRuleThickness,S=i.metrics.denom1):(f>0?(g=i.metrics.num2,v=f):(g=i.metrics.num3,v=3*p.defaultRuleThickness),S=i.metrics.denom2)
var x=void 0
if(0===f){var z=g-u.depth-(d.height-S)
z<v&&(g+=.5*(v-z),S+=.5*(v-z)),x=o(r,[u,-g,d,S],"individualShift")}else{var M=i.metrics.axisHeight
g-u.depth-(M+.5*f)<v&&(g+=v-(g-u.depth-(M+.5*f))),M-.5*f-(d.height-S)<v&&(S+=v-(M-.5*f-(d.height-S)))
var k=a("",r.mathstyle.adjustTo(t.TEXT)+" frac-line")
k.height=f,x=o(r,[u,-g,d,S,k,f/2-M],"individualShift")}x.classes+=" mfrac",x.height*=i.sizeMultiplier/e.mathstyle.sizeMultiplier,x.depth*=i.sizeMultiplier/e.mathstyle.sizeMultiplier
var w=i.size===t.DISPLAY.size?i.metrics.delim1:i.metrics.delim2,T=s.makeCustomSizedDelim("mopen",this.leftDelim,w,!0,e.withMathstyle(i)),R=s.makeCustomSizedDelim("mclose",this.rightDelim,w,!0,e.withMathstyle(i))
return this.bind(e,h([T,x,R],e.parentMathstyle.adjustTo(i)+(e.parentSize!==e.size?" sizing reset-"+e.parentSize+" "+e.size:"")))},u.prototype.decomposeLeftright=function(t){var e=t.clone(),i=b(e,this.body),a=e.mathstyle,h=0,n=0
h=r.height(i)*a.sizeMultiplier,n=r.depth(i)*a.sizeMultiplier
var o=[]
o.push(s.makeLeftRightDelim("mopen",this.leftDelim,h,n,e))
for(var p=0;p<i.length-1;p++)i[p].delim&&(i[p]=s.makeLeftRightDelim("",i[p].delim,h,n,e))
return o=o.concat(i),o.push(s.makeLeftRightDelim("mclose",this.rightDelim,h,n,e)),l(o,a.cls())},u.prototype.decomposeSurd=function(e){var i=e.mathstyle,l=b(e.cramp(),this.body),n=p.defaultRuleThickness/i.sizeMultiplier,m=a("",e.mathstyle.adjustTo(t.TEXT)+" sqrt-line")
m.height=n,m.maxFontSize=1
var u=n
i.id<t.TEXT.id&&(u=i.metrics.xHeight)
var c=n+u/4,y=(r.height(l)+r.depth(l))*i.sizeMultiplier,d=y+(c+n),f=a(s.makeCustomSizedDelim("","\\surd",d,!1,e),"sqrt-sign"),g=f.height+f.depth-n
g>r.height(l)+r.depth(l)+c&&(c=(c+g-r.height(l)-r.depth(l))/2),f.setTop(f.height-r.height(l)-(c+n))
var v=void 0
if(v=0===r.height(l)&&0===r.depth(l)?a():o(e,[l,c,m,n]),this.index){var S=e.withMathstyle(t.SCRIPTSCRIPT),x=a(b(S,this.index),i.adjustTo(t.SCRIPTSCRIPT)),z=Math.max(f.height,v.height),M=Math.max(f.depth,v.depth),k=.6*(z-M),w=o(e,[x],"shift",-k)
return h([a(w,"root"),f,v],"sqrt")}return h([f,v],"sqrt")},u.prototype.decomposeAccent=function(t){var e=t.mathstyle,i=b(t.cramp(),this.body);(this.superscript||this.subscript)&&(i=this.attachSupsub(t,h(i),"mord"))
var s=0
1===this.body.length&&this.body[0].isCharacterBox()&&(s=r.skew(i))
var l=Math.min(r.height(i),e.metrics.xHeight),n=r.makeSymbol("Main-Regular",this.accent,"math")
n.italic=0
var p="⃗"===this.accent?" accent-vec":"",m=a(a(n),"accent-body"+p)
return m=o(t,[i,-l,m]),m.children[1].setLeft(2*s),h(m,"accent")},u.prototype.decomposeLine=function(e){var i=e.mathstyle,s=b(e.cramp(),this.body),l=p.defaultRuleThickness/i.sizeMultiplier,n=a("",e.mathstyle.adjustTo(t.TEXT)+" "+this.position+"-line")
n.height=l,n.maxFontSize=1
var m=void 0
if("overline"===this.position)m=o(e,[s,3*l,n,l])
else{var u=a(s)
m=o(e,[l,n,3*l,u],"top",r.height(u))}return h(m,this.position)},u.prototype.decomposeOverunder=function(t){var e=b(t,this.body),i=t.withMathstyle("scriptstyle")
return d(t,e,0,0,this.overscript?a(b(i,this.overscript),t.mathstyle.adjustTo(i.mathstyle)):null,this.underscript?a(b(i,this.underscript),t.mathstyle.adjustTo(i.mathstyle)):null,this.mathtype||"mrel")},u.prototype.decomposeOverlap=function(t){var e=a(b(t,this.body),"inner")
return h([e,a("","fix")],"left"===this.align?"llap":"rlap")},u.prototype.decomposeRule=function(t){var e=t.mathstyle,i=h("","rule"),r=this.shift&&!isNaN(this.shift)?this.shift:0
r/=e.sizeMultiplier
var s=this.width/e.sizeMultiplier,a=this.height/e.sizeMultiplier
return i.setStyle("border-right-width",s,"em"),i.setStyle("border-top-width",a,"em"),i.setStyle("margin-top",-(a-r),"em"),t.color&&i.setStyle("border-color",t.color),i.width=s,i.height=a+r,i.depth=-r,i},u.prototype.decomposeFont=function(t){var e=[]
return"emph"===this.font?e="mathit"===t.font?b(t.fontFamily("mathrm"),this.body):b(t.fontFamily("textit"),this.body):"textit"===this.font||"textbf"===this.font?(e=b(t,this.body),"textit"===this.font?e.forEach(function(t){t.classes+="mathit"}):"textbf"===this.font&&e.forEach(function(t){t.classes+="mathbf"})):e=b(t.fontFamily(this.font),this.body),h(e)},u.prototype.decomposeOp=function(e){var i=e.mathstyle,s=!1
i.size===t.DISPLAY.size&&this.value&&"\\smallint"!==this.value&&(s=!0)
var a=void 0,h=0,l=0
if(this.symbol){a=r.makeSymbol(s?"Size2-Regular":"Size1-Regular",this.value,"op-symbol "+(s?"large-op":"small-op")),a.type="mop",h=(a.height-a.depth)/2-i.metrics.axisHeight*i.sizeMultiplier,l=a.italic,this.bind(e,a)}else this.children?(a=r.makeOp(b(e,this.children)),this.bind(e,a)):a=this.makeSpan(e.fontFamily("mainrm"),this.value)
if(this.superscript||this.subscript){var n=this.limits||"auto"
return this.alwaysHandleSupSub||"limits"===n||"auto"===n&&i.size===t.DISPLAY.size?this.attachLimits(e,a,h,l):this.attachSupsub(e,a,"mop")}return this.symbol&&a.setTop(h),a},u.prototype.applySizing=function(t){var e={size1:.5,size2:.7,size3:.8,size4:.9,size5:1,size6:1.2,size7:1.44,size8:1.73,size9:2.07,size10:2.49}[this.size]*t.mathstyle.sizeMultiplier
return t.size=this.size,t.sizeMultiplier=e,[]},u.prototype.decomposeColor=function(t){var e=null,i=t.clone()
return this.color?t.color=this.color:(e=h(b(i,this.body)),this.textcolor&&e.setStyle("color",this.textcolor),this.backgroundcolor&&e.setStyle("background-color",this.backgroundcolor),e.setStyle("padding-top",r.height(e)-r.depth(e),"em"),e.setStyle("padding-bottom",r.depth(e),"em")),e},u.prototype.decomposeBox=function(t){var e=[]
e=h(b(t,this.body))
var i=this.padding?this.padding:p.fboxsep
return e.setStyle("padding-top",r.height(e)-r.depth(e)+i,"em"),e.setStyle("padding-bottom",r.depth(e)+i,"em"),this.backgroundcolor&&e.setStyle("background-color",this.backgroundcolor),this.framecolor&&e.setStyle("border",p.fboxrule+"em solid "+this.framecolor),this.border&&e.setStyle("border",this.border),e.setStyle("padding-left",i,"em"),e.setStyle("padding-right",i,"em"),e.setStyle("display","inline-block"),e},u.prototype.decompose=function(t){var e=null,i=t.withIsSelected(this.isSelected)
if("group"===this.type||"root"===this.type)e=this.decomposeGroup(i)
else if("array"===this.type)e=this.decomposeArray(i)
else if("genfrac"===this.type)e=this.decomposeGenfrac(i),this.hasCaret&&(e.hasCaret=!0)
else if("surd"===this.type)e=this.decomposeSurd(i),this.hasCaret&&(e.hasCaret=!0)
else if("accent"===this.type)e=this.decomposeAccent(i)
else if("leftright"===this.type)e=this.decomposeLeftright(i),this.hasCaret&&(e.hasCaret=!0)
else if("delim"===this.type)e=a("",""),e.delim=this.delim,this.hasCaret&&(e.hasCaret=!0)
else if("sizeddelim"===this.type)e=s.makeSizedDelim(this.cls,this.delim,this.size,i)
else if("line"===this.type)e=this.decomposeLine(i)
else if("overunder"===this.type)e=this.decomposeOverunder(i)
else if("overlap"===this.type)e=this.decomposeOverlap(i)
else if("rule"===this.type)e=this.decomposeRule(i)
else if("styling"===this.type);else if("mord"===this.type||"minner"===this.type||"mbin"===this.type||"mrel"===this.type||"mpunct"===this.type||"mopen"===this.type||"mclose"===this.type||"textord"===this.type)this.value?(e=this.makeSpan(i,this.value),e.type=this.type):e=this.makeSpan(i,b(i,this.children))
else if("op"===this.type||"mop"===this.type)e=this.decomposeOp(i),this.hasCaret&&(e.hasCaret=!0)
else if("font"===this.type)e=this.decomposeFont(i),this.hasCaret&&(e.hasCaret=!0)
else if("space"===this.type)e=this.makeSpan(i," "),this.hasCaret&&(e.hasCaret=!0)
else if("spacing"===this.type){if("​"===this.value)e=this.makeSpan(i,"​")
else if(" "===this.value)e="math"===this.mode?this.makeSpan(i," "):this.makeSpan(i," ")
else if(this.width)e=a("","mspace "),this.width>0?e.setWidth(this.width):e.setStyle("margin-left",this.width,"em")
else{var r={qquad:"qquad",quad:"quad",enspace:"enspace",";":"thickspace",":":"mediumspace",",":"thinspace","!":"negativethinspace"}[this.value]||"quad"
e=a("","mspace "+r)}this.hasCaret&&(e.hasCaret=!0)}else"color"===this.type?e=this.decomposeColor(i):"sizing"===this.type?this.applySizing(i):"mathstyle"===this.type?i.setMathstyle(this.mathstyle):"box"===this.type?e=this.decomposeBox(i):"esc"===this.type||"command"===this.type||"error"===this.type||"placeholder"===this.type?(e=this.makeSpan(i,this.value),this.error&&(e.classes+=" ML__error"),this.suggestion&&(e.classes+=" ML__suggestion")):"first"===this.type&&(e=this.makeSpan(i,"​"))
if(!e)return e
if(!this.limits&&(this.superscript||this.subscript)){if(Array.isArray(e)){var h=e[e.length-1]
return e[e.length-1]=this.attachSupsub(i,h,h.type),e}return[this.attachSupsub(i,e,e.type)]}return Array.isArray(e)?e:[e]},u.prototype.attachSupsub=function(e,i,s){if(!this.superscript&&!this.subscript)return i
var h=e.mathstyle,l=null,n=null
if(this.superscript){var m=b(e.sup(),this.superscript)
l=a(m,h.adjustTo(h.sup()))}if(this.subscript){var u=b(e.sub(),this.subscript)
n=a(u,h.adjustTo(h.sub()))}var c=0,y=0
this.isCharacterBox()||(c=r.height(i)-h.metrics.supDrop,y=r.depth(i)+h.metrics.subDrop)
var d=void 0
d=h===t.DISPLAY?h.metrics.sup1:h.cramped?h.metrics.sup3:h.metrics.sup2
var f=t.TEXT.sizeMultiplier*h.sizeMultiplier,g=.5/p.ptPerEm/f,v=null
if(n&&l){c=Math.max(c,d,l.depth+.25*h.metrics.xHeight),y=Math.max(y,h.metrics.sub2)
var S=p.defaultRuleThickness
if(c-r.depth(l)-(r.height(n)-y)<4*S){y=4*S-(c-l.depth)+r.height(n)
var x=.8*h.metrics.xHeight-(c-r.depth(l))
x>0&&(c+=x,y-=x)}v=o(e,[n,y,l,-c],"individualShift"),this.symbol&&v.children[0].setLeft(-r.italic(i))}else n&&!l?(y=Math.max(y,h.metrics.sub1,r.height(n)-.8*h.metrics.xHeight),v=o(e,[n],"shift",y),v.children[0].setRight(g),this.isCharacterBox()&&v.children[0].setLeft(-r.italic(i))):!n&&l&&(c=Math.max(c,d,l.depth+.25*h.metrics.xHeight),v=o(e,[l],"shift",-c),v.children[0].setRight(g))
return this.hasCaret&&(v.hasCaret=!0),r.makeSpanOfType(s,[i,a(v,"msupsub")])},u.prototype.bind=function(t,e){return t.generateID&&"first"!==this.type&&(this.id=Date.now().toString(36)+Math.floor(1e5*Math.random()).toString(36),e.attributes||(e.attributes={}),e.attributes["data-atom-id"]=this.id),e},u.prototype.makeSpan=function(t,e){var i="textord"===this.type?"mord":this.type,s=r.makeSpanOfType(i,e),a=t.font||this.fontFamily
"amsrm"===this.fontFamily?(a="amsrm","mathbf"===t.font?s.setStyle("font-weight","bold"):"mathit"===t.font&&s.setStyle("font-variant","italic")):"mop"===i&&(a=this.fontFamily||t.font)
var h="Main-Regular"
if(a&&(h=v(e,a),!h&&this.fontFamily&&(a=this.fontFamily,h=v(e,a)||a),!h&&t.font&&(a=t.font,h=v(e,a)||a),"AMS-Regular"===h?s.classes+=" amsrm":"Main-Italic"===h?s.classes+=" mainit":"Math-Italic"===h?s.classes+=" mathit":a&&(s.classes+=" "+a)),e&&"string"==typeof e&&e.length>0){s.height=0,s.depth=0,s.skew=0,s.italic=0
for(var l=0;l<e.length;l++){var n=m(e.charAt(l),h)
n&&(s.height=Math.max(s.height,n.height),s.depth=Math.max(s.depth,n.depth),s.skew=n.skew,s.italic=n.italic)}"math"!==this.mode&&(s.italic=0)}return t.parentSize!==t.size&&(s.classes+=" sizing reset-"+t.parentSize,s.classes+=" "+t.size),t.mathstyle.isTight()&&(s.isTight=!0),s.setRight(s.italic),s.setStyle("color",t.getColor()),s.setStyle("background-color",t.getBackgroundColor()),this.bind(t,s),this.hasCaret&&(this.superscript||this.subscript||(s=r.makeSpanOfType(i,s),s.hasCaret=!0),t.mathstyle.isTight()&&(s.isTight=!0)),s},u.prototype.attachLimits=function(t,e,i,r){return d(t,e,i,r,this.superscript?a(b(t.sup(),this.superscript),t.mathstyle.adjustTo(t.mathstyle.sup())):null,this.subscript?a(b(t.sub(),this.subscript),t.mathstyle.adjustTo(t.mathstyle.sub())):null,"mop")}
function d(t,e,i,s,h,l,n){if(!h&&!l)return e
e=a(e)
var m=0,u=0
h&&(m=Math.max(p.bigOpSpacing1,p.bigOpSpacing3-h.depth)),l&&(u=Math.max(p.bigOpSpacing2,p.bigOpSpacing4-l.height))
var c=null
if(l&&h){var y=p.bigOpSpacing5+r.height(l)+r.depth(l)+u+r.depth(e)+i
c=o(t,[p.bigOpSpacing5,l,u,e,m,h,p.bigOpSpacing5],"bottom",y),c.children[0].setLeft(-s),c.children[2].setLeft(s)}else if(l&&!h){var d=r.height(e)-i
c=o(t,[p.bigOpSpacing5,l,u,e],"top",d),c.children[0].setLeft(-s)}else if(!l&&h){var f=r.depth(e)+i
c=o(t,[e,m,h,p.bigOpSpacing5],"bottom",f),c.children[1].setLeft(s)}return r.makeSpanOfType(n,c,"op-limits")}var f={main:"Main-Regular",mainrm:"Main-Regular",mathrm:"Main-Regular",mathbf:"Main-Bold",textrm:"Main-Regular",textit:"Main-Italic",textbf:"Main-Bold",amsrm:"AMS-Regular",mathbb:"AMS-Regular",mathcal:"Caligraphic-Regular",mathfrak:"Fraktur-Regular",mathscr:"Script-Regular",mathsf:"SansSerif-Regular",mathtt:"Typewriter-Regular"},g=/\u0393|\u0394|\u0398|\u039b|\u039E|\u03A0|\u03A3|\u03a5|\u03a6|\u03a8|\u03a9|[\u03b1-\u03c9]|\u03d1|\u03d5|\u03d6|\u03f1|\u03f5/
function v(t,e){if("string"!=typeof t||t.length>1||"​"===t)return f[e]||e
var i=""
if("mathit"===e)i=/[0-9]/.test(t)||"\\imath"===t||"\\jmath"===t||"\\pounds"===t?"Main-Italic":/[A-Za-z]/.test(t)||g.test(t)?"Math-Italic":"Main-Regular"
else if("mathrm"===e)i=g.test(t)?"Math-Regular":"Main-Regular"
else if("mathbf"===e)i=g.test(t)?"Math-BoldItalic":"Main-Bold"
else{if("mathbb"===e||"mathscr"===e){if(!/^[A-Z ]$/.test(t))return null}else if("mathcal"===e){if(!/^[0-9A-Z ]$/.test(t))return null}else if("mathfrak"===e){if(!/^[0-9A-Za-z ]$|^[!"#$%&'\(\)\*\+,\-\.\/\:\;=\?\[\]\^’‘]$/.test(t))return null}else if(("mathtt"===e||"texttt"===e||"textsf"===e||"mathsf"===e)&&!/^[0-9A-Za-z ]$|^[!"&'\(\)\*\+,\-\.\/\:\;=\?@\[\]\^_~\u0131\u0237\u0393\u0394\u0398\u039b\u039e\u03A0\u03A3\u03A5\u03A8\u03a9’‘]$/.test(t))return null
i=f[e]}return i}function b(t,i){t instanceof e.Context||(void 0===t.generateID&&(t.generateID=!1),t.size=t.size||"size5",t.mathstyle=t.mathstyle||"displaystyle",t=new e.Context(t))
var s=[]
if(Array.isArray(i)){if(0===i.length)return s
if(1===i.length){if(s=i[0].decompose(t),i[0].isSelected&&s){var a=s.isTight,h=s.type
"placeholder"===h&&(h="mord"),s=r.makeSpanOfType(h,s,"ML__selected"),s.isTight=a,s=[s]}}else{for(var l="none",n=i[1].type,o=[],p="",m=!1,u=0;u<i.length;u++){if("mbin"===i[u].type&&(["none","mrel","mpunct","mopen","mbin","mop"].includes(l)||["none","mrel","mpunct","mclose"].includes(n))&&(i[u].type="mord"),s.length>=1&&"spacing"===i[u].type&&i[u].width)s[s.length-1].addMarginRight(i[u].width)
else if(s.length>=1&&"spacing"===i[u].type){var c={qquad:2,quad:1,enspace:.5,";":.277778,":":.222222,",":.166667,"!":-.166667}[i[u].value]||1
s[s.length-1].addMarginRight(c)}else{var y=i[u].decompose(t)
if(y){var d=[].concat.apply([],y)
if(i[u].isSelected&&!t.isSelected)o=o.concat(d),p||(p=y[0].type,"placeholder"===p&&(p="mord"),m=y[0].isTight)
else{if(o.length>0){var f=r.makeSpanOfType(p,o,"ML__selected")
f.isTight=m,s.push(f),o=[],p=""}s=s.concat(d)}}}l=i[u].getFinalBaseElement().type,n=u<i.length-1?i[u+1].getInitialBaseElement().type:"none"}if(o.length>0){var g=r.makeSpanOfType(p,o,"ML__selected")
g.isTight=m,s.push(g),o=[],p=""}}}else if(i&&(s=i.decompose(t),i.isSelected&&!t.isSelected)){var v=s.type
"placeholder"===v&&(v="mord")
var b=r.makeSpanOfType(v,s,"ML__selected")
b.isTight=s.isTight,s=[b]}if(!s)return s
var S={size1:.5,size2:.7,size3:.8,size4:.9,size5:1,size6:1.2,size7:1.44,size8:1.73,size9:2.07,size10:2.49}
if(t.mathstyle!==t.parentMathstyle){var x=t.mathstyle.sizeMultiplier/t.parentMathstyle.sizeMultiplier,z=!0,M=!1,k=void 0
try{for(var w,T=s[Symbol.iterator]();!(z=(w=T.next()).done);z=!0){var R=w.value
R.height*=x,R.depth*=x}}catch(t){M=!0,k=t}finally{try{!z&&T.return&&T.return()}finally{if(M)throw k}}}if(t.size!==t.parentSize){var F=S[t.size]/S[t.parentSize],C=!0,A=!1,L=void 0
try{for(var E,O=s[Symbol.iterator]();!(C=(E=O.next()).done);C=!0){var D=E.value
D.height*=F,D.depth*=F}}catch(t){A=!0,L=t}finally{try{!C&&O.return&&O.return()}finally{if(A)throw L}}}return s}function S(t,e){t=t||"math"
var i=new u(t,"root",null)
return i.children=e||[],0!==i.children.length&&"first"===i.children[0].type||i.children.unshift(new u(t,"first",null)),i}return{MathAtom:u,decompose:b,makeRoot:S}})
