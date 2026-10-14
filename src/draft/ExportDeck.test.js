// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'

import ExportDeck, { cardsMissingOctgnIds } from './ExportDeck'

const roland = { code: '01001', name: 'Roland Banks', octgn_id: 'aaaa-1111' }
const daniela = { code: '12001', name: 'Daniela Reyes' }

const cardData = [
    { code: '01006', name: '.38 Special', type_code: 'asset', pack_code: 'core', octgn_id: 'bbbb-2222', xp: 0 },
    { code: '12002', name: "Daniela's Wrench", type_code: 'asset', pack_code: 'core_2026', xp: 0 },
    { code: '12005', name: "Detective's Intuition", subname: 'Hunch', type_code: 'event', pack_code: 'core_2026', xp: 2 },
    { code: '01010', name: 'Dodge', type_code: 'event', pack_code: 'core', octgn_id: 'cccc-3333', xp: 0 }
]

const cardList = [
    { key: '01006', name: '.38 Special', count: 2 },
    { key: '12002', name: "Daniela's Wrench", count: 1 },
    { key: '12005', name: "Detective's Intuition", count: 2 },
    { key: '01010', name: 'Dodge', count: 2 }
]

let files

function read(blob) {
    return new Promise(resolve => {
        const reader = new FileReader()

        reader.onload = () => resolve(reader.result)
        reader.readAsText(blob)
    })
}

beforeEach(() => {
    files = []
    URL.createObjectURL = blob => { files.push(blob); return 'blob:test' }
    HTMLAnchorElement.prototype.click = vi.fn()
})

describe('cardsMissingOctgnIds', () => {
    it('lists the investigator and the cards without an OCTGN id', () => {
        expect(cardsMissingOctgnIds(cardList, cardData, daniela)).toEqual([{ code: '12001', name: 'Daniela Reyes' }, { code: '12002', name: "Daniela's Wrench" }, { code: '12005', name: "Detective's Intuition: Hunch" }])
        expect(cardsMissingOctgnIds(cardList.filter(item => item.key !== '12002' && item.key !== '12005'), cardData, roland)).toEqual([])
    })
})

describe('the .o8d export', () => {
    it('leaves out the cards without an OCTGN id and says which', async () => {
        const result = ExportDeck({ fileType: 'OCTGN', deckTitle: 'Test', investigatorData: roland, cardList: cardList, specialCards: [], cardData: cardData })
        const text = await read(files[0])

        expect(result.omitted).toEqual([{ code: '12002', name: "Daniela's Wrench" }, { code: '12005', name: "Detective's Intuition: Hunch" }])
        expect(text).toContain('id="bbbb-2222"')
        expect(text).toContain('id="cccc-3333"')
        expect(text).not.toContain('id=""')
        expect(text).not.toContain("Wrench")
    })

    it('does not fail for an investigator without an OCTGN id', async () => {
        const result = ExportDeck({ fileType: 'OCTGN', deckTitle: 'Test', investigatorData: daniela, cardList: cardList, specialCards: [], cardData: cardData })
        const text = await read(files[0])

        expect(result.omitted[0]).toEqual({ code: '12001', name: 'Daniela Reyes' })
        expect(text).toContain('<section name="Investigator"')
        expect(text).not.toContain('Daniela Reyes')
    })

    it('keeps every card in the plain text export', async () => {
        const result = ExportDeck({ fileType: 'TXT', deckTitle: 'Test', investigatorData: daniela, cardList: cardList, specialCards: [], cardData: cardData })
        const text = await read(files[0])

        expect(result).toBeUndefined()
        expect(text).toContain("1x Daniela's Wrench (Core Set (2026))")
        expect(text).toContain("2x Detective's Intuition :Hunch [2] (Core Set (2026))")
    })

    it('writes the lines like ArkhamDB does, so its text import reads them', async () => {
        const data = [
            ...cardData.map(card => card.code === '01006' ? { ...card, pack_name: 'Core Set' } : card),
            { code: '07197', name: 'Signum Crucis', type_code: 'skill', pack_code: 'hhg', pack_name: 'Horror in High Gear', xp: 2, octgn_id: 'dddd-4444' },
            { code: '03009', name: 'Sophie', subname: 'Her Pet', type_code: 'treachery', pack_code: 'ptc', pack_name: 'The Path to Carcosa', xp: 0 }
        ]
        const list = [{ key: '07197', name: 'Signum Crucis', count: 1 }, { key: '01006', name: '.38 Special', count: 2 }, { key: '03009', name: 'Sophie', count: 1 }]

        ExportDeck({ fileType: 'TXT', deckTitle: 'Test', investigatorData: roland, cardList: list, specialCards: [], cardData: data })

        const text = await read(files[0])

        expect(text).toContain('1x Signum Crucis [2] (Horror in High Gear)')
        expect(text).toContain('2x .38 Special (Core Set)')
        expect(text).toContain('1x Sophie (Her Pet) (The Path to Carcosa)')
        // one asset: its heading is in the singular
        expect(text).toMatch(/\r\nAsset\r\n\r\n/)
        expect(text).toMatch(/\r\nSkill\r\n\r\n/)
        expect(text).toMatch(/\r\nTreachery\r\n\r\n/)
    })
})
