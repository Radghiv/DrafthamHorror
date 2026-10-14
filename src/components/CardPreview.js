import React, { useEffect } from 'react'
import { useSelector, useDispatch, useStore } from 'react-redux'

import { updateImageOverlay } from '../features/settings/settingsSlice'

import OverlayCardImage from './OverlayCardImage'
import CardTextOverlay from './CardTextOverlay'
import { formatMarkup, Paragraphs } from './cardMarkup'
import useCardName from './useCardName'
import { cardImageUrls } from '../data/CardImages'
import { cardPageUrl } from '../data/ArkhamDbLinks'
import { ExternalLinkIcon } from './wizard/Icons'
import { textBoxFor } from '../data/CardTextBox'
import { useT } from '../i18n'

const GAP = 16
const EDGE = 8
const MIN_WIDTH = 220
const MIN_HEIGHT = 280
const CUSTOMIZATIONS_WIDTH = 360
const TEXT_WIDTH = 320
const CARD_RATIO = 0.72
const BONDED_SCALE = 0.8
const BONDED_GAP = 8
// Investigator cards are landscape; the width of the preview is capped like in the CSS of .overlayImage
const LANDSCAPE_RATIO = 1.45

// The card in the language chosen, beside its (English) picture: name, traits, rules text, flavor text and what is on the back
function TextPanel(props) {
    const { name, subname, texts } = props

    const t = useT()

    return (
        <div className="overlayCustomizations overlayText">
            <h3>{name}</h3>
            {subname ? <p className="overlayTextSub">{subname}</p> : null}
            {texts.traits ? <p className="overlayTextTraits">{texts.traits}</p> : null}
            {texts.text ? <Paragraphs text={texts.text} /> : null}
            {texts.flavor ? <p className="overlayTextFlavor">{formatMarkup(texts.flavor)}</p> : null}
            {texts.back ?
                <>
                    <h3 className="overlayTextBackTitle">{t('Back of the card')}</h3>
                    <Paragraphs text={texts.back} />
                </>
                : null}
        </div>
    )
}

// Ctrl/Cmd+click or middle click on whatever card the preview is showing opens its ArkhamDB page in a new tab. The hovered card is the one
// in the settings (every card picture sets it through useCardOverlay), so one listener on the document serves all of them, and a plain
// click keeps doing what it does on that card. A pinned preview (touch screens) has no hover: it has its own link instead.
function useOpenCardPage() {
    const store = useStore()

    useEffect(() => {
        // the code of the hovered card when it is a card of ArkhamDB, otherwise null
        function hoveredCode() {
            const { settings, data } = store.getState()

            if (!settings.imagesrc || settings.imagepinned || !settings.imagecode || !data.cardData) return null

            return data.cardData.some(card => card.code === settings.imagecode) ? settings.imagecode : null
        }

        function open(event) {
            const code = hoveredCode()

            if (!code) return false

            event.preventDefault()
            event.stopPropagation()
            window.open(cardPageUrl(code, store.getState().settings.language), '_blank', 'noopener')

            return true
        }

        function onClick(event) {
            if (event.button === 0 && (event.ctrlKey || event.metaKey)) open(event)
        }

        function onAuxClick(event) {
            if (event.button === 1) open(event)
        }

        // keeps the browser from starting its scroll-by-dragging mode on a middle click over a card
        function onMouseDown(event) {
            if (event.button === 1 && hoveredCode()) event.preventDefault()
        }

        document.addEventListener('click', onClick, true)
        document.addEventListener('auxclick', onAuxClick, true)
        document.addEventListener('mousedown', onMouseDown, true)

        return () => {
            document.removeEventListener('click', onClick, true)
            document.removeEventListener('auxclick', onAuxClick, true)
            document.removeEventListener('mousedown', onMouseDown, true)
        }
    }, [store])
}

// The list of customization options of a card, one line each (the squares are the experience each costs)
function CustomizationsPanel(props) {
    const t = useT()

    const lines = props.text.split('\n').filter(line => line.trim() !== '')

    return (
        <div className="overlayCustomizations">
            <h3>{t('Customizations')}</h3>
            {lines.map((line, index) => {
                // the squares at the start of a line are the experience the option costs
                const match = line.match(/^\s*([â–¡â– ]+)\s*(.*)$/)

                return match ?
                    <p key={index} className="customizationLine"><span className="customizationSquares">{match[1]}</span><span>{formatMarkup(match[2])}</span></p> :
                    <p key={index}>{formatMarkup(line)}</p>
            })}
        </div>
    )
}

// How the bonded cards are laid out next to a preview of the given height: side by side (two columns at most), each 80% of the size of
// the previewed card, or smaller only when several rows would not fit in the height
function bondedLayout(count, previewHeight) {
    const columns = Math.min(count, 2)
    const rows = Math.ceil(count / columns)
    const width = Math.floor(Math.min(BONDED_SCALE * previewHeight, (previewHeight - (rows - 1) * BONDED_GAP) / rows) * CARD_RATIO)

    return { columns: columns, width: width, total: columns * width + (columns - 1) * BONDED_GAP }
}

// The cards bonded to the previewed one, with how many copies
function BondedCards(props) {
    const { cards, layout } = props

    return (
        <div className="overlayBondedList" style={{ gridTemplateColumns: 'repeat(' + layout.columns + ', ' + layout.width + 'px)' }}>
            {cards.map(({ card, count }) => (
                <div className="overlayBondedItem" key={card.code}>
                    <OverlayCardImage urls={cardImageUrls(card)} className="overlayBonded" style={{ width: layout.width + 'px' }} />
                    <CardTextOverlay card={card} />
                    {count > 1 ? <span className="overlayBondedCount">Ã—{count}</span> : null}
                </div>
            ))}
        </div>
    )
}

// Width the pieces of the preview take at a given height of the card (a card wider than tall is as wide as it can be)
function widthNeeded(height, mainRatio, bondedCount, withBonded, withCustomizations, withText) {
    return Math.min(height * mainRatio, Math.min(0.92 * window.innerWidth, Math.max(0.575 * window.innerWidth, 525)))
        + (withBonded ? GAP + bondedLayout(bondedCount, height).total : 0)
        + (withCustomizations ? GAP + CUSTOMIZATIONS_WIDTH : 0)
        + (withText ? GAP + TEXT_WIDTH : 0)
}

// The largest card height, up to the full one, at which the pieces fit in the room; null when even the smallest doesn't
function fitHeight(room, fullHeight, mainRatio, bondedCount, withBonded, withCustomizations, withText) {
    if (widthNeeded(fullHeight, mainRatio, bondedCount, withBonded, withCustomizations, withText) <= room) return fullHeight
    if (widthNeeded(MIN_HEIGHT, mainRatio, bondedCount, withBonded, withCustomizations, withText) > room) return null

    let low = MIN_HEIGHT
    let high = fullHeight

    for (let i = 0; i < 14; i++) {
        const middle = (low + high) / 2

        if (widthNeeded(middle, mainRatio, bondedCount, withBonded, withCustomizations, withText) <= room) low = middle
        else high = middle
    }

    return Math.floor(low)
}

// The big card preview, drawn above everything else: beside the hovered element, on whichever side has more room, so it never covers
// it and stays inside the screen. The cards bonded to it and its list of customizations go along. When there isn't room for all of it:
// the bonded cards move to the other side of the hovered element and, failing that, everything is scaled down to fit. Centered on the
// screen when neither side has enough room for even the card.
function PreviewContents() {
    const urls = useSelector(state => state.settings.imagesrc)
    const anchor = useSelector(state => state.settings.imageanchor)
    const code = useSelector(state => state.settings.imagecode)
    const cardData = useSelector(state => state.data.cardData)
    const { customizationText, cardTexts, cardName, cardSubname } = useCardName()

    if (!urls) return null

    const card = cardData && code ? cardData.find(item => item.code === code) : null

    const bonded = card && card.bonded_cards ?
        card.bonded_cards.map(item => ({ card: cardData.find(other => other.code === item.code), count: item.count })).filter(item => item.card) : []
    const customizations = card && card.customization_text ? customizationText(card) : null
    const texts = card ? cardTexts(card) : null

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const fullHeight = Math.min(0.92 * viewportHeight, Math.max(0.6 * viewportHeight, 525))

    const hasBonded = bonded.length > 0
    const hasCustomizations = !!customizations
    // the translated text goes over the picture (CardTextOverlay) when the card's layout is known, otherwise beside it
    const showingBack = !!card && urls[0] === cardImageUrls(card, 'back')[0]
    const textBox = texts ? textBoxFor(card, showingBack ? 'back' : 'front') : null
    const hasText = !!texts && !textBox
    const mainRatio = card && card.type_code === 'investigator' ? LANDSCAPE_RATIO : CARD_RATIO

    // pieces of the preview that are shown, how tall the card is, and where they go
    let height = fullHeight
    let withBonded = hasBonded
    let withCustomizations = hasCustomizations
    let withText = hasText
    let side = null              // 'left' or 'right' of the hovered element; null = centered on the screen
    let bondedSide = null        // set when the bonded cards go to the other side of the hovered element
    let roomMain = viewportWidth - 2 * EDGE

    // scales everything down to fit the room, giving up the customizations, then the bonded cards and then the text if even that is not
    // enough
    const shrinkToFit = room => {
        let fitted = fitHeight(room, fullHeight, mainRatio, bonded.length, hasBonded, hasCustomizations, hasText)

        if (fitted === null && hasCustomizations) {
            withCustomizations = false
            fitted = fitHeight(room, fullHeight, mainRatio, bonded.length, hasBonded, false, hasText)
        }
        if (fitted === null && hasBonded) {
            withBonded = false
            fitted = fitHeight(room, fullHeight, mainRatio, bonded.length, false, false, hasText)
        }
        if (fitted === null && hasText) {
            withText = false
            fitted = fitHeight(room, fullHeight, mainRatio, bonded.length, false, false, false)
        }

        // last resort, the card alone in a really narrow room: as tall as the room allows, never wider than the screen
        height = fitted === null ? Math.max(1, Math.min(fullHeight, Math.floor(room / mainRatio))) : fitted
    }

    if (anchor) {
        const roomRight = viewportWidth - anchor.right - GAP - EDGE
        const roomLeft = anchor.left - GAP - EDGE

        if (Math.max(roomLeft, roomRight) >= MIN_WIDTH) {
            side = roomRight >= roomLeft ? 'right' : 'left'
            roomMain = Math.max(roomLeft, roomRight)

            const roomOther = Math.min(roomLeft, roomRight)

            if (widthNeeded(fullHeight, mainRatio, bonded.length, hasBonded, hasCustomizations, hasText) <= roomMain) {
                // everything fits side by side
            }
            else if (hasBonded && widthNeeded(fullHeight, mainRatio, 0, false, hasCustomizations, hasText) <= roomMain && bondedLayout(bonded.length, fullHeight).total <= roomOther) {
                // the bonded cards go to the other side of the hovered element
                withBonded = false
                bondedSide = side === 'right' ? 'left' : 'right'
            }
            else {
                shrinkToFit(roomMain)
            }
        }
    }

    if (side === null) shrinkToFit(roomMain)

    const sizeStyle = { '--preview-height': height + 'px' }

    // the style placing a container beside the hovered element, on the given side, with the height centered on the pointer and kept on screen
    const beside = (where, room) => {
        const style = where === 'right' ?
            { left: anchor.right + GAP, maxWidth: room } :
            { right: viewportWidth - anchor.left + GAP, maxWidth: room }

        style.top = 'clamp(calc(var(--preview-height) / 2 + ' + EDGE + 'px), ' + anchor.y + 'px, calc(100vh - var(--preview-height) / 2 - ' + EDGE + 'px))'

        return { ...style, ...sizeStyle }
    }

    const bondedLayoutNow = hasBonded ? bondedLayout(bonded.length, height) : null

    const content = (
        <div className={'previewRow' + (side === 'left' ? ' previewRowLeft' : '')}>
            <OverlayCardImage urls={urls} />
            <CardTextOverlay card={card} side={showingBack ? 'back' : 'front'} />
            {withText ? <TextPanel name={cardName(card)} subname={cardSubname(card)} texts={texts} /> : null}
            {withBonded && hasBonded ? <BondedCards cards={bonded} layout={bondedLayoutNow} /> : null}
            {withCustomizations ? <CustomizationsPanel text={customizations} /> : null}
        </div>
    )

    if (side === null) return <div className="floatingImageCenter" style={sizeStyle}>{content}</div>

    return (
        <>
            <div className="floatingImageNear" style={beside(side, roomMain)}>{content}</div>
            {bondedSide ?
                <div className="floatingImageNear" style={beside(bondedSide, bondedSide === 'right' ? viewportWidth - anchor.right - GAP - EDGE : anchor.left - GAP - EDGE)}>
                    <div className={'previewRow' + (bondedSide === 'left' ? ' previewRowLeft' : '')}>
                        <BondedCards cards={bonded} layout={bondedLayoutNow} />
                    </div>
                </div>
                : null}
        </>
    )
}

// The preview, plus a backdrop when it was opened by a long press on a touch screen: tapping anywhere closes it (and does nothing else)
function CardPreview() {
    const t = useT()

    const pinned = useSelector(state => state.settings.imagepinned)
    const shown = useSelector(state => !!state.settings.imagesrc)
    const code = useSelector(state => state.settings.imagecode)
    const language = useSelector(state => state.settings.language)
    const isCard = useSelector(state => !!code && !!state.data.cardData && state.data.cardData.some(card => card.code === code))

    const dispatch = useDispatch()

    useOpenCardPage()

    return (
        <>
            {pinned && shown ?
                <div className="preview-backdrop" role="presentation" onClick={() => dispatch(updateImageOverlay({ imagesrc: null }))}>
                    {isCard ?
                        <a className="previewLink" href={cardPageUrl(code, language)} target="_blank" rel="noopener noreferrer" aria-label="ArkhamDB" onClick={event => event.stopPropagation()}>
                            <ExternalLinkIcon />
                        </a>
                        : null}
                    <span className="preview-hint">{t('Tap anywhere to close')}</span>
                </div>
                : null}
            <PreviewContents />
        </>
    )
}

export default CardPreview
