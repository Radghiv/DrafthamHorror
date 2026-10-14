// The page of a card on ArkhamDB, in the language chosen when ArkhamDB has a site in it (English is the main site)
export function cardPageUrl(code, language) {
    const host = language && language !== 'en' ? language + '.arkhamdb.com' : 'arkhamdb.com'

    return 'https://' + host + '/card/' + encodeURIComponent(code)
}
