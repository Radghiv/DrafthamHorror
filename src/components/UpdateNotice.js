import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { useT } from '../i18n'

// Registers the service worker that makes the app work offline, and says when a new version is ready. The new version only takes over
// when the user chooses to reload, so nothing is lost in the middle of a draft (which is saved anyway, see draftState.js).
function UpdateNotice() {
    const t = useT()

    const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW()

    if (!needRefresh) return null

    return (
        <div className="update-notice" role="status">
            <span>{t('A new version of Draftham Horror is ready.')}</span>
            <button type="button" className="btn btn-primary" onClick={() => updateServiceWorker(true)}>{t('Reload')}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setNeedRefresh(false)}>{t('Later')}</button>
        </div>
    )
}

export default UpdateNotice
