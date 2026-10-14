import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { startDraft } from '../features/draft/draftSlice'

import DraftPhases from '../data/DraftPhases'
import { playPanelsLeave } from '../draft/screenTransitions'
import { useT } from '../i18n'

// Shown when the upgrade draft was stopped early with Done: the draft settings were chosen in the setup, so only the
// remaining experience and a way back into the draft are needed here.
function UpgradeOptionsPanel(props) {
    const t = useT()

    const draftXP = useSelector(state => state.settings.draftXP)
    const upgradeProgress = useSelector(state => state.draft.upgradeProgress)

    const dispatch = useDispatch()
    const animationSpeed = useSelector(state => state.settings.animationSpeed)

    function draftClick(event) {
        playPanelsLeave(animationSpeed)
        dispatch(startDraft(DraftPhases.UpgradePhase))
    }

    return (
        <div className="settingsDiv phase-panel">
            <h3>{t('Upgrade draft paused')}</h3>
            <h2 className="draft-quantity">{t('{xp} XP left', { xp: draftXP - upgradeProgress })}</h2>
            <div className="description">
                {t('You may draft level 0 cards below before going on, then resume the upgrade draft with the settings you chose in the setup.')}
            </div>
            <button className='button-rect button-green' onClick={draftClick}>{t('Resume draft')}</button>
        </div>
        )
}

export default UpgradeOptionsPanel
