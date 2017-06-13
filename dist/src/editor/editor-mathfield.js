"use strict"
function _toConsumableArray(t){if(Array.isArray(t)){for(var e=0,i=Array(t.length);e<t.length;e++)i[e]=t[e]
return i}return Array.from(t)}define(["mathlive/core/definitions","mathlive/core/mathAtom","mathlive/core/lexer","mathlive/core/parser","mathlive/core/span","mathlive/editor/editor-editableMathlist","mathlive/editor/editor-mathpath","mathlive/editor/editor-keyboard","mathlive/editor/editor-undo","mathlive/editor/editor-shortcuts","mathlive/editor/editor-commands","mathlive/addons/outputLatex","mathlive/addons/outputSpokenText"],function(t,e,i,o,s,n,r,a,h,l,d){var p={},u=0
function c(t,e,i,o){e=e.split(" ")
var s=!0,n=!1,r=void 0
try{for(var a,h=e[Symbol.iterator]();!(s=(a=h.next()).done);s=!0){t.addEventListener(a.value,i,o)}}catch(t){n=!0,r=t}finally{try{!s&&h.return&&h.return()}finally{if(n)throw r}}}function m(t,e,i,o){e=e.split(" ")
var s=!0,n=!1,r=void 0
try{for(var a,h=e[Symbol.iterator]();!(s=(a=h.next()).done);s=!0){t.removeEventListener(a.value,i,o)}}catch(t){n=!0,r=t}finally{try{!s&&h.return&&h.return()}finally{if(n)throw r}}}function v(t,e){if(this&&this instanceof v){this.config(e||{}),this.id=u++,p[this.id]=this,this.element=t
var i=this.element.innerText.trim(),o=""
o+=e.substituteTextArea?"string"==typeof e.substituteTextArea?e.substituteTextArea:"<span></span>":'<span class="ML__textarea" aria-hidden="true" role="none presentation"><textarea autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" aria-hidden="true" role="none presentation"></textarea></span>',o+='<span class="ML__fieldcontainer"><span ></span><span class="ML__commandbartoggle"role="button" tabindex="0" aria-label="Toggle Command Bar"></span></span><div class="ML__popover"></div><div class="ML__keystrokecaption"></div><div class="ML__commandbar"><div class="ML__commandbuttons" role="toolbar" aria-label="Commmand Bar></div><div class="ML__commandpanel"></div></div>',this.element.innerHTML=o,this.textarea="function"==typeof e.substituteTextArea?e.substituteTextArea():this.element.children[0].firstElementChild,this.field=this.element.children[1].children[0],this.commandbarToggle=this.element.children[1].children[1],this._attachButtonHandlers(this.commandbarToggle,"toggleCommandBar"),this.popover=this.element.children[2],this.keystrokeCaption=this.element.children[3],this.commandBar=this.element.children[4],this.commandButtons=this.commandBar.children[0],this.commandPanel=this.commandBar.children[1],this.keystrokeCaptionVisible=!1,this.commandBarVisible=!1,this.suggestionIndex=0,this.blurred=!0,c(window,"focus",this._onFocus.bind(this)),c(window,"blur",this._onBlur.bind(this)),c(this.textarea,"cut",this._onCut.bind(this)),c(this.textarea,"copy",this._onCopy.bind(this)),c(this.textarea,"paste",this._onPaste.bind(this)),a.delegateKeyboardEvents(this.textarea,{container:this.element,typedText:this._onTypedText.bind(this),paste:this._onPaste.bind(this),keystroke:this._onKeystroke.bind(this),focus:this._onFocus.bind(this),blur:this._onBlur.bind(this)}),c(this.element,"touchstart mousedown",this._onPointerDown.bind(this),{passive:!1,capture:!1}),c(window,"resize",this._onResize.bind(this))
var s=Object.assign({},e)
s.onSelectionDidChange=v.prototype._onSelectionDidChange.bind(this),this.mathlist=new n.EditableMathlist(s),this.undoManager=new h.UndoManager(this.mathlist),i.length>0&&this.latex(i)}else{if(!t||!t.nodeType)return null
var r=t.getAttribute("mathlive-block-id")
if(r)return p[r]}}function f(t){if(t.classList.contains("ML__caret"))return t
var e=void 0
return Array.from(t.children).forEach(function(t){e=e||f(t)}),e}v.prototype._getCaretPosition=function(){var t=f(this.field)
if(t){var e=t.getBoundingClientRect()
return{x:e.right+window.scrollX,y:e.bottom+window.scrollY}}return null}
function _(t,e,i){var o={element:null},s=!0,n=t.getBoundingClientRect()
if(t.getAttribute("data-atom-id")){o.element=t
var r=Math.max(n.left-e,0,e-n.right),a=Math.max(n.top-i,0,i-n.bottom)
o.distance=r*r+a*a,s=e>=n.left&&e<=n.right}else o.distance=Number.POSITIVE_INFINITY
return s&&t.children&&Array.from(t.children).forEach(function(t){var s=_(t,e,i)
s.element&&s.distance<=o.distance&&(o=s)}),o}v.prototype._pathFromPoint=function(t,e){var i=void 0,o=_(this.element,t,e),s=o.element,n=s?s.getAttribute("data-atom-id"):null
if(n){var a=this.mathlist.filter(function(t,e){return e.id===n})
if(a&&a.length>0){var h=s.getBoundingClientRect()
i=r.pathFromString(a[0]).path,t<h.left+h.width/2&&(i[i.length-1].offset-=1)}}return i},v.prototype._onPointerDown=function(t){var e=this,i=!1
m(this.field,"touchmove",s),m(this.field,"touchend touchleave",o),m(window,"mousemove",s),m(window,"mouseup blur",o)
function o(t){m(e.field,"touchmove",s),m(e.field,"touchend touchleave",o),m(window,"mousemove",s),m(window,"mouseup blur",o),i=!1,t.preventDefault(),t.stopPropagation()}function s(t){var i=t.touches?t.touches[0].clientX:t.clientX,o=t.touches?t.touches[0].clientY:t.clientY,s=e._pathFromPoint(i,o)
l&&s&&(e.mathlist.setRange(l,s),setTimeout(e._render.bind(e),0)),t.preventDefault(),t.stopPropagation()}var n=!1
if(this.hasFocus()||(n=!0,this.textarea.focus()),!t.buttons||1===t.buttons){var a=t.touches?t.touches[0].clientX:t.clientX,h=t.touches?t.touches[0].clientY:t.clientY,l=this._pathFromPoint(a,h)
l&&(t.shiftKey?(this.mathlist.setRange(this.mathlist.path,l),l=r.clone(this.mathlist.path),l[l.length-1].offset-=1):this.mathlist.setPath(l,0),n=!0,2===t.detail||3===t.detail?(m(this.field,"touchmove",s),m(this.field,"touchend",o),m(window,"mousemove",s),m(window,"mouseup blur",o),i=!1,3===t.detail?this.mathlist.selectAll_():2===t.detail&&this.mathlist.selectGroup_()):i||(i=!0,c(window,"blur",o),t.touches?(c(t.target,"touchend",o),c(t.target,"touchmove",s)):(c(window,"mouseup",o),c(window,"mousemove",s)))),n&&this._render(),t.preventDefault()}},v.prototype._onSelectionDidChange=function(){this.mathlist.commitCommandStringBeforeInsertionPoint()
var t=this.mathlist.extractContents()
if(t&&!this.mathlist.isCollapsed()){var i="",o=!0,s=!1,n=void 0
try{for(var r,a=t[Symbol.iterator]();!(o=(r=a.next()).done);o=!0){i+=r.value.toLatex()}}catch(t){s=!0,n=t}finally{try{!o&&a.return&&a.return()}finally{if(s)throw n}}this.textarea.value=i,this.textarea.setAttribute("aria-label",e.toSpeakableText(t)),this.hasFocus()&&this.textarea.select()}else this.textarea.value="",this.textarea.setAttribute("aria-label","")
this._updateCommandBar(),this._updatePopoverPosition({deferred:!0}),this.config.onSelectionDidChange&&this.config.onSelectionDidChange(this)},v.prototype._onFocus=function(){this.blurred&&(this.blurred=!1,this.textarea.select(),this._updatePopoverPosition(),this._updateCommandBar(),this._render(),this.config.onFocus&&this.config.onFocus(this))},v.prototype._onBlur=function(){this.blurred||(this.blurred=!0,this._updatePopoverPosition(),this._updateCommandBar(),this._render(),this.config.onBlur&&this.config.onBlur(this))},v.prototype._onResize=function(){this._updatePopoverPosition()},v.prototype._showKeystroke=function(t){var e=this.keystrokeCaption
if(e&&this.keystrokeCaptionVisible){var i=this.element.getBoundingClientRect()
e.style.left=i.left+"px",e.style.top=i.top-56+"px",e.innerHTML+="<span>"+(l.stringify(t)||t)+"</span>",e.style.visibility="visible",setTimeout(function(){e.childNodes.length>0&&e.removeChild(e.childNodes[0]),0===e.childNodes.length&&(e.style.visibility="hidden")},3e3)}},v.prototype.perform=function(t){var e=!1,i=void 0,o=[]
if(Array.isArray(t)?(i=t[0]+"_",o=t.slice(1)):i=t+"_","function"==typeof this.mathlist[i]){var s;["delete_","transpose_","deleteToMathFieldEnd_","deleteToGroupEnd_","deleteToGroupStart_","deletePreviousWord_","deleteNextWord_","deletePreviousChar_","deleteNextChar_"].includes(i)&&this.undoManager.snapshot(),(s=this.mathlist)[i].apply(s,_toConsumableArray(o)),e=!0}else"function"==typeof this[i]&&(["complete_"].includes(i)&&this.undoManager.snapshot(),this[i].apply(this,_toConsumableArray(o)),e=!0)
return e&&(this._render(),this.scrollIntoView_()),e},v.prototype._onKeystroke=function(t,e){var i=l.matchKeystroke(this.mathlist.parseMode(),t)
return!i||(this.mathlist.decorateCommandStringAroundInsertionPoint(!1),this._showKeystroke(t),this.perform(i)||(this.mathlist.insert(i),this._render(),this.scrollIntoView_()),e.preventDefault(),e.stopPropagation(),!1)},v.prototype._onTypedText=function(e){this.mathlist.decorateCommandStringAroundInsertionPoint(!1)
var i=void 0,o=void 0
if(this.pasteInProgress)this.pasteInProgress=!1,this.mathlist.insert(e)
else{var s=!0,n=!1,r=void 0
try{for(var a,h=e[Symbol.iterator]();!(s=(a=h.next()).done);s=!0){var d=a.value
this._showKeystroke(d)
var p=void 0
if("math"===this.mathlist.parseMode()){var u=this.mathlist.extractGroupStringBeforeInsertionPoint()
p=l.matchEndOf(u+d,this.config)}if("command"===this.mathlist.parseMode()){this.mathlist.removeSuggestion(),this.suggestionIndex=0
var c=this.mathlist.extractCommandStringAroundInsertionPoint(),m=t.suggest(c+d)
o=m.length>1,0===m.length?(this.mathlist.insert(d),/^\\[a-zA-Z\\*]+$/.test(c+d)&&this.mathlist.decorateCommandStringAroundInsertionPoint(!0),this._hidePopover()):(this.mathlist.insert(d),m[0].match!==c+d&&this.mathlist.insertSuggestion(m[0].match,-m[0].match.length+c.length+1),i=m[0].match)}else p?(this.mathlist.insert(d),this.undoManager.snapshot(),this.mathlist.delete(-p.match.length-1),this.mathlist.insert(p.substitute)):(this.undoManager.snapshot(),this.mathlist.insert(d))}}catch(t){n=!0,r=t}finally{try{!s&&h.return&&h.return()}finally{if(n)throw r}}}this._render(),this._showPopoverWithLatex(i,o)},v.prototype._render=function(){var t=this
this.mathlist.root.forEach(function(e){e.hasCaret=!1,e.isSelected=t.mathlist.contains(e)})
var i=this.hasFocus()
i&&this.mathlist.isCollapsed()&&(this.mathlist.anchor().hasCaret=!0)
var o=e.decompose({mathstyle:"displaystyle",generateID:"true"},this.mathlist.root.children),n=s.makeSpan(o,"ML__base")
n.attributes={"aria-hidden":"true",role:"none presentation"}
var r=s.makeSpan("","ML__strut")
r.setStyle("height",n.height,"em")
var a=s.makeSpan("","ML__strut ML__bottom")
a.setStyle("height",n.height+n.depth,"em"),a.setStyle("vertical-align",-n.depth,"em")
var h=s.makeSpan([r,a,n],"ML__mathlive")
h.classes+=i?" ML__focused":" ML__blured",h.attributes={tabindex:"0",role:"math","aria-label":e.toSpeakableText(this.mathlist.root)},this.field.innerHTML=h.toMarkup(),this.scrollIntoView_()},v.prototype._onPaste=function(){return this.pasteInProgress=!0,!0},v.prototype._onCut=function(){return setTimeout(function(){this.clearSelection(),this._render()}.bind(this),0),!0},v.prototype._onCopy=function(){return!0},v.prototype.text=function(t){t=t||"latex"
var i=""
return"latex"===t?i=this.mathlist.root.toLatex():"spoken"===t&&(i=e.toSpeakableText(this.mathlist.root,{markup:!0})),i},v.prototype.latex=function(t){return t&&(this.undoManager.snapshot(),this.mathlist.insert(t,{insertionMode:"replaceAll",format:"latex"}),this._render()),this.mathlist.root.toLatex()},v.prototype.el=function(){return this.element},v.prototype.undo_=v.prototype.undo=function(){this.undoManager.undo()},v.prototype.redo_=v.prototype.redo=function(){this.undoManager.redo()},v.prototype.scrollIntoView_=v.prototype.scrollIntoView=function(){},v.prototype.scrollToStart_=v.prototype.scrollToStart=function(){},v.prototype.scrollToEnd_=v.prototype.scrollToEnd=function(){},v.prototype.enterCommandMode_=function(){this.mathlist.decorateCommandStringAroundInsertionPoint(!1),this.mathlist.removeSuggestion(),this._hidePopover(),this.suggestionIndex=0,this.undoManager.snapshot(),this.mathlist.insert("'")},v.prototype.copyToClipboard_=function(){document.execCommand("copy")},v.prototype.cutToClipboard_=function(){document.execCommand("cut")},v.prototype.pasteFromClipboard_=function(){document.execCommand("paste")},v.prototype.write=v.prototype.insert_=v.prototype.insert=function(t,e){"string"==typeof t&&t.length>0&&(e||(e={}),e.format||(e.format="auto"),this.mathlist.insert(t,e))},v.prototype.complete_=function(){this._hidePopover()
var e=this.mathlist.extractCommandStringAroundInsertionPoint()
if(e){var s=t.matchFunction("math",e)
if(s||(s=t.matchSymbol("math",e)),s){this.mathlist.spliceCommandStringAroundInsertionPoint(o.parseTokens(i.tokenize(s.latexName),"math",null))}else{var n=o.parseTokens(i.tokenize(e),"math",null)
n?this.mathlist.spliceCommandStringAroundInsertionPoint(n):this.mathlist.decorateCommandStringAroundInsertionPoint(!0)}}}
function g(t){var n=o.parseTokens(i.tokenize(t),"math",null),r=e.decompose({mathstyle:"displaystyle"},n),a=s.makeSpan(r,"ML__base"),h=s.makeSpan("","ML__strut")
h.setStyle("height",a.height,"em")
var l=s.makeSpan("","ML__strut ML__bottom")
return l.setStyle("height",a.height+a.depth,"em"),l.setStyle("vertical-align",-a.depth,"em"),s.makeSpan([h,l,a],"ML__mathlive").toMarkup()}return v.prototype._showPopoverWithLatex=function(e,i){if(!e||0===e.length)return void this._hidePopover()
var o=e,s=g(t.SAMPLES[o]||e),n=t.getNote(o),r=l.stringify(l.getShortcutsForCommand(o))||"",a=i?'<div class="ML__popover_prev-shortcut" role="button" aria-label="Previous suggestion"><span><span>&#x25B2;</span></span></div>':""
a+='<span class="ML__popover_content">',a+='<div class="ML__popover_command" role="button" >'+s+"</div>",n&&(a+='<div class="ML__popover_note">'+n+"</div>"),r&&(a+='<div class="ML__popover_shortcut">'+r+"</div>"),a+="</span>",a+=i?'<div class="ML__popover_next-shortcut" role="button" aria-label="Next suggestion"><span><span>&#x25BC;</span></span></div>':"",this._showPopover(a)
var h=this.popover.getElementsByClassName("ML__popover_content")
h&&h.length>0&&this._attachButtonHandlers(h[0],"complete"),h=this.popover.getElementsByClassName("ML__popover_prev-shortcut"),h&&h.length>0&&this._attachButtonHandlers(h[0],"previousSuggestion"),(h=this.popover.getElementsByClassName("ML__popover_next-shortcut"))&&h.length>0&&this._attachButtonHandlers(h[0],"nextSuggestion")},v.prototype._updatePopoverPosition=function(t){if(this.popover.classList.contains("ML__popover_visible"))if(t&&t.deferred)setTimeout(this._updatePopoverPosition.bind(this),0)
else if(this.blurred||!this.mathlist.anchor()||"command"!==this.mathlist.anchor().type)this._hidePopover()
else{var e=this._getCaretPosition()
e&&(this.popover.style.left=e.x-this.popover.offsetWidth/2+"px",this.popover.style.top=e.y+5+"px")}},v.prototype._showPopover=function(t){"visible"===this.commandBar.style.visibility&&(this.commandBar.style.visibility="hidden"),this.popover.innerHTML=t
var e=this._getCaretPosition()
e&&(this.popover.style.left=e.x-this.popover.offsetWidth/2+"px",this.popover.style.top=e.y+5+"px"),this.popover.classList.add("ML__popover_visible")},v.prototype._hidePopover=function(){this.popover.classList.remove("ML__popover_visible"),this.commandBarVisible&&(this.commandBar.style.visibility="visible")},v.prototype._updateSuggestion=function(){this.mathlist.positionInsertionPointAfterCommitedCommand(),this.mathlist.removeSuggestion()
var e=this.mathlist.extractCommandStringAroundInsertionPoint(),i=t.suggest(e)
if(0===i.length)this._hidePopover(),this.mathlist.decorateCommandStringAroundInsertionPoint(!0)
else{var o=this.suggestionIndex%i.length,s=e.length-i[o].match.length
0!==s&&this.mathlist.insertSuggestion(i[o].match,s),this._showPopoverWithLatex(i[o].match,i.length>1)}this._render()},v.prototype.nextSuggestion_=function(){this.suggestionIndex+=1,this._updateSuggestion()},v.prototype.previousSuggestion_=function(){if((this.suggestionIndex-=1)<0){this.mathlist.removeSuggestion()
var e=this.mathlist.extractCommandStringAroundInsertionPoint()
this.suggestionIndex=t.suggest(e).length-1}this._updateSuggestion()},v.prototype.toggleKeystrokeCaption_=function(){this.keystrokeCaptionVisible=!this.keystrokeCaptionVisible
var t=this.keystrokeCaption
t.innerHTML="",t.style.visibility=this.keystrokeCaptionVisible?"visible":"hidden"},v.prototype._attachButtonHandlers=function(t,e){var i=this
t.dataset.command=JSON.stringify(e),c(t,"mousedown touchstart",function(t){"mousedown"===t.type&&1!==t.buttons||(t.target.classList.add("pressed"),t.stopPropagation(),t.preventDefault())},{passive:!1,capture:!1}),c(t,"mouseleave touchcancel",function(t){t.target.classList.remove("pressed")}),c(t,"mouseenter",function(t){1===t.buttons&&t.target.classList.add("pressed")}),c(t,"mouseup touchend",function(e){t.classList.remove("pressed"),t.classList.add("active"),setTimeout(function(){t.classList.remove("active")},150),i.perform(JSON.parse(t.dataset.command)),e.stopPropagation(),e.preventDefault()})},v.prototype._makeButton=function(t,e,i,o){var s=document.createElement("span")
return s.innerHTML=t,e&&s.classList.add([].slice.call(e.split(" "))),i&&s.setAttribute("aria-label",i),this._attachButtonHandlers(s,o),s},v.prototype._updateCommandBar=function(){if(!this.blurred&&this.commandBarVisible){this.textarea.select(),this.commandBar.style.visibility="visible",this.commandButtons.textContent=""
var t=d.suggest(this.mathlist.parseMode(),"","",this.mathlist.parent(),this.mathlist.extractGroupBeforeSelection(),this.mathlist.extractContents(),this.mathlist.extractGroupAfterSelection()),e=!0,i=!1,o=void 0
try{for(var s,n=t[Symbol.iterator]();!(e=(s=n.next()).done);e=!0){var r=s.value
this.commandButtons.appendChild(this._makeButton(r.label,r.cls,r.ariaLabel,r.selector))}}catch(t){i=!0,o=t}finally{try{!e&&n.return&&n.return()}finally{if(i)throw o}}}else this.commandBar.style.visibility="hidden"},v.prototype.toggleCommandBar_=function(){this.commandBarVisible=!this.commandBarVisible,this.commandBarVisible&&this.focus(),this._updateCommandBar()},v.prototype.hasFocus=function(){return document.hasFocus()&&document.activeElement===this.textarea},v.prototype.focus=function(){this.hasFocus()||(this.textarea.select(),this._render())},v.prototype.blur=function(){this.hasFocus()&&(this.textarea.blur(),this._render())},v.prototype.select=function(){this.mathlist.selectAll_()},v.prototype.clearSelection=function(){this.mathlist.delete_()},v.prototype.keystroke=function(t){this._onKeystroke(t)},v.prototype.typedText=function(t){this._onTypedText(t)},v.prototype.config=function(t){var e={spacesBehavesLikeTab:!1}
for(var i in t)t.hasOwnProperty(i)&&(e[i]=t[i])
this.config=e},{MathField:v}})
