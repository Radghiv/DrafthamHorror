// The kinds of product in the recap, in the order they are shown: the core sets, the starter decks, the expansions (the groups with no
// `kind`), the Return to boxes, the promos and print and play
const KINDS = ['core', 'starter', 'expansion', 'return', 'promo', 'printplay']

// What the collection comes to, for the recap: for each chapter, a row per kind it has, with how many are selected out of how many.
// Expansions are counted by group (a campaign or cycle; the ones with only some packs selected are counted apart), everything else by pack;
// the second copy of the core set isn't a pack of its own and isn't counted.
export function summarizeCollection(groups, collection) {
    const chapters = Array.from(new Set(groups.map(group => group.chapter || 1))).sort((a, b) => a - b)

    return {
        chapters: chapters.map(chapter => {
            const rows = KINDS.map(kind => {
                const members = groups.filter(group => (group.chapter || 1) === chapter && (group.kind || 'expansion') === kind)

                if (members.length === 0) return null

                if (kind === 'expansion') {
                    const states = members.map(group => {
                        const selected = group.codes.filter(code => collection[code]).length

                        return selected === 0 ? 'none' : selected === group.codes.length ? 'full' : 'partial'
                    })

                    return { kind: kind, selected: states.filter(state => state === 'full').length, total: members.length, partial: states.filter(state => state === 'partial').length }
                }

                const codes = members.flatMap(group => group.codes).filter(code => code !== 'core2')

                return { kind: kind, selected: codes.filter(code => collection[code]).length, total: codes.length, partial: 0 }
            })

            return { chapter: chapter, rows: rows.filter(Boolean) }
        })
    }
}
