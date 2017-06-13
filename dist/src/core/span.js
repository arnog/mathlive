"use strict"
var _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t}
define(["mathlive/core/fontMetrics"],function(t){var e=new Intl.NumberFormat("en-US",{useGrouping:!1,maximumSignificantDigits:5})
function r(){var t="",i=!0,n=!1,a=void 0
try{for(var o,s=arguments[Symbol.iterator]();!(i=(o=s.next()).done);i=!0){var h=o.value
if(Array.isArray(h)){var l=!0,y=!1,m=void 0
try{for(var u,f=h[Symbol.iterator]();!(l=(u=f.next()).done);l=!0){t+=r(u.value)}}catch(t){y=!0,m=t}finally{try{!l&&f.return&&f.return()}finally{if(y)throw m}}}else"number"==typeof h?t+=e.format(h):h&&(t+=""+h)}}catch(t){n=!0,a=t}finally{try{!i&&s.return&&s.return()}finally{if(n)throw a}}return t}function i(t,e){this.classes=e||"",Array.isArray(t)?this.children=[].concat.apply([],t):"string"==typeof t?this.body=t:t&&"object"===(void 0===t?"undefined":_typeof(t))&&(this.children=[t]),this.style=null,this.updateDimensions()}i.prototype.updateDimensions=function(){var t=0,e=0,r=0
if(this.children){var i=!0,n=!1,a=void 0
try{for(var o,s=this.children[Symbol.iterator]();!(i=(o=s.next()).done);i=!0){var h=o.value
h.height>t&&(t=h.height),h.depth>e&&(e=h.depth),h.maxFontSize>r&&(r=h.maxFontSize)}}catch(t){n=!0,a=t}finally{try{!i&&s.return&&s.return()}finally{if(n)throw a}}}this.height=t,this.depth=e,this.maxFontSize=r},i.prototype.setStyle=function(t){for(var e=arguments.length,i=Array(e>1?e-1:0),n=1;n<e;n++)i[n-1]=arguments[n]
var a=r(i)
a.length>0&&(this.style||(this.style={}),this.style[t]=a)},i.prototype.setTop=function(t){t&&0!==t&&(this.style||(this.style={}),this.style.top=r(t)+"em",this.height-=t,this.depth+=t)},i.prototype.setLeft=function(t){t&&0!==t&&(this.style||(this.style={}),this.style["margin-left"]=r(t)+"em")},i.prototype.setRight=function(t){t&&0!==t&&(this.style||(this.style={}),this.style["margin-right"]=r(t)+"em")},i.prototype.setWidth=function(t){t&&0!==t&&(this.style||(this.style={}),this.style.width=r(t)+"em")},i.prototype.addMarginRight=function(t){if(t&&0!==t){this.style||(this.style={})
this.style["margin-right"]=r(parseFloat(this.style["margin-right"]||"0")+t)+"em"}}
var n={"mord+mop":3,"mord+mbin":4,"mord+mrel":5,"mord+minner":3,"mop+mord":3,"mop+mop":3,"mop+mbin":5,"mop+minner":3,"mbin+mord":4,"mbin+mop":4,"mbin+mopen":4,"mbin+minner":4,"mrel+mord":5,"mrel+mop":5,"mrel+mopen":5,"mrel+minner":5,"mclose+mop":3,"mclose+mbin":4,"mclose+mrel":5,"mclose+minner":3,"mpunct+mord":3,"mpunct+mop":3,"mpunct+mbin":4,"mpunct+mrel":5,"mpunct+mopen":3,"mpunct+mpunct":3,"mpunct+minner":3},a={"mord+mop":3,"mop+mord":3,"mop+mop":3,"mclose+mop":3,"minner+mop":3}
function o(t){var e=t.type
return-1!==t.classes.indexOf("ML__selected")&&(e=t.children[t.children.length-1].type),"textord"!==e?e:"mord"}i.prototype.toMarkup=function(t){t=t||0
var e="",i=this.body||""
if(this.children){var s="none",h=!0,l=!1,y=void 0
try{for(var m,u=this.children[Symbol.iterator]();!(h=(m=u.next()).done);h=!0){var f=m.value,p=0,c="textord"!==f.type?f.type:"mord"
p=f.isTight?(a[s+"+"+c]||0)/18:(n[s+"+"+c]||0)/18,i+=f.toMarkup(p),s=o(f)}}catch(t){l=!0,y=t}finally{try{!h&&u.return&&u.return()}finally{if(l)throw y}}}var d=this.tag||"span"
if(0===d.length)e=i||""
else{if(e="<"+d,this.attributes)for(var v in this.attributes)this.attributes.hasOwnProperty(v)&&(e+=" "+v+'="'+this.attributes[v]+'"')
var g=this.classes.split(" ")
this.hasCaret&&g.push("ML__caret"),this.type&&g.push({command:"ML__command",placeholder:"ML__placeholder",error:"ML__error"}[this.type]||"")
var b=g.filter(function(t,e,r){return t.length>0&&"mathrm"!==t&&r.indexOf(t)===e}).join(" ")
if(b.length>0&&(e+=' class="'+b+'"'),t&&(this.style||(this.style={}),this.style["margin-left"]=this.style["margin-left"]?r(parseInt(this.style["margin-left"])+t,"em"):r(t,"em")),this.style){var x=""
for(var S in this.style)this.style.hasOwnProperty(S)&&(x+=S+":"+this.style[S]+";")
x.length>0&&(e+=' style="'+x+'"')}e+=">",e+=i,e+="</"+d+">"}return e},i.prototype.tryCoalesceWith=function(t){if(this.tag!==t.tag)return!1
if(this.type!==t.type)return!1
if("error"===this.type||"placeholder"===this.type||"command"===this.type)return!1
var e=this.children&&this.children.length>0,r=t.children&&t.children.length>0
if(e||r)return!1
if((this.style?this.style.length:0)!==(t.style?t.style.length:0))return!1
var i=this.classes.trim().replace(/\s+/g," ").split(" "),n=t.classes.trim().replace(/\s+/g," ").split(" ")
if(i.length!==n.length)return!1
i.sort(),n.sort()
for(var a=0;a<i.length;a++){if("vertical-separator"===i[a])return!1
if(i[a]!==n[a])return!1}if(this.style&&t.style)for(var o in this.style)if(this.style.hasOwnProperty(o)&&t.style.hasOwnProperty(o)&&this.style[o]!==t.style[o])return!1
return this.body+=t.body,this.height=Math.max(this.height,t.height),this.depth=Math.max(this.depth,t.depth),this.italic=t.italic,!0}
function s(t){if(!t||0===t.length)return[]
t[0].children=s(t[0].children)
for(var e=[t[0]],r=1;r<t.length;r++)e[e.length-1].tryCoalesceWith(t[r])||(t[r].children=s(t[r].children),e.push(t[r]))
return e}function h(t){if(Array.isArray(t)){var e=0,r=!0,i=!1,n=void 0
try{for(var a,o=t[Symbol.iterator]();!(r=(a=o.next()).done);r=!0){var s=a.value
e=Math.max(e,s.height)}}catch(t){i=!0,n=t}finally{try{!r&&o.return&&o.return()}finally{if(i)throw n}}return e}return t.height}function l(t){if(Array.isArray(t)){var e=0,r=!0,i=!1,n=void 0
try{for(var a,o=t[Symbol.iterator]();!(r=(a=o.next()).done);r=!0){var s=a.value
e=Math.max(e,s.depth)}}catch(t){i=!0,n=t}finally{try{!r&&o.return&&o.return()}finally{if(i)throw n}}return e}return t.depth}function y(t){if(Array.isArray(t)){var e=0,r=!0,i=!1,n=void 0
try{for(var a,o=t[Symbol.iterator]();!(r=(a=o.next()).done);r=!0){e+=a.value.skew}}catch(t){i=!0,n=t}finally{try{!r&&o.return&&o.return()}finally{if(i)throw n}}return e}return t.skew}function m(t){return Array.isArray(t)?t[t.length-1].italic:t.italic}function u(t,e){return new i(t,e)}function f(e,r,n){var a=new i(r,n),o=t.getCharacterMetrics(r,e)
return a.height=o.height,a.depth=o.depth,a.skew=o.skew,a.italic=o.italic,a.setRight(a.italic),a}function p(t,e){var r=new i("&#x200b;")
return r.attributes={"aria-hidden":!0},r.setStyle("font-size",e/t.mathstyle.sizeMultiplier,e&&0!==e?"em":""),"size5"!==t.size?new i(r,"fontsize-ensurer reset-"+t.size+" size5"):r}function c(t,e,r){var i=u(e,r)
return i.type=t,i}function d(t,e){return c("mop",t,e)}function v(t,e){return c("mord",t,e)}function g(t,e){return c("mrel",t,e)}function b(t,e){return c("mclose",t,e)}function x(t,e){return c("mopen",t,e)}function S(t,e){return c("minner",t,e)}function w(t,e){return c("mpunct",t,e)}function M(t,e,r,i,n){n=n||"",n+=" style-wrap "
var a=k(e,n+r.adjustTo(i))
a.type=t
var o=i.sizeMultiplier/r.sizeMultiplier
return a.height*=o,a.depth*=o,a.maxFontSize=i.sizeMultiplier,a}function k(t,e){if(!e||0===e.length){if(t instanceof i)return t
if(Array.isArray(t)&&1===t.length)return t[0]}return new i(t,e)}function A(t,e,r,n){var a=0,o=0
r=r||"shift",n=n||0
for(var s=0;s<e.length;s++)Array.isArray(e[s])&&(e[s]=1===e[s].length?e[s][0]:u(e[s]))
if("shift"===r)a=-e[0].depth-n
else if("bottom"===r)a=-n
else if("top"===r){var h=n,l=!0,y=!1,m=void 0
try{for(var f,c=e[Symbol.iterator]();!(l=(f=c.next()).done);l=!0){var d=f.value
h-=d instanceof i?d.height+d.depth:d}}catch(t){y=!0,m=t}finally{try{!l&&c.return&&c.return()}finally{if(y)throw m}}a=h}else if("individualShift"===r){var v=e
e=[v[0]],a=-v[1]-v[0].depth,o=a
for(var g=2;g<v.length;g+=2){var b=-v[g+1]-o-v[g].depth,x=b-(v[g-2].height+v[g-2].depth)
o+=b,e.push(x),e.push(v[g])}}var S=0,w=!0,M=!1,A=void 0
try{for(var z,_=e[Symbol.iterator]();!(w=(z=_.next()).done);w=!0){var O=z.value
O instanceof i&&(S=Math.max(S,O.maxFontSize))}}catch(t){M=!0,A=t}finally{try{!w&&_.return&&_.return()}finally{if(M)throw A}}var F=p(t,S),L=[]
o=a
var C=!0,P=!1,T=void 0
try{for(var R,W=e[Symbol.iterator]();!(C=(R=W.next()).done);C=!0){var j=R.value
if(j instanceof i){var D=-j.depth-o
o+=j.height+j.depth
var I=u([F,j])
I.setTop(D),L.push(I)}else o+=j}}catch(t){P=!0,T=t}finally{try{!C&&W.return&&W.return()}finally{if(P)throw T}}L.push(k([F,new i("&#x200b;")],"baseline-fix"))
var G=u(L,"vlist")
return G.height=Math.max(o,G.height),G.depth=Math.max(-a,G.depth),G}return{coalesce:s,makeSpan:u,makeOp:d,makeOrd:v,makeRel:g,makeClose:b,makeOpen:x,makeInner:S,makePunct:w,makeSpanOfType:c,makeSymbol:f,makeVlist:A,makeHlist:k,makeStyleWrap:M,height:h,depth:l,skew:y,italic:m}})
