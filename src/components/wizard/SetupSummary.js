import React from 'react'
import { useSelector } from 'react-redux'

import useStartDraft from './useStartDraft'
import SetupInfo from './SetupInfo'
import { DeckPreviewList } from './DeckPreview'
import usePhoneLayout from '../usePhoneLayout'
import { useT } from '../../i18n'

// Right column of the setup: the Start button, the choices so far and, below them, the cards of the validated ArkhamDB deck.
// On a phone the Review step already says all that, so the choices are left out there.
function SetupSummary() {
    const t = useT()

    const { start, canStart, deckFetchError } = useStartDraft()

    const phone = usePhoneLayout()
    const step = useSelector(state => state.settings.setupStep)

    return (
        <aside className="panel wizard-summary" aria-label={t('Start')}>
            {deckFetchError ?
                <p className="notice notice-error" role="alert">{t('Deck not found. Check the ArkhamDB deck ID in the Investigator step. Only public decks can be loaded.')}</p>
                : null}
            <button type="button" className="btn btn-primary btn-block" onClick={start} disabled={!canStart}>
                {t('Start draft')}
            </button>
            {phone && step === 'review' ? null : <SetupInfo />}
            <DeckPreviewList />
        </aside>
    )
}

export default SetupSummary
