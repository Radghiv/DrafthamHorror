import { cardImageUrls } from './data/CardImages'

// The pictures of the cards kept on the device, in the Cache Storage of the browser (a cache named card-images, which the service worker also
// fills with every picture the app shows: see vite.config.js). The pictures come from other sites that don't allow reading them, so what is
// saved are "opaque" answers: they can be counted and shown from the cache, but their size can't be known. Without Cache Storage (private
// mode, an insecure page) there is simply no saved picture.

export const IMAGE_CACHE = 'card-images'

// The addresses of the card pictures (ArkhamDB's and arkham.build's); the same pattern is the route of the service worker in vite.config.js
export const IMAGE_URL_PATTERN = /^https:\/\/(www\.arkhamdb\.com\/bundles\/cards\/|cdn\.arkham\.build\/).*\.(png|jpe?g|webp)$/i

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

// ---- Saving the pictures the app shows. The service worker does it too, but only in the published app and once the newest version is in
// charge (the first visit, a version waiting for "Reload"), so the app saves what it shows itself: every card picture that loads on the
// screen is also put in the cache (it is in the HTTP cache of the browser by then, so this costs no new download).

// the addresses already looked at or being saved in this visit
const known = new Set()
const waiting = []
let saving = 0
const listeners = new Set()

// Calls listener each time a picture has been saved; returns the function that stops it
export function subscribeToSavedImages(listener) {
    listeners.add(listener)

    return () => listeners.delete(listener)
}

async function saveOne(url) {
    try {
        const cache = await window.caches.open(IMAGE_CACHE)

        if (await cache.match(url)) return

        // the picture loaded, so this is a picture and not the error page that answers for a missing one
        await cache.put(url, await fetch(url, { mode: 'no-cors' }))
        listeners.forEach(listener => listener())
    }
    catch (e) {
        // not essential: it is tried again the next time the picture shows
        known.delete(url)
    }
}

// one picture at a time of the few that are saved at once
function saveAndGoOn(url) {
    saving++
    saveOne(url).finally(() => {
        saving--
        drain()
    })
}

// a few at a time, so a screen full of pictures doesn't start as many requests at once
function drain() {
    while (saving < 3 && waiting.length > 0) saveAndGoOn(waiting.shift())
}

export function rememberImage(url) {
    if (!imageCacheAvailable() || known.has(url)) return

    known.add(url)
    waiting.push(url)
    drain()
}

// Starts saving every card picture that loads in the page; returns the function that stops it
export function startRememberingImages() {
    if (typeof document === 'undefined') return () => {}

    // a load event doesn't bubble, so it is caught on the way down
    function handleLoad(event) {
        const image = event.target

        if (image && image.tagName === 'IMG') {
            const url = image.currentSrc || image.src

            if (IMAGE_URL_PATTERN.test(url)) rememberImage(url)
        }
    }

    document.addEventListener('load', handleLoad, true)

    return () => document.removeEventListener('load', handleLoad, true)
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

    known.clear()

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
                known.add(url)
                listeners.forEach(listener => listener())
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
