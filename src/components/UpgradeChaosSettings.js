import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeSetting } from '../features/settings/settingsSlice'
import { isDraftTypeEnabled } from '../data/DraftModes'
import { useT } from '../i18n'

function UpgradeChaosSettings(props) {    
    const t = useT()
    const draftType = useSelector(state => state.settings.draftType)
    const draftWeighting = useSelector(state => state.settings.draftWeighting)
    const draftXP = useSelector(state => state.settings.draftXP)
    
    const displayXP = props.displayXP

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
                    </select>
                </span>
                <span className="fbdraftsettingright"></span>
            </div>
            <div className="fbsetting">
                <label className="fbdraftsettingleft">{t('Weighting:')}</label>
                <span className="fbdraftsettingcenter">
                    <select className="fbdraftsettingselect" name="DraftWeighting" value={draftWeighting} onChange={handleChange}>
                        <option value="low">{t('Prefer low XP')}</option>
                        <option value="medium">{t('Default')}</option>
                        <option value="high">{t('Prefer high XP')}</option>
                    </select>
                </span>
                <span className="fbdraftsettingright"></span>
            </div>
            {displayXP ? 
                <div className="fbsetting">
                    <label className="fbdraftsettingleft">{t('XP:')}</label>
                    <span className="fbdraftsettingcenter">
                        <input className="fbdraftsettingnumber" name="DraftXP" type="number" value={draftXP} min="1" onChange={handleChange}></input>
                    </span>
                    <span className="fbdraftsettingright"></span>
                </div> : null}
        </div>
    )
}

export default UpgradeChaosSettings