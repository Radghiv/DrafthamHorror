// The filters of the sealed pool, like the ones of the card search of ArkhamDB: a card has to pass every group that is used, and within a group
// (several classes, several costs...) it only has to match one. The filters hide cards of the pool, they never take them out of it.

export const EMPTY_FILTERS = { text: '', classes: [], types: [], slots: [], costs: [], icons: [], trait: '' }

export const CLASS_FILTERS = ['guardian', 'seeker', 'rogue', 'mystic', 'survivor', 'neutral']
export const TYPE_FILTERS = ['asset', 'event', 'skill']
export const SLOT_FILTERS = ['Hand', 'Arcane', 'Accessory', 'Body', 'Ally', 'Tarot']
// 5 is "5 or more"
export const COST_FILTERS = [0, 1, 2, 3, 4, 5]
export const ICON_FILTERS = ['willpower', 'intellect', 'combat', 'agility', 'wild']

export function hasFilters(filters) {
    return filters.text.trim() !== '' || filters.trait !== '' ||
        filters.classes.length > 0 || filters.types.length > 0 || filters.slots.length > 0 || filters.costs.length > 0 || filters.icons.length > 0
}

// The slots a card takes ("Hand. Arcane", "Hand x2"): the names of the slots
export function slotsOf(card) {
    return card.slot ? card.slot.split('.').map(slot => slot.replace(/\s*x\d+$/i, '').trim()).filter(slot => slot !== '') : []
}

// The traits of a card ("Item. Weapon. Firearm.")
export function traitsOf(card) {
    return card.traits ? card.traits.split('.').map(trait => trait.trim()).filter(trait => trait !== '') : []
}

function factionsOf(card) {
    return [card.faction_code, card.faction2_code, card.faction3_code].filter(Boolean)
}

// Whether a card of the pool passes the filters. info is the card as ArkhamDB has it (the rules text and the skill icons, which the
// card of the pool doesn't carry; may be missing) and name the name in the language shown.
export function matchesFilters(card, info, name, filters) {
    if (filters.classes.length > 0 && !factionsOf(card).some(faction => filters.classes.includes(faction))) return false
    if (filters.types.length > 0 && !filters.types.includes(card.type_code)) return false
    if (filters.slots.length > 0 && !slotsOf(card).some(slot => filters.slots.includes(slot))) return false
    if (filters.costs.length > 0 && !(typeof card.cost === 'number' && filters.costs.includes(Math.min(5, card.cost)))) return false
    if (filters.icons.length > 0 && !filters.icons.some(icon => info && info['skill_' + icon] > 0)) return false
    if (filters.trait !== '' && !traitsOf(card).includes(filters.trait)) return false

    const words = filters.text.toLowerCase().split(/\s+/).filter(word => word !== '')

    if (words.length > 0) {
        const haystack = [card.name, card.subname, name, card.traits, info ? info.text : ''].join(' ').toLowerCase()

        if (!words.every(word => haystack.includes(word))) return false
    }

    return true
}
