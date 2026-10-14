import { cardImageUrls } from './data/CardImages'

// The pictures of the cards kept on the device, in the Cache Storage of the browser (a cache named card-images, which the service worker also
// fills with every picture the app shows: see vite.config.js). The pictures come from other sites that don't allow reading them, so what is
// saved are "opaque" answers: they can be counted and shown from the cache, but their size can't be known. Without Cache Storage (private
// mode, an insecure page) there is simply no saved picture.

export const IMAGE_CACHE = 'card-images'

const PLAYER_TYPES = ['asset', 'event', 'skill']

export function imageCacheAvailable() {
    return typeof window !== 'undefined' && 'caches' in window
}

// The addresses of the pictures the drafts can show for the packs of the collection: the front of every player card and investigator, and the
// back of the investigators (the first address of each, the one the app tries first). Reprints and hidden cards are left out.
export function collectionImageUrls(cardData, collection) {
    const urls = new Set()

    if (!cardData) return []

    cardData.forEach(card => {
        if (card.hidden || card.duplicate_of_code || !collection[card.pack_code]) return

        const investigator = card.type_code === 'investigator'

        if (!investigator && !(PLAYER_TYPES.includes(card.type_code) && card.faction_code !== 'mythos')) return

        const front = cardImageUrls(card, 'front')[0]

        if (front) urls.add(front)

        if (investigator) {
            const back = cardImageUrls(card, 'back')[0]

            if (back) urls.add(back)
        }
    })

    return Array.from(urls)
}

// The addresses that are saved, as a set (empty when the cache can't be read)
export async function savedImageUrls() {
    if (!imageCacheAvailable()) return new Set()

    try {
        const cache = await window.caches.open(IMAGE_CACHE)
        const requests = await cache.keys()

        return new Set(requests.map(request => request.url))
    }
    catch (e) {
        return new Set()
    }
}

export async function deleteSavedImages() {
    if (!imageCacheAvailable()) return

    try {
        await window.caches.delete(IMAGE_CACHE)
    }
    catch (e) {
        // nothing to delete
    }
}

// Whether the picture loads (a missing picture would otherwise be saved as the error page that answers for it: an opaque answer can't be
// told from a good one)
function pictureLoads(url) {
    return new Promise(resolve => {
        const image = new Image()

        image.onload = () => resolve(true)
        image.onerror = () => resolve(false)
        image.src = url
    })
}

// Saves the pictures that are not saved yet, a few at a time, telling how it goes after each one: onProgress({ done, failed, total }).
// shouldStop() is asked before each picture. Returns { done, failed }.
export async function downloadImages(urls, onProgress, shouldStop, parallel = 4) {
    const total = urls.length
    let done = 0
    let failed = 0
    let next = 0

    if (!imageCacheAvailable() || total === 0) return { done: done, failed: failed }

    const cache = await window.caches.open(IMAGE_CACHE)

    async function worker() {
        while (next < total && !(shouldStop && shouldStop())) {
            const url = urls[next++]

            try {
                if (!(await pictureLoads(url))) throw new Error('no picture')

                await cache.put(url, await fetch(url, { mode: 'no-cors' }))
                done++
            }
            catch (e) {
                failed++
            }

            if (onProgress) onProgress({ done: done, failed: failed, total: total })
        }
    }

    await Promise.all(Array.from({ length: parallel }, worker))

    return { done: done, failed: failed }
}
