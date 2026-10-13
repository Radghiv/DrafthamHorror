import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

import { readSharedSetup, forgetSharedSetup, applySharedSetup } from '../share'
import { useT } from '../i18n'

// Offered on the setup screens when the page was opened with a link that carries a setup (see the Review step)
function SharedSetup() {
    const t = useT()
    const dispatch = useDispatch()

    const [payload, setPayload] = useState(() => readSharedSetup())
    const [failed, setFailed] = useState(false)

    if (!payload) return null

    function use() {
        const applied = dispatch(applySharedSetup(payload))

        if (applied) {
            forgetSharedSetup()
            setPayload(null)
        }
        else {
            setFailed(true)
        }
    }

    function ignore() {
        forgetSharedSetup()
        setPayload(null)
    }

    return (
        <section className="resume-draft" aria-label={t('Shared setup')}>
            <div className="resume-draft-text">
                <strong>{t('Shared setup')}</strong>
                <span>{t('{investigator} · Build Deck · seed {seed}', { investigator: payload.investigator, seed: payload.seed })}</span>
                <span>{t('Using it replaces your collection, taboo list and ban list with the ones of the link.')}</span>
                {failed ? <span role="alert">{t("This version doesn't know that investigator.")}</span> : null}
            </div>
            <div className="resume-draft-actions">
                <button type="button" className="btn btn-primary" onClick={use}>{t('Use this setup')}</button>
                <button type="button" className="btn btn-secondary" onClick={ignore}>{t('Ignore')}</button>
            </div>
        </section>
    )
}

export default SharedSetup
