import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { setInvestigatorDraftOption } from '../../features/settings/settingsSlice'
import useInvestigatorEntries from '../useInvestigatorEntries'
import { OfficialColorForClass } from '../../data/ClassColors'
import { Switch } from './DraftRulesStep'
import useStartDraft from './useStartDraft'
import { useT, msg } from '../../i18n'
import SegmentedRange from '../SegmentedRange'

const CLASSES = [
    { code: 'guardian', label: msg('Guardian') },
    { code: 'seeker', label: msg('Seeker') },
    { code: 'rogue', label: msg('Rogue') },
    { code: 'mystic', label: msg('Mystic') },
    { code: 'survivor', label: msg('Survivor') },
    { code: 'neutral', label: msg('Neutral') }
]

// Settings of the investigator draft: a few random investigators are shown and one is picked, before the deck draft
function InvestigatorDraftSettings() {
    const t = useT()
    const options = useSelector(state => state.settings.investigatorDraftOptions)
    const entries = useInvestigatorEntries()

    const dispatch = useDispatch()

    const { eligibleCount } = useStartDraft()

    function setOption(name, value) {
        dispatch(setInvestigatorDraftOption({ name: name, value: value }))
    }

    function toggleClass(code) {
        setOption('classes', options.classes.includes(code) ? options.classes.filter(item => item !== code) : options.classes.concat(code))
    }

    function exclude(event) {
        if (event.target.value) setOption('excluded', options.excluded.concat(event.target.value))
    }

    function include(entry) {
        setOption('excluded', options.excluded.filter(item => item !== entry))
    }

    return (
        <div className="stack">
            <p className="notice">{t('The investigator is drafted too: when the draft starts you are shown a few random investigators and pick one. The deck draft then goes on with it.')}</p>

            <div className="setting-row">
                <label className="setting-label" htmlFor="investigator-count"><strong>{t('Investigators to select from')}</strong></label>
                <div className="setting-control">
                    <SegmentedRange id="investigator-count" className="range" min="2" max="20" step="1" value={options.count}
                        onChange={event => setOption('count', parseInt(event.target.value, 10))} />
                    <span className="value-badge">{options.count}</span>
                </div>
            </div>

            <div className="field">
                <span className="field-label" id="investigator-classes-label">{t('Classes to include')}</span>
                <div className="chips" role="group" aria-labelledby="investigator-classes-label">
                    {CLASSES.map(({ code, label }) => (
                        <button type="button" className="chip" key={code} aria-pressed={options.classes.includes(code)} onClick={() => toggleClass(code)}>
                            <span className="class-dot" style={{backgroundColor: OfficialColorForClass(code)}}></span>
                            <span className="chip-label" data-text={t(label)}>{t(label)}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="setting-row">
                <span className="setting-label"><strong>{t('Include parallel investigators')}</strong><span>{t('Alternate versions of the investigators')}</span></span>
                <div className="setting-control">
                    <Switch checked={options.parallel} label={t('Include parallel investigators')} onChange={value => setOption('parallel', value)} />
                </div>
            </div>

            <div className="field">
                <label htmlFor="investigator-exclude">{t('Exclude investigators')}</label>
                <select id="investigator-exclude" value="" onChange={exclude}>
                    <option value="">{t('Choose an investigator to leave out...')}</option>
                    {entries.filter(entry => !options.excluded.includes(entry)).map(entry => (
                        <option value={entry} key={entry}>{entry}</option>
                    ))}
                </select>
                {options.excluded.length > 0 ?
                    <div className="chips">
                        {options.excluded.map(entry => (
                            <button type="button" className="chip" key={entry} aria-pressed="true" aria-label={t('Include {name} again', { name: entry })} onClick={() => include(entry)}>
                                <span className="chip-label" data-text={entry}>{entry}</span>
                                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3 3 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            </button>
                        ))}
                    </div>
                    : null}
            </div>

            <p className="field-hint" role="status">{eligibleCount === 0 ? t('No investigator matches these options.') : t('{count} investigator matches these options.|{count} investigators match these options.', { count: eligibleCount })}</p>
        </div>
    )
}

export default InvestigatorDraftSettings
