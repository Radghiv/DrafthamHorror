// known issues:
//   Exporting parallel gators (uses regular gator, causing illegal decks) - seems like ArkhamDB is not handling this great
//   level 0 requirements with myriad: level 0 replacements never add more copies than cards left to replace, but other combinations of
//   myriad and the extra deck requirements (Joe Diamond's insights, Lola's factions) have not been checked

import React, { useRef, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { reset, changeSeed } from './features/settings/settingsSlice'
import { fetchCards, fetchTaboo, fetchPacks, changeFetchError } from './features/data/dataSlice'
import { undoLastPick } from './features/draftHistory'
import { clearSavedDraft, clearUndo } from './features/draftState'

import AppHeader from './components/AppHeader'
import SetupWizard from './components/SetupWizard'
import ResumeDraft from './components/ResumeDraft'
import SharedSetup from './components/SharedSetup'
import UpdateNotice from './components/UpdateNotice'
import { newSeed } from './random'
import InvestigatorPick from './components/InvestigatorPick'
import CardPreview from './components/CardPreview'
import { DeckLeftColumn, DeckRightColumn, DrawerControls } from './components/DeckSidebar'
import DraftPanel from './components/DraftPanel'
import ExportPanel from './components/ExportPanel'
import UpgradeOptionsPanel from './components/UpgradeOptionsPanel'
import BuildUpgradePanel from './components/BuildUpgradePanel'
import Level0UpgradePanel from './components/Level0UpgradePanel'
import VersatilePanel from './components/VersatilePanel'
import DraftPhases from './data/DraftPhases'
import phaseLabel from './data/PhaseLabel'

import useFlipLayout from './useFlipLayout'
import { useT } from './i18n'

function ArkhamDraft() {
    const t = useT()

    const cardData = useSelector(state => state.data.cardData)
    const tabooData = useSelector(state => state.data.tabooData)
    const fetchError = useSelector(state => state.data.fetchError)
    const draftTab = useSelector(state => state.settings.draftTab)
    const drafting = useSelector(state => state.settings.drafting)
    const draftComplete = useSelector(state => state.settings.complete)
    const deckLoaded = useSelector(state => state.data.deckLoaded)
    const buildXPList = useSelector(state => state.draft.buildXPList)
    const investigatorDrafting = useSelector(state => state.settings.investigatorDrafting)
    const draftPhase = useSelector(state => state.draft.phase)
    const draftType = useSelector(state => state.settings.draftType)
    const currentLevel0Name = useSelector(state => state.draft.currentLevel0Name)
    const undoDepth = useSelector(state => state.settings.undoDepth)

    // what screen readers are told about things that don't change the screen much (an undone pick)
    const [announcement, setAnnouncement] = useState('')

    const dispatch = useDispatch()

    // on narrow screens the side columns are drawers: 'left', 'right' or null
    const [drawer, setDrawer] = useState(null)

    useEffect(() => {
        if (!drawer) return undefined

        function handleKeyDown(event) {
            if (event.key === 'Escape') setDrawer(null)
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [drawer])

    // when the draft completes the panels spread across the width: animate the move
    const layoutRef = useRef(null)
    useFlipLayout(layoutRef, draftComplete)

    function undo() {
        dispatch(undoLastPick)
        setAnnouncement(t('Last pick undone'))
    }

    function retryFetch() {
        dispatch(changeFetchError(false))
        dispatch(fetchCards)
        dispatch(fetchTaboo)
        dispatch(fetchPacks)
    }

    // Restart abandons the draft: nothing is left to undo or to resume later
    function resetApp() {
        clearUndo()
        clearSavedDraft()
        dispatch(reset())
        dispatch(changeSeed(newSeed()))
    }

    // the compact top bar names the current phase
    const inDraft = drafting || draftComplete || deckLoaded || investigatorDrafting
    let headerText = ''
    if (investigatorDrafting) headerText = t('Investigator draft')
    else if (drafting) headerText = phaseLabel(draftPhase, draftType, currentLevel0Name)
    else if (draftComplete) headerText = t('Draft complete')
    else if (deckLoaded) headerText = t('Upgrade draft paused')

    const canUndo = undoDepth > 0 && (drafting || draftComplete || deckLoaded) && !investigatorDrafting

    // Ctrl+Z / Cmd+Z undoes the last pick (outside of text fields, which keep their own undo)
    useEffect(() => {
        if (!canUndo) return undefined

        function handleKeyDown(event) {
            const tag = event.target.tagName

            if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

            if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
                event.preventDefault()
                undo()
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => window.removeEventListener('keydown', handleKeyDown)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canUndo, dispatch])

    let contents = null

    if (fetchError) {
        contents =
            <div className="fetch-error" role="alert">
                <h2>{t('Could not load the card data')}</h2>
                <p>{t("ArkhamDB can't be reached and there is no saved copy of its data in this browser yet. Check your connection and try again.")}</p>
                <button type="button" className="btn btn-primary" onClick={retryFetch}>{t('Try again')}</button>
            </div>
    }
    else if (!cardData || !tabooData) {
        contents =
            <div className='mb10'>
                <p>{t('Loading...')}</p>
            </div>
    }
    else if (investigatorDrafting) {
        contents =
        <div className="draft-layout">
            <div className="draft-main">
                <InvestigatorPick />
            </div>
        </div>
    }
    else if (drafting) {
        contents =
        <div className="draft-layout" ref={layoutRef}>
            <DeckLeftColumn open={drawer === 'left'} onClose={() => setDrawer(null)} />
            <div className="draft-main">
                <DraftPanel />
            </div>
            <DeckRightColumn alwaysShowDraftList={true} open={drawer === 'right'} onClose={() => setDrawer(null)} />
            <DrawerControls drawer={drawer} onChange={setDrawer} />
        </div>
    }
    else if (draftComplete) {
        contents =
        <div className="draft-layout is-complete" ref={layoutRef}>
            <DeckLeftColumn />
            <div className="draft-main">
                <Level0UpgradePanel phase={DraftPhases.UpgradeLevel0SwapPhase} />
                <Level0UpgradePanel phase={DraftPhases.UpgradeLevel0AddPhase} />
                <VersatilePanel />
                {buildXPList.length > 0 ? <BuildUpgradePanel /> : null}
                {draftTab === 'Build Deck' ? <ExportPanel /> : null}
            </div>
            <DeckRightColumn alwaysShowDraftList={true} />
        </div>
    }
    else if (deckLoaded) {
        contents =
        <div className="draft-layout" ref={layoutRef}>
            <DeckLeftColumn open={drawer === 'left'} onClose={() => setDrawer(null)} />
            <div className="draft-main">
                <Level0UpgradePanel phase={DraftPhases.UpgradeLevel0SwapPhase} />
                <Level0UpgradePanel phase={DraftPhases.UpgradeLevel0AddPhase} />
                <VersatilePanel />
                <UpgradeOptionsPanel />
            </div>
            <DeckRightColumn open={drawer === 'right'} onClose={() => setDrawer(null)} />
            <DrawerControls drawer={drawer} onChange={setDrawer} />
        </div>
    }
    else {
        contents = <><ResumeDraft /><SharedSetup /><SetupWizard /></>
    }

    return (
        <div className="App">
            <a className="skip-link" href="#main-content">{t('Skip to the content')}</a>
            <AppHeader compact={inDraft} phaseText={headerText} showCardsPerRow={drafting} onRestart={inDraft ? resetApp : null} onUndo={canUndo ? undo : null} />
            <main id="main-content" tabIndex={-1}>
                {contents}
            </main>
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
            <CardPreview />
            <UpdateNotice />
            <div className="copyright">
                {t('Arkham Horror: The Card Game and all information presented here, both literal and graphical, is copyrighted by Fantasy Flight Games. This website is not produced, endorsed, supported, or affiliated with Fantasy Flight Games.')}
            </div>
        </div>
    )
}

export default ArkhamDraft;
