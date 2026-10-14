import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'

import { useT } from '../i18n'

// The confirmation of a restart. Restarting throws away the picks made so far, so it first asks and says what happens.
// The dialog is drawn in document.body: the header makes its own containing block, which would keep a fixed dialog inside it.
// The dialog closes with Escape, a click on the backdrop or Cancel; Cancel has the focus when it opens, so a stray Enter does no harm.
export function RestartDialog(props) {
    const { open, onClose, onRestart } = props

    const t = useT()

    const investigatorDrafting = useSelector(state => state.settings.investigatorDrafting)

    const cancelRef = useRef(null)
    const closeRef = useRef(onClose)

    closeRef.current = onClose

    useEffect(() => {
        if (!open) return undefined

        function handleKeyDown(event) {
            if (event.key === 'Escape') closeRef.current()
        }

        if (cancelRef.current) cancelRef.current.focus()
        document.addEventListener('keydown', handleKeyDown)

        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [open])

    if (!open) return null

    function confirm() {
        onClose()
        onRestart()
    }

    return createPortal(
        <div className="dialog-backdrop" onClick={onClose}>
            <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="restart-title" aria-describedby="restart-text"
                onClick={event => event.stopPropagation()}>
                <h2 id="restart-title">{t('Restart the draft?')}</h2>
                <p id="restart-text">
                    {investigatorDrafting ?
                        t('The investigator draft starts over: your picks so far are dropped and new investigators are dealt to choose from.') :
                        t('The draft goes back to the start with the same setup: your picks so far are dropped and new cards are dealt. You can bring them back with Undo.')}
                </p>
                <div className="dialog-actions">
                    <button type="button" className="btn btn-secondary" ref={cancelRef} onClick={onClose}>{t('Cancel')}</button>
                    <button type="button" className="btn btn-primary" onClick={confirm}>{t('Restart draft')}</button>
                </div>
            </div>
        </div>,
        document.body)
}

// The header's Restart button (on a phone Restart is in the settings menu instead, which opens the same dialog)
function RestartButton(props) {
    const { onRestart } = props

    const t = useT()

    const [open, setOpen] = useState(false)

    return (
        <>
            <button type="button" className="btn btn-secondary" aria-haspopup="dialog" onClick={() => setOpen(true)}>{t('Restart')}</button>
            <RestartDialog open={open} onClose={() => setOpen(false)} onRestart={onRestart} />
        </>
    )
}

export default RestartButton
