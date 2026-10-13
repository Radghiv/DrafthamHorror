// Languages ArkhamDB has translations of the cards in, each on a site of its own with the same API as the English one. The translated
// sites give the names (and some texts) of the cards; their card images are the English ones, so the pictures don't change.
export const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'it', label: 'Italiano' },
    { code: 'pl', label: 'Polski' },
    { code: 'pt', label: 'Português' },
    { code: 'ko', label: '한국어' },
    { code: 'ru', label: 'Русский' },
    { code: 'uk', label: 'Українська' },
    { code: 'zh', label: '中文' }
]

export function isLanguage(code) {
    return LANGUAGES.some(language => language.code === code)
}

// what is 'cards' or 'packs'
export function translationUrl(code, what = 'cards') {
    return 'https://' + code + '.arkhamdb.com/api/public/' + what + '/'
}

// How the translated sites end the name of an investigator expansion (in English it is " Investigator Expansion"); the collection shows
// the packs without it
export const EXPANSION_SUFFIX = {
    de: /\s*\(Ermittler-Erweiterung\)$/,
    es: /\s+Expansión de investigadores$/,
    fr: /\s+–\s+Extension Investigateurs$/,
    it: /,\s*Espansione Investigatori$/,
    pl: /\s+-\s+Rozszerzenie badaczy$/,
    pt: /\s+Expansão de Investigador$/,
    ko: /\s*조사자 확장$/,
    ru: /\.\s*Сыщики$/,
    uk: /\s+Дослідницьке доповнення$/,
    zh: /調查員擴充$/
}
