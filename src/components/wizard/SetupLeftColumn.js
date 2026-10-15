import React from 'react'
import { useSelector } from 'react-redux'

import InvestigatorDraftPanel from '../InvestigatorDraftPanel'
import describeSetup from './describeSetup'
import { DeckPreviewCurve } from './DeckPreview'
import { useT } from '../../i18n'

// Left column of the setup: the chosen investigator and, when an ArkhamDB deck was validated, its cost curve
function SetupLeftColumn() {
    // describeSetup translates its texts: this makes them follow the language
    const t = useT()

    const settings = useSelector(state => state.settings)
    const tabooData = useSelector(state => state.data.tabooData)
    const collection = useSelector(state => state.collection)

    const info = describeSetup(settings, tabooData, collection)

    return (
        <div className="wizard-left draft-left">
            {settings.investigatorMode === 'draft' || !settings.investigatorData ?
                // an investigator to be drafted, or none chosen yet: the card says so and what to do
                <div className="settingsDiv">
                    <h2>{t('Investigator')}</h2>
                    <p className="investigator-subtitle is-value">{info.investigatorName}</p>
                    <p className="investigator-subtitle">{settings.investigatorMode === 'draft' ? info.classLine : settings.investigatorMode === 'arkhamdb' ? t('Taken from the ArkhamDB deck once its ID is validated') : t('Pick one from the list, or draw one at random')}</p>
                </div>
                :
                <InvestigatorDraftPanel title={info.investigatorName} subtitle={info.classLine} />}
            <DeckPreviewCurve />
        </div>
    )
}

export default SetupLeftColumn
