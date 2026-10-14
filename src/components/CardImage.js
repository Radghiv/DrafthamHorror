import React, { useState } from 'react'

import CardTextOverlay from './CardTextOverlay'
import { cardImageUrls } from '../data/CardImages'

// An image of a card side, with the text of the language chosen over its English text. If an address fails (or ArkhamDB has none) the next
// source is tried; when every one fails the fallback is shown instead.
function CardImage(props) {
    const { card, side, className, alt, onLoad, fallback } = props

    const urls = cardImageUrls(card, side)
    const firstUrl = urls[0]

    // which source is being tried, remembered per first address so a different card starts over
    const [attempt, setAttempt] = useState({ first: firstUrl, index: 0 })

    const index = attempt.first === firstUrl ? attempt.index : 0

    if (urls.length === 0 || index >= urls.length) return fallback || null

    return (
        <>
            <img className={className} src={urls[index]} alt={alt} onLoad={onLoad}
                onError={() => setAttempt({ first: firstUrl, index: index + 1 })} />
            <CardTextOverlay card={card} side={side} />
        </>
    )
}

export default CardImage
