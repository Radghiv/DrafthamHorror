import { t } from '../i18n'

// Lily Chen's deck requirement lists only her shared card; the four elemental versions of her signature asset are options to choose from
const LILY_CHEN_VERSIONS = ['08011a', '08012a', '08013a', '08014a']

// The quantity of a required card in the deck. Occult Evidence depends on the size of the deck, Burden of Destiny is a single card.
export function requiredQuantity(card, deckSize) {
    if (card.name === 'Occult Evidence') {
        if (String(deckSize) === '50') return 3
        if (String(deckSize) === '40') return 2
        return 1
    }

    if (card.name === 'Burden of Destiny') return 1

    return card.quantity || 1
}

// The unique cards the deckbuilding instructions of an investigator put in the deck by themselves, as { card, count } entries, in
// the order of the instructions. Alternatives of a requirement are reprints of the same card, so only the first one is listed. The
// note says what else comes with them (they are not specific cards).
export function requiredCards(investigator, cardData, deckSize) {
    const empty = { cards: [], note: '' }

    if (!investigator || !cardData || !investigator.deck_requirements) return empty

    const byCode = new Map()
    cardData.forEach(card => byCode.set(card.code, card))

    const requirements = investigator.deck_requirements.card || {}
    // the key of a requirement is the original card (the object keys that look like numbers would be listed first, whatever their order)
    let codes = Object.keys(requirements).map(key => key in requirements[key] ? key : Object.values(requirements[key])[0])
    const notes = []

    if (investigator.name === 'Lily Chen') {
        codes = codes.concat(LILY_CHEN_VERSIONS)
        notes.push(t('One of the four elemental versions'))
    }

    const random = investigator.deck_requirements.random || []

    if (random.some(item => item.target === 'subtype' && item.value === 'basicweakness')) notes.push(t('+ 1 random basic weakness'))

    const cards = codes
        .map(code => byCode.get(code))
        .filter(card => card)
        .map(card => ({ card: card, count: requiredQuantity(card, deckSize) }))

    return { cards: cards, note: notes.join(' · ') }
}

// The signature cards of an investigator grouped by version, for the export: up to four groups of card codes (ArkhamDB lists reprints
// and alternate versions of a signature card as alternatives of one requirement; version n of every card goes in group n). The groups
// are ordered by their first card. With more than one group the user chooses which version to export.
export function signatureGroups(investigator) {
    const groups = [[], [], [], []]
    let hasChoice = false

    if (investigator.name === 'Lily Chen') {
        LILY_CHEN_VERSIONS.forEach((code, index) => groups[index].push(code, '08015'))

        return { groups: groups, hasChoice: true }
    }

    const requirements = investigator.deck_requirements.card

    Object.keys(requirements).forEach(key => {
        const alternatives = Object.keys(requirements[key])

        if (alternatives.length > 1) hasChoice = true

        alternatives.forEach((alternative, index) => groups[index].push(requirements[key][alternative]))
    })

    groups.sort((a1, a2) => {
        if (a1.length === 0) return 1
        if (a2.length === 0) return -1

        return parseInt(a1[0]) - parseInt(a2[0])
    })

    return { groups: groups, hasChoice: hasChoice }
}
