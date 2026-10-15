import { createAction } from '@reduxjs/toolkit'

import { loadJSON, saveJSON, removeJSON } from '../storage'
import { getRandomState } from '../random'
import { SEALED_SETTINGS } from '../draft/Sealed'

// Undo and "resume later" both work on a snapshot of the draft: the draft slice as it is, and the settings that belong to the draft
// (investigator, classes, draft rules, exile choices...). Replacing the slices with a snapshot takes the draft back to that moment.
// This module has no slice imports, so slices can use it without circular imports.

// Replaces the draft state with a snapshot: { settings, draft, deckLoaded, random (where the sequence of random numbers is) }
export const restoreDraftState = createAction('draftState/restore')

// Settings that are preferences or belong to the setup screens rather than to the draft: restoring a snapshot leaves them as they are
export const PREFERENCE_KEYS = [
    'animationSpeed', 'animateTogether', 'scrollToTop', 'cardsPerRow', 'bannedCards', 'collectionConfirmed', 'collectionOpen', 'setupStep', 'highlightCost',
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
    // a snapshot from before the sealed mode has none of its settings: it was a draft, whatever the setup screens say now
    const next = { ...current, ...SEALED_SETTINGS, ...restored }

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

// The latest undo point, left in place
export function peekUndo() {
    return undoStack[undoStack.length - 1] || null
}

export function clearUndo() {
    undoStack = []
    startSnapshot = null
    leftDraft = null
}

export function undoSize() {
    return undoStack.length
}

// The deck draft that was left to choose another investigator, with its own undo points: Undo on the investigator draft brings it back.
// It is dropped when another investigator is picked (the new deck draft starts from nothing) or when the history is cleared.
let leftDraft = null

// Puts the draft as it is now aside, with its undo points and its start, and starts the undo points over
export function leaveDraft(state) {
    leftDraft = { snapshot: takeSnapshot(state), stack: undoStack, start: startSnapshot }
    undoStack = []
    startSnapshot = null
}

// The draft that was put aside, whose undo points are the ones in use again (null when there is none)
export function takeLeftDraft() {
    const left = leftDraft

    if (!left) return null

    leftDraft = null
    undoStack = left.stack
    startSnapshot = left.start

    return left.snapshot
}

export function dropLeftDraft() {
    leftDraft = null
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
