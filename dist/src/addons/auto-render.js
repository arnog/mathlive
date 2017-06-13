"use strict"
define(["mathlive/mathlive"],function(e){function t(e,t,r){for(var a=r,n=0,i=e.length;a<t.length;){var l=t[a]
if(n<=0&&t.slice(a,a+i)===e)return a
"\\"===l?a++:"{"===l?n++:"}"===l&&n--,a++}return-1}function r(e,r,a,n){for(var i=[],l=0;l<e.length;l++)if("text"===e[l].type){var d=e[l].data,o=!0,c=0,p=void 0
for(p=d.indexOf(r),-1!==p&&(c=p,i.push({type:"text",data:d.slice(0,c)}),o=!1);;){if(o){if(-1===(p=d.indexOf(r,c)))break
i.push({type:"text",data:d.slice(c,p)}),c=p}else{if(-1===(p=t(a,d,c+r.length)))break
i.push({type:"math",data:d.slice(c+r.length,p),rawData:d.slice(c,p+a.length),display:n}),c=p+a.length}o=!o}i.push({type:"text",data:d.slice(c)})}else i.push(e[l])
return i}function a(e,t){for(var a=[{type:"text",data:e}],n=0;n<t.length;n++){var i=t[n]
a=r(a,i.left,i.right,i.display||!1)}return a}function n(t,r){var n=document.createDocumentFragment()
if(t.match(/^\s*\\begin/)){var i=document.createElement("span")
n.appendChild(i)
try{i.innerHTML=e.toMarkup(t,!0)}catch(e){n.appendChild(document.createTextNode(t))}}else for(var l=a(t,r),d=0;d<l.length;d++)if("text"===l[d].type)n.appendChild(document.createTextNode(l[d].data))
else{var o=document.createElement("span")
try{o.innerHTML=e.toMarkup(l[d].data,l[d].display)}catch(e){n.appendChild(document.createTextNode(l[d].rawData))
continue}n.appendChild(o)}return n}function i(e,t,r){for(var a=0;a<e.childNodes.length;a++){var l=e.childNodes[a]
if(3===l.nodeType){var d=n(l.textContent,t)
a+=d.childNodes.length-1,e.replaceChild(d,l)}else if(1===l.nodeType){var o=-1===r.indexOf(l.nodeName.toLowerCase())
o&&i(l,t,r)}}}var l={delimiters:[{left:"$$",right:"$$",display:!0},{left:"\\[",right:"\\]",display:!0},{left:"\\(",right:"\\)",display:!1}],ignoredTags:["script","noscript","style","textarea","pre","code"]}
function d(e){var t=!0,r=!1,a=void 0
try{for(var n,i=arguments[Symbol.iterator]();!(t=(n=i.next()).done);t=!0){var l=n.value
for(var d in l)Object.prototype.hasOwnProperty.call(l,d)&&(e[d]=l[d])}}catch(e){r=!0,a=e}finally{try{!t&&i.return&&i.return()}finally{if(r)throw a}}return e}return{renderMathInElement:function(e,t){e&&(t=d({},l,t),i(e,t.delimiters,t.ignoredTags))}}})
