import { describe, test, expect } from 'vitest'

import { arkhamBuildMeta, arkhamBuildDeck, arkhamBuildUpgradeDeck } from './ExportArkhamBuild'

const NOW = new Date('2026-10-15T12:00:00.000Z')

const roland = { code: '01001', name: 'Roland Banks', deck_options: [{ faction: ['guardian'], level: { min: 0, max: 5 } }] }

describe('arkham.build export', () => {
    test('a deck has the cards as codes and copies, the investigator and the taboo list', () => {
        const deck = arkhamBuildDeck({
            title: 'My deck', investigatorData: roland, parallel: false, now: NOW, tabooId: 7,
            cards: [{ key: '01016', count: 2 }, { key: '01016', count: 1 }, { key: '01000', count: 1 }],
            choices: {}
        })

        expect(deck.slots).toEqual({ '01016': 3, '01000': 1 })
        expect(deck).toMatchObject({ name: 'My deck', investigator_code: '01001', investigator_name: 'Roland Banks', taboo_id: 7, meta: '{}', description_md: '', version: '0.1' })
        expect(deck.date_creation).toBe('2026-10-15T12:00:00.000Z')
        expect(arkhamBuildDeck({ title: 'x', investigatorData: roland, cards: [], choices: {}, tabooId: 0, now: NOW }).taboo_id).toBeNull()
    })

    test('a parallel investigator is the original one with its parallel sides in the meta', () => {
        const parallelRoland = { ...roland, code: '90025', alternate_of_code: '01001' }
        const deck = arkhamBuildDeck({ title: 'x', investigatorData: parallelRoland, parallel: true, cards: [], choices: {}, now: NOW })

        expect(deck.investigator_code).toBe('01001')
        expect(JSON.parse(deck.meta)).toEqual({ alternate_front: '90025', alternate_back: '90025' })
    })

    test('the choices of the creation go in the meta under the ids of the deck options', () => {
        const investigator = {
            code: '09018',
            deck_options: [
                { name: 'Class Choice', id: 'faction_1', faction_select: ['guardian', 'seeker'] },
                { name: 'Class Choice', id: 'faction_2', faction_select: ['guardian', 'seeker'] },
                { name: 'Secondary Class', faction_select: ['guardian', 'seeker'] },
                { name: 'Deck Size', deck_size_select: ['30', '40'] },
                { name: 'Trait Choice', option_select: [{ id: 'blessed', name: 'Blessed' }, { id: 'cursed', name: 'Cursed' }] }
            ]
        }

        expect(arkhamBuildMeta(investigator, false, {
            classChoices: { faction_1: 'guardian', faction_2: 'seeker' }, secondaryClass: 'seeker', selectedDeckSize: 40, deckSize: 40, traitChoice: 'Cursed'
        })).toEqual({ faction_1: 'guardian', faction_2: 'seeker', faction_selected: 'seeker', deck_size_selected: '40', option_selected: 'cursed' })
    })

    test('an upgraded deck keeps what the app does not draft with and the rest of the deck as it was', () => {
        const original = {
            id: 123, name: 'Old deck', investigator_code: '01001', investigator_name: 'Roland Banks', meta: '{"cus_1":"x"}', taboo_id: 5, tags: 'a b', version: '1.2',
            description_md: 'notes', sideSlots: { '02000': 1 }, exile_string: '01010', date_creation: '2025-01-01T00:00:00Z',
            slots: { '01016': 2, '01017': 1, '01000': 1, '99999': 1 }
        }
        const deckList = [{ key: '01016', count: 2 }, { key: '01017', count: 1 }]
        // one card was upgraded (01017 out, 01018 in) and one added
        const mergedList = [{ key: '01016', count: 2 }, { key: '01018', count: 1 }, { key: '01020', count: 1 }]

        const deck = arkhamBuildUpgradeDeck({ original: original, title: '', mergedList: mergedList, deckList: deckList, now: NOW })

        expect(deck.slots).toEqual({ '01000': 1, '99999': 1, '01016': 2, '01018': 1, '01020': 1 })
        expect(deck).toMatchObject({ id: 123, name: 'Old deck', meta: '{"cus_1":"x"}', taboo_id: 5, tags: 'a b', version: '1.2', sideSlots: { '02000': 1 }, exile_string: null, xp: null })
        expect(deck.date_creation).toBe('2025-01-01T00:00:00Z')
        expect(deck.date_update).toBe('2026-10-15T12:00:00.000Z')
        expect(arkhamBuildUpgradeDeck({ original: original, title: 'New', mergedList: [], deckList: [], now: NOW }).name).toBe('New')
    })
})
