import { createSlice } from '@reduxjs/toolkit'

import { reset, changeSetting, changeInvestigatorDeck, calculateFilteredCount, setSetupStep, setLanguage, LANGUAGE_KEY } from '../settings/settingsSlice'
import { setDeckList, changeDeckName, setSourceDeck, changeLevel0, updateDeckRequirements, changePhase } from '../draft/draftSlice'

import DraftPhases from '../../data/DraftPhases'
import { registerPackNames, displayPackName } from '../../data/PackData'
import { buildCollectionGroups } from '../../data/PackCatalog'
import { registerPacks } from '../collection/collectionSlice'
import { restoreDraftState } from '../draftState'
import { readCache, writeCache, pruneCache, deleteCacheEntry } from '../../cache'
import { saveJSON } from '../../storage'
import { translationUrl, LANGUAGES } from '../../data/Languages'
import { loadLocale, setCurrentLanguage, msg } from '../../i18n'
import { listCardFromDBData } from '../../draft/DrawDraft'

const initialState = {
    cardData: null,
    packs: null,
    // the names of the cards in the language chosen, { language, cards: { code: { name, subname, custom } } }; null for English
    translations: null,
    tabooData: null,
    fetchError: false,
    // when the oldest of the lists from ArkhamDB in use was fetched (they come from the cache, which doesn't expire)
    dataDate: null,
    deckFetchError: false,
    tabooMerged: false,
    deckLoading: false,
    deckLoaded: false,
    // result of checking the entered ArkhamDB deck ID: status is 'idle', 'checking', 'valid' or 'invalid'
    deckValidation: { status: 'idle', id: '', name: '', investigator: '', cards: [] }
}

const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        updateCardData(state, action) {
            state.cardData = action.payload
        },
        updatePacks(state, action) {
            state.packs = action.payload
        },
        updateTranslations(state, action) {
            state.translations = action.payload
        },
        updateTabooData(state, action) {
            state.tabooData = action.payload
        },
        mergeTaboo(state, action) {
            if (state.tabooData && state.cardData) {
                state.cardData = mergeTabooData(state.cardData, state.tabooData, action.payload)
                state.tabooMerged = true
            }
        },
        changeFetchError(state, action) {
            state.fetchError = action.payload
        },
        noteDataDate(state, action) {
            if (state.dataDate === null || action.payload < state.dataDate) state.dataDate = action.payload
        },
        changeDeckLoading(state, action) {
            state.deckLoading = action.payload
        },
        changeDeckFetchError(state, action) {
            state.deckFetchError = action.payload
        },
        changeDeckLoaded(state, action) {
            state.deckLoaded = action.payload
        },
        setDeckValidation(state, action) {
            state.deckValidation = { status: 'idle', id: '', name: '', investigator: '', cards: [], ...action.payload }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(reset, function (state, action) {
            state.deckLoading = false
            state.fetchError = false
            state.deckFetchError = false
            state.deckLoaded = false
            state.tabooMerged = false
            state.deckValidation = { status: 'idle', id: '', name: '', investigator: '', cards: [] }
        })
        // back to a moment of the draft: whether a deck is loaded goes with it. A draft saved earlier meets freshly fetched cards, so
        // the taboo list is applied to them again.
        .addCase(restoreDraftState, function (state, action) {
            state.deckLoaded = !!action.payload.deckLoaded

            if (action.payload.resumed && state.tabooData && state.cardData) {
                state.cardData = mergeTabooData(state.cardData, state.tabooData, action.payload.settings.selectedTaboo)
                state.tabooMerged = true
            }
        })
/*
        'settings/reset': (state, action) => {
            state.deckLoading = false
            state.fetchError = false
            state.deckFetchError = false
            state.deckLoaded = false
            state.tabooMerged = false
        }
*/
    }
})

// The data from ArkhamDB is kept in the cache for good: a saved copy is always used, and the user can fetch it all again (the Collection
// step has a button). When new content comes out, raise this number: the copies saved by an older version are no longer looked at (and are
// deleted), so everybody gets the new data the next time the page loads.
export const CACHE_VERSION = 3

const cacheKey = name => name + ':v' + CACHE_VERSION
const isCurrentKey = key => String(key).endsWith(':v' + CACHE_VERSION)

// JSON from ArkhamDB, through the cache: the saved copy if there is one, otherwise it is fetched (and changed by transform, if given) and
// saved.
async function fetchCached(dispatch, name, url, transform) {
    const cached = await readCache(cacheKey(name))

    if (cached) {
        dispatch(noteDataDate(cached.savedAt))

        return cached.data
    }

    const response = await fetch(url)

    if (!response.ok) throw new Error('HTTP ' + response.status)

    const data = transform ? transform(await response.json()) : await response.json()

    writeCache(cacheKey(name), data)
    pruneCache(isCurrentKey)
    dispatch(noteDataDate(Date.now()))

    return data
}

export async function fetchCards(dispatch, getState) {
    fetchCached(dispatch, 'cards', "https://arkhamdb.com/api/public/cards/")
    .then(res => {
        dispatch(updateCardData(res))
        dispatch(syncCollectionPacks)
        dispatch(changeSetting( 'PrimaryClass', 'seeker' ))

        dispatch(calculateFilteredCount)
    })
    .catch((err) => {
        dispatch(changeFetchError(true))
    })
}

// The packs of ArkhamDB: their names and the cycles they belong to. Without them the built-in pack list is used.
export async function fetchPacks(dispatch, getState) {
    fetchCached(dispatch, 'packs', "https://arkhamdb.com/api/public/packs/")
    .then(res => {
        registerPackNames(res)
        dispatch(updatePacks(res))
        dispatch(syncCollectionPacks)
    })
    .catch((err) => {
        // not essential: the built-in list keeps working
    })
}

// The names and texts of the cards in the chosen language, from ArkhamDB's translated site; only what is shown is kept. The texts are
// kept only for the cards that have a translation (the site gives the English text for the others). When they can't be had the names
// stay English.
function namesOnly(cards) {
    const names = {}

    cards.forEach(card => {
        if (!card.name && !card.subname) return

        const entry = { name: card.name || '', subname: card.subname || '', custom: card.customization_text || '' }

        if ((card.text && card.text !== card.real_text) || (card.name && card.name !== card.real_name)) {
            entry.text = card.text || ''
            entry.traits = card.traits || ''
            entry.flavor = card.flavor || ''
            entry.back = card.back_text || ''
            entry.backFlavor = card.back_flavor || ''
        }

        names[card.code] = entry
    })

    return names
}

// The same for the names of the packs, { code: name }
function packNamesOnly(packs, language) {
    const names = {}

    packs.forEach(pack => {
        if (pack.name) names[pack.code] = displayPackName(pack.name, language)
    })

    return names
}

export async function fetchTranslations(dispatch, getState) {
    const language = getState().settings.language

    if (language === 'en') {
        dispatch(updateTranslations(null))
        return
    }

    // the cards and the packs are fetched apart: if one can't be had the other is still used
    const cards = fetchCached(dispatch, 'names-' + language, translationUrl(language), namesOnly).catch(() => null)
    const packs = fetchCached(dispatch, 'pack-names-' + language, translationUrl(language, 'packs'), list => packNamesOnly(list, language)).catch(() => null)

    Promise.all([cards, packs]).then(([cardNames, packNames]) => {
        // not essential when neither can be had: the names stay English
        if (!cardNames && !packNames) return

        // the choice may have changed while this was being fetched
        if (getState().settings.language === language) dispatch(updateTranslations({ language: language, cards: cardNames || {}, packs: packNames || {} }))
    })
}

// ---- The saved copies, for the cache panel of the collection panel: what each one is, and how to read, fill and delete it without touching the
// state (the app keeps using what it has loaded until the page is loaded again).

// One row of the panel: a title, and the copies behind it (a language has two: the names of the cards and the names of the packs). The first
// copy is the one whose number of entries is shown.
export function savedCopyRows() {
    const entries = (name, url, transform) => ({ name: name, url: url, transform: transform, count: data => Array.isArray(data) ? data.length : Object.keys(data).length })

    return [
        { id: 'cards', title: msg('Cards'), copies: [entries('cards', 'https://arkhamdb.com/api/public/cards/')] },
        { id: 'packs', title: msg('Packs'), copies: [entries('packs', 'https://arkhamdb.com/api/public/packs/')] },
        { id: 'taboos', title: msg('Taboo lists'), copies: [entries('taboos', 'https://arkhamdb.com/api/public/taboos/')] },
        ...LANGUAGES.filter(language => language.code !== 'en').map(language => ({
            id: 'language-' + language.code,
            title: language.label,
            language: true,
            copies: [
                entries('names-' + language.code, translationUrl(language.code), namesOnly),
                entries('pack-names-' + language.code, translationUrl(language.code, 'packs'), list => packNamesOnly(list, language.code))
            ]
        }))
    ]
}

// What is saved for a copy: { savedAt, data } or null
export function readSavedCopy(copy) {
    return readCache(cacheKey(copy.name))
}

export function deleteSavedCopy(copy) {
    return deleteCacheEntry(cacheKey(copy.name))
}

// Fetches a copy and saves it unless it is saved already; true when it is saved afterwards
export async function saveCopy(copy) {
    if (await readCache(cacheKey(copy.name))) return true

    try {
        const response = await fetch(copy.url)

        if (!response.ok) return false

        const data = await response.json()

        await writeCache(cacheKey(copy.name), copy.transform ? copy.transform(data) : data)

        return true
    }
    catch (e) {
        return false
    }
}

// Chooses the language of the interface and of the card names, and remembers it
export function changeLanguage(language) {
    return async function changeLanguageThunk(dispatch) {
        // the texts of the interface first, so the screen changes once, with them
        await loadLocale(language)
        setCurrentLanguage(language)

        saveJSON(LANGUAGE_KEY, language)
        dispatch(setLanguage(language))
        dispatch(fetchTranslations)
    }
}

// Once both the cards and the packs are known, the packs that are new to the collection (not saved, not built in) start selected
export function syncCollectionPacks(dispatch, getState) {
    const { cardData, packs } = getState().data

    if (!cardData || !packs) return

    dispatch(registerPacks(buildCollectionGroups(packs, cardData).flatMap(group => group.codes)))
    dispatch(calculateFilteredCount)
}

export async function fetchTaboo(dispatch, getState) {
    fetchCached(dispatch, 'taboos', "https://arkhamdb.com/api/public/taboos/")
    .then(res => {
        // the cached copy is the raw answer, so each entry's cards are parsed on a copy of it
        res = res.map(item => ({ ...item, cards: typeof item.cards === 'string' ? JSON.parse(item.cards) : item.cards })).sort((item1, item2) => item1.id > item2.id ? 1 : -1)

        dispatch(updateTabooData(res))

        // default to the most recent taboo list (the list is sorted by id, ascending)
        if (res.length > 0) {
            dispatch(changeSetting('SelectedTaboo', res[res.length - 1].id))
        }

        dispatch(calculateFilteredCount)
    })
    .catch((err) => {        
        dispatch(changeFetchError(true))
    })
}

// The cards of a deck fetched from ArkhamDB. This ignores story assets, as they're not in the ArkhamDB player card list, and the
// random basic weakness.
function deckCardsFromDeck(cardData, res) {
    return Object.keys(res.slots)
        .filter(code => code !== '01000')
        .map(code => {
            const card = cardData.find(item => item.code === code)

            return card ? listCardFromDBData(card, res.slots[code]) : null
        })
        .filter(item => item !== null)
}

// Applies a deck fetched from ArkhamDB to the app state: investigator, class, deck size, taboo list and, when loadCards is set
// (upgrading it), the card lists and the level 0 counts. It does not start anything; returns the deck's cards and investigator.
function applyDeck(dispatch, getState, res, loadCards) {
    const cardData = getState().data.cardData

    const meta = res && res.meta && res.meta.length > 0 ? JSON.parse(res.meta) : {}
    const parallel = !!meta.alternate_back
    const investigatorCode = parallel ? meta.alternate_back : res.investigator_code
    const investigator = cardData ? cardData.find(card => card.code === investigatorCode) : null

    if (!investigator) throw new Error('Unknown deck or investigator')

    dispatch(changeInvestigatorDeck(investigator, parallel))
    dispatch(calculateFilteredCount)

// meta:
//  deck_size_selected
//  faction_selected
//  alternate_front
//  alternate_back

    let deckSize = investigator.deck_requirements.size

    if (typeof meta.deck_size_selected !== 'undefined') {
        deckSize = meta.deck_size_selected
        dispatch(changeSetting('SelectedDeckSize', meta.deck_size_selected))
    }

    if (typeof meta.faction_selected !== 'undefined') {
        dispatch(changeSetting('SecondaryClass', meta.faction_selected))
    }
    else {
        const classOptions = investigator.deck_options.filter(item => item.name === 'Secondary Class')

        if (classOptions.length > 0) {
            dispatch(changeSetting('SecondaryClass', classOptions[0].faction_select[0]))
        }
    }

    const tabooID = res.taboo_id === null ? 0 : res.taboo_id

    // only the investigator and how it was built are wanted (the deck is not being upgraded)
    if (!loadCards) {
        dispatch(changeSetting('SelectedTaboo', tabooID))
        dispatch(changeDeckFetchError(false))
        dispatch(calculateFilteredCount)

        return { investigator: investigator, parallel: parallel, cards: [] }
    }

    const newDeckList = deckCardsFromDeck(cardData, res)

    const countByName = name => newDeckList.reduce((acc, a) => a.name === name ? acc + a.count : acc, 0)

    const adaptableCount = 2 * countByName('Adaptable')
    const versatileCount = countByName('Versatile')
    const knowledgeCount = countByName('Ancestral Knowledge')
    const underworldCount = countByName('Underworld Support')
    const forcedCount = countByName('Forced Learning')

    dispatch(changeLevel0('Exile', 0, false))
    dispatch(changeLevel0('Adaptable', adaptableCount, false))
    deckSize += (versatileCount * 5) + (knowledgeCount * 5) - (underworldCount * 5) + (forcedCount * 15)

    const burnableCards = newDeckList.filter(card => {
        return !(card.permanent || card.subtype_code || card.signature || card.exile || (card.name === 'Burn After Reading' && card.count === 1))
    })

    if (burnableCards.length > 0) {
        dispatch(changeSetting('BurnCard1', burnableCards[0].key))
        dispatch(changeSetting('BurnCard2', burnableCards[0].key))
    }

    dispatch(changeSetting('DeckSize', deckSize))

    dispatch(setDeckList(newDeckList))
    dispatch(changeDeckName(res.name))
    dispatch(setSourceDeck(res))
    dispatch(changeDeckFetchError(false))
    dispatch(changeSetting('SelectedTaboo', tabooID))

    updateDeckRequirements(dispatch, getState, DraftPhases.UpgradeLevel0AddPhase)
    dispatch(calculateFilteredCount)

    return { investigator: investigator, parallel: parallel, cards: newDeckList }
}

// Checks the entered ArkhamDB deck ID without starting anything. On success the investigator, class, deck size and taboo list
// become the deck's and, when upgrading, the deck's cards are loaded so they and their options can be reviewed.
export async function validateDeck(dispatch, getState) {
    const deckID = getState().settings.deckID.trim()

    dispatch(setDeckValidation({ status: 'checking', id: deckID }))

    fetch("https://arkhamdb.com/api/public/deck/" + encodeURIComponent(deckID) + '.json')
    .then(res => {
        return res.json()
    })
    .then(res => {
        const { investigator, parallel } = applyDeck(dispatch, getState, res, getState().settings.draftTab === 'Upgrade')

        dispatch(setDeckValidation({
            status: 'valid',
            id: deckID,
            name: res.name,
            investigator: investigator.name + (parallel ? ' (Parallel)' : ''),
            cards: deckCardsFromDeck(getState().data.cardData, res),
            deck: res
        }))
    })
    .catch(() => {
        dispatch(setDeckValidation({ status: 'invalid', id: deckID }))
    })
}

// The validated deck's cards are loaded into the draft (Upgrade was chosen after the deck was validated)
export function loadDeckCards(dispatch, getState) {
    const validation = getState().data.deckValidation

    if (validation.status === 'valid' && validation.deck) {
        applyDeck(dispatch, getState, validation.deck, true)
        dispatch(calculateFilteredCount)
    }
}

// The deck's cards leave the draft (Build was chosen after the deck was validated), but the deck stays validated so its
// investigator is still the one in use
export function unloadDeckCards(dispatch, getState) {
    const validation = getState().data.deckValidation
    const { setupStep, draftTab } = getState().settings

    dispatch(reset())
    dispatch(setSetupStep(setupStep))
    dispatch(setDeckValidation(validation))
    dispatch(changePhase(draftTab === 'Upgrade' ? DraftPhases.UpgradePhase : DraftPhases.BuildPhase1))
    dispatch(calculateFilteredCount)
}

// Undoes a loaded deck (the ID or the mode changed): the draft state is wiped like on Restart, but the setup step stays put
export function unloadDeck(dispatch, getState) {
    const { setupStep, draftTab } = getState().settings

    dispatch(reset())
    dispatch(setSetupStep(setupStep))
    dispatch(changePhase(draftTab === 'Upgrade' ? DraftPhases.UpgradePhase : DraftPhases.BuildPhase1))
    dispatch(calculateFilteredCount)
}

export function mergeTabooData(cData, tData, selectedTaboo) {
    var tabooData = selectedTaboo === 0 ? null : tData.filter(item => item.id === selectedTaboo)[0]

    var tCardData = cData.map(item => {
        delete item.tabooxp
        delete item.tabooexceptional
        delete item.taboodecklimit

        var tabooEntry = []   

        if (tabooData) {
            tabooEntry = tabooData.cards.filter(taboo => taboo.code === item.code)

            if (tabooEntry) {
                tabooEntry.forEach(taboo => {
                    if (taboo.xp !== undefined) item.tabooxp = taboo.xp
                    if (taboo.exceptional !== undefined && taboo.exceptional) {
                        item.tabooexceptional = true
                        item.taboodecklimit = 1
                    }
                    if (taboo.deck_limit !== undefined) {
                        item.taboodecklimit = taboo.deck_limit
                    }
                })
            }
        }
        
        return item
    })

    return tCardData
}

export const { updateCardData, updatePacks, updateTranslations, updateTabooData, mergeTaboo, changeFetchError, noteDataDate, changeDeckLoading, changeDeckFetchError, 
    changeDeckLoaded, setDeckValidation } = dataSlice.actions

export default dataSlice.reducer