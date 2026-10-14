import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { startDraft } from '../features/draft/draftSlice'

import BuildChaosSettings from './BuildChaosSettings'
import BuildDraftSettings from './BuildDraftSettings'
import DraftPhases from '../data/DraftPhases'
import { playPanelsLeave } from '../draft/screenTransitions'
import { useT } from '../i18n'

function VersatilePanel(props) {
    const t = useT()

    const level0Adds = useSelector(state => state.draft.level0Adds)
    const draftType = useSelector(state => state.settings.draftType)
    const deckLoaded = useSelector(state => state.data.deckLoaded)

    const phase = DraftPhases.VersatilePhase

    const dispatch = useDispatch()
    const animationSpeed = useSelector(state => state.settings.animationSpeed)

    if (!deckLoaded) return null

    function handleStartDraft() {
        playPanelsLeave(animationSpeed)
        dispatch(startDraft(DraftPhases.VersatilePhase))
    }

    const draftTotal = level0Adds.reduce((acc, a) => {
        if (a.versatileCount) return acc + a.versatileCount - a.versatileDrafted

        return acc
    }, 0)

    if (draftTotal < 1) return null

    let headerText = t('Cards:')
    const level0List = level0Adds.map( (item, index) => {
        let row = null
        if (item.count - item.drafted > 0 && item.versatileCount) {
            row = <div className="fblist" key={index}>
                <label className="fblistleft">{headerText}</label>
                <span className='fblistcenter'>
                    <b>{'+' + (item.versatileCount - item.versatileDrafted)}</b> {item.name}
                </span>
                <span className="fblistright"></span>
            </div>

            headerText = ''
        }

        return row
    })

    let draftSettings = null

    if (draftType === 'chaos') {
        draftSettings = <BuildChaosSettings 
            allowPhased='false'
        />
    }
    else if (draftType === 'draft') {
        draftSettings = <BuildDraftSettings
            phase={phase}
            allowPhased='false'
        />
    }

    const button = <button className="button-rect button-green" onClick={handleStartDraft}>{t('Draft')}</button>

    return (
        <div className='settingsDiv phase-panel'>
            <h3>{t('Level 0 Draft Options')}</h3>
            <h5>{t('Versatile')}</h5>
            <h2 className="draft-quantity">{t('{count} card|{count} cards', { count: draftTotal })}</h2>
            {draftSettings}
            {level0List}
            <div className="description">
                {t('Versatile allows you to draft 1 card from any class.')}  {t('Select "Exclude cards in investigator pool" to force this draft to only include cards not normally available to this investigator.')}
            </div>
            {button}
        </div>
    )
}

export default VersatilePanel