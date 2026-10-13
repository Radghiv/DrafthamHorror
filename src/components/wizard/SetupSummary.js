import React from 'react'

import useStartDraft from './useStartDraft'
import { DeckPreviewList } from './DeckPreview'
import { useT } from '../../i18n'

// Right column of the setup: the Start button, and the cards of the validated ArkhamDB deck below it
function SetupSummary(props) {
    const t = useT()
    const { hideStart } = props

    const { start, canStart, deckFetchError } = useStartDraft()

    const showError = deckFetchError && !hideStart

    return (
        <aside className="panel wizard-summary" aria-label={t('Start')}>
            {showError ?
                <p className="notice notice-error" role="alert">{t('Deck not found. Check the ArkhamDB deck ID in the Investigator step. Only public decks can be loaded.')}</p>
                : null}
            {hideStart ? null :
                <button type="button" className="btn btn-primary btn-block" onClick={start} disabled={!canStart}>
                    {t('Start draft')}
                </button>}
            <DeckPreviewList />
        </aside>
    )
}

export default SetupSummary
