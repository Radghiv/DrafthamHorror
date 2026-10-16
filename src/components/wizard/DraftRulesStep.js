import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeSetting } from '../../features/settings/settingsSlice'
import { enabledDraftModes, isDraftTypeEnabled } from '../../data/DraftModes'
import DraftPhases from '../../data/DraftPhases'
import { SEALED_MAX_EXTRA } from '../../draft/Sealed'
import useSealedPoolSize, { sealedPoolLabel } from '../useSealedPoolSize'
import { useT, msg } from '../../i18n'

import BuildTab from '../BuildTab'
import UpgradeTab from '../UpgradeTab'
import DeckOptionsPanel from '../DeckOptionsPanel'
import ModeStep from './ModeStep'
import SegmentedRange from '../SegmentedRange'

const WEIGHTING_OPTIONS = [
    { value: 'low', label: msg('Prefer low XP') },
    { value: 'medium', label: msg('Default') },
    { value: 'high', label: msg('Prefer high XP') }
]
const MYRIAD_OPTIONS = [1, 2, 3]
const METHOD_OPTIONS = [
    { value: 'draft', label: msg('Draft') },
    { value: 'sealed', label: msg('Sealed') }
]

export function Switch(props) {
    const { checked, onChange, label } = props

    return (
        <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)}>
            <span className="switch-track"><span className="switch-thumb"></span></span>
        </button>
    )
}

function DraftRulesStep() {
    const t = useT()
    const settings = useSelector(state => state.settings)

    const dispatch = useDispatch()

    const [xpText, changeXpText] = useState(String(settings.draftXP))

    function handleXPChange(event) {
        const value = parseInt(event.target.value, 10)

        changeXpText(event.target.value)
        if (!isNaN(value) && value >= 1) dispatch(changeSetting('DraftXP', value))
    }

    const isUpgradeTab = settings.draftTab === 'Upgrade'
    const phase = isUpgradeTab ? DraftPhases.UpgradePhase : DraftPhases.BuildPhase1
    const modes = enabledDraftModes(isUpgradeTab)
    const draftType = settings.draftType
    const deckValidation = useSelector(state => state.data.deckValidation)
    const deckInSetup = isUpgradeTab && deckValidation.status === 'valid' && deckValidation.id === settings.deckID.trim()

    // how many cards the sealed pool comes to, to show next to the percentage
    const poolSize = useSealedPoolSize(phase, settings.deckbuilding === 'sealed' && settings.draftType === 'draft')

    // a draft type that is no longer offered falls back to the first one that is
    useEffect(() => {
        if (!isDraftTypeEnabled(draftType) && modes.length > 0) {
            dispatch(changeSetting('DraftType', modes[0].key))
        }
    }, [draftType, modes, dispatch])

    const modePicker = modes.length > 1 ?
        <div className="field">
            <span className="field-label" id="draft-type-label">{t('Type')}</span>
            <div className="segmented" role="group" aria-labelledby="draft-type-label">
                {modes.map(mode => (
                    <button type="button" key={mode.key} aria-pressed={draftType === mode.key}
                        onClick={() => dispatch(changeSetting('DraftType', mode.key))}>{t(mode.label)}</button>
                ))}
            </div>
        </div>
        : null

    // the other draft types keep their original settings panels
    if (draftType !== 'draft') {
        return (
            <div className="stack">
                <ModeStep />
                {modePicker}
                {isUpgradeTab ? <UpgradeTab /> : <BuildTab phase={DraftPhases.BuildPhase1} />}
            </div>
        )
    }

    // how the cards come: drafted a few at a time, or from a sealed pool (a new deck and the upgrades)
    const methodPicker =
        <div className="field">
            <span className="field-label" id="deckbuilding-label">{t('Method')}</span>
            <div className="segmented" role="group" aria-labelledby="deckbuilding-label">
                {METHOD_OPTIONS.map(option => (
                    <button type="button" key={option.value} aria-pressed={settings.deckbuilding === option.value}
                        onClick={() => dispatch(changeSetting('Deckbuilding', option.value))}>{t(option.label)}</button>
                ))}
            </div>
        </div>

    const confirmRow =
        <div className="setting-row">
            <span className="setting-label"><strong>{t('Confirm each pick')}</strong><span>{t('Select a card first, then click it again (or press Enter) to draft it')}</span></span>
            <div className="setting-control">
                <Switch checked={settings.confirmDraft} label={t('Confirm each pick')}
                    onChange={value => dispatch(changeSetting('ConfirmDraft', value))} />
            </div>
        </div>

    // what the upgrade is about: which levels show up more often, and the experience to spend
    const weightingRow =
        <div className="setting-row">
            <span className="setting-label" id="weighting-label"><strong>{t('Weighting')}</strong><span>{t('Which card levels show up more often')}</span></span>
            <div className="setting-control">
                <div className="segmented" role="group" aria-labelledby="weighting-label">
                    {WEIGHTING_OPTIONS.map(option => (
                        <button type="button" key={option.value} aria-pressed={settings.draftWeighting === option.value}
                            onClick={() => dispatch(changeSetting('DraftWeighting', option.value))}>{t(option.label)}</button>
                    ))}
                </div>
            </div>
        </div>

    const experienceRow =
        <div className="setting-row">
            <label className="setting-label" htmlFor="draft-xp"><strong>{t('Experience to spend')}</strong></label>
            <div className="setting-control field">
                <input id="draft-xp" type="number" min="1" value={xpText} onChange={handleXPChange} />
            </div>
        </div>

    // the copies a myriad card brings when it is picked, in the draft and in the sealed pool
    const myriadRow =
        <div className="setting-row">
            <span className="setting-label" id="myriad-label"><strong>{t('Drafting myriad adds')}</strong><span>{t('Copies added when a myriad card is drafted')}</span></span>
            <div className="setting-control">
                <div className="segmented" role="group" aria-labelledby="myriad-label">
                    {MYRIAD_OPTIONS.map(count => (
                        <button type="button" key={count} aria-pressed={settings.myriadCount === count}
                            onClick={() => dispatch(changeSetting('MyriadCount', count))}>{count === 1 ? t('1 card') : count}</button>
                    ))}
                </div>
            </div>
        </div>

    // for a new deck, drafted or sealed: the cards of the classes the investigator can only add a few of come in proportion
    const proportionRow =
        <div className="setting-row">
            <span className="setting-label"><strong>{t('Proportional limits')}</strong><span>{t('An investigator who can add only a few cards of other classes or traits gets them in proportion: 5 cards in a deck of 30 means 5 in 30 of the cards dealt.')}</span></span>
            <div className="setting-control">
                <Switch checked={settings.proportionalLimits} label={t('Proportional limits')}
                    onChange={value => dispatch(changeSetting('ProportionalLimits', value))} />
            </div>
        </div>

    if (settings.deckbuilding === 'sealed') {
        return (
            <div className="stack">
                <ModeStep />

                {modePicker}

                {methodPicker}

                <p className="notice">{isUpgradeTab ?
                    t('A pool of random level 1+ cards is dealt face up, all at once. Click a card to add it to the deck: it leaves the pool, unless the deck can take another copy of it, and so does a card that costs more than the experience left.') :
                    t('A pool of random cards is dealt face up, all at once. Click a card to add it to the deck: it leaves the pool, unless the deck can take another copy of it.')}</p>

                <div className="setting-row">
                    <label className="setting-label" htmlFor="sealed-extra"><strong>{t('Extra cards in the pool')}</strong><span>{t('Cards dealt on top of the ones you have to pick: +100% is twice as many as the deck needs.')}</span></label>
                    <div className="setting-control">
                        <SegmentedRange id="sealed-extra" className="range" min="0" max={SEALED_MAX_EXTRA} step="10" value={settings.sealedExtra}
                            onChange={event => dispatch(changeSetting('SealedExtra', event.target.value))} />
                        <span className="value-badge">{'+' + settings.sealedExtra + '%'}</span>
                        {poolSize ? <span className="sealed-pool-preview">{sealedPoolLabel(t, poolSize, phase)}</span> : null}
                    </div>
                </div>

                <div className="setting-row">
                    <span className="setting-label"><strong>{t('Duplicates in the pool')}</strong><span>{t('The same card can be dealt more than once, each as a card of its own. The deck can take two copies of a card.')}</span></span>
                    <div className="setting-control">
                        <Switch checked={settings.sealedDuplicates} label={t('Duplicates in the pool')}
                            onChange={value => dispatch(changeSetting('SealedDuplicates', value))} />
                    </div>
                </div>

                {settings.sealedDuplicates ? null :
                    <div className="setting-row">
                        <span className="setting-label"><strong>{t('Allow two copies')}</strong><span>{t('A card stays in the pool after it is picked, until the deck has two copies of it')}</span></span>
                        <div className="setting-control">
                            <Switch checked={settings.sealedCopies} label={t('Allow two copies')}
                                onChange={value => dispatch(changeSetting('SealedCopies', value))} />
                        </div>
                    </div>}

                {isUpgradeTab ? <>{weightingRow}{experienceRow}</> : <>{myriadRow}{proportionRow}</>}

                {confirmRow}

                {deckInSetup ? <DeckOptionsPanel /> : null}

                {isUpgradeTab ?
                    <p className="notice">{t('Customizable cards are not implemented yet and will not appear in the upgrade draft.')}</p>
                    : null}
            </div>
        )
    }

    const draftCount = settings.draftCount[phase - 1]

    const description = isUpgradeTab ?
        t('Select cards one by one from a random display of level 1+ cards available to the chosen investigator. Each card will be selected from a number of cards determined by "Cards to select from".') :
        t('Select cards one by one from a random display of cards available to the chosen investigator. Each card will be selected from a number of cards determined by "Cards to select from".')

    return (
        <div className="stack">
            <ModeStep />

            {modePicker}

            {methodPicker}

            <p className="notice">{description}</p>

            <div className="setting-row">
                <label className="setting-label" htmlFor="draft-count"><strong>{t('Cards to select from')}</strong></label>
                <div className="setting-control">
                    <SegmentedRange id="draft-count" className="range" min="2" max="20" step="1" value={draftCount}
                        onChange={event => dispatch(changeSetting('DraftCount', { phase: phase, value: event.target.value }))} />
                    <span className="value-badge">{draftCount}</span>
                </div>
            </div>

            {isUpgradeTab ?
                <>
                    {weightingRow}
                    {experienceRow}
                </>
                :
                myriadRow
            }

            {isUpgradeTab ? null : proportionRow}

            {confirmRow}

            {deckInSetup ? <DeckOptionsPanel /> : null}

            {isUpgradeTab ?
                <p className="notice">{t('Customizable cards are not implemented yet and will not appear in the upgrade draft.')}</p>
                : null}
        </div>
    )
}

export default DraftRulesStep
