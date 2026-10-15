import { changeSeed, reset, setUndoDepth, endInvestigatorDraft } from './settings/settingsSlice'
import { startInvestigatorDraft } from './settings/investigatorActions'
import { restoreDraftState, getStartSnapshot, leaveDraft, takeLeftDraft, undoSize } from './draftState'
import { rememberUndoPoint } from './draftHistory'
import { fillDraft } from '../draft/DrawDraft'
import { newSeed, seedRandom, setRandomState } from '../random'

// Starts the draft over with the same setup: back to the moment before the first pick, with new cards dealt from a new seed. Undo
// brings the draft back as it was (the investigator draft just deals its investigators again).
export function restartDraft(dispatch, getState) {
    const seed = newSeed()

    seedRandom(seed)

    if (getState().settings.investigatorDrafting) {
        dispatch(changeSeed(seed))
        dispatch(startInvestigatorDraft)

        return
    }

    // also records the start of the draft when nothing has been picked yet
    dispatch(rememberUndoPoint)

    dispatch(restoreDraftState({ ...getStartSnapshot(), resumed: false }))
    dispatch(changeSeed(seed))
    if (getState().settings.drafting) dispatch(fillDraft())
}

// From the deck draft back to the investigator draft, to choose another investigator: the deck draft is put aside (Undo brings it back) and
// new investigators are dealt from a new seed.
export function backToInvestigatorDraft(dispatch, getState) {
    const seed = newSeed()

    seedRandom(seed)
    leaveDraft(getState())
    dispatch(reset())
    dispatch(changeSeed(seed))
    dispatch(startInvestigatorDraft)

    // the one thing there is to undo
    dispatch(setUndoDepth(1))
}

// Undo on the investigator draft: the deck draft that was left comes back as it was, with its own undo points
export function undoBackToInvestigators(dispatch) {
    const snapshot = takeLeftDraft()

    if (!snapshot) return

    setRandomState(snapshot.random)
    dispatch(endInvestigatorDraft())
    dispatch(restoreDraftState({ ...snapshot, resumed: false }))
    dispatch(setUndoDepth(undoSize()))
}
