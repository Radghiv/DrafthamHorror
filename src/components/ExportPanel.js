import React, { useState } from 'react';
import { useSelector } from 'react-redux'

import ExportDeck, { cardsMissingOctgnIds, textImportIssues } from '../draft/ExportDeck'
import { arkhamBuildDeck, downloadArkhamBuildDeck } from '../draft/ExportArkhamBuild'
import useCardOverlay, { isTouchScreen } from './OverlayImage'
import CardLinkButton from './CardLinkButton'
import useCardName from './useCardName'
import { requiredQuantity, signatureGroups } from '../data/RequiredCards'
import { CheckIcon, WarningIcon } from './wizard/Icons'
import { useT, msg } from '../i18n'

const CLASS_NAMES = {
    guardian: msg('Guardian'),
    seeker: msg('Seeker'),
    rogue: msg('Rogue'),
    mystic: msg('Mystic'),
    survivor: msg('Survivor'),
    neutral: msg('Neutral')
}

function SettingsExport(props) {
    const t = useT()
    const [useSignatures, changeUseSignatures] = useState([ true, false, false, false])
    const [basicWeakness, changeBasicWeakness] = useState(['Random basic weakness', '01000'])
    const [deckTitle, changeDeckTitle] = useState('')

    // the button of the file that was just exported shows a check mark for a moment
    const [exported, setExported] = useState(null)

    // the cards that the last .o8d export had to leave out (null before one)
    const [omitted, setOmitted] = useState(null)

    // the ArkhamDB formats are folded away (arkham.build is the recommended one), and so is the detail of each notice about them
    const [dbOpen, setDbOpen] = useState(false)
    const [openNotices, setOpenNotices] = useState({})

    function flashExported(fileType) {
        setExported(fileType)
        setTimeout(() => setExported(current => current === fileType ? null : current), 2200)
    }

    const investigator = useSelector(state => state.settings.investigator)
    const investigatorData = useSelector(state => state.settings.investigatorData)
    const deckSize = useSelector(state => state.settings.deckSize)
    const cardData = useSelector(state => state.data.cardData)
    const collection = useSelector(state => state.collection)
    const cardList = useSelector(state => state.draft.cardList)
    const secondaryClass = useSelector(state => state.settings.secondaryClass)
    const classChoices = useSelector(state => state.settings.classChoices)
    const traitChoice = useSelector(state => state.settings.traitChoice)
    const selectedDeckSize = useSelector(state => state.settings.selectedDeckSize)
    const parallel = useSelector(state => state.settings.parallel)
    const selectedTaboo = useSelector(state => state.settings.selectedTaboo)
    const seed = useSelector(state => state.settings.seed)
    const deckbuilding = useSelector(state => state.settings.deckbuilding)

    function handleInput(event) {
        changeDeckTitle(event.target.value)
    }

    function handleCheckbox(event) {
        var index = 0

        if (event.target.name === 'CB3') index = 3
        else if (event.target.name === 'CB2') index = 2
        else if (event.target.name === 'CB1') index = 1

        var newSignatures = { ...useSignatures }
        newSignatures[index] = event.target.checked

        changeUseSignatures(newSignatures)
    }

    const doCardOverlay = useCardOverlay()
    const { cardName: localName, cardSubname } = useCardName()

    function previewCard(event) {
        const code = event.currentTarget.dataset.code || event.currentTarget.id

        // basic weakness
        if (code === '01000') return

        const card = cardData.find(item => item.code === code)

        if (card) doCardOverlay(card, event)
    }

    function onEnterCard(event) {
        previewCard(event)
    }

    function onLeaveCard() {
        doCardOverlay(null)
    }

    // touch screens have no hover: tapping a card opens the preview
    function onTapCard(event) {
        if (isTouchScreen()) previewCard(event)
    }

    function handleWeaknessClick() {
        var weaknessCount = 0

        for (let i = 0; i < weaknessCards.length; i++) {
            weaknessCount += weaknessCards[i].quantity
        }

        var weaknessRoll = Math.floor(Math.random()*weaknessCount)

        for (let i = 0; i < weaknessCards.length; i++) {
            if (weaknessRoll <= 0) {
                changeBasicWeakness([weaknessCards[i].name, weaknessCards[i].code])
                break
            }
            
            weaknessRoll -= weaknessCards[i].quantity
        }
    }

    // the cards that come with the deck besides the drafted ones: the signature cards that are chosen and the basic weakness
    function specialCardsOfDeck() {
        var specialCards = []
        let burdenOfDestinyAdded =  false

        for (let [signatureIndex, signatureArray] of signatureCards.entries()) {
            if (useSignatures[signatureIndex]) {
                for (let j = 0; j < signatureArray.length; j++) {
                    const cardID = Object.keys(cardData)
                    .filter(key => {
                        return cardData[key].code === signatureArray[j]
                    })[0]
                
                    const card = cardData[cardID]
                    let sigQuantity = requiredQuantity(card, deckSize)

                    if (card.name === 'Burden of Destiny') {
                        sigQuantity = 0

                        if (!burdenOfDestinyAdded) {

                            for (let i = 0; i < 4; i++)
                                if (useSignatures[i]) sigQuantity++

                            burdenOfDestinyAdded = true
                        }
                    }

                    if (sigQuantity > 0) specialCards.push({name: card.name, key: card.code, type_code: card.type_code, count: sigQuantity })
                }
            }
        }

        const weaknessID = Object.keys(cardData)
        .filter(key => {
            return cardData[key].code === basicWeakness[1]
        })[0]
    
        const weaknessCard = cardData[weaknessID]
//console.log(weaknessCard)
//        if (!weaknessCard.octgn_id) weaknessCard.octgn_id = ''

        specialCards.push({name: weaknessCard.name, key: weaknessCard.code, type_code: weaknessCard.type_code, count: 1 })

        return specialCards
    }

    // the file for arkham.build: it takes the choices of the creation of the deck too
    function handleArkhamBuildClick() {
        const title = deckTitle.length > 0 ? deckTitle : 'Deck'

        downloadArkhamBuildDeck(arkhamBuildDeck({
            title: title,
            investigatorData: investigatorData,
            parallel: parallel,
            cards: [...cardList, ...specialCardsOfDeck()],
            choices: { secondaryClass: secondaryClass, classChoices: classChoices, traitChoice: traitChoice, selectedDeckSize: selectedDeckSize, deckSize: deckSize },
            tabooId: selectedTaboo,
            description: 'Drafted with Draftham Horror (' + (deckbuilding === 'sealed' ? 'sealed' : 'draft') + ', seed ' + seed + ').'
        }), title)
    }

    function handleExportClick(fileType) {
        const specialCards = specialCardsOfDeck()

        const result = ExportDeck({
            fileType: fileType,
            deckTitle: deckTitle,
            investigatorData: investigatorData,
            cardList: cardList,
            specialCards: specialCards,
            cardData: cardData
        })

        if (result) setOmitted(result.omitted)
    }

    const { groups: signatureCards, hasChoice: useCheckbox } = signatureGroups(investigatorData)

    // the cards an .o8d file can't carry: those of the last export (it knows the signature cards and the weakness too), or before the first one
    // the drafted cards and the investigator
    const missingIds = omitted || cardsMissingOctgnIds(cardList, cardData, investigatorData)

    // when the .o8d can't carry every card, the text export comes before it (arkham.build's file is the recommended one, and comes before both)
    const preferText = missingIds.length > 0

    // the cards ArkhamDB's text import leaves out or mixes up: the drafted ones, the signature cards that are shown and the weakness that was drawn
    const textCodes = [...cardList.map(item => item.key), ...signatureCards.flat(), ...(basicWeakness[1] !== '01000' ? [basicWeakness[1]] : [])]
    const textIssues = textImportIssues(textCodes, cardData)

    // the choices made when the deck was created, which a file can't carry (ArkhamDB asks for them in its deck editor)
    const className = code => CLASS_NAMES[code] ? t(CLASS_NAMES[code]) : code
    const deckOptions = investigatorData.deck_options || []
    const choices = []

    if (deckOptions.some(option => option.name === 'Secondary Class')) choices.push(t('Secondary class') + ': ' + className(secondaryClass))
    if (deckOptions.some(option => option.name === 'Class Choice' && option.id === 'faction_1')) choices.push(t('Class choice 1') + ': ' + className(classChoices.faction_1))
    if (deckOptions.some(option => option.name === 'Class Choice' && option.id === 'faction_2')) choices.push(t('Class choice 2') + ': ' + className(classChoices.faction_2))
    if (deckOptions.some(option => option.name === 'Deck Size')) choices.push(t('Deck size') + ': ' + (selectedDeckSize || deckSize))
    if (deckOptions.some(option => option.name === 'Trait Choice')) choices.push(t('Trait choice') + ': ' + traitChoice)

    // A notice about what a file of ArkhamDB can't carry: one line with how many cards (or choices), and a button that opens the list. The entries
    // with a code are cards to hover or tap for a preview; outro is advice shown with the list.
    function exportNotice(key, summary, entries, outro) {
        const open = Boolean(openNotices[key])

        return (
            <div className="status status-warn export-notice" role="status" key={key}>
                <WarningIcon />
                <div className="status-body">
                    <p>
                        {summary}{' '}
                        <button type="button" className="link-btn" aria-expanded={open} onClick={() => setOpenNotices(current => ({ ...current, [key]: !current[key] }))}>{open ? t('Hide details') : t('Show details')}</button>
                    </p>
                    {open ?
                        <>
                            <ul className="missing-list">
                                {entries.map(entry => entry.code ?
                                    <li className="export-card missing-card" key={entry.code} data-code={entry.code} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} onClick={onTapCard}>
                                        {entry.name}
                                        <CardLinkButton card={cardData.find(item => item.code === entry.code)} size="small" />
                                    </li>
                                    :
                                    <li className="missing-item" key={entry.name}>{entry.name}</li>)}
                            </ul>
                            {outro ? <p>{outro}</p> : null}
                        </>
                        : null}
                </div>
            </div>
        )
    }

    // how many notices the ArkhamDB formats have (shown on the folded section)
    const noticeCount = (missingIds.length > 0 ? 1 : 0) + (textIssues.unreadable.length > 0 ? 1 : 0) + (textIssues.ambiguous.length > 0 ? 1 : 0) + (choices.length > 0 ? 1 : 0)

    const o8dButton = <button type="button" className="btn btn-block btn-secondary" onClick={() => { handleExportClick('OCTGN'); flashExported('OCTGN') }}>{exported === 'OCTGN' ? <span className="pop-check"><CheckIcon size={16} /></span> : null} {t('Export as .o8d')}</button>
    const textButton = <button type="button" className="btn btn-block btn-secondary" onClick={() => { handleExportClick('TXT'); flashExported('TXT') }}>{exported === 'TXT' ? <span className="pop-check"><CheckIcon size={16} /></span> : null} {t('Export as plain text (.txt)')}</button>

    const arkhamBuildButton = <button type="button" className="btn btn-block btn-primary" onClick={() => { handleArkhamBuildClick(); flashExported('ARKHAMBUILD') }}>{exported === 'ARKHAMBUILD' ? <span className="pop-check"><CheckIcon size={16} /></span> : null} {t('Export for arkham.build (.json)')}</button>

    // make sure it's selected in the collection too
    var weaknessCards = cardData.filter( card => {
        return card.subtype_code === 'basicweakness' && card.code !== '01000' && collection[card.pack_code]
    })

    var signatureOptions = <div className="export-options">
        {
            signatureCards.map( (item, index) => {
                if (item.length > 0) {
                    const cardList = item.map( code => {
                        var signatureID = Object.keys(cardData)
                        .filter(key => {
                            return cardData[key].code === code
                        })[0]

                        const sigQuantity = requiredQuantity(cardData[signatureID], deckSize)

                        const quantityText = (sigQuantity > 1) ? ' x' + sigQuantity : ''

                        let cardName = localName(cardData[signatureID])
                        if (investigator === 'Lily Chen') {
                            if (cardSubname(cardData[signatureID])) cardName = cardName + ': ' + cardSubname(cardData[signatureID])
                        }
                        else if (useCheckbox) {
                            cardName = cardName + ' (' + cardData[signatureID].pack_name + ')'
                        }
                        
                    return (
                        <p className="export-card" id={cardData[signatureID].code} key={cardData[signatureID].code} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} onClick={onTapCard}>{cardName + quantityText}<CardLinkButton card={cardData[signatureID]} size="small" /></p>)
                    })

                    return (useCheckbox ?
                        <label key={index} className="export-option">
                            <input type="checkbox" checked={useSignatures[index]} name={"CB" + index} className="big-checkbox" onChange={handleCheckbox}/>
                            <span>{cardList}</span>
                        </label>
                        :
                        <div key={index} className="export-option">
                            <span>{cardList}</span>
                        </div>
                    )
                }
                else return null
            })
        }
        </div>

    return (
        <div className="settingsDiv export-panel">
            <h3>{t('Export options')}</h3>

            <div className="field">
                <label htmlFor="deck-title">{t('Deck title')}</label>
                <input id="deck-title" name="deckName" type="text" value={deckTitle} onChange={handleInput} placeholder={t('Name of the exported deck')} autoComplete="off" />
            </div>

            <div className="options-section">
                <h4>{t('Signature cards')}</h4>
                {signatureOptions}
            </div>

            <div className="options-section">
                <h4>{t('Weaknesses')}</h4>
                <div className="export-weakness">
                    <p className="export-card" id={basicWeakness[1]} onPointerEnter={onEnterCard} onPointerLeave={onLeaveCard} onClick={onTapCard}>{basicWeakness[1] === '01000' ? t('Random basic weakness') : basicWeakness[0]}</p>
                    <button type="button" className="btn btn-secondary" onClick={() => handleWeaknessClick()}>{t('Draw weakness')}</button>
                </div>
            </div>

            <div className="options-section">
                <h4>arkham.build</h4>
                <div className="export-format">
                    {arkhamBuildButton}
                    <p className="field-hint">{t('In arkham.build: deck list, then Import from JSON files. It has every card and the choices of the deck.')}</p>
                </div>
            </div>

            <div className="options-section export-db">
                <button type="button" className="export-section-toggle" aria-expanded={dbOpen} aria-controls="export-db-body" onClick={() => setDbOpen(!dbOpen)}>
                    <svg className="export-chevron" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m3 5 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <h4>ArkhamDB</h4>
                    {noticeCount > 0 ? <span className="export-notice-flag" role="img" title={t('Notices: {count}', { count: noticeCount })} aria-label={t('Notices: {count}', { count: noticeCount })}><WarningIcon /></span> : null}
                </button>
                {dbOpen ?
                    <div className="export-db-body" id="export-db-body">
                        {preferText ? <>{<div className="export-format" key="txt">
                                {textButton}
                                <p className="field-hint">{t('Names only, so it has every card. In ArkhamDB: Import Deck, then Text.')}</p>
                                {textIssues.unreadable.length > 0 ? exportNotice('unreadable', t("Names the text import can't read, left out: {count}", { count: textIssues.unreadable.length }), textIssues.unreadable, t('Add them by hand after importing.')) : null}
                                {textIssues.ambiguous.length > 0 ? exportNotice('ambiguous', t('Weaknesses the text import may mix up: {count}', { count: textIssues.ambiguous.length }), textIssues.ambiguous, t('Check them after importing.')) : null}
                            </div>}{<div className="export-format" key="o8d">
                                {o8dButton}
                                <p className="field-hint">{t('Exports an OCTGN deck file. To import a downloaded .o8d deck into ArkhamDB, go to My Decks and click Import Deck, then File.')}</p>
                                {missingIds.length > 0 ? exportNotice('ids', t('No OCTGN id in ArkhamDB yet, left out of the .o8d: {count}', { count: missingIds.length }), missingIds, t('The plain text export (Import Deck, then Text) has every card.')) : null}
                            </div>}</> : <>{<div className="export-format" key="o8d">
                                {o8dButton}
                                <p className="field-hint">{t('Exports an OCTGN deck file. To import a downloaded .o8d deck into ArkhamDB, go to My Decks and click Import Deck, then File.')}</p>
                                {missingIds.length > 0 ? exportNotice('ids', t('No OCTGN id in ArkhamDB yet, left out of the .o8d: {count}', { count: missingIds.length }), missingIds, t('The plain text export (Import Deck, then Text) has every card.')) : null}
                            </div>}{<div className="export-format" key="txt">
                                {textButton}
                                <p className="field-hint">{t('Names only, so it has every card. In ArkhamDB: Import Deck, then Text.')}</p>
                                {textIssues.unreadable.length > 0 ? exportNotice('unreadable', t("Names the text import can't read, left out: {count}", { count: textIssues.unreadable.length }), textIssues.unreadable, t('Add them by hand after importing.')) : null}
                                {textIssues.ambiguous.length > 0 ? exportNotice('ambiguous', t('Weaknesses the text import may mix up: {count}', { count: textIssues.ambiguous.length }), textIssues.ambiguous, t('Check them after importing.')) : null}
                            </div>}</>}
                        {choices.length > 0 ? exportNotice('choices', t('Choices to set in ArkhamDB after importing: {count}', { count: choices.length }), choices.map(name => ({ name: name }))) : null}
                    </div>
                    : null}
            </div>
        </div>
    )
}

export default SettingsExport
