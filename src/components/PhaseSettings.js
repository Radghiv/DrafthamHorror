import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeSetting } from '../features/settings/settingsSlice'
import { useT } from '../i18n'
import SegmentedRange from './SegmentedRange'

function PhaseSettings(props) {
    const t = useT()
    const settings = useSelector(state => state.settings)
    const dispatch = useDispatch()

    const phase = parseInt(props.phase)

    function handleChange(event) {
        dispatch(changeSetting(event.target.name, { phase: phase, value: event.target.value }))
    }

    return (
         <div className="draft-phase">
            <h4 style={{marginBottom: '5px'}}>{t('Stage {number}', { number: props.phase })}</h4>
            <div className="fblist">
                <label className="fbphasesettingleft">{t('Cards to select from:')}</label>
                <span className="fbphasesettingslider">
                    <SegmentedRange min="1" max="20" value={settings.draftCount[phase-1]} name='DraftCount' onChange={handleChange}/>
                </span>
                <span className="fbphasesettingslidervalue">{settings.draftCount[phase-1]}</span>
            </div>
            <div className="fblist">
                <label className="fbphasesettingleft">{t('Cards selected in this stage:')}{' '}</label>
                <span className='fbphasesettingslider'>
                    <SegmentedRange min="0" max={settings.deckSize} value={settings.draftCards[phase-1]} name='DraftCards' onChange={handleChange}/>
                </span>
                <span className="fbphasesettingslidervalue">{settings.draftCards[phase-1]}</span>
            </div>
            <div className="fblist">
                <label className="fbphasesettingleft">{t('Include cards with limited deck slots:')}</label>
                <span className='fbphasesettingcenter'>
                    <input type="checkbox" checked={settings.draftUseLimited[phase-1]} name='DraftUseLimited' onChange={handleChange}/>
                </span>
                <span className="fbphasesettingright"></span>
            </div>
        </div>
    )
}


export default PhaseSettings