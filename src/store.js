import { configureStore } from '@reduxjs/toolkit'

import settingsReducer from './features/settings/settingsSlice'
import draftReducer from './features/draft/draftSlice'
import dataReducer from './features/data/dataSlice'
import collectionReducer, { COLLECTION_STORAGE_KEY } from './features/collection/collectionSlice'
import { COLLECTION_CONFIRMED_KEY, BANNED_CARDS_KEY } from './features/settings/settingsSlice'
import { saveJSON } from './storage'
import { saveDraft, draftSettings, getStartSnapshot } from './features/draftState'
import { dropInvestigatorOutsideCollection } from './features/settings/investigatorActions'
import phaseLabel from './data/PhaseLabel'
import { t } from './i18n'

const store = configureStore({
    reducer: {
        settings: settingsReducer,
        draft: draftReducer,
        data: dataReducer,
        collection: collectionReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        immutableCheck: { warnAfter: 128 },
        serializableCheck: { warnAfter: 128 }
    })
})

// persist the collection choices, so redrafting (or coming back later) doesn't mean redoing them
let savedCollection = store.getState().collection
let savedConfirmed = store.getState().settings.collectionConfirmed
let savedBans = store.getState().settings.bannedCards

// The draft in progress is saved too (a moment after the last change), so closing the page doesn't lose it. Setup screens never overwrite
// it: only Discard (or leaving a complete draft through the logo) clears it, and starting another draft replaces it.
let savedDraft = null
let savedSettings = null
let saveTimer = null

function sameSettings(a, b) {
    if (!a || !b) return false

    const keysA = Object.keys(a)

    return keysA.length === Object.keys(b).length && keysA.every(key => a[key] === b[key])
}

function describeDraft(state) {
    const { settings, draft } = state
    const where = settings.complete ? t('Draft complete') : phaseLabel(draft.phase, settings.draftType, draft.currentLevel0Name)

    return settings.investigator + (settings.parallel ? ' (Parallel)' : '') + ' · ' + (settings.draftTab === 'Upgrade' ? t('Upgrade') : t('Build Deck')) + ' · ' + where
}

function autosaveDraft(state) {
    const inProgress = (state.settings.drafting || state.settings.complete || state.data.deckLoaded) && !state.settings.investigatorDrafting

    if (!inProgress || !state.settings.investigatorData) return

    const settings = draftSettings(state.settings)

    if (state.draft === savedDraft && sameSettings(settings, savedSettings)) return

    savedDraft = state.draft
    savedSettings = settings

    // the state (and start of the draft) that is saved are the ones that scheduled the save, so leaving the draft within the delay
    // (the logo) doesn't save the reset state
    const start = getStartSnapshot()

    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveDraft(state, describeDraft(state), start), 400)
}

store.subscribe(() => {
    const state = store.getState()

    autosaveDraft(state)

    if (state.collection !== savedCollection) {
        savedCollection = state.collection
        saveJSON(COLLECTION_STORAGE_KEY, savedCollection)

        // an investigator chosen from the list that the new collection doesn't have is no longer chosen
        store.dispatch(dropInvestigatorOutsideCollection)
    }
    if (state.settings.bannedCards !== savedBans) {
        savedBans = state.settings.bannedCards
        saveJSON(BANNED_CARDS_KEY, savedBans)
    }
    if (state.settings.collectionConfirmed !== savedConfirmed) {
        savedConfirmed = state.settings.collectionConfirmed
        saveJSON(COLLECTION_CONFIRMED_KEY, savedConfirmed)
    }
})

export default store