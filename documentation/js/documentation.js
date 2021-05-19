import { debug } from '/dist/mathlive.mjs';
export { default as MathLive } from '/dist/mathlive.mjs';

// import "../mathlive/src/addons/definitions-metadata.js";

/*
 {
	'\#':					1200,	//  mord
	'\ldotp':				18,	//  mpunct
	'\colon':				3000,	//  mpunct
	'\lt':					3000,	//  mrel
	'\gt':					3000,	//  mrel
	'\pounds':				509,	//  mord
	'\yen':					57,	//  mord
	'\neg':					4000,	//  mord
	'\circledR':			1329,	//  mord
	'\pm':					3000,	//  mbin
	'\times':				3000,	//  mbin
	'\eth':					77,	//  mord
	'\div':					3000,	//  mbin
	'\not':					3000,	//  mrel
	'\Gamma':				3000,	//  mord
	'\Delta':				3000,	//  mord
	'\Theta':				3000,	//  mord
	'\Lambda':				3000,	//  mord
	'\Xi':					3000,	//  mord
	'\Pi':					3000,	//  mord
	'\Sigma':				3000,	//  mord
	'\Upsilon':				3000,	//  mord
	'\Phi':					3000,	//  mord
	'\Psi':					3000,	//  mord
	'\Omega':				3000,	//  mord
	'\alpha':				3000,	//  mord
	'\beta':				3000,	//  mord
	'\gamma':				3000,	//  mord
	'\delta':				3000,	//  mord
	'\zeta':				3000,	//  mord
	'\eta':					3000,	//  mord
	'\theta':				3000,	//  mord
	'\iota':				3000,	//  mord
	'\kappa':				3000,	//  mord
	'\lambda':				3000,	//  mord
	'\mu':					3000,	//  mord
	'\nu':					3000,	//  mord
	'\xi':					3000,	//  mord
	'\pi':					3000,	//  mord
	'\rho':					3000,	//  mord
	'\varsigma':			3000,	//  mord
	'\sigma':				3000,	//  mord
	'\tau':					3000,	//  mord
	'\upsilon':				3000,	//  mord
	'\varphi':				3000,	//  mord
	'\chi':					3000,	//  mord
	'\psi':					3000,	//  mord
	'\omega':				3000,	//  mord
	'\vartheta':			3000,	//  mord
	'\phi':					3000,	//  mord
	'\varpi':				3000,	//  mord
	'\digamma':				248,	//  mord
	'\varkappa':			3000,	//  mord
	'\varrho':				3000,	//  mord
	'\epsilon':				3000,	//  mord
	'\dagger':				3000,	//  mbin
	'\dag':					3000,	//  mbin
	'\ddagger':				353,	//  mbin
	'\mathellipsis':		91,	//  minner
	'\backprime':			104,	//  mord
	'\euro':				4,	//  mord
	'\hslash':				3000,	//  mord
	'\ell':					3000,	//  mord
	'\wp':					1306,	//  mord
	'\mho':					138,	//  mord
	'\Finv':				3,	//  mord
	'\aleph':				1381,	//  mord
	'\beth':				54,	//  mord
	'\gimel':				36,	//  mord
	'\daleth':				43,	//  mord
	'\Game':				1,	//  mord
	'\gets':				150,	//  mrel
	'\uparrow':				3000,	//  mrel
	'\to':					4000,	//  mrel
	'\downarrow':			3000,	//  mrel
	'\leftrightarrow':		4000,	//  mrel
	'\updownarrow':			192,	//  mrel
	'\nwarrow':				108,	//  mrel
	'\nearrow':				1301,	//  mrel
	'\searrow':				1609,	//  mrel
	'\swarrow':				167,	//  mrel
	'\nleftarrow':			7,	//  mrel
	'\nrightarrow':			324,	//  mrel
	'\twoheadleftarrow':	32,	//  mrel
	'\twoheadrightarrow':	835,	//  mrel
	'\leftarrowtail':		25,	//  mrel
	'\rightarrowtail':		195,	//  mrel
	'\mapsto':				3000,	//  mrel
	'\hookleftarrow':		115,	//  mrel
	'\hookrightarrow':		3000,	//  mrel
	'\looparrowleft':		6,	//  mrel
	'\looparrowright':		37,	//  mrel
	'\leftrightsquigarrow':	31,	//  mrel
	'\nleftrightarrow':		36,	//  mrel
	'\Lsh':					11,	//  mrel
	'\Rsh':					18,	//  mrel
	'\curvearrowleft':		3000,	//  mrel
	'\curvearrowright':		209,	//  mrel
	'\circlearrowleft':		105,	//  mrel
	'\circlearrowright':	63,	//  mrel
	'\leftharpoonup':		93,	//  mrel
	'\leftharpoondown':		42,	//  mrel
	'\restriction':			29,	//  mrel
	'\rightharpoonup':		3000,	//  mrel
	'\rightharpoondown':	80,	//  mrel
	'\downharpoonright':	39,	//  mrel
	'\downharpoonleft':		21,	//  mrel
	'\rightleftarrows':		3000,	//  mrel
	'\leftrightarrows':		765,	//  mrel
	'\leftleftarrows':		8,	//  mrel
	'\upuparrows':			15,	//  mrel
	'\downdownarrows':		6,	//  mrel
	'\leftrightharpoons':	205,	//  mrel
	'\rightleftharpoons':	3000,	//  mrel
	'\nLeftarrow':			5,	//  mrel
	'\nLeftrightarrow':		20,	//  mrel
	'\nRightarrow':			107,	//  mrel
	'\Leftarrow':			1695,	//  mrel
	'\Uparrow':				257,	//  mrel
	'\Rightarrow':			4000,	//  mrel
	'\Downarrow':			556,	//  mrel
	'\Leftrightarrow':		4000,	//  mrel
	'\Updownarrow':			161,	//  mrel
	'\Lleftarrow':			7,	//  mrel
	'\Rrightarrow':			62,	//  mrel
	'\leadsto':				709,	//  mrel
	'\dashleftarrow':		5,	//  mrel
	'\dashrightarrow':		311,	//  mrel
	'\forall':				4000,	//  mord
	'\complement':			200,	//  mord
	'\partial':				4000,	//  mord
	'\exists':				4000,	//  mord
	'\nexists':				4000,	//  mord
	'\varnothing':			4000,	//  mord
	'\differencedelta':		3000,	//  mrel
	'\nabla':				4000,	//  mord
	'\in':					4000,	//  mrel
	'\notin':				4000,	//  mrel
	'\owns':				18,	//  mrel
	'\backepsilon':			176,	//  mrel
	'\mp':					3000,	//  mbin
	'\dotplus':				81,	//  mbin
	'\smallsetminus':		254,	//  mbin
	'\circ':				4000,	//  mbin
	'\bullet':				3000,	//  mbin
	'\surd':				3000,	//  mord
	'\varpropto':			203,	//  mrel
	'\infty':				4000,	//  mord
	'\angle':				3000,	//  mord
	'\measuredangle':		271,	//  mord
	'\sphericalangle':		156,	//  mord
	'\vert':				4000,	//  mord
	'\lvert':				496,	//  mopen
	'\rvert':				496,	//  mclose
	'\shortmid':			67,	//  mrel
	'\nmid':				417,	//  mrel
	'\Vert':				4000,	//  mord
	'\lVert':				287,	//  mopen
	'\parallel':			3000,	//  mrel
	'\shortparallel':		17,	//  mrel
	'\nparallel':			54,	//  mrel
	'\land':				659,	//  mbin
	'\lor':					364,	//  mbin
	'\cap':					4000,	//  mbin
	'\cup':					4000,	//  mbin
	'\therefore':			1129,	//  mrel
	'\because':				388,	//  mrel
	'\thicksim':			779,	//  mrel
	'\backsim':				251,	//  mrel
	'\wr':					286,	//  mbin
	'\nsim':				40,	//  mrel
	'\eqsim':				62,	//  mrel
	'\cong':				3000,	//  mrel
	'\ncong':				128,	//  mrel
	'\thickapprox':			377,	//  mrel
	'\approxeq':			147,	//  mrel
	'\asymp':				755,	//  mrel
	'\Bumpeq':				12,	//  mrel
	'\bumpeq':				13,	//  mrel
	'\doteq':				1450,	//  mrel
	'\fallingdotseq':		99,	//  mrel
	'\risingdotseq':		8,	//  mrel
	'\coloneq':				5,	//  mrel
	'\eqcirc':				6,	//  mrel
	'\circeq':				31,	//  mrel
	'\triangleq':			3000,	//  mrel
	'\neq':					3000,	//  mrel
	'\equiv':				3000,	//  mrel
	'\leq':					3000,	//  mrel
	'\geq':					3000,	//  mrel
	'\leqq':				1356,	//  mrel
	'\geqq':				972,	//  mrel
	'\lneqq':				36,	//  mrel
	'\gneqq':				35,	//  mrel
	'\gg':					3000,	//  mrel
	'\between':				110,	//  mrel
	'\nless':				146,	//  mrel
	'\ngtr':				90,	//  mrel
	'\nleq':				369,	//  mrel
	'\ngeq':				164,	//  mrel
	'\gtrsim':				3000,	//  mrel
	'\lessgtr':				281,	//  mrel
	'\gtrless':				417,	//  mrel
	'\prec':				3000,	//  mrel
	'\succ':				3000,	//  mrel
	'\preccurlyeq':			549,	//  mrel
	'\succcurlyeq':			442,	//  mrel
	'\precsim':				104,	//  mrel
	'\succsim':				251,	//  mrel
	'\nprec':				71,	//  mrel
	'\nsucc':				44,	//  mrel
	'\subset':				4000,	//  mrel
	'\supset':				4000,	//  mrel
	'\subseteq':			4000,	//  mrel
	'\supseteq':			4000,	//  mrel
	'\nsubseteq':			950,	//  mrel
	'\nsupseteq':			672,	//  mrel
	'\subsetneq':			1945,	//  mrel
	'\supsetneq':			286,	//  mrel
	'\uplus':				597,	//  mbin
	'\sqsubset':			309,	//  mrel
	'\sqsupset':			71,	//  mrel
	'\sqsubseteq':			1255,	//  mrel
	'\sqsupseteq':			183,	//  mrel
	'\sqcap':				735,	//  mbin
	'\sqcup':				63,	//  mbin
	'\oplus':				3000,	//  mbin
	'\ominus':				1568,	//  mbin
	'\otimes':				3000,	//  mbin
	'\oslash':				497,	//  mbin
	'\odot':				3000,	//  mbin
	'\circledcirc':			93,	//  mbin
	'\circledast':			339,	//  mbin
	'\circleddash':			3000,	//  mbin
	'\boxplus':				276,	//  mbin
	'\boxminus':			79,	//  mbin
	'\boxtimes':			457,	//  mbin
	'\boxdot':				120,	//  mbin
	'\vdash':				3000,	//  mrel
	'\dashv':				299,	//  mrel
	'\top':					1200,	//  mord
	'\perp':				3000,	//  mrel
	'\models':				3000,	//  mrel
	'\Vdash':				276,	//  mrel
	'\Vvdash':				20,	//  mrel
	'\nvdash':				266,	//  mrel
	'\nvDash':				405,	//  mrel
	'\nVdash':				179,	//  mrel
	'\nVDash':				5,	//  mrel
	'\vartriangleleft':		281,	//  mrel
	'\vartriangleright':	209,	//  mrel
	'\trianglelefteq':		176,	//  mrel
	'\trianglerighteq':		45,	//  mrel
	'\multimap':			108,	//  mrel
	'\intercal':			478,	//  mbin
	'\nor':					7,	//  mbin
	'\barwedge':			21,	//  mbin
	'\diamond':				1356,	//  mbin
	'\cdotp':				3000,	//  mpunct
	'\star':				3000,	//  mbin
	'\divideontimes':		51,	//  mbin
	'\Join':				35,	//  mrel
	'\ltimes':				576,	//  mbin
	'\rtimes':				946,	//  mbin
	'\leftthreetimes':		34,	//  mbin
	'\rightthreetimes':		14,	//  mbin
	'\backsimeq':			91,	//  mrel
	'\curlyvee':			57,	//  mbin
	'\curlywedge':			58,	//  mbin
	'\Supset':				34,	//  mrel
	'\doublecap':			1,	//  mbin
	'\doublecup':			1,	//  mbin
	'\pitchfork':			66,	//  mrel
	'\lessdot':				88,	//  mbin
	'\gtrdot':				45,	//  mbin
	'\lesseqgtr':			134,	//  mrel
	'\gtreqless':			190,	//  mrel
	'\curlyeqprec':			14,	//  mrel
	'\curlyeqsucc':			10,	//  mrel
	'\npreceq':				57,	//  mrel
	'\lnsim':				4,	//  mrel
	'\gnsim':				3,	//  mrel
	'\precnsim':			4,	//  mrel
	'\succnsim':			4,	//  mrel
	'\ntriangleleft':		13,	//  mrel
	'\ntriangleright':		15,	//  mrel
	'\ntrianglelefteq':		22,	//  mrel
	'\ntrianglerighteq':	6,	//  mrel
	'\vdots':				3000,	//  mord
	'\cdots':				3000,	//  minner
	'\ddots':				3000,	//  minner
	'\lceil':				3000,	//  mopen
	'\rceil':				3000,	//  mclose
	'\lfloor':				3000,	//  mopen
	'\rfloor':				3000,	//  mclose
	'\smallfrown':			71,	//  mrel
	'\smallsmile':			31,	//  mrel
	'\circledS':			31,	//  mord
	'\ulcorner':			296,	//  mopen
	'\urcorner':			310,	//  mclose
	'\llcorner':			137,	//  mopen
	'\lrcorner':			199,	//  mclose
	'\diagup':				440,	//  mord
	'\diagdown':			175,	//  mord
	'\blacksquare':			1679,	//  mord
	'\Box':					3000,	//  mord
	'\blacktriangle':		360,	//  mord
	'\bigtriangleup':		1773,	//  mbin
	'\vartriangle':			762,	//  mrel
	'\blacktriangleright':	1717,	//  mrel
	'\triangleright':		516,	//  mbin
	'\blacktriangledown':	159,	//  mord
	'\bigtriangledown':		661,	//  mbin
	'\blacktriangleleft':	101,	//  mrel
	'\triangleleft':		534,	//  mbin
	'\lozenge':				422,	//  mord
	'\bigcirc':				903,	//  mbin
	'\bigstar':				168,	//  mord
	'\spadesuit':			200,	//  mord
	'\heartsuit':			200,	//  mord
	'\clubsuit':			172,	//  mord
	'\flat':				590,	//  mord
	'\natural':				278,	//  mord
	'\sharp':				3000,	//  mord
	'\checkmark':			1025,	//  mord
	'\maltese':				24,	//  mord
	'\langle':				3000,	//  mopen
	'\rangle':				3000,	//  mclose
	'\lgroup':				24,	//  mopen
	'\rgroup':				24,	//  mclose
	'\longleftarrow':		878,	//  mrel
	'\longrightarrow':		4000,	//  mrel
	'\implies':				1858,	//  mrel
	'\Longleftrightarrow':	3000,	//  mrel
	'\longmapsto':			3000,	//  mrel
	'\blacklozenge':		344,	//  mord
	'\doublebarwedge':		5,	//  mbin
	'\leqslant':			4000,	//  mrel
	'\geqslant':			4000,	//  mrel
	'\lessapprox':			146,	//  mrel
	'\gtrapprox':			95,	//  mrel
	'\lneq':				54,	//  mrel
	'\gneq':				29,	//  mrel
	'\gtreqqless':			91,	//  mrel
	'\eqslantless':			15,	//  mrel
	'\eqslantgtr':			13,	//  mrel
	'\preceq':				3000,	//  mrel
	'\succeq':				1916,	//  mrel
	'\precneqq':			11,	//  mrel
	'\succneqq':			3,	//  mrel
	'\precapprox':			50,	//  mrel
	'\precnapprox':			2,	//  mrel
	'\subseteqq':			82,	//  mrel
	'\supseteqq':			6,	//  mrel
	'\subsetneqq':			314,	//  mrel
	'\supsetneqq':			49,	//  mrel
	'\nshortmid':			1,	//  mrel
	'\nshortparallel':		6,	//  mrel
	'\lvertneqq':			6,	//  mrel
	'\gvertneqq':			6,	//  mrel
	'\ngeqq':				12,	//  mrel
	'\ngeqslant':			23,	//  mrel
	'\nleqslant':			58,	//  mrel
	'\nleqq':				18,	//  mrel
	'\nsubseteqq':			16,	//  mrel
	'\varsubsetneqq':		55,	//  mrel
	'\nsupseteqq':			1,	//  mrel
	'\varsupsetneqq':		3,	//  mrel
	'\varsubsetneq':		198,	//  mrel
	'\varsupsetneq':		2,	//  mrel

}
 {
	'\Bbb':					1081,
	'\acute':				3000,
	'\arccos':				2000,
	'\arcctg':				2000,
	'\arcsin':				2000,
	'\arctan':				2000,
	'\arctg':				2000,
	'\arg':					2000,
	'\atop':				12,
	'\atopwithdelims':		3000,
	'\bar':					3000,
	'\bigcap':				4000,
	'\bigcup':				4000,
	'\bigodot':				150,
	'\bigoplus':			3000,
	'\bigotimes':			1241,
	'\bigsqcup':			723,
	'\biguplus':			174,
	'\bigvee':				1200,
	'\bigwedge':			1200,
	'\boldsymbol':			3000,
	'\boxed':				1236,
	'\breve':				1548,
	'\ch':					2000,
	'\check':				3000,
	'\choose':				1968,
	'\coprod':				756,
	'\cos':					4000,
	'\cosec':				2000,
	'\cosh':				2000,
	'\cot':					2000,
	'\cotg':				2000,
	'\coth':				2000,
	'\csc':					2000,
	'\ctg':					2000,
	'\cth':					2000,
	'\ddot':				3000,
	'\deg':					3000,
	'\det':					3000,
	'\dim':					3000,
	'\em':					49,
	'\emph':				819,
	'\exp':					4000,
	'\frak':				271,
	'\grave':				735,
	'\hom':					292,
	'\iiint':				878,
	'\iint':				3000,
	'\int':					4000,
	'\intop':				97,
	'\ker':					3000,
	'\lb':					2000,
	'\lg':					2000,
	'\lim':					4000,
	'\llap':				18,
	'\ln':					4000,
	'\log':					4000,
	'\mathbb':				4000,
	'\mathfrak':			3000,
	'\mathscr':				3000,
	'\mathsf':				2000,
	'\mathtt':				3000,
	'\max':					3000,
	'\min':					3000,
	'\mod':					3000,
	'\oint':				3000,
	'\over':				21,
	'\overline':			3000,
	'\overset':				3000,
	'\overwithdelims':		15,
	'\prod':				4000,
	'\qquad':				3000,	//  spacing
	'\quad':				3000,	//  spacing
	'\rlap':				270,
	'\sec':					2000,
	'\sh':					2000,
	'\sin':					4000,
	'\sinh':				2000,
	'\smallint':			3000,
	'\sqrt':				4000,
	'\stackrel':			3000,
	'\sum':					4000,
	'\tan':					4000,
	'\tanh':				2000,
	'\textbf':				3000,
	'\textcolor':			3,
	'\textit':				3000,
	'\textnormal':			433,
	'\textrm':				3000,
	'\textsf':				3000,
	'\texttt':				3000,
	'\textup':				421,
	'\tg':					2000,
	'\th':					2000,
	'\tilde':				3000,
	'\underline':			3000,
	'\underset':			3000,
	'\vec':					4000,

}
*/

const table = {};
// indexed by unicode codepoint or a string
// source (symbol, functions, text, commands)
// type (mord, etc...)
// font
// value
// symbol
// limits
// has f()?

function generateDataTableForDictionary(source, dic) {
  for (const entry in dic) {
    if (Object.prototype.hasOwnProperty.call(dic, entry)) {
      let v = dic[entry].body || dic[entry].value;
      if (!v) {
        v = entry;
      }
      if (v.length === 1) {
        v = v.charCodeAt(0);
      }
      const newCell = {
        source: source,
        value: entry,
        font: dic[entry].fontFamily || '-',
        type: dic[entry].type || '-',
        limits: dic[entry].limits || '-',
        symbol: dic[entry].symbol !== undefined ? dic[entry].symbol : '-',
        hasF: dic[entry].handler !== undefined ? '√' : '-',
        frequency: dic[entry].frequency,
        category: dic[entry].category,
      };
      if (table[v] !== undefined) {
        if (Array.isArray(table[v])) {
          table[v].push(newCell);
        } else {
          table[v] = [newCell];
        }
      } else {
        table[v] = newCell;
      }
    }
  }
}

function toUnicode(n) {
  if (typeof n === 'string' && n.length === 1) {
    n = n.charCodeAt(0);
  } else if (typeof n === 'string') {
    return n;
  }
  return 'U+' + ('000000' + n.toString(16)).substr(-6);
}

function generateCell(index, cell) {
  let result = '';
  result += '<tr>';
  if (index) {
    result += '<td>' + toUnicode(index) + '</td>';
  }
  result += '<td>' + cell.value + '</td>';
  result += '<td>' + cell.source + '</td>';
  result += '<td>' + (cell.type === 'mord' ? '-' : cell.type) + '</td>';
  result += '<td>' + (cell.font === 'main' ? '-' : cell.font) + '</td>';
  result += '<td>' + cell.symbol + '</td>';

  result += '</tr>';
  return result;
}

function generateFrequencyCell(prefix, index, cell) {
  if (!cell.frequency) return '';

  let result = '\t' + prefix;

  result +=
    "'" +
    cell.value +
    "':" +
    '\t'.repeat(6 - Math.floor((cell.value.length + 3) / 4)) +
    cell.frequency +
    ',';

  let comment =
    index !== cell.value && isNaN(parseInt(index)) ? toUnicode(index) : '';
  if (cell.type !== '-') comment += ' ' + cell.type;
  if (comment) result += '\t// ' + comment;

  result += '\n';

  return result;
}

function generateDataTableForRange(title, start, end) {
  let result =
    '<h2>' +
    (title ? title : toUnicode(start) + '-' + toUnicode(end)) +
    '</h2>';

  result += '<table>';
  result +=
    '<tr><th>Unicode</th><th>Value</th><th>Source</th><th>Type</th><th>Font</th><th>Symbol</th></tr>';

  if (start || end) {
    for (let index = start; index <= end; index++) {
      if (table[index]) {
        if (Array.isArray(table[index])) {
          for (let i = 0; i < table[index].length; i++) {
            result += generateCell(index, table[index][i]);
          }
        } else {
          result += generateCell(index, table[index]);
        }
      } else {
        // result += '<tr><td>' + toUnicode(index) + '</td></tr>';
      }
    }
  } else {
    const keys = Object.keys(table);
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      if (isNaN(parseInt(keys[i]))) {
        if (Array.isArray(table[keys[i]])) {
          for (let j = 0; j < table[keys[i]].length; j++) {
            result += generateCell(keys[i], table[keys[i]][j]);
          }
        } else {
          result += generateCell(keys[i], table[keys[i]]);
        }
      }
    }

    // for (const n in table) {
    //     if (table.hasOwnProperty(n) && isNaN(parseInt(n))) {
    //         if (Array.isArray(table[n])) {
    //             for (let i = 0; i < n.length; i++) {
    //                 result += generateCell(n, table[n][i]);
    //             }
    //         } else {
    //             result += generateCell(n, table[n]);
    //         }
    //     }
    // }
  }

  return result + '</table>';
}

function generateFrequencyTableForRange(start, end) {
  let result = '<pre style="white-space: pre; tab-size:4"> {\n';

  if (start || end) {
    for (let index = start; index <= end; index++) {
      if (table[index]) {
        if (Array.isArray(table[index])) {
          for (let i = 0; i < table[index].length; i++) {
            result += generateFrequencyCell('', index, table[index][i]);
          }
        } else {
          result += generateFrequencyCell('', index, table[index]);
        }
      }
    }
  } else {
    const keys = Object.keys(table);
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      if (isNaN(parseInt(keys[i]))) {
        if (Array.isArray(table[keys[i]])) {
          for (let j = 0; j < table[keys[i]].length; j++) {
            result += generateFrequencyCell('', keys[i], table[keys[i]][j]);
          }
        } else {
          result += generateFrequencyCell('', keys[i], table[keys[i]]);
        }
      }
    }
  }

  return result + '\n} </pre>';
}

export function generateDataTable() {
  let result = '';

  // Combine all the definitions into one table
  generateDataTableForDictionary('Math', debug.MATH_SYMBOLS);
  generateDataTableForDictionary('Text', debug.TEXT_SYMBOLS);
  generateDataTableForDictionary('Functions', debug.FUNCTIONS);

  // Output the data for a Unicode range
  result += generateDataTableForRange('Basic Latin Block', 0x000, 0x07f);
  result += generateDataTableForRange('Latin 1 Supplement block', 0x080, 0x0ff);
  result += generateDataTableForRange('0x0100, 0x036F', 0x0100, 0x036f);
  result += generateDataTableForRange('Greek and Coptic block', 0x0370, 0x03ff);

  // result += generateDataTableForRange('', 0x0400, 0x1FFF);
  result += generateDataTableForRange(
    'General Punctuation block',
    0x2000,
    0x206f
  );
  // result += generateDataTableForRange('Superscripts and Subscripts block', 0x2070, 0x209c);
  // result += generateDataTableForRange('Combining Diacritical Marks for Symbols block', 0x20d0, 0x20f0);
  result += generateDataTableForRange('', 0x209c, 0x20ff);
  result += generateDataTableForRange(
    'Letterlike Symbols block',
    0x2100,
    0x214f
  );
  // result += generateDataTableForRange('', 0x2150, 0x218f);
  result += generateDataTableForRange('Arrows block', 0x2190, 0x21ff);
  result += generateDataTableForRange(
    'Mathematical Operators block',
    0x2200,
    0x22ff
  );
  result += generateDataTableForRange(
    'Miscellaneous Technical block',
    0x2300,
    0x23ff
  );
  result += generateDataTableForRange('', 0x2400, 0x259f);
  result += generateDataTableForRange('Geometric Shapes block', 0x25a0, 0x25ff);
  result += generateDataTableForRange(
    'Miscellaneous Symbols block',
    0x2600,
    0x26ff
  );
  result += generateDataTableForRange('Dingbats', 0x2700, 0x27bf);
  result += generateDataTableForRange('', 0x27c0, 0x27ef);

  result += generateDataTableForRange(
    'Supplemental Arrows-A block',
    0x27f0,
    0x27ff
  );
  // result += generateDataTableForRange('', 0x2800, 0x28ff);
  result += generateDataTableForRange(
    'Supplemental Arrows-B block',
    0x2900,
    0x297f
  );
  result += generateDataTableForRange('', 0x2980, 0x2aff);
  // result += generateDataTableForRange('Geometric Symbols and Arrows block', 0x2B00, 0x2Bff);
  // result += generateDataTableForRange('', 0x2c00, 0x27bf);
  result += generateDataTableForRange(
    'Miscellaneous Mathematical Symbols-A block',
    0x27c0,
    0x27ef
  );
  result += generateDataTableForRange(
    'Supplemental Mathematical Operators block',
    0x2a00,
    0x1d3ff
  );
  result += generateDataTableForRange(
    'Miscellaneous Mathematical Symbols-B block',
    0x2980,
    0x29ff
  );
  result += generateDataTableForRange(
    'Supplemental Mathematical Operators block',
    0x2a00,
    0xe01b
  );

  // result += generateDataTableForRange('', 0xe01c, 0x1d3ff);
  // result += generateDataTableForRange('Mathematical Alphanumeric Symbols block', 0x1D400, 0x1D7FF);

  result += generateDataTableForRange('Functions and Commands');

  result += generateFrequencyTableForRange(0, 0xe01b);
  result += generateFrequencyTableForRange();

  // TEXT_SYMBOLS

  // MATH_SYMBOLS

  // COMMAND_SYMBOLS

  // FUNCTIONS
  //     type
  //     limits
  //     symbol
  //     body
  //     fontFamily
  //     f()?

  //     symbol
  //     fontFamily
  //     type
  //     body (or value)

  // Frequency tables

  // Category tables

  return result;
}

let commandCount = 0;
let deferred = '';

function generateDocumentationForFunction(cat, name, info) {
  if (info.category !== cat && (cat !== 'None' || info.category)) return '';

  // let result = '<span>$$' + (info.template || name);
  let result = ' * $$' + (info.template || name);
  result += '$$   ' + '`' + name;
  if (info.params) {
    // result += '<kbd>';
    if (info.infix) result += 'infix ';
    info.params.forEach((param, i) => {
      if (!info.infix || i > 1) {
        if (param.isOptional) {
          result += '[]';
        } else {
          result += '{}';
        }
      }
    });
    // result += '</kbd>';
  }

  result += '`<br>';

  return result;
}

function generateDocumentationForSymbol(cat, name, info) {
  if (/^[a-zA-Z0-9]$/.test(name)) return '';

  if (info.category !== cat && (cat !== 'None' || info.category)) return '';

  // return (
  //   '<span>$$' + (info.template || name) + '$$</span><kbd>' + name + '</kbd>'
  // );

  return `<br>   * $$${info.template || name}$$   &nbsp; \`${name}\``;
}

function generateDocumentationForEnvironments() {
  const format = 'full';
  let result = '<h3>Environments</h3>';
  result +=
    format === 'compact'
      ? '<table class="compact-definition-table">'
      : '<table>';
  if (format === 'compact') {
    result += '<tr>';
  }

  // freq = freq || 0;
  for (const s in debug.ENVIRONMENTS) {
    if (Object.prototype.hasOwnProperty.call(debug.ENVIRONMENTS, s)) {
      const info = debug.ENVIRONMENTS[s];
      if (format === 'full') {
        // result += '<tr>';
        result += '<br> * ';
        if (info.tabular) {
          // result += '<td>';
          result += '$$\\begin{' + s + '}';
          if (s === 'array') {
            result += '{lclc}';
          }
          result += 'a & b \\\\';
          result += 'c & \\frac{1}{d}';
          result += '\\end{' + s + '}$$';
          // result += '</td>';
          // result += '<td><kbd>';
          result += '`';
          result += '\\\u200bbegin{' + s + '}';
          result += '...';
          result += '\\end{' + s + '}';
          result += '`';

          // result += '</kbd></td>';
        } else {
          // result += '<td>';
          result += '`';
          result += '$$\\begin{' + s + '}';
          result += '\\text{first}';
          result += '\\end{' + s + '}$$';
          result += '`';
          // result += '</td>';
        }

        result += '<br>';
        // result += '<td>';
        if (info.note) {
          result += info.note + ' ';
        }
        if (info.maxColumns) {
          result += 'max col: ' + info.maxColumns + ' ';
        }
        result += '</td>';

        result += '</tr>';
      } else if (format === 'compact') {
        result =
          '<td><kbd>' + '\\begin{' + s + '}...\\end{' + s + '}' + '</kbd></td>';
        if (commandCount % 4 === 0) {
          result += '</tr><tr>';
        }
      }
      commandCount++;
    }
  }
  if (format === 'compact') {
    result += '<tr>';
  }
  result += '</table>';
  return result;
}

export function generateCommandsDocumentation(cat, freq) {
  let result = '';
  freq = freq || 0;

  if (!cat) {
    // If no category specified, generate documentation for all
    // categories
    commandCount = 0;
    deferred = '';

    result += [
      'Operators',
      'Trigonometry',
      'Functions',
      'Extensible Operators',
      'Logic',
      'Arrows',
      'Negated Arrows',
      'Extensible Symbols',
      'Relations',
      'Negated Relations',
      'Sets',
      'Greek',
      'Hebrew',
      'Letterlike Symbols',
      'Fractions',
      'Fences',
      'Punctuation',
      'Boxes',
      'Circles',
      'Triangles',
      'Shapes',
      'Crosses',
      'Various',
      'Accents',
      'Layout',
      'Spacing',
      'Decoration',
      'Styling',
      'Sizing',
      'None',
    ]
      .map((x) => generateCommandsDocumentation(x, freq))
      .join('');

    result += generateDocumentationForEnvironments(freq);

    if (deferred.length > 0) {
      result += '<h3>See Also</h3>';
      result += deferred;
    }

    result += '<hr><footnote><p>' + commandCount + ' commands.</p></footnote>';

    // console.log(all.join('\n'));
  } else {
    let count = 0;
    let rejected = 0;
    result += '<h3>' + cat + '</h3>';
    // result += '<table class="compact-definition-table">';
    // result += '<tr>';
    Object.keys(debug.MATH_SYMBOLS).forEach((s) => {
      if (
        (freq === 'unknown' &&
          typeof debug.MATH_SYMBOLS[s].frequency === 'undefined') ||
        (debug.MATH_SYMBOLS[s].frequency || 0) >= freq
      ) {
        const def = generateDocumentationForSymbol(
          cat,
          s,
          debug.MATH_SYMBOLS[s]
        );
        if (def.length > 0) {
          // result += '<td>' + def + '</td>';
          result += def;
          count++;
          // if (count % 4 === 0) {
          //   result += '</tr><tr>';
          // }
        }
      } else {
        rejected++;
      }
    });
    Object.keys(debug.FUNCTIONS).forEach((s) => {
      if (
        (freq === 'unknown' &&
          typeof debug.FUNCTIONS[s].frequency === 'undefined') ||
        (debug.FUNCTIONS[s].frequency || 0) >= freq
      ) {
        const def = generateDocumentationForFunction(
          cat,
          s,
          debug.FUNCTIONS[s]
        );
        if (def.length > 0) {
          // result += '<td>' + def + '</td>';
          result += def;
          count++;
          // if (count % 4 === 0) {
          //   result += '</tr><tr>';
          // }
        }
      } else {
        rejected++;
      }
    });
    result += '</tr></table>';
    if (rejected !== 0) {
      result +=
        '<a class="pill" href="?cat=' +
        encodeURIComponent(cat) +
        '">More...</a>';
    }
    if (count === 0) {
      result = '';
      deferred +=
        '<a class="pill" href="?cat=' +
        encodeURIComponent(cat) +
        '">' +
        cat +
        '</a><br>';
    }

    commandCount += count;
  }

  return result;
}

export function generateKeybindingsDocumentation(mode) {
  // Shortcuts.DEFAULT_KEYBINDINGS
  // let result = '<table>';
  // result += '<tr><th>Keystroke</th><th>Command</th><th>OS</th></tr>';

  let result = '';

  const keybindings = debug.DEFAULT_KEYBINDINGS;

  let previousCommand = '';
  result +=
    // '<tr>' +
    '<br>|' +
    keybindings
      .map((keybinding) => {
        if (mode && keybinding.ifMode !== mode) return undefined;
        let r =
          // '<td><kbd>' +
          ' `' + debug.getKeybindingMarkup(keybinding.key) + '`  ';
        // '</kbd></td>';
        // r += '<td>';
        r += '| ';
        if (keybinding.command.toString() === previousCommand) {
          r += '\u3003';
        } else {
          if (Array.isArray(keybinding.command)) {
            if (keybinding.command[0] === 'insert') {
              r +=
                '$$' +
                keybinding.command[1].replace('#@', '\\unicode{"2B1A}') +
                '$$ &nbsp;&mdash;';
              r += '`' + keybinding.command[1] + '`';
              // } else if (shortcuts[shortcut][0] === 'apply-style') {
            } else {
              r +=
                keybinding.command[0] +
                '(' +
                JSON.stringify(keybinding.command[1]) +
                ')';
            }
          } else {
            r += keybinding.command
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .toLowerCase();
          }
        }
        previousCommand = keybinding.command.toString();

        // r += '<td>';
        r += ' | ';
        if (/^(macos|ios)$/.test(keybinding.ifPlatfom)) {
          // r += "<svg><use xlink:href='icons.svg#brand-apple' /></svg>";
          r += 'Apple';
        } else if (/^!(macos|ios)$/.test(keybinding.ifPlatfom)) {
          r += 'Windows/Linux';
          // r +=
          //   "<svg><use xlink:href='icons.svg#brand-windows' /></svg><svg><use xlink:href='icons.svg#brand-linux' /></svg>";
        }

        r += '|';
        return r;
      })
      .filter((x) => !!x)
      .join(' <br>|') +
    '|';

  result += '</table>';
  return result;
}

export function generateInlineShortcutsDocumentation(shortcuts) {
  // Shortcuts.INLINE_SHORTCUTS
  shortcuts = shortcuts || debug.INLINE_SHORTCUTS;
  // let result = '<table>';
  // result += '<tr><th>Trigger</th><th>Result</th></tr>';
  let result = '';
  for (const shortcut in shortcuts) {
    if (Object.prototype.hasOwnProperty.call(shortcuts, shortcut)) {
      // result += '<tr>';
      // result += '<td><kbd>' + shortcut + '</kbd></td>';
      result += '<br>|';
      result += ' `' + shortcut + '` |';
      let value = '';
      if (typeof shortcuts[shortcut] === 'string') {
        value = shortcuts[shortcut];
      } else {
        value = shortcuts[shortcut].value;
      }
      // result += '<td>$$' + value + '$$</td>';
      // result += '<td><tt>' + value + '</tt></td>';
      // result += '</tr>';
      result += ' $$' + value + '$$ ';
      result += ' `' + value + '` |';
    }
  }
  // result += '</table>';
  return result;
}
