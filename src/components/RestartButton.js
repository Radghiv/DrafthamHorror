import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import ConfirmDialog from './ConfirmDialog'
import { useT } from '../i18n'

// The confirmation of a restart. Restarting throws away the picks made so far, so it first asks and says what happens.
export function RestartDialog(props) {
    const { open, onClose, onRestart } = props

    const t = useT()

    const investigatorDrafting = useSelector(state => state.settings.investigatorDrafting)

    return (
        <ConfirmDialog open={open} onClose={onClose} onConfirm={onRestart} title={t('Restart the draft?')} confirmLabel={t('Restart draft')}
            text={investigatorDrafting ?
                t('The investigator draft starts over: your picks so far are dropped and new investigators are dealt to choose from.') :
                t('The draft goes back to the start with the same setup: your picks so far are dropped and new cards are dealt. You can bring them back with Undo.')} />
    )
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
