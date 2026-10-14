import React, { useState } from 'react';
import { useSelector } from 'react-redux'

import ExportDeck from '../draft/ExportDeck'
import useCardOverlay, { isTouchScreen } from './OverlayImage'
import CardLinkButton from './CardLinkButton'
import useCardName from './useCardName'
import { requiredQuantity, signatureGroups } from '../data/RequiredCards'
import { useT } from '../i18n'

function SettingsExport(props) {
    const t = useT()
    const [useSignatures, changeUseSignatures] = useState([ true, false, false, false])
    const [basicWeakness, changeBasicWeakness] = useState(['Random basic weakness', '01000'])
    const [deckTitle, changeDeckTitle] = useState('')

    const investigator = useSelector(state => state.settings.investigator)
    const investigatorData = useSelector(state => state.settings.investigatorData)
    const deckSize = useSelector(state => state.settings.deckSize)
    const cardData = useSelector(state => state.data.cardData)
    const collection = useSelector(state => state.collection)
    const cardList = useSelector(state => state.draft.cardList)

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
        // basic weakness
        if (event.currentTarget.id === '01000') return

        const card = cardData.find(item => item.code === event.currentTarget.id)

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

    function handleExportClick(fileType) {
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

        ExportDeck({
            fileType: fileType,
            deckTitle: deckTitle,
            investigatorData: investigatorData,
            cardList: cardList,
            specialCards: specialCards,
            cardData: cardData
        })
    }

    const { groups: signatureCards, hasChoice: useCheckbox } = signatureGroups(investigatorData)

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
                <button type="button" className="btn btn-primary btn-block" onClick={() => handleExportClick('OCTGN')}>{t('Export as .o8d')}</button>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => handleExportClick('TXT')}>{t('Export as plain text (.txt)')}</button>
                <p className="field-hint">{t('Exports an OCTGN deck file. To import a downloaded .o8d deck into ArkhamDB, go to My Decks and click Import Deck, then File.')}</p>
            </div>
        </div>
    )
}

export default SettingsExport
