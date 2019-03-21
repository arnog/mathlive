

// The primary keys in the STRINGS object are locale strings
// If there is a locale specific key, i.e. 'fr-CA', there should also be 
// a generic key for that language, i.e. 'fr'
// Each entry for a given language can have a '@metadata' key that can contain
// additional information, such as the name of the translator.
const STRINGS = {
    'en': {
        'tooltip.undo': 'Undo',
        'tooltip.redo': 'Redo',
        'tooltip.copy to clipboard': 'Copy to Clipboard',
        'tooltip.toggle virtual keyboard': 'Toggle Virtual Keyboard',
        'tooltip.Numeric': 'Numeric',
        'tooltip.Symbols and Roman Letters': 'Symbols and Roman Letters',
        'tooltip.Greek Letters': 'Greek Letters',
        'tooltip.Functions': 'Functions',
        'tooltip.LaTeX Command Mode': 'LaTeX Command Mode',
    },
    'fr': {
        'tooltip.undo': 'Annuler',
        'tooltip.redo': 'Refaire',
        'tooltip.copy to clipboard': 'Copier dans le Presse-papiers',
        'tooltip.toggle virtual keyboard': 'Afficher/Masquer le clavier virtuel',
        'tooltip.Numeric': 'Numerique',
        'tooltip.Symbols and Roman Letters': 'Lettres et symboles romains',
        'tooltip.Greek Letters': 'Lettres grecques',
        'tooltip.Functions': 'Fonctions',
        'tooltip.LaTeX Command Mode': 'Mode de commandes LaTeX',
    },
    'pl': {
        'tooltip.undo': 'Cofnij',
        'tooltip.redo': 'Przywróć',
        'tooltip.copy to clipboard': 'Kopiuj do Schowka',
        'tooltip.toggle virtual keyboard': 'Toggle Virtual Keyboard',
        'tooltip.Numeric': 'Numeryczne',
        'tooltip.Symbols and Roman Letters': 'Symbole i litery rzymskie',
        'tooltip.Greek Letters': 'Litery greckie',
        'tooltip.Functions': 'Funkcje',
        'tooltip.LaTeX Command Mode': 'Tryb poleceń LaTeX',
    },
}


export function i18n(s) {
    if (!i18n.locale) i18n.locale = typeof navigator !== 'undefined' ? navigator.language.slice(0, 5) : 'en';
    if (!i18n.strings) i18n.strings = STRINGS;

    i18n.merge = function(strings) {
        if (strings) {
            const mergedStrings = {...STRINGS};
            for (const locale in strings) {
                if (strings.hasOwnProperty(locale)) {
                    mergedStrings[locale] = { ...mergedStrings[locale], 
                        ...strings[locale] };
                }
            }

            i18n.strings = mergedStrings;
        }
    }

    const language = i18n.locale.substring(0, 2);

    let result = '';

    if (i18n.strings[i18n.locale]) result = i18n.strings[i18n.locale][s];
    if (!result && i18n.strings[language]) result = i18n.strings[language][s];
    if (!result) result = i18n.strings['en'][s];
    if (!result) result = s;

    return result;

}

export default {
    i18n
}