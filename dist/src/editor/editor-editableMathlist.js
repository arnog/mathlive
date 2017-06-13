"use strict"
define(["mathlive/core/definitions","mathlive/core/mathAtom","mathlive/core/lexer","mathlive/core/parser","mathlive/editor/editor-mathpath"],function(t,e,i,s,n){function o(t){this.root=e.makeRoot(),this.path=[{relation:"children",offset:0}],this.extent=0,this.config=Object.assign({},t),this.suppressSelectionChangeNotifications=!1}o.prototype.filter=function(t,e){var i=this.suppressSelectionChangeNotifications
this.suppressSelectionChangeNotifications=!0,e=1===e?1:-1
var s=[],o=this.extent
e>=0?this.collapseForward():this.collapseBackward()
var r=n.pathToString(this.path)
do{t.bind(this)(this.path,this.anchor())&&s.push(""+this),e>=0?this.next():this.previous()}while(r!==n.pathToString(this.path))
return this.extent=o,this.suppressSelectionChangeNotifications=i,s},o.prototype.toString=function(){var t=n.pathToString(this.path)
return 0!==this.extent&&(t+="#"+this.extent),t},o.prototype.setPath=function(t,e){"string"==typeof t?t=n.pathFromString(t):Array.isArray(t)&&(t={path:n.clone(t),extent:e||0})
var i=0!==n.pathDistance(this.path,t.path),s=t.extent!==this.extent;(i||s)&&(this.suppressSelectionChangeNotifications||this.config.onSelectionWillChange&&this.config.onSelectionWillChange(),this.path=n.clone(t.path),this.setExtent(t.extent),this.suppressSelectionChangeNotifications||this.config.onSelectionDidChange&&this.config.onSelectionDidChange())},o.prototype.setRange=function(t,e){var i=n.pathDistance(t,e)
if(0===i)this.setPath(t,0)
else if(1===i){var s=e[e.length-1].offset-t[t.length-1].offset,o=n.clone(t)
o[o.length-1]={relation:o[o.length-1].relation,offset:o[o.length-1].offset+1},this.setPath(o,s)}else{var r=n.pathCommonAncestor(t,e),h=r.length
if(t.length===h||e.length===h||t[h].relation!==e[h].relation)this.setPath(r,1)
else{r.push(t[h]),r=n.clone(r)
var a=e[h].offset-t[h].offset
a<=0?e.length>h+1?(r[h].relation=e[h].relation,r[h].offset=e[h].offset,a=-a):(r[h].relation=e[h].relation,r[h].offset=e[h].offset+1,a=-a-1):e.length>t.length&&(r=n.clone(r),r[r.length-1].offset+=1,a-=1),this.setPath(r,a+1)}}},o.prototype.ancestor=function(t){if(t>this.path.length)return null
for(var e=this.root,i=0;i<this.path.length-t;i++){var s=this.path[i]
e="array"===s.relation?e.array[s.row][s.col]:e[s.relation][s.offset]}return e},o.prototype.anchor=function(){return this.siblings()[this.anchorOffset()]},o.prototype.focus=function(){return this.sibling(this.extent)},o.prototype.parent=function(){return this.ancestor(1)},o.prototype.relation=function(){return this.path[this.path.length-1].relation},o.prototype.anchorOffset=function(){return this.path[this.path.length-1].offset},o.prototype.focusOffset=function(){return this.path[this.path.length-1].offset+this.extent},o.prototype.startOffset=function(){return Math.min(this.path[this.path.length-1].offset,this.path[this.path.length-1].offset+this.extent)},o.prototype.endOffset=function(){return Math.max(this.path[this.path.length-1].offset,this.path[this.path.length-1].offset+this.extent)},o.prototype.insertFirstAtom=function(){this.siblings()},o.prototype.siblings=function(){var t=this.parent()[this.relation()]
if(0===t.length||"first"!==t[0].type){t.unshift(new e.MathAtom(this.parent().parseMode,"first",null))}return t},o.prototype.sibling=function(t){var e=this.anchorOffset()+t,i=this.siblings()
return e<0||e>i.length?null:i[e]},o.prototype.isCollapsed=function(){return 0===this.extent},o.prototype.setExtent=function(t){this.extent=t},o.prototype.collapseForward=function(){return!this.isCollapsed()&&(this.setSelection(Math.max(this.anchorOffset(),this.focusOffset())-1),!0)},o.prototype.collapseBackward=function(){return!this.isCollapsed()&&(this.setSelection(Math.min(this.anchorOffset(),this.focusOffset())),!0)},o.prototype.selectGroup_=function(){this.setSelection(1,"end")},o.prototype.selectAll_=function(){this.path=[{relation:"children",offset:0}],this.setSelection(1,"end")}
function r(t,e){if(!t)return!1
if(Array.isArray(t)){var i=!0,s=!1,n=void 0
try{for(var o,h=t[Symbol.iterator]();!(i=(o=h.next()).done);i=!0){if(r(o.value,e))return!0}}catch(t){s=!0,n=t}finally{try{!i&&h.return&&h.return()}finally{if(s)throw n}}}else{if(t===e)return!0
if(["array","children","numer","denom","body","offset","subscript","superscript"].some(function(i){return i===e||r(t[i],e)}))return!0}return!1}o.prototype.contains=function(t){if(this.isCollapsed())return!1
if("array"===this.relation())return!1
for(var e=this.siblings(),i=this.startOffset(),s=this.endOffset(),n=i;n<s;n++)if(r(e[n],t))return!0
return!1},o.prototype.extract=function(){if(this.isCollapsed())return null
var t=[],e=this.siblings(),i=this.startOffset()
if(i<e.length)for(var s=Math.min(e.length,this.endOffset()),n=i;n<s;n++)t.push(e[n])
return t},o.prototype.extractContents=function(){if(this.isCollapsed())return null
var t=[],e=this.siblings(),i=this.startOffset()
if(i<e.length)for(var s=Math.min(e.length,this.endOffset()),n=i;n<s;n++)t.push(e[n])
return t},o.prototype.extractGroupBeforeSelection=function(){var t=this.siblings()
if(t.length<=1)return null
for(var e=[],i=this.isCollapsed()?this.startOffset():this.startOffset()-1,s=1;s<=i;s++)"first"!==t[s].type&&e.push(t[s])
return e.length>0?e:null},o.prototype.extractGroupAfterSelection=function(){var t=this.siblings()
if(t.length<=1)return null
for(var e=[],i=t.length-1,s=this.isCollapsed()?this.endOffset()+1:this.endOffset(),n=s;n<=i;n++)"first"!==t[n].type&&e.push(t[n])
return e.length>0?e:null},o.prototype.extractGroupStringBeforeInsertionPoint=function(){var t=this.siblings()
if(t.length<=1)return""
for(var e="",i=this.startOffset(),s=1;s<=i;s++)["mord","mbin","mrel","mopen","mclose","minner"].includes(t[s].type)?e+=t[s].value||"�":e+="�"
return e},o.prototype.commandOffsets=function(){var t=this.siblings()
if(t.length<=1)return null
var e=Math.min(this.endOffset(),t.length-1)
if("command"!==t[e].type)return null
for(;e>0&&"command"===t[e].type;)e-=1
for(var i=this.startOffset()+1;i<=t.length-1&&"command"===t[i].type;)i+=1
return i>e?{start:e+1,end:i}:null},o.prototype.extractCommandStringAroundInsertionPoint=function(){var t="",e=this.commandOffsets()
if(e)for(var i=this.siblings(),s=e.start;s<e.end;s++)t+=i[s].value||""
return t},o.prototype.decorateCommandStringAroundInsertionPoint=function(t){var e=this.commandOffsets()
if(e)for(var i=this.siblings(),s=e.start;s<e.end;s++)i[s].error=t},o.prototype.commitCommandStringBeforeInsertionPoint=function(){var t=this.commandOffsets()
if(t)for(var e=this.siblings(),i=this.anchorOffset(),s=t.start;s<i;s++)e[s].suggestion=!1},o.prototype.spliceCommandStringAroundInsertionPoint=function(t){var e=this.commandOffsets()
if(e){Array.prototype.splice.apply(this.siblings(),[e.start,e.end-e.start].concat(t))
var i=[],s=!0,n=!1,o=void 0
try{for(var r,h=t[Symbol.iterator]();!(s=(r=h.next()).done);s=!0){i=i.concat(r.value.filter(function(t){return"placeholder"===t.type}))}}catch(t){n=!0,o=t}finally{try{!s&&h.return&&h.return()}finally{if(n)throw o}}this.setExtent(0),this.path[this.path.length-1].offset=e.start-1,0!==i.length&&this.leap()||this.setSelection(e.start+t.length-1)}},o.prototype.extractContentsOrdInGroupBeforeInsertionPoint=function(){var t=[],e=this.siblings()
if(e.length<=1)return[]
for(var i=this.startOffset();i>=1&&"mord"===e[i].type;)t.unshift(e[i]),i--
return t},o.prototype.setSelection=function(t,e,i){var s=this.path[this.path.length-1].relation
i||(i=s)
var n=this.parent()
if(!n&&"children"!==i)return!1
if(!n[i])return!1
var o=i!==s
t=t||0,this.path[this.path.length-1].relation=i
var r=this.siblings()
this.path[this.path.length-1].relation=s,t<0&&(t=r.length+t),t=Math.max(0,Math.min(t,r.length))
var h=this.path[this.path.length-1].offset,a=h!==t,p=this.extent
e=e||0,"end"===e?0===(e=r.length-t)&&(t-=1):"start"===e&&0===(e=-t)&&(t-=1),this.setExtent(e)
var l=this.extent!==p
return this.setExtent(p),(o||a||l)&&(this.suppressSelectionChangeNotifications||this.config.onSelectionWillChange&&this.config.onSelectionWillChange(),this.path[this.path.length-1].relation=i,this.path[this.path.length-1].offset=t,this.setExtent(e),this.suppressSelectionChangeNotifications||this.config.onSelectionDidChange&&this.config.onSelectionDidChange()),!0},o.prototype.next=function(){var t={children:"array",array:"numer",numer:"denom",denom:"index",index:"body",body:"subscript",subscript:"superscript"}
if(this.anchorOffset()===this.siblings().length-1){for(var e=t[this.relation()];e&&!this.setSelection(0,0,e);)e=t[e]
if(e)return
return this.suppressSelectionChangeNotifications||this.config.onSelectionWillChange&&this.config.onSelectionWillChange(),1===this.path.length?(this.suppressSelectionChangeNotifications||!this.config.onMoveOutOf||this.config.onMoveOutOf(this,1))&&(this.path[0].offset=0):this.path.pop(),void(this.suppressSelectionChangeNotifications||this.config.onSelectionDidChange&&this.config.onSelectionDidChange())}this.setSelection(this.anchorOffset()+1)
for(var i=this.anchor(),s="children";s;){if(i[s])return this.path.push({relation:s,offset:0}),void this.insertFirstAtom()
s=t[s]}},o.prototype.previous=function(){var t={array:"children",numer:"array",denom:"numer",index:"denom",body:"index",subscript:"body",superscript:"subscript"}
if(this.anchorOffset()<1){for(var e=t[this.relation()];e&&!this.setSelection(-1,0,e);)e=t[e]
if(e)return
return this.suppressSelectionChangeNotifications||this.config.onSelectionWillChange&&this.config.onSelectionWillChange(),1===this.path.length?(this.suppressSelectionChangeNotifications||!this.config.onMoveOutOf||this.config.onMoveOutOf(this,-1))&&(this.path[0].offset=this.root.children.length-1):(this.path.pop(),this.setSelection(this.anchorOffset()-1)),void(this.suppressSelectionChangeNotifications||this.config.onSelectionDidChange&&this.config.onSelectionDidChange())}for(var i=this.anchor(),s="superscript";s;){if(i[s])return this.path.push({relation:s,offset:i[s].length-1}),void this.setSelection(-1,0,s)
s=t[s]}this.setSelection(this.anchorOffset()-1)},o.prototype.move=function(t,e){e=e||{extend:!1}
var i=e.extend||!1
if(this.removeSuggestion(),i)this.extend(t,e)
else{var s=this.parent(),n=this.relation(),o=this.siblings()
if(t>0)for(this.collapseForward()&&t--;t>0;)this.next(),t--
else if(t<0)for(this.collapseBackward();0!==t;)this.previous(),t++
o.length<=1&&["superscript","subscript","index"].includes(n)&&(s[n]=null)}},o.prototype.up=function(t){t=t||{extend:!1}
var e=t.extend||!1
this.collapseForward(),"denom"===this.relation()&&(e?(this.path.pop(),this.setExtent(1)):this.setSelection(this.anchorOffset(),0,"numer"))},o.prototype.down=function(t){t=t||{extend:!1}
var e=t.extend||!1
this.collapseForward(),"numer"===this.relation()&&(e?(this.path.pop(),this.setExtent(1)):this.setSelection(this.anchorOffset(),0,"denom"))},o.prototype.extend=function(t){var e=this.path[this.path.length-1].offset,i=0
this.isCollapsed()&&(e+=1),i=this.extent+t
var s=e+i
s<=0?this.path.length>1?(this.path.pop(),e=this.path[this.path.length-1].offset+1,i=-1):(this.isCollapsed()&&(e-=1),i-=t):s>this.siblings().length&&(this.path.length>1?(this.path.pop(),e=this.anchorOffset(),i=1):(this.isCollapsed()&&(e-=1),i-=1)),this.setSelection(e,i)},o.prototype.skip=function(t,e){e=e||{extend:!1}
var i=e.extend||!1
t=t<0?-1:1
var s=this.siblings(),n=this.focusOffset(),o=n+(t>0?1:0)
o=Math.max(0,Math.min(o,s.length-1))
var r=s[o].type
if(0===o&&t<0||o===s.length-1&&t>0)return void this.move(t,e)
if("mopen"===r&&t>0||"mclose"===r&&t<0){var h="mopen"===r?1:-1
for(o+=t>0?1:-1;o>=0&&o<s.length&&0!==h;)"mopen"===s[o].type?h+=1:"mclose"===s[o].type&&(h-=1),o+=t
0!==h&&(o=n+t),t>0&&(o-=1)}else{for(;o>=0&&o<s.length&&s[o].type===r;)o+=t
o-=t>0?1:0}i?this.extend(o-n):this.setSelection(o)},o.prototype.jump=function(t,e){e=e||{extend:!1}
var i=e.extend||!1
t=t<0?-1:1
var s=this.siblings(),n=this.focusOffset()
t>0&&(n=Math.min(n+1,s.length-1))
var o=t<0?0:s.length-1
i?this.extend(o-n):this.move(o-n)},o.prototype.jumpToMathFieldBoundary=function(t,e){e=e||{extend:!1}
var i=e.extend||!1
t=t||1,t=t<0?-1:1
var s=[this.path[0]],n=void 0
i?t<0?s[0].offset>0&&(s[0].offset++,n=1-s[0].offset):s[0].offset<this.siblings().length-1&&(s[0].offset++,n=this.siblings().length-s[0].offset):(s[0].offset=t<0?0:this.root.children.length-1,n=0),this.setPath(s,n)},o.prototype.leap=function(t){t=t||1,t=t<0?-1:1
var e=this.filter(function(t,e){return"placeholder"===e.type||1===this.siblings().length},t)
return 0===e.length?(this.config.onTabOutOf&&this.config.onTabOutOf(this,t),!1):(this.move(t),"placeholder"===this.anchor().type&&this.move(t),this.setPath(e[0]),"placeholder"===this.anchor().type&&this.setExtent(1),!0)},o.prototype.parseMode=function(){var t=this.anchor()
return!t||"commandliteral"!==t.type&&"esc"!==t.type&&"command"!==t.type?"math":"command"},o.prototype.insert=function(n,o){o=o||{},o.insertionMode||(o.insertionMode="replaceSelection"),o.selectionMode||(o.selectionMode="placeholder"),o.format||(o.format="auto")
var r=this.parseMode(),h=void 0,a=[this.extractContents()]
if("replaceSelection"===o.insertionMode?this.delete_():"replaceAll"===o.insertionMode?(this.root.children.splice(1),this.path=[{relation:"children",offset:0}]):"insertBefore"===o.insertionMode?this.collapseBackward():"insertAfter"===o.insertionMode&&this.collapseForward(),"auto"===o.format)if("command"===r){h=[]
var p=!0,l=!1,f=void 0
try{for(var c,u=n[Symbol.iterator]();!(p=(c=u.next()).done);p=!0){var d=c.value,g=t.matchSymbol("command",d)
g&&h.push(new e.MathAtom("command","command",g.value,"main"))}}catch(t){l=!0,f=t}finally{try{!p&&u.return&&u.return()}finally{if(l)throw f}}}else"'"===n?h=[new e.MathAtom("command","command","\\","main")]:("\\frac{#0}{#?}"!==n||a[0]&&0!==a[0].length||(a[0]=this.extractContentsOrdInGroupBeforeInsertionPoint(),this.delete(-a[0].length-1)),h=s.parseTokens(i.tokenize(n),r,a))
else"latex"===o.format&&(h=s.parseTokens(i.tokenize(n),r,a))
if(Array.prototype.splice.apply(this.siblings(),[this.anchorOffset()+1,0].concat(h)),this.insertFirstAtom(),"placeholder"===o.selectionMode){var y=[],m=!0,v=!1,S=void 0
try{for(var x,b=h[Symbol.iterator]();!(m=(x=b.next()).done);m=!0){y=y.concat(x.value.filter(function(t){return"placeholder"===t.type}))}}catch(t){v=!0,S=t}finally{try{!m&&b.return&&b.return()}finally{if(v)throw S}}0!==y.length&&this.leap()||this.setSelection(this.anchorOffset()+h.length)}else"before"===o.selectionMode||("after"===o.selectionMode?this.setSelection(this.anchorOffset()+h.length):"item"===o.selectionMode&&this.setSelection(this.anchorOffset()+1,h.length))},o.prototype.positionInsertionPointAfterCommitedCommand=function(){for(var t=this.siblings(),e=this.commandOffsets(),i=e.start;i<e.end&&!t[i].suggestion;)i++
this.setSelection(i-1)},o.prototype.removeSuggestion=function(){for(var t=this.siblings(),e=t.length-1;e>=0;e--)t[e].suggestion&&t.splice(e,1)},o.prototype.insertSuggestion=function(t,i){this.removeSuggestion()
var s=[],n=t.substr(i),o=!0,r=!1,h=void 0
try{for(var a,p=n[Symbol.iterator]();!(o=(a=p.next()).done);o=!0){var l=a.value,f=new e.MathAtom("command","command",l,"main")
f.suggestion=!0,s.push(f)}}catch(t){r=!0,h=t}finally{try{!o&&p.return&&p.return()}finally{if(r)throw h}}Array.prototype.splice.apply(this.siblings(),[this.anchorOffset()+1,0].concat(s))},o.prototype.delete=function(t){if(0===(t=t||0))this.delete_(0)
else if(t>0)for(;t>1;)this.delete_(1),t--
else for(;t<-1;)this.delete_(-1),t++},o.prototype.delete_=function(t){t=t||0,t=t<0?-1:t>0?1:t,this.removeSuggestion()
var e=this.siblings()
if(this.isCollapsed()){var i=this.anchorOffset()
if(t<0)if(0!==i)e.splice(i,1),this.setSelection(i-1)
else{var s=this.relation()
if("superscript"===s||"subscript"===s)this.parent()[s]=null,this.path.pop()
else if("denom"===s){var n=this.parent().numer
n.shift(),this.path.pop(),Array.prototype.splice.apply(this.siblings(),[this.anchorOffset(),1].concat(n)),this.setSelection(this.anchorOffset()+n.length-1)}else if("body"===s){var o=this.siblings()
o.shift(),this.path.pop(),Array.prototype.splice.apply(this.siblings(),[this.anchorOffset(),1].concat(o)),this.setSelection(this.anchorOffset()+o.length-1)}}else if(t>0)if(i!==e.length-1)e.splice(i+1,1)
else{var r=this.relation()
if("superscript"===r||"subscript"===r)this.parent()[r]=null,this.path.pop()
else if("numer"===r){var h=this.parent().denom
h.shift(),this.path.pop(),Array.prototype.splice.apply(this.siblings(),[this.anchorOffset(),1].concat(h)),this.setSelection(this.anchorOffset()+h.length-1)}}}else{var a=this.startOffset()
e.splice(a,this.endOffset()-a),this.setSelection(a-1)}},o.prototype.moveToNextPlaceholder_=function(){this.leap(1)},o.prototype.moveToPreviousPlaceholder_=function(){this.leap(-1)},o.prototype.moveToNextChar_=function(){this.move(1)},o.prototype.moveToPreviousChar_=function(){this.move(-1)},o.prototype.moveUp_=function(){this.up()},o.prototype.moveDown_=function(){this.down()},o.prototype.moveToNextWord_=function(){this.skip(1)},o.prototype.moveToPreviousWord_=function(){this.skip(-1)},o.prototype.moveToGroupStart_=function(){this.setSelection(0)},o.prototype.moveToGroupEnd_=function(){this.setSelection(-1)},o.prototype.moveToMathFieldStart_=function(){this.jumpToMathFieldBoundary(-1)},o.prototype.moveToMathFieldEnd_=function(){this.jumpToMathFieldBoundary(1)},o.prototype.deleteNextChar_=function(){this.delete_(1)},o.prototype.deletePreviousChar_=function(){this.delete_(-1)},o.prototype.deleteNextWord_=function(){this.extendToNextBoundary(),this.delete_()},o.prototype.deletePreviousWord_=function(){this.extendToPreviousBoundary(),this.delete_()},o.prototype.deleteToGroupStart_=function(){this.extendToGroupStart(),this.delete_()},o.prototype.deleteToGroupEnd_=function(){this.extendToMathFieldStart(),this.delete_()},o.prototype.deleteToMathFieldEnd_=function(){this.extendToMathFieldEnd(),this.delete_()},o.prototype.transpose_=function(){},o.prototype.extendToNextChar_=function(){this.extend(1)},o.prototype.extendToPreviousChar_=function(){this.extend(-1)},o.prototype.extendToNextWord_=function(){this.skip(1,{extend:!0})},o.prototype.extendToPreviousWord_=function(){this.skip(-1,{extend:!0})},o.prototype.extendUp_=function(){this.up({extend:!0})},o.prototype.extendDown_=function(){this.down({extend:!0})},o.prototype.extendToNextBoundary_=function(){this.skip(1,{extend:!0})},o.prototype.extendToPreviousBoundary_=function(){this.skip(-1,{extend:!0})},o.prototype.extendToGroupStart_=function(){this.setExtent(-this.anchorOffset())},o.prototype.extendToGroupEnd_=function(){this.setExtent(this.siblings().length-this.anchorOffset())},o.prototype.extendToMathFieldStart_=function(){this.jumpToMathFieldBoundary(-1,{extend:!0})},o.prototype.extendToMathFieldEnd_=function(){this.jumpToMathFieldBoundary(1,{extend:!0})},o.prototype.moveToSuperscript_=function(){if(this.collapseForward(),!this.anchor().superscript)if(this.anchor().subscript)this.anchor().superscript=[new e.MathAtom(this.parent().parseMode,"first",null)]
else{var t=this.sibling(1)
t&&t.superscript?this.path[this.path.length-1].offset+=1:t&&t.subscript?(this.path[this.path.length-1].offset+=1,this.anchor().superscript=[new e.MathAtom(this.parent().parseMode,"first",null)]):(this.siblings().splice(this.anchorOffset()+1,0,new e.MathAtom(this.parent().parseMode,"mord","​")),this.path[this.path.length-1].offset+=1,this.anchor().superscript=[new e.MathAtom(this.parent().parseMode,"first",null)])}this.path.push({relation:"superscript",offset:0}),this.selectGroup_()},o.prototype.moveToSubscript_=function(){if(this.collapseForward(),!this.anchor().subscript)if(this.anchor().superscript)this.anchor().subscript=[new e.MathAtom(this.parent().parseMode,"first",null)]
else{var t=this.sibling(1)
t&&t.subscript?this.path[this.path.length-1].offset+=1:t&&t.superscript?(this.path[this.path.length-1].offset+=1,this.anchor().subscript=[new e.MathAtom(this.parent().parseMode,"first",null)]):(this.siblings().splice(this.anchorOffset()+1,0,new e.MathAtom(this.parent().parseMode,"mord","​")),this.path[this.path.length-1].offset+=1,this.anchor().subscript=[new e.MathAtom(this.parent().parseMode,"first",null)])}this.path.push({relation:"subscript",offset:0}),this.selectGroup_()},o.prototype.moveToOpposite_=function(){var t={children:"superscript",superscript:"subscript",subscript:"superscript",denom:"numer",numer:"denom",body:"index"},i=t[this.relation()]
return!!i&&("superscript"===i||"subscript"===i?this.parent()[i]?(this.path.pop(),this.path.push({relation:i,offset:1}),this.setSelection(1,"end")):this.parent()[t[i]]?this.parent()[i]=[new e.MathAtom(this.parent().parseMode,"first",null)]:this.moveToSuperscript_():(this.parent()[i]||(this.parent()[i]=[new e.MathAtom(this.parent().parseMode,"first",null)]),this.setSelection(1,"end",i)),!0)},o.prototype.moveBeforeParent_=function(){this.path.length>1&&(this.path.pop(),this.setSelection(this.anchorOffset()-1))},o.prototype.moveAfterParent_=function(){this.path.length>1&&(this.path.pop(),this.setExtent(0))},o.prototype.addRowAfter_=function(){},o.prototype.addRowBefore_=function(){},o.prototype.addColumnAfter_=function(){},o.prototype.addColumnBefore_=function(){}
function h(){return{markup:!0}}return o.prototype.speakSelection_=function(){var t="Nothing selected."
this.isCollapsed()||(t=e.toSpeakableText(this.extractContents(),h()))
var i=new SpeechSynthesisUtterance(t)
window.speechSynthesis.speak(i)},o.prototype.speakParent_=function(){var t="No parent.",i=this.parent()
i&&"root"!==i.type&&(t=e.toSpeakableText(this.parent(),h()))
var s=new SpeechSynthesisUtterance(t)
window.speechSynthesis.speak(s)},o.prototype.speakRightSibling_=function(){var t="At the end.",i=this.siblings(),s=this.startOffset()+1
if(s<i.length-1){for(var n=[],o=s;o<=i.length-1;o++)n.push(i[o])
t=e.toSpeakableText(n,h())}var r=new SpeechSynthesisUtterance(t)
window.speechSynthesis.speak(r)},o.prototype.speakLeftSibling_=function(){var t="At the beginning.",i=this.siblings(),s=this.isCollapsed()?this.startOffset():this.startOffset()-1
if(s>=1){for(var n=[],o=1;o<=s;o++)n.push(i[o])
t=e.toSpeakableText(n,h())}var r=new SpeechSynthesisUtterance(t)
window.speechSynthesis.speak(r)},o.prototype.speakGroup_=function(){var t=new SpeechSynthesisUtterance(e.toSpeakableText(this.siblings(),h()))
window.speechSynthesis.speak(t)},o.prototype.speakAll_=function(){var t=new SpeechSynthesisUtterance(e.toSpeakableText(this.root,h()))
window.speechSynthesis.speak(t)},{EditableMathlist:o}})
