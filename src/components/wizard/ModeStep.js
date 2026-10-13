import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeSetting, calculateFilteredCount } from '../../features/settings/settingsSlice'
import { changePhase } from '../../features/draft/draftSlice'
import { loadDeckCards, unloadDeckCards } from '../../features/data/dataSlice'
import DraftPhases from '../../data/DraftPhases'
import { useT, msg } from '../../i18n'

const MODES = [
    {
        tab: 'Build Deck',
        phase: DraftPhases.BuildPhase1,
        title: msg('Build Deck'),
        text: msg('Draft a brand new deck for the chosen investigator, one card at a time.'),
        icon: <path d="M5 9h5l3 3 3-6 3 6 4-3M5 19h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    },
    {
        tab: 'Upgrade',
        phase: DraftPhases.UpgradePhase,
        title: msg('Upgrade'),
        text: msg('Spend experience on level 1+ cards, optionally loading an existing deck from ArkhamDB.'),
        icon: <path d="M4 21h6v-6h6v-6h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    }
]

function ModeStep() {
    const t = useT()
    const draftTab = useSelector(state => state.settings.draftTab)
    const deckValidation = useSelector(state => state.data.deckValidation)

    const dispatch = useDispatch()

    function handleSelect(mode) {
        const changed = mode.tab !== draftTab
        const hasDeck = changed && deckValidation.status === 'valid'

        // a deck that was taken from ArkhamDB keeps being the investigator's, but its cards only belong to an upgrade
        if (hasDeck && mode.tab === 'Build Deck') dispatch(unloadDeckCards)

        dispatch(changeSetting('Tab', mode.tab))
        dispatch(changePhase(mode.phase))

        if (hasDeck && mode.tab === 'Upgrade') dispatch(loadDeckCards)

        dispatch(calculateFilteredCount)
    }

    return (
        <div className="option-cards" role="group" aria-label={t('Build a deck or upgrade one')}>
            {MODES.map(mode => (
                <button type="button" key={mode.tab} className="option-card" aria-pressed={draftTab === mode.tab} onClick={() => handleSelect(mode)}>
                    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">{mode.icon}</svg>
                    <span className="option-card-title">{t(mode.title)}</span>
                    <span className="option-card-text">{t(mode.text)}</span>
                </button>
            ))}
        </div>
    )
}

export default ModeStep
