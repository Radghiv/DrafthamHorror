import React from 'react'

import SettingsMenu from './SettingsMenu'
import AppLogo from './AppLogo'
import RestartButton from './RestartButton'
import DraftBreadcrumbs from './DraftBreadcrumbs'
import usePhoneLayout from './usePhoneLayout'
import useDraftProgress from '../draft/useDraftProgress'
import { UndoIcon } from './wizard/Icons'
import { useT } from '../i18n'

// What the draft has reached, for the phone's top bar: the count, and a thin segmented line under the bar
function PhoneProgressCount() {
    const t = useT()

    const progress = useDraftProgress()

    return <span className="phone-count"><strong key={progress.value}>{progress.value}</strong> / {progress.target}<span className="phone-count-unit"> {progress.isUpgrade ? t('XP') : t('cards')}</span></span>
}

function PhoneProgressLine() {
    const t = useT()

    const progress = useDraftProgress()

    // one segment per card (or per XP), capped so very large targets still read as a line
    const count = progress.target > 0 ? Math.min(progress.target, 60) : 0
    const filled = progress.target > 0 ? Math.round(Math.min(Math.max(progress.value, 0), progress.target) / progress.target * count) : 0
    const segments = []

    for (let i = 0; i < count; i++) {
        segments.push(<span className={'phone-segment' + (i < filled ? ' filled' : '')} key={i}></span>)
    }

    return (
        <div className="phone-progress" role="progressbar" aria-valuemin="0" aria-valuemax={progress.target} aria-valuenow={progress.value}
            aria-label={progress.isUpgrade ? t('Drafted XP') : t('Drafted cards')}>
            {segments}
        </div>
    )
}

function AppHeader(props) {
    // the setup wizard has its own top row with the logo, the steps and the language and theme controls (inWizard)
    // hasDock: the phone's dock is on screen, and it holds Undo
    const { onRestart, onUndo, onHome, onInvestigator, compact, phaseText, showCardsPerRow, inWizard, hasDock } = props

    const t = useT()

    const phone = usePhoneLayout()

    if (inWizard) return null

    // On a phone the header is one short bar that stays at the top: the logo, the phase, how far the draft is and the settings.
    // Restart is in the settings and Undo in the dock (or, on screens without a dock, here).
    if (phone) {
        return (
            <header className="app-header phone-top">
                <div className="phone-top-row">
                    <AppLogo onClick={onHome} />
                    {compact && phaseText ? <DraftBreadcrumbs phaseText={phaseText} onHome={onHome} onInvestigator={onInvestigator} /> : <span className="phone-top-fill"></span>}
                    {showCardsPerRow ? <PhoneProgressCount /> : null}
                    {onUndo && !hasDock ? <button type="button" className="icon-btn" onClick={onUndo} aria-label={t('Undo')} title={t('Undo the last pick (Ctrl+Z)')}><UndoIcon /></button> : null}
                    <SettingsMenu onRestart={onRestart} onInvestigator={onInvestigator} />
                </div>
                {showCardsPerRow ? <PhoneProgressLine /> : null}
            </header>
        )
    }

    return (
        <header className={'app-header' + (compact ? ' app-header-compact' : '')}>
            <AppLogo onClick={onHome} />
            {compact && phaseText ? <DraftBreadcrumbs phaseText={phaseText} onHome={onHome} onInvestigator={onInvestigator} /> : null}
            {compact ? <div className="draft-header-slot" id="draft-header-slot"></div> : null}
            <div className="app-header-controls">
                <SettingsMenu />
                {onUndo ? <button type="button" className="btn btn-secondary" onClick={onUndo} title={t('Undo the last pick (Ctrl+Z)')}>{t('Undo')}</button> : null}
                {onRestart ? <RestartButton onRestart={onRestart} /> : null}
            </div>
        </header>
    )
}

export default AppHeader
