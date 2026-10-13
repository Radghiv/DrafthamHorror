import React from 'react'

import ThemeToggle from './ThemeToggle'
import LanguageSelect from './LanguageSelect'
import SettingsMenu from './SettingsMenu'
import logo from '../assets/logo.png'
import { useT } from '../i18n'

function AppHeader(props) {
    const { onRestart, onUndo, compact, phaseText, showCardsPerRow } = props

    const t = useT()

    return (
        <header className={'app-header' + (compact ? ' app-header-compact' : '')}>
            <img className="app-logo" src={logo} alt="Draftham Horror" />
            {compact && phaseText ? <h1 className="app-phase">{phaseText}</h1> : null}
            <div className="app-header-controls">
                {showCardsPerRow ? <SettingsMenu /> : null}
                {onUndo ? <button type="button" className="btn btn-secondary" onClick={onUndo} title={t('Undo the last pick (Ctrl+Z)')}>{t('Undo')}</button> : null}
                {onRestart ? <button type="button" className="btn btn-secondary" onClick={onRestart}>{t('Restart')}</button> : null}
                <LanguageSelect />
                <ThemeToggle />
            </div>
        </header>
    )
}

export default AppHeader
