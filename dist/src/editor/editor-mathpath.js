"use strict"
define([],function(){function t(t){var r="",n=!0,e=!1,a=void 0
try{for(var o,i=t[Symbol.iterator]();!(n=(o=i.next()).done);n=!0){var l=o.value
"array"===l.relation?r+="array:"+l.col+","+l.row:(r+=l.relation,r+=":",r+=l.offset),r+="/"}}catch(t){e=!0,a=t}finally{try{!n&&i.return&&i.return()}finally{if(e)throw a}}return r}function r(t){var r={}
r.path=[]
var n=t.match(/@([^,]*)$/)
n&&(t=t.match(/([^@]*)@/)[1])
var e=t.split("/"),a=!0,o=!1,i=void 0
try{for(var l,f=e[Symbol.iterator]();!(a=(l=f.next()).done);a=!0){var h=l.value,u=h.match(/([^:]*):(.*)/)
if(u){var c={relation:u[1]}
if("array"===u[1]){var s=u[2].split(",")
c.col=parseInt(s[0]),c.row=parseInt(s[1])}else c.offset=parseInt(u[2])
r.path.push(c)}}}catch(t){o=!0,i=t}finally{try{!a&&f.return&&f.return()}finally{if(o)throw i}}return r.extent=n?parseInt(n[1]):0,r}function n(t,r){for(var n=[],e=Math.min(t.length-1,r.length-1),a=0;a<=e&&t[a].relation===r[a].relation&&t[a].offset===r[a].offset;)n.push(t[a]),a+=1
return n}function e(t,r){for(var n=-1,e=!1;!e;)n+=1,e=n>=t.length||n>=r.length,e=e||!(t[n].relation===r[n].relation&&t[n].offset===r[n].offset)
return n===t.length&&n===r.length?0:n+1===t.length&&n+1===r.length&&t[n].relation===r[n].relation?1:2}function a(n){return r(t(n)).path}return{pathFromString:r,pathToString:t,pathDistance:e,pathCommonAncestor:n,clone:a}})
