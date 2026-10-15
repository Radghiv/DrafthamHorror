import React, { useState } from 'react'

import ChooseInvestigatorDialog from './ChooseInvestigatorDialog'
import { useT } from '../i18n'

// Where you are in the draft screens, in the top bar: Setup (the setup screens, like the logo), the investigator draft when the setup has one
// (to choose another investigator: it puts the deck draft aside, so it asks first) and the phase you are in, which isn't a link. A phone's bar has
// no room for the middle one: there it is in the settings menu instead.
function DraftBreadcrumbs(props) {
    const { phaseText, onHome, onInvestigator } = props

    const t = useT()

    const [asking, setAsking] = useState(false)

    return (
        <>
            <nav className="draft-crumbs" aria-label={t('Breadcrumb')}>
                <ol className="breadcrumbs">
                    {onHome ? <li><button type="button" className="crumb" onClick={onHome}>{t('Setup')}</button></li> : null}
                    {onInvestigator ? <li className="crumb-investigator"><button type="button" className="crumb" aria-haspopup="dialog" onClick={() => setAsking(true)}>{t('Investigator draft')}</button></li> : null}
                    {phaseText ? <li><h1 className="app-phase" title={phaseText} aria-current="page" key={phaseText}>{phaseText}</h1></li> : null}
                </ol>
            </nav>
            {onInvestigator ? <ChooseInvestigatorDialog open={asking} onClose={() => setAsking(false)} onConfirm={onInvestigator} /> : null}
        </>
    )
}

export default DraftBreadcrumbs
