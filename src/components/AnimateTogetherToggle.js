import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { setAnimateTogether, ANIMATE_TOGETHER_KEY } from '../features/settings/settingsSlice'
import { saveJSON } from '../storage'
import { Switch } from './wizard/DraftRulesStep'
import { useT } from '../i18n'

// Whether the new cards of the draft turn over all at once instead of one after the other
function AnimateTogetherToggle() {
    const t = useT()

    const together = useSelector(state => state.settings.animateTogether)

    const dispatch = useDispatch()

    function handleChange(value) {
        dispatch(setAnimateTogether(value))
        saveJSON(ANIMATE_TOGETHER_KEY, value)
    }

    return (
        <div className="cols-control">
            <span className="cols-label">{t('Turn new cards over together')}</span>
            <Switch checked={together} label={t('Turn new cards over together')} onChange={handleChange} />
        </div>
    )
}

export default AnimateTogetherToggle
