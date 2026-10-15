// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'

import { rememberForUndo, popUndo, getStartSnapshot, clearUndo, leaveDraft, takeLeftDraft, dropLeftDraft, undoSize } from './draftState'

const stateWith = picks => ({ settings: { drafting: true, picks: picks, undoDepth: 0 }, draft: { picks: picks }, data: { deckLoaded: false } })

describe('the deck draft that was left to choose another investigator', () => {
    beforeEach(() => clearUndo())

    it('is put aside with its undo points, and the undo points start over', () => {
        rememberForUndo(stateWith(0))
        rememberForUndo(stateWith(1))
        expect(undoSize()).toBe(2)

        leaveDraft(stateWith(2))
        expect(undoSize()).toBe(0)
        expect(getStartSnapshot()).toBe(null)
    })

    it('comes back as it was, with its undo points and its start', () => {
        rememberForUndo(stateWith(0))
        rememberForUndo(stateWith(1))
        leaveDraft(stateWith(2))

        const snapshot = takeLeftDraft()

        expect(snapshot.draft.picks).toBe(2)
        expect(undoSize()).toBe(2)
        expect(getStartSnapshot().draft.picks).toBe(0)
        expect(popUndo().snapshot.draft.picks).toBe(1)
    })

    it('is only there once, and not any more when another investigator is picked or the history is cleared', () => {
        leaveDraft(stateWith(1))
        expect(takeLeftDraft()).not.toBe(null)
        expect(takeLeftDraft()).toBe(null)

        leaveDraft(stateWith(1))
        dropLeftDraft()
        expect(takeLeftDraft()).toBe(null)

        leaveDraft(stateWith(1))
        clearUndo()
        expect(takeLeftDraft()).toBe(null)
    })
})
