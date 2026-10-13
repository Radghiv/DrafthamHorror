// Number of level 0 cards still waiting to be drafted (replacements, Adaptable, deck requirements...), counted the same
// way as the Level 0 Draft Options panel
export function pendingLevel0Count(level0Swaps, level0Adds) {
    const count = list => list.reduce((acc, item) => acc + item.count - item.drafted, 0)

    return count(level0Swaps) + count(level0Adds)
}
