import { isNumberObject, isSymbolObject, isFunctionObject } from './utils';
import { Dictionary, Expression } from './public';

export function getWikidata(dictionary: Dictionary, json: Expression): string {
    if (typeof json === 'number') return '';
    if (isNumberObject(json)) {
        if (json.wikidata) return json.wikidata;
        return '';
    }
    if (typeof json === 'string') {
        const def = dictionary[json];
        if (def) return def.wikidata ?? '';
        return '';
    }
    if (isSymbolObject(json)) {
        if (json.wikidata) return json.wikidata;
        const def = dictionary[json.sym[0] as string];
        if (def) return def.wikidata ?? '';
        return '';
    }
    if (Array.isArray(json)) {
        const fnDef = dictionary[json[0] as string];
        if (fnDef) return fnDef.wikidata ?? '';
        const opDef = dictionary.operators[json[0] as string];
        if (opDef) return opDef.wikidata ?? '';

        return '';
    }
    if (isFunctionObject(json)) {
        if (json.wikidata) return json.wikidata;
        const fnDef = dictionary[json.fn[0] as string];
        if (fnDef) return fnDef.wikidata ?? '';
        const opDef = dictionary[json.fn[0] as string];
        if (opDef) return opDef.wikidata ?? '';
        return '';
    }
    return '';
}

// class SPARQLQueryDispatcher {
//     readonly endpoint: string;
//     constructor(endpoint = 'https://query.wikidata.org/sparql') {
//         this.endpoint = endpoint;
//     }

//     query(sparqlQuery: string): Promise<string> {
//         const fullUrl =
//             this.endpoint + '?query=' + encodeURIComponent(sparqlQuery);
//         const headers = { Accept: 'application/sparql-results+json' };

//         return fetch(fullUrl, { headers }).then((body) => body.json());
//     }
// }

// const queryDispatcher = new SPARQLQueryDispatcher();
// queryDispatcher
//     .query(
//         `
// SELECT ?item ?itemLabel
// WHERE
// {
//   ?item wdt:P31 wd:Q2934.
//   SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
// }`
//     )
//     .then(console.log);
