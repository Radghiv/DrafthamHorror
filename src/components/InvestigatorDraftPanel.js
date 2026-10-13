import React from 'react'
import { useSelector } from 'react-redux'

import ColorForClass from '../data/ClassColors'
import useCardOverlay from './OverlayImage'
import CardImage from './CardImage'
import RequiredThumbs from './RequiredThumbs'
import { useT } from '../i18n'

function InvestigatorPanel(props) {
    const t = useT()
    const cardData = useSelector(state => state.data.cardData)
    const investigatorData = useSelector(state => state.settings.investigatorData)
    const investigator = useSelector(state => state.settings.investigator)

    const doCardOverlay = useCardOverlay()

    let investigatorCardImage = null
    let investigatorCardImageBack = null
    
    // handle weirdly rotated ArkhamDB images
    function imageDidLoad(props)
    {
        const { index, event } = props;

        if (event.target.naturalHeight > event.target.naturalWidth) {
            if ( index === 0) event.target.className = 'investigator-image rotatecw'
            else event.target.className = 'investigator-image rotateccw'
        }
    }

    if (cardData) {
        const factionCode = investigatorData.faction_code;
        const classColor = ColorForClass(factionCode)

        // ArkhamDB's image first, then arkham.build's; the placeholder is for when neither has it
        const placeholder = label => <div className="investigator-div-loading" style={{backgroundColor: classColor}}><h3>{label}</h3><p>{t('Image not available')}</p><p><a href={investigatorData.url} target="_blank" rel="noreferrer noopener">{t('View on ArkhamDB')}</a></p></div>

        investigatorCardImage =
            <div className="investigator-div" style={{backgroundColor: classColor}} onPointerEnter={event => doCardOverlay(investigatorData, event, 'front')} onPointerLeave={() => doCardOverlay(null)}>
                <CardImage card={investigatorData} side="front" className="investigator-image" alt={investigator}
                    onLoad={event => imageDidLoad({index: 0, event: event})} fallback={placeholder(investigator)} />
            </div>

        investigatorCardImageBack =
            <div className="investigator-div" style={{backgroundColor: classColor}} onPointerEnter={event => doCardOverlay(investigatorData, event, 'back')} onPointerLeave={() => doCardOverlay(null)}>
                <CardImage card={investigatorData} side="back" className="investigator-image" alt={t('{name} (back)', { name: investigator })}
                    onLoad={event => imageDidLoad({index: 1, event: event})} fallback={placeholder(t('{name} (Back)', { name: investigator }))} />
            </div>
    }

    return (
        <div className="settingsDiv">
            <h2>{props.title || investigator}</h2>
            {props.subtitle ? <p className="investigator-subtitle">{props.subtitle}</p> : null}
            <div className="investigator-grid">
                {investigatorCardImage}
                {investigatorCardImageBack}
            </div>
            <RequiredThumbs investigator={investigatorData} />
        </div>
    )
}

export default InvestigatorPanel
