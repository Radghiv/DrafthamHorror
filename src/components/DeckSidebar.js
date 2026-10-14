import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import InvestigatorDraftPanel from './InvestigatorDraftPanel'
import CostCurve from './CostCurve'
import CardListPanel from './CardListPanel'
import { SIDE_SHEET_QUERY } from './usePhoneLayout'
import useScrollLock from './useScrollLock'
import { PersonIcon, ListIcon, UndoIcon } from './wizard/Icons'
import { useT } from '../i18n'

// On narrow screens the side columns become drawers (see styles.css); these are the controls that open and close them.
// drawer is 'left', 'right' or null.
export function DrawerControls(props) {
    const { drawer, onChange } = props

    const t = useT()

    return (
        <>
            <button type="button" className="drawer-tab drawer-tab-left" aria-expanded={drawer === 'left'} aria-controls="draft-left-panel"
                onClick={() => onChange(drawer === 'left' ? null : 'left')}>
                <span className="drawer-tab-label">{t('Investigator & costs')}</span>
            </button>
            <button type="button" className="drawer-tab drawer-tab-right" aria-expanded={drawer === 'right'} aria-controls="draft-right-panel"
                onClick={() => onChange(drawer === 'right' ? null : 'right')}>
                <span className="drawer-tab-label">{t('Card lists')}</span>
            </button>
            {drawer ? <div className="drawer-scrim" onClick={() => onChange(null)}></div> : null}
        </>
    )
}

// On a phone the drawers are replaced by one dock at the bottom of the screen (the investigator, Undo, the card lists) and one sheet
// that opens from it. The dock is where the thumb is; the card that is drafted flies to the card lists button (data-fly-target).
export function PhoneDock(props) {
    const { drawer, onChange, onUndo, canUndo } = props

    const t = useT()

    const cardList = useSelector(state => state.draft.cardList)

    const total = cardList.reduce((sum, item) => sum + (item.count || 1), 0)

    return (
        <div className="phone-dock">
            <button type="button" className="dock-btn" data-investigator-target="true" aria-expanded={drawer === 'left'} aria-controls="draft-left-panel"
                onClick={() => onChange(drawer === 'left' ? null : 'left')}>
                <PersonIcon />
                <span>{t('Investigator')}</span>
            </button>
            {onUndo ?
                <button type="button" className="dock-btn" disabled={!canUndo} onClick={onUndo}>
                    <UndoIcon />
                    <span>{t('Undo')}</span>
                </button>
                : null}
            <button type="button" className="dock-btn" data-fly-target="true" aria-expanded={drawer === 'right'} aria-controls="draft-right-panel"
                onClick={() => onChange(drawer === 'right' ? null : 'right')}>
                <ListIcon />
                <span>{t('Card lists')}</span>
                {total > 0 ? <span className="dock-badge" key={total}>{total}</span> : null}
            </button>
        </div>
    )
}

function CloseButton(props) {
    const { open, onClose } = props

    const t = useT()

    const ref = useRef(null)

    // opening a drawer moves focus into it
    useEffect(() => {
        if (open && ref.current) ref.current.focus()
    }, [open])

    return (
        <button type="button" className="drawer-close" ref={ref} onClick={onClose} aria-label={t('Close panel')}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l12 12M16 4 4 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
    )
}

// Left column of every post-setup screen: the investigator and the cost curve of the resulting deck.
// inSheet: it is a tab of the phone's sheet (no close button of its own), shown unless hidden.
export function DeckLeftColumn(props) {
    const { open, onClose, inSheet, hidden } = props

    const deckList = useSelector(state => state.draft.deckList)
    const cardList = useSelector(state => state.draft.cardList)
    const removedList = useSelector(state => state.draft.removedList)

    return (
        <div className={'draft-left' + (open ? ' is-open' : '') + (inSheet ? ' in-sheet' : '')} id="draft-left-panel" hidden={hidden} role={inSheet ? 'tabpanel' : undefined}>
            {inSheet ? null : <CloseButton open={open} onClose={onClose} />}
            <InvestigatorDraftPanel />
            <CostCurve deckList={deckList} draftedList={cardList} removedList={removedList} />
        </div>
    )
}

// Right column: the lists kept apart, with what is being drafted now on top of the existing deck (when one was loaded
// from ArkhamDB), and the removed cards last. With split (the finished draft) the Draft List (and the removed cards) and the Deck List
// are columns of their own.
export function DeckRightColumn(props) {
    const { alwaysShowDraftList, open, onClose, inSheet, hidden, split } = props

    const deckList = useSelector(state => state.draft.deckList)
    const cardList = useSelector(state => state.draft.cardList)
    const removedList = useSelector(state => state.draft.removedList)

    if (split) {
        return (
            <>
                <div className="draft-aside" id="draft-right-panel">
                    {alwaysShowDraftList || cardList.length > 0 ? <CardListPanel list={cardList} /> : null}
                    {removedList.length > 0 ? <CardListPanel list={removedList} removed={true} /> : null}
                </div>
                {deckList.length > 0 ?
                    <div className="draft-aside">
                        <CardListPanel list={deckList} deck={true} />
                    </div>
                    : null}
            </>
        )
    }

    return (
        <div className={'draft-aside' + (open ? ' is-open' : '') + (inSheet ? ' in-sheet' : '')} id="draft-right-panel" hidden={hidden} role={inSheet ? 'tabpanel' : undefined}>
            {inSheet ? null : <CloseButton open={open} onClose={onClose} />}
            {alwaysShowDraftList || cardList.length > 0 ? <CardListPanel list={cardList} /> : null}
            {deckList.length > 0 ? <CardListPanel list={deckList} deck={true} /> : null}
            {removedList.length > 0 ? <CardListPanel list={removedList} removed={true} /> : null}
        </div>
    )
}

// The phone's one sheet for both columns, from the bottom of the screen (from the right edge on a landscape phone), with a tab for each.
// It closes with the X, a tap on the dimmed screen or a swipe down (right) from its top or, when the lists are scrolled to the top, from anywhere on it.
export function DeckSheet(props) {
    const { drawer, onChange, alwaysShowDraftList } = props

    const t = useT()

    // the tab shown; it stays while the sheet slides away
    const [tab, setTab] = useState('left')

    const sheetRef = useRef(null)
    const bodyRef = useRef(null)
    const tabRef = useRef({})
    const drag = useRef(null)

    useScrollLock(Boolean(drawer))

    useEffect(() => {
        if (drawer) setTab(drawer)
    }, [drawer])

    // opening the sheet moves focus to its tab; another tab starts at the top
    useEffect(() => {
        if (drawer && tabRef.current[drawer]) tabRef.current[drawer].focus({ preventScroll: true })
        if (bodyRef.current) bodyRef.current.scrollTop = 0
    }, [drawer])

    // a swipe that was let go closes the sheet from where it is: its inline position is dropped once it is closed
    useEffect(() => {
        if (!drawer && sheetRef.current) sheetRef.current.style.transform = ''
    }, [drawer])

    function sideways() {
        return window.matchMedia(SIDE_SHEET_QUERY).matches
    }

    function beginDrag(x, y) {
        const isSideways = sideways()

        drag.current = { start: isSideways ? x : y, distance: 0, sideways: isSideways }
        sheetRef.current.style.transition = 'none'
    }

    function moveDrag(x, y) {
        const current = drag.current

        if (!current) return

        current.distance = Math.max(0, (current.sideways ? x : y) - current.start)
        sheetRef.current.style.transform = (current.sideways ? 'translateX(' : 'translateY(') + current.distance + 'px)'
    }

    function onDragStart(event) {
        if (!drawer || event.target.closest('button')) return

        beginDrag(event.clientX, event.clientY)
        event.currentTarget.setPointerCapture(event.pointerId)
    }

    function onDragMove(event) {
        moveDrag(event.clientX, event.clientY)
    }

    function onDragEnd() {
        const current = drag.current

        if (!current) return

        drag.current = null

        const sheet = sheetRef.current

        sheet.style.transition = ''

        if (current.distance > 80) {
            sheet.style.transform = current.sideways ? 'translateX(105%)' : 'translateY(105%)'
            onChange(null)
        }
        else {
            sheet.style.transform = ''
        }
    }

    // A pull anywhere on the sheet closes it, not only on its top: down in a portrait phone when the lists are scrolled to the top
    // (otherwise the swipe scrolls them), to the right on a landscape one. The listeners are native because a touchmove has to be
    // non-passive to hold back the scrolling once the pull has started.
    useEffect(() => {
        const sheet = sheetRef.current

        if (!sheet || !drawer) return undefined

        let gesture = null

        function onTouchStart(event) {
            gesture = null

            if (event.touches.length !== 1 || event.target.closest('.sheet-head')) return

            const touch = event.touches[0]

            gesture = { x: touch.clientX, y: touch.clientY, mode: null }
        }

        function onTouchMove(event) {
            if (!gesture) return

            const touch = event.touches[0]
            const dx = touch.clientX - gesture.x
            const dy = touch.clientY - gesture.y

            if (gesture.mode === null) {
                if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return

                const pull = sideways() ? dx > 0 && Math.abs(dx) > Math.abs(dy) : dy > 0 && Math.abs(dy) > Math.abs(dx) && bodyRef.current.scrollTop <= 0

                gesture.mode = pull ? 'pull' : 'scroll'

                if (pull) beginDrag(touch.clientX, touch.clientY)
            }

            if (gesture.mode === 'pull') {
                event.preventDefault()
                moveDrag(touch.clientX, touch.clientY)
            }
        }

        function onTouchEnd() {
            if (gesture && gesture.mode === 'pull') onDragEnd()

            gesture = null
        }

        sheet.addEventListener('touchstart', onTouchStart, { passive: true })
        sheet.addEventListener('touchmove', onTouchMove, { passive: false })
        sheet.addEventListener('touchend', onTouchEnd)
        sheet.addEventListener('touchcancel', onTouchEnd)

        return () => {
            sheet.removeEventListener('touchstart', onTouchStart)
            sheet.removeEventListener('touchmove', onTouchMove)
            sheet.removeEventListener('touchend', onTouchEnd)
            sheet.removeEventListener('touchcancel', onTouchEnd)
        }
    // beginDrag, moveDrag and onDragEnd only read refs and the onChange prop, so they are always current
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drawer, onChange])

    return (
        <>
            {drawer ? <div className="sheet-scrim" onClick={() => onChange(null)}></div> : null}
            <section className={'deck-sheet' + (drawer ? ' is-open' : '')} ref={sheetRef}>
                <div className="sheet-head" onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}>
                    <div className="sheet-grab" aria-hidden="true"></div>
                    <div className="sheet-tabs" role="tablist">
                        <button type="button" role="tab" id="sheet-tab-left" ref={element => { tabRef.current.left = element }} aria-selected={tab === 'left'} aria-controls="draft-left-panel"
                            onClick={() => onChange('left')}>{t('Investigator & costs')}</button>
                        <button type="button" role="tab" id="sheet-tab-right" ref={element => { tabRef.current.right = element }} aria-selected={tab === 'right'} aria-controls="draft-right-panel"
                            onClick={() => onChange('right')}>{t('Card lists')}</button>
                        <button type="button" className="sheet-close" onClick={() => onChange(null)} aria-label={t('Close panel')}>
                            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l12 12M16 4 4 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        </button>
                    </div>
                </div>
                <div className="sheet-body" ref={bodyRef}>
                    <DeckLeftColumn inSheet={true} hidden={tab !== 'left'} />
                    <DeckRightColumn inSheet={true} hidden={tab !== 'right'} alwaysShowDraftList={alwaysShowDraftList} />
                </div>
            </section>
        </>
    )
}
