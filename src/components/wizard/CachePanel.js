import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { savedCopyRows, readSavedCopy, deleteSavedCopy, saveCopy } from '../../features/data/dataSlice'
import { imageCacheAvailable, collectionImageUrls, savedImageUrls, deleteSavedImages, downloadImages, subscribeToSavedImages } from '../../imageCache'
import { clearCache } from '../../cache'
import { RedrawIcon } from './Icons'
import { useT, useFormatDate, LONG_DATE } from '../../i18n'

function formatBytes(bytes, language) {
    const units = ['B', 'KB', 'MB', 'GB']
    let value = bytes
    let unit = 0

    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024
        unit++
    }

    return value.toLocaleString(language, { maximumFractionDigits: unit > 1 ? 1 : 0 }) + ' ' + units[unit]
}

// One line of the list: what it is, what is kept, and the two buttons: delete it all, and download what is missing
function CacheRow(props) {
    const { title, detail, progress, canDelete, canFill, busy, readOnly, onDelete, onFill, onCancel } = props

    const t = useT()

    return (
        <li className="cache-row">
            <div className="cache-info">
                <strong>{title}</strong>
                <span>{detail}</span>
            </div>
            {readOnly ? null : <div className="cache-actions">
                <button type="button" className="btn btn-secondary" disabled={!canDelete || busy} onClick={onDelete}>{t('Delete')}</button>
                {progress ?
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>{t('Cancel')}</button> :
                    <button type="button" className="btn btn-secondary" disabled={!canFill || busy} onClick={onFill}>{t('Download missing')}</button>}
            </div>}
            {progress ? <div className="cache-progress" role="progressbar" aria-valuemin="0" aria-valuemax={progress.total} aria-valuenow={progress.done + progress.failed}><span style={{ width: (progress.total ? (progress.done + progress.failed) / progress.total * 100 : 0) + '%' }}></span></div> : null}
        </li>
    )
}

// What the app keeps on the device (the card data and texts of ArkhamDB in IndexedDB, the pictures of the cards in the Cache Storage of the
// browser): how much there is of each, and for each a button to delete it and one to download what is missing. Opened with its title; it
// only looks at the storage while it is open.
function CachePanel() {
    const t = useT()
    const formatDate = useFormatDate()

    const language = useSelector(state => state.settings.language)
    const cardData = useSelector(state => state.data.cardData)
    const collection = useSelector(state => state.collection)
    const dataDate = useSelector(state => state.data.dataDate)

    const [open, setOpen] = useState(false)
    const [rows, setRows] = useState([])
    const [images, setImages] = useState(null)
    const [usage, setUsage] = useState(null)
    const [busy, setBusy] = useState(null)
    const [progress, setProgress] = useState(null)

    const stopRef = useRef(false)

    // the pictures and the use of the storage (the data rows take longer to read, and only change with the buttons)
    const refreshImages = useCallback(async () => {
        const wanted = collectionImageUrls(cardData, collection)
        const saved = await savedImageUrls()

        setImages({ total: wanted.length, missing: wanted.filter(url => !saved.has(url)), savedCount: wanted.filter(url => saved.has(url)).length, available: imageCacheAvailable() })

        if (window.navigator.storage && window.navigator.storage.estimate) {
            try {
                const estimate = await window.navigator.storage.estimate()

                setUsage({ used: estimate.usage || 0, quota: estimate.quota || 0 })
            }
            catch (e) {
                setUsage(null)
            }
        }
    }, [cardData, collection])

    const refresh = useCallback(async () => {
        const loaded = await Promise.all(savedCopyRows().map(async row => {
            const entries = await Promise.all(row.copies.map(copy => readSavedCopy(copy)))
            const present = entries.filter(Boolean)

            return {
                row: row,
                entries: entries,
                count: entries[0] ? row.copies[0].count(entries[0].data) : 0,
                bytes: present.reduce((sum, entry) => sum + JSON.stringify(entry.data).length, 0),
                savedAt: present.length > 0 ? Math.min(...present.map(entry => entry.savedAt)) : null,
                anySaved: present.length > 0,
                complete: present.length === entries.length
            }
        }))

        setRows(loaded)
        await refreshImages()
    }, [refreshImages])

    // while the panel is open the count follows the pictures that get saved (looked at again at most twice a second)
    useEffect(() => {
        if (!open) return undefined

        let timer = null
        const stop = subscribeToSavedImages(() => {
            if (timer === null) timer = setTimeout(() => { timer = null; refreshImages() }, 500)
        })

        return () => {
            stop()
            clearTimeout(timer)
        }
    }, [open, refreshImages])

    useEffect(() => {
        if (open) refresh()
    }, [open, refresh])

    // a download in progress stops when the page is left
    useEffect(() => () => { stopRef.current = true }, [])

    async function removeCopies(item) {
        setBusy(item.row.id)
        await Promise.all(item.row.copies.map(copy => deleteSavedCopy(copy)))
        await refresh()
        setBusy(null)
    }

    async function fillCopies(item) {
        setBusy(item.row.id)
        await Promise.all(item.row.copies.map(copy => saveCopy(copy)))
        await refresh()
        setBusy(null)
    }

    async function removeImages() {
        setBusy('images')
        await deleteSavedImages()
        await refresh()
        setBusy(null)
    }

    async function fillImages() {
        if (!images || images.missing.length === 0) return

        stopRef.current = false
        setProgress({ done: 0, failed: 0, total: images.missing.length })

        const result = await downloadImages(images.missing, setProgress, () => stopRef.current)

        setProgress(null)
        await refresh()

        return result
    }

    const number = value => value.toLocaleString(language)
    const detailOf = item => item.anySaved ?
        [number(item.count), formatBytes(item.bytes, language), t('Saved {date}', { date: formatDate(item.savedAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })].join(' · ') :
        t('Not saved')

    const dataRows = rows.filter(item => !item.row.language)
    const languageRows = rows.filter(item => item.row.language)

    // the cards, the packs and the taboo lists are only shown: "Refresh card data" renews them all at once (and starts the page over, so the
    // app uses them); the languages and the pictures can be deleted and downloaded one by one
    const renderDataRow = item => (
        <CacheRow key={item.row.id} title={item.row.language ? item.row.title : t(item.row.title)} detail={detailOf(item)} busy={busy !== null}
            readOnly={!item.row.language} canDelete={item.anySaved} canFill={!item.complete} onDelete={() => removeCopies(item)} onFill={() => fillCopies(item)} />
    )

    // fetches the cards, packs, taboo lists and names of ArkhamDB again: every saved copy is deleted and the page starts over
    async function refreshData() {
        await clearCache()
        window.location.reload()
    }

    let imageDetail = ''

    if (images) {
        imageDetail = !images.available ? t('Not saved') : progress ?
            t('Downloading… {done} of {total}', { done: number(progress.done + progress.failed), total: number(progress.total) }) + (progress.failed > 0 ? ' · ' + t('Not downloaded: {count}', { count: number(progress.failed) }) : '') :
            t('{saved} of {total} saved', { saved: number(images.savedCount), total: number(images.total) })
    }

    return (
        <section className={'cache-panel' + (open ? ' is-open' : '')}>
            <div className="cache-head">
                <button type="button" className="cycle-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
                    <svg className="cycle-chevron" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m3 5 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <strong>{t('Offline storage')}</strong>
                </button>
                <button type="button" className="btn btn-secondary" onClick={refreshData}>
                    <RedrawIcon /> {t('Refresh card data')}
                </button>
            </div>
            <p className="field-hint cache-summary">
                {dataDate ? t('Card data from ArkhamDB, fetched on {date}.', { date: formatDate(dataDate, LONG_DATE) }) : t('Card data from ArkhamDB.')}{' '}
                {t('It is kept in this browser until you refresh it.')}
            </p>
            {open ?
                <div className="cache-body">
                    <p className="field-hint">{t('What the app keeps on this device so that it starts at once and works without a connection.')}</p>

                    <ul className="cache-list">
                        {dataRows.map(renderDataRow)}
                        {images ?
                            <CacheRow title={t('Card images')} detail={imageDetail} progress={progress} busy={busy !== null && !progress}
                                canDelete={images.available} canFill={images.available && images.missing.length > 0} onDelete={removeImages} onFill={fillImages}
                                onCancel={() => { stopRef.current = true }} />
                            : null}
                    </ul>

                    <h4 className="cache-group-title">{t('Names and texts in other languages')}</h4>
                    <ul className="cache-list">
                        {languageRows.map(renderDataRow)}
                    </ul>

                    {usage && usage.quota > 0 ?
                        <p className="field-hint">{t('This site uses about {used} of the {quota} that the browser allows. The images come from other sites, so their size can\'t be measured here and the browser may count them as bigger than they are.', { used: formatBytes(usage.used, language), quota: formatBytes(usage.quota, language) })}</p>
                        : null}
                    <p className="field-hint">{t('Deleting removes the saved copy; what is already loaded stays in use until you reload the page.')}</p>
                </div>
                : null}
        </section>
    )
}

export default CachePanel
