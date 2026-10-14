import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSelector, useDispatch } from 'react-redux'

import { advanceDraft, updateUpgradeOption, changeIndex, hideDraftPoolCard, revealDraftPoolCard, revealDraftPoolCards, expandModifiers, minimizeModifiers, holdModifiers, selectDraftCard, changeDraftPoolProperty } from '../features/draft/draftSlice'

import { draftCard, redrawDraftCard } from '../draft/DrawDraft'
import useDraftProgress from '../draft/useDraftProgress'
import { rememberUndoPoint } from '../features/draftHistory'
import startCardFlight from '../draft/flyCard'
import ColorForClass from '../data/ClassColors'
import useCardOverlay from './OverlayImage'
import useCardName from './useCardName'
import { cardImageUrls } from '../data/CardImages'
import CardTextOverlay from './CardTextOverlay'
import { RedrawIcon, ZoomIcon } from './wizard/Icons'
import usePhoneLayout from './usePhoneLayout'
import useScrollLock from './useScrollLock'
import CardLinkButton from './CardLinkButton'
import { PLAYER_CARD_BACK } from '../data/CardImages'
import { ANIMATION_SPEEDS } from '../data/AnimationSpeed'
import { useT } from '../i18n'

// pause between the start of one card turning and the start of the next (the turns overlap: a card doesn't wait for the previous
// one to finish), how long a card waits for its image before turning anyway, and how long it is shown face down before it may turn
const CARD_FLIP_STAGGER = 150
const IMAGE_WAIT_LIMIT = 4000
const FIRST_CARD_DELAY = 450

function DraftPanel(props) {
    const t = useT()

    // per card of the pool: whether its image loaded (true) or none could be loaded ('failed'), and which source is being tried
    const [imageLoaded, setImageLoaded] = useState([])
    const [imageSource, setImageSource] = useState([])

    // keys of the cards being redrawn: face down with their old face, waiting to be replaced
    const [redrawing, setRedrawing] = useState({})

    // After a pick the cards of the next batch arrive face down while the old ones are still turning over: until they have turned, each
    // slot keeps the face it had (null when no pick is turning). The slot that was picked shows nothing: its card is flying to the list.
    const [leaving, setLeaving] = useState(null)
    const leavingTimer = useRef(null)

    // what screen readers are told: the cards to choose from once they are all face up, and what was drafted
    const [announcement, setAnnouncement] = useState('')

    const draftPool = useSelector(state => state.draft.draftPool)
    const draftType = useSelector(state => state.settings.draftType)
    const insufficientOptions = useSelector(state => state.draft.insufficientDraftOptions)
    const requireConfirmation = useSelector(state => state.settings.confirmDraft)
    const selectedDraftCard = useSelector(state => state.draft.selectedDraftCard)
    const deckLoaded = useSelector(state => state.data.deckLoaded)
    const cardsPerRow = useSelector(state => state.settings.cardsPerRow)
    const animationSpeed = useSelector(state => state.settings.animationSpeed)
    const animateTogether = useSelector(state => state.settings.animateTogether)

    const phone = usePhoneLayout()
    const progress = useDraftProgress()

    // phone: the card whose cost modifiers are open in the sheet
    const [modifierSheet, setModifierSheet] = useState(null)
    useScrollLock(phone && modifierSheet !== null)

    // multiplier of the draft animations; 0 skips them (the system's reduced motion setting does too)
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const speed = reducedMotion ? 0 : ANIMATION_SPEEDS[animationSpeed]

    const dispatch = useDispatch()

    // big preview of the card under the pointer (on touch screens: of the card that is pressed and held)
    const doCardOverlay = useCardOverlay()
    const { cardName } = useCardName()

    // the name of a card with its level when it has one, for screen readers
    function cardLabel(card) {
        return cardName(card) + (card.xp ? ' ' + t('(level {level})', { level: card.xp }) : '')
    }

    var displayedBox = false

    // With confirmation required the first click selects a card and a second click on the same card drafts it, so the
    // pointer never has to move. Enter does the same from the keyboard (see the effect below).
    function handleCardClick(index) {
        if (!requireConfirmation || selectedDraftCard === index) {
            draftCardWithIndex({index: index})
        }
        else {
            dispatch(selectDraftCard(index))
        }
    }
    function confirmSelected() {
        if (selectedDraftCard !== null && selectedDraftCard !== undefined) draftCardWithIndex({index: selectedDraftCard})
    }

    function handleUpgradeChange(event) {
        var index = event.target.name.substring(15)

        dispatch(updateUpgradeOption(index, event.target.value))
    }

    function doneClick(event) {
        dispatch(rememberUndoPoint)
        if (requireConfirmation) dispatch(selectDraftCard(null))
        dispatch(advanceDraft(true))
    }

    function draftCardWithIndex(props) {
        const { index } = props

        // the card turns into its row of the Draft List: the copy is made before the pool is replaced, and lands on the
        // row once the list has re-rendered
        doCardOverlay(null)

        if (draftPool[index]) setAnnouncement(t('Drafted {name}', { name: cardName(draftPool[index]) }))

        const flight = startCardFlight(document.querySelectorAll('.draft-container .draft-card-wrap')[index], speed)
        const cardKey = draftPool[index] ? draftPool[index].key : null

        turnAtOnce.current = {}

        if (speed !== 0) {
            const faces = {}

            draftPool.forEach((card, slot) => {
                if (slot === index) faces[slot] = { blank: true }
                else if (card.revealed && imageLoaded[slot] === true) faces[slot] = { card: card, src: cardImageUrls(card)[imageSource[slot] || 0] }
            })

            clearTimeout(leavingTimer.current)
            setLeaving(faces)
            leavingTimer.current = setTimeout(() => setLeaving(null), 600 / speed + 60)
        }

        dispatch(changeIndex(index))
        dispatch(draftCard())
        setImageLoaded([])
        setImageSource([])
        if (requireConfirmation) dispatch(selectDraftCard(null))

        if (flight) requestAnimationFrame(() => flight.land(cardKey))

        // on a phone the cards are in a long column: the next batch starts at the top
        if (phone && window.scrollY > 0) window.scrollTo({ top: 0, behavior: speed === 0 ? 'auto' : 'smooth' })
    }

    // New cards arrive face down and are turned one after the other, each starting shortly after the previous one started (not when it is
    // done): a card waits for its image (a few seconds at most). Without motion they simply appear.
    const lastReveal = useRef(0)
    const shownAt = useRef({})
    // indexes of redrawn cards, which skip the short pause face down
    const turnAtOnce = useRef({})

    useEffect(() => {
        const pending = []

        // a card being redrawn stays face down until it is replaced
        draftPool.forEach((card, index) => {
            if (!card.revealed && !redrawing[card.key]) pending.push(index)
        })

        if (pending.length === 0) return undefined

        // when each pending card was first seen face down: a card is shown that way for a moment before it turns, otherwise a cached
        // image would turn it before the back was ever painted
        const now = Date.now()
        const seenKey = index => index + ':' + draftPool[index].key

        pending.forEach(index => {
            if (!(seenKey(index) in shownAt.current)) shownAt.current[seenKey(index)] = now
        })

        // the old cards are still turning over: the new ones wait for them
        if (leaving) return undefined

        const isReady = index => imageLoaded[index] === true || imageLoaded[index] === 'failed' || cardImageUrls(draftPool[index]).length === 0

        // all together: once every image is in (or the wait limit is up) all the pending cards turn over at the same moment
        if (animateTogether && speed !== 0) {
            const pause = pending.every(index => turnAtOnce.current[index]) ? 0 : FIRST_CARD_DELAY / speed
            const timer = setTimeout(() => {
                pending.forEach(index => delete turnAtOnce.current[index])
                dispatch(revealDraftPoolCards(pending))
            }, pending.every(isReady) ? pause : IMAGE_WAIT_LIMIT)

            return () => clearTimeout(timer)
        }

        const index = pending[0]

        const wait = speed === 0 ? 0
            : !isReady(index) ? IMAGE_WAIT_LIMIT
            : turnAtOnce.current[index] ? 0
            : Math.max(0,
                lastReveal.current + CARD_FLIP_STAGGER / speed - now,
                shownAt.current[seenKey(index)] + FIRST_CARD_DELAY / speed - now)

        const timer = setTimeout(() => {
            delete turnAtOnce.current[index]
            lastReveal.current = Date.now()
            delete shownAt.current[seenKey(index)]
            dispatch(revealDraftPoolCard(index))
        }, wait)

        return () => clearTimeout(timer)
    }, [draftPool, imageLoaded, redrawing, leaving, speed, animateTogether, dispatch])

    useEffect(() => () => clearTimeout(leavingTimer.current), [])

    const allRevealed = draftPool.length > 0 && draftPool.every(card => card.revealed)
    const poolSignature = draftPool.map(card => card.key).join('|')

    useEffect(() => {
        setModifierSheet(null)
    }, [poolSignature, phone])

    useEffect(() => {
        if (modifierSheet === null) return undefined

        function handleKeyDown(event) {
            if (event.key === 'Escape') setModifierSheet(null)
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [modifierSheet])

    useEffect(() => {
        if (!allRevealed) return

        setAnnouncement(t('{count} card to choose from: {names}|{count} cards to choose from: {names}', { count: draftPool.length, names: draftPool.map(card => cardLabel(card)).join(', ') }))
        // only when the cards change, not each time the pool object does
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allRevealed, poolSignature])

    // Enter drafts the selected card, Escape clears the selection. Focused buttons already handle Enter natively.
    useEffect(() => {
        function handleKeyDown(event) {
            const tag = event.target.tagName
            const hasSelection = selectedDraftCard !== null && selectedDraftCard !== undefined

            if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

            if (event.key === 'Escape' && hasSelection) {
                dispatch(selectDraftCard(null))
            }
            else if (event.key === 'Enter' && hasSelection && requireConfirmation && !insufficientOptions && tag !== 'BUTTON' && tag !== 'A') {
                event.preventDefault()
                draftCardWithIndex({index: selectedDraftCard})
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => window.removeEventListener('keydown', handleKeyDown)
    })

    // The cost modifiers of a card (PC): the pill over the pips under its cost opens the box with the details at the bottom of the card when
    // the pointer is over it (1) and keeps it open while the pointer is anywhere on the card, or until it is clicked, which holds it open (2)
    // until it is clicked again
    function expandPanelHover(index) {
        if (draftPool[index] && draftPool[index].expandedModifiers === 0) dispatch(expandModifiers(index))
    }
    function minimizePanelHover(index) {
        if (draftPool[index] && draftPool[index].expandedModifiers === 1) dispatch(minimizeModifiers(index))
    }
    function expandPanelClick(index, event) {
        const clickedElement = event.target.nodeName

        if (draftPool[index] && clickedElement !== 'SELECT' && clickedElement !== 'INPUT' && clickedElement !== 'OPTION') {
            if (draftPool[index].expandedModifiers === 2) {
                dispatch(minimizeModifiers(index))
            }
            else {
                dispatch(holdModifiers(index))
            }
        }
    }
    function handleCheckbox(event) {
        const panelIndex = parseInt(event.target.name.substring(14))

        dispatch(changeDraftPoolProperty('shrewdAnalysis', panelIndex, event.target.checked))
    }

    // Redraws one card of the pool: the card turns face down still showing its old face, and is replaced once it is hidden
    // (the new card then turns over like any other); its image state starts over
    function handleRedraw(index) {
        const card = draftPool[index]

        if (!card || redrawing[card.key]) return

        const reset = previous => {
            const copy = [...previous]
            delete copy[index]
            return copy
        }

        doCardOverlay(null)

        const replace = () => {
            if (dispatch(redrawDraftCard(index, card.key))) {
                // the card is already face down, it turns as soon as its image is in
                turnAtOnce.current[index] = true
                setImageLoaded(reset)
                setImageSource(reset)
            }
            setRedrawing(previous => {
                const copy = { ...previous }
                delete copy[card.key]
                return copy
            })
        }

        if (speed === 0) {
            replace()
            return
        }

        setRedrawing(previous => ({ ...previous, [card.key]: true }))
        dispatch(hideDraftPoolCard(index))
        setTimeout(replace, 600 / speed)
    }

    // this address failed: try the next source, or give up when there is none left
    function imageDidFail(index, sourceCount) {
        const next = (imageSource[index] || 0) + 1

        if (next < sourceCount) {
            setImageSource(previous => {
                const copy = [...previous]
                copy[index] = next
                return copy
            })
        }
        else {
            setImageLoaded(previous => {
                const copy = [...previous]
                copy[index] = 'failed'
                return copy
            })
        }
    }

    function imageDidLoad(props)
    {
        const { index } = props;

        setImageLoaded(prevData => {
            var a = [...prevData]
            a[index] = true
            return a
        })
    }

    // What the cost modifiers box of card i holds: the modifiers that change its cost, the choice of upgrade and the research option
    function modifierParts(i) {
        const modifierList = []
        let upgradeSelector = null
        let researchSelector = null

        for (let j = 0; j < draftPool[i].cardModifiers.length; j++) {
            const item = draftPool[i].cardModifiers[j]

            if (item.name === 'UpgradeOptions') {
                if (item.options.length > 0) {
                    const m = item.options[draftPool[i].selectedUpgrade].modifier
                    const valueText = m >= 0 ? '+' + m : m

                    if (m !== 0) {
                        modifierList.push(
                            <div key={j}>
                                <label className="modifierleft">{t('Upgrade:')}</label>
                                <span className="modifierright"><b>{t('{xp} XP', { xp: valueText })}</b></span>
                            </div>
                        )
                    }
                }

                // only display options box if more than 1 option
                if (item.options.length > 1) {
                    const upgradeList = item.options.map((option, index) => {
                        return <option value={index.toString()} key={index.toString()}>
                            {option.label ? t(option.label, option.labelVars) : option.text}
                            </option>
                    })

                    upgradeSelector = <div className="full-width">
                        <p className="upgrade-header"><b>{t('Upgrade Options')}</b></p>
                        <select className="upgradeselect" name={"SelectedUpgrade" + i} value={draftPool[i].selectedUpgrade} onChange={handleUpgradeChange}>
                            {upgradeList}
                        </select>
                    </div>
                }
            }
            else if (item.modifier !== 0) {
                const valueText = item.modifier > 0 ? '+' + item.modifier : item.modifier
                modifierList.push(
                    <div key={j}>
                        <label className="modifierleft">{item.name}:</label>
                        <span className="modifierright"><b>{t('{xp} XP', { xp: valueText })}</b></span>
                    </div>
                )
            }
            else if (item.research && item.shrewd) {
                researchSelector = <div className="full-width">
                    <p className="upgrade-header"><b>{t('Upgrade Options')}</b></p>
                    <label className="modifierleft">{t('Shrewd Analysis:')}</label>
                    <span className="modifierright">
                        <input type="checkbox" className="modifiercheckbox" checked={draftPool[i].shrewdAnalysis ? true : false} name={"shrewdAnalysis" + i} onChange={handleCheckbox}/>
                    </span>
                </div>
            }
        }

        return { modifierList, upgradeSelector, researchSelector }
    }

    // whether card i has cost modifiers worth showing (the small XP box on the card)
    function hasModifierBox(i) {
        for (let j = 0; j < draftPool[i].cardModifiers.length; j++) {
            const modifier = draftPool[i].cardModifiers[j]

            if (modifier.name === 'UpgradeOptions') {
                if (modifier.options.length > 1) return true
                if (modifier.options.length > 0 && modifier.options[draftPool[i].selectedUpgrade].modifier !== 0) return true
            }
            else if (modifier.name === 'ResearchOptions') {
                return true
            }
            else if (modifier.modifier !== 0) {
                return true
            }
        }

        return false
    }


    let images = []

    let factionCode = ''

    for (let i = 0; i < draftPool.length; i++) {
        if (draftPool[i].faction2_code) factionCode = 'multiclass'
        else factionCode = draftPool[i].faction_code

        const classColor = ColorForClass(factionCode)

        let modifierPill = null
        let modifierBox = null
        let modifierChip = null

        if (phone) {
            // the box of cost modifiers is too small to use on a phone: a chip on the card opens the same options in a sheet
            if (hasModifierBox(i)) {
                modifierChip = <button type="button" className="draft-xp-chip" style={{ "--chip-color": classColor }} aria-haspopup="dialog" aria-label={t('Cost Modifiers')} onClick={() => setModifierSheet(i)}>{t('{xp} XP', { xp: draftPool[i].xpcost })}</button>
            }
        }
        else if (hasModifierBox(i)) {
            const open = draftPool[i].expandedModifiers

            modifierPill = <div className={'draft-modifiers-minimized' + (open ? ' is-open' : '')} style={{ backgroundColor: classColor }} onClick={event => expandPanelClick(i, event)} onMouseEnter={() => expandPanelHover(i)}>
                <div className="modifier-panel-div">
                    <p className="minimized-modifier-cost" style={{padding: '0px'}}><b>{draftPool[i].xpcost}</b></p>
                    <p className="minimized-modifier-xp"><b>{t('XP')}</b></p>
                </div>
            </div>

            if (open) {
                const { modifierList, upgradeSelector, researchSelector } = modifierParts(i)

                if (modifierList.length > 0 || upgradeSelector || researchSelector) {
                    modifierBox = <div className="draft-modifiers-expanded" style={{ backgroundColor: classColor }} onClick={event => expandPanelClick(i, event)}>
                        <div className="modifier-panel-div">
                            {modifierList.length > 0 ?
                                <p className="upgrade-header"><b>{t('Cost Modifiers')}</b></p>
                                : null}
                            {modifierList}
                            {upgradeSelector}
                            {researchSelector}
                        </div>
                    </div>
                }
            }

            displayedBox = true
        }

        const isSelected = requireConfirmation && selectedDraftCard === i
        // ArkhamDB's image first, then arkham.build's
        const sources = cardImageUrls(draftPool[i])
        const hasImage = sources.length > 0 && imageLoaded[i] !== 'failed'
        const isLoaded = imageLoaded[i] === true
        const imageSrc = sources[imageSource[i] || 0]
        const levelStr = draftPool[i].xp && draftPool[i].xp > 0 ? <span className='xpDots'>{' ' + '●'.repeat(draftPool[i].xp)}</span> : null

        // loads the picture of the card in the background
        const loader = hasImage && !isLoaded ?
            <img style={{visibility: "hidden", position: "absolute"}} src={imageSrc} alt="" onLoad={() => imageDidLoad({index: i})} onError={() => imageDidFail(i, sources.length)} /> : null

        const faceUp = !!draftPool[i].revealed
        const oldFace = leaving && !faceUp ? leaving[i] : null

        let cardFace

        if (oldFace) {
            cardFace = oldFace.blank ?
                <>{loader}</> :
                <><img className="draft-image" src={oldFace.src} alt="" /><CardTextOverlay card={oldFace.card} />{loader}</>
        }
        else if (isLoaded) {
            cardFace = <><img className="draft-image" src={imageSrc} alt="" /><CardTextOverlay card={draftPool[i]} /></>
        }
        else {
            cardFace =
                <span className="draft-card-loading" style={{backgroundColor: classColor, display: 'block'}}>
                    <span className="cardName" style={{display: 'block', fontSize: '1.17em', fontWeight: 'bold', padding: '10px 10px 0 10px'}}>{cardName(draftPool[i])}</span>
                    <span className="cardXP" style={{display: 'block'}}>{levelStr}</span>
                    <span className="imageStatus">{hasImage ? t('Image loading...') : t('Image not available')}</span>
                    {loader}
                </span>
        }

        const cardWrap =
            <div className={'draft-card-wrap' + (isSelected ? ' selected' : '') + (faceUp ? '' : ' facedown')} key={phone ? undefined : i}
                onPointerEnter={event => { if (faceUp && hasImage) doCardOverlay(draftPool[i], event) }}
                onPointerLeave={() => doCardOverlay(null)}
                onMouseLeave={() => minimizePanelHover(i)}>
                <div className="flip">
                    <div className="flip-face flip-back" aria-hidden="true">
                        <img src={PLAYER_CARD_BACK} alt="" onError={event => { event.target.style.display = 'none' }} />
                    </div>
                    <div className="flip-face flip-front">
                <button type="button" className="draft-card-hit" disabled={!faceUp} aria-label={cardLabel(draftPool[i])}
                    aria-pressed={requireConfirmation ? isSelected : undefined} onClick={() => handleCardClick(i)}
                    onFocus={event => { if (hasImage && event.target.matches && event.target.matches(':focus-visible')) doCardOverlay(draftPool[i], event) }}
                    onBlur={() => doCardOverlay(null)}
                    onKeyDown={event => { if (event.key === 'Enter' && event.repeat) event.preventDefault() }}>
                    {cardFace}
                </button>
                    </div>
                </div>
                {draftType === 'draft' && !phone ?
                    <button type="button" className="btn btn-secondary draft-card-redraw" aria-label={t('Redraw {name}', { name: cardName(draftPool[i]) })} title={t('Redraw')} onClick={() => handleRedraw(i)}><RedrawIcon /></button>
                    : null}
                {isLoaded && !phone ? <CardLinkButton card={draftPool[i]} /> : null}
                {!isLoaded ? <p className="draft-card-link"><a href={draftPool[i].url} target="_blank" rel="noreferrer noopener">{t('View on ArkhamDB')}</a></p> : null}
                {phone ? modifierChip : <>{modifierPill}{modifierBox}</>}
            </div>

        // on a phone the buttons that sit over the card on a PC (Redraw, a link) get a row of their own under it, and tapping a card
        // selects it, so Zoom is how its big picture is opened
        if (phone) {
            images.push(
                <div className="draft-tile" key={i}>
                    {cardWrap}
                    <div className="draft-tile-actions">
                        {draftType === 'draft' ?
                            <button type="button" className="tile-action" disabled={!faceUp} aria-label={t('Redraw {name}', { name: cardName(draftPool[i]) })} onClick={() => handleRedraw(i)}><RedrawIcon /><span>{t('Redraw')}</span></button>
                            : null}
                        <button type="button" className="tile-action" disabled={!faceUp || !hasImage} aria-label={t('Zoom {name}', { name: cardName(draftPool[i]) })} onClick={event => doCardOverlay(draftPool[i], event)}><ZoomIcon /><span>{t('Zoom')}</span></button>
                    </div>
                </div>
            )
        }
        else {
            images.push(cardWrap)
        }
    }

    const progressUnit = progress.isUpgrade ? t('XP') : t('cards')
    const progressValue = progress.value
    const progressTarget = progress.target

    // one segment per card (or per XP), capped so very large targets still read as a bar
    const segmentCount = progressTarget > 0 ? Math.min(progressTarget, 60) : 0
    const filledSegments = progressTarget > 0 ? Math.round(Math.min(Math.max(progressValue, 0), progressTarget) / progressTarget * segmentCount) : 0
    const segments = []
    for (let i = 0; i < segmentCount; i++) {
        segments.push(<span className={'segment' + (i < filledSegments ? ' filled' : '')} key={i}></span>)
    }

    const showDone = (!progress.isLevel0Build && !(progress.isUpgrade && !deckLoaded)) || insufficientOptions

    const optionsWarning = insufficientOptions ? <p className="notice notice-error" role="alert">{t('There are no remaining legal draft options')}</p> : null

    const instructionsBox = insufficientOptions || !displayedBox ? null :
        <p className="notice">{t('Hover over the XP cost on a card to display the cost modifiers, click to hold them open')}</p>

    const hasSelection = requireConfirmation && selectedDraftCard !== null && selectedDraftCard !== undefined && draftPool[selectedDraftCard]

    let confirmText = requireConfirmation ? t('Select a card to draft it') : t('Click a card to draft it')
    if (hasSelection) confirmText = t('Draft {name}?', { name: cardName(draftPool[selectedDraftCard]) })
    if (insufficientOptions) confirmText = t('No more cards can be drafted here')

    const confirmBar =
        <div className="confirm-bar">
            <div className="bar-progress">
                <div className="segments" role="progressbar" aria-valuemin="0" aria-valuemax={progressTarget} aria-valuenow={progressValue}
                    aria-label={progress.isUpgrade ? t('Drafted XP') : t('Drafted cards')}>
                    {segments}
                </div>
                <div className="bar-count"><strong>{progressValue}</strong> / {progressTarget} {progressUnit}</div>
            </div>
            <div className="bar-row">
                <div className="confirm-bar-text" aria-live="polite">
                    {confirmText}
                    {!insufficientOptions ?
                        <span className="confirm-bar-hint">{requireConfirmation ? t('Click the selected card again or press Enter. Esc clears the selection.') : t('Picks are added right away.')}</span>
                        : null}
                </div>
                <div className="confirm-bar-actions">
                    {requireConfirmation && !insufficientOptions ?
                        <button type="button" className="btn btn-primary" onClick={() => { if (hasSelection) confirmSelected() }} aria-disabled={!hasSelection}>{t('Draft this card')}</button>
                        : null}
                    {showDone ? <button type="button" className="btn btn-secondary" onClick={doneClick}>{t('Done')}</button> : null}
                </div>
            </div>
        </div>

    // On a phone the confirm bar is replaced by a strip that only exists while there is something to confirm (the progress is in the top
    // bar and Undo in the dock), or by a small Done button
    let phoneConfirm = null

    if (hasSelection || insufficientOptions) {
        phoneConfirm =
            <div className="phone-confirm" role="group">
                <span className="phone-confirm-text" aria-live="polite">{confirmText}</span>
                {insufficientOptions ?
                    <button type="button" className="btn btn-primary" onClick={doneClick}>{t('Done')}</button> :
                    <button type="button" className="btn btn-primary" onClick={confirmSelected}>{t('Draft this card')}</button>}
            </div>
    }
    else if (showDone) {
        phoneConfirm = <button type="button" className="btn btn-secondary phone-done" onClick={doneClick}>{t('Done')}</button>
    }

    // the cost modifiers of the card tapped on its chip, in a sheet from the bottom of the screen (the document's body: it is above everything)
    const sheetCard = phone && modifierSheet !== null ? draftPool[modifierSheet] : null
    let sheetContents = null

    if (sheetCard) {
        const { modifierList, upgradeSelector, researchSelector } = modifierParts(modifierSheet)

        sheetContents = createPortal(
            <div className="sheet-scrim modifier-scrim" onClick={() => setModifierSheet(null)}>
                <div className="modifier-sheet" role="dialog" aria-modal="true" aria-label={cardName(sheetCard)} onClick={event => event.stopPropagation()}>
                    <div className="sheet-grab" aria-hidden="true"></div>
                    <h2>{cardName(sheetCard)}<span className="modifier-sheet-xp">{t('{xp} XP', { xp: sheetCard.xpcost })}</span></h2>
                    <div className="modifier-sheet-body">
                        {modifierList.length > 0 ? <p className="upgrade-header"><b>{t('Cost Modifiers')}</b></p> : null}
                        {modifierList}
                        {upgradeSelector}
                        {researchSelector}
                    </div>
                    <button type="button" className="btn btn-primary btn-block" onClick={() => setModifierSheet(null)}>{t('Done')}</button>
                </div>
            </div>,
            document.body)
    }

    return (
        <>
            {optionsWarning}
            {phone ? null : instructionsBox}
            <div className='draft-container' style={{ '--flip-duration': speed === 0 ? '0s' : (0.6 / speed) + 's', ...(cardsPerRow > 0 ? { gridTemplateColumns: 'repeat(' + cardsPerRow + ', minmax(0, 1fr))' } : {}) }}>
                {images}
            </div>
            {phone ? phoneConfirm : confirmBar}
            {sheetContents}
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
        </>
    )
}

export default DraftPanel
