import React, { useLayoutEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'

import useCardName from './useCardName'
import { textBoxFor } from '../data/CardTextBox'
import { typeName } from '../data/CardTypeNames'
import { formatMarkup, Paragraphs } from './cardMarkup'

// How big the text is printed on the picture, as fractions of its width: the size it starts at, the smallest it may shrink to, and the step
const OVERLAY_FONT = 0.043
const OVERLAY_FONT_MIN = 0.016
const OVERLAY_FONT_STEP = 0.0015

// The size of a one-line text (a field) is a part of its height at first (names are the biggest), and shrinks down to this part of it until
// it fits the width
const FIELD_FONT = { name: 0.82, subname: 0.78, other: 0.66 }
const FIELD_FONT_MIN = 0.4
const FIELD_FONT_STEP = 0.03

// The shape of the painted area when it isn't a rectangle (percentages of the area): assets leave the corner of the slot icon alone, the
// area of an enemy is curved below, and the one on the back of an investigator leaves the photo alone
function clipOf(box, height, width, textHeight) {
    if (box.photo) {
        const right = (box.photo.right - box.left) / width * 100
        const split = (box.photo.splitX - box.left) / width * 100
        const left = (box.photo.leftBottom - box.top) / height * 100
        const bottom = (box.photo.rightBottom - box.top) / height * 100

        return 'polygon(' + right + '% 0, 100% 0, 100% 100%, 0 100%, 0 ' + left + '%, ' + split + '% ' + left + '%, ' + split + '% ' + bottom + '%, ' + right + '% ' + bottom + '%)'
    }

    if (box.notchLeft) {
        const notch = (box.notchLeft - box.left) / width * 100

        return 'polygon(0 0, 100% 0, 100% ' + textHeight + '%, ' + notch + '% ' + textHeight + '%, ' + notch + '% 100%, 0 100%)'
    }

    if (box.edgeBottom) {
        const edge = (box.edgeBottom - box.top) / height * 100
        const points = []

        for (let i = 10; i >= 0; i--) {
            const x = i / 10

            points.push(x * 100 + '% ' + (edge + (100 - edge) * (1 - Math.pow(2 * x - 1, 2))) + '%')
        }

        return 'polygon(0 0, 100% 0, ' + points.join(', ') + ')'
    }

    return undefined
}

// The text of each one-line field of the card in the language chosen: its name, subtitle, type and kind of weakness. A field is left out
// (the picture's own text stays) when the translation is the same as the English one.
function fieldTexts(card, box, language, cardName, cardSubname) {
    const same = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase()

    return box.fields.map(item => {
        let text = null

        if (item.kind === 'name') text = same(cardName(card), card.name) ? null : (card.is_unique ? '✷ ' : '') + cardName(card)
        else if (item.kind === 'subname') text = !card.subname || same(cardSubname(card), card.subname) ? null : cardSubname(card)
        else if (item.kind === 'type') text = typeName(language, card.type_code)
        else if (item.kind === 'weakness') text = typeName(language, card.subtype_code)

        return text ? { ...item, text: text } : null
    }).filter(item => item !== null)
}

// The translated texts printed over the English ones of a card's picture: the text area is painted over (parchment) and the rules text of
// the language chosen goes in, as big as it can be while it still fits, and the name, subtitle and type get the same treatment. It is
// placed over the picture that comes right before it (an img element, in the same parent), in whatever size the picture has.
function OverlayBody(props) {
    const { card, box, texts, back, fields } = props

    const containerRef = useRef(null)
    const textRef = useRef(null)

    // the position and the size of the container, and the size of the texts, are set on the elements themselves (not through React)
    // because they follow the picture, which can change size or load later; the biggest text that fits is looked for each time
    useLayoutEffect(() => {
        const container = containerRef.current
        const text = textRef.current
        const image = container ? container.previousElementSibling : null

        if (!image || image.tagName !== 'IMG') return undefined

        const landscape = card.type_code === 'investigator'

        function place() {
            const width = image.offsetWidth
            const height = image.offsetHeight

            // not loaded yet, or turned to fit a frame (a portrait picture of an investigator): the layout isn't the one measured
            if (!width || !height || !image.naturalWidth || (image.naturalWidth > image.naturalHeight) !== landscape) {
                container.style.display = 'none'
                return
            }

            // a picture that is fitted inside a bigger box (the big preview, when the screen is narrower than the box would be) is drawn
            // smaller and centered in it: the texts go over the picture, not over the box
            let drawnWidth = width
            let drawnHeight = height

            if (getComputedStyle(image).objectFit === 'contain') {
                const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight)

                drawnWidth = image.naturalWidth * scale
                drawnHeight = image.naturalHeight * scale
            }

            container.style.display = ''
            container.style.left = image.offsetLeft + (width - drawnWidth) / 2 + 'px'
            container.style.top = image.offsetTop + (height - drawnHeight) / 2 + 'px'
            container.style.width = drawnWidth + 'px'
            container.style.height = drawnHeight + 'px'

            let size = OVERLAY_FONT * drawnWidth

            text.style.fontSize = size + 'px'

            while (size > OVERLAY_FONT_MIN * drawnWidth && text.scrollHeight > text.clientHeight) {
                size -= OVERLAY_FONT_STEP * drawnWidth
                text.style.fontSize = size + 'px'
            }

            container.querySelectorAll('.cardField').forEach(element => {
                let scale = FIELD_FONT[element.dataset.kind] || FIELD_FONT.other

                element.style.fontSize = element.clientHeight * scale + 'px'

                while (scale > FIELD_FONT_MIN && element.scrollWidth > element.clientWidth) {
                    scale -= FIELD_FONT_STEP
                    element.style.fontSize = element.clientHeight * scale + 'px'
                }
            })
        }

        place()
        image.addEventListener('load', place)

        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place)

        if (observer) observer.observe(image)

        return () => {
            image.removeEventListener('load', place)
            if (observer) observer.disconnect()
        }
    }, [card, box, texts, back, fields])

    const height = box.coverBottom - box.top
    const width = box.right - box.left
    const textHeight = (box.textBottom - box.top) / height * 100

    // the text goes around the photo: empty blocks take its place
    const spacers = box.photo ?
        [
            { width: (box.photo.splitX - box.left) / width, height: (box.photo.leftBottom - box.top) / (box.textBottom - box.top) },
            { width: (box.photo.right - box.photo.splitX) / width, height: (box.photo.rightBottom - box.top) / (box.textBottom - box.top) }
        ].map((part, index) => <div className="cardTextSpacer" key={index} style={{ width: part.width * 100 + '%', height: part.height * 100 + '%' }}></div>)
        : null

    const text = back ? texts.back : texts.text
    const flavor = back ? texts.backFlavor : texts.flavor

    return (
        <div className="cardOverlay" aria-hidden="true" ref={containerRef} style={{ display: 'none' }}>
            <div className="cardTextOverlay" style={{ left: box.left * 100 + '%', top: box.top * 100 + '%', width: width * 100 + '%', height: height * 100 + '%', clipPath: clipOf(box, height, width, textHeight) }}>
                <div className={'cardTextOverlayText' + (spacers ? ' wrapAround' : '')} ref={textRef} style={{ height: textHeight + '%' }}>
                    {spacers}
                    {!back && texts.traits ? <p className="cardTextTraits">{texts.traits}</p> : null}
                    {text ? <Paragraphs text={text} /> : null}
                    {flavor ? <p className="cardTextFlavor">{formatMarkup(flavor)}</p> : null}
                </div>
            </div>
            {fields.map(item => (
                <div className={'cardField cardField-' + item.kind} key={item.kind} data-kind={item.kind}
                    style={{ left: item.left * 100 + '%', top: item.top * 100 + '%', width: (item.right - item.left) * 100 + '%', height: (item.bottom - item.top) * 100 + '%',
                        background: item.fill, justifyContent: item.align === 'left' ? 'flex-start' : 'center', paddingLeft: item.pad ? item.pad / (item.right - item.left) * 100 + '%' : undefined }}>
                    {item.text}
                </div>
            ))}
        </div>
    )
}

// The translated text over the picture of a side of a card ('front', the default, or 'back'), placed right after the img of that picture.
// Nothing when the language is English, the card has no translation or its layout isn't known (CardPreview shows its text beside it).
function CardTextOverlay(props) {
    const { card, side } = props

    const language = useSelector(state => state.settings.language)
    const { cardTexts, cardName, cardSubname } = useCardName()

    const texts = card ? cardTexts(card) : null
    const box = texts ? textBoxFor(card, side === 'back' ? 'back' : 'front') : null

    const fields = useMemo(() => box ? fieldTexts(card, box, language, cardName, cardSubname) : [], [card, box, language, cardName, cardSubname])

    if (!box) return null

    return <OverlayBody card={card} box={box} texts={texts} back={side === 'back'} fields={fields} />
}

export default CardTextOverlay
