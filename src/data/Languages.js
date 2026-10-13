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

export function translationUrl(code) {
    return 'https://' + code + '.arkhamdb.com/api/public/cards/'
}
