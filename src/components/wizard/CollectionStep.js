import React, { useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeCollection } from '../../features/collection/collectionSlice'
import { clearCache } from '../../cache'
import { useT, useFormatDate, LONG_DATE } from '../../i18n'
import useCardName from '../useCardName'

import CollectionGroups, { CORE_CODES } from '../../data/CollectionGroups'
import { buildCollectionGroups } from '../../data/PackCatalog'
import { cardImageUrls } from '../../data/CardImages'
import { boxArtFor } from '../../data/BoxArt'
import { CheckIcon, RedrawIcon, FoldAllIcon, UnfoldAllIcon, WarningIcon } from './Icons'
import TabooField from './TabooField'
import BanList from './BanList'

export function countSelectedPacks(collection) {
    const coreCount = CORE_CODES.filter(code => collection[code]).length
    let total = 0

    for (const code in collection) {
        if (collection[code] === 1 || collection[code] === true) total++
    }

    return { coreCount: coreCount, packCount: total - coreCount }
}

function CollectionStep() {
    const t = useT()
    const formatDate = useFormatDate()
    const { packName } = useCardName()
    const collection = useSelector(state => state.collection)
    const packs = useSelector(state => state.data.packs)
    const cardData = useSelector(state => state.data.cardData)
    const dataDate = useSelector(state => state.data.dataDate)

    // the groups come from the pack list of ArkhamDB (so new packs appear by themselves), or the built-in layout without it
    const groups = useMemo(() => packs && cardData ? buildCollectionGroups(packs, cardData, pack => packName(pack.code), t) : CollectionGroups, [packs, cardData, packName, t])
    const dispatch = useDispatch()

    // the cycles are folded up, and the ones that were opened are kept here (only for this visit to the step)
    const [opened, setOpened] = useState({})

    const allCodes = groups.flatMap(group => group.codes)

    // a cycle is told apart by its chapter and title (a title can come up in both chapters)
    const idOf = group => (group.chapter || 1) + ':' + group.title

    // one button folds every cycle up, or unfolds them all when they are all folded
    const allFolded = groups.length > 0 && groups.every(group => !opened[idOf(group)])
    const foldAllLabel = allFolded ? t('Unfold all packs') : t('Fold all packs')

    function handleToggle(group, code) {
        const isOn = !!collection[code]

        // the second core set needs the first one, so they switch together
        if (code === 'core' && isOn) dispatch(changeCollection('Off', group.codes))
        else if (code === 'core2' && !isOn) dispatch(changeCollection('On', group.codes))
        else dispatch(changeCollection(isOn ? 'Off' : 'On', [code]))
    }

    // the chapters that have packs; they get headings of their own when there is more than one
    const chapters = Array.from(new Set(groups.map(group => group.chapter || 1))).sort((a, b) => a - b)

    const cycles = groups.map(group => {
        const selected = group.codes.filter(code => collection[code]).length
        const allSelected = selected === group.codes.length

        // one switch for the whole cycle: on when every pack is selected, "mixed" when only some are
        const switchState = allSelected ? 'true' : selected > 0 ? 'mixed' : 'false'

        // the art behind the group: the box of its product (or boxes), or else the picture of the card that stands for it
        const box = boxArtFor(group.codes)
        const boxes = box.urls
        const artUrl = boxes.length === 0 && group.art ? cardImageUrls(group.art, 'front')[0] : null

        return (
            <section className={'cycle' + (opened[idOf(group)] ? '' : ' is-collapsed')} key={idOf(group)} aria-label={group.title}>
                {boxes.length > 0 ?
                    <div className={'cycle-boxes' + (boxes.length > 1 ? ' is-many is-' + (box.row || 'long') : '')} aria-hidden="true">
                        {boxes.map(url => <img src={url} alt="" key={url} loading="lazy" decoding="async" onError={event => { event.currentTarget.style.display = 'none' }} />)}
                    </div>
                    : null}
                {artUrl ?
                    <div className={'cycle-art' + (group.art.type_code === 'investigator' ? '' : ' is-portrait')} aria-hidden="true">
                        <img src={artUrl} alt="" loading="lazy" decoding="async"
                            onLoad={event => {
                                const image = event.currentTarget

                                // an investigator's picture that was saved turned isn't the layout the crop is made for
                                if (group.art.type_code === 'investigator' && image.naturalHeight > image.naturalWidth) image.style.display = 'none'
                                else image.classList.add('loaded')
                            }}
                            onError={event => { event.currentTarget.style.display = 'none' }} />
                    </div>
                    : null}
                <div className="cycle-head">
                    <h3 className="cycle-title">
                        <button type="button" className="cycle-toggle" aria-expanded={Boolean(opened[idOf(group)])} onClick={() => setOpened({ ...opened, [idOf(group)]: !opened[idOf(group)] })}>
                            <svg className="cycle-chevron" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m3 5 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            {group.title}
                        </button>
                    </h3>
                    <div className="cycle-actions">
                        <span className="cycle-count">{selected}/{group.codes.length}</span>
                        <button type="button" role="switch" className="switch" aria-checked={switchState}
                            title={allSelected ? t('Deselect all in {title}', { title: group.title }) : t('Select all in {title}', { title: group.title })} aria-label={t('All packs in {title}', { title: group.title })}
                            onClick={() => dispatch(changeCollection(allSelected ? 'Off' : 'On', group.codes))}>
                            <span className="switch-track"><span className="switch-thumb"></span></span>
                        </button>
                    </div>
                </div>
                <div className="cycle-body">
                    <div className="cycle-body-inner">
                <div className="chips">
                    {group.codes.map(code => {
                        const isOn = !!collection[code]

                        return (
                            <button type="button" className="chip" key={code} aria-pressed={isOn} onClick={() => handleToggle(group, code)}>
                                <span className="chip-check"><CheckIcon size={14} /></span>
                                <span className="chip-label" data-text={packName(code)}>{packName(code)}</span>
                            </button>
                        )
                    })}
                </div>
                    </div>
                </div>
            </section>
        )
    })

    const { coreCount, packCount } = countSelectedPacks(collection)

    // fetches the cards, packs and taboo lists of ArkhamDB again: the saved copy is deleted and the page starts over
    async function refreshData() {
        await clearCache()
        window.location.reload()
    }

    return (
        <div className="stack">
            <div className="notice data-card">
                <p>
                    {dataDate ? t('Card data from ArkhamDB, fetched on {date}.', { date: formatDate(dataDate, LONG_DATE) }) : t('Card data from ArkhamDB.')}{' '}
                    {t('It is kept in this browser until you refresh it.')}
                </p>
                <button type="button" className="btn btn-secondary" onClick={refreshData}>
                    <RedrawIcon /> {t('Refresh card data')}
                </button>
            </div>
            <div className="field-grid">
                <TabooField />
            </div>
            <BanList />
            <div className="collection-toolbar">
                <p className="notice" style={{margin: 0, background: 'transparent', padding: 0, color: 'var(--text)', fontWeight: 700}}>
                    {t('{cores}, {packs} selected', { cores: t('{count} core set|{count} core sets', { count: coreCount }), packs: t('{count} pack|{count} packs', { count: packCount }) })}
                </p>
                <div style={{display: 'flex', gap: '8px'}}>
                    <button type="button" className="icon-btn" title={foldAllLabel} aria-label={foldAllLabel}
                        onClick={() => setOpened(allFolded ? Object.fromEntries(groups.map(group => [idOf(group), true])) : {})}>
                        {allFolded ? <UnfoldAllIcon /> : <FoldAllIcon />}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => dispatch(changeCollection('On', allCodes))}>{t('Select all')}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => dispatch(changeCollection('Off', allCodes))}>{t('Select none')}</button>
                </div>
            </div>
            {chapters.length > 1 ?
                <div className="chapters">
                    {chapters.map(chapter => (
                        <section className="chapter" key={chapter} aria-label={t('Chapter {number}', { number: chapter })}>
                            <h2 className="chapter-title">{t('Chapter {number}', { number: chapter })}</h2>
                            {chapter === 2 ? <div className="status status-warn" role="note"><WarningIcon /><span>{t("ArkhamDB can't import Chapter 2 cards from .o8d files yet (it has no OCTGN ids for them). The plain text export works.")}</span></div> : null}
                            <div className="cycle-grid">
                                {cycles.filter((cycle, index) => (groups[index].chapter || 1) === chapter)}
                            </div>
                        </section>
                    ))}
                </div>
                :
                <div className="cycle-grid">
                    {cycles}
                </div>}
        </div>
    )
}

export default CollectionStep
