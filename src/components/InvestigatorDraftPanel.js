import React, { useState, useRef, useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'

import ColorForClass from '../data/ClassColors'
import useCardOverlay, { isTouchScreen } from './OverlayImage'
import CardImage from './CardImage'
import RequiredThumbs from './RequiredThumbs'
import CardLinkButton from './CardLinkButton'
import { useT } from '../i18n'

function InvestigatorPanel(props) {
    const t = useT()
    const cardData = useSelector(state => state.data.cardData)
    const investigatorData = useSelector(state => state.settings.investigatorData)
    const investigator = useSelector(state => state.settings.investigator)

    const doCardOverlay = useCardOverlay()

    // touch screens have no hover: tapping the picture opens the preview
    function tapPreview(event, side) {
        if (isTouchScreen() && !event.target.closest('a')) doCardOverlay(investigatorData, event, side)
    }

    // ArkhamDB images of some investigators are portrait (a landscape card saved turned): those are rotated back. Kept in state
    // and set on every load, so the panel showing another investigator never keeps the rotation of the previous one.
    const [rotated, setRotated] = useState({ front: false, back: false })

    // when another investigator is chosen (not when the panel first shows one) the two sides turn over into place: a change of the key
    // starts the animation again
    const [revealCount, setRevealCount] = useState(0)
    const shownInvestigator = useRef(investigator)

    useLayoutEffect(() => {
        if (shownInvestigator.current === investigator) return

        shownInvestigator.current = investigator
        setRevealCount(count => count + 1)
    }, [investigator])

    function imageDidLoad(side, event) {
        const isPortrait = event.target.naturalHeight > event.target.naturalWidth

        setRotated(current => current[side] === isPortrait ? current : { ...current, [side]: isPortrait })
    }

    let investigatorCardImage = null
    let investigatorCardImageBack = null

    if (cardData) {
        const factionCode = investigatorData.faction_code;
        const classColor = ColorForClass(factionCode)

        // ArkhamDB's image first, then arkham.build's; the placeholder is for when neither has it
        const placeholder = label => <div className="investigator-div-loading" style={{backgroundColor: classColor}}><h3>{label}</h3><p>{t('Image not available')}</p><p><a href={investigatorData.url} target="_blank" rel="noreferrer noopener">{t('View on ArkhamDB')}</a></p></div>

        investigatorCardImage =
            <div className="investigator-div" style={{backgroundColor: classColor}} onPointerEnter={event => doCardOverlay(investigatorData, event, 'front')} onPointerLeave={() => doCardOverlay(null)} onClick={event => tapPreview(event, 'front')}>
                <CardImage card={investigatorData} side="front" className={'investigator-image' + (rotated.front ? ' rotatecw' : '')} alt={investigator}
                    onLoad={event => imageDidLoad('front', event)} fallback={placeholder(investigator)} />
                <CardLinkButton card={investigatorData} size="medium" />
            </div>

        investigatorCardImageBack =
            <div className="investigator-div" style={{backgroundColor: classColor}} onPointerEnter={event => doCardOverlay(investigatorData, event, 'back')} onPointerLeave={() => doCardOverlay(null)} onClick={event => tapPreview(event, 'back')}>
                <CardImage card={investigatorData} side="back" className={'investigator-image' + (rotated.back ? ' rotateccw' : '')} alt={t('{name} (back)', { name: investigator })}
                    onLoad={event => imageDidLoad('back', event)} fallback={placeholder(t('{name} (Back)', { name: investigator }))} />
                <CardLinkButton card={investigatorData} size="medium" />
            </div>
    }

    return (
        <div className="settingsDiv">
            <h2>{props.title || investigator}</h2>
            {props.subtitle ? <p className="investigator-subtitle">{props.subtitle}</p> : null}
            <div className={'investigator-grid' + (revealCount > 0 ? ' investigator-reveal' : '')} key={revealCount}>
                {investigatorCardImage}
                {investigatorCardImageBack}
            </div>
            <RequiredThumbs investigator={investigatorData} withLinks />
        </div>
    )
}

export default InvestigatorPanel
