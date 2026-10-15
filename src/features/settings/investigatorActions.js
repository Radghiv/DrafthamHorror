import { changeSetting, changeInvestigatorList, calculateFilteredCount, clearInvestigator, beginInvestigatorDraft, endInvestigatorDraft, replaceInvestigatorInPool, setUndoDepth } from './settingsSlice'
import { dropLeftDraft } from '../draftState'
import { startDraft } from '../draft/draftSlice'
import { random } from '../../random'

import DraftPhases from '../../data/DraftPhases'
import { ownedInvestigatorEntries, investigatorInCollection, AGATHA_ENTRIES, isParallelEntry, findInvestigatorCard } from '../../data/InvestigatorList'

// Selects an entry of the investigator list. Agatha's class is chosen through her entry, then the regular lookup picks the
// matching card.
export function selectInvestigatorEntry(entry) {
    return function selectInvestigatorEntryThunk(dispatch) {
        if (AGATHA_ENTRIES[entry]) {
            dispatch(changeSetting('PrimaryClass', AGATHA_ENTRIES[entry]))
            dispatch(changeInvestigatorList('Agatha Crane'))
        }
        else {
            dispatch(changeInvestigatorList(entry))
        }

        dispatch(calculateFilteredCount)
    }
}

// The investigator chosen from the list is no longer valid when the collection changes and no longer has it: the choice is dropped. An investigator
// that comes with an ArkhamDB deck is the deck's, and a draft that has started is left alone.
export function dropInvestigatorOutsideCollection(dispatch, getState) {
    const { settings, data, collection } = getState()

    if (settings.investigatorMode !== 'list' || !settings.investigatorData || settings.drafting || settings.complete || settings.investigatorDrafting || data.deckLoaded) return

    const cardByCode = new Map((data.cardData || []).map(card => [card.code, card]))

    if (investigatorInCollection(settings.investigatorData, cardByCode, collection)) return

    dispatch(clearInvestigator())
    dispatch(calculateFilteredCount)
}

// The list entries the investigator draft may offer: parallel versions only when allowed, only the chosen classes and none of
// the excluded ones
export function eligibleInvestigators(entries, cards, options) {
    return entries.filter(entry => {
        if (!options.parallel && isParallelEntry(entry)) return false
        if (options.excluded.includes(entry)) return false

        const card = findInvestigatorCard(entry, cards)

        if (card && !options.classes.includes(card.faction_code)) return false

        return true
    })
}

// Draws the investigators to choose from among the eligible ones; no two entries share a name
export function drawInvestigatorPool(entries, cards, options) {
    const candidates = eligibleInvestigators(entries, cards, options)

    const pool = []
    const names = new Set()

    while (pool.length < options.count && candidates.length > 0) {
        const index = Math.floor(random() * candidates.length)
        const entry = candidates.splice(index, 1)[0]
        const name = entry.replace(/\s\(.*\)$/, '')

        if (!names.has(name)) {
            names.add(name)
            pool.push(entry)
        }
    }

    return pool
}

// Starts the investigator draft: draws the pool and shows it
export function startInvestigatorDraft(dispatch, getState) {
    const state = getState()

    dispatch(beginInvestigatorDraft(drawInvestigatorPool(
        ownedInvestigatorEntries(state.data.cardData, state.collection),
        state.data.cardData,
        state.settings.investigatorDraftOptions
    )))
}

const baseName = entry => entry.replace(/\s\(.*\)$/, '')

// Redraws one investigator of the pool: another eligible one that isn't on the table (by name) takes its place
export function redrawInvestigator(index) {
    return function redrawInvestigatorThunk(dispatch, getState) {
        const state = getState()
        const pool = state.settings.investigatorPool

        const names = new Set(pool.map(baseName))
        const candidates = eligibleInvestigators(ownedInvestigatorEntries(state.data.cardData, state.collection), state.data.cardData, state.settings.investigatorDraftOptions)
            .filter(entry => !names.has(baseName(entry)))

        if (candidates.length > 0) {
            dispatch(replaceInvestigatorInPool({ index: index, entry: candidates[Math.floor(random() * candidates.length)] }))
        }
    }
}

// The drafted investigator is chosen: the deck draft goes on from there
export function pickInvestigator(entry) {
    return function pickInvestigatorThunk(dispatch, getState) {
        // a deck draft put aside to choose again is gone now, and so is the Undo that was for it
        dropLeftDraft()
        dispatch(setUndoDepth(0))

        dispatch(selectInvestigatorEntry(entry))
        dispatch(endInvestigatorDraft())

        const isUpgradeTab = getState().settings.draftTab === 'Upgrade'

        dispatch(startDraft(isUpgradeTab ? DraftPhases.UpgradePhase : DraftPhases.BuildPhase1))
    }
}
