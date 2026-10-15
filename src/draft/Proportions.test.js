import { describe, test, expect } from 'vitest'

import { proportionContext, categoryDraw } from './DrawDraft'
import DraftPhases from '../data/DraftPhases'
import { seedRandom } from '../random'

// Zoey's way: cards of her classes without a limit, and up to 5 of any other class (the second deck option, which is the category 1)
const investigator = { deck_options: [{ faction: ['guardian', 'neutral'] }, { level: { min: 0, max: 0 }, limit: 5 }] }

const state = changes => ({
    settings: { proportionalLimits: true, investigatorData: investigator, deckSize: 30, ...(changes && changes.settings) },
    draft: { phase: DraftPhases.BuildPhase1, ...(changes && changes.draft) }
})

const normal = Array.from({ length: 20 }, (item, index) => ({ code: 'n' + index, limitCategory: null }))
const limited = Array.from({ length: 100 }, (item, index) => ({ code: 'l' + index, limitCategory: 1 }))

describe('proportions of the limited categories', () => {
    test('a limit is a share of the deck, for a new deck only and when the setting is on', () => {
        expect(proportionContext(state())).toEqual({ limits: { 1: 5 }, deckSize: 30 })
        expect(proportionContext(state({ settings: { proportionalLimits: false } }))).toBeNull()
        expect(proportionContext(state({ draft: { phase: DraftPhases.UpgradePhase } }))).toBeNull()
        expect(proportionContext(state({ settings: { investigatorData: { deck_options: [{ faction: ['guardian'] }] } } }))).toBeNull()
        expect(proportionContext(state({ settings: { investigatorData: null } }))).toBeNull()
    })

    test('the cards dealt are of the limited category as often as the limit says, whatever the cards of each', () => {
        seedRandom('proportions')

        const proportion = proportionContext(state())
        let fromLimited = 0

        for (let i = 0; i < 6000; i++) {
            if (categoryDraw([...normal, ...limited], proportion).limitCategory === 1) fromLimited++
        }

        // 5 in 30 (the cards are 100 of 120: an even draw would give 83%)
        expect(fromLimited / 6000).toBeGreaterThan(0.15)
        expect(fromLimited / 6000).toBeLessThan(0.18)
    })

    test('a category with no cards left gives its share to the others', () => {
        seedRandom('proportions')

        const proportion = proportionContext(state())

        for (let i = 0; i < 50; i++) {
            expect(categoryDraw(limited, proportion).limitCategory).toBe(1)
            expect(categoryDraw(normal, proportion).limitCategory).toBeNull()
        }
    })
})
