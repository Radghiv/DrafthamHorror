import { describe, test, expect } from 'vitest'

import DraftPhases from '../data/DraftPhases'
import { isSealedDraft, sealedMaxCopies, sealedPoolFillsDeck, compareSealedCards } from './Sealed'
import { restoreSettings } from '../features/draftState'

describe('sealed', () => {
    test('is the build of a deck, in the sealed mode only', () => {
        expect(isSealedDraft('sealed', DraftPhases.BuildPhase1)).toBe(true)
        expect(isSealedDraft('draft', DraftPhases.BuildPhase1)).toBe(false)
        expect(isSealedDraft('sealed', DraftPhases.UpgradePhase)).toBe(false)
        expect(isSealedDraft('sealed', DraftPhases.VersatilePhase)).toBe(false)
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
        const restored = restoreSettings({ deckbuilding: 'sealed', sealedCount: 10, sealedCopies: true, language: 'en' }, { investigator: 'Roland Banks' })

        expect(restored.deckbuilding).toBe('draft')
        expect(restored.investigator).toBe('Roland Banks')
    })

    test('a saved sealed draft keeps its settings', () => {
        const restored = restoreSettings({ deckbuilding: 'draft' }, { deckbuilding: 'sealed', sealedCount: 40, sealedCopies: true })

        expect(restored).toMatchObject({ deckbuilding: 'sealed', sealedCount: 40, sealedCopies: true })
    })
})
