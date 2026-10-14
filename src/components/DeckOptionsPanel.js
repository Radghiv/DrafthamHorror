import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeSetting } from '../features/settings/settingsSlice'
import { updateExileRemoval, calculateNeededExileCheckboxes } from '../features/draft/draftSlice'

import { costWithTaboo, isCardLegalBurnOption } from '../draft/DrawDraft'
import { pendingLevel0Count } from '../draft/Level0'
import DraftPhases from '../data/DraftPhases'
import ResearchLogs from '../data/ResearchLogs'
import useCardName from './useCardName'
import { useT, msg } from '../i18n'
import SegmentedRange from './SegmentedRange'

// the names of the classes that can be chosen, by their code
const factionNames = {
    guardian: msg('Guardian'),
    seeker: msg('Seeker'),
    rogue: msg('Rogue'),
    mystic: msg('Mystic'),
    survivor: msg('Survivor')
}

// Options that depend on the cards of the deck being upgraded; shown in the Draft Rules step once a deck is loaded
function DeckOptionsPanel(props) {
    const t = useT()

    const deckList = useSelector(state => state.draft.deckList)
    const burnCards = useSelector(state => state.settings.burnCards)
    const exileSelection = useSelector(state => state.settings.exileSelection)
    const researchSelection = useSelector(state => state.settings.researchSelection)
    const otherSettings = useSelector(state => state.settings.otherUpgradeSettings)
    const filteredResearch = useSelector(state => state.settings.filteredResearch)
    const removedCards = useSelector(state => state.settings.removedCards)
    const showDeckOptions = useSelector(state => state.draft.showDeckOptions)
    const classChoice1Value = useSelector(state => state.settings.classChoices['faction_1'])
    const investigatorData = useSelector(state => state.settings.investigatorData)
    const draftOrder = useSelector(state => state.settings.draftOrder)
    const draftCount = useSelector(state => state.settings.draftCount)
    const level0Swaps = useSelector(state => state.draft.level0Swaps)
    const level0Adds = useSelector(state => state.draft.level0Adds)

    const dispatch = useDispatch()
    const { cardName } = useCardName()

    function handleChange(event) {
        dispatch(changeSetting(event.target.name, event.target.value))
    }

    function handleCheckbox(event) {
        dispatch(changeSetting(event.target.name, event.target.checked))

        if (event.target.name.substring(0, 13) === 'ExileCheckbox') {
            const exileCode = event.target.name.substring(13, 18)

            if (exileCode === '08076') {    // Burn after reading
                const exileIndex = event.target.name.substring(19, 20)

                dispatch(updateExileRemoval(exileCode, event.target.checked, burnCards[exileIndex-1]))
            }
            else {
                dispatch(updateExileRemoval(exileCode, event.target.checked, null))
            }
        }
    }

    function handleBurnChange(event) {
        const exileIndex = event.target.name.substring(8, 9)
        const burnChecked = exileSelection['08076_' + exileIndex]

        dispatch(changeSetting(event.target.name, event.target.value))

        if (burnChecked) {
            dispatch(updateExileRemoval(null, false, burnCards[exileIndex-1]))
            dispatch(updateExileRemoval(null, true, event.target.value))
        }
    }

    var exileArray = []
    var greenman = 0
    var peltshipment = 0

    for (let i = 0; i < deckList.length; i++) {
        if (deckList[i].name === 'Green Man Medallion') greenman += deckList[i].count
        if (deckList[i].name === 'Pelt Shipment') peltshipment += deckList[i].count
        if (deckList[i].exile) exileArray.push(deckList[i])
    }

    exileArray.sort( function(a, b) {
        if (a.name > b.name) return 1
        if (a.name < b.name) return -1
        return 0
    })

    const researchArray = Object.entries(filteredResearch).filter(entry => entry[1].draftability >= 3).map(item => item[0]).sort( function(a, b) {
        if (a.baseCode > b.baseCode) return 1
        if (a.baseCode < b.baseCode) return -1
        return 0
    })

    // no options to display
    if (!showDeckOptions) return null

    const disallowBurn1 = (exileSelection['08076_2'] && burnCards[1] === '08076')
    const disallowBurn2 = (exileSelection['08076_1'] && burnCards[0] === '08076')

    function burnSelect(index, cardIndex) {
        const options = deckList.map( card => {
            const legal = isCardLegalBurnOption(card, exileSelection, deckList, burnCards, index)

            return legal ? <option value={card.key} key={card.key}>{card.xp > 0 ? cardName(card) + ' (' + card.xp + ')' : cardName(card)}</option> : null
        }).filter( item => item !== null).sort( (a, b) => {
            return (a.props.children > b.props.children ? 1 : a.props.chidren === b.props.children ? 0 : -1)
        })

        return (
            <div className="field burn-select">
                <select name={'BurnCard' + index} value={burnCards[cardIndex]} onChange={handleBurnChange} aria-label={t('Card to burn with copy {index} of Burn After Reading', { index })}>
                    {options}
                </select>
            </div>
        )
    }

    // and disallow multiple burns if burned a burn
    const exileCheckboxes = exileArray.map( item => {
        const checkboxesNeeded = calculateNeededExileCheckboxes(item.key, exileSelection, deckList, burnCards)
        const levelStr = item.xp && item.xp > 0 ? <span className='xpDots xpExileDots'>{' ' + '●'.repeat(costWithTaboo(item))}</span> : null

        if (item.name === 'Burn After Reading') {
            const showSecond = item.count > 1 && !disallowBurn2 && checkboxesNeeded > 1

            return (
                <div className="exile-item" key={item.key}>
                    <label className="check-row">
                        <input type="checkbox" checked={exileSelection[item.key + '_1'] || false} name={'ExileCheckbox' + item.key + '_1'} onChange={handleCheckbox}/>
                        <span>{cardName(item)}{levelStr}</span>
                    </label>
                    {checkboxesNeeded > 0 && !disallowBurn1 ? burnSelect(1, 0) : null}
                    {showSecond ?
                        <>
                            <label className="check-row">
                                <input type="checkbox" checked={exileSelection[item.key + '_2'] || false} name={'ExileCheckbox' + item.key + '_2'} onChange={handleCheckbox}/>
                                <span>{cardName(item)}{levelStr}</span>
                            </label>
                            {burnSelect(2, 1)}
                        </>
                        : null}
                </div>
            )
        }

        if (checkboxesNeeded === 0) return null

        const copies = []
        for (let copy = 1; copy <= Math.min(4, checkboxesNeeded, item.count); copy++) {
            copies.push(
                <input type="checkbox" key={copy} checked={exileSelection[item.key + '_' + copy] || false} name={'ExileCheckbox' + item.key + '_' + copy}
                    aria-label={t('Exile copy {copy} of {name}', { copy, name: cardName(item) })} onChange={handleCheckbox}/>
            )
        }

        return (
            <div className="check-row" key={item.key}>
                <span className="check-group">{copies}</span>
                <span>{cardName(item)}{levelStr}</span>
            </div>
        )
    }).filter(item => item !== null)

    const factionList = ['guardian', 'seeker', 'rogue', 'mystic', 'survivor']

    const classChoiceList = factionList.map((item, index) => {
        return <option value={item} key={index}>
            {t(factionNames[item])}
            </option>
    })

    const suziDiv = investigatorData.name === 'Subject 5U-21' ?
        <div className="options-section">
            <h4>Subject 5U-21</h4>
            <div className="field">
                <label htmlFor="upgrade-class">{t('Upgrade class')}</label>
                <select id="upgrade-class" name="ClassChoice1" value={classChoice1Value} onChange={handleChange}>
                    {classChoiceList}
                </select>
            </div>
        </div> : null

    const researchDiv = researchArray.length > 0 ?
        <div className="options-section">
            <h4>{t('Researched')}</h4>
            {researchArray.map( item => (
                <label className="check-row" key={item}>
                    <input type="checkbox" checked={researchSelection[filteredResearch[item].baseCode] || false} name={'ResearchCheckbox' + filteredResearch[item].baseCode} onChange={handleChange}/>
                    <span>{item} <i>({ResearchLogs[item]})</i></span>
                </label>
            ))}
            <p className="field-hint">{t('Upgraded versions of Unidentified or Untranslated assets will only appear in the upgrade draft if the corresponding campaign log entry is selected here.')}</p>
        </div> : null

    const exileDiv = exileCheckboxes.length > 0 ?
        <div className="options-section">
            <h4>{t('Exile')}</h4>
            {exileCheckboxes}
            <p className="field-hint">{t('Cards selected here will be added to the removed list and increase the number of level 0 drafts allowed.')}</p>
        </div> : null

    var peltdiscount = (otherSettings['Pelt'][0] ? 1 : 0) + (otherSettings['Pelt'][1] ? 1 : 0)

    const otherDiv = greenman > 0 || peltshipment > 0 ?
        <div className="options-section">
            <h4>{t('Other cards')}</h4>
            {greenman > 0 ?
                <div className="setting-row">
                    <label className="setting-label" htmlFor="gmm-discount"><strong>Green Man Medallion</strong><span>{t('XP discount')}</span></label>
                    <div className="setting-control field">
                        <input id="gmm-discount" name="OtherUpgradeGMM" type="number" value={otherSettings['GMM']} min="1" onChange={handleChange}></input>
                    </div>
                </div> : null}
            {peltshipment > 0 ?
                <div className="setting-row">
                    <span className="setting-label"><strong>Pelt Shipment</strong><span>{t('{discount} XP discount', { discount: peltdiscount })}</span></span>
                    <div className="setting-control">
                        <input type="checkbox" className="big-checkbox" checked={otherSettings['Pelt'][0]} name="OtherUpgradePelt1" aria-label={t('Pelt Shipment discount {number}', { number: 1 })} onChange={handleCheckbox} />
                        {peltshipment > 1 ? <input type="checkbox" className="big-checkbox" checked={otherSettings['Pelt'][1]} name="OtherUpgradePelt2" aria-label={t('Pelt Shipment discount {number}', { number: 2 })} onChange={handleCheckbox} /> : null}
                    </div>
                </div> : null}
        </div> : null

    // level 0 drafts waiting to happen: replacements for removed or exiled cards, Adaptable, deck requirements...
    const pendingLevel0 = pendingLevel0Count(level0Swaps, level0Adds)

    const level0Phase = DraftPhases.UpgradeLevel0AddPhase

    const orderDiv = pendingLevel0 > 0 ?
        <div className="stack" style={{gap: '16px'}}>
            <div className="setting-row">
                <span className="setting-label" id="draft-order-label"><strong>{t('Draft order')}</strong><span>{t('{count} level 0 card to draft besides the upgrades|{count} level 0 cards to draft besides the upgrades', { count: pendingLevel0 })}</span></span>
                <div className="setting-control">
                    <div className="segmented" role="group" aria-labelledby="draft-order-label">
                        <button type="button" aria-pressed={draftOrder !== 'level0'} onClick={() => dispatch(changeSetting('DraftOrder', 'upgrade'))}>{t('Upgrades first')}</button>
                        <button type="button" aria-pressed={draftOrder === 'level0'} onClick={() => dispatch(changeSetting('DraftOrder', 'level0'))}>{t('Level 0 cards first')}</button>
                    </div>
                </div>
            </div>
            <div className="setting-row">
                <label className="setting-label" htmlFor="level0-count"><strong>{t('Cards to select from')}</strong><span>{t('For the level 0 drafts')}</span></label>
                <div className="setting-control">
                    <SegmentedRange id="level0-count" className="range" min="2" max="20" step="1" value={draftCount[level0Phase - 1]}
                        onChange={event => dispatch(changeSetting('DraftCount', { phase: level0Phase, value: event.target.value }))} />
                    <span className="value-badge">{draftCount[level0Phase - 1]}</span>
                </div>
            </div>
        </div> : null

    return (
        <div className="deck-options">
            <h3>{t('Deck options')}</h3>
            {suziDiv}
            {exileDiv}
            {researchDiv}
            {otherDiv}
            <div className="options-section">
                <div className="setting-row">
                    <label className="setting-label" htmlFor="removed-cards"><strong>{t('Removed by other game effects')}</strong>
                        <span>{t('Cards removed from your deck by a scenario or another card effect, which need to be replaced')}</span></label>
                    <div className="setting-control">
                        <div className="field" style={{width: '120px'}}>
                            <input id="removed-cards" name="RemovedCards" type="number" value={removedCards} min="0" onChange={handleChange}></input>
                        </div>
                        <span>{t('cards')}</span>
                    </div>
                </div>
            </div>
            {orderDiv}
        </div>
    )
}

export default DeckOptionsPanel
