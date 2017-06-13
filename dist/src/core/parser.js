"use strict"
define(["mathlive/core/definitions","mathlive/core/color","mathlive/core/fontMetrics","mathlive/core/mathAtom"],function(t,e,s,i){var r=i.MathAtom
function a(t,e){this.tokens=t,this.index=0,this.args=e,this.mathList=[],this.parseMode="math",this.tabularMode=!1,this.endCount=0}a.prototype.swapMathList=function(t){var e=this.mathList
return this.mathList=t||[],e},a.prototype.swapParseMode=function(t){var e=this.parseMode
return this.parseMode=t,e},a.prototype.end=function(){return this.endCount++,this.index>=this.tokens.length||this.endCount>1e3},a.prototype.get=function(){return this.endCount=0,this.index<this.tokens.length?this.tokens[this.index++]:null},a.prototype.peek=function(t){var e=this.index+(t||0)
return e<this.tokens.length?this.tokens[e]:null},a.prototype.lastMathAtom=function(){if(0===this.mathList.length||"mop"!==this.mathList[this.mathList.length-1].type){var t=new r(this.parseMode,"mord","​","main")
t.attributes={"aria-hidden":!0},this.mathList.push(t)}return this.mathList[this.mathList.length-1]},a.prototype.hasToken=function(t){var e=this.index
return e<this.tokens.length&&this.tokens[e].type===t},a.prototype.hasLiteral=function(t){var e=this.index
return e<this.tokens.length&&("literal"===this.tokens[e].type&&(!t||this.tokens[e].value===t))},a.prototype.hasCommand=function(t){var e=this.index
return e<this.tokens.length&&("command"===this.tokens[e].type&&this.tokens[e].value===t)},a.prototype.hasInfixCommand=function(){var e=this.index
if(e<this.tokens.length&&"command"===this.tokens[e].type){var s=t.getInfo("\\"+this.tokens[e].value,this.parseMode)
return s&&s.infix}return!1}
function n(t){return"}"===t.type||"literal"===t.type&&"&"===t.value||"command"===t.type&&("end"===t.value||"cr"===t.value||"\\"===t.value||"right"===t.value)}a.prototype.hasColumnSeparator=function(){var t=this.index
return!!(this.tabularMode&&t<this.tokens.length)&&("literal"===this.tokens[t].type&&"&"===this.tokens[t].value)},a.prototype.hasRowSeparator=function(){var t=this.index
return!!(this.tabularMode&&t<this.tokens.length)&&("command"===this.tokens[t].type&&("\\"===this.tokens[t].value||"cr"===this.tokens[t].value))},a.prototype.parseColumnSeparator=function(){return!!this.hasColumnSeparator()&&(this.index++,!0)}
var o=["tiny","scriptsize","footnotesize","small","normalsize","large","Large","LARGE","huge","Huge"]
a.prototype.hasImplicitSizingCommand=function(){if(this.index<this.tokens.length){var t=this.tokens[this.index]
if("command"===t.type)return-1!==o.indexOf(t.value)}return!1}
var h=["displaystyle","textstyle","scriptstyle","scriptscriptstyle"]
a.prototype.hasImplicitMathstyleCommand=function(){if(this.index<this.tokens.length){var t=this.tokens[this.index]
if("command"===t.type)return-1!==h.indexOf(t.value)}return!1},a.prototype.parseRowSeparator=function(){return!!this.hasRowSeparator()&&(this.index++,!0)},a.prototype.parseToken=function(t){return!!this.hasToken(t)&&(this.index++,!0)},a.prototype.skipUntilToken=function(t){for(;!this.end()&&!this.parseToken(t);)this.get()},a.prototype.parseCommand=function(t){return!!this.hasCommand(t)&&(this.index++,!0)},a.prototype.parseLiteral=function(t){return!!this.hasLiteral(t)&&(this.index++,!0)},a.prototype.parseFiller=function(){var t=!1,e=!1
do{var s=this.parseToken("space"),i=this.parseCommand("relax")
t=t||s||i,e=!s&&!i}while(!e)
return t},a.prototype.parseKeyword=function(t){for(var e=this.index,s=this.end(),i="";!s;){var r=this.get()
"literal"===r.type&&(i+=r.value),s=this.end()||"literal"!==r.type||i.length>=t.length}var a=t.toUpperCase()===i.toUpperCase()
return a||(this.index=e),a},a.prototype.scanString=function(){for(var e="",s=this.end();!s;)if(this.hasLiteral("]"))s=!0
else if(this.hasToken("literal"))e+=this.get().value,s=this.end()
else if(this.parseToken("space"))e+=" ",s=this.end()
else if(this.hasToken("command")){var i=this.get(),r=t.getInfo("\\"+i.value,this.parseMode)
"mord"!==r.type&&"textord"!==r.type||!r.value||(e+=r.value),s=this.end()}else s=!0
return e},a.prototype.scanColor=function(){return e.stringToColor(this.scanString())},a.prototype.scanNumber=function(t){var e=this.parseLiteral("-")
e||this.parseLiteral("+"),this.parseToken("space"),t=!!t
var s=10,i="0123456789"
this.parseLiteral("'")?(s=8,i="01234567",t=!0):(this.parseLiteral('"')||this.parseLiteral("x"))&&(s=16,i="0123456789ABCDEF",t=!0)
for(var r="",a=this.end();!a;)this.hasToken("literal")?(a=-1===i.indexOf(this.peek().value))||(r+=this.get().value):a=!0
if(!t&&(this.parseLiteral(".")||this.parseLiteral(",")))for(r+=".",a=this.end();!a;)this.hasToken("literal")?(a=-1===i.indexOf(this.peek().value))||(r+=this.get().value):a=!0
var n=t?parseInt(r,s):parseFloat(r)
return e?-n:n}
function p(t,e){var i=1
return"pt"===e?i=1:"mm"===e?i=7227/2540:"cm"===e?i=7227/254:"ex"===e?i=35271/8192:"em"===e?i=s.metrics.ptPerEm:"bp"===e?i=1.00375:"dd"===e?i=1238/1157:"pc"===e?i=12:"in"===e?i=72.27:"mu"===e&&(i=10/18),t/s.metrics.ptPerEm*i}a.prototype.scanDimen=function(){var t=this.scanNumber(!1)
this.parseToken("space")
return this.parseKeyword("pt")?p(t,"pt"):this.parseKeyword("mm")?p(t,"mm"):this.parseKeyword("cm")?p(t,"cm"):this.parseKeyword("ex")?p(t,"ex"):this.parseKeyword("em")?p(t,"em"):this.parseKeyword("bp")?p(t,"bp"):this.parseKeyword("dd")?p(t,"dd"):this.parseKeyword("pc")?p(t,"pc"):this.parseKeyword("in")?p(t,"in"):this.parseKeyword("mu")?p(t,"mu"):p(t,"pt")},a.prototype.scanSkip=function(){var t=this.scanDimen()
return this.parseToken("space"),this.parseKeyword("plus")&&this.scanDimen(),this.parseToken("space"),this.parseKeyword("minus")&&this.scanDimen(),t},a.prototype.scanColspec=function(){this.parseToken("space")
for(var t=[];!this.end()&&!this.hasToken("}")&&!this.hasLiteral("]");)if(this.hasLiteral()){var e=this.get().value
if("lcr".includes(e))t.push({align:e})
else if("|"===e)t.push({rule:!0})
else if("@"===e){if(this.parseToken("{")){var s=this.swapParseMode("math")
t.push({gap:this.scanImplicitGroup(function(t){return"}"===t.type})}),this.swapParseMode(s)}this.parseToken("}")}}return t},a.prototype.scanModeSet=function(){var t=void 0
if(this.parseCommand("(")&&(t=")"),!t&&this.parseCommand("[")&&(t="]"),!t)return null
var e=this.swapParseMode("math"),s=new r("math","group")
return s.mathstyle=")"===t?"textstyle":"displaystyle",s.children=this.scanImplicitGroup(function(e){return"command"===e.type&&e.value===t}),this.parseCommand(t),this.swapParseMode(e),s.children&&0!==s.children.length?s:null},a.prototype.scanModeShift=function(){if(!this.hasToken("$")&&!this.hasToken("$$"))return null
var t=this.get().type,e=new r("math","group")
e.mathstyle="$"===t?"textstyle":"displaystyle"
var s=this.swapParseMode("math")
return e.children=this.scanImplicitGroup(function(e){return e.type===t}),this.parseToken(t),this.swapParseMode(s),e.children&&0!==e.children.length?e:null},a.prototype.scanEnvironment=function(){if(!this.parseCommand("begin"))return null
var e=this.scanArg("string"),s=t.getEnvironmentInfo(e),i=[]
if(s&&s.params){var a=!0,n=!1,o=void 0
try{for(var h,p=s.params[Symbol.iterator]();!(a=(h=p.next()).done);a=!0){var l=h.value
if(l.optional){i.push(this.scanOptionalArg(l.type))}else i.push(this.scanArg(l.type))}}catch(t){n=!0,o=t}finally{try{!a&&p.return&&p.return()}finally{if(n)throw o}}}var u=this.parseMode,c=this.tabularMode,d=this.swapMathList([])
this.tabularMode=s.tabular
var m=[],f=[],v=[],y=!1
do{if(y=this.end(),!y&&this.parseCommand("end")&&(y=this.scanArg("string")===e),!y)if(this.parseColumnSeparator())v.push(this.swapMathList([]))
else if(this.parseRowSeparator()){v.push(this.swapMathList([]))
var k=0
this.parseToken("space"),this.parseLiteral("[")&&(k=this.scanDimen(),this.parseToken("space"),this.parseLiteral("]")),f.push(k||0),m.push(v),v=[]}else this.mathList=this.mathList.concat(this.scanImplicitGroup())}while(!y)
v.push(this.swapMathList([])),v.length>0&&m.push(v)
var g=this.swapMathList(d)
if(this.parseMode=u,this.tabularMode=c,!s.tabular&&0===g.length)return null
if(s.tabular&&0===m.length)return null
var M=new r(this.parseMode,"array",null,null,s.parser?s.parser(e,i,m):{})
return M.array=m,M.children=g,M.rowGaps=f,M.env=s,M.env.name=e,M},a.prototype.scanImplicitGroup=function(e){e||(e=n)
for(var s=null,i=null,a=this.swapMathList([]);!this.end()&&!e(this.peek());)if(this.hasImplicitSizingCommand()){var o=new r(this.parseMode,"sizing")
o.size={tiny:"size1",scriptsize:"size2",footnotesize:"size3",small:"size4",normalsize:"size5",large:"size6",Large:"size7",LARGE:"size8",huge:"size9",Huge:"size10"}[this.get().value],this.mathList.push(o)}else if(this.hasImplicitMathstyleCommand()){this.parseMode="math"
var h=new r("math","mathstyle")
h.mathstyle=this.get().value,this.mathList.push(h)}else this.hasInfixCommand()&&!s?(s=this.get(),i=this.swapMathList([])):this.parseAtom()
var p=void 0
if(s){var l=this.swapMathList(a),u=t.getInfo("\\"+s.value,"math")
p=[new r(this.parseMode,u.type||"mop",u.value||s.value,u.fontFamily,u.handler?u.handler("\\"+s.value,[i,l]):null)]}else p=this.swapMathList(a)
return p},a.prototype.scanGroup=function(){if(!this.parseToken("{"))return null
var t=new r(this.parseMode,"group")
return t.children=this.scanImplicitGroup(function(t){return"}"===t.type}),this.parseToken("}"),t},a.prototype.scanDelim=function(){this.parseToken("space")
var e=this.get()
if(!e)return null
var s="."
"command"===e.type?s="\\"+e.value:"literal"===e.type&&(s=e.value)
var i=t.getInfo(s,"math")
return i?"mopen"===i.type||"mclose"===i.type?s:["|","<",">","\\vert","\\Vert","\\|","\\surd","\\uparrow","\\downarrow","\\Uparrow","\\Downarrow","\\updownarrow","\\Updownarrow","\\mid","\\mvert","\\mVert"].includes(s)?s:null:null},a.prototype.scanLeftRight=function(){if(!this.parseCommand("left"))return null
for(var t=this.scanDelim()||".",e=this.swapMathList([]);!this.end()&&!this.parseCommand("right");)this.parseAtom()
var s=this.scanDelim()||".",i=new r(this.parseMode,"leftright")
return i.leftDelim=t,i.rightDelim=s,i.body=this.swapMathList(e),i},a.prototype.parseSupSub=function(){if("math"!==this.parseMode)return!1
for(var t=!1;this.hasToken("^")||this.hasToken("_")||this.hasLiteral("'");)if(this.parseToken("^")){var e=this.scanArg()
if(e){var s=this.lastMathAtom()
s.superscript=s.superscript||[],s.superscript=s.superscript.concat(e),t=t||!0}}else if(this.parseToken("_")){var i=this.scanArg()
if(i){var a=this.lastMathAtom()
a.subscript=a.subscript||[],a.subscript=a.subscript.concat(i),t=t||!0}}else if(this.parseLiteral("'")){var n=this.lastMathAtom()
n.superscript=n.superscript||[],n.superscript.push(new r(n.parseMode,"mord","′","main")),t=t||!0}return t},a.prototype.parseLimits=function(){if(this.parseCommand("limits")){var t=this.lastMathAtom()
return t.limits="limits",t.explicitLimits=!0,!0}if(this.parseCommand("nolimits")){var e=this.lastMathAtom()
return e.limits="nolimits",e.explicitLimits=!0,!0}return!1},a.prototype.scanOptionalArg=function(t){if(t=t&&"auto"!==t?t:this.parseMode,this.parseToken("space"),!this.parseLiteral("["))return null
var s=this.parseMode
this.parseMode=t
for(var i=this.swapMathList(),r=void 0;!this.end()&&!this.parseLiteral("]");)if("string"===t)r=this.scanString()
else if("number"===t)r=this.scanNumber()
else if("dimen"===t)r=this.scanDimen()
else if("skip"===t)r=this.scanSkip()
else if("colspec"===t)r=this.scanColspec()
else if("color"===t)r=this.scanColor()||"#ffffff"
else if("bbox"===t){var a=this.scanString().toLowerCase().trim().split(","),n=!0,o=!1,h=void 0
try{for(var l,u=a[Symbol.iterator]();!(n=(l=u.next()).done);n=!0){var c=l.value,d=e.stringToColor(c)
if(d)r=r||{},r.backgroundcolor=d
else{var m=c.match(/^\s*([0-9.]+)\s*([a-z][a-z])/)
if(m)r=r||{},r.padding=p(parseFloat(m[1]),m[2])
else{var f=c.match(/^\s*border\s*\:\s*(.*)/)
f&&(r=r||{},r.border=f[1])}}}}catch(t){o=!0,h=t}finally{try{!n&&u.return&&u.return()}finally{if(o)throw h}}}else this.mathList=this.mathList.concat(this.scanImplicitGroup(function(t){return"literal"===t.type&&"]"===t.value}))
this.parseMode=s
var v=this.swapMathList(i)
return r||v},a.prototype.scanArg=function(t){t=t&&"auto"!==t?t:this.parseMode,this.parseFiller()
var e=void 0
if(!this.parseToken("{")){if("delim"===t)return this.scanDelim()||"."
if("math"===t){var s=this.parseMode
this.parseMode="math"
var i=this.scanToken()
return this.parseMode=s,i?[i]:null}}if(this.hasToken("#")){var a=this.get()
return this.skipUntilToken("}"),"?"===a.value?[new r(this.parseMode,"placeholder","❓")]:this.args?this.args[a.value]||null:null}var n=this.parseMode
this.parseMode=t
var o=this.swapMathList([])
if("string"===t)e=this.scanString(),this.skipUntilToken("}")
else if("number"===t)e=this.scanNumber(),this.skipUntilToken("}")
else if("dimen"===t)e=this.scanDimen(),this.skipUntilToken("}")
else if("skip"===t)e=this.scanSkip(),this.skipUntilToken("}")
else if("colspec"===t)e=this.scanColspec(),this.skipUntilToken("}")
else if("color"===t)e=this.scanColor()||"#ffffff",this.skipUntilToken("}")
else if("delim"===t)e=this.scanDelim()||".",this.skipUntilToken("}")
else do{this.mathList=this.mathList.concat(this.scanImplicitGroup())}while(!this.parseToken("}")&&!this.end())
this.parseMode=n
var h=this.swapMathList(o)
return e||h},a.prototype.scanToken=function(){var e=this.get()
if(!e)return null
var s=null
if("space"===e.type)"text"===this.parseMode&&(s=new r("text","textord"," "))
else if("esc"===e.type)s=new r(this.parseMode,"esc","ESC")
else if("backslash"===e.type)s=new r(this.parseMode,"command","\\")
else if("commandliteral"===e.type||"backslash"===e.type){for(var i=e.value;this.hasToken("commandliteral")||this.hasToken("backslash");)i+=this.get().value
s=new r(this.parseMode,"command",i)}else if("placeholder"===e.type)s=new r(this.parseMode,"placeholder",e.value)
else if("command"===e.type)if("char"===e.value){var a=this.scanNumber(!0)
isNaN(a)&&(a=10067),s=new r(this.parseMode,"math"===this.parseMode?"mord":"textord",String.fromCodePoint(a),"main"),s.latex='\\char"'+("000000"+a.toString(16)).toUpperCase().substr(-6)}else if("hskip"===e.value||"kern"===e.value){var n=this.scanSkip()
isNaN(n)||(s=new r(this.parseMode,"spacing"),s.width=n)}else{var o=t.getInfo("\\"+e.value,this.parseMode),h=[]
if(o&&o.params){var p=!0,l=!1,u=void 0
try{for(var c,d=o.params[Symbol.iterator]();!(p=(c=d.next()).done);p=!0){var m=c.value
if(m.optional){var f=this.scanOptionalArg(m.type)
h.push(f)}else{var v=this.scanArg(m.type)
if(v&&1===v.length&&"placeholder"===v[0].type&&m.placeholder&&(v[0].value=m.placeholder),v)h.push(v)
else{var y=m.placeholder||"❓"
h.push([new r(this.parseMode,"placeholder",y)])}}}}catch(t){l=!0,u=t}finally{try{!p&&d.return&&d.return()}finally{if(l)throw u}}}o&&!o.infix&&(s=o.handler?new r(this.parseMode,o.type,null,o.fontFamily,o.handler("\\"+e.value,h)):new r(this.parseMode,o.type||"mop",o.value||e.value,o.fontFamily),s.latex="\\"+e.value+" ")}else if("literal"===e.type){var k=t.getInfo(e.value,this.parseMode)
s=k?new r(this.parseMode,k.type,k.value||e.value,k.fontFamily):new r(this.parseMode,"math"===this.parseMode?"mord":"textord",e.value,"main"),s.latex=t.matchCodepoint(e.value)}else if("#"===e.type)if("?"===e.value)s=new r(this.parseMode,"placeholder","❓")
else if(this.args)if(s=this.args[e.value]||null,Array.isArray(s)&&1===s.length)s=s[0]
else if(Array.isArray(s)){var g=new r(this.parseMode,"group")
g.children=s,s=g}return s},a.prototype.parseAtom=function(){var t=this.scanEnvironment()||this.scanModeShift()||this.scanModeSet()||this.scanGroup()||this.scanLeftRight()
return!(t||!this.parseSupSub()&&!this.parseLimits())||(t||(t=this.scanToken()),t&&this.mathList.push(t),null!==t)}
function l(t,e,s){var i=[],r=new a(t,s)
for(r.parseMode=e||"math";!r.end();)i=i.concat(r.scanImplicitGroup())
return i}return{Parser:a,parseTokens:l}})
