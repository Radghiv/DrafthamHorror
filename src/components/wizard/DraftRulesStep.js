import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeSetting } from '../../features/settings/settingsSlice'
import { enabledDraftModes, isDraftTypeEnabled } from '../../data/DraftModes'
import DraftPhases from '../../data/DraftPhases'
import { useT, msg } from '../../i18n'

import BuildTab from '../BuildTab'
import UpgradeTab from '../UpgradeTab'
import DeckOptionsPanel from '../DeckOptionsPanel'
import ModeStep from './ModeStep'

const WEIGHTING_OPTIONS = [
    { value: 'low', label: msg('Prefer low XP') },
    { value: 'medium', label: msg('Default') },
    { value: 'high', label: msg('Prefer high XP') }
]
const MYRIAD_OPTIONS = [1, 2, 3]

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

    const draftCount = settings.draftCount[phase - 1]

    const description = isUpgradeTab ?
        t('Select cards one by one from a random display of level 1+ cards available to the chosen investigator. Each card will be selected from a number of cards determined by "Cards to select from".') :
        t('Select cards one by one from a random display of cards available to the chosen investigator. Each card will be selected from a number of cards determined by "Cards to select from".')

    return (
        <div className="stack">
            <ModeStep />

            {modePicker}

            <p className="notice">{description}</p>

            <div className="setting-row">
                <label className="setting-label" htmlFor="draft-count"><strong>{t('Cards to select from')}</strong></label>
                <div className="setting-control">
                    <input id="draft-count" className="range" type="range" min="2" max="20" step="1" value={draftCount}
                        onChange={event => dispatch(changeSetting('DraftCount', { phase: phase, value: event.target.value }))} />
                    <span className="value-badge">{draftCount}</span>
                </div>
            </div>

            {isUpgradeTab ?
                <>
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
                    <div className="setting-row">
                        <label className="setting-label" htmlFor="draft-xp"><strong>{t('Experience to spend')}</strong></label>
                        <div className="setting-control field">
                            <input id="draft-xp" type="number" min="1" value={xpText} onChange={handleXPChange} />
                        </div>
                    </div>
                </>
                :
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
            }

            <div className="setting-row">
                <span className="setting-label"><strong>{t('Confirm each pick')}</strong><span>{t('Select a card first, then click it again (or press Enter) to draft it')}</span></span>
                <div className="setting-control">
                    <Switch checked={settings.confirmDraft} label={t('Confirm each pick')}
                        onChange={value => dispatch(changeSetting('ConfirmDraft', value))} />
                </div>
            </div>

            {deckInSetup ? <DeckOptionsPanel /> : null}

            {isUpgradeTab ?
                <p className="notice">{t('Customizable cards are not implemented yet and will not appear in the upgrade draft.')}</p>
                : null}
        </div>
    )
}

export default DraftRulesStep
