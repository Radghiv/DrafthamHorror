import React, { useState } from 'react'

import ConfirmDialog from './ConfirmDialog'
import { useT } from '../i18n'

// Where you are in the draft screens, in the top bar: Setup (the setup screens, like the logo), the investigator draft when the setup has one
// (to choose another investigator: it throws away the deck draft, so it asks first) and the phase you are in, which isn't a link.
function DraftBreadcrumbs(props) {
    const { phaseText, onHome, onInvestigator } = props

    const t = useT()

    const [asking, setAsking] = useState(false)

    return (
        <>
            <nav className="draft-crumbs" aria-label={t('Breadcrumb')}>
                <ol className="breadcrumbs">
                    {onHome ? <li><button type="button" className="crumb" onClick={onHome}>{t('Setup')}</button></li> : null}
                    {onInvestigator ? <li><button type="button" className="crumb" aria-haspopup="dialog" onClick={() => setAsking(true)}>{t('Investigator draft')}</button></li> : null}
                    {phaseText ? <li><h1 className="app-phase" title={phaseText} aria-current="page" key={phaseText}>{phaseText}</h1></li> : null}
                </ol>
            </nav>
            {onInvestigator ?
                <ConfirmDialog open={asking} onClose={() => setAsking(false)} onConfirm={onInvestigator}
                    title={t('Choose another investigator?')}
                    text={t('The deck draft you have started is put aside and new investigators are dealt to choose from. You can bring it back with Undo.')}
                    confirmLabel={t('Deal new investigators')} />
                : null}
        </>
    )
}

export default DraftBreadcrumbs
