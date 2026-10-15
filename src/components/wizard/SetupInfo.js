import React from 'react'
import { useSelector } from 'react-redux'

import describeSetup from './describeSetup'
import StartStatus from './StartStatus'
import CollectionRecap from '../CollectionRecap'
import { useT } from '../../i18n'

// The choices made so far and whether they leave enough cards to draft (right column of the setup, below the Start button)
function SetupInfo() {
    const t = useT()
    const settings = useSelector(state => state.settings)
    const tabooData = useSelector(state => state.data.tabooData)
    const collection = useSelector(state => state.collection)

    const info = describeSetup(settings, tabooData, collection)

    return (
        <div className="settingsDiv setup-info">
            <h2>{t('Your setup')}</h2>
            <StartStatus />
            <dl className="summary-list">
                <dt>{t('Taboo list')}</dt><dd>{info.tabooLabel}</dd>
                <dt>{info.isUpgradeTab ? t('Experience') : t('Deck size')}</dt><dd>{info.deckSizeLabel}</dd>
                <dt>{t('Legal cards')}</dt><dd>{info.hasInvestigator ? settings.filteredCount : '—'}</dd>
            </dl>
            <div className="setup-collection">
                <span className="setup-collection-label">{t('Collection')}</span>
                <CollectionRecap />
            </div>
        </div>
    )
}

export default SetupInfo
