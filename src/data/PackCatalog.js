import { displayPackName } from './PackData'
import { CORE_CODES } from './CollectionGroups'
import { msg } from '../i18n'

// Titles of cycles that gather several unrelated packs; any other cycle takes the name of its first pack
const CYCLE_TITLES = {
    1: msg('Core'),
    50: msg('Return to Boxes'),
    60: msg('Starter Decks'),
    61: msg('Starter Decks 2026'),
    80: msg('Promos'),
    90: msg('Print & Play')
}

// The side stories (cycle 70, one of them has player cards) and the standalone scenarios (cycle 90) are all print and play: one group
const MERGED_CYCLES = { 70: 90 }

// What a group is when it isn't an expansion (the core sets are told by their pack codes): the recap of the collection counts expansions
// apart from these
const CYCLE_KINDS = { 50: 'return', 60: 'starter', 61: 'starter', 80: 'promo', 90: 'printplay' }

const PLAYER_CARD_TYPES = ['asset', 'event', 'skill']

// Chapter 2 of the game starts with the 2026 core set: the packs that came out from its release on belong to it (the date is the one of
// the core set in the pack list; the fallback is for a list that doesn't have it yet). Everything before is Chapter 1.
const CHAPTER_2_FIRST_PACK = 'core_2026'
const CHAPTER_2_FALLBACK_DATE = '2026-03-20'
const CHAPTER_2_CYCLES = [61]

function chapterOf(pack, start) {
    if (pack.code === CHAPTER_2_FIRST_PACK || CHAPTER_2_CYCLES.includes(pack.cycle_position)) return 2

    return pack.available && pack.available >= start ? 2 : 1
}

// Codes of the packs that bring something to draft: cards of their own (not reprints) that are player cards or investigators
function packsWithPlayerCards(cardData) {
    const codes = new Set()

    cardData.forEach(card => {
        if (card.duplicate_of_code) return

        if (card.type_code === 'investigator' || (PLAYER_CARD_TYPES.includes(card.type_code) && card.faction_code !== 'mythos')) {
            codes.add(card.pack_code)
        }
    })

    return codes
}

// The card whose art stands for a group of packs: its first investigator (the first pack, then the card number), or without investigators its
// first player card. Reprints and hidden cards don't count.
function artCard(cyclePacks, cardData) {
    const order = new Map(cyclePacks.map((pack, index) => [pack.code, index]))
    const own = cardData.filter(card => order.has(card.pack_code) && !card.duplicate_of_code && !card.hidden)
    const byOrder = (a, b) => order.get(a.pack_code) - order.get(b.pack_code) || a.position - b.position
    const investigator = own.filter(card => card.type_code === 'investigator').sort(byOrder)[0]

    if (investigator) return investigator

    return own.filter(card => PLAYER_CARD_TYPES.includes(card.type_code) && card.faction_code !== 'mythos').sort(byOrder)[0] || null
}

// The groups the collection is chosen from, built from the pack list of ArkhamDB and its cards: the packs of a cycle together, in
// release order (the ones of Chapter 1 first, then the ones of Chapter 2: a cycle that has packs of both is split), and only the packs that
// have something to draft. New packs show up here as soon as ArkhamDB has them. The titles are the
// name of the first pack of the cycle (packName gives the name of a pack to show) or one of the fixed ones above (translate shows them).
export function buildCollectionGroups(packs, cardData, packName = pack => displayPackName(pack.name), translate = text => text) {
    const relevant = packsWithPlayerCards(cardData)
    const chapterTwoStart = (packs.find(pack => pack.code === CHAPTER_2_FIRST_PACK) || {}).available || CHAPTER_2_FALLBACK_DATE
    const byCycle = new Map()

    packs.filter(pack => relevant.has(pack.code)).forEach(pack => {
        const key = chapterOf(pack, chapterTwoStart) + ':' + (MERGED_CYCLES[pack.cycle_position] || pack.cycle_position)

        if (!byCycle.has(key)) byCycle.set(key, [])
        byCycle.get(key).push(pack)
    })

    // the core sets come first in their chapter and the starter decks right after them; then the cycles in release order
    const rankOf = key => {
        const codes = byCycle.get(key).map(pack => pack.code)

        if (codes.every(code => CORE_CODES.includes(code))) return 0

        return CYCLE_KINDS[Number(key.split(':')[1])] === 'starter' ? 1 : 2
    }

    // by chapter, then by that, then by cycle
    const keys = Array.from(byCycle.keys()).sort((a, b) => {
        const [chapterA, cycleA] = a.split(':').map(Number)
        const [chapterB, cycleB] = b.split(':').map(Number)

        return chapterA - chapterB || rankOf(a) - rankOf(b) || cycleA - cycleB
    })

    return keys.map(key => {
        const [chapter, cycle] = key.split(':').map(Number)
        const cyclePacks = byCycle.get(key).sort((a, b) => a.cycle_position - b.cycle_position || a.position - b.position)
        const codes = cyclePacks.map(pack => pack.code)

        // the second copy of the core set only matters for its quantities: it travels with the core set
        if (codes.includes('core')) codes.splice(codes.indexOf('core') + 1, 0, 'core2')

        const kind = codes.every(code => CORE_CODES.includes(code)) ? 'core' : CYCLE_KINDS[cycle]

        return { title: CYCLE_TITLES[cycle] ? translate(CYCLE_TITLES[cycle]) : packName(cyclePacks[0]), codes: codes, chapter: chapter, kind: kind, art: artCard(cyclePacks, cardData) }
    })
}
