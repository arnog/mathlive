"use strict"
define([],function(){var e={m0:"#3f3d99",m1:"#993d71",m2:"#998b3d",m3:"#3d9956",m4:"#3d5a99",m5:"#993d90",m6:"#996d3d",m7:"#43993d",m8:"#3d7999",m9:"#843d99"},a={apricot:"#FBB982",aquamarine:"#00B5BE",bittersweet:"#C04F17",black:"#221E1F",blue:"#2D2F92",bluegreen:"#00B3B8",blueviolet:"#473992",brickred:"#B6321C",brown:"#792500",burntorange:"#F7921D",cadetblue:"#74729A",carnationpink:"#F282B4",cerulean:"#00A2E3",cornflowerblue:"#41B0E4",cyan:"#00AEEF",dandelion:"#FDBC42",darkorchid:"#A4538A",emerald:"#00A99D",forestgreen:"#009B55",fuchsia:"#8C368C",goldenrod:"#FFDF42",gray:"#949698",green:"#00A64F",greenyellow:"#DFE674",junglegreen:"#00A99A",lavender:"#F49EC4",limegreen:"#8DC73E",magenta:"#EC008C",mahogany:"#A9341F",maroon:"#AF3235",melon:"#F89E7B",midnightblue:"#006795",mulberry:"#A93C93",navyblue:"#006EB8",olivegreen:"#3C8031",orange:"#F58137",orangered:"#ED135A",orchid:"#AF72B0",peach:"#F7965A",periwinkle:"#7977B8",pinegreen:"#008B72",plum:"#92268F",processblue:"#00B0F0",purple:"#99479B",rawsienna:"#974006",red:"#ED1B23",redorange:"#F26035",redviolet:"#A1246B",rhodamine:"#EF559F",royalblue:"#0071BC",royalpurple:"#613F99",rubinered:"#ED017D",salmon:"#F69289",seagreen:"#3FBC9D",sepia:"#671800",skyblue:"#46C5DD",springgreen:"#C6DC67",tan:"#DA9D76",tealblue:"#00AEB3",thistle:"#D883B7",turquoise:"#00B4CE",violet:"#58429B",violetred:"#EF58A0",white:"#FFFFFF",wildstrawberry:"#EE2967",yellow:"#FFF200",yellowgreen:"#98CC70",yelloworange:"#FAA21A"}
function r(r){var n=r.toLowerCase().split("!"),t=void 0,i=void 0,l=void 0,o=255,m=255,s=255,d=-1,h=n.length>0&&"-"===n[0].charAt(0)
h&&(n[0]=n[0].slice(1))
for(var F=0;F<n.length;F++){t=o,i=m,l=s
var u=n[F].match(/([a-z0-9]*)/)
u&&(u=u[1])
var g=a[u]||e[u]
g||(g=n[F])
var B=g.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
if(B&&B[1]&&B[2]&&B[3])o=Math.max(0,Math.min(255,parseInt(B[1],16))),m=Math.max(0,Math.min(255,parseInt(B[2],16))),s=Math.max(0,Math.min(255,parseInt(B[3],16)))
else if((B=g.match(/^#([0-9a-f]{3})$/i))&&B[1]){var c=parseInt(B[1][0],16),p=parseInt(B[1][1],16),A=parseInt(B[1][2],16)
o=Math.max(0,Math.min(255,16*c+c)),m=Math.max(0,Math.min(255,16*p+p)),s=Math.max(0,Math.min(255,16*A+A))}else{if(!((B=g.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i))&&B[1]&&B[2]&&B[3]))return null
o=Math.max(0,Math.min(255,parseInt(B[1]))),m=Math.max(0,Math.min(255,parseInt(B[2]))),s=Math.max(0,Math.min(255,parseInt(B[3])))}d>=0&&(o=(1-d)*o+d*t,m=(1-d)*m+d*i,s=(1-d)*s+d*l,d=-1),F+1<n.length&&(d=Math.max(0,Math.min(100,parseInt(n[++F])))/100)}return d>=0&&(o=d*o+(1-d)*t,m=d*m+(1-d)*i,s=d*s+(1-d)*l),h&&(o=255-o,m=255-m,s=255-s),"#"+("00"+Math.round(o).toString(16)).slice(-2)+("00"+Math.round(m).toString(16)).slice(-2)+("00"+Math.round(s).toString(16)).slice(-2)}return{stringToColor:r}})
