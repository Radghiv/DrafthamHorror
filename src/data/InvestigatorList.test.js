import { describe, test, expect } from 'vitest'

import { investigatorEntries, ownedInvestigatorEntries, investigatorInCollection } from './InvestigatorList'

const investigator = (code, name, pack, extra) => ({ type_code: 'investigator', code: code, name: name, pack_code: pack, pack_name: pack, ...extra })

const cards = [
    investigator('01001', 'Roland Banks', 'core', { duplicated_by: ['01501'] }),
    investigator('01501', 'Roland Banks', 'rcore', { duplicate_of_code: '01001' }),
    investigator('02001', 'Jenny Barnes', 'dwl'),
    investigator('90025', 'Roland Banks', 'prc', { alternate_of_code: '01001', alternate_of_name: 'Roland Banks' })
]

describe('investigators of the collection', () => {
    test('the list has an entry for each investigator and parallel version', () => {
        expect(investigatorEntries(cards)).toEqual(['Jenny Barnes', 'Roland Banks', 'Roland Banks (Parallel)'])
    })

    test('only the investigators whose pack is in the collection are listed', () => {
        expect(ownedInvestigatorEntries(cards, { core: 1, dwl: 0, prc: 0 })).toEqual(['Roland Banks'])
        expect(ownedInvestigatorEntries(cards, { core: 0, dwl: 1, prc: 1 })).toEqual(['Jenny Barnes', 'Roland Banks (Parallel)'])
        expect(ownedInvestigatorEntries(cards, {})).toEqual([])
    })

    test('a reprint of the investigator is enough', () => {
        expect(ownedInvestigatorEntries(cards, { core: 0, rcore: 1 })).toEqual(['Roland Banks'])
    })

    test('a card is in the collection by its pack or by the pack of a reprint', () => {
        const byCode = new Map(cards.map(card => [card.code, card]))

        expect(investigatorInCollection(cards[0], byCode, { core: false, rcore: true })).toBe(true)
        expect(investigatorInCollection(cards[0], byCode, { core: false, rcore: false })).toBe(false)
    })

    test('a new collection gives a new list', () => {
        const first = { core: 1 }
        const second = { core: 1, dwl: 1 }

        expect(ownedInvestigatorEntries(cards, first)).toHaveLength(1)
        expect(ownedInvestigatorEntries(cards, second)).toHaveLength(2)
        expect(ownedInvestigatorEntries(cards, first)).toBe(ownedInvestigatorEntries(cards, first))
    })
})
