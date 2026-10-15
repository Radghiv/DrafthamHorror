// The investigator list is built from the ArkhamDB card data, so new investigators show up without touching the code. Same-name
// versions are listed as "Name (Parallel)" or "Name (Pack)", and Agatha Crane has one entry per class because her two cards can't be
// told apart by deck options.
export const AGATHA_ENTRIES = {
    'Agatha Crane (Seeker)': 'seeker',
    'Agatha Crane (Mystic)': 'mystic'
}

export function isParallelEntry(entry) {
    return /\s\(Parallel\)$/.test(entry)
}

// Finds the investigator card of a list entry in the ArkhamDB card list, mirroring the lookup in changeInvestigatorList
export function findInvestigatorCard(entry, cards) {
    let name = entry
    let parallel = false
    let set = null
    let faction = null

    if (AGATHA_ENTRIES[entry]) {
        name = 'Agatha Crane'
        faction = AGATHA_ENTRIES[entry]
    }
    else {
        const parallelMatch = entry.match(/(.*)(\s\(Parallel\))/)
        const setMatch = entry.match(/^(.*?)\s*\((.*)\)$/)

        if (parallelMatch) {
            name = parallelMatch[1]
            parallel = true
        }
        else if (setMatch) {
            name = setMatch[1]
            set = setMatch[2]
        }
    }

    return cards.find(item => item.type_code === 'investigator'
        && item.name === name
        && !item.hidden
        && !item.duplicate_of_code
        && (faction === null || item.faction_code === faction)
        && (parallel ? typeof item.alternate_of_name !== 'undefined' : (typeof item.alternate_of_name === 'undefined' || set !== null))
        && (set === null || item.pack_name === set))
}

const cache = new WeakMap()

// The entries of the investigator list, sorted by name, built from the card data: one per investigator, plus one for each other
// printing with the same name and one for the parallel version
export function investigatorEntries(cardData) {
    if (!cardData) return []
    if (cache.has(cardData)) return cache.get(cardData)

    const byName = new Map()

    cardData.forEach(card => {
        // reprints and hidden cards (promo copies, extra sides) are not investigators of their own
        if (card.type_code !== 'investigator' || card.duplicate_of_code || card.hidden) return

        if (!byName.has(card.name)) byName.set(card.name, [])
        byName.get(card.name).push(card)
    })

    const entries = []

    Array.from(byName.keys()).sort((a, b) => a.localeCompare(b)).forEach(name => {
        if (name === 'Agatha Crane') {
            entries.push(...Object.keys(AGATHA_ENTRIES))
            return
        }

        const cards = byName.get(name)

        cards.filter(card => !card.alternate_of_code).forEach((card, index) => {
            entries.push(index === 0 ? name : name + ' (' + card.pack_name + ')')
        })

        if (cards.some(card => card.alternate_of_code)) entries.push(name + ' (Parallel)')
    })

    cache.set(cardData, entries)

    return entries
}

// Whether the collection has an investigator: the pack of the card is in it, or the pack of a reprint of the card (the investigators of the
// Revised Core Set are the ones of the Core Set)
export function investigatorInCollection(card, cardByCode, collection) {
    if (collection[card.pack_code]) return true

    return (card.duplicated_by || []).some(code => {
        const reprint = cardByCode.get(code)

        return Boolean(reprint) && Boolean(collection[reprint.pack_code])
    })
}

const ownedCache = new WeakMap()

// The entries of the investigator list that the collection has, by pack. An entry whose card can't be found is kept (nothing says it isn't owned).
export function ownedInvestigatorEntries(cardData, collection) {
    if (!cardData) return []

    let byCollection = ownedCache.get(cardData)

    if (!byCollection) {
        byCollection = new WeakMap()
        ownedCache.set(cardData, byCollection)
    }

    if (byCollection.has(collection)) return byCollection.get(collection)

    const cardByCode = new Map(cardData.map(card => [card.code, card]))

    const owned = investigatorEntries(cardData).filter(entry => {
        const card = findInvestigatorCard(entry, cardData)

        return !card || investigatorInCollection(card, cardByCode, collection)
    })

    byCollection.set(collection, owned)

    return owned
}
