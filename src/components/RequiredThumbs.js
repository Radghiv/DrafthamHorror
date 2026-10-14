import React from 'react'
import { useSelector } from 'react-redux'

import useCardOverlay, { isTouchScreen } from './OverlayImage'
import useCardName from './useCardName'
import CardImage from './CardImage'
import CardLinkButton from './CardLinkButton'
import { requiredCards } from '../data/RequiredCards'
import { useT } from '../i18n'

// With withLinks, each one has a link to its ArkhamDB page (not where the thumbnails are inside a button, like the investigator draft).
// The cards the deckbuilding instructions of an investigator put in the deck, as small pictures. Hovering one shows the big preview
// (on touch screens, pressing and holding it, or just tapping it when it isn't inside a button).
// With tap, a tap on a thumbnail opens the preview on touch screens even without links; with caption, the line saying what they are comes first.
// The deck size is only known for the investigator being drafted, so the quantity of a few cards is the default one for the others.
function RequiredThumbs(props) {
    const { investigator, withLinks, tap, caption } = props

    const t = useT()

    const cardData = useSelector(state => state.data.cardData)
    const selectedInvestigator = useSelector(state => state.settings.investigatorData)
    const selectedDeckSize = useSelector(state => state.settings.deckSize)

    const doCardOverlay = useCardOverlay()
    const { cardName } = useCardName()

    if (!cardData || !investigator) return null

    const deckSize = selectedInvestigator && selectedInvestigator.code === investigator.code ? selectedDeckSize : null
    const required = requiredCards(investigator, cardData, deckSize)

    if (required.cards.length === 0) return null

    return (
        <span className="required-thumbs" aria-label={t('Cards that always come with this investigator')}>
            {caption ? <span className="required-thumbs-caption">{t('Cards that always come with this investigator')}</span> : null}
            {required.cards.map(({ card, count }) => (
                <span className="required-thumb" key={card.code} onPointerEnter={event => doCardOverlay(card, event)} onPointerLeave={() => doCardOverlay(null)}
                    onClick={withLinks || tap ? event => { if (isTouchScreen()) doCardOverlay(card, event) } : undefined}>
                    <CardImage card={card} className="required-thumb-image" alt={cardName(card)} fallback={<span className="required-thumb-missing">{cardName(card)}</span>} />
                    {count > 1 ? <span className="required-thumb-count">×{count}</span> : null}
                    {withLinks ? <CardLinkButton card={card} size="small" /> : null}
                </span>
            ))}
            {required.note ? <span className="required-thumbs-note">{required.note}</span> : null}
        </span>
    )
}

export default RequiredThumbs
