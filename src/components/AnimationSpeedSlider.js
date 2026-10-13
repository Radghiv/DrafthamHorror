import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { setAnimationSpeed, ANIMATION_SPEED_KEY } from '../features/settings/settingsSlice'
import { ANIMATION_SPEEDS, animationSpeedLabel } from '../data/AnimationSpeed'
import { saveJSON } from '../storage'
import { useT } from '../i18n'

// Speed of the draft animations; the first position turns them off
function AnimationSpeedSlider() {
    const t = useT()

    const value = useSelector(state => state.settings.animationSpeed)

    const dispatch = useDispatch()

    function handleChange(event) {
        const next = parseInt(event.target.value, 10)

        dispatch(setAnimationSpeed(next))
        saveJSON(ANIMATION_SPEED_KEY, next)
    }

    const text = animationSpeedLabel(value)

    return (
        <label className="cols-control">
            <span className="cols-label">{t('Animation speed')}</span>
            <input type="range" min="0" max={ANIMATION_SPEEDS.length - 1} step="1" value={value} onChange={handleChange} aria-valuetext={text} />
            <span className="cols-value">{text}</span>
        </label>
    )
}

export default AnimationSpeedSlider
