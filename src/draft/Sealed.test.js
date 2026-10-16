import { describe, test, expect } from 'vitest'

import DraftPhases from '../data/DraftPhases'
import { isSealedDraft, isSealedBuild, sealedExtraFor, sealedPoolSizeFor, sealedMaxCopies, sealedPoolFillsDeck, sealedEntryId, compareSealedCards } from './Sealed'
import { restoreSettings } from '../features/draftState'

describe('sealed', () => {
    test('is every phase that picks cards from a pool, in the sealed mode only', () => {
        ;[DraftPhases.BuildPhase1, DraftPhases.UpgradePhase, DraftPhases.BuildUpgradePhase, DraftPhases.UpgradeLevel0AddPhase, DraftPhases.VersatilePhase].forEach(phase => {
            expect(isSealedDraft('sealed', phase)).toBe(true)
            expect(isSealedDraft('draft', phase)).toBe(false)
        })

        expect(isSealedDraft('sealed', DraftPhases.BuildPhase2)).toBe(false)
        expect(isSealedDraft('sealed', DraftPhases.AllCards)).toBe(false)
    })

    test('the pool is the cards to pick with a percentage over them', () => {
        expect(sealedPoolSizeFor(30, 100)).toBe(60)
        expect(sealedPoolSizeFor(30, 500)).toBe(180)
        expect(sealedPoolSizeFor(30, 0)).toBe(30)
        expect(sealedPoolSizeFor(3, 50)).toBe(5)
        expect(sealedPoolSizeFor(0, 100)).toBe(0)
    })

    test('a small phase has its own percentage when it has one, the others the general one', () => {
        const settings = { sealedExtra: 100, sealedPhaseExtra: { [DraftPhases.VersatilePhase]: 300, [DraftPhases.UpgradePhase]: 10 } }

        expect(sealedExtraFor(settings, DraftPhases.VersatilePhase)).toBe(300)
        expect(sealedExtraFor(settings, DraftPhases.UpgradeLevel0AddPhase)).toBe(100)
        // (only the small phases have one of their own)
        expect(sealedExtraFor(settings, DraftPhases.UpgradePhase)).toBe(100)
        expect(sealedExtraFor({ sealedExtra: 50 }, DraftPhases.VersatilePhase)).toBe(50)
    })

    test('taking cards out of the Draft List is for the build only', () => {
        expect(isSealedBuild('sealed', DraftPhases.BuildPhase1)).toBe(true)
        expect(isSealedBuild('sealed', DraftPhases.UpgradePhase)).toBe(false)
    })

    test('takes one copy, or two when allowed, never more than the card does', () => {
        expect(sealedMaxCopies({ deck_limit: 2 }, false)).toBe(1)
        expect(sealedMaxCopies({ deck_limit: 2 }, true)).toBe(2)
        expect(sealedMaxCopies({ deck_limit: 3 }, true)).toBe(2)
        expect(sealedMaxCopies({ deck_limit: 1 }, true)).toBe(1)
    })

    test('a pool fills a deck when its cards, once or twice, are enough', () => {
        expect(sealedPoolFillsDeck(30, false, 200, 30)).toBe(true)
        expect(sealedPoolFillsDeck(29, false, 200, 30)).toBe(false)
        expect(sealedPoolFillsDeck(15, true, 200, 30)).toBe(true)
        // the pool can't hold more cards than there are legal ones
        expect(sealedPoolFillsDeck(100, false, 20, 30)).toBe(false)
    })

    test('a pool with duplicates holds at most two of each card', () => {
        expect(sealedPoolFillsDeck(60, false, 20, 30, true)).toBe(true)
        expect(sealedPoolFillsDeck(60, false, 10, 30, true)).toBe(false)
        expect(sealedPoolFillsDeck(20, false, 200, 30, true)).toBe(false)
    })

    test('the entries of a pool are told apart by where they were dealt', () => {
        expect(sealedEntryId({ key: '01016', poolId: 7 })).toBe(7)
        expect(sealedEntryId({ key: '01016' })).toBe('01016')
    })

    test('shows the pool by class, then by name', () => {
        const cards = [
            { key: '3', name: 'Zeal', faction_code: 'mystic' },
            { key: '2', name: 'Beat Cop', faction_code: 'guardian' },
            { key: '1', name: 'Ace', faction_code: 'neutral' },
            { key: '4', name: 'Aid', faction_code: 'guardian' }
        ]

        expect(cards.sort(compareSealedCards).map(card => card.name)).toEqual(['Aid', 'Beat Cop', 'Zeal', 'Ace'])
    })

    test('a draft saved before the mode existed comes back as a draft', () => {
        const restored = restoreSettings({ deckbuilding: 'sealed', sealedExtra: 10, sealedCopies: true, language: 'en' }, { investigator: 'Roland Banks' })

        expect(restored.deckbuilding).toBe('draft')
        expect(restored.investigator).toBe('Roland Banks')
    })

    test('a saved sealed draft keeps its settings', () => {
        const restored = restoreSettings({ deckbuilding: 'draft' }, { deckbuilding: 'sealed', sealedExtra: 40, sealedCopies: true })

        expect(restored).toMatchObject({ deckbuilding: 'sealed', sealedExtra: 40, sealedCopies: true })
    })
})
