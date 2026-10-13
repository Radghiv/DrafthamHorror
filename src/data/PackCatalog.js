import { displayPackName } from './PackData'
import { msg } from '../i18n'

// Titles of cycles that gather several unrelated packs; any other cycle takes the name of its first pack
const CYCLE_TITLES = {
    1: msg('Core'),
    50: msg('Return to Boxes'),
    60: msg('Starter Decks'),
    61: msg('Starter Decks 2026'),
    80: msg('Promos'),
    90: msg('Standalone scenarios')
}

const PLAYER_CARD_TYPES = ['asset', 'event', 'skill']

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

// The groups the collection is chosen from, built from the pack list of ArkhamDB and its cards: the packs of a cycle together, in
// release order, and only the packs that have something to draft. New packs show up here as soon as ArkhamDB has them. The titles are the
// name of the first pack of the cycle (packName gives the name of a pack to show) or one of the fixed ones above (translate shows them).
export function buildCollectionGroups(packs, cardData, packName = pack => displayPackName(pack.name), translate = text => text) {
    const relevant = packsWithPlayerCards(cardData)
    const byCycle = new Map()

    packs.filter(pack => relevant.has(pack.code)).forEach(pack => {
        if (!byCycle.has(pack.cycle_position)) byCycle.set(pack.cycle_position, [])
        byCycle.get(pack.cycle_position).push(pack)
    })

    return Array.from(byCycle.keys()).sort((a, b) => a - b).map(cycle => {
        const cyclePacks = byCycle.get(cycle).sort((a, b) => a.position - b.position)
        const codes = cyclePacks.map(pack => pack.code)

        // the second copy of the core set only matters for its quantities: it travels with the core set
        if (codes.includes('core')) codes.splice(codes.indexOf('core') + 1, 0, 'core2')

        return { title: CYCLE_TITLES[cycle] ? translate(CYCLE_TITLES[cycle]) : packName(cyclePacks[0]), codes: codes }
    })
}
