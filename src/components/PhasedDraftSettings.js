import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeSetting } from '../features/settings/settingsSlice'

import PhaseSettings from './PhaseSettings'
import DraftPhases from '../data/DraftPhases'
import { isDraftTypeEnabled } from '../data/DraftModes'
import { useT } from '../i18n'

function PhasedDraftSettings(props) {
    const t = useT()
    const draftType = useSelector(state => state.settings.draftType)
    const myriadCount = useSelector(state => state.settings.myriadCount)

    const dispatch = useDispatch()

    function handleChange(event) {
        dispatch(changeSetting(event.target.name, event.target.value))
    }

    return (
        <div>
            <div className="fbsetting">
                <label className="fbdraftsettingleft">{t('Type:')}</label>
                <span className="fbdraftsettingcenter">
                    <select className="fbdraftsettingselect" name="DraftType" value={draftType} onChange={handleChange}>
                        {isDraftTypeEnabled('chaos') ? <option value="chaos">{t('Standard chaos')}</option> : null}
                        {isDraftTypeEnabled('draft') ? <option value="draft">{t('Simple draft')}</option> : null}
                        {isDraftTypeEnabled('phaseDraft') ? <option value="phaseDraft">{t('Draft in stages')}</option> : null}
                    </select>
                </span>
                <span className="fbdraftsettingright"></span>
            </div>
            <div className="fbsetting">
                <label className="fbdraftsettingleft">{t('Drafting myriad adds:')}</label>
                <span className="fbdraftsettingcenter">
                    <select className="fbdraftsettingselect" name="MyriadCount" value={myriadCount} onChange={handleChange}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </span>
                <span className="fbdraftsettingright">{' '}{t('card|cards', { count: myriadCount })}</span>
            </div>
            <PhaseSettings phase={DraftPhases.BuildPhase1} />
            <PhaseSettings phase={DraftPhases.BuildPhase2} />
            <PhaseSettings phase={DraftPhases.BuildPhase3} />
        </div>
    )
}

export default PhasedDraftSettings
