import { setUndoDepth } from './settings/settingsSlice'
import { restoreDraftState, rememberForUndo, popUndo, clearUndo, setStartSnapshot, loadSavedDraft } from './draftState'
import { setRandomState } from '../random'

// Remembers the draft as it is now, so the next pick (or "Done") can be undone
export function rememberUndoPoint(dispatch, getState) {
    dispatch(setUndoDepth(rememberForUndo(getState())))
}

// Takes the draft back to the moment before the latest pick
export function undoLastPick(dispatch, getState) {
    const { snapshot, depth } = popUndo()

    if (!snapshot) return

    setRandomState(snapshot.random)
    dispatch(restoreDraftState({ ...snapshot, resumed: false }))
    dispatch(setUndoDepth(depth))
}

// Brings back the draft saved in the browser. The card data was fetched again, so the taboo list is applied to it once more.
export function resumeSavedDraft(dispatch) {
    const saved = loadSavedDraft()

    if (!saved) return

    clearUndo()
    setStartSnapshot(saved.start || null)
    dispatch(setUndoDepth(0))
    setRandomState(saved.snapshot.random)
    dispatch(restoreDraftState({ ...saved.snapshot, resumed: true }))
}
