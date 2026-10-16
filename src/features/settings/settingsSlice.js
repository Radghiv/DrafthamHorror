import { createSlice, current } from '@reduxjs/toolkit'

import FilterCards, { filteredCount, filterResearch } from '../../data/CardFilter'
import DraftPhases from '../../data/DraftPhases'
import { loadJSON } from '../../storage'
import { isLanguage } from '../../data/Languages'
import { DEFAULT_ANIMATION_SPEED } from '../../data/AnimationSpeed'
import { restoreDraftState, restoreSettings } from '../draftState'
import { newSeed } from '../../random'
import { SEALED_SETTINGS, SEALED_MAX_EXTRA } from '../../draft/Sealed'

export const COLLECTION_CONFIRMED_KEY = 'draftham.collectionConfirmed'
export const CARDS_PER_ROW_KEY = 'draftham.cardsPerRow'
export const ANIMATION_SPEED_KEY = 'draftham.animationSpeed'
export const ANIMATE_TOGETHER_KEY = 'draftham.animateTogether'
export const SCROLL_TO_TOP_KEY = 'draftham.scrollToTop'
export const BANNED_CARDS_KEY = 'draftham.bannedCards'
export const LANGUAGE_KEY = 'draftham.language'

// the collection is the first setup step; once it has been confirmed, redrafting starts after it
const collectionConfirmed = loadJSON(COLLECTION_CONFIRMED_KEY, false)

const initialState = {
    investigatorData: null,
    investigator: 'Agatha Crane',
    parallel: false,
    primaryClass: 'seeker',
    secondaryClass: '',
    classChoices: { faction_1: 'guardian', faction_2: 'seeker' },
    selectedDeckSize: '',
    traitChoice: {},
    selectedTaboo: 0,
    deckSize: '45',
    filteredCount: '0',
    filteredResearch: {},

    draftTab: "Build Deck",
    draftType: "draft",
    // how a deck is built: drafted, or from a sealed pool (see draft/Sealed.js)
    ...SEALED_SETTINGS,
    // investigators that can add only some cards of other classes (or traits) get them in proportion to that limit in the cards dealt
    proportionalLimits: true,
    draftWeighting: 'medium',
    draftXP: 1,
    draftCount: [5, 5, 5, 5, 5, 5, 5, 5],
    draftCards: [10, 10, 10, 10, 10, 10, 10, 1],
    draftUseLimited: [true, true, true],
    myriadCount: 3,
    deckID: '',
    confirmDraft: true,
    excludeNormalVersatile: true,

    burnCards: [ '', '' ],
    exileSelection: {},
    researchSelection: {},
    otherUpgradeSettings: { GMM: '1', Pelt: [false, false] },
    removedCards: 0,

    // how the investigator is chosen: 'list' (from the list), 'arkhamdb' (taken from an ArkhamDB deck) or 'draft' (drafted
    // from a few random ones). While drafting, investigatorPool holds the entries to choose from.
    investigatorMode: 'list',
    investigatorDraftOptions: { count: 4, parallel: true, classes: ['guardian', 'seeker', 'rogue', 'mystic', 'survivor', 'neutral'], excluded: [] },
    investigatorPool: [],
    investigatorDrafting: false,

    // column of the cost curve being hovered (0 = skills, 1 to 6 = cost 0 to 5+): its cards are highlighted in the lists
    highlightCost: null,

    // speed of the draft animations: a position of ANIMATION_SPEEDS (0 = off)
    animationSpeed: loadJSON(ANIMATION_SPEED_KEY, DEFAULT_ANIMATION_SPEED),

    // names of cards that never show up in the drafts (all their levels)
    bannedCards: loadJSON(BANNED_CARDS_KEY, []),

    // new cards of the draft turn over all at once instead of one after the other
    animateTogether: loadJSON(ANIMATE_TOGETHER_KEY, false),
    // whether the page scrolls to the top after a pick, where the new cards are
    scrollToTop: loadJSON(SCROLL_TO_TOP_KEY, true) !== false,

    // cards shown per row while drafting; 0 = decided by the available width
    cardsPerRow: loadJSON(CARDS_PER_ROW_KEY, 0),

    // upgrade with a loaded deck: 'upgrade' drafts the upgrades first, 'level0' the level 0 replacement cards first
    draftOrder: 'upgrade',
    upgradeAfterLevel0: false,

    // the collection is not a step: its panel opens by itself the first time and after that from the settings
    setupStep: 'investigator',
    collectionConfirmed: collectionConfirmed,
    collectionOpen: !collectionConfirmed,

    // language of the card names (the card images stay English); 'en' is the language of the card data itself
    language: isLanguage(loadJSON(LANGUAGE_KEY, 'en')) ? loadJSON(LANGUAGE_KEY, 'en') : 'en',

    // how many picks can be undone
    undoDepth: 0,

    // the same seed (with the same setup) deals the same cards
    seed: newSeed(),

    drafting: false,
    complete: false,   
    imagesrc: null,
    imageanchor: null,
    imagecode: null,
    // the preview was opened with a long press on a touch screen and stays until it is tapped away
    imagepinned: false
}

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        changeInvestigator(state, action) {
            state.investigatorData = action.payload.data
            state.investigator = state.investigatorData.name
            state.parallel = action.payload.parallel

            // Agatha Crane has two cards, can't tell from deckoptions, so we'll do it manually
            if (state.investigator === 'Agatha Crane') {
                state.primaryClass = state.investigatorData.faction_code
            }

            const secondaryOptions = state.investigatorData.deck_options.filter(item => item.name === 'Secondary Class')
            if (secondaryOptions.length > 0) {
                state.secondaryClass = secondaryOptions[0].faction_select[0]
            }   

            const classOptions = state.investigatorData.deck_options.filter(item => item.name === 'Class Choice')
            for (let i = 0; i < classOptions.length; i++) {
                // i = 0 => 'guardian', 1 => 'seeker'
                state.classChoices[classOptions[i].id] = classOptions[i].faction_select[i]
            }   

            state.deckSize = state.investigatorData.deck_requirements.size
        
            const decksizeOptions = state.investigatorData.deck_options.filter(item => item.name === 'Deck Size')
            if (decksizeOptions.length > 0) {
                state.selectedDeckSize = decksizeOptions[0].deck_size_select[0]
            }
            else {
                state.selectedDeckSize = ''
            }

            const traitChoiceOptions = state.investigatorData.deck_options.filter(item => item.name === 'Trait Choice')
            if (traitChoiceOptions.length > 0) {
                state.traitChoice = traitChoiceOptions[0].option_select[0].name
            }
            else {
                state.traitChoice = ''
            }
        },
        changeSetting: {
            reducer(state, action) {
                switch (action.payload.setting) {
                    case 'PrimaryClass':
                        state.primaryClass = action.payload.value;
                        break
                    case 'SecondaryClass':
                        state.secondaryClass = action.payload.value
                        break
                    case 'ClassChoice1':
                        state.classChoices['faction_1'] = action.payload.value
                        break;
                    case 'ClassChoice2':
                        state.classChoices['faction_2'] = action.payload.value
                        break;
                    case 'DeckSize':
                        state.deckSize = parseInt(action.payload.value)
                        break
                    case 'SelectedDeckSize':
                        state.selectedDeckSize = parseInt(action.payload.value)
                        state.deckSize = parseInt(action.payload.value)
                        break
                    case 'TraitChoice':
                        // this assumes no other investigator based deck size shenanigans
                        state.traitChoice = action.payload.value

                        const traitOptions = state.investigatorData.deck_options.filter(item => item.name === 'Trait Choice')[0].option_select.filter(item => item.name === action.payload.value)
                        
                        if (traitOptions.length > 0 && traitOptions[0].size) {
                            state.deckSize = state.investigatorData.deck_requirements.size + traitOptions[0].size
                        }
                        break
                    case 'SelectedTaboo':
                        state.selectedTaboo = parseInt(action.payload.value)
                        break
                    case 'Tab':
                        state.draftTab = action.payload.value
                        if (action.payload.value === 'Upgrade' && state.draftType === 'phaseDraft') state.draftType = 'draft'
                        break
                    case 'DraftType':
                        state.draftType = action.payload.value
                        if (state.draftType !== 'phaseDraft') state.draftUseLimited[0] = true
                        break
                    case 'Deckbuilding':
                        state.deckbuilding = action.payload.value
                        break
                    case 'SealedExtra':
                        state.sealedExtra = Math.min(SEALED_MAX_EXTRA, Math.max(0, parseInt(action.payload.value, 10) || 0))
                        break
                    case 'SealedPhaseExtra': {
                        // { phase, value }: a percentage for a small phase, or null for the general one again
                        const { phase, value } = action.payload.value

                        if (!state.sealedPhaseExtra) state.sealedPhaseExtra = {}

                        if (value === null) delete state.sealedPhaseExtra[phase]
                        else state.sealedPhaseExtra[phase] = Math.min(SEALED_MAX_EXTRA, Math.max(0, parseInt(value, 10) || 0))
                        break
                    }
                    case 'ProportionalLimits':
                        state.proportionalLimits = Boolean(action.payload.value)
                        break
                    case 'SealedDuplicates':
                        state.sealedDuplicates = Boolean(action.payload.value)
                        break
                    case 'SealedCopies':
                        state.sealedCopies = Boolean(action.payload.value)
                        break
                    case 'MyriadCount':
                        state.myriadCount = parseInt(action.payload.value)
                        break
                    case 'DraftCount':
                        state.draftCount[action.payload.value.phase-1] = typeof action.payload.value.value === 'string' ? parseInt(action.payload.value.value) : action.payload.value.value
                        break
                    case 'DraftCards':
                        state.draftCards[action.payload.value.phase-1] = typeof action.payload.value.value === 'string' ? parseInt(action.payload.value.value) : action.payload.value.value
                        break
                    case 'FilteredCount':
                        state.filteredCount = action.payload.value
                        break
                    case 'FilteredResearch':
                        state.filteredResearch = action.payload.value
                        break
                    case 'DraftUseLimited':
                        state.draftUseLimited[action.payload.value.phase-1] = !state.draftUseLimited[action.payload.value.phase-1]
                        break
                    case 'DraftWeighting':
                        state.draftWeighting = action.payload.value
                        break
                    case 'DraftXP':
                        state.draftXP = parseInt(action.payload.value)
                        break
                    case 'DeckID':
                        state.deckID = action.payload.value
                        break
                    case 'BurnCard':
                        state.burnCards[action.payload.value.id] = action.payload.value.value
                        break
                    case 'ExileCheckbox':
                        state.exileSelection[action.payload.id] = action.payload.value
                        break
                    case 'ResearchCheckbox':
                        state.researchSelection[action.payload.value] = state.researchSelection[action.payload.value] ? false : true
                        break
                    case 'OtherUpgrade':
                        if (action.payload.value.id === 'Pelt1') {
                            state.otherUpgradeSettings['Pelt'][0] = action.payload.value.value
                        }
                        else if (action.payload.value.id === 'Pelt2') {
                            state.otherUpgradeSettings['Pelt'][1] = action.payload.value.value
                        }
                        else {
                            state.otherUpgradeSettings[action.payload.value.id] = action.payload.value.value
                        }
                        break
                    case 'RemovedCards':
                        state.removedCards = action.payload.value
                        break
                    case 'ExcludeNormalVersatile':
                        state.excludeNormalVersatile = action.payload.value
                        break
                    case 'ConfirmDraft':
                        state.confirmDraft = action.payload.value
                        break
                    case 'DraftOrder':
                        state.draftOrder = action.payload.value
                        break
                    default:
                        break
                }
            },
            prepare(name, value) {
                if (name.includes('BurnCard')) {
                    const settingID = name.substring(8)
                    return { payload: { setting: 'BurnCard', value: { id: settingID-1, value: value }}}
                }
                else if (name.includes('ExileCheckbox')) {
                    const checkboxID = name.substring(13)
                    return { payload: { setting: 'ExileCheckbox', id: checkboxID, value: value }}
                }
                else if (name.includes('ResearchCheckbox')) {
                    const checkboxID = name.substring(16)
                    return { payload: { setting: 'ResearchCheckbox', value: checkboxID }}
                }
                else if (name.includes('OtherUpgrade')) {
                    const settingID = name.substring(12)

                    return { payload: {setting: 'OtherUpgrade', value: { id: settingID, value: value }}}
                }
                            
                return { payload: {setting: name, value: value } }
            }
        },
        beginDraft(state, action) {
            state.drafting = true
        },
        endDraft(state, action) {
            state.drafting = false
            state.complete = action.payload
        },
        reset(state, action) {
            const deckSizeValue = state.selectedDeckSize ? state.selectedDeckSize : state.investigatorData ? state.investigatorData.deck_requirements.size : state.deckSize

            state.deckSize = deckSizeValue
            state.selectedDeckSize = deckSizeValue
            state.burnCards = [ '', '' ]
            state.exileSelection = {}
            state.researchSelection = {}
            state.otherUpgradeSettings = { GMM: '0', Pelt: [false, false] }
            state.removedCards = 0
            state.drafting = false
            state.complete = false
            state.imagesrc = null
            state.imageanchor = null
            state.imagecode = null
            state.imagepinned = false
            state.setupStep = 'investigator'
            state.draftOrder = 'upgrade'
            state.upgradeAfterLevel0 = false
            state.investigatorPool = []
            state.investigatorDrafting = false
            state.undoDepth = 0
        },
        setInvestigatorMode(state, action) {
            state.investigatorMode = action.payload
        },
        // No investigator chosen: what depends on the one that was goes back to how it is when the page opens
        clearInvestigator(state) {
            ;['investigatorData', 'investigator', 'parallel', 'primaryClass', 'secondaryClass', 'classChoices', 'selectedDeckSize', 'traitChoice', 'deckSize'].forEach(key => {
                state[key] = JSON.parse(JSON.stringify(initialState[key] === undefined ? null : initialState[key]))
            })
        },
        setInvestigatorDraftOption(state, action) {
            state.investigatorDraftOptions[action.payload.name] = action.payload.value
        },
        beginInvestigatorDraft(state, action) {
            state.investigatorPool = action.payload
            state.investigatorDrafting = true
        },
        replaceInvestigatorInPool(state, action) {
            state.investigatorPool[action.payload.index] = action.payload.entry
        },
        endInvestigatorDraft(state) {
            state.investigatorPool = []
            state.investigatorDrafting = false
        },
        setUpgradeAfterLevel0(state, action) {
            state.upgradeAfterLevel0 = action.payload
        },
        setCardsPerRow(state, action) {
            state.cardsPerRow = action.payload
        },
        addBannedCard(state, action) {
            if (!state.bannedCards.includes(action.payload)) state.bannedCards.push(action.payload)
        },
        removeBannedCard(state, action) {
            state.bannedCards = state.bannedCards.filter(name => name !== action.payload)
        },
        clearBannedCards(state) {
            state.bannedCards = []
        },
        setAnimateTogether(state, action) {
            state.animateTogether = action.payload
        },
        setScrollToTop(state, action) {
            state.scrollToTop = action.payload
        },
        setAnimationSpeed(state, action) {
            state.animationSpeed = action.payload
        },
        setHighlightCost(state, action) {
            state.highlightCost = action.payload
        },
        setLanguage(state, action) {
            state.language = action.payload
        },
        changeSeed(state, action) {
            state.seed = action.payload
        },
        setUndoDepth(state, action) {
            state.undoDepth = action.payload
        },
        setSetupStep(state, action) {
            state.setupStep = action.payload
        },
        // closing the collection panel (or starting a draft, or applying a shared setup) means the collection is good enough
        confirmCollection(state) {
            state.collectionConfirmed = true
            state.collectionOpen = false
        },
        setCollectionOpen(state, action) {
            state.collectionOpen = action.payload
        },
        updateImageOverlay(state, action) {
            state.imagesrc = action.payload.imagesrc
            state.imageanchor = action.payload.anchor || null
            state.imagecode = action.payload.code || null
            state.imagepinned = !!action.payload.pinned
        }
    },
    extraReducers: (builder) => {
        // back to a moment of the draft (undo, or a draft saved earlier); the preferences stay as they are
        builder.addCase(restoreDraftState, (state, action) => restoreSettings(current(state), action.payload.settings))
    }
})

function changeInvestigatorList(entry) {
    return function changeInvestigatorThunk(dispatch, getState) {
        let re = /(.*)(\s\(Parallel\))/
        let re2 = /^(.*?)\s*\((.*)\)$/

        const match = entry.match(re)
        let name = entry
        let parallel = false

        const match2 = entry.match(re2)
        console.log('match2', match2, entry)
        let newVersion = false
        let set=null


        if (match) {
            name = match[1]
            parallel = true
        }
        else if (match2) {
            name=match2[1]
            newVersion = true
            set = match2[2]

        }    

        const cardData = getState().data.cardData
        const settings = getState().settings

        // Agatha has two investigator cards, we need to choose the correct one
        const investigatorID = (name === 'Agatha Crane') ?
    Object.keys(cardData)
        .filter(key => {
            return cardData[key].name === name
                && (parallel
                    ? typeof cardData[key].alternate_of_name !== 'undefined' &&
                      cardData[key].duplicate_of_name === undefined
                    : true)
                && (cardData[key].faction_code === settings.primaryClass)
                && (newVersion ? cardData[key].pack_name === set : true)
        })[0]
    :
    Object.keys(cardData)
        .filter(key => {
            return cardData[key].name === name
                && !cardData[key].hidden
                && !cardData[key].duplicate_of_code
                && (parallel
                    ? typeof cardData[key].alternate_of_name !== 'undefined' &&
                      cardData[key].duplicate_of_name === undefined
                    : typeof cardData[key].alternate_of_name === 'undefined' || newVersion)
                && (newVersion ? cardData[key].pack_name === set : true)
        })[0]
        console.log('investigatorID', investigatorID, name, parallel)
        dispatch(changeInvestigator({ data: cardData[investigatorID], parallel: parallel }))
    }
}

function changeInvestigatorDeck(data, parallel) {
    return function changeInvestigatorThunk(dispatch, getState) {
        dispatch(changeInvestigator( { data: data, parallel: parallel }))
    }
}

function calculateFilteredCount(dispatch, getState) {
    const state = getState()

    const filteredCards = FilterCards({
        cardData: state.data.cardData,
        investigatorData: state.settings.investigatorData,
        parallel: state.settings.parallel,
        secondaryClass: state.settings.secondaryClass,
        classChoices: state.settings.classChoices,
        traitChoice: state.settings.traitChoice,
        filteredResearch: state.settings.filteredResearch,
        researchSelection: state.settings.researchSelection,
        excludeNormalVersatile: state.settings.excludeNormalVersatile,
        draftUseLimited: state.settings.draftUseLimited,
        mergedList: state.draft.mergedList,
        deckList: state.draft.deckList,
        draftProgress: state.draft.progress,
        draftXP: state.settings.draftXP,
        draftWeighting: state.settings.draftWeighting,
        deckSize: state.settings.deckSize,
        phase: state.draft.phase,
        collection: state.collection,
        bannedCards: state.settings.bannedCards,
        deckModifiers: state.draft.deckModifiers,
        level0Swaps: state.draft.level0Swaps,
        level0Adds: state.draft.level0Adds,
        level0Requirements: state.draft.level0Requirements
    })

    const count = filteredCount({
        filteredData: filteredCards,
        draftType: state.draft.draftType,
        collection: state.collection
    })
    
    // for filtered research, we need all draftable cards, level 0-5
    const allFilteredCards = FilterCards({
        cardData: state.data.cardData,
        investigatorData: state.settings.investigatorData,
        parallel: state.settings.parallel,
        secondaryClass: state.settings.secondaryClass,
        classChoices: state.settings.classChoices,
        traitChoice: state.settings.traitChoice,
        filteredResearch: {},
        researchSelection: state.settings.researchSelection,
        excludeNormalVersatile: state.settings.excludeNormalVersatile,
        draftUseLimited: state.settings.draftUseLimited,
        mergedList: [],
        deckList: [],
        draftProgress: state.draft.progress,
        draftXP: state.settings.draftXP,
        draftWeighting: state.settings.draftWeighting,
        deckSize: state.settings.deckSize,
        phase: DraftPhases.AllCards,
        collection: state.collection,
        deckModifiers: state.draft.deckModifiers,
        level0Swaps: [],
        level0Adds: [],
        level0Requirements: []
    })

    const research = filterResearch({
        filteredData: allFilteredCards
    })


    dispatch(changeSetting('FilteredCount', count))
    dispatch(changeSetting('FilteredResearch', research))
}

export const { changeInvestigator, changeSetting, beginDraft, endDraft, reset, updateImageOverlay, setSetupStep, confirmCollection, setCollectionOpen, setUpgradeAfterLevel0, setCardsPerRow, setAnimationSpeed, setAnimateTogether, setScrollToTop, addBannedCard, removeBannedCard, clearBannedCards, setHighlightCost, setUndoDepth, changeSeed, setLanguage,
    setInvestigatorMode, clearInvestigator, setInvestigatorDraftOption, beginInvestigatorDraft, endInvestigatorDraft, replaceInvestigatorInPool } = settingsSlice.actions
export { changeInvestigatorList, changeInvestigatorDeck, calculateFilteredCount }

export default settingsSlice.reducer