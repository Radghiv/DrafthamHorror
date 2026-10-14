import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { resumeSavedDraft } from '../features/draftHistory'
import { loadSavedDraft, clearSavedDraft } from '../features/draftState'
import { Presence } from './usePresence'
import { startResumeFlight } from '../draft/flyInvestigator'
import { useT, useFormatDate } from '../i18n'

// Offered on the setup screens when the browser holds a draft that was left unfinished: carry on where it was left, or drop it
function ResumeDraft() {
    const t = useT()
    const formatDate = useFormatDate()
    const dispatch = useDispatch()
    const animationSpeed = useSelector(state => state.settings.animationSpeed)

    const [saved, setSaved] = useState(() => loadSavedDraft())

    const when = saved ? formatDate(saved.savedAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

    // the setup cross-fades into the draft screen (the copy of the setup is made before the draft is restored)
    function resume() {
        const flight = startResumeFlight(animationSpeed)

        dispatch(resumeSavedDraft)
        if (flight) requestAnimationFrame(flight.land)
    }

    function discard() {
        clearSavedDraft()
        setSaved(null)
    }

    return (
        <Presence visible={Boolean(saved)} exit={260}>
            {saved ?
                <section className="resume-draft" aria-label={t('Unfinished draft')}>
                    <div className="resume-draft-text">
                        <strong>{t('Unfinished draft')}</strong>
                        <span>{t('{label} · saved {when}', { label: saved.label, when: when })}</span>
                    </div>
                    <div className="resume-draft-actions">
                        <button type="button" className="btn btn-primary" onClick={resume}>{t('Resume draft')}</button>
                        <button type="button" className="btn btn-secondary" onClick={discard}>{t('Discard')}</button>
                    </div>
                </section>
                : null}
        </Presence>
    )
}

export default ResumeDraft
