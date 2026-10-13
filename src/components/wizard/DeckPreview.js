import React from 'react'
import { useSelector } from 'react-redux'

import CostCurve from '../CostCurve'
import CardListPanel from '../CardListPanel'

// Cards of the validated ArkhamDB deck, or null when there is none (only on the Upgrade path, and only while the ID
// entered is the one that was validated)
function useValidatedDeckCards() {
    const draftTab = useSelector(state => state.settings.draftTab)
    const deckID = useSelector(state => state.settings.deckID)
    const validation = useSelector(state => state.data.deckValidation)

    const isValid = draftTab === 'Upgrade' && validation.status === 'valid' && validation.id === deckID.trim()

    return isValid && validation.cards && validation.cards.length > 0 ? validation.cards : null
}

// Cost curve of the validated deck (left column)
export function DeckPreviewCurve() {
    const cards = useValidatedDeckCards()

    return cards ? <CostCurve deckList={cards} draftedList={[]} removedList={[]} /> : null
}

// Card list of the validated deck (right column)
export function DeckPreviewList() {
    const cards = useValidatedDeckCards()

    return cards ? <div className="deck-preview"><CardListPanel list={cards} deck={true} /></div> : null
}
