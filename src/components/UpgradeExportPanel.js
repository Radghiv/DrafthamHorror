import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { arkhamBuildUpgradeDeck, downloadArkhamBuildDeck } from '../draft/ExportArkhamBuild'
import { CheckIcon } from './wizard/Icons'
import { useT } from '../i18n'

// The upgraded deck as a file for arkham.build: the deck from ArkhamDB with the cards it ended with. It is there once something was drafted or
// removed (before that it would be the deck as it was) and only for a deck that was loaded in this session of the draft.
function UpgradeExportPanel() {
    const t = useT()

    const sourceDeck = useSelector(state => state.draft.sourceDeck)
    const mergedList = useSelector(state => state.draft.mergedList)
    const deckList = useSelector(state => state.draft.deckList)
    const cardList = useSelector(state => state.draft.cardList)
    const removedList = useSelector(state => state.draft.removedList)

    const [deckTitle, setDeckTitle] = useState('')
    const [exported, setExported] = useState(false)

    if (!sourceDeck || (cardList.length === 0 && removedList.length === 0)) return null

    function handleExport() {
        const title = deckTitle.length > 0 ? deckTitle : sourceDeck.name

        downloadArkhamBuildDeck(arkhamBuildUpgradeDeck({ original: sourceDeck, title: title, mergedList: mergedList, deckList: deckList }), title)

        setExported(true)
        setTimeout(() => setExported(false), 2200)
    }

    return (
        <div className="settingsDiv export-panel">
            <h3>{t('Export options')}</h3>

            <div className="field">
                <label htmlFor="upgrade-deck-title">{t('Deck title')}</label>
                <input id="upgrade-deck-title" type="text" value={deckTitle} onChange={event => setDeckTitle(event.target.value)} placeholder={sourceDeck.name} autoComplete="off" />
            </div>

            <div className="options-section">
                <h4>arkham.build</h4>
                <button type="button" className="btn btn-block btn-primary" onClick={handleExport}>
                    {exported ? <span className="pop-check"><CheckIcon size={16} /></span> : null} {t('Export for arkham.build (.json)')}
                </button>
                <p className="field-hint">{t('In arkham.build: deck list, then Import from JSON files. It has every card and the choices of the deck.')}</p>
            </div>
        </div>
    )
}

export default UpgradeExportPanel
