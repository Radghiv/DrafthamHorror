import { msg } from '../i18n'

// Draft types the UI currently offers. The engine still supports every type, so re-enabling one is just a flag flip here.
const DraftModes = [
    { key: 'chaos', label: msg('Standard chaos'), enabled: false, upgrade: true },
    { key: 'draft', label: msg('Simple draft'), enabled: true, upgrade: true },
    { key: 'phaseDraft', label: msg('Draft in stages'), enabled: false, upgrade: false }
]

export function isDraftTypeEnabled(key) {
    return DraftModes.some(mode => mode.key === key && mode.enabled)
}

export function enabledDraftModes(isUpgradeTab) {
    return DraftModes.filter(mode => mode.enabled && (!isUpgradeTab || mode.upgrade))
}

export default DraftModes
