import React, { useEffect, useState } from 'react'

import { subscribeToInstall, isInstalled, canPromptInstall, isIosSafari, promptInstall, installReminderDismissed, dismissInstallReminder } from '../install'
import { Presence } from './usePresence'
import { useT } from '../i18n'

// A reminder on the setup screens that the app can be installed (opens in its own window or full screen, starts at once and works offline).
// With a browser that can install it with a click there is a button; Safari on an iPhone or iPad shows where the Share menu has it. It is
// not shown inside the installed app, and "Later" keeps it away for a month.
function InstallPrompt() {
    const t = useT()

    const [, setVersion] = useState(0)
    const [dismissed, setDismissed] = useState(() => installReminderDismissed())

    // the browser may say that the app can be installed (or that it was) after the page has been drawn
    useEffect(() => subscribeToInstall(() => setVersion(version => version + 1)), [])

    const canPrompt = canPromptInstall()
    const ios = isIosSafari()
    const visible = !dismissed && !isInstalled() && (canPrompt || ios)

    function later() {
        dismissInstallReminder()
        setDismissed(true)
    }

    async function install() {
        const accepted = await promptInstall()

        if (!accepted) later()
    }

    return (
        <Presence visible={visible} exit={260}>
            <section className="resume-draft install-prompt" aria-label={t('Install Draftham Horror')}>
                <div className="resume-draft-text">
                    <strong>{t('Install Draftham Horror')}</strong>
                    <span>{canPrompt ? t('Use it like an app: it opens full screen, starts faster and works offline.') : t('On an iPhone or iPad: tap the Share button, then “Add to Home Screen”.')}</span>
                </div>
                <div className="resume-draft-actions">
                    {canPrompt ? <button type="button" className="btn btn-primary" onClick={install}>{t('Install')}</button> : null}
                    <button type="button" className="btn btn-secondary" onClick={later}>{canPrompt ? t('Later') : t('Got it')}</button>
                </div>
            </section>
        </Presence>
    )
}

export default InstallPrompt
