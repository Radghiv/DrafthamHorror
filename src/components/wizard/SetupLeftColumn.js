import React from 'react'
import { useSelector } from 'react-redux'

import InvestigatorDraftPanel from '../InvestigatorDraftPanel'
import describeSetup from './describeSetup'
import { DeckPreviewCurve } from './DeckPreview'
import { useT } from '../../i18n'

// Left column of the setup: the chosen investigator and, when an ArkhamDB deck was validated, its cost curve
function SetupLeftColumn() {
    // describeSetup translates its texts: this makes them follow the language
    useT()

    const settings = useSelector(state => state.settings)
    const tabooData = useSelector(state => state.data.tabooData)
    const collection = useSelector(state => state.collection)

    const info = describeSetup(settings, tabooData, collection)

    return (
        <div className="wizard-left draft-left">
            {settings.investigatorMode === 'draft' ?
                <div className="settingsDiv">
                    <h2>{info.investigatorName}</h2>
                    <p className="investigator-subtitle">{info.classLine}</p>
                </div>
                :
                <InvestigatorDraftPanel title={info.investigatorName} subtitle={info.classLine} />}
            <DeckPreviewCurve />
        </div>
    )
}

export default SetupLeftColumn
