// The box art behind the groups of packs of the Collection step (the pictures are in assets/boxes, see SOURCES.md there). A group takes the
// boxes of the first of its packs that is in the map; a group with none keeps the art of its first investigator.
const FILES = import.meta.glob('../assets/boxes/*.webp', { eager: true, query: '?url', import: 'default' })

// row: how several boxes of a group are laid out side by side (long boxes, or tall decks)
const BOXES = {
    core: { files: ['arkham-horror-the-card-game-revised-core-set'] },
    dwl: { files: ['the-dunwich-legacy-campaign-expansion'] },
    ptc: { files: ['the-path-to-carcosa-campaign-expansion'] },
    tfa: { files: ['the-forgotten-age-campaign-expansion'] },
    tcu: { files: ['the-circle-undone-campaign-expansion'] },
    tde: { files: ['the-dream-eaters-campaign-expansion'] },
    tic: { files: ['the-innsmouth-conspiracy-campaign-expansion'] },
    eoep: { files: ['edge-of-the-earth-campaign-expansion'] },
    tskp: { files: ['the-scarlet-keys-investigator-expansion'] },
    fhvp: { files: ['the-feast-of-hemlock-vale-campaign-expansion'] },
    tdcp: { files: ['the-drowned-city-campaign-expansion'] },
    rtnotz: { files: ['return-to-the-night-of-the-zealot', 'return-to-the-dunwich-legacy', 'return-to-the-path-to-carcosa', 'return-to-the-forgotten-age', 'return-to-the-circle-undone'], row: 'long' },
    nat: { files: ['nathaniel-cho-investigator-starter-deck', 'harvey-walters-investigator-starter-deck', 'winifred-habbamock-investigator-starter-deck', 'jacqueline-fine-investigator-starter-deck', 'stella-clark-investigator-starter-deck'], row: 'tall' },
    blbe: { files: ['the-blob-that-ate-everything'] },
    core_2026: { files: ['arkham-horror-the-card-game'] },
    tom: { files: ['tommy-muldoon-investigator-deck', 'carolyn-fern-investigator-deck', 'andre-patel-investigator-deck', 'marie-lambeau-investigator-deck', 'miguel-de-la-cruz-investigator-deck'], row: 'tall' }
}

// The pictures of the boxes of a group of packs: { urls, row } (urls is empty when there are none)
export function boxArtFor(codes) {
    const code = codes.find(item => BOXES[item])

    if (!code) return { urls: [], row: null }

    return { urls: BOXES[code].files.map(name => FILES['../assets/boxes/' + name + '.webp']).filter(Boolean), row: BOXES[code].row || null }
}
