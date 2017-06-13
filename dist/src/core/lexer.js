"use strict"
define(function(){function t(t,e){this.type=t,this.value=e}function e(t){this.s=t,this.pos=0}e.prototype.end=function(){return this.pos>=this.s.length},e.prototype.get=function(){return this.pos<this.s.length?this.s[this.pos++]:null},e.prototype.peek=function(){return this.pos<this.s.length?this.s[this.pos]:null},e.prototype.scan=function(t){var e=t.exec(this.s.slice(this.pos))
return e?(this.pos+=e[0].length,e[0]):null},e.prototype.isWhiteSpace=function(){return-1!==" \f\n\r\t\v \u2028\u2029".indexOf(this.s[this.pos])},e.prototype.skipWhiteSpace=function(){for(var t=this.pos;!this.end()&&this.isWhiteSpace();)this.get()
return this.pos-t},e.prototype.makeToken=function(){if(this.end())return null
if(this.skipWhiteSpace()>0)return new t("space")
var e=null
if("\\"===this.peek()){if(this.get(),!this.end()){var s=this.scan(/^[a-zA-Z*]+/)
s||(s=this.get()),e="bgroup"===s?new t("{"):"egroup"===s?new t("}"):new t("command",s)}}else if("{"===this.peek()||"}"===this.peek())e=new t(this.get())
else if("#"===this.peek()){if(this.get(),!this.end()){var i=!1,n=this.peek()
if(/[0-9\?]/.test(n)&&this.pos+1<this.s.length){var h=this.s[this.pos+1]
i=/[^0-9A-Za-z]/.test(h)}i?(e=new t("#"),n=this.get(),e.value=n>="0"&&n<="9"?parseInt(n):"?"):e=new t("literal","#")}}else"^"===this.peek()?e=new t(this.get()):"_"===this.peek()?e=new t(this.get()):"~"===this.peek()?(this.get(),e=new t("command","space")):""===this.peek()?e=new t("esc",this.get()):"$"===this.peek()?(this.get(),"$"===this.peek()?(this.get(),e=new t("$$")):e=new t("$")):e=new t("literal",this.get())
return e}
function s(t){var s=[],i=(""+t).split(/\r?\n/),n="",h=!0,r=!1,o=void 0
try{for(var p,a=i[Symbol.iterator]();!(h=(p=a.next()).done);h=!0)for(var u=p.value,l="",f=0;f<u.length;f++){var c=u.charAt(f)
if("%"===c&&"\\"!==l)break
n+=c,l=c}}catch(t){r=!0,o=t}finally{try{!h&&a.return&&a.return()}finally{if(r)throw o}}for(var g=new e(n);!g.end();){var k=g.makeToken()
k&&s.push(k)}return s}return{tokenize:s}})
