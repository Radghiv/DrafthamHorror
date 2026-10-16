import React, { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { costWithTaboo, removeSealedCard } from '../draft/DrawDraft'
import { prepareCardReturn } from '../draft/returnCard'
import { motionSpeed } from '../data/AnimationSpeed'
import { isSealedBuild, sealedCardRemovable } from '../draft/Sealed'
import useCardOverlay, { isTouchScreen } from './OverlayImage'
import useCardName from './useCardName'
import CardLinkButton from './CardLinkButton'
import { costBin } from './CostCurve'
import { motionScale } from './useMotionScale'
import { useT } from '../i18n'

function CardListPanel(props) {
    const t = useT()

    const cardList = props.list
    const cardData = useSelector(state => state.data.cardData)
    const deckName = useSelector(state => state.draft.deckName)
    const highlightCost = useSelector(state => state.settings.highlightCost)
    const deckbuilding = useSelector(state => state.settings.deckbuilding)
    const draftPhase = useSelector(state => state.draft.phase)
    const drafting = useSelector(state => state.settings.drafting)
    const animationSpeed = useSelector(state => state.settings.animationSpeed)

    const dispatch = useDispatch()

    // in a sealed draft of a new deck the cards of the Draft List can be put back in the pool
    const removable = !props.deck && !props.removed && drafting && isSealedBuild(deckbuilding, draftPhase)

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

    // the row (currentTarget) holds the card code; the target can be a part of it, like the dots of the level
    function previewCard(event) {
        const card = cardData.find(item => item.code === event.currentTarget.id)

        if (card) doCardOverlay(card, event)
    }

    function onEnterCard(event) {
        previewCard(event)
    }

    function onLeaveCard() {
        doCardOverlay(null)
    }

    // Rows that appear together (a resumed draft, an undone restart) cascade in: they are remembered here with their place in the cascade for
    // a moment. A single new row is a pick, which has its own flight to the row.
    const [fresh, setFresh] = useState({})
    const knownKeys = useRef(null)
    const freshTimer = useRef(null)
    const listSignature = cardList.map(item => item.key).join('|')

    useLayoutEffect(() => {
        const now = new Set(cardList.map(item => item.key))
        const before = knownKeys.current

        knownKeys.current = now

        // the first time the panel is drawn only counts when a saved draft is being resumed
        const resuming = before === null && document.documentElement.classList.contains('resume-flight')
        const added = Array.from(now).filter(key => before === null ? resuming : !before.has(key))

        if (added.length < 2) return

        setFresh(Object.fromEntries(added.map((key, position) => [key, position])))
        clearTimeout(freshTimer.current)
        freshTimer.current = setTimeout(() => setFresh({}), 1200 * motionScale() + 600)
        // only when the rows change, not each time the list object does
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listSignature])

    useEffect(() => () => clearTimeout(freshTimer.current), [])

    // touch screens have no hover: tapping a row opens the preview
    function removeCard(event, item) {
        // (not a tap on the row: that opens the preview)
        event.stopPropagation()
        doCardOverlay(null)

        // the card flies back to the pool, as in an undo (the copy of the row is made before the list changes)
        const flight = dispatch(prepareCardReturn(motionSpeed(animationSpeed), item.key))

        dispatch(removeSealedCard(item.key))
        if (flight) requestAnimationFrame(flight.land)
    }

    function onTapCard(event) {
        if (isTouchScreen()) previewCard(event)
    }

    // one row of a list: the name, the level as dots, the number of copies and the link to the card
    function renderRow(item, index) {
        const countStr = item.count > 1 ? ' ' + t('x{count}', { count: item.count }) : null
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots'>{' ' + '\u25CF'.repeat(costWithTaboo(item))}</span> : null
        const place = fresh[item.key]
        const entering = place !== undefined

        return <p className={rowClass(item) + (entering ? ' row-enter' : '') + (removable && sealedCardRemovable(item) ? ' is-removable' : '')} style={entering ? { '--row': Math.min(place, 14) } : undefined} id={item.key} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} onClick={onTapCard} key={item.key || index}><span className="cardlist-name">{cardName(item)}{levelStr}{countStr}</span><CardLinkButton card={item} size="small" />{removable && sealedCardRemovable(item) ?
            <button type="button" className="cardlist-remove" aria-label={t('Remove {name}', { name: cardName(item) })} title={t('Remove {name}', { name: cardName(item) })} onClick={event => removeCard(event, item)}>
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button> : null}</p>
    }

    const assetHeader = assetCount > 0 ? <h4>{t('Assets ({count})', { count: assetCount })}</h4> : null
    
    const handHeader = hand.length > 0 ? <p className='slot-header'>{t('Hand')}</p> : null
    const handContents = hand.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map(renderRow)

    const hand2Header = hand2.length > 0 ? <p className='slot-header'>{t('Hand x2')}</p> : null
    const hand2Contents = hand2.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map(renderRow)

    const arcaneHeader = arcane.length > 0 ? <p className='slot-header'>{t('Arcane')}</p> : null
    const arcaneContents = arcane.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map(renderRow)

    const arcane2Header = arcane2.length > 0 ? <p className='slot-header'>{t('Arcane x2')}</p> : null
    const arcane2Contents = arcane2.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map(renderRow)

    const accessoryHeader = accessory.length > 0 ? <p className='slot-header'>{t('Accessory')}</p> : null
    const accessoryContents = accessory.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map(renderRow)

    const bodyHeader = body.length > 0 ? <p className='slot-header'>{t('Body')}</p> : null
    const bodyContents = body.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map(renderRow)

    const allyHeader = ally.length > 0 ? <p className='slot-header'>{t('Ally')}</p> : null
    const allyContents = ally.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map(renderRow)

    const tarotHeader = tarot.length > 0 ? <p className='slot-header'>{t('Tarot')}</p> : null
    const tarotContents = tarot.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map(renderRow)

    const otherassetHeader = otherasset.length > 0 ? <p className='slot-header'>{t('Other')}</p> : null
    const otherassetContents = otherasset.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map(renderRow)

    const permanentHeader = permanent.length > 0 ? <p className='slot-header'>{t('Permanent')}</p> : null
    const permanentContents = permanent.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map(renderRow)

    const eventHeader = eventCount > 0 ? <h4>{t('Events ({count})', { count: eventCount })}</h4> : null
    const eventContents = event.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map(renderRow)

    const skillHeader = skillCount > 0 ? <p className='slot-header'>{t('Skills ({count})', { count: skillCount })}</p> : null
    const skillContents = skill.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map(renderRow)

    const otherHeader = otherCount > 0 ? <h4>{t('Other ({count})', { count: otherCount })}</h4> : null
    const otherContents = other.sort((a, b) => compareNames(a, b) || a.xp - b.xp).map(renderRow)

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