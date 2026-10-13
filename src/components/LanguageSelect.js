import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeLanguage } from '../features/data/dataSlice'
import { LANGUAGES } from '../data/Languages'
import { useT } from '../i18n'

// Language of the card names. The card images are always English: ArkhamDB's translated sites use the same pictures.
function LanguageSelect() {
    const language = useSelector(state => state.settings.language)

    const t = useT()
    const dispatch = useDispatch()

    return (
        <label className="language-select" title={t('Language of the interface and of the card names (the card pictures stay English)')}>
            <span className="sr-only">{t('Language')}</span>
            <select value={language} onChange={event => dispatch(changeLanguage(event.target.value))}>
                {LANGUAGES.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
        </label>
    )
}

export default LanguageSelect
