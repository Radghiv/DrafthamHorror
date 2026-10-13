import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import PackData from '../data/PackData'
import { useT } from '../i18n'

// Returns a function giving the name of a card to show, in the language chosen (the card's own, English, name when there is no
// translation). The name the logic works with stays English: this is for what the user reads. A card is an ArkhamDB card (code) or
// one of the app's (key). The same goes for the subtitle and the customization text.
function useCardName() {
    const t = useT()
    const language = useSelector(state => state.settings.language)
    const translations = useSelector(state => state.data.translations)

    const translation = useCallback(card => {
        if (!card || !translations || translations.language !== language) return null

        return translations.cards[card.code || card.key] || null
    }, [translations, language])

    const cardName = useCallback(card => {
        const found = translation(card)

        return found && found.name ? found.name : card.name
    }, [translation])

    // for sorting names in the language chosen
    const compareNames = useCallback((a, b) => cardName(a).localeCompare(cardName(b), language), [cardName, language])

    const cardSubname = useCallback(card => {
        const found = translation(card)

        return found && found.subname ? found.subname : card.subname
    }, [translation])

    const customizationText = useCallback(card => {
        const found = translation(card)

        return found && found.custom ? found.custom : card.customization_text
    }, [translation])

    // the name of a pack (by its code) to show; the second core set is not a pack of ArkhamDB
    const packName = useCallback(code => {
        if (code === 'core2') return t('Second core set')

        const names = translations && translations.language === language ? translations.packs : null

        return (names && names[code]) || PackData[code]
    }, [translations, language, t])

    return { cardName, cardSubname, compareNames, customizationText, packName, translated: translations !== null && translations.language === language }
}

export default useCardName
