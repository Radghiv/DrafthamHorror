import { useCallback } from 'react'
import { useSelector } from 'react-redux'

// The texts of the interface. The English text is its own key: t('Start draft') is shown as is in English and looked up in the
// dictionary of the language chosen otherwise (src/i18n/locales/<language>.json: { "Start draft": "Inizia il draft" }); a text without a
// translation is shown in English. Texts can have
//   {name}   places for values:    t('Drafted {name}', { name: card.name })
//   a|b      plural forms:         t('{count} card|{count} cards', { count: 3 })
// In a dictionary the plural forms are in the order of PLURAL_ORDER, only those the language has (Intl.PluralRules): English and most
// others have "one|other"; Russian, Ukrainian and Polish "one|few|many|other"... see pluralForms below; Korean and Chinese just "other".
// The keys must be string literals in t(...) (or msg(...), for texts that are kept in a table and translated when shown), so that
// scripts/i18n-scan.mjs finds them.

const PLURAL_ORDER = ['zero', 'one', 'two', 'few', 'many', 'other']

const dictionaries = {}

let currentLanguage = 'en'

// the forms of the plural of a language, in the order they are written in a dictionary
export function pluralForms(language) {
    const categories = new Intl.PluralRules(language).resolvedOptions().pluralCategories

    // in Spanish, French, Italian and Portuguese "many" is only for millions ("1 million of cards"): it is written as "other"
    const withoutMany = ['es', 'fr', 'it', 'pt'].includes(language)

    return PLURAL_ORDER.filter(category => categories.includes(category) && !(withoutMany && category === 'many'))
}

// The dictionaries, each loaded (as a chunk of its own) when its language is chosen. import.meta.glob is what Vite can bundle: a plain
// import('./locales/' + language + '.json') would be left as it is and fail in the production build.
const localeLoaders = import.meta.glob('./locales/*.json', { import: 'default' })

// Loads the dictionary of a language (English has none: its texts are the keys)
export async function loadLocale(language) {
    if (language === 'en' || dictionaries[language]) return

    try {
        const load = localeLoaders['./locales/' + language + '.json']

        dictionaries[language] = load ? await load() : {}
    }
    catch (error) {
        dictionaries[language] = {}
    }
}

// The language the plain t() uses; the components use useT() instead, which also makes them show the new language when it changes
export function setCurrentLanguage(language) {
    currentLanguage = language

    if (typeof document !== 'undefined') document.documentElement.setAttribute('lang', language)
}

function fill(text, vars) {
    if (!vars) return text

    return text.replace(/\{(\w+)\}/g, (match, name) => name in vars ? String(vars[name]) : match)
}

export function translateTo(language, text, vars) {
    const dictionary = dictionaries[language]
    const translated = dictionary && dictionary[text]

    if (text.includes('|') && vars && typeof vars.count === 'number') {
        const forms = (translated || text).split('|')

        // without a translation the English forms are used: one and other
        const categories = translated ? pluralForms(language) : ['one', 'other']
        const category = new Intl.PluralRules(translated ? language : 'en').select(vars.count)
        const index = categories.indexOf(category)

        return fill(forms[index >= 0 && index < forms.length ? index : forms.length - 1], vars)
    }

    return fill(translated || text, vars)
}

// Marks a text that is translated later, when it is shown: a text in a table, say, that is kept until it is rendered with t(variable). It
// returns the text unchanged; its purpose is to put the text in the catalog.
export function msg(text) {
    return text
}

export function t(text, vars) {
    return translateTo(currentLanguage, text, vars)
}

// For components: the translating function of the language chosen, which changes (and so renders the component again) when the language does
export function useT() {
    const language = useSelector(state => state.settings.language)

    return useCallback((text, vars) => translateTo(language, text, vars), [language])
}

// A date or time in the language chosen. A date without a time ("2023-10-10", as ArkhamDB gives the dates of the taboo lists) is the same day
// everywhere: it is written in UTC, so that a time zone can't move it.
export const LONG_DATE = { day: 'numeric', month: 'long', year: 'numeric' }

export function formatDate(language, value, options) {
    const date = new Date(value)

    if (isNaN(date)) return String(value)

    const dateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

    return new Intl.DateTimeFormat(language, dateOnly ? { ...options, timeZone: 'UTC' } : options).format(date)
}

// For components: formatDate in the language chosen
export function useFormatDate() {
    const language = useSelector(state => state.settings.language)

    return useCallback((value, options) => formatDate(language, value, options), [language])
}

// The texts that have a translation, for the tests
export function loadedDictionary(language) {
    return dictionaries[language]
}
