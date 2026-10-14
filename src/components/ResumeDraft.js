import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

import { resumeSavedDraft } from '../features/draftHistory'
import { loadSavedDraft, clearSavedDraft } from '../features/draftState'
import { useT, useFormatDate } from '../i18n'

// Offered on the setup screens when the browser holds a draft that was left unfinished: carry on where it was left, or drop it
function ResumeDraft() {
    const t = useT()
    const formatDate = useFormatDate()
    const dispatch = useDispatch()

    const [saved, setSaved] = useState(() => loadSavedDraft())

    if (!saved) return null

    const when = formatDate(saved.savedAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

    function discard() {
        clearSavedDraft()
        setSaved(null)
    }

    return (
        <section className="resume-draft" aria-label={t('Unfinished draft')}>
            <div className="resume-draft-text">
                <strong>{t('Unfinished draft')}</strong>
                <span>{t('{label} · saved {when}', { label: saved.label, when: when })}</span>
            </div>
            <div className="resume-draft-actions">
                <button type="button" className="btn btn-primary" onClick={() => dispatch(resumeSavedDraft)}>{t('Resume draft')}</button>
                <button type="button" className="btn btn-secondary" onClick={discard}>{t('Discard')}</button>
            </div>
        </section>
    )
}

export default ResumeDraft
