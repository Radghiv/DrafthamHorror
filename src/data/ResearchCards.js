// The cards of a research family: a card that has to be researched (Strange Solution, Forbidden Tome...) and the versions it becomes once it
// is, which have the same name, a subtitle of their own and a text that starts with "Researched.". ArkhamDB doesn't link them (no bonded
// cards), so they are found by name.
function isResearched(card) {
    return /^Researched\./.test(card.text || '')
}

// The cards connected to a card of a research family, for its preview: the card to research first, then the researched versions. The card
// itself is left out, and so are the cards that are not a family (the same name without any researched version), reprints and hidden cards.
// Gives [] for any other card.
export function researchConnected(card, cardData) {
    if (!card || !cardData) return []

    const family = cardData.filter(other => other.name === card.name && !other.duplicate_of_code && !other.hidden)

    if (family.length < 2 || !family.some(isResearched)) return []

    return family
        .filter(other => other.code !== card.code)
        .sort((a, b) => Number(isResearched(a)) - Number(isResearched(b)) || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0))
}
