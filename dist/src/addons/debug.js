"use strict"
define([],function(){function r(e,n){if(!e)return null
var s=null
Array.isArray(n)&&(s=n.slice(),n=s.shift())
var t=null
if("number"==typeof n&&n<e.length)return s&&s.length>0?r(e[n].children,s):e[n]
if("string"==typeof n){for(var a=0;a<e.length;a++){if(e[a].body===n)return s&&s.length>0?r(e[a].children,s):e[a]
if(t=r(e[a].children,n))return t}return t}}function e(e,n,s){var t=r(e,n)
return t?t[s]:null}function n(e,n){var s=r(e,n)
return s?s.type:null}function s(e,n,s){var t=r(e,n)
return t&&t.style?t.style[s]:null}function t(e,n){var s=r(e,n)
return s?s.classes||"":null}function a(r,e,n){var s=t(r,e)
if(!s)return!1
s=s.split(" ")
for(var a=0;a<s.length;a++)if(s[a]===n)return!0
return!1}function l(r,e,n){e=e||"",n=n||"["
var s=""
if(Array.isArray(r))if(0===r.length)s+="[]\n"
else{s+="[\n"
for(var t=0;t<r.length;t++)s+=l(r[t],"\t"+e),s+=t<r.length-1?",\n":"\n"
s+=e+"]\n"}else{if(s=e+"{\n",r.type&&(s+=e+'type:"'+r.type+'",\n'),r.body&&r.body.length>0&&(s+=e+'body:"'+r.body+'",\n'),r.classes&&r.classes.length>0&&(s+=e+'classes:"'+r.classes+'",\n'),r.style)for(var a in r.style)r.style.hasOwnProperty(a)&&(s+=e+a+':"',s+=r.style[a]+'",\n')
r.children&&r.children.length>0&&(s+=e+"children:"+l(r.children,e)),s+=e+"}"}return s}function i(r,e,n){var s=r[e]
return"string"==typeof s?n+e+':"'+s+'",\n':"boolean"==typeof s?n+e+":"+s+",\n":"number"==typeof s?n+e+":"+s+",\n":Array.isArray(s)?n+e+":"+o(s,n+"\t")+",\n":""}function o(r,e){if(!r)return""
e=e||""
var n=""
if(Array.isArray(r)){if(0===r.length)return""
n+="[\n"
for(var s=0;s<r.length;s++)n+=o(r[s],e+"\t")+",\n"
n+=e+"]\n"}else n=e+"{\n",n+=i(r,"type",e),n+=i(r,"value",e),n+=i(r,"fontFamily",e),n+=i(r,"hasBarLine",e),n+=i(r,"leftDelim",e),n+=i(r,"rightDelim",e),n+=i(r,"numer",e),n+=i(r,"denom",e),n+=i(r,"limits",e),n+=i(r,"symbol",e),n+=i(r,"color",e),n+=i(r,"textcolor",e),n+=i(r,"backgroundcolor",e),n+=i(r,"framecolor",e),n+=i(r,"position",e),n+=i(r,"mathstyle",e),n+=i(r,"superscript",e),n+=i(r,"subscript",e),n+=i(r,"body",e),n+=i(r,"children",e),n+=i(r,"array",e),n+=e+"}"
return n}function y(r,e){e=e||""
var n=""
if(Array.isArray(r))for(var s=0;s<r.length;s++)n+=y(r[s],e)
else if("table"!==r.tag)if(n="<br>"+e,r.classes.includes("fontsize-ensurer"))n+="FONTSIZE-ENSURER"
else{if(r.type&&(n+='<span class="type">'+r.type+"</span>"),r.body&&r.body.length>0&&(n+='<span class="value">'+r.body+"</span>"),r.classes&&r.classes.length>0&&(n+='&nbsp;<span class="classes">'+r.classes+"</span>"),r.isTight&&(n+='&nbsp;<span class="stylevalue"> tight </span>'),r.hasCaret&&(n+='&nbsp;<span class="stylevalue"> hasCaret </span>'),r.style)for(var t in r.style)r.style.hasOwnProperty(t)&&(n+='&nbsp;<span class="styleprop">'+t+":</span>",n+='<span class="stylevalue"> '+r.style[t]+"</span>;&nbsp;")
r.children&&(n+=y(r.children,e+"▷"))}else{n+="<br>"+e+"table "+r.array[0].length+"&times;"+r.array.length
for(var a=0;a<r.array.length;a++)for(var l=0;l<r.array[a].length;l++)n+="<br>"+e+"["+(a+1)+", "+(l+1)+"] ",n+=y(r.array[a][l],"")}return n}function p(r,e){var n=""
return r[e]&&(n+='<span class="styleprop">'+e+"=</span>",n+='<span style="font-size:2em;vertical-align:middle;color:'+r[e]+'">&#9632;</span>',n+='<span class="stylevalue">',n+=r[e],n+="</span>"),n}function c(r,e){var n=""
return r[e]&&(n+='<span class="styleprop">'+e+"=</span>",n+='<span class="stylevalue">',n+=r[e],n+='</span>" '),n}function u(r,e){if(!r)return""
e=e||""
var n=""
if(Array.isArray(r))for(var s=0;s<r.length;s++)n+=u(r[s],s+"."+e)
else if(n="<br>"+e,r.type&&(n+='<span class="type',n+=r.isSelected?" selected":"",n+=r.hasCaret?" caret":"",n+='">'+r.type+"</span>"),r.value&&r.value.length>0&&(n+='&nbsp;<span class="value">',n+=r.value,(r.value.charCodeAt(0)<32||r.value.charCodeAt(0)>127)&&(n+="&nbsp;U+"+("000000"+r.value.charCodeAt(0).toString(16)).substr(-6)),n+="</span>&nbsp;"),"mathrm"===r.fontFamily?(n+='<span style="opacity:.2">',n+=c(r,"fontFamily"),n+="</span>"):n+=c(r,"fontFamily"),n+=c(r,"hasBarLine"),n+=c(r,"leftDelim"),n+=c(r,"rightDelim"),n+=c(r,"continuousFraction"),n+=c(r,"limits"),n+=c(r,"symbol"),n+=p(r,"color"),n+=p(r,"textcolor"),n+=p(r,"backgroundcolor"),n+=p(r,"framecolor"),n+=c(r,"mathstyle"),n+=c(r,"size"),n+=c(r,"cls"),n+=c(r,"delim"),n+=c(r,"shift"),n+=c(r,"width"),n+=c(r,"height"),n+=c(r,"position"),n+=c(r,"font"),n+=u(r.overscript,e+"↑"),n+=u(r.underscript,e+"↓"),n+=u(r.superscript,e+"↑"),n+=u(r.subscript,e+"↓"),n+=u(r.children,e+"▷"),n+=u(r.body,e+"▶"),n+=u(r.numer,e+"▲"),n+=u(r.denom,e+"▼"),r.array)for(var t=0;t<r.array.length;t++){n+="<br>"+e+"⌗ row "+(t+1)+"/"+r.array.length
for(var a=0;a<r.array[t].length;a++)n+=u(r.array[t][a],e+"⌗〉")}return n}return{mathlistToMarkup:u,spanToMarkup:y,mathlistToString:o,spanToString:l,hasClass:a,getClasses:t,getProp:e,getStyle:s,getType:n}})
