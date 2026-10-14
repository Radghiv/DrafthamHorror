import React, { useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { pickInvestigator, startInvestigatorDraft, redrawInvestigator, eligibleInvestigators } from '../features/settings/investigatorActions'
import { findInvestigatorCard } from '../data/InvestigatorList'
import useInvestigatorEntries from './useInvestigatorEntries'
import { OfficialColorForClass } from '../data/ClassColors'
import useCardOverlay from './OverlayImage'
import CardImage from './CardImage'
import RequiredThumbs from './RequiredThumbs'
import { RedrawIcon, ZoomIcon } from './wizard/Icons'
import usePhoneLayout from './usePhoneLayout'
import CardLinkButton from './CardLinkButton'
import { useT } from '../i18n'

// One side of an investigator card. ArkhamDB images of some investigators are portrait, so those are turned (front clockwise,
// back counterclockwise, like in the draft sidebar) to fill the same landscape frame. Hovering shows the big preview.
function InvestigatorImage(props) {
    const { card, side, alt } = props

    const t = useT()

    const [rotated, setRotated] = useState(false)

    const doCardOverlay = useCardOverlay()

    return (
        <span className={'investigator-image-frame' + (rotated ? ' rotated-' + side : '')}
            onPointerEnter={event => doCardOverlay(card, event, side)} onPointerLeave={() => doCardOverlay(null)}>
            <CardImage card={card} side={side} alt={alt} onLoad={event => setRotated(event.target.naturalHeight > event.target.naturalWidth)}
                fallback={<span className="investigator-image-missing">{t('Image not available')}</span>} />
        </span>
    )
}

// The investigator draft: a few random investigators, one to pick. Like the card draft, a click selects and a second
// click on the same investigator picks it. Each one can be redrawn on its own.
function InvestigatorPick() {
    const t = useT()
    const pool = useSelector(state => state.settings.investigatorPool)
    const options = useSelector(state => state.settings.investigatorDraftOptions)
    const cardData = useSelector(state => state.data.cardData)
    const scrollToTop = useSelector(state => state.settings.scrollToTop)
    const allEntries = useInvestigatorEntries()

    const dispatch = useDispatch()

    const phone = usePhoneLayout()
    const doCardOverlay = useCardOverlay()

    const [selected, setSelected] = useState(null)

    const entries = pool.map(entry => ({ entry: entry, card: findInvestigatorCard(entry, cardData) }))

    // a redrawn investigator can't be the selected one any more
    const current = pool.includes(selected) ? selected : null

    // there is something to redraw into when an eligible investigator is not on the table yet
    const canRedraw = useMemo(() => {
        const names = new Set(pool.map(entry => entry.replace(/\s\(.*\)$/, '')))

        return eligibleInvestigators(allEntries, cardData, options).some(entry => !names.has(entry.replace(/\s\(.*\)$/, '')))
    }, [pool, cardData, options, allEntries])

    // the deck draft starts from the top of the page, where its first cards are
    function pick(entry) {
        dispatch(pickInvestigator(entry))
        if (scrollToTop) window.scrollTo(0, 0)
    }

    function handleClick(entry) {
        if (current === entry) pick(entry)
        else setSelected(entry)
    }

    // the whole box of an investigator works like its pictures; the buttons and thumbnails in it keep doing their own thing
    function handleBoxClick(event, entry) {
        if (event.target.closest('button, a, .required-thumb')) return

        handleClick(entry)
    }

    function handleReroll() {
        setSelected(null)
        dispatch(startInvestigatorDraft)
    }

    return (
        <>
            {phone ?
                <div className="phone-pick-top">
                    <span aria-live="polite">{current ? '' : t('Select an investigator')}</span>
                    <button type="button" className="btn btn-secondary" onClick={handleReroll}><RedrawIcon /> {t('Redraw all')}</button>
                </div>
                : null}
            <div className="investigator-pick-grid">
                {entries.map(({ entry, card }, index) => {
                    const isSelected = current === entry
                    const classColor = card ? OfficialColorForClass(card.faction_code) : undefined

                    return (
                        <div key={entry} className={'investigator-tile' + (isSelected ? ' selected' : '')} style={{borderTopColor: classColor}} onClick={event => handleBoxClick(event, entry)}>
                            <button type="button" className="investigator-tile-main" aria-pressed={isSelected} onClick={() => handleClick(entry)}>
                                <InvestigatorImage card={card} side="front" alt={t('{name} (front)', { name: entry })} />
                                <InvestigatorImage card={card} side="back" alt={t('{name} (back)', { name: entry })} />
                                {phone ? null : <RequiredThumbs investigator={card} />}
                                <span className="investigator-tile-name">{entry}</span>
                            </button>
                            {phone ? <RequiredThumbs investigator={card} tap caption /> : null}
                            {phone ?
                                <div className="draft-tile-actions">
                                    <button type="button" className="tile-action" disabled={!canRedraw} aria-label={t('Redraw {name}', { name: entry })} onClick={() => dispatch(redrawInvestigator(index))}><RedrawIcon /><span>{t('Redraw')}</span></button>
                                    <button type="button" className="tile-action" disabled={!card} aria-label={t('Zoom {name}', { name: t('{name} (front)', { name: entry }) })} onClick={event => doCardOverlay(card, event, 'front')}><ZoomIcon /><span>{t('Front')}</span></button>
                                    <button type="button" className="tile-action" disabled={!card} aria-label={t('Zoom {name}', { name: t('{name} (back)', { name: entry }) })} onClick={event => doCardOverlay(card, event, 'back')}><ZoomIcon /><span>{t('Back side')}</span></button>
                                </div>
                                :
                                <>
                                    <CardLinkButton card={card} />
                                    <button type="button" className="btn btn-secondary investigator-redraw" disabled={!canRedraw}
                                        aria-label={t('Redraw {name}', { name: entry })} title={t('Redraw')} onClick={() => dispatch(redrawInvestigator(index))}><RedrawIcon /></button>
                                </>}
                        </div>
                    )
                })}
            </div>

            {phone ?
                (current ?
                    <div className="phone-confirm no-dock" role="group">
                        <span className="phone-confirm-text" aria-live="polite">{t('Draft {name}?', { name: current })}</span>
                        <button type="button" className="btn btn-primary" onClick={() => pick(current)}>{t('Draft this investigator')}</button>
                    </div>
                    : null)
                :
            <div className="confirm-bar">
                <div className="bar-row">
                    <div className="confirm-bar-text" aria-live="polite">
                        {current ? t('Draft {name}?', { name: current }) : t('Select an investigator')}
                        <span className="confirm-bar-hint">{t('Click the selected investigator again to pick it. Hover the cards (or press and hold them) for a bigger preview.')}</span>
                    </div>
                    <div className="confirm-bar-actions">
                        <button type="button" className="btn btn-primary" aria-disabled={!current} onClick={() => { if (current) pick(current) }}>{t('Draft this investigator')}</button>
                        <button type="button" className="btn btn-secondary" onClick={handleReroll}><RedrawIcon /> {t('Redraw all')}</button>
                    </div>
                </div>
            </div>}
        </>
    )
}

export default InvestigatorPick
