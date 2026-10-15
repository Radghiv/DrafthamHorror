import React, { useState, useEffect, useRef } from 'react'

import CardsPerRowSlider from './CardsPerRowSlider'
import AnimationSpeedSlider from './AnimationSpeedSlider'
import AnimateTogetherToggle from './AnimateTogetherToggle'
import ScrollToTopToggle from './ScrollToTopToggle'
import LanguageSelect from './LanguageSelect'
import ThemeToggle from './ThemeToggle'
import { RestartDialog } from './RestartButton'
import ChooseInvestigatorDialog from './ChooseInvestigatorDialog'
import { Presence } from './usePresence'
import InstallButton from './InstallButton'
import { SettingsIcon } from './wizard/Icons'
import { useT } from '../i18n'

// The settings button and the small panel it opens: all the settings, on every screen. The panel closes with a click outside, Escape or the button itself.
// With onRestart (a phone, where the header has no room for a Restart button) the panel also holds Restart, which asks for confirmation.
// With onCollection (the setup screens) it starts with a row that opens the collection: what you own is set once, so it lives here and not
// in the steps.
function SettingsMenu(props) {
    const { onRestart, onCollection, onInvestigator } = props

    const t = useT()

    const [open, setOpen] = useState(false)
    const [restarting, setRestarting] = useState(false)
    const [choosing, setChoosing] = useState(false)

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
        <>
        <InstallButton />
        <div className="settings-menu" ref={wrapperRef}>
            <button type="button" className="icon-btn" aria-haspopup="true" aria-expanded={open} aria-controls="settings-popover"
                title={t('Settings')} aria-label={t('Settings')} onClick={() => setOpen(!open)}>
                <SettingsIcon />
            </button>
            <Presence visible={open} exit={140}>
                <div className="settings-popover" id="settings-popover" role="group" aria-label={t('Settings')}>
                    <h2>{t('Settings')}</h2>
                    {onCollection ?
                        <button type="button" className="settings-link" onClick={() => { setOpen(false); onCollection() }}>
                            <strong>{t('Collection')}</strong>
                            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m5 3 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                        : null}
                    <LanguageSelect />
                    <ThemeToggle />
                    <AnimationSpeedSlider />
                    <ScrollToTopToggle />
                    <AnimateTogetherToggle />
                    <CardsPerRowSlider />
                    {onInvestigator ?
                        <button type="button" className="btn btn-secondary" aria-haspopup="dialog" onClick={() => { setOpen(false); setChoosing(true) }}>{t('Choose another investigator')}</button>
                        : null}
                    {onRestart ?
                        <button type="button" className="btn btn-secondary" aria-haspopup="dialog" onClick={() => { setOpen(false); setRestarting(true) }}>{t('Restart')}</button>
                        : null}
                </div>
            </Presence>
            {onRestart ? <RestartDialog open={restarting} onClose={() => setRestarting(false)} onRestart={onRestart} /> : null}
            {onInvestigator ? <ChooseInvestigatorDialog open={choosing} onClose={() => setChoosing(false)} onConfirm={onInvestigator} /> : null}
        </div>
        </>
    )
}

export default SettingsMenu
