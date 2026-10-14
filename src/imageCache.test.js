// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { collectionImageUrls, savedImageUrls, deleteSavedImages, downloadImages, rememberImage, startRememberingImages, subscribeToSavedImages, IMAGE_CACHE } from './imageCache'

const card = (code, extra) => ({ code, name: 'Card ' + code, type_code: 'asset', faction_code: 'guardian', pack_code: 'core', imagesrc: '/bundles/cards/' + code + '.png', ...extra })

describe('collectionImageUrls', () => {
    it('lists the front of the player cards and investigators of the collection, and the back of the investigators', () => {
        const cards = [
            card('01'),
            card('02', { type_code: 'event' }),
            card('03', { type_code: 'investigator', backimagesrc: '/bundles/cards/03b.png' }),
            card('04', { pack_code: 'rcore', duplicate_of_code: '01' }),
            card('05', { hidden: true }),
            card('06', { faction_code: 'mythos' }),
            card('07', { type_code: 'enemy' }),
            card('08', { pack_code: 'dwl' })
        ]
        const urls = collectionImageUrls(cards, { core: 1, rcore: 1, dwl: 0 })

        expect(urls).toEqual([
            'https://www.arkhamdb.com/bundles/cards/01.png',
            'https://www.arkhamdb.com/bundles/cards/02.png',
            'https://www.arkhamdb.com/bundles/cards/03.png',
            'https://www.arkhamdb.com/bundles/cards/03b.png'
        ])
    })

    it('gives nothing without card data', () => {
        expect(collectionImageUrls(null, {})).toEqual([])
    })
})

describe('the picture cache', () => {
    let store

    beforeEach(() => {
        store = new Map()

        const cache = {
            put: async (url, response) => { store.set(url, response) },
            match: async url => store.get(url),
            keys: async () => Array.from(store.keys()).map(url => ({ url: url }))
        }

        window.caches = { open: async name => { expect(name).toBe(IMAGE_CACHE); return cache }, delete: async () => { store.clear(); return true } }
        window.fetch = vi.fn(async () => ({ type: 'opaque' }))
        // a picture whose address has "bad" in it doesn't load
        window.Image = class { set src(url) { setTimeout(() => (/bad/.test(url) ? this.onerror() : this.onload()), 0) } }
    })

    it('saves the pictures that load, counts the others as failed and reports the progress', async () => {
        const progress = []
        const result = await downloadImages(['https://x/1.png', 'https://x/bad.png', 'https://x/2.png'], state => progress.push({ ...state }), undefined, 2)

        expect(result).toEqual({ done: 2, failed: 1 })
        expect(progress[progress.length - 1]).toEqual({ done: 2, failed: 1, total: 3 })
        expect(Array.from(await savedImageUrls()).sort()).toEqual(['https://x/1.png', 'https://x/2.png'])
        expect(window.fetch).toHaveBeenCalledWith('https://x/1.png', { mode: 'no-cors' })
    })

    it('stops when asked to', async () => {
        let asked = 0
        const result = await downloadImages(['https://x/1.png', 'https://x/2.png', 'https://x/3.png'], undefined, () => ++asked > 1, 1)

        expect(result.done).toBe(1)
    })

    it('deletes every saved picture', async () => {
        await downloadImages(['https://x/1.png'], undefined, undefined, 1)
        await deleteSavedImages()

        expect((await savedImageUrls()).size).toBe(0)
    })

    it('saves a picture that is shown, once, and tells the ones that follow', async () => {
        let saved = 0
        const stop = subscribeToSavedImages(() => { saved++ })

        rememberImage('https://www.arkhamdb.com/bundles/cards/09.png')
        rememberImage('https://www.arkhamdb.com/bundles/cards/09.png')
        await new Promise(resolve => setTimeout(resolve, 20))
        stop()

        expect(Array.from(await savedImageUrls())).toEqual(['https://www.arkhamdb.com/bundles/cards/09.png'])
        expect(window.fetch).toHaveBeenCalledTimes(1)
        expect(saved).toBe(1)
    })

    it('saves the card pictures that load in the page, and nothing else', async () => {
        const stop = startRememberingImages()
        const card = document.createElement('img')
        const other = document.createElement('img')

        card.setAttribute('src', 'https://cdn.arkham.build/optimized/01001.webp')
        other.setAttribute('src', 'https://example.com/logo.png')
        document.body.appendChild(card)
        document.body.appendChild(other)
        card.dispatchEvent(new Event('load'))
        other.dispatchEvent(new Event('load'))
        await new Promise(resolve => setTimeout(resolve, 20))
        stop()

        expect(Array.from(await savedImageUrls())).toEqual(['https://cdn.arkham.build/optimized/01001.webp'])
    })
})
