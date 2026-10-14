import { changeSeed } from './settings/settingsSlice'
import { startInvestigatorDraft } from './settings/investigatorActions'
import { restoreDraftState, getStartSnapshot } from './draftState'
import { rememberUndoPoint } from './draftHistory'
import { fillDraft } from '../draft/DrawDraft'
import { newSeed, seedRandom } from '../random'

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
