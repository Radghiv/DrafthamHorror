import React from 'react'
import { useSelector } from 'react-redux'

import { cardPageUrl } from '../data/ArkhamDbLinks'
import { ExternalLinkIcon } from './wizard/Icons'
import { useT } from '../i18n'

// A round button, drawn like the Redraw one, that opens the page of a card on ArkhamDB in a new tab. It is a link (so the browser's own
// menu and middle click work too) and sits in a corner of the card, which must be positioned; the stylesheet shows it on hover. The
// size is the one of the Redraw button, or 'medium' for the pictures of the sidebar and 'small' for thumbnails and rows of text.
function CardLinkButton(props) {
    const { card, size } = props

    const t = useT()

    const language = useSelector(state => state.settings.language)

    // the cards of the draft pool are copies that keep their code as the key
    const code = card ? card.code || card.key : null

    if (!code) return null

    return (
        <a className={'btn btn-secondary card-link-btn' + (size ? ' card-link-' + size : '')} href={cardPageUrl(code, language)} target="_blank" rel="noopener noreferrer"
            aria-label={t('View on ArkhamDB')} title={t('View on ArkhamDB')}>
            <ExternalLinkIcon />
        </a>
    )
}

export default CardLinkButton
