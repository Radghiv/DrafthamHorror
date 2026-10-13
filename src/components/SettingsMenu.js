import React, { useState, useEffect, useRef } from 'react'

import CardsPerRowSlider from './CardsPerRowSlider'
import AnimationSpeedSlider from './AnimationSpeedSlider'
import AnimateTogetherToggle from './AnimateTogetherToggle'
import { SettingsIcon } from './wizard/Icons'
import { useT } from '../i18n'

// The settings button of the draft screens and the small panel it opens: cards per row and the animation options. The panel closes
// with a click outside, Escape or the button itself.
function SettingsMenu() {
    const t = useT()

    const [open, setOpen] = useState(false)

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
            {open ?
                <div className="settings-popover" id="settings-popover" role="group" aria-label={t('Settings')}>
                    <h2>{t('Settings')}</h2>
                    <CardsPerRowSlider />
                    <AnimationSpeedSlider />
                    <AnimateTogetherToggle />
                </div>
                : null}
        </div>
    )
}

export default SettingsMenu
