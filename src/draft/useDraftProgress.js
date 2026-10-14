import { useSelector } from 'react-redux'

import { calculateDraftTarget } from './DrawDraft'
import { isUpgrade, isLevel0Build } from '../data/DraftPhases'

// How far the draft in progress is: what was drafted so far, what it has to reach and whether that is counted in XP (isUpgrade) or in cards.
function useDraftProgress() {
    const phase = useSelector(state => state.draft.phase)
    const draftTab = useSelector(state => state.settings.draftTab)
    const draftType = useSelector(state => state.settings.draftType)
    const draftProgress = useSelector(state => state.draft.progress)
    const upgradeProgress = useSelector(state => state.draft.upgradeProgress)
    const draftXP = useSelector(state => state.settings.draftXP)
    const deckSize = useSelector(state => state.settings.deckSize)
    const draftCards = useSelector(state => state.settings.draftCards)
    const level0Swaps = useSelector(state => state.draft.level0Swaps)
    const level0Adds = useSelector(state => state.draft.level0Adds)
    const level0Requirements = useSelector(state => state.draft.level0Requirements)

    const draftTarget = calculateDraftTarget({
        draftTab: draftTab,
        draftType: draftType,
        draftXP: draftXP,
        phase: phase,
        deckSize: deckSize,
        draftCards: draftCards,
        level0Swaps: level0Swaps,
        level0Adds: level0Adds,
        level0Requirements: level0Requirements
    })

    const upgrade = isUpgrade(phase)

    return {
        isUpgrade: upgrade,
        value: upgrade ? draftProgress - upgradeProgress : draftProgress,
        target: upgrade ? draftTarget - upgradeProgress : draftTarget,
        isLevel0Build: isLevel0Build(phase)
    }
}

export default useDraftProgress
