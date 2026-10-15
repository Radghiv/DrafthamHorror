import { describe, test, expect } from 'vitest'

import { EMPTY_FILTERS, hasFilters, matchesFilters, slotsOf, traitsOf } from './SealedFilters'

const card = { name: 'Machete', subname: '', type_code: 'asset', faction_code: 'guardian', slot: 'Hand', traits: 'Item. Weapon. Melee.', cost: 3 }
const info = { text: 'Fight. You get +1 [combat] for this attack.', skill_combat: 1 }

const withFilters = changes => ({ ...EMPTY_FILTERS, ...changes })

describe('sealed filters', () => {
    test('no filter shows everything', () => {
        expect(hasFilters(EMPTY_FILTERS)).toBe(false)
        expect(matchesFilters(card, info, 'Machete', EMPTY_FILTERS)).toBe(true)
        expect(matchesFilters(card, undefined, 'Machete', EMPTY_FILTERS)).toBe(true)
    })

    test('reads the slots and the traits of a card', () => {
        expect(slotsOf({ slot: 'Hand x2' })).toEqual(['Hand'])
        expect(slotsOf({ slot: 'Hand. Arcane' })).toEqual(['Hand', 'Arcane'])
        expect(slotsOf({})).toEqual([])
        expect(traitsOf(card)).toEqual(['Item', 'Weapon', 'Melee'])
    })

    test('a group needs one of its choices, every group is needed', () => {
        expect(matchesFilters(card, info, 'Machete', withFilters({ classes: ['seeker', 'guardian'] }))).toBe(true)
        expect(matchesFilters(card, info, 'Machete', withFilters({ classes: ['seeker'] }))).toBe(false)
        expect(matchesFilters(card, info, 'Machete', withFilters({ classes: ['guardian'], types: ['event'] }))).toBe(false)
        expect(matchesFilters(card, info, 'Machete', withFilters({ types: ['asset'], slots: ['Hand'], costs: [3] }))).toBe(true)
    })

    test('a multiclass card has each of its classes', () => {
        expect(matchesFilters({ ...card, faction2_code: 'rogue' }, info, 'Machete', withFilters({ classes: ['rogue'] }))).toBe(true)
    })

    test('the cost 5 is five or more, and a card without cost has none', () => {
        expect(matchesFilters({ ...card, cost: 7 }, info, 'Machete', withFilters({ costs: [5] }))).toBe(true)
        expect(matchesFilters({ ...card, cost: null }, info, 'Machete', withFilters({ costs: [0] }))).toBe(false)
    })

    test('skill icons and trait come from the card and from ArkhamDB', () => {
        expect(matchesFilters(card, info, 'Machete', withFilters({ icons: ['combat'] }))).toBe(true)
        expect(matchesFilters(card, info, 'Machete', withFilters({ icons: ['wild', 'agility'] }))).toBe(false)
        expect(matchesFilters(card, undefined, 'Machete', withFilters({ icons: ['combat'] }))).toBe(false)
        expect(matchesFilters(card, info, 'Machete', withFilters({ trait: 'Weapon' }))).toBe(true)
        expect(matchesFilters(card, info, 'Machete', withFilters({ trait: 'Spell' }))).toBe(false)
    })

    test('the text has to have every word, in the name, the translated name, the rules or the traits', () => {
        expect(matchesFilters(card, info, 'Macete', withFilters({ text: 'macete' }))).toBe(true)
        expect(matchesFilters(card, info, 'Machete', withFilters({ text: 'FIGHT attack' }))).toBe(true)
        expect(matchesFilters(card, info, 'Machete', withFilters({ text: 'weapon' }))).toBe(true)
        expect(matchesFilters(card, info, 'Machete', withFilters({ text: 'fight spell' }))).toBe(false)
    })
})
