import React, { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

import { Presence } from './usePresence'
import { useT } from '../i18n'

// A question before something that throws away work: what happens is said in the text, and the button that does it is named for it.
// The dialog is drawn in document.body: the header makes its own containing block, which would keep a fixed dialog inside it.
// It closes with Escape, a click on the backdrop or Cancel; Cancel has the focus when it opens, so a stray Enter does no harm.
function ConfirmDialog(props) {
    const { open, onClose, onConfirm, title, text, confirmLabel } = props

    const t = useT()
    const id = useId()

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

    function confirm() {
        onClose()
        onConfirm()
    }

    return createPortal(
        <Presence visible={open} exit={180}>
        <div className="dialog-backdrop" onClick={onClose}>
            <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby={id + '-title'} aria-describedby={id + '-text'}
                onClick={event => event.stopPropagation()}>
                <h2 id={id + '-title'}>{title}</h2>
                <p id={id + '-text'}>{text}</p>
                <div className="dialog-actions">
                    <button type="button" className="btn btn-secondary" ref={cancelRef} onClick={onClose}>{t('Cancel')}</button>
                    <button type="button" className="btn btn-primary" onClick={confirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
        </Presence>,
        document.body)
}

export default ConfirmDialog
