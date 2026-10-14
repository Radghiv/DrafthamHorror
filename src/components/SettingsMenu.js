import React, { useState, useEffect, useRef } from 'react'

import CardsPerRowSlider from './CardsPerRowSlider'
import AnimationSpeedSlider from './AnimationSpeedSlider'
import AnimateTogetherToggle from './AnimateTogetherToggle'
import ScrollToTopToggle from './ScrollToTopToggle'
import LanguageSelect from './LanguageSelect'
import ThemeToggle from './ThemeToggle'
import { RestartDialog } from './RestartButton'
import { Presence } from './usePresence'
import { SettingsIcon } from './wizard/Icons'
import { useT } from '../i18n'

// The settings button and the small panel it opens: all the settings, on every screen. The panel closes with a click outside, Escape or the button itself.
// With onRestart (a phone, where the header has no room for a Restart button) the panel also holds Restart, which asks for confirmation.
function SettingsMenu(props) {
    const { onRestart } = props

    const t = useT()

    const [open, setOpen] = useState(false)
    const [restarting, setRestarting] = useState(false)

    const wrapperRef = useRef(null)

    useEffect(() => {
        if (!open) return undefined

        function handlePointerDown(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false)
        }
        function handleKeyDown(event) {
            if (event.key === 'Escape') setOpen(false)
        }

        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [open])

    return (
        <div className="settings-menu" ref={wrapperRef}>
            <button type="button" className="icon-btn" aria-haspopup="true" aria-expanded={open} aria-controls="settings-popover"
                title={t('Settings')} aria-label={t('Settings')} onClick={() => setOpen(!open)}>
                <SettingsIcon />
            </button>
            <Presence visible={open} exit={140}>
                <div className="settings-popover" id="settings-popover" role="group" aria-label={t('Settings')}>
                    <h2>{t('Settings')}</h2>
                    <LanguageSelect />
                    <ThemeToggle />
                    <AnimationSpeedSlider />
                    <ScrollToTopToggle />
                    <AnimateTogetherToggle />
                    <CardsPerRowSlider />
                    {onRestart ?
                        <button type="button" className="btn btn-secondary" aria-haspopup="dialog" onClick={() => { setOpen(false); setRestarting(true) }}>{t('Restart')}</button>
                        : null}
                </div>
            </Presence>
            {onRestart ? <RestartDialog open={restarting} onClose={() => setRestarting(false)} onRestart={onRestart} /> : null}
        </div>
    )
}

export default SettingsMenu
