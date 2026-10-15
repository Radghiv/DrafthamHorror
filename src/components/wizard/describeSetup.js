import { t, msg, formatDate, LONG_DATE } from '../../i18n'

const CLASS_NAMES = {
    guardian: msg('Guardian'),
    seeker: msg('Seeker'),
    rogue: msg('Rogue'),
    mystic: msg('Mystic'),
    survivor: msg('Survivor'),
    neutral: msg('Neutral'),
    multiclass: msg('Multiclass')
}

function className(code) {
    return CLASS_NAMES[code] ? t(CLASS_NAMES[code]) : capitalize(code)
}

function capitalize(text) {
    return text ? text[0].toUpperCase() + text.slice(1) : ''
}

// Plain-text descriptions of the current setup, shared by the summary sidebar, the stepper and the review step. The texts are translated
// when this runs, so the components that show them have to render again when the language changes (they call useT()).
function describeSetup(settings, tabooData, collection) {
    const investigatorData = settings.investigatorData
    const isUpgradeTab = settings.draftTab === 'Upgrade'

    let investigatorName = settings.parallel ? t('{name} (Parallel)', { name: settings.investigator }) : settings.investigator
    if (settings.investigator === 'Agatha Crane') investigatorName = t('{name} ({details})', { name: settings.investigator, details: className(settings.primaryClass) })

    // nothing chosen yet (the investigator of a deck from ArkhamDB comes with the deck)
    if (!investigatorData) investigatorName = t('Not chosen yet')

    const factionCode = investigatorData ? (investigatorData.faction2_code ? 'multiclass' : investigatorData.faction_code) : 'neutral'
    const faction = className(factionCode)
    const classLine = !investigatorData ? '' : settings.secondaryClass ? t('{class} · {secondary} secondary', { class: faction, secondary: className(settings.secondaryClass) }) : faction

    let tabooLabel = t('None')
    if (tabooData && settings.selectedTaboo) {
        const index = tabooData.findIndex(item => item.id === settings.selectedTaboo)

        if (index >= 0) tabooLabel = index === tabooData.length - 1 ? t('Latest list') : formatDate(settings.language, tabooData[index].date_start, LONG_DATE)
    }

    const deckSize = settings.selectedDeckSize ? settings.selectedDeckSize : settings.deckSize
    const phaseIndex = isUpgradeTab ? 6 : 0

    let draftRules
    if (settings.draftType === 'chaos') draftRules = t('Standard chaos')
    else if (settings.draftType === 'phaseDraft') draftRules = t('Draft in stages')
    else if (!isUpgradeTab && settings.deckbuilding === 'sealed') draftRules = settings.sealedCopies ? t('Sealed, pool of {count}, two copies allowed', { count: settings.sealedCount }) : t('Sealed, pool of {count}', { count: settings.sealedCount })
    else if (isUpgradeTab) draftRules = t('Simple draft, pick from {count}', { count: settings.draftCount[phaseIndex] })
    else draftRules = t('Simple draft, pick from {count}, myriad adds {myriad}', { count: settings.draftCount[phaseIndex], myriad: settings.myriadCount })

    const drafted = settings.investigatorMode === 'draft'

    return {
        investigatorMode: settings.investigatorMode,
        investigatorName: drafted ? t('To be drafted') : investigatorName,
        factionCode: factionCode,
        classLine: drafted ? t('One of {count} random investigators', { count: settings.investigatorDraftOptions.count }) : classLine,
        tabooLabel: tabooLabel,
        // the size of the deck is the investigator's: until one is chosen (or drafted) there is none to tell
        deckSizeLabel: isUpgradeTab ? t('{xp} XP to spend', { xp: settings.draftXP }) : investigatorData ? t('{count} cards', { count: deckSize }) : t('Set by the investigator'),
        hasInvestigator: Boolean(investigatorData),
        draftRules: draftRules,
        confirmLabel: settings.confirmDraft ? t('Confirm each pick') : t('Draft on first click'),
        // the same, to follow the rules in a sentence
        confirmPhrase: settings.confirmDraft ? t('confirm each pick') : t('draft on first click'),
        isUpgradeTab: isUpgradeTab
    }
}

export default describeSetup
