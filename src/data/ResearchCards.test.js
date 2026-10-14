import { describe, it, expect } from 'vitest'

import { researchConnected } from './ResearchCards'

const cards = [
    { code: '02021', name: 'Strange Solution', subname: 'Unidentified', text: '[action] Test [intellect] (4).' },
    { code: '02263', name: 'Strange Solution', subname: 'Acidic Ichor', text: 'Researched. Uses (3 supplies).' },
    { code: '02262', name: 'Strange Solution', subname: 'Restorative Concoction', text: 'Researched. Uses (4 supplies).' },
    { code: '09999', name: 'Strange Solution', subname: 'Reprint', text: 'Researched.', duplicate_of_code: '02262' },
    { code: '01043', name: 'Cryptic Research', text: 'Fast.' },
    { code: '01543', name: 'Cryptic Research', text: 'Fast.' }
]

describe('researchConnected', () => {
    it('gives the researched versions for the card to research', () => {
        expect(researchConnected(cards[0], cards).map(card => card.code)).toEqual(['02262', '02263'])
    })

    it('gives the card to research first, then the other researched versions, for a researched one', () => {
        expect(researchConnected(cards[1], cards).map(card => card.code)).toEqual(['02021', '02262'])
    })

    it('gives nothing for a card that is not in a research family', () => {
        expect(researchConnected(cards[4], cards)).toEqual([])
        expect(researchConnected(null, cards)).toEqual([])
        expect(researchConnected(cards[0], null)).toEqual([])
    })
})
