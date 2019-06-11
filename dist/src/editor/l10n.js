


export function l10n(s) {

    const language = l10n.locale.substring(0, 2);

    let result = '';

    // Attempt to find a match for the current locale
    if (l10n.strings[l10n.locale]) result = l10n.strings[l10n.locale][s];
    // If none is found, attempt to find a match for the language
    if (!result && l10n.strings[language]) result = l10n.strings[language][s];
    // If none is found, try english
    if (!result) result = l10n.strings['en'][s];
    // If that didn't work, use the key...
    if (!result) result = s;

    return result;

}


/**
 * Two forms for this function:
 * - merge(locale, strings)
 * Merge a dictionary of keys -> values for the specified locale
 * - merge(strings)
 * Merge a dictionary of locale code -> dictionary of keys -> values
 * 
 */
l10n.merge = function(locale, strings) {
    if (locale && strings) {
        const savedLocale = l10n._locale;
        l10n.locale = locale;   // Load the necessary json file if necessary

        l10n.strings[locale] = {...l10n.strings[locale], ...strings };
        l10n.locale = savedLocale;
    } else if (locale && !strings) {
        strings = locale;
        for (const l in strings) {
            if (strings.hasOwnProperty(l)) {
                l10n.merge(l, strings[l]);
            }
        }
    }
}


// Add getter and setter for the _locale property of l10n
Object.defineProperty(l10n, 'locale', { 
    set(locale) {
        l10n._locale = locale
    },
    get() {
        // Use the browser defined language as the default language,
        // "english" if not running in a browser (node.js)
        if (!l10n._locale) {
            // Use the setter, which will load the necessary .json files.
            l10n._locale = typeof navigator === 'undefined' ? 'en' : 
                navigator.language.slice(0, 5);
        }
        return l10n._locale
    }
});


l10n.strings = {
    "en": {
        "keyboard.tooltip.functions": "Functions",
        "keyboard.tooltip.greek": "Greek Letters",
        "keyboard.tooltip.command": "LaTeX Command Mode",
        "keyboard.tooltip.numeric": "Numeric",
        "keyboard.tooltip.roman": "Symbols and Roman Letters",
        "tooltip.copy to clipboard": "Copy to Clipboard",
        "tooltip.redo": "Redo",
        "tooltip.toggle virtual keyboard": "Toggle Virtual Keyboard",
        "tooltip.undo": "Undo"
    },
    "ar": {
      "keyboard.tooltip.functions": "مهام",
      "keyboard.tooltip.greek": "حروف يونانية",
      "keyboard.tooltip.command": "حالة تلقي الأوامر اللاتك",
      "keyboard.tooltip.numeric": "الرقمية",
      "keyboard.tooltip.roman": "رموز الاحرف الرومانية",
      "tooltip.copy to clipboard": "نسخ إلى الحافظة",
      "tooltip.redo": "الإعادة",
      "tooltip.toggle virtual keyboard": "تبديل لوحة المفاتيح الإفتراضية",
      "tooltip.undo": "إلغاء"
    },
    "de": {
        "keyboard.tooltip.functions": "Funktionen",
        "keyboard.tooltip.greek": "Griechische Buchstaben",
        "keyboard.tooltip.command": "LaTeX-Befehlsmodus",
        "keyboard.tooltip.numeric": "Numerisch",
        "keyboard.tooltip.roman": "Symbole und römische Buchstaben",
        "tooltip.copy to clipboard": "In die Zwischenablage kopieren",
        "tooltip.redo": "Wiederholen",
        "tooltip.toggle virtual keyboard": "Virtuelle Tastatur umschalten",
        "tooltip.undo": "Widerrufen"
    },
    "es": {
        "keyboard.tooltip.functions": "Funciones",
        "keyboard.tooltip.greek": "Letras griegas",
        "keyboard.tooltip.command": "Modo Comando LaTeX",
        "keyboard.tooltip.numeric": "Numérico",
        "keyboard.tooltip.roman": "Símbolos y letras romanas",
        "tooltip.copy to clipboard": "Copiar al portapapeles",
        "tooltip.redo": "Rehacer",
        "tooltip.toggle virtual keyboard": "Alternar teclado virtual",
        "tooltip.undo": "Deshacer"
    },
    "fa": {
      "keyboard.tooltip.functions": "توابع",
      "keyboard.tooltip.greek": "حروف یونانی",
      "keyboard.tooltip.command": "حالت دستور لاتک",
      "keyboard.tooltip.numeric": "عددی",
      "keyboard.tooltip.roman": "علائم و حروف لاتین",
      "tooltip.copy to clipboard": "کپی به کلیپبورد",
      "tooltip.redo": "بازگشت به بعد",
      "tooltip.toggle virtual keyboard": "نمایش/نهفتن کیبورد مجازی",
      "tooltip.undo": "بازگشت به قبل"
    },
    "fr": {
        "keyboard.tooltip.functions": "Fonctions",
        "keyboard.tooltip.greek": "Lettres grecques",
        "keyboard.tooltip.command": "Mode de commandes LaTeX",
        "keyboard.tooltip.numeric": "Numérique",
        "keyboard.tooltip.roman": "Lettres et symboles romains",
        "tooltip.copy to clipboard": "Copier dans le presse-papiers",
        "tooltip.redo": "Rétablir",
        "tooltip.toggle virtual keyboard": "Afficher/Masquer le clavier virtuel",
        "tooltip.undo": "Annuler"
    },
    "it": {
        "keyboard.tooltip.functions": "Funzioni",
        "keyboard.tooltip.greek": "Lettere greche",
        "keyboard.tooltip.command": "Modalità di comando LaTeX",
        "keyboard.tooltip.numeric": "Numerico",
        "keyboard.tooltip.roman": "Simboli e lettere romane",
        "tooltip.copy to clipboard": "Copia negli appunti",
        "tooltip.redo": "Rifare",
        "tooltip.toggle virtual keyboard": "Attiva / disattiva la tastiera virtuale",
        "tooltip.undo": "Disfare"
    },
    "ja": {
        "keyboard.tooltip.functions": "関数",
        "keyboard.tooltip.greek": "ギリシャ文字",
        "keyboard.tooltip.command": "LaTeXコマンドモード",
        "keyboard.tooltip.numeric": "数値",
        "keyboard.tooltip.roman": "記号とローマ字",
        "tooltip.copy to clipboard": "クリップボードにコピー",
        "tooltip.redo": "やり直し",
        "tooltip.toggle virtual keyboard": "仮想キーボードの切り替え",
        "tooltip.undo": "元に戻す"
    },
    "pl": {
        "keyboard.tooltip.functions": "Funkcje",
        "keyboard.tooltip.greek": "Litery greckie",
        "keyboard.tooltip.command": "Tryb poleceń LaTeX",
        "keyboard.tooltip.numeric": "Numeryczne",
        "keyboard.tooltip.roman": "Symbole i litery rzymskie",
        "tooltip.copy to clipboard": "Kopiuj do Schowka",
        "tooltip.redo": "Przywróć",
        "tooltip.toggle virtual keyboard": "Przełącz wirtualną klawiaturę",
        "tooltip.undo": "Cofnij"
    },
    "ru": {
        "keyboard.tooltip.functions": "Функции",
        "keyboard.tooltip.greek": "Греческие буквы",
        "keyboard.tooltip.command": "Режим командной строки LaTeX",
        "keyboard.tooltip.numeric": "числовой",
        "keyboard.tooltip.roman": "Символы и римские буквы",
        "tooltip.copy to clipboard": "Скопировать в буфер обмена",
        "tooltip.redo": "переделывать",
        "tooltip.toggle virtual keyboard": "Переключить виртуальную клавиатуру",
        "tooltip.undo": "расстегивать"
    }
};


export default {
    l10n
}