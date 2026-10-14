import React from 'react'

import useStartDraft from './useStartDraft'
import SetupInfo from './SetupInfo'
import { DeckPreviewList } from './DeckPreview'
import { useT } from '../../i18n'

// Right column of the setup: the Start button, the choices so far and, below them, the cards of the validated ArkhamDB deck
function SetupSummary() {
    const t = useT()

    const { start, canStart, deckFetchError } = useStartDraft()

    return (
        <aside className="panel wizard-summary" aria-label={t('Start')}>
            {deckFetchError ?
                <p className="notice notice-error" role="alert">{t('Deck not found. Check the ArkhamDB deck ID in the Investigator step. Only public decks can be loaded.')}</p>
                : null}
            <button type="button" className="btn btn-primary btn-block" onClick={start} disabled={!canStart}>
                {t('Start draft')}
            </button>
            <SetupInfo />
            <DeckPreviewList />
        </aside>
    )
}

export default SetupSummary
