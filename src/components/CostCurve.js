import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { setHighlightCost } from '../features/settings/settingsSlice'
import { isTouchScreen } from './OverlayImage'
import { useT } from '../i18n'

// the first column is for skills (they have no cost); then costs 0 to 4 and 5 or more
const LABELS = ['Skill', '0', '1', '2', '3', '4', '5+']

// Column of the curve a card belongs to (0 = skills, 1 to 6 = cost 0 to 5+), or null when it has no fixed cost (X-cost
// cards, treacheries...) and so isn't counted
export function costBin(item) {
    if (item.type_code === 'skill') return 0
    if (Number.isInteger(item.cost) && item.cost >= 0) return 1 + Math.min(item.cost, LABELS.length - 2)

    return null
}

function countByBin(list) {
    const bins = LABELS.map(() => 0)

    list.forEach(item => {
        const bin = costBin(item)

        if (bin !== null) bins[bin] += item.count || 1
    })

    return bins
}

// Resource cost distribution of the resulting deck: the existing deck (minus the cards flagged as removed) in a muted tone,
// with the cards drafted now stacked on top. Hovering (or focusing) a column highlights its cards in the lists.
function CostCurve(props) {
    const { deckList, draftedList, removedList } = props

    const t = useT()

    const dispatch = useDispatch()

    const existing = countByBin(deckList)
    const removed = countByBin(removedList)
    const base = existing.map((count, index) => Math.max(0, count - removed[index]))
    const added = countByBin(draftedList)

    const totals = base.map((count, index) => count + added[index])
    const total = totals.reduce((sum, count) => sum + count, 0)
    const max = Math.max(...totals, 1)
    const hasDeck = deckList.length > 0
    const touch = isTouchScreen()

    const highlighted = useSelector(state => state.settings.highlightCost)

    const highlight = bin => dispatch(setHighlightCost(bin))

    // a finger has no hover: tapping a column keeps its cards highlighted (in the lists, which are in another drawer on a phone)
    // until it is tapped again; the pointer events of a touch only flash it
    const onEnter = (event, bin) => { if (event.pointerType !== 'touch') highlight(bin) }
    const onLeave = event => { if (event.pointerType !== 'touch') highlight(null) }
    const onTap = bin => { if (isTouchScreen()) highlight(highlighted === bin ? null : bin) }

    return (
        <div className="settingsDiv cost-curve">
            <h3>{t('Resource cost')}</h3>
            <div className="cost-bars" role="group" aria-label={t('Resource cost curve of the resulting deck')}>
                {totals.map((count, index) => (
                    <div className="cost-col" key={LABELS[index]} tabIndex={0}
                        aria-label={t('{label}: {count} card|{label}: {count} cards', { label: index === 0 ? t('Skills') : t('Cost {cost}', { cost: LABELS[index] }), count })}
                        onPointerEnter={event => onEnter(event, index)} onPointerLeave={onLeave} onClick={() => onTap(index)}
                        onFocus={() => highlight(index)} onBlur={() => highlight(null)}>
                        <span className="cost-count">{count}</span>
                        <div className="cost-track">
                            <div className="cost-stack" style={{height: (count / max * 100) + '%'}}>
                                <div className="cost-bar cost-bar-new" style={{flexGrow: added[index]}}></div>
                                <div className="cost-bar cost-bar-old" style={{flexGrow: base[index]}}></div>
                            </div>
                        </div>
                        <span className="cost-label">{index === 0 ? t('Skill') : LABELS[index]}</span>
                    </div>
                ))}
            </div>
            {hasDeck ?
                <div className="cost-legend">
                    <span><i className="cost-swatch cost-bar-old"></i>{t('Existing deck')}</span>
                    <span><i className="cost-swatch cost-bar-new"></i>{t('Drafted')}</span>
                </div>
                : null}
            <p className="cost-note">
                {total === 0 ? (touch ? t('Cards will show up here as you draft. Tap a column to highlight its cards in the lists.') : t('Cards will show up here as you draft. Hover a column to highlight its cards in the lists.')) :
                    (touch ? t('Tap a column to highlight its cards in the lists. Cards without a fixed cost (such as X-cost ones) are not counted.') : t('Hover a column to highlight its cards in the lists. Cards without a fixed cost (such as X-cost ones) are not counted.')) + (hasDeck ? ' ' + t('Removed cards are subtracted from the existing deck.') : '')}
            </p>
        </div>
    )
}

export default CostCurve
