import React, { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { Presence } from './usePresence'
import { useT } from '../i18n'

// How long the update may take before the screen offers to reload by hand
const SLOW_UPDATE = 15000

// Registers the service worker that makes the app work offline, and says when a new version is ready. The new version only takes over
// when the user chooses to reload, so nothing is lost in the middle of a draft (which is saved anyway, see draftState.js). Taking over can
// take a while (the new files are fetched), so a screen covers the page from the click until the page reloads.
function UpdateNotice() {
    const t = useT()

    const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW()

    const [updating, setUpdating] = useState(false)
    const [slow, setSlow] = useState(false)

    useEffect(() => {
        if (!updating) return undefined

        const timer = setTimeout(() => setSlow(true), SLOW_UPDATE)

        return () => clearTimeout(timer)
    }, [updating])

    function update() {
        setUpdating(true)
        setSlow(false)

        // when the update fails the notice is back, to try again
        Promise.resolve(updateServiceWorker(true)).catch(() => setUpdating(false))
    }

    return (
        <>
            <Presence visible={needRefresh && !updating} exit={220}>
                <div className="update-notice" role="status">
                    <span>{t('A new version of Draftham Horror is ready.')}</span>
                    <button type="button" className="btn btn-primary" onClick={update}>{t('Reload')}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setNeedRefresh(false)}>{t('Later')}</button>
                </div>
            </Presence>
            {updating ?
                <div className="update-screen" role="alert" aria-live="assertive">
                    <div className="update-spinner" aria-hidden="true"></div>
                    <p className="update-screen-title">{t('Updating Draftham Horror...')}</p>
                    {slow ?
                        <>
                            <p className="update-screen-hint">{t('It is taking longer than usual.')}</p>
                            <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>{t('Reload')}</button>
                        </>
                        : <p className="update-screen-hint">{t('The page reloads by itself in a moment.')}</p>}
                </div>
                : null}
        </>
    )
}

export default UpdateNotice
