import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { EMPTY_FILTERS, CLASS_FILTERS, TYPE_FILTERS, SLOT_FILTERS, COST_FILTERS, LEVEL_FILTERS, ICON_FILTERS, hasFilters, traitsOf } from '../draft/SealedFilters'
import ICON_GLYPHS from '../data/CardIcons'
import { OfficialColorForClass } from '../data/ClassColors'
import { typeName } from '../data/CardTypeNames'
import usePhoneLayout from './usePhoneLayout'
import { FilterIcon } from './wizard/Icons'
import { useT, msg } from '../i18n'

const CLASS_NAMES = {
    guardian: msg('Guardian'),
    seeker: msg('Seeker'),
    rogue: msg('Rogue'),
    mystic: msg('Mystic'),
    survivor: msg('Survivor'),
    neutral: msg('Neutral')
}

const TYPE_ENGLISH = { asset: 'Asset', event: 'Event', skill: 'Skill' }

const SLOT_NAMES = {
    Hand: msg('Hand'),
    Arcane: msg('Arcane'),
    Accessory: msg('Accessory'),
    Body: msg('Body'),
    Ally: msg('Ally'),
    Tarot: msg('Tarot'),
    None: msg('No slot')
}

const ICON_NAMES = {
    willpower: msg('Willpower'),
    intellect: msg('Intellect'),
    combat: msg('Combat'),
    agility: msg('Agility'),
    wild: msg('Wild')
}

// The filters over the cards of a sealed pool, like the card search of ArkhamDB: search text, class, type, slot, cost, skill icons and trait.
// The filters live in the panel of the draft (filters, onChange).
function SealedFilterBar(props) {
    const { filters, onChange, pool } = props

    const t = useT()
    const language = useSelector(state => state.settings.language)
    const phone = usePhoneLayout()

    // a phone starts with the filters folded away: they would push the cards off the screen
    const [open, setOpen] = useState(!phone)

    // the traits that the cards of the pool have
    const traits = useMemo(() => {
        const traitSet = new Set()

        pool.forEach(card => traitsOf(card).forEach(trait => traitSet.add(trait)))

        return Array.from(traitSet).sort((a, b) => a.localeCompare(b))
    }, [pool])

    const used = hasFilters(filters)

    // an upgrade pool has levels to filter by (a pool for a new deck is all level 0)
    const hasLevels = pool.some(card => card.xp > 0)

    // the search field tells how many cards are left in the pool
    const searchText = t('Search the pool ({count})', { count: pool.length })

    // a group of toggles: the card has to match one of those that are on
    function toggle(group, value) {
        const list = filters[group]

        onChange({ ...filters, [group]: list.includes(value) ? list.filter(item => item !== value) : [...list, value] })
    }

    function chipGroup(group, label, values, content) {
        const id = 'sealed-filter-' + group

        return (
            <div className="sealed-filter-group" role="group" aria-labelledby={id}>
                <span className="field-label" id={id}>{label}</span>
                <div className="chips">
                    {values.map(value => (
                        <button type="button" key={value} className="chip chip-sm" aria-pressed={filters[group].includes(value)} onClick={() => toggle(group, value)}>
                            {content(value)}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <section className="sealed-filters" aria-label={t('Filters')}>
            <div className="sealed-filters-top">
                <div className="field sealed-search">
                    <input type="text" value={filters.text} placeholder={searchText} aria-label={searchText} autoComplete="off" spellCheck={false}
                        onChange={event => onChange({ ...filters, text: event.target.value })} />
                </div>
                <button type="button" className="btn btn-secondary sealed-filters-toggle" aria-expanded={open} aria-controls="sealed-filters-body" aria-label={t('Filters')} title={t('Filters')} onClick={() => setOpen(!open)}><FilterIcon /></button>
                {used ? <button type="button" className="link-btn" onClick={() => onChange(EMPTY_FILTERS)}>{t('Clear filters')}</button> : null}
            </div>

            {open ?
                <div className="sealed-filters-body" id="sealed-filters-body">
                    {chipGroup('classes', t('Class'), CLASS_FILTERS, value => (
                        <>
                            <span className="classIcon" style={{ backgroundColor: OfficialColorForClass(value) }} aria-hidden="true"></span>
                            {t(CLASS_NAMES[value])}
                        </>
                    ))}
                    {chipGroup('types', t('Type'), TYPE_FILTERS, value => typeName(language, value) || TYPE_ENGLISH[value])}
                    {chipGroup('slots', t('Slot'), SLOT_FILTERS, value => t(SLOT_NAMES[value]))}
                    {chipGroup('costs', t('Cost'), COST_FILTERS, value => value === 5 ? '5+' : String(value))}
                    {hasLevels ? chipGroup('levels', t('Level'), LEVEL_FILTERS, value => String(value)) : null}
                    {chipGroup('icons', t('Skill icons'), ICON_FILTERS, value => (
                        <span className="gameIcon sealed-icon" role="img" aria-label={t(ICON_NAMES[value])} title={t(ICON_NAMES[value])}>{ICON_GLYPHS[value]}</span>
                    ))}

                    <div className="field sealed-filter-trait">
                        <label htmlFor="sealed-filter-trait">{t('Trait')}</label>
                        <select id="sealed-filter-trait" value={filters.trait} onChange={event => onChange({ ...filters, trait: event.target.value })}>
                            <option value="">{t('Any trait')}</option>
                            {traits.map(trait => <option value={trait} key={trait}>{trait}</option>)}
                        </select>
                    </div>
                </div>
                : null}
        </section>
    )
}

export default SealedFilterBar
