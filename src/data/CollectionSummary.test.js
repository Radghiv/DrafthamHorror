import { describe, it, expect } from 'vitest'

import { summarizeCollection } from './CollectionSummary'

const groups = [
    { title: 'Core', codes: ['core', 'core2'], kind: 'core' },
    { title: 'Starter Decks', codes: ['s1', 's2'], kind: 'starter' },
    { title: 'Dunwich', codes: ['d1', 'd2'] },
    { title: 'Carcosa', codes: ['c1'] },
    { title: 'Return to Boxes', codes: ['r1', 'r2'], kind: 'return' },
    { title: 'Promos', codes: ['p1'], kind: 'promo' },
    { title: 'Print & Play', codes: ['pp1', 'pp2'], kind: 'printplay' },
    { title: 'Core 2026', codes: ['core_2026'], chapter: 2, kind: 'core' },
    { title: 'Starter Decks 2026', codes: ['t1'], chapter: 2, kind: 'starter' }
]

describe('summarizeCollection', () => {
    it('counts expansions by campaign and everything else by pack, per chapter, in the order of the recap', () => {
        const summary = summarizeCollection(groups, { core: 1, core2: 1, s1: 1, s2: 1, d1: 1, c1: 1, r1: 1, pp1: 1, pp2: 1, core_2026: 1 })

        expect(summary.chapters.map(chapter => chapter.chapter)).toEqual([1, 2])
        expect(summary.chapters[0].rows).toEqual([
            { kind: 'core', selected: 1, total: 1, partial: 0 },
            { kind: 'starter', selected: 2, total: 2, partial: 0 },
            { kind: 'expansion', selected: 1, total: 2, partial: 1 },
            { kind: 'return', selected: 1, total: 2, partial: 0 },
            { kind: 'promo', selected: 0, total: 1, partial: 0 },
            { kind: 'printplay', selected: 2, total: 2, partial: 0 }
        ])
        expect(summary.chapters[1].rows).toEqual([
            { kind: 'core', selected: 1, total: 1, partial: 0 },
            { kind: 'starter', selected: 0, total: 1, partial: 0 }
        ])
    })

    it('leaves the second copy of the core set out of the count', () => {
        const rows = summarizeCollection(groups, { core: 1, core2: 1 }).chapters[0].rows
        const withoutCopy = summarizeCollection(groups, { core: 1 }).chapters[0].rows

        expect(rows[0]).toEqual({ kind: 'core', selected: 1, total: 1, partial: 0 })
        expect(withoutCopy[0]).toEqual(rows[0])
    })

    it('has only the chapters there are groups for, and none without groups', () => {
        expect(summarizeCollection([{ title: 'Core', codes: ['core'], kind: 'core' }], {}).chapters).toEqual([{ chapter: 1, rows: [{ kind: 'core', selected: 0, total: 1, partial: 0 }] }])
        expect(summarizeCollection([], {}).chapters).toEqual([])
    })
})
