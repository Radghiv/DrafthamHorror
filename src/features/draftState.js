import { createAction } from '@reduxjs/toolkit'

import { loadJSON, saveJSON, removeJSON } from '../storage'
import { getRandomState } from '../random'

// Undo and "resume later" both work on a snapshot of the draft: the draft slice as it is, and the settings that belong to the draft
// (investigator, classes, draft rules, exile choices...). Replacing the slices with a snapshot takes the draft back to that moment.
// This module has no slice imports, so slices can use it without circular imports.

// Replaces the draft state with a snapshot: { settings, draft, deckLoaded, random (where the sequence of random numbers is) }
export const restoreDraftState = createAction('draftState/restore')

// Settings that are preferences or belong to the setup screens rather than to the draft: restoring a snapshot leaves them as they are
export const PREFERENCE_KEYS = [
    'animationSpeed', 'animateTogether', 'scrollToTop', 'cardsPerRow', 'bannedCards', 'collectionConfirmed', 'setupStep', 'highlightCost',
    'imagesrc', 'imageanchor', 'imagecode', 'imagepinned', 'undoDepth', 'language',
    'investigatorMode', 'investigatorDraftOptions', 'investigatorPool', 'investigatorDrafting'
]

// The settings of a snapshot, without the preferences
export function draftSettings(settings) {
    const result = {}

    Object.keys(settings).forEach(key => {
        if (!PREFERENCE_KEYS.includes(key)) result[key] = settings[key]
    })

    return result
}

// The settings after restoring a snapshot: the snapshot's draft settings and the current preferences
export function restoreSettings(current, restored) {
    const next = { ...current, ...restored }

    PREFERENCE_KEYS.forEach(key => {
        if (key in current) next[key] = current[key]
    })

    return next
}

export function takeSnapshot(state) {
    return { settings: draftSettings(state.settings), draft: state.draft, deckLoaded: state.data.deckLoaded, random: getRandomState() }
}

// ---- undo: the moments before each pick, most recent last. Kept in memory (the states are immutable, so keeping them is cheap).

const MAX_UNDO = 50
let undoStack = []

// The draft as it was before the first pick (kept even when the oldest undo points are dropped): what Restart goes back to
let startSnapshot = null

export function rememberForUndo(state) {
    const snapshot = takeSnapshot(state)

    if (!startSnapshot) startSnapshot = snapshot

    undoStack.push(snapshot)

    if (undoStack.length > MAX_UNDO) undoStack.shift()

    return undoStack.length
}

export function popUndo() {
    const snapshot = undoStack.pop()

    return { snapshot: snapshot, depth: undoStack.length }
}

export function clearUndo() {
    undoStack = []
    startSnapshot = null
}

export function getStartSnapshot() {
    return startSnapshot
}

export function setStartSnapshot(snapshot) {
    startSnapshot = snapshot
}

// ---- saved draft: the latest snapshot in localStorage, to carry on after closing the page

export const SAVED_DRAFT_KEY = 'draftham.savedDraft'

// bumped when the shape of the state changes, so an old save is ignored instead of breaking the app
const SAVED_DRAFT_VERSION = 2

export function saveDraft(state, label, start) {
    saveJSON(SAVED_DRAFT_KEY, { version: SAVED_DRAFT_VERSION, savedAt: Date.now(), label: label, snapshot: takeSnapshot(state), start: start || null })
}

export function loadSavedDraft() {
    const saved = loadJSON(SAVED_DRAFT_KEY, null)

    if (!saved || saved.version !== SAVED_DRAFT_VERSION || !saved.snapshot || !saved.snapshot.settings || !saved.snapshot.draft) return null

    return saved
}

export function clearSavedDraft() {
    removeJSON(SAVED_DRAFT_KEY)
}
