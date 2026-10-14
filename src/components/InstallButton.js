import React, { useEffect, useState } from 'react'

import { subscribeToInstall, isInstalled, canPromptInstall, installPromptDismissed, isIosSafari, promptInstall } from '../install'
import { DownloadIcon } from './wizard/Icons'
import { useT } from '../i18n'

// A button next to the settings that installs the app (opens in its own window or full screen, starts at once and works offline). Its tooltip
// says why it is worth it (it shows on hover and keyboard focus, and on a tap where there is no install dialog to open). The button stays
// as long as the app is not installed: with a browser that can install it with a click it opens the dialog; on Safari on an iPhone or iPad,
// and after the dialog was closed, the tooltip says where to find it in the browser instead. Nothing inside the installed app.
function InstallButton() {
    const t = useT()

    const [, setVersion] = useState(0)
    const [help, setHelp] = useState(false)

    // the browser may say that the app can be installed (or that it was) after the page has been drawn
    useEffect(() => subscribeToInstall(() => setVersion(version => version + 1)), [])

    const canPrompt = canPromptInstall()
    const ios = isIosSafari()
    const dismissed = installPromptDismissed()

    // the development server has no manifest or service worker, so the browser never offers to install: the button is shown anyway (with the
    // hint about the menu) to be able to see and try it
    const developing = import.meta.env.MODE === 'development'

    if (isInstalled() || !(canPrompt || ios || dismissed || developing)) return null

    async function handleClick() {
        if (canPrompt) await promptInstall()
        else setHelp(!help)
    }

    return (
        <div className={'install-btn' + (help ? ' show-tip' : '')}>
            <button type="button" className="icon-btn" aria-describedby="install-tip" aria-label={t('Install Draftham Horror')} onClick={handleClick}
                onBlur={() => setHelp(false)}>
                <DownloadIcon />
            </button>
            <div className="install-tip" id="install-tip" role="tooltip">
                <strong>{t('Install Draftham Horror')}</strong>
                <span>{t('Use it like an app: it opens full screen, starts faster and works offline.')}</span>
                {canPrompt ? null : <span>{ios ? t('On an iPhone or iPad: tap the Share button, then “Add to Home Screen”.') : t('Your browser can install it from its menu: look for “Install app” or “Add to Home screen”.')}</span>}
            </div>
        </div>
    )
}

export default InstallButton
