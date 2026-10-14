import React from 'react'
import { useSelector } from 'react-redux'

import useStartDraft from './useStartDraft'
import { CheckIcon, WarningIcon } from './Icons'
import { useT } from '../../i18n'

// Whether the setup can be started, and if not why
function StartStatus(props) {
    const t = useT()
    const { extra } = props

    const investigatorMode = useSelector(state => state.settings.investigatorMode)
    const filteredCount = useSelector(state => state.settings.filteredCount)

    const { enoughCards, needsDeck, noInvestigators } = useStartDraft()

    if (needsDeck) {
        return <div className="status status-bad" key="needs-deck"><WarningIcon /> {t('Validate an ArkhamDB deck ID in the Investigator step to continue')}</div>
    }

    if (noInvestigators) {
        return <div className="status status-bad" role="alert" key="no-investigators"><WarningIcon /> {t('No investigator matches the investigator draft options')}</div>
    }

    if (!enoughCards) {
        return <div className="status status-bad" role="alert" key="not-enough"><WarningIcon /> {t('There are not enough cards in the selected packs to draft a complete deck. Add packs in the collection.')}</div>
    }

    if (investigatorMode === 'draft') {
        return <div className="status status-ok" key="investigator-first"><CheckIcon /> {t('The investigator is drafted first, then the deck')}</div>
    }

    return <div className="status status-ok" key="enough"><CheckIcon /> {extra ? t('Enough cards to draft a complete deck ({count} legal cards)', { count: filteredCount }) : t('Enough cards to draft a complete deck')}</div>
}

export default StartStatus
