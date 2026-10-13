import { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeDeckLoaded } from '../../features/data/dataSlice'
import { startDraft } from '../../features/draft/draftSlice'
import { confirmCollection, setUpgradeAfterLevel0 } from '../../features/settings/settingsSlice'
import { startInvestigatorDraft, eligibleInvestigators } from '../../features/settings/investigatorActions'
import useInvestigatorEntries from '../useInvestigatorEntries'
import { pendingLevel0Count } from '../../draft/Level0'
import DraftPhases from '../../data/DraftPhases'
import { seedRandom } from '../../random'

// Shared by every "Start" button in the setup flow
function useStartDraft() {
    const draftTab = useSelector(state => state.settings.draftTab)
    const seed = useSelector(state => state.settings.seed)
    const deckID = useSelector(state => state.settings.deckID)
    const filteredCount = useSelector(state => state.settings.filteredCount)
    const deckSize = useSelector(state => state.settings.deckSize)
    const investigatorMode = useSelector(state => state.settings.investigatorMode)
    const investigatorDraftOptions = useSelector(state => state.settings.investigatorDraftOptions)
    const cardData = useSelector(state => state.data.cardData)
    const investigatorEntryList = useInvestigatorEntries()
    const deckFetchError = useSelector(state => state.data.deckFetchError)
    const deckValidation = useSelector(state => state.data.deckValidation)
    const draftOrder = useSelector(state => state.settings.draftOrder)
    const level0Swaps = useSelector(state => state.draft.level0Swaps)
    const level0Adds = useSelector(state => state.draft.level0Adds)

    const dispatch = useDispatch()

    const isUpgradeTab = draftTab === 'Upgrade'

    // taking the investigator from an ArkhamDB deck needs the deck to have been validated
    const needsDeck = investigatorMode === 'arkhamdb' && !(deckValidation.status === 'valid' && deckValidation.id === deckID.trim())

    // approximate: assume 2 copies of each card, want at least 2 extra. A drafted investigator isn't known yet, so it can't be checked.
    const enoughCards = investigatorMode === 'draft' || isUpgradeTab || (filteredCount - 2) * 2 > deckSize

    // an investigator draft whose options leave no investigator to choose from can't start
    const eligibleCount = useMemo(() => investigatorMode === 'draft' ? eligibleInvestigators(investigatorEntryList, cardData, investigatorDraftOptions).length : 0,
        [investigatorMode, cardData, investigatorDraftOptions, investigatorEntryList])
    const noInvestigators = investigatorMode === 'draft' && eligibleCount === 0

    const canStart = enoughCards && !needsDeck && !noInvestigators

    function start() {
        // the same seed deals the same cards
        seedRandom(seed)

        // starting a draft means the collection is good enough, so redrafting can skip that step
        dispatch(confirmCollection())

        if (investigatorMode === 'draft') {
            // the investigator is drafted first; the deck draft starts once one is picked
            dispatch(startInvestigatorDraft)
        }
        else if (isUpgradeTab && investigatorMode === 'arkhamdb') {
            // the deck was loaded when it was validated
            dispatch(changeDeckLoaded(true))

            if (draftOrder === 'level0' && pendingLevel0Count(level0Swaps, level0Adds) > 0) {
                // level 0 replacements first; the upgrade draft starts when they are done
                dispatch(setUpgradeAfterLevel0(true))
                dispatch(startDraft(DraftPhases.UpgradeLevel0AddPhase))
            }
            else {
                dispatch(startDraft(DraftPhases.UpgradePhase))
            }
        }
        else {
            dispatch(startDraft(isUpgradeTab ? DraftPhases.UpgradePhase : DraftPhases.BuildPhase1))
        }
    }

    return { start, enoughCards, needsDeck, noInvestigators, eligibleCount, canStart, deckFetchError }
}

export default useStartDraft
