import React from 'react'

import ConfirmDialog from './ConfirmDialog'
import { useT } from '../i18n'

// The question before going back to the investigator draft: the deck draft started is put aside (Undo brings it back) and new
// investigators are dealt. Asked from the breadcrumbs of the top bar and, on a phone, from the settings menu.
function ChooseInvestigatorDialog(props) {
    const { open, onClose, onConfirm } = props

    const t = useT()

    return (
        <ConfirmDialog open={open} onClose={onClose} onConfirm={onConfirm}
            title={t('Choose another investigator?')}
            text={t('The deck draft you have started is put aside and new investigators are dealt to choose from. You can bring it back with Undo.')}
            confirmLabel={t('Deal new investigators')} />
    )
}

export default ChooseInvestigatorDialog
