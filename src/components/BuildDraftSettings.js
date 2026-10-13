import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeSetting } from '../features/settings/settingsSlice'

import DraftPhases from '../data/DraftPhases'
import { isDraftTypeEnabled } from '../data/DraftModes'
import { useT } from '../i18n'

function BuildDraftSettings(props) {
    const t = useT()
    const draftType = useSelector(state => state.settings.draftType)
    const myriadCount = useSelector(state => state.settings.myriadCount)
    const draftCount = useSelector(state => state.settings.draftCount)
    const excludeNormalVersatile = useSelector(state => state.settings.excludeNormalVersatile)
    const requireConfirmation = useSelector(state => state.settings.confirmDraft)

    const phase = parseInt(props.phase)
    const allowPhased = props.allowPhased

    const dispatch = useDispatch()

    function handleChange(event) {
        dispatch(changeSetting(event.target.name, event.target.value))
    }
    function handleCountChange(event) {
        dispatch(changeSetting(event.target.name, { phase: phase, value: event.target.value }))
    }
    function handleCheckbox(event) {
        dispatch(changeSetting(event.target.name, event.target.checked))
    }

    return (
        <div>
            <div className="fbsetting">
                <label className="fbdraftsettingleft">{t('Type:')}</label>
                <span className="fbdraftsettingcenter">
                    <select className="fbdraftsettingselect" name="DraftType" value={draftType} onChange={handleChange}>
                        {isDraftTypeEnabled('chaos') ? <option value="chaos">{t('Standard chaos')}</option> : null}
                        {isDraftTypeEnabled('draft') ? <option value="draft">{t('Simple draft')}</option> : null}
                        {allowPhased === 'true' && isDraftTypeEnabled('phaseDraft') ? <option value="phaseDraft">{t('Draft in stages')}</option> : null}
                    </select>
                </span>
                <span className="fbdraftsettingright"></span>
            </div>
            {phase !== DraftPhases.VersatilePhase ?
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
                </div> : null
            }
            {phase === DraftPhases.VersatilePhase ?
                <div className="fbsetting">
                    <label className="fbdraftsettingleft">{t('Exclude cards in investigator pool:')}</label>
                    <span className="fbdraftsettingcenter">
                        <input type="checkbox" className="fbdraftsettingcheckbox" checked={excludeNormalVersatile} name='ExcludeNormalVersatile' onChange={handleCheckbox}/>
                    </span>
                    <span className="fbdraftsettingright"></span>
                </div> : null
            }
            <div className="fbsetting">
                <label className="fbdraftsettingleft">{t('Cards to select from:')}</label>
                <span className="fbdraftsettingslider">
                    <input type="range" min="2" max="15" step="1" value={draftCount[phase-1]} name="DraftCount" onChange={handleCountChange}/>
                </span>
                <span className="fbdraftsettingslidervalue">{draftCount[phase-1]}</span>
            </div>
            <div className="fbsetting">
                <label className="fbdraftsettingleft">{t('Require confimation on draft:')}</label>
                <span className="fbdraftsettingcenter">
                    <input type="checkbox" checked={requireConfirmation} name='ConfirmDraft' onChange={handleCheckbox}/>
                </span>
                <span className="fbdraftsettingright"></span>
            </div>
        </div>
    )
}

export default BuildDraftSettings