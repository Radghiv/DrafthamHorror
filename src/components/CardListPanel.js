import React from 'react'
import { useSelector } from 'react-redux'

import { costWithTaboo } from '../draft/DrawDraft'
import useCardOverlay from './OverlayImage'
import useCardName from './useCardName'
import CardLinkButton from './CardLinkButton'
import { costBin } from './CostCurve'
import { useT } from '../i18n'

function CardListPanel(props) {
    const t = useT()

    const cardList = props.list
    const cardData = useSelector(state => state.data.cardData)
    const deckName = useSelector(state => state.draft.deckName)
    const highlightCost = useSelector(state => state.settings.highlightCost)

    // rows of the cost curve column being hovered stand out
    function rowClass(item) {
        return 'cardlist-item' + (highlightCost !== null && costBin(item) === highlightCost ? ' highlighted' : '')
    }

    let assetCount = 0  
    let eventCount = 0
    let skillCount = 0
    let otherCount = 0
    const hand = []
    const hand2 = []
    const arcane = []
    const arcane2 = []
    const accessory = []
    const body = []
    const ally = []
    const tarot = []
    const otherasset = []
    const permanent = []
    const event = []
    const skill = []
    const other = []

    cardList.forEach(item => {
        if (item.type_code === 'event') {
            event.push(item)
            eventCount += item.count
        }
        else if (item.type_code === 'skill') {
            skill.push(item)
            skillCount += item.count
        }
        else if (item.type_code === 'asset') {
            if (item.permanent) permanent.push(item)
            else if (item.slot === 'Hand') hand.push(item)
            else if (item.slot === 'Hand x2') hand2.push(item)
            else if (item.slot === 'Arcane') arcane.push(item)
            else if (item.slot === 'Arcane x2') arcane2.push(item)
            else if (item.slot === 'Accessory') accessory.push(item)
            else if (item.slot === 'Body') body.push(item)
            else if (item.slot === 'Ally') ally.push(item)
            else if (item.slot === 'Tarot') tarot.push(item)
            else otherasset.push(item)
            assetCount += item.count
        }
        else {
            other.push(item)
            otherCount += item.count
        }
    })

    const doCardOverlay = useCardOverlay()
    const { cardName, compareNames } = useCardName()

    function onEnterCard(event) {
        const cardArray = cardData.filter(item => item.code === event.target.id)

        if (cardArray && cardArray.length > 0) {
            doCardOverlay(cardArray[0], event)
        }
    }

    function onLeaveCard(event) {
        doCardOverlay(null)
    }

    const assetHeader = assetCount > 0 ? <h4>{t('Assets ({count})', { count: assetCount })}</h4> : null
    
    const handHeader = hand.length > 0 ? <p className='slot-header'>{t('Hand')}</p> : null
    const handContents = hand.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map((item, index) => {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null

        return <p className={rowClass(item)} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} key={index}>{cardName(item)}{levelStr}{countStr}<CardLinkButton card={item} size="small" /></p>
    })

    const hand2Header = hand2.length > 0 ? <p className='slot-header'>{t('Hand x2')}</p> : null
    const hand2Contents = hand2.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map((item, index) => {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null

        return <p className={rowClass(item)} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} key={index}>{cardName(item)}{levelStr}{countStr}<CardLinkButton card={item} size="small" /></p>
    })

    const arcaneHeader = arcane.length > 0 ? <p className='slot-header'>{t('Arcane')}</p> : null
    const arcaneContents = arcane.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map((item, index) => {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null

        return <p className={rowClass(item)} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} key={index}>{cardName(item)}{levelStr}{countStr}<CardLinkButton card={item} size="small" /></p>
    })

    const arcane2Header = arcane2.length > 0 ? <p className='slot-header'>{t('Arcane x2')}</p> : null
    const arcane2Contents = arcane2.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map((item, index) => {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null

        return <p className={rowClass(item)} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} key={index}>{cardName(item)}{levelStr}{countStr}<CardLinkButton card={item} size="small" /></p>
    })

    const accessoryHeader = accessory.length > 0 ? <p className='slot-header'>{t('Accessory')}</p> : null
    const accessoryContents = accessory.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map((item, index) => {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null

        return <p className={rowClass(item)} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} key={index}>{cardName(item)}{levelStr}{countStr}<CardLinkButton card={item} size="small" /></p>
    })

    const bodyHeader = body.length > 0 ? <p className='slot-header'>{t('Body')}</p> : null
    const bodyContents = body.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map((item, index) => {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null

        return <p className={rowClass(item)} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} key={index}>{cardName(item)}{levelStr}{countStr}<CardLinkButton card={item} size="small" /></p>
    })

    const allyHeader = ally.length > 0 ? <p className='slot-header'>{t('Ally')}</p> : null
    const allyContents = ally.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map((item, index) => {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null

        return <p className={rowClass(item)} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} key={index}>{cardName(item)}{levelStr}{countStr}<CardLinkButton card={item} size="small" /></p>
    })

    const tarotHeader = tarot.length > 0 ? <p className='slot-header'>{t('Tarot')}</p> : null
    const tarotContents = tarot.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map((item, index) => {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null

        return <p className={rowClass(item)} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} key={index}>{cardName(item)}{levelStr}{countStr}<CardLinkButton card={item} size="small" /></p>
    })

    const otherassetHeader = otherasset.length > 0 ? <p className='slot-header'>{t('Other')}</p> : null
    const otherassetContents = otherasset.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map((item, index) => {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null

        return <p className={rowClass(item)} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} key={index}>{cardName(item)}{levelStr}{countStr}<CardLinkButton card={item} size="small" /></p>
    })

    const permanentHeader = permanent.length > 0 ? <p className='slot-header'>{t('Permanent')}</p> : null
    const permanentContents = permanent.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map((item, index) => {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null

        return <p className={rowClass(item)} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} key={index}>{cardName(item)}{levelStr}{countStr}<CardLinkButton card={item} size="small" /></p>
    })

    const eventHeader = eventCount > 0 ? <h4>{t('Events ({count})', { count: eventCount })}</h4> : null
    const eventContents = event.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map((item, index) => {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null

        return <p className={rowClass(item)} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} key={index}>{cardName(item)}{levelStr}{countStr}<CardLinkButton card={item} size="small" /></p>
    })

    const skillHeader = skillCount > 0 ? <p className='slot-header'>{t('Skills ({count})', { count: skillCount })}</p> : null
    const skillContents = skill.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map((item, index) => {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null

        return <p className={rowClass(item)} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} key={index}>{cardName(item)}{levelStr}{countStr}<CardLinkButton card={item} size="small" /></p>
    })

    const otherHeader = otherCount > 0 ? <h4>{t('Other ({count})', { count: otherCount })}</h4> : null
    const otherContents = other.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map((item, index) => {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null

        return <p className={rowClass(item)} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} key={index}>{cardName(item)}{levelStr}{countStr}<CardLinkButton card={item} size="small" /></p>
    })

    const header = props.deck ?
        <h3>{deckName.length > 0 ? deckName : t('Deck')}</h3> :
        props.removed ? <h3>{t('Removed List')}</h3> :
        <h3>{t('Draft List')}</h3>

    const subheader = props.deck ?
        <h5>{t('Deck List')}</h5>:
        null

    const bottomText = props.removed ? <p style={{fontSize: '8pt', marginTop: '5px'}}>{t('Cards in this list will not be removed from the deck or draft list, to keep original deck and record of drafts intact.')}</p> : null

    return (
        <div className="settingsDiv">
            {header}
            {subheader}
            <div className="list-container">
                <div className="col1">
                    {assetHeader}
                    {handHeader}
                    {handContents}
                    {hand2Header}
                    {hand2Contents}
                    {arcaneHeader}
                    {arcaneContents}
                    {arcane2Header}
                    {arcane2Contents}
                    {accessoryHeader}
                    {accessoryContents}
                    {bodyHeader}
                    {bodyContents}
                    {allyHeader}
                    {allyContents}
                    {tarotHeader}
                    {tarotContents}
                    {otherassetHeader}
                    {otherassetContents}
                    {permanentHeader}
                    {permanentContents}
                </div>
                <div className="col2">
                    {eventHeader}
                    {eventContents}
                    {skillHeader}
                    {skillContents}
                    {otherHeader}
                    {otherContents}
                </div>
            </div>
            <div>{bottomText}</div>
        </div>
    )
}

export default CardListPanel