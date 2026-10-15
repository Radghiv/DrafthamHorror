import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeSetting, calculateFilteredCount, setInvestigatorMode, clearInvestigator } from '../features/settings/settingsSlice'
import { selectInvestigatorEntry } from '../features/settings/investigatorActions'
import { unloadDeck } from '../features/data/dataSlice'
import { OfficialColorForClass, darkenColor, readableTextColor } from '../data/ClassColors'
import DeckImport from './wizard/DeckImport'
import InvestigatorDraftSettings from './wizard/InvestigatorDraftSettings'
import { findInvestigatorCard } from '../data/InvestigatorList'
import useInvestigatorEntries from './useInvestigatorEntries'
import { useT, msg } from '../i18n'

const CLASS_NAMES = {
    guardian: msg('Guardian'),
    seeker: msg('Seeker'),
    rogue: msg('Rogue'),
    mystic: msg('Mystic'),
    survivor: msg('Survivor'),
    neutral: msg('Neutral')
}

function InvestigatorPanel(props) {
    const t = useT()
    const settings = useSelector(state => state.settings)
    const cardData = useSelector(state => state.data.cardData)
    const investigatorData = useInvestigatorEntries()

    const investigatorColors = useMemo(() => {
        const colors = {}

        if (cardData) {
            const cards = Object.values(cardData)

            investigatorData.forEach(name => {
                // the class colors of the game, 50% darker
                const investigatorCard = findInvestigatorCard(name, cards)
                const classColor = OfficialColorForClass(investigatorCard ? investigatorCard.faction_code : undefined)

                colors[name] = classColor ? darkenColor(classColor, 0.5) : undefined
            })
        }

        return colors
    }, [cardData, investigatorData])

    const dispatch = useDispatch()

    // the name of a class, from its code
    const className = code => CLASS_NAMES[code] ? t(CLASS_NAMES[code]) : code[0].toUpperCase() + code.slice(1)

    const agathaClass = settings.primaryClass[0].toUpperCase() + settings.primaryClass.slice(1)
    // same-name versions of an investigator are listed as "Name (Pack)"
    const packVariant = settings.investigatorData ? settings.investigator + ' (' + settings.investigatorData.pack_name + ')' : null
    // '' while no investigator has been chosen
    const investigatorFull = !settings.investigatorData ? ''
        : settings.investigator === 'Agatha Crane' ? 'Agatha Crane (' + agathaClass + ')'
        : settings.parallel ? settings.investigator + ' (Parallel)'
        : investigatorData.includes(packVariant) ? packVariant : settings.investigator

    function handleChange(event) {
        dispatch(changeSetting(event.target.name, event.target.value))
        dispatch(calculateFilteredCount)
    }

    function handleChangeInvestigator(event) {
        dispatch(selectInvestigatorEntry(event.target.value))
    }

    function handleRandom(event) {
        dispatch(selectInvestigatorEntry(investigatorData[Math.floor(Math.random() * investigatorData.length)]))
    }

    // three ways to choose the investigator; leaving ArkhamDB drops the deck that was taken from it, and going to ArkhamDB drops the
    // investigator chosen from the list (it comes with the deck)
    const MODES = [
        { key: 'list', label: msg('From the list') },
        { key: 'arkhamdb', label: msg('From ArkhamDB') },
        { key: 'draft', label: msg('Draft it') }
    ]

    function handleMode(key) {
        if (key === settings.investigatorMode) return

        if (deckValidation.status === 'valid') dispatch(unloadDeck)
        dispatch(setInvestigatorMode(key))

        if (key === 'arkhamdb' && settings.investigatorData) {
            dispatch(clearInvestigator())
            dispatch(calculateFilteredCount)
        }
    }

    let secondaryFactionList = null
    let classChoiceList = []
    let deckSizeList = null
    let traitChoiceList = null
    let classChoice1Value = settings.classChoices['faction_1']
    let classChoice2Value = settings.classChoices['faction_2']
    let traitChoiceValue = settings.traitChoice
    let deckSizeValue = settings.selectedDeckSize ? settings.selectedDeckSize : settings.deckSize

    if (settings.investigatorData) {
        const deckOptions = settings.investigatorData.deck_options

        for (let i = 0; i < deckOptions.length; i++) {
            if (deckOptions[i].name === 'Secondary Class')
            {
                const list = deckOptions[i].faction_select

                secondaryFactionList = list.map((item, index) => {
                    return <option value={item} key={index}>
                        {className(item)}
                        </option>
                })
            }
            else if (deckOptions[i].name === 'Class Choice')
            {
                const list = deckOptions[i].faction_select

                classChoiceList[deckOptions[i].id] = list.map((item, index) => {
                    return <option value={item} key={index}>
                        {className(item)}
                        </option>
                })
            }
            else if (deckOptions[i].name === 'Deck Size')
            {
                const list = deckOptions[i].deck_size_select

                deckSizeList = list.map((item, index) => {
                    return <option value={item} key={index}>
                        {item}
                        </option>
                })
            }
            else if (deckOptions[i].name === 'Trait Choice')
            {
                const list = deckOptions[i].option_select

                traitChoiceList = list.map((item, index) => {
                    return <option value={item.name} key={index}>
                        {item.name}
                        </option>
                })
            }
        }
    }

    function renderSelect(id, label, name, value, options, style) {
        return (
            <div className="field">
                <label htmlFor={id}>{label}</label>
                <select id={id} name={name} value={value} onChange={handleChange} style={style}>
                    {options}
                </select>
            </div>
        )
    }

    // a validated ArkhamDB deck decides the investigator, class, deck size and taboo list
    const deckValidation = useSelector(state => state.data.deckValidation)
    const deckLocked = settings.investigatorMode === 'arkhamdb' && deckValidation.status === 'valid' && deckValidation.id === settings.deckID.trim()

    const investigatorColor = investigatorColors[investigatorFull]

    // entries use the class colors of the game, with whichever text color reads better on them
    const classStyle = color => color ? { backgroundColor: color, color: readableTextColor(color) } : undefined
    const investigatorStyle = classStyle(investigatorColor)

    const mode = settings.investigatorMode

    const listFields =
        <fieldset className="plain-fieldset" disabled={deckLocked}>
            {mode === 'list' ?
                <div className="field">
                    <label htmlFor="investigator-select">{t('Investigator')}</label>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
                        <select id="investigator-select" name="investigator" value={investigatorFull} onChange={handleChangeInvestigator}
                            style={{flex: '1 1 260px', ...investigatorStyle}}>
                            {investigatorFull === '' ? <option value="" disabled>{t('Choose an investigator')}</option> : null}
                            {investigatorData.map(name => (
                                <option value={name} key={name} style={classStyle(investigatorColors[name])}>{name}</option>
                            ))}
                        </select>
                        <button type="button" className="btn btn-secondary" onClick={handleRandom}>{t('Random')}</button>
                    </div>
                </div>
                : null}
            <div className="field-grid">
                {secondaryFactionList ? renderSelect('secondary-class', t('Secondary class'), 'SecondaryClass', settings.secondaryClass, secondaryFactionList) : null}
                {classChoiceList['faction_1'] ? renderSelect('class-choice-1', t('Class choice 1'), 'ClassChoice1', classChoice1Value, classChoiceList['faction_1']) : null}
                {classChoiceList['faction_2'] ? renderSelect('class-choice-2', t('Class choice 2'), 'ClassChoice2', classChoice2Value, classChoiceList['faction_2']) : null}
                {deckSizeList ? renderSelect('deck-size', t('Deck size'), 'SelectedDeckSize', deckSizeValue, deckSizeList) : null}
                {traitChoiceList ? renderSelect('trait-choice', t('Trait choice'), 'TraitChoice', traitChoiceValue, traitChoiceList) : null}
            </div>
        </fieldset>

    return (
        <div className="stack">
            <div className="segmented" role="group" aria-label={t('How do you want to choose the investigator?')}>
                {MODES.map(item => (
                    <button type="button" key={item.key} aria-pressed={mode === item.key} onClick={() => handleMode(item.key)}>{t(item.label)}</button>
                ))}
            </div>

            <div className="stack mode-enter" key={mode}>
                {mode === 'list' ? listFields : null}

                {mode === 'arkhamdb' ?
                    <>
                        <DeckImport />
                        {deckLocked ? listFields : null}
                    </>
                    : null}

                {mode === 'draft' ?
                    <>
                        <InvestigatorDraftSettings />
                    </>
                    : null}
            </div>
        </div>
    )
}

export default InvestigatorPanel
