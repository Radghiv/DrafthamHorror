import React, { useState } from 'react'
import { useSelector, useDispatch, useStore } from 'react-redux'

import { setSetupStep, changeSeed } from '../../features/settings/settingsSlice'
import { newSeed } from '../../random'
import { buildShareLink, canShare } from '../../share'
import describeSetup from './describeSetup'
import StartStatus from './StartStatus'
import { CheckIcon } from './Icons'
import { useT } from '../../i18n'

function ReviewStep() {
    const t = useT()
    const settings = useSelector(state => state.settings)
    const tabooData = useSelector(state => state.data.tabooData)
    const collection = useSelector(state => state.collection)

    const dispatch = useDispatch()
    const store = useStore()
    const [linkCopied, setLinkCopied] = useState(false)

    // the link of this setup and seed, for somebody else to start the same draft
    function copyLink() {
        const link = buildShareLink(store.getState())

        if (!link) return

        const done = () => {
            setLinkCopied(true)
            setTimeout(() => setLinkCopied(false), 2500)
        }

        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, () => window.prompt(t('Copy this link'), link))
        else window.prompt(t('Copy this link'), link)
    }

    const info = describeSetup(settings, tabooData, collection)

    const rows = [
        { label: t('Collection'), edit: t('Edit collection'), value: info.packSummary, step: 'collection' },
        { label: t('Mode'), edit: t('Edit mode'), value: info.isUpgradeTab ? t('Upgrade') : t('Build Deck'), step: 'rules' },
        { label: t('Investigator'), edit: t('Edit investigator'), value: info.classLine ? t('{name} ({details})', { name: info.investigatorName, details: info.classLine }) : info.investigatorName, step: 'investigator' },
        { label: t('Taboo list'), edit: t('Edit taboo list'), value: info.tabooLabel, step: 'collection' },
        ...(settings.bannedCards.length > 0 ? [{ label: t('Ban list'), edit: t('Edit ban list'), value: t('{count} card left out|{count} cards left out', { count: settings.bannedCards.length }), step: 'collection' }] : []),
        ...(info.investigatorMode === 'arkhamdb' ? [{ label: t('ArkhamDB deck'), edit: t('Edit ArkhamDB deck'), value: t('Deck {id}', { id: settings.deckID.trim() }), step: 'investigator' }] : []),
        info.isUpgradeTab ?
            { label: t('Experience'), edit: t('Edit experience'), value: info.deckSizeLabel, step: 'rules' } :
            { label: t('Deck size'), edit: t('Edit deck size'), value: info.deckSizeLabel, step: 'investigator' },
        { label: t('Draft rules'), edit: t('Edit draft rules'), value: t('{rules}, {confirm}', { rules: info.draftRules, confirm: info.confirmPhrase }), step: 'rules' }
    ]

    return (
        <div className="stack">
            <dl className="review-list">
                {rows.map(row => (
                    <div className="review-row" key={row.label}>
                        <div>
                            <dt>{row.label}</dt>
                            <dd>{row.value}</dd>
                        </div>
                        <button type="button" className="link-btn" onClick={() => dispatch(setSetupStep(row.step))}
                            aria-label={row.edit}>{t('Edit')}</button>
                    </div>
                ))}
            </dl>

            <div className="field seed-field">
                <label htmlFor="draft-seed">{t('Seed')}</label>
                <div className="seed-row">
                    <input id="draft-seed" type="text" value={settings.seed} maxLength={24} autoComplete="off" spellCheck={false}
                        onChange={event => dispatch(changeSeed(event.target.value))} />
                    <button type="button" className="btn btn-secondary" onClick={() => dispatch(changeSeed(newSeed()))}>{t('New seed')}</button>
                    {canShare(store.getState()) ?
                        <button type="button" className="btn btn-secondary" onClick={copyLink}>{linkCopied ? <><span className="pop-check"><CheckIcon size={16} /></span> {t('Link copied')}</> : t('Copy link')}</button>
                        : null}
                </div>
                <p className="field-hint">{t('The same seed with the same setup deals the same cards. The link carries this setup (collection, rules, taboo list) and the seed.')}</p>
            </div>

            <StartStatus extra={true} />
        </div>
    )
}

export default ReviewStep
