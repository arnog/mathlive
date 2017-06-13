"use strict"
define(["mathlive/core/definitions","mathlive/core/span","mathlive/core/mathstyle","mathlive/core/fontMetrics"],function(e,t,r,a){var l=t.makeSymbol,i=t.makeStyleWrap,s=t.makeSpan,u=t.makeVlist
function m(t,r,a,s,u,m){var n=l(e.getFontName("math",r),e.getValue("math",r)),h=i(t,n,u.mathstyle,a,m)
return s&&h.setTop((1-u.mathstyle.sizeMultiplier/a.sizeMultiplier)*u.mathstyle.metrics.axisHeight),h}function n(t,a,u,m,n,h){var g=l("Size"+u+"-Regular",e.getValue("math",a)),o=i(t,s(g,"delimsizing size"+u),n.mathstyle,r.TEXT,h)
return m&&o.setTop((1-n.mathstyle.sizeMultiplier)*n.mathstyle.metrics.axisHeight),o}function h(t,r){var a=""
return"Size1-Regular"===r?a=" delim-size1":"Size4-Regular"===r&&(a=" delim-size4"),s(l(r,e.getValue("math",t)),"delimsizinginner"+a)}function g(t,l,m,n,g,o){var p=void 0,c=void 0,y=void 0,z=void 0
p=y=z=l,c=null
var v="Size1-Regular"
"\\vert"===l||"\\lvert"===l||"\\rvert"===l||"\\mvert"===l||"\\mid"===l?y=p=z="∣":"\\Vert"===l||"\\lVert"===l||"\\rVert"===l||"\\mVert"===l||"\\|"===l?y=p=z="∥":"\\uparrow"===l?y=z="⏐":"\\Uparrow"===l?y=z="‖":"\\downarrow"===l?p=y="⏐":"\\Downarrow"===l?p=y="‖":"\\updownarrow"===l?(p="\\uparrow",y="⏐",z="\\downarrow"):"\\Updownarrow"===l?(p="\\Uparrow",y="‖",z="\\Downarrow"):"["===l||"\\lbrack"===l?(p="⎡",y="⎢",z="⎣",v="Size4-Regular"):"]"===l||"\\rbrack"===l?(p="⎤",y="⎥",z="⎦",v="Size4-Regular"):"\\lfloor"===l?(y=p="⎢",z="⎣",v="Size4-Regular"):"\\lceil"===l?(p="⎡",y=z="⎢",v="Size4-Regular"):"\\rfloor"===l?(y=p="⎥",z="⎦",v="Size4-Regular"):"\\rceil"===l?(p="⎤",y=z="⎥",v="Size4-Regular"):"("===l?(p="⎛",y="⎜",z="⎝",v="Size4-Regular"):")"===l?(p="⎞",y="⎟",z="⎠",v="Size4-Regular"):"\\{"===l||"\\lbrace"===l?(p="⎧",c="⎨",z="⎩",y="⎪",v="Size4-Regular"):"\\}"===l||"\\rbrace"===l?(p="⎫",c="⎬",z="⎭",y="⎪",v="Size4-Regular"):"\\lgroup"===l?(p="⎧",z="⎩",y="⎪",v="Size4-Regular"):"\\rgroup"===l?(p="⎫",z="⎭",y="⎪",v="Size4-Regular"):"\\lmoustache"===l?(p="⎧",z="⎭",y="⎪",v="Size4-Regular"):"\\rmoustache"===l?(p="⎫",z="⎩",y="⎪",v="Size4-Regular"):"\\surd"===l&&(p="",z="⎷",y="",v="Size4-Regular")
var d=a.getCharacterMetrics(e.getValue("math",p),v),S=d.height+d.depth,R=a.getCharacterMetrics(e.getValue("math",y),v),f=R.height+R.depth,w=a.getCharacterMetrics(e.getValue("math",z),v),T=w.height+w.depth,M=0,k=1
if(null!==c){var C=a.getCharacterMetrics(e.getValue("math",c),v)
M=C.height+C.depth,k=2}var V=S+T+M,b=Math.ceil((m-V)/(k*f)),P=V+b*k*f,I=g.mathstyle.metrics.axisHeight
n&&(I*=g.mathstyle.sizeMultiplier)
var E=P/2-I,x=[]
if(x.push(h(z,v)),null===c)for(var D=0;D<b;D++)x.push(h(y,v))
else{for(var X=0;X<b;X++)x.push(h(y,v))
x.push(h(c,v))
for(var U=0;U<b;U++)x.push(h(y,v))}x.push(h(p,v))
var H=u(g,x,"bottom",E)
return i(t,s(H,"delimsizing mult"),g.mathstyle,r.TEXT,o)}var o=["(",")","[","\\lbrack","]","\\rbrack","\\{","\\lbrace","\\}","\\rbrace","\\lfloor","\\rfloor","\\lceil","\\rceil","\\surd"],p=["\\uparrow","\\downarrow","\\updownarrow","\\Uparrow","\\Downarrow","\\Updownarrow","|","\\|","\\vert","\\Vert","\\lvert","\\rvert","\\lVert","\\rVert","\\mvert","\\mid","\\lgroup","\\rgroup","\\lmoustache","\\rmoustache"],c=["<",">","\\langle","\\rangle","/","\\backslash","\\lt","\\gt"],y=[0,1.2,1.8,2.4,3]
function z(e,t,r,a,l){return"."===t?M(e,a,l):("<"===t||"\\lt"===t?t="\\langle":">"!==t&&"\\gt"!==t||(t="\\rangle"),o.includes(t)||c.includes(t)?n(e,t,r,!1,a,l):p.includes(t)?g(e,t,y[r],!1,a,l):null)}var v=[{type:"small",mathstyle:r.SCRIPTSCRIPT},{type:"small",mathstyle:r.SCRIPT},{type:"small",mathstyle:r.TEXT},{type:"large",size:1},{type:"large",size:2},{type:"large",size:3},{type:"large",size:4}],d=[{type:"small",mathstyle:r.SCRIPTSCRIPT},{type:"small",mathstyle:r.SCRIPT},{type:"small",mathstyle:r.TEXT},{type:"stack"}],S=[{type:"small",mathstyle:r.SCRIPTSCRIPT},{type:"small",mathstyle:r.SCRIPT},{type:"small",mathstyle:r.TEXT},{type:"large",size:1},{type:"large",size:2},{type:"large",size:3},{type:"large",size:4},{type:"stack"}]
function R(e){return"small"===e.type?"Main-Regular":"large"===e.type?"Size"+e.size+"-Regular":"Size4-Regular"}function f(e,t,l,i){for(var s=Math.min(2,3-i.mathstyle.size),u=s;u<l.length&&"stack"!==l[u].type;u++){var m=a.getCharacterMetrics(e,R(l[u]))
if(!m)return{type:"small",style:r.SCRIPT}
var n=m.height+m.depth
if("small"===l[u].type&&(n*=l[u].mathstyle.sizeMultiplier),n>t)return l[u]}return l[l.length-1]}function w(t,r,a,l,i,s){if(!r||0===r.length||"."===r)return M(t,i,t)
"<"===r||"\\lt"===r?r="\\langle":">"!==r&&"\\gt"!==r||(r="\\rangle")
var u=void 0
u=c.includes(r)?v:o.includes(r)?S:d
var h=f(e.getValue("math",r),a,u,i)
return"small"===h.type?m(t,r,h.mathstyle,l,i,s):"large"===h.type?n(t,r,h.size,l,i,s):g(t,r,a,l,i,s)}function T(e,t,r,l,i,s){if("."===t)return M(e,i,s)
var u=i.mathstyle.metrics.axisHeight*i.mathstyle.sizeMultiplier,m=5/a.metrics.ptPerEm,n=l+u,h=r-u
h=Math.max(n,h)
var g=901*h/500
return n=2*h-m,g=Math.max(g,n),w(e,t,g,!0,i,s)}function M(e,a,l){return t.makeSpanOfType(e,"","sizing"+a.mathstyle.adjustTo(r.TEXT)+" nulldelimiter "+(l||""))}return{makeSizedDelim:z,makeCustomSizedDelim:w,makeLeftRightDelim:T}})
