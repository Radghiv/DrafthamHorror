import { changeCollection } from './features/collection/collectionSlice'
import { changeSetting, calculateFilteredCount, setSetupStep, confirmCollection, changeSeed, addBannedCard, clearBannedCards } from './features/settings/settingsSlice'
import { selectInvestigatorEntry } from './features/settings/investigatorActions'
import { investigatorEntries, findInvestigatorCard } from './data/InvestigatorList'

// A link that carries a build setup (investigator, rules, taboo list, collection, ban list and the seed of the draft), so somebody else can
// start the same draft. Upgrades are not shared: they start from a deck that may be private.
const HASH_KEY = '#setup='
const VERSION = 1

function toBase64Url(text) {
    const bytes = new TextEncoder().encode(text)
    let binary = ''

    bytes.forEach(byte => { binary += String.fromCharCode(byte) })

    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text) {
    const binary = window.atob(text.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))

    return new TextDecoder().decode(bytes)
}

// The entry of the investigator list that is the selected investigator
function currentEntry(state) {
    const { cardData } = state.data
    const investigator = state.settings.investigatorData

    if (!cardData || !investigator) return null

    return investigatorEntries(cardData).find(entry => {
        const card = findInvestigatorCard(entry, cardData)

        return card && card.code === investigator.code
    }) || null
}

export function canShare(state) {
    return state.settings.draftTab !== 'Upgrade' && state.settings.investigatorMode !== 'draft' && currentEntry(state) !== null
}

export function buildShareLink(state) {
    const { settings, collection } = state
    const investigator = currentEntry(state)

    if (!canShare(state)) return null

    const payload = {
        v: VERSION,
        investigator: investigator,
        seed: settings.seed,
        draftType: settings.draftType,
        deckbuilding: settings.deckbuilding,
        sealedExtra: settings.sealedExtra,
        sealedCopies: settings.sealedCopies,
        sealedDuplicates: settings.sealedDuplicates,
        myriadCount: settings.myriadCount,
        proportionalLimits: settings.proportionalLimits,
        draftWeighting: settings.draftWeighting,
        draftXP: settings.draftXP,
        draftCount: settings.draftCount,
        draftCards: settings.draftCards,
        draftUseLimited: settings.draftUseLimited,
        excludeNormalVersatile: settings.excludeNormalVersatile,
        confirmDraft: settings.confirmDraft,
        taboo: settings.selectedTaboo,
        secondaryClass: settings.secondaryClass,
        classChoices: settings.classChoices,
        traitChoice: settings.traitChoice,
        selectedDeckSize: settings.selectedDeckSize,
        banned: settings.bannedCards,
        collection: Object.keys(collection).filter(code => collection[code])
    }

    return window.location.origin + window.location.pathname + HASH_KEY + toBase64Url(JSON.stringify(payload))
}

// The setup in the address of the page, or null
export function readSharedSetup() {
    try {
        const hash = window.location.hash

        if (!hash.startsWith(HASH_KEY)) return null

        const payload = JSON.parse(fromBase64Url(hash.slice(HASH_KEY.length)))

        return payload && payload.v === VERSION && typeof payload.investigator === 'string' ? payload : null
    }
    catch (e) {
        return null
    }
}

// Takes the setup out of the address, so reloading the page doesn't offer it again
export function forgetSharedSetup() {
    try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    catch (e) {
        // ignore
    }
}

// Applies a shared setup (as read by readSharedSetup) and lands on the review step. Returns false when the investigator is unknown.
export function applySharedSetup(payload) {
    return function applySharedSetupThunk(dispatch, getState) {
        const { cardData, tabooData } = getState().data

        if (!cardData || !findInvestigatorCard(payload.investigator, cardData)) return false

        const known = Object.keys(getState().collection)

        dispatch(changeCollection('Off', known))
        dispatch(changeCollection('On', (payload.collection || []).filter(code => known.includes(code))))

        dispatch(clearBannedCards())
        ;(payload.banned || []).forEach(name => dispatch(addBannedCard(name)))

        dispatch(selectInvestigatorEntry(payload.investigator))

        // after the investigator, whose choice resets the class and deck size
        if (payload.secondaryClass) dispatch(changeSetting('SecondaryClass', payload.secondaryClass))
        if (payload.classChoices) {
            dispatch(changeSetting('ClassChoice1', payload.classChoices.faction_1))
            dispatch(changeSetting('ClassChoice2', payload.classChoices.faction_2))
        }
        if (payload.traitChoice) dispatch(changeSetting('TraitChoice', payload.traitChoice))
        if (payload.selectedDeckSize) dispatch(changeSetting('SelectedDeckSize', payload.selectedDeckSize))

        dispatch(changeSetting('Tab', 'Build Deck'))
        dispatch(changeSetting('DraftType', payload.draftType))
        // a link made before the sealed mode existed is a draft
        dispatch(changeSetting('Deckbuilding', payload.deckbuilding === 'sealed' ? 'sealed' : 'draft'))
        // (a link from before the size of the pool was a percentage has a number of cards, which isn't kept)
        if (payload.sealedExtra !== undefined) dispatch(changeSetting('SealedExtra', payload.sealedExtra))
        dispatch(changeSetting('SealedCopies', payload.sealedCopies === true))
        dispatch(changeSetting('SealedDuplicates', payload.sealedDuplicates === true))
        if (payload.myriadCount) dispatch(changeSetting('MyriadCount', payload.myriadCount))
        // a link made before the proportions dealt the cards evenly
        dispatch(changeSetting('ProportionalLimits', payload.proportionalLimits === true))
        dispatch(changeSetting('DraftWeighting', payload.draftWeighting))
        dispatch(changeSetting('DraftXP', payload.draftXP))
        dispatch(changeSetting('ExcludeNormalVersatile', payload.excludeNormalVersatile))
        dispatch(changeSetting('ConfirmDraft', payload.confirmDraft))

        ;(payload.draftCount || []).forEach((value, index) => dispatch(changeSetting('DraftCount', { phase: index + 1, value: value })))
        ;(payload.draftCards || []).forEach((value, index) => dispatch(changeSetting('DraftCards', { phase: index + 1, value: value })))
        ;(payload.draftUseLimited || []).forEach((value, index) => {
            if (getState().settings.draftUseLimited[index] !== value) dispatch(changeSetting('DraftUseLimited', { phase: index + 1 }))
        })

        // a taboo list this version doesn't know keeps the default one
        if (tabooData && (payload.taboo === 0 || tabooData.some(item => item.id === payload.taboo))) dispatch(changeSetting('SelectedTaboo', payload.taboo))

        dispatch(changeSeed(payload.seed || ''))
        dispatch(confirmCollection())
        dispatch(calculateFilteredCount)
        dispatch(setSetupStep('review'))

        return true
    }
}
