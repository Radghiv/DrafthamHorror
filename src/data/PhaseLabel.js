import DraftPhases from './DraftPhases'
import { t } from '../i18n'

// Name of the draft phase shown in the top bar
function phaseLabel(phase, draftType, currentLevel0Name) {
    switch (phase) {
        case DraftPhases.BuildPhase1:
        case DraftPhases.BuildPhase2:
        case DraftPhases.BuildPhase3:
            return draftType === 'phaseDraft' ? t('Deck creation - Stage {stage}', { stage: phase }) : t('Deck creation')
        case DraftPhases.BuildUpgradePhase:
            return t('Deck creation upgrades')
        case DraftPhases.UpgradeLevel0SwapPhase:
            return t('Level 0 swaps')
        case DraftPhases.UpgradeLevel0AddPhase:
            return currentLevel0Name ? t('Card replacements - {name}', { name: currentLevel0Name }) : t('Card replacements')
        case DraftPhases.UpgradePhase:
            return t('Deck upgrades')
        case DraftPhases.VersatilePhase:
            return t('Versatile, any class')
        default:
            return ''
    }
}

export default phaseLabel
