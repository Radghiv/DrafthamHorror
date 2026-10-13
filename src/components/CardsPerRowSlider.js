import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { setCardsPerRow, CARDS_PER_ROW_KEY } from '../features/settings/settingsSlice'
import { saveJSON } from '../storage'
import { useT } from '../i18n'

// How many cards of the draft are shown per row; 0 lets the layout decide from the available width
function CardsPerRowSlider() {
    const t = useT()

    const value = useSelector(state => state.settings.cardsPerRow)

    const dispatch = useDispatch()

    function handleChange(event) {
        const next = parseInt(event.target.value, 10)

        dispatch(setCardsPerRow(next))
        saveJSON(CARDS_PER_ROW_KEY, next)
    }

    const text = value === 0 ? t('Auto') : String(value)

    return (
        <label className="cols-control">
            <span className="cols-label">{t('Cards per row')}</span>
            <input type="range" min="0" max="6" step="1" value={value} onChange={handleChange} aria-valuetext={text} />
            <span className="cols-value">{text}</span>
        </label>
    )
}

export default CardsPerRowSlider
