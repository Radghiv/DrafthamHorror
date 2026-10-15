import DraftPhases from '../data/DraftPhases'
import ResearchLogs from '../data/ResearchLogs'

// Sealed is the alternative to the draft for building a deck: a pool of random cards is dealt face up, all at once, and the deck is built from
// it. Only Build Deck has it (the pool is the level 0 cards the investigator can take); the phases after the build keep drafting as usual.

export const SEALED_MAX_POOL = 100

// The settings of the mode; a saved draft from before the mode existed gets them from here (restoreSettings)
export const SEALED_SETTINGS = {
    // 'draft' (a few cards at a time, a new batch after each pick) or 'sealed'
    deckbuilding: 'draft',
    // cards dealt into the pool
    sealedCount: 60,
    // a card that was picked stays in the pool until the deck has two copies of it
    sealedCopies: false
}

// Whether the cards to choose from are a sealed pool: the mode is chosen and the phase is the build of the deck
export function isSealedDraft(deckbuilding, phase) {
    return deckbuilding === 'sealed' && phase === DraftPhases.BuildPhase1
}

// How many copies of a card the deck can have: one, or two when the copies are allowed (a card limited to one copy is always one)
export function sealedMaxCopies(card, copiesAllowed) {
    return copiesAllowed ? Math.max(1, Math.min(2, card.deck_limit || 1)) : 1
}

// Whether the pool can hold a deck: every card of the pool, once or twice, has to be enough for the cards the deck is made of
export function sealedPoolFillsDeck(sealedCount, copiesAllowed, legalCount, deckSize) {
    return Math.min(sealedCount, legalCount) * (copiesAllowed ? 2 : 1) >= deckSize
}

// Cards whose pick changes the rules of the deck in ways that can't be taken back one card at a time (they remove other cards, or
// change what the research cards can do): they stay in the deck unless the pick is undone
const FIXED_PICKS = ['Underworld Support', 'On Your Own', 'Shrewd Analysis']

// Whether a card of the Draft List can be put back in the pool
export function sealedCardRemovable(card) {
    return !FIXED_PICKS.includes(card.name) && !ResearchLogs[card.name]
}

const CLASS_ORDER = ['guardian', 'seeker', 'rogue', 'mystic', 'survivor', 'neutral']

// The pool is shown by class, then by name, so a pool of a hundred cards can be browsed
export function compareSealedCards(a, b) {
    const classA = CLASS_ORDER.indexOf(a.faction_code)
    const classB = CLASS_ORDER.indexOf(b.faction_code)

    if (classA !== classB) return classA - classB

    return a.name.localeCompare(b.name) || a.key.localeCompare(b.key)
}
