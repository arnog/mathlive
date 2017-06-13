"use strict"
define(["mathlive/core/mathAtom","mathlive/core/definitions"],function(e,t){var a={"\\alpha":" alpha ","\\mu":" mew ","\\sigma":" sigma ","\\pi":" pie ","\\imaginaryI":" eye ","\\sum":" Summation ","\\prod":" Product ","|":" Vertical bar.","(":" Open paren. [[slnc 150]]",")":" [[slnc 150]] Close paren.","=":" [[slnc 150]] equals ","\\lt":" [[slnc 150]] is less than ","\\le":" [[slnc 150]] is less than or equal to ","\\gt":" [[slnc 150]] is greater than ","\\ge":" [[slnc 150]] is greater than or equal to ","\\geq":" [[slnc 150]]is greater than or equal to ","\\leq":" [[slnc 150]]is less than or equal to ","!":" factorial ","\\sin":" sine ","\\cos":" cosine ","​":"","−":" minus ","\\colon":"[[slnc 150]] such that [[slnc 200]]","\\hbar":"etch bar","\\iff":" if and only if ","\\land":" and ","\\lor":" or ","\\neg":" not ","\\forall":" for all ","\\exists":" there exists ","\\nexists":" there does not exists ","\\in":" element of ","\\N":" the set [[char LTRL]]n[[char NORM]]","\\C":" the set [[char LTRL]]c[[char NORM]]","\\Z":" the set [[char LTRL]]z[[char NORM]]","\\Q":" the set [[char LTRL]]q[[char NORM]]","\\infty":" infinity ","\\nabla":" nabla ","\\partial":" partial derivative of ","\\cdots":" dot dot dot "}
function r(e){var t="other"
return navigator&&navigator.platform&&navigator.userAgent&&(/^(mac)/i.test(navigator.platform)?t="mac":/^(win)/i.test(navigator.platform)?t="win":/(android)/i.test(navigator.userAgent)?t="android":/(iphone)/i.test(navigator.userAgent)||/(ipod)/i.test(navigator.userAgent)||/(ipad)/i.test(navigator.userAgent)?t="ios":/\bCrOS\b/i.test(navigator.userAgent)&&(t="chromeos")),t===e?e:"!"+e}function s(e){var t=0
if(e&&Array.isArray(e)){var a=!0,r=!1,s=void 0
try{for(var n,i=e[Symbol.iterator]();!(a=(n=i.next()).done);a=!0){"first"!==n.value.type&&(t+=1)}}catch(e){r=!0,s=e}finally{try{!a&&i.return&&i.return()}finally{if(r)throw s}}}return 1===t}function n(e){var t=""
if(e&&Array.isArray(e)){var a=!0,r=!1,s=void 0
try{for(var n,i=e[Symbol.iterator]();!(a=(n=i.next()).done);a=!0){var o=n.value
"first"!==o.type&&(t+=o.value)}}catch(e){r=!0,s=e}finally{try{!a&&i.return&&i.return()}finally{if(r)throw s}}}return t}return e.MathAtom.prototype.toSpeakableText=function(t){return e.toSpeakableFragment(t,{markup:!1})},e.toSpeakableFragment=function(r,i){function o(e){if("ssml"===i.markup);else if(i.markup)return"[[emph +]]"+e
return e}var l=""
if(Array.isArray(r))for(var c=0;c<r.length;c++)c<r.length-2&&"mopen"===r[c].type&&"mclose"===r[c+2].type&&"mord"===r[c+1].type?(l+=" of ",l+=o(e.toSpeakableFragment(r[c+1],i)),c+=2):l+=e.toSpeakableFragment(r[c],i)
else{var p=void 0!==i.markup&&i.markup,m="",u="",f="",h=!1
switch(r.type){case"group":case"root":l+=e.toSpeakableFragment(r.children,i)
break
case"genfrac":if(m=e.toSpeakableFragment(r.numer,i),u=e.toSpeakableFragment(r.denom,i),s(r.numer)&&s(r.denom)){var v={"1/2":" half ","1/3":" one third ","2/3":" two third","1/4":" one quarter ","3/4":" three quarter ","1/5":" one fifth ","2/5":" two fifths ","3/5":" three fifths ","4/5":" four fifths ","1/6":" one sixth ","5/6":" five sixts ","1/8":" one eight ","3/8":" three eights ","5/8":" five eights ","7/8":" seven eights ","1/9":" one ninth ","2/9":" two ninths ","4/9":" four ninths ","5/9":" five ninths ","7/9":" seven ninths ","8/9":" eight ninths ","x/2":" half [[char LTRL]] X [[char NORM]] "},b=v[n(r.numer)+"/"+n(r.denom)]
b?l=b:l+=m+" over "+u+" "}else l+=" The fraction [[slnc 200]]"+m+", over [[slnc 150]]"+u+". End fraction."
break
case"surd":if(f=e.toSpeakableFragment(r.body,i),r.index){var g=e.toSpeakableFragment(r.index,i)
g=g.trim(),l+="3"===g?" The cube root of "+f+" . End cube root.":"n"===g?" The nth root of "+f+" . End root.":" root with index: "+g+", of :"+f+" . End root."}else s(r.body)?l+=" square root of "+f+" , ":l+=" The square root of "+f+" . End square root."
break
case"accent":break
case"leftright":l+=r.leftDelim,l+=e.toSpeakableFragment(r.body,i),l+=r.rightDelim
break
case"delim":case"sizeddelim":case"line":case"rule":case"overunder":case"overlap":break
case"mord":case"minner":case"mbin":case"mrel":case"mpunct":case"mopen":case"mclose":case"textord":if("text"===i.mode)l+=r.value
else{if("mbin"===r.type&&(l+="[[slnc 150]]"),r.value){var d=a[r.value]||(r.latex?a[r.latex.trim()]:"")
if(d)l+=" "+d
else{var k=r.latex?t.getSpokenName(r.latex.trim()):""
l+=k||function(e){var t=""
return i.markup?/[a-z]/.test(e)?t+=" [[char LTRL]]"+e+"[[char NORM]]":/[A-Z]/.test(e)?t+="capital "+e.toLowerCase():t+=e:/[a-z]/.test(e)?t+=' "'+e.toUpperCase()+'"':/[A-Z]/.test(e)?t+=' "capital '+e.toUpperCase()+'"':t+=e,t}(r.value)}}else l+=e.toSpeakableFragment(r.children,i)
"mbin"===r.type&&(l+="[[slnc 150]]")}break
case"op":case"mop":if("​"!==r.value){var y=r.latex?r.latex.trim():""
if("\\sum"===y)if(r.superscript&&r.subscript){var x=e.toSpeakableFragment(r.superscript,i)
x=x.trim()
var S=e.toSpeakableFragment(r.subscript,i)
S=S.trim(),l+=" The summation from "+S+" to  [[slnc 150]]"+x+" of [[slnc 150]]",h=!0}else l+=" The summation  of"
else if("\\prod"===y)if(r.superscript&&r.subscript){var F=e.toSpeakableFragment(r.superscript,i)
F=F.trim()
var T=e.toSpeakableFragment(r.subscript,i)
T=T.trim(),l+=" The product from "+T+" to "+F+" of [[slnc 150]]",h=!0}else l+=" The product  of "
else if("\\int"===y)if(r.superscript&&r.subscript){var w=e.toSpeakableFragment(r.superscript,i)
w=w.trim()
var A=e.toSpeakableFragment(r.subscript,i)
A=A.trim(),l+=" The integral from "+o(A)+" to "+o(w)+" [[slnc 200]] of ",h=!0}else l+=" integral "
else if(r.value){var q=a[r.value]||a[r.latex.trim()]
l+=q||" "+r.value}else r.latex&&r.latex.length>0&&(l+="\\"===r.latex[0]?" "+r.latex.substr(1):" "+r.latex)}break
case"font":i.mode="text",l+="[[slnc 150]]",l+=e.toSpeakableFragment(r.body,i),l+="[[slnc 150]]",i.mode="math"}if(!h&&r.superscript){var L=e.toSpeakableFragment(r.superscript,i)
L=L.trim(),s(r.superscript)?l+="′"===L?" prime ":"2"===L?" squared ":"3"===L?" cubed ":" to the "+L+"; ":l+=" raised to the [[pbas +4]]"+L+" [[pbas -4]] power. "}if(!h&&r.subscript){var R=e.toSpeakableFragment(r.subscript,i)
R=R.trim(),s(r.subscript)?l+=" sub "+R:l+=" subscript "+R+". End subscript. "}"ssml"===p||p||(l=l.replace(/\[\[[^\]]*\]\]/g,""))}return l},e.toSpeakableText=function(t,a){a||(a={markup:!1})
var s=""
return"ssml"===a.markup?s='<!-- ?xml version="1.0"? -->\n<speak xmlns="http://www.w3.org/2001/10/synthesis"\nversion="1.0"><p><s xml:lang="en-US">':a.markup&&"!mac"===r("mac")&&(a.markup=!1),s+=e.toSpeakableFragment(t,a),s+=".","ssml"===a.markup&&(s+="</s></p></speak>"),s},{}})
