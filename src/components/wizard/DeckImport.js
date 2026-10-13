import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeSetting } from '../../features/settings/settingsSlice'
import { validateDeck, unloadDeck, setDeckValidation } from '../../features/data/dataSlice'
import { CheckIcon } from './Icons'
import { useT } from '../../i18n'

// ArkhamDB deck the investigator is taken from. Validating switches the setup to the deck's investigator and, when upgrading,
// loads the deck's cards too.
function DeckImport() {
    const t = useT()
    const deckID = useSelector(state => state.settings.deckID)
    const deckFetchError = useSelector(state => state.data.deckFetchError)
    const validation = useSelector(state => state.data.deckValidation)
    const isUpgradeTab = useSelector(state => state.settings.draftTab === 'Upgrade')

    const dispatch = useDispatch()

    const trimmedID = deckID.trim()
    const isChecking = validation.status === 'checking'
    // a result only counts for the ID it was obtained with
    const result = validation.id === trimmedID ? validation.status : 'idle'

    function handleChange(event) {
        dispatch(changeSetting('DeckID', event.target.value))

        // a loaded deck has to be taken out of the setup before another ID can be tried
        if (validation.status === 'valid') dispatch(unloadDeck)
        else dispatch(setDeckValidation({ status: 'idle' }))
    }

    function handleSubmit(event) {
        event.preventDefault()

        if (trimmedID && !isChecking) dispatch(validateDeck)
    }

    return (
        <form className="stack" style={{gap: '12px'}} onSubmit={handleSubmit}>
            <div className="field">
                <label htmlFor="deck-id">{t('ArkhamDB deck ID')}</label>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
                    <input id="deck-id" name="DeckID" type="text" value={deckID} onChange={handleChange} autoComplete="off"
                        aria-describedby="deck-id-hint" style={{flex: '1 1 220px', width: 'auto'}} />
                    <button type="submit" className="btn btn-secondary" disabled={!trimmedID || isChecking || result === 'valid'}>
                        {isChecking ? t('Checking...') : t('Validate')}
                    </button>
                </div>
                <p className="field-hint" id="deck-id-hint">{isUpgradeTab ?
                    t("Enter an ArkhamDB deck ID to load an existing deck, so cards that take effect while upgrading are used. Validating switches the investigator to the deck's. Drafted cards are added to a drafted list, and cards removed by an upgrade (or forcibly, such as by On Your Own) appear in a removed cards list.") :
                    t("Enter an ArkhamDB deck ID to take its investigator, class choices, deck size and taboo list. Only those are used: the deck's cards are not.")}</p>
            </div>
            {result === 'valid' ?
                <div className="status status-ok" role="status"><CheckIcon /> {validation.name ? t('"{name}" is a valid deck for {investigator}.', { name: validation.name, investigator: validation.investigator }) : t('Valid deck for {investigator}.', { investigator: validation.investigator })} {t('To pick another investigator, clear or change the deck ID.')}</div>
                : null}
            {result === 'invalid' || deckFetchError ?
                <p className="notice notice-error" role="alert">{t('Deck not found. Currently only unpublished decks can be loaded. Make sure the ID is correct and that "Make your decks public" is selected in your ArkhamDB settings.')}</p>
                : null}
        </form>
    )
}

export default DeckImport
