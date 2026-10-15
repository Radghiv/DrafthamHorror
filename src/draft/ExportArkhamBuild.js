// Export to arkham.build. The site imports decks from a .json file ("Import from JSON files" on its deck list) that has the shape of an ArkhamDB
// deck: the cards as { code: copies } and, in "meta" (a string holding JSON), the choices made when the deck was created. It gives the deck an id of
// its own and works out by itself whether the deck is legal, and the XP.

// The choices of the creation of a deck, as arkham.build (like ArkhamDB) keeps them in the "meta" of the deck: the key of each is the id of the
// deck option that asks for it ("faction_selected" for the secondary class, "deck_size_selected", "option_selected" for the choice of a trait, whose
// value is the id of the option) and the parallel sides of the investigator
export function arkhamBuildMeta(investigatorData, parallel, choices) {
    const meta = {}

    if (parallel) {
        meta.alternate_front = investigatorData.code
        meta.alternate_back = investigatorData.code
    }

    ;(investigatorData.deck_options || []).forEach(option => {
        if (option.deck_size_select) {
            meta[option.id || 'deck_size_selected'] = String(choices.selectedDeckSize || choices.deckSize)
        }
        else if (option.faction_select) {
            if (option.name === 'Secondary Class' && choices.secondaryClass) meta[option.id || 'faction_selected'] = choices.secondaryClass
            else if (option.name === 'Class Choice' && option.id && choices.classChoices && choices.classChoices[option.id]) meta[option.id] = choices.classChoices[option.id]
        }
        else if (option.option_select) {
            const selected = option.option_select.find(item => item.name === choices.traitChoice)

            if (selected) meta[option.id || 'option_selected'] = selected.id
        }
    })

    return meta
}

// A new deck: the investigator, the cards ([{ key, count }]: the signature cards and the weakness too) and the choices of its creation
export function arkhamBuildDeck(props) {
    const { title, investigatorData, parallel, cards, choices, tabooId, description, now } = props

    const slots = {}

    cards.forEach(card => { slots[card.key] = (slots[card.key] || 0) + card.count })

    const date = (now || new Date()).toISOString()

    return {
        id: String((now || new Date()).getTime()),
        date_creation: date,
        date_update: date,
        description_md: description || '',
        exile_string: null,
        ignoreDeckLimitSlots: {},
        // a parallel investigator is the original one with its parallel sides chosen in the meta
        investigator_code: parallel ? (investigatorData.alternate_of_code || investigatorData.code) : investigatorData.code,
        investigator_name: investigatorData.name,
        meta: JSON.stringify(arkhamBuildMeta(investigatorData, parallel, choices)),
        name: title,
        next_deck: null,
        previous_deck: null,
        sideSlots: {},
        slots: slots,
        taboo_id: tabooId || null,
        tags: '',
        version: '0.1',
        xp: null,
        xp_adjustment: null,
        xp_spent: null
    }
}

// ArkhamDB gives an empty list of cards as [] or null
const slotsOrEmpty = slots => (slots && !Array.isArray(slots) ? slots : {})

// The deck that was upgraded, now with the cards of the draft. It is the deck as ArkhamDB gave it (name, notes, meta with the customizations and
// the parallel sides, side deck...) with the cards changed: those that the app does not draft with (the random basic weakness, the story
// assets) stay as they were, and the cards of the deck are the ones it ended with. The XP and the history are for the site to work out, and the
// exile string is dropped: it belongs to the deck that was upgraded, not to this one.
export function arkhamBuildUpgradeDeck(props) {
    const { original, title, mergedList, deckList, now } = props

    const drafted = new Set(deckList.map(card => card.key))
    const slots = {}

    Object.keys(original.slots || {}).forEach(code => {
        if (!drafted.has(code)) slots[code] = original.slots[code]
    })
    mergedList.forEach(card => { slots[card.key] = (slots[card.key] || 0) + card.count })

    const meta = original.meta
    const date = (now || new Date()).toISOString()

    return {
        id: original.id,
        date_creation: original.date_creation || date,
        date_update: date,
        description_md: original.description_md || '',
        exile_string: null,
        ignoreDeckLimitSlots: slotsOrEmpty(original.ignoreDeckLimitSlots),
        investigator_code: original.investigator_code,
        investigator_name: original.investigator_name,
        meta: typeof meta === 'string' ? meta : (meta ? JSON.stringify(meta) : ''),
        name: title || original.name,
        next_deck: null,
        previous_deck: null,
        sideSlots: slotsOrEmpty(original.sideSlots),
        slots: slots,
        taboo_id: original.taboo_id || null,
        tags: original.tags || '',
        version: original.version || '0.1',
        xp: null,
        xp_adjustment: null,
        xp_spent: null
    }
}

// Saves a deck as a .json file
export function downloadArkhamBuildDeck(deck, title) {
    const element = document.createElement('a')
    const file = new Blob([JSON.stringify(deck, null, 2)], { type: 'application/json' })

    element.href = URL.createObjectURL(file)
    element.download = (title || deck.name || 'Deck').replace(/\s/g, '-') + '.json'
    document.body.appendChild(element) // Required for this to work in FireFox
    element.click()
    document.body.removeChild(element)
}
