import DraftPhases from '../data/DraftPhases'
import ResearchLogs from '../data/ResearchLogs'

// Sealed is the alternative to the draft: a pool of random cards is dealt face up, all at once, and the cards are picked from it. It is for a new
// deck (the pool is the level 0 cards the investigator can take), the upgrades (level 1+ cards that cost no more than the experience to spend; a
// card leaves the pool when it costs more than what is left) and the small drafts that come with them: the bonus experience of a new deck, the level 0
// replacements and Versatile. The size of a pool is a percentage over the cards to pick (+100%: twice as many), so it fits every phase.

export const SEALED_MAX_EXTRA = 500

// the small phases have their own percentage, which overrides the general one
export const SEALED_SMALL_PHASES = [DraftPhases.BuildUpgradePhase, DraftPhases.UpgradeLevel0AddPhase, DraftPhases.VersatilePhase]

const SEALED_PHASES = [DraftPhases.BuildPhase1, DraftPhases.UpgradePhase, ...SEALED_SMALL_PHASES]

// The settings of the mode; a saved draft from before the mode existed gets them from here (restoreSettings)
export const SEALED_SETTINGS = {
    // 'draft' (a few cards at a time, a new batch after each pick) or 'sealed'
    deckbuilding: 'draft',
    // the cards dealt over the ones to pick, in percent: +100% deals twice as many
    sealedExtra: 100,
    // the percentage of a small phase, by phase, when it is not the general one
    sealedPhaseExtra: {},
    // a card that was picked stays in the pool until the deck has two copies of it
    sealedCopies: false,
    // the same card can be dealt into the pool more than once: each is a card of its own, taken out of the pool when it is picked, and the deck
    // can have two copies of a card (so the copies above don't apply)
    sealedDuplicates: false
}

// Whether the cards to choose from are a sealed pool: the mode is chosen and the phase is one of those that have it
export function isSealedDraft(deckbuilding, phase) {
    return deckbuilding === 'sealed' && SEALED_PHASES.includes(phase)
}

// Whether a phase is paid in experience (the cards to pick are not known: they depend on the costs)
export function isSealedXpPhase(phase) {
    return phase === DraftPhases.BuildUpgradePhase || phase === DraftPhases.UpgradePhase
}

// The percentage over the cards to pick that a phase deals: its own when it is a small phase that has one, otherwise the general one
export function sealedExtraFor(settings, phase) {
    const own = SEALED_SMALL_PHASES.includes(phase) && settings.sealedPhaseExtra ? settings.sealedPhaseExtra[phase] : undefined

    return typeof own === 'number' ? own : settings.sealedExtra
}

// The cards of a pool: the cards to pick with the percentage over them
export function sealedPoolSizeFor(needed, extra) {
    return needed > 0 ? Math.ceil(needed * (1 + extra / 100)) : 0
}

// The same, for the build of a new deck only (what an upgrade has no use for: taking a card out of the Draft List, the proportions of the classes)
export function isSealedBuild(deckbuilding, phase) {
    return deckbuilding === 'sealed' && phase === DraftPhases.BuildPhase1
}

// How many copies of a card the deck can have: one, or two when the copies are allowed (a card limited to one copy is always one)
export function sealedMaxCopies(card, copiesAllowed) {
    return copiesAllowed ? Math.max(1, Math.min(2, card.deck_limit || 1)) : 1
}

// Whether the pool can hold a deck: every card of the pool, once or twice, has to be enough for the cards the deck is made of. With duplicates the
// pool can be as big as asked, but holds at most two of each card.
export function sealedPoolFillsDeck(poolSize, copiesAllowed, legalCount, deckSize, duplicates) {
    if (duplicates) return Math.min(poolSize, legalCount * 2) >= deckSize

    return Math.min(poolSize, legalCount) * (copiesAllowed ? 2 : 1) >= deckSize
}

// What tells the cards of the pool apart: the place they were dealt in (a card can be in the pool more than once), or the card for a pool
// saved before that
export function sealedEntryId(card) {
    return card.poolId !== undefined ? card.poolId : card.key
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
