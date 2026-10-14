import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'

import { useT } from '../i18n'

// The header's Restart button. Restarting throws away the picks made so far, so it first asks for confirmation and says what happens.
// The dialog is drawn in document.body: the header makes its own containing block, which would keep a fixed dialog inside it.
// The dialog closes with Escape, a click on the backdrop or Cancel; Cancel has the focus when it opens, so a stray Enter does no harm.
function RestartButton(props) {
    const { onRestart } = props

    const t = useT()

    const investigatorDrafting = useSelector(state => state.settings.investigatorDrafting)

    const [open, setOpen] = useState(false)

    const cancelRef = useRef(null)

    useEffect(() => {
        if (!open) return undefined

        function handleKeyDown(event) {
            if (event.key === 'Escape') setOpen(false)
        }

        if (cancelRef.current) cancelRef.current.focus()
        document.addEventListener('keydown', handleKeyDown)

        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [open])

    function confirm() {
        setOpen(false)
        onRestart()
    }

    return (
        <>
            <button type="button" className="btn btn-secondary" aria-haspopup="dialog" onClick={() => setOpen(true)}>{t('Restart')}</button>
            {open ? createPortal(
                <div className="dialog-backdrop" onClick={() => setOpen(false)}>
                    <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="restart-title" aria-describedby="restart-text"
                        onClick={event => event.stopPropagation()}>
                        <h2 id="restart-title">{t('Restart the draft?')}</h2>
                        <p id="restart-text">
                            {investigatorDrafting ?
                                t('The investigator draft starts over: your picks so far are dropped and new investigators are dealt to choose from.') :
                                t('The draft goes back to the start with the same setup: your picks so far are dropped and new cards are dealt. You can bring them back with Undo.')}
                        </p>
                        <div className="dialog-actions">
                            <button type="button" className="btn btn-secondary" ref={cancelRef} onClick={() => setOpen(false)}>{t('Cancel')}</button>
                            <button type="button" className="btn btn-primary" onClick={confirm}>{t('Restart draft')}</button>
                        </div>
                    </div>
                </div>,
                document.body)
                : null}
        </>
    )
}

export default RestartButton
