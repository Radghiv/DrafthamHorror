import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

import InvestigatorDraftPanel from './InvestigatorDraftPanel'
import CostCurve from './CostCurve'
import CardListPanel from './CardListPanel'
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

// Left column of every post-setup screen: the investigator and the cost curve of the resulting deck
export function DeckLeftColumn(props) {
    const { open, onClose } = props

    const deckList = useSelector(state => state.draft.deckList)
    const cardList = useSelector(state => state.draft.cardList)
    const removedList = useSelector(state => state.draft.removedList)

    return (
        <div className={'draft-left' + (open ? ' is-open' : '')} id="draft-left-panel">
            <CloseButton open={open} onClose={onClose} />
            <InvestigatorDraftPanel />
            <CostCurve deckList={deckList} draftedList={cardList} removedList={removedList} />
        </div>
    )
}

// Right column: the lists kept apart, with what is being drafted now on top of the existing deck (when one was loaded
// from ArkhamDB), and the removed cards last
export function DeckRightColumn(props) {
    const { alwaysShowDraftList, open, onClose } = props

    const deckList = useSelector(state => state.draft.deckList)
    const cardList = useSelector(state => state.draft.cardList)
    const removedList = useSelector(state => state.draft.removedList)

    return (
        <div className={'draft-aside' + (open ? ' is-open' : '')} id="draft-right-panel">
            <CloseButton open={open} onClose={onClose} />
            {alwaysShowDraftList || cardList.length > 0 ? <CardListPanel list={cardList} /> : null}
            {deckList.length > 0 ? <CardListPanel list={deckList} deck={true} /> : null}
            {removedList.length > 0 ? <CardListPanel list={removedList} removed={true} /> : null}
        </div>
    )
}
