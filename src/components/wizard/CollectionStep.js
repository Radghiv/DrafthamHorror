import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeCollection } from '../../features/collection/collectionSlice'
import { clearCache } from '../../cache'
import { useT, useFormatDate, LONG_DATE } from '../../i18n'
import useCardName from '../useCardName'

import CollectionGroups, { CORE_CODES } from '../../data/CollectionGroups'
import { buildCollectionGroups } from '../../data/PackCatalog'
import { CheckIcon } from './Icons'
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

    const allCodes = groups.flatMap(group => group.codes)

    function handleToggle(group, code) {
        const isOn = !!collection[code]

        // the second core set needs the first one, so they switch together
        if (code === 'core' && isOn) dispatch(changeCollection('Off', group.codes))
        else if (code === 'core2' && !isOn) dispatch(changeCollection('On', group.codes))
        else dispatch(changeCollection(isOn ? 'Off' : 'On', [code]))
    }

    const cycles = groups.map(group => {
        const selected = group.codes.filter(code => collection[code]).length
        const allSelected = selected === group.codes.length

        // one switch for the whole cycle: on when every pack is selected, "mixed" when only some are
        const switchState = allSelected ? 'true' : selected > 0 ? 'mixed' : 'false'

        return (
            <section className="cycle" key={group.title} aria-label={group.title}>
                <div className="cycle-head">
                    <h3 className="cycle-title">{group.title}</h3>
                    <div className="cycle-actions">
                        <span className="cycle-count">{selected}/{group.codes.length}</span>
                        <button type="button" role="switch" className="switch" aria-checked={switchState}
                            title={allSelected ? t('Deselect all in {title}', { title: group.title }) : t('Select all in {title}', { title: group.title })} aria-label={t('All packs in {title}', { title: group.title })}
                            onClick={() => dispatch(changeCollection(allSelected ? 'Off' : 'On', group.codes))}>
                            <span className="switch-track"><span className="switch-thumb"></span></span>
                        </button>
                    </div>
                </div>
                <div className="chips">
                    {group.codes.map(code => {
                        const isOn = !!collection[code]

                        return (
                            <button type="button" className="chip" key={code} aria-pressed={isOn} onClick={() => handleToggle(group, code)}>
                                <span className="chip-check" style={{visibility: isOn ? 'visible' : 'hidden'}}><CheckIcon size={14} /></span>
                                <span className="chip-label" data-text={packName(code)}>{packName(code)}</span>
                            </button>
                        )
                    })}
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
            <div className="field-grid">
                <TabooField />
            </div>
            <BanList />
            <div className="collection-toolbar">
                <p className="notice" style={{margin: 0, background: 'transparent', padding: 0, color: 'var(--text)', fontWeight: 700}}>
                    {t('{cores}, {packs} selected', { cores: t('{count} core set|{count} core sets', { count: coreCount }), packs: t('{count} pack|{count} packs', { count: packCount }) })}
                </p>
                <div style={{display: 'flex', gap: '8px'}}>
                    <button type="button" className="btn btn-secondary" onClick={() => dispatch(changeCollection('On', allCodes))}>{t('Select all')}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => dispatch(changeCollection('Off', allCodes))}>{t('Select none')}</button>
                </div>
            </div>
            <div className="cycle-grid">
                {cycles}
            </div>
            <p className="field-hint data-refresh">
                {dataDate ? t('Card data from ArkhamDB, fetched on {date}.', { date: formatDate(dataDate, LONG_DATE) }) : t('Card data from ArkhamDB.')}{' '}
                {t('It is kept in this browser until you refresh it.')}{' '}
                <button type="button" className="link-btn" onClick={refreshData}>{t('Refresh card data')}</button>
            </p>
        </div>
    )
}

export default CollectionStep
