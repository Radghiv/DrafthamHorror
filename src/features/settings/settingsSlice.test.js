// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'

import reducer, { confirmCollection, setCollectionOpen, setSetupStep, reset, changeInvestigator, clearInvestigator } from './settingsSlice'

describe('the collection panel', () => {
    it('opens by itself the first time, and the setup never starts on a collection step', () => {
        const state = reducer(undefined, { type: 'init' })

        expect(state.collectionConfirmed).toBe(false)
        expect(state.collectionOpen).toBe(true)
        expect(state.setupStep).toBe('investigator')
    })

    it('closes and counts as confirmed when it is confirmed, and opens again from the settings', () => {
        let state = reducer(undefined, { type: 'init' })

        state = reducer(state, confirmCollection())
        expect(state.collectionConfirmed).toBe(true)
        expect(state.collectionOpen).toBe(false)

        state = reducer(state, setCollectionOpen(true))
        expect(state.collectionOpen).toBe(true)
        expect(state.collectionConfirmed).toBe(true)
    })

    it('stays as it is when the draft is reset, which goes back to the first step', () => {
        let state = reducer(undefined, { type: 'init' })

        state = reducer(state, confirmCollection())
        state = reducer(state, setCollectionOpen(true))
        state = reducer(state, setSetupStep('review'))
        state = reducer(state, reset())

        expect(state.setupStep).toBe('investigator')
        expect(state.collectionOpen).toBe(true)
    })
})

describe('clearing the investigator', () => {
    const roland = { name: 'Roland Banks', faction_code: 'guardian', deck_options: [], deck_requirements: { size: 33 } }

    it('takes the chosen investigator and what came with it away', () => {
        let state = reducer(undefined, { type: 'init' })

        state = reducer(state, changeInvestigator({ data: roland, parallel: false }))
        expect(state.investigatorData).toBe(roland)
        expect(state.deckSize).toBe(33)

        state = reducer(state, clearInvestigator())
        expect(state.investigatorData).toBe(null)
        expect(state.investigator).toBe('Agatha Crane')
        expect(state.deckSize).toBe('45')
        expect(state.selectedDeckSize).toBe('')
        expect(state.classChoices).toEqual({ faction_1: 'guardian', faction_2: 'seeker' })
    })
})
