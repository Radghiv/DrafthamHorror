import React from 'react'

import SettingsMenu from './SettingsMenu'
import AppLogo from './AppLogo'
import RestartButton from './RestartButton'
import { useT } from '../i18n'

function AppHeader(props) {
    // the setup wizard has its own top row with the logo, the steps and the language and theme controls (inWizard)
    const { onRestart, onUndo, onHome, compact, phaseText, showCardsPerRow, inWizard } = props

    const t = useT()

    if (inWizard) return null

    return (
        <header className={'app-header' + (compact ? ' app-header-compact' : '')}>
            <AppLogo onClick={onHome} />
            {compact && phaseText ? <h1 className="app-phase">{phaseText}</h1> : null}
            <div className="app-header-controls">
                <SettingsMenu draftOptions={showCardsPerRow} />
                {onUndo ? <button type="button" className="btn btn-secondary" onClick={onUndo} title={t('Undo the last pick (Ctrl+Z)')}>{t('Undo')}</button> : null}
                {onRestart ? <RestartButton onRestart={onRestart} /> : null}
            </div>
        </header>
    )
}

export default AppHeader
