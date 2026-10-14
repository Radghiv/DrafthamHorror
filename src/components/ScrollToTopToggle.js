import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { setScrollToTop, SCROLL_TO_TOP_KEY } from '../features/settings/settingsSlice'
import { saveJSON } from '../storage'
import { Switch } from './wizard/DraftRulesStep'
import { useT } from '../i18n'

// Whether the page scrolls back to the top after a pick, where the first cards of the next batch are
function ScrollToTopToggle() {
    const t = useT()

    const scroll = useSelector(state => state.settings.scrollToTop)

    const dispatch = useDispatch()

    function handleChange(value) {
        dispatch(setScrollToTop(value))
        saveJSON(SCROLL_TO_TOP_KEY, value)
    }

    return (
        <div className="cols-control">
            <span className="cols-label">{t('Scroll to the top after each pick')}</span>
            <Switch checked={scroll} label={t('Scroll to the top after each pick')} onChange={handleChange} />
        </div>
    )
}

export default ScrollToTopToggle
