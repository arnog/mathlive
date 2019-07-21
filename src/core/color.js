

/**
 * This module contains some color dictionaries and algorithms to 
 * parse a string into a hex RGB color value.s
 * @summary   Parsing of color strings.
 * @module core/color
 * @private
 */


/*
{\color{apricot}\blacksquare}{\color{aquamarine}\blacksquare}{\color{bittersweet}\blacksquare}{\color{black}\blacksquare}{\color{blue}\blacksquare}{\color{blueGreen}\blacksquare}{\color{blueviolet}\blacksquare}{\color{brickred}\blacksquare}{\color{brown}\blacksquare}{\color{burntorange}\blacksquare}{\color{cadetblue}\blacksquare}{\color{carnationpink}\blacksquare}{\color{cerulean}\blacksquare}{\color{cornflowerblue}\blacksquare}{\color{cyan}\blacksquare}{\color{dandelion}\blacksquare}{\color{darkorchid}\blacksquare}{\color{emerald}\blacksquare}{\color{forestgreen}\blacksquare}{\color{fuchsia}\blacksquare}{\color{goldenrod}\blacksquare}{\color{gray}\blacksquare}{\color{green}\blacksquare}{\color{greenyellow}\blacksquare}{\color{junglegreen}\blacksquare}{\color{lavender}\blacksquare}{\color{limegreen}\blacksquare}{\color{magenta}\blacksquare}{\color{mahogany}\blacksquare}{\color{maroon}\blacksquare}{\color{melon}\blacksquare}{\color{midnightblue}\blacksquare}{\color{mulberry}\blacksquare}{\color{navyblue}\blacksquare}{\color{olivegreen}\blacksquare}{\color{orange}\blacksquare}{\color{orangered}\blacksquare}{\color{orchid}\blacksquare}{\color{peach}\blacksquare}{\color{periwinkle}\blacksquare}{\color{pinegreen}\blacksquare}{\color{plum}\blacksquare}{\color{processblue}\blacksquare}{\color{purple}\blacksquare}{\color{rawsienna}\blacksquare}{\color{red}\blacksquare}{\color{redorange}\blacksquare}{\color{redviolet}\blacksquare}{\color{rhodamine}\blacksquare}{\color{royalblue}\blacksquare}{\color{royalpurple}\blacksquare}{\color{rubinered}\blacksquare}{\color{salmon}\blacksquare}{\color{seagreen}\blacksquare}{\color{sepia}\blacksquare}{\color{skyblue}\blacksquare}{\color{springgreen}\blacksquare}{\color{tan}\blacksquare}{\color{tealblue}\blacksquare}{\color{thistle}\blacksquare}{\color{turquoise}\blacksquare}{\color{violet}\blacksquare}{\color{violetred}\blacksquare}{\color{white}\blacksquare}{\color{wildstrawberry}\blacksquare}{\color{yellow}\blacksquare}{\color{yellowgreen}\blacksquare}{\color{yelloworange}\blacksquare}
*/

/**
 * First 10 predefined colors used for plotting by Mathematica.
 * 
 * Also known as _indexed color scheme #97_.
 * @constant
 * @type {Object.<string, string>}
 * @memberof module:color
 * @private
 */
const MATHEMATICA_COLORS = {
    'm0': '#3f3d99',        // strong blue
    'm1': '#993d71',        // strong cerise
    'm2': '#998b3d',        // strong gold
    'm3': '#3d9956',        // malachite green
    'm4': '#3d5a99',        // strong cobalt blue
    'm5': '#993d90',        // strong orchid
    'm6': '#996d3d',        // strong orange
    'm7': '#43993d',        // strong sap green
    'm8': '#3d7999',        // cornflower blue
    'm9': '#843d99'         // mulberry
}
    // ColorData97 (Mathematica standard lines)
    // rgb(0.368417, 0.506779, 0.709798),       #5e81b5
    // rgb(0.880722, 0.611041, 0.142051),
    // rgb(0.560181, 0.691569, 0.194885),
    // rgb(0.922526, 0.385626, 0.209179),
    // rgb(0.528488, 0.470624, 0.701351),
    // rgb(0.772079, 0.431554, 0.102387),
    // rgb(0.363898, 0.618501, 0.782349),
    // rgb(1, 0.75, 0),
    // rgb(0.647624, 0.37816, 0.614037),
    // rgb(0.571589, 0.586483, 0.),
    // rgb(0.915, 0.3325, 0.2125),
    // rgb(0.40082222609352647, 0.5220066643438841, 0.85),
    // rgb(0.9728288904374106, 0.621644452187053, 0.07336199581899142),
    // rgb(0.736782672705901, 0.358, 0.5030266573755369),
    // rgb(0.28026441037696703, 0.715, 0.4292089322474965)

    // MathLab colors
    // '#0072bd' // [0, 0.4470, 0.7410]             blue
    // '#d95319' // [0.8500, 0.3250, 0.0980]        orange
    // '#edb120', // [0.9290, 0.6940, 0.1250]       yellow
    // '#7e2f8e', // [0.4940, 0.1840, 0.5560]       purple
    // '#77ac30', // [0.4660, 0.6740, 0.1880]       green
    // '#4dbeee', // [0.3010, 0.7450, 0.9330]       cyan
    // '#a2142f' // [0.6350, 0.0780, 0.1840]	    dark red


/* Area colors are most appropriate to color a large area */
const AREA_COLORS = [
    '#d35d60',      // red
    '#7293cb',      // cobalt blue
    '#e1974d',      // orange
    '#84bb5d',      // pistachio
    '#9066a7',      // purple
    '#aD6a58',      // vermilion
    '#f5a4ce',      // pale rose
    '#fff590',      // pale gold
    '#212121',      // Black
    '#818787',      // dark grey
    '#d4d5d2',      // light grey
    '#ffffff'       // white
]

/* Line colors are most appropriate to color as a stroke color */
const LINE_COLORS = [
    '#cc2428',      // red
    '#3769b1',      // cobalt blue
    '#da7e30',      // orange
    '#409852',      // malachite green
    '#6b4c9a',      // blue violet
    '#922426',      // red
    '#e7298a',      // brilliant rose
    '#ffe907',      // vivid gold
    '#000000',
    '#525055',
    '#adafaa',
    '#ffffff',
]

/** 
 * 68 colors (+ white) known to dvips used in LaTeX.
 * 
 * The color names are based on the names of the _Crayola Crayon_ box of 
 * 64 crayons.
 * 
 * See:
 * - {@link http://mirror.jmu.edu/pub/CTAN/systems/knuth/local/lib/colordvi.tex|ColorDVI.tex}
 * - {@link https://en.wikibooks.org/w/index.php?title=LaTeX/Colors|Wikibooks:LaTeX/Colors}
 * @constant NAMED_COLORS
 * @memberof module:color
 * @type {Object.<string, string>}
 * @private
 */
const NAMED_COLORS = {
    'apricot': '#FBB982',
    'aquamarine': '#00B5BE',
    'bittersweet': '#C04F17',
    'black': '#221E1F',         // Indeed.
    'blue': '#2D2F92',
    'bluegreen': '#00B3B8',
    'blueviolet': '#473992',
    'brickred': '#B6321C',
    'brown': '#792500',
    'burntorange': '#F7921D',
    'cadetblue': '#74729A',
    'carnationpink': '#F282B4',
    'cerulean': '#00A2E3',
    'cornflowerblue': '#41B0E4',
    'cyan': '#00AEEF',
    'dandelion': '#FDBC42',
    'darkorchid': '#A4538A',
    'emerald': '#00A99D',
    'forestgreen': '#009B55',
    'fuchsia': '#8C368C',
    'goldenrod': '#FFDF42',
    'gray': '#949698',
    'green': '#00A64F',
    'greenyellow': '#DFE674',
    'junglegreen': '#00A99A',
    'lavender': '#F49EC4',
    'limegreen': '#8DC73E',
    'magenta': '#EC008C',
    'mahogany': '#A9341F',
    'maroon': '#AF3235',
    'melon': '#F89E7B',
    'midnightblue': '#006795',
    'mulberry': '#A93C93',
    'navyblue': '#006EB8',
    'olivegreen': '#3C8031',
    'orange': '#F58137',
    'orangered': '#ED135A',
    'orchid': '#AF72B0',
    'peach': '#F7965A',
    'periwinkle': '#7977B8',
    'pinegreen': '#008B72',
    'plum': '#92268F',
    'processblue': '#00B0F0',
    'purple': '#99479B',
    'rawsienna': '#974006',
    'red': '#ED1B23',
    'redorange': '#F26035',
    'redviolet': '#A1246B',
    'rhodamine': '#EF559F',
    'royalblue': '#0071BC',
    'royalpurple': '#613F99',
    'rubinered': '#ED017D',
    'salmon': '#F69289',
    'seagreen': '#3FBC9D',
    'sepia': '#671800',
    'skyblue': '#46C5DD',
    'springgreen': '#C6DC67',
    'tan': '#DA9D76',
    'tealblue': '#00AEB3',
    'thistle': '#D883B7',
    'turquoise': '#00B4CE',
    'violet': '#58429B',
    'violetred': '#EF58A0',
    'white': '#FFFFFF',
    'wildstrawberry': '#EE2967',
    'yellow': '#FFF200',
    'yellowgreen': '#98CC70',
    'yelloworange': '#FAA21A',
};


// Other color lists: SVG colors, x11 colors
/*
aliceblue	rgb(240, 248, 255)
antiquewhite	rgb(250, 235, 215)
aqua	rgb( 0, 255, 255)
aquamarine	rgb(127, 255, 212)
azure	rgb(240, 255, 255)
beige	rgb(245, 245, 220)
bisque	rgb(255, 228, 196)
black	rgb( 0, 0, 0)
blanchedalmond	rgb(255, 235, 205)
blue	rgb( 0, 0, 255)
blueviolet	rgb(138, 43, 226)
brown	rgb(165, 42, 42)
burlywood	rgb(222, 184, 135)
cadetblue	rgb( 95, 158, 160)
chartreuse	rgb(127, 255, 0)
chocolate	rgb(210, 105, 30)
coral	rgb(255, 127, 80)
cornflowerblue	rgb(100, 149, 237)
cornsilk	rgb(255, 248, 220)
crimson	rgb(220, 20, 60)
cyan	rgb( 0, 255, 255)
darkblue	rgb( 0, 0, 139)
darkcyan	rgb( 0, 139, 139)
darkgoldenrod	rgb(184, 134, 11)
darkgray	rgb(169, 169, 169)
darkgreen	rgb( 0, 100, 0)
darkgrey	rgb(169, 169, 169)
darkkhaki	rgb(189, 183, 107)
darkmagenta	rgb(139, 0, 139)
darkolivegreen	rgb( 85, 107, 47)
darkorange	rgb(255, 140, 0)
darkorchid	rgb(153, 50, 204)
darkred	rgb(139, 0, 0)
darksalmon	rgb(233, 150, 122)
darkseagreen	rgb(143, 188, 143)
darkslateblue	rgb( 72, 61, 139)
darkslategray	rgb( 47, 79, 79)
darkslategrey	rgb( 47, 79, 79)
darkturquoise	rgb( 0, 206, 209)
darkviolet	rgb(148, 0, 211)
deeppink	rgb(255, 20, 147)
deepskyblue	rgb( 0, 191, 255)
dimgray	rgb(105, 105, 105)
dimgrey	rgb(105, 105, 105)
dodgerblue	rgb( 30, 144, 255)
firebrick	rgb(178, 34, 34)
floralwhite	rgb(255, 250, 240)
forestgreen	rgb( 34, 139, 34)
fuchsia	rgb(255, 0, 255)
gainsboro	rgb(220, 220, 220)
ghostwhite	rgb(248, 248, 255)
gold	rgb(255, 215, 0)
goldenrod	rgb(218, 165, 32)
gray	rgb(128, 128, 128)
grey	rgb(128, 128, 128)
green	rgb( 0, 128, 0)
greenyellow	rgb(173, 255, 47)
honeydew	rgb(240, 255, 240)
hotpink	rgb(255, 105, 180)
indianred	rgb(205, 92, 92)
indigo	rgb( 75, 0, 130)
ivory	rgb(255, 255, 240)
khaki	rgb(240, 230, 140)
lavender	rgb(230, 230, 250)
lavenderblush	rgb(255, 240, 245)
lawngreen	rgb(124, 252, 0)
lemonchiffon	rgb(255, 250, 205)
lightblue	rgb(173, 216, 230)
lightcoral	rgb(240, 128, 128)
lightcyan	rgb(224, 255, 255)
lightgoldenrodyellow	rgb(250, 250, 210)
lightgray	rgb(211, 211, 211)
lightgreen	rgb(144, 238, 144)
lightgrey	rgb(211, 211, 211)
lightpink	rgb(255, 182, 193)
lightsalmon	rgb(255, 160, 122)
lightseagreen	rgb( 32, 178, 170)
lightskyblue	rgb(135, 206, 250)
lightslategray	rgb(119, 136, 153)
lightslategrey	rgb(119, 136, 153)
lightsteelblue	rgb(176, 196, 222)
lightyellow	rgb(255, 255, 224)
lime	rgb( 0, 255, 0)
limegreen	rgb( 50, 205, 50)
linen	rgb(250, 240, 230)
magenta	rgb(255, 0, 255)
maroon	rgb(128, 0, 0)
mediumaquamarine	rgb(102, 205, 170)
mediumblue	rgb( 0, 0, 205)
mediumorchid	rgb(186, 85, 211)
mediumpurple	rgb(147, 112, 219)
mediumseagreen	rgb( 60, 179, 113)
mediumslateblue	rgb(123, 104, 238)
mediumspringgreen	rgb( 0, 250, 154)
mediumturquoise	rgb( 72, 209, 204)
mediumvioletred	rgb(199, 21, 133)
midnightblue	rgb( 25, 25, 112)
mintcream	rgb(245, 255, 250)
mistyrose	rgb(255, 228, 225)
moccasin	rgb(255, 228, 181)
navajowhite	rgb(255, 222, 173)
navy	rgb( 0, 0, 128)
oldlace	rgb(253, 245, 230)
olive	rgb(128, 128, 0)
olivedrab	rgb(107, 142, 35)
orange	rgb(255, 165, 0)
orangered	rgb(255, 69, 0)
orchid	rgb(218, 112, 214)
palegoldenrod	rgb(238, 232, 170)
palegreen	rgb(152, 251, 152)
paleturquoise	rgb(175, 238, 238)
palevioletred	rgb(219, 112, 147)
papayawhip	rgb(255, 239, 213)
peachpuff	rgb(255, 218, 185)
peru	rgb(205, 133, 63)
pink	rgb(255, 192, 203)
plum	rgb(221, 160, 221)
powderblue	rgb(176, 224, 230)
purple	rgb(128, 0, 128)
red	rgb(255, 0, 0)
rosybrown	rgb(188, 143, 143)
royalblue	rgb( 65, 105, 225)
saddlebrown	rgb(139, 69, 19)
salmon	rgb(250, 128, 114)
sandybrown	rgb(244, 164, 96)
seagreen	rgb( 46, 139, 87)
seashell	rgb(255, 245, 238)
sienna	rgb(160, 82, 45)
silver	rgb(192, 192, 192)
skyblue	rgb(135, 206, 235)
slateblue	rgb(106, 90, 205)
slategray	rgb(112, 128, 144)
slategrey	rgb(112, 128, 144)
snow	rgb(255, 250, 250)
springgreen	rgb( 0, 255, 127)
steelblue	rgb( 70, 130, 180)
tan	rgb(210, 180, 140)
teal	rgb( 0, 128, 128)
thistle	rgb(216, 191, 216)
tomato	rgb(255, 99, 71)
turquoise	rgb( 64, 224, 208)
violet	rgb(238, 130, 238)
wheat	rgb(245, 222, 179)
white	rgb(255, 255, 255)
whitesmoke	rgb(245, 245, 245)
yellow	rgb(255, 255, 0)
yellowgreen	rgb(154, 205, 50)
 	 
*/

/**
 * Return a CSS color (#rrggbb) from a string.
 * 
 * Possible formats include:
 * - named colors from the DVI color set: 'Yellow', 'red'... Case insensitive.
 * - colors from the Mathematica set: 'm1'...'m9'
 * - 3-digit hex: `'#d50'`
 * - 6-digit hex: `'#dd5500'`
 * - RGB functional: `'rgb(240, 20, 10)'`
 * 
 * In addition, colors can be mixed using the following syntax:
 * `<mix> = <color>![<value>][!<mix>]`
 * For example: 
 * - `'blue!20'`  = 20% blue + 80% white
 * - `'blue!20!black'` = 20% + 80% black
 * - `'blue!20!black!30!green'` = (20% + 80% black) * 30 % + 70% green
 * 
 * If the input string is prefixed with a dash, the complementary color
 * of the expression is returned.
 * 
 * This creative syntax is defined by the {@link http://mirror.jmu.edu/pub/CTAN/macros/latex/contrib/xcolor/xcolor.pdf|`xcolor` LaTeX package}.
 * 
 * @param {string} s - An expression representing a color value
 * @return {string} An RGB color expressed as a hex-triplet preceded by `#`
 * @memberof module:color
 * @private
 */
function stringToColor(s) {
    const colorSpec = s.toLowerCase().split('!');

    let baseRed;
    let baseGreen;
    let baseBlue;
    let red = 255;
    let green = 255;
    let blue = 255;
    let mix = -1;

    // If the string is prefixed with a '-', use the complementary color
    const complementary = colorSpec.length > 0 && colorSpec[0].charAt(0) === '-';
    if (complementary) colorSpec[0] = colorSpec[0].slice(1);


    for (let i = 0; i < colorSpec.length; i++) {
        baseRed = red;
        baseGreen = green;
        baseBlue = blue;

        let colorName = colorSpec[i].match(/([a-z0-9]*)/);
        if (colorName) colorName = colorName[1];

        let color = NAMED_COLORS[colorName] || MATHEMATICA_COLORS[colorName];
        if (!color) color = colorSpec[i];

        let m = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        if (m && m[1] && m[2] && m[3]) {
            // It's a six-digit hex number
            red = Math.max(0, Math.min(255, parseInt(m[1], 16)));
            green = Math.max(0, Math.min(255, parseInt(m[2], 16)));
            blue = Math.max(0, Math.min(255, parseInt(m[3], 16)));
        } else {
            m = color.match(/^#([0-9a-f]{3})$/i)
            if (m && m[1]) {
                // It's a three-digit hex number
                const r1 = parseInt(m[1][0], 16);
                const g1 = parseInt(m[1][1], 16);
                const b1 = parseInt(m[1][2], 16)
                red = Math.max(0, Math.min(255, r1 * 16 + r1));
                green = Math.max(0, Math.min(255, g1 * 16 + g1));
                blue = Math.max(0, Math.min(255, b1 * 16 + b1));
            } else {
                // It's a rgb functional
                m = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
                if (m && m[1] && m[2] && m[3]) {
                    red = Math.max(0, Math.min(255, parseInt(m[1])));
                    green = Math.max(0, Math.min(255, parseInt(m[2])));
                    blue = Math.max(0, Math.min(255, parseInt(m[3])));
                } else {
                    return null;
                }
            }
        }
        if (mix >= 0) {
            red = (1.0 - mix) * red +  mix * baseRed;
            green = (1.0 - mix) * green + mix * baseGreen;
            blue = (1.0 - mix) * blue + mix * baseBlue;
            mix = -1;
        }
        if (i + 1 < colorSpec.length) {
            mix = Math.max(0, Math.min(100, parseInt(colorSpec[++i]))) / 100.0;
        }
    }

    if (mix >= 0) {
        red = mix * red + (1.0 - mix) * baseRed;
        green = mix * green + (1.0 - mix) * baseGreen;
        blue = mix * blue + (1.0 - mix) * baseBlue;
    }

    if (complementary) {
        red = 255 - red;
        green = 255 - green;
        blue = 255 - blue;
    }

    return '#' +  
        ('00' + Math.round(red).toString(16)).slice(-2) + 
        ('00' + Math.round(green).toString(16)).slice(-2) + 
        ('00' + Math.round(blue).toString(16)).slice(-2);
}

function colorToString(color) {
    let result = color.toUpperCase();

    for (const c in NAMED_COLORS) {
        if (NAMED_COLORS[c] === result) {
            result = c;
            break;
        }
    }

    for (const c in MATHEMATICA_COLORS) {
        if (MATHEMATICA_COLORS[c] === result) {
            result = c;
            break;
        }
    }

    return result;
}

// Export the public interface for this module
export default { 
    stringToColor,
    colorToString,
    AREA_COLORS,
    LINE_COLORS,
}



