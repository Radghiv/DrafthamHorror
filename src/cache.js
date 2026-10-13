// A small cache of what is fetched from ArkhamDB, in IndexedDB (the card list is too big for localStorage). It makes later visits start
// at once and lets the app work when ArkhamDB can't be reached. Like storage.js, every call is guarded: without IndexedDB (private
// mode, blocked site data) there is simply no cache.

const DB_NAME = 'draftham'
const STORE = 'cache'

function openDatabase() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error('IndexedDB is not available'))
            return
        }

        const request = window.indexedDB.open(DB_NAME, 1)

        request.onupgradeneeded = () => request.result.createObjectStore(STORE)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

// What was saved under the key, as { savedAt, data }, or null
export async function readCache(key) {
    try {
        const db = await openDatabase()

        return await new Promise(resolve => {
            const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)

            request.onsuccess = () => resolve(request.result || null)
            request.onerror = () => resolve(null)
        })
    }
    catch (e) {
        return null
    }
}

// Saves data under the key. The data is copied when this is called, so it can be handed to the store right after.
export async function writeCache(key, data) {
    try {
        const db = await openDatabase()

        db.transaction(STORE, 'readwrite').objectStore(STORE).put({ savedAt: Date.now(), data: data }, key)
    }
    catch (e) {
        // the cache is only a convenience
    }
}

// Deletes every entry whose key is not kept by the test (the copies saved by an older version of the app)
export async function pruneCache(keep) {
    try {
        const db = await openDatabase()
        const store = db.transaction(STORE, 'readwrite').objectStore(STORE)
        const request = store.getAllKeys()

        request.onsuccess = () => request.result.forEach(key => {
            if (!keep(key)) store.delete(key)
        })
    }
    catch (e) {
        // the cache is only a convenience
    }
}

// Deletes everything; the next visit fetches it all again
export async function clearCache() {
    try {
        const db = await openDatabase()

        await new Promise(resolve => {
            const transaction = db.transaction(STORE, 'readwrite')

            transaction.objectStore(STORE).clear()
            transaction.oncomplete = () => resolve()
            transaction.onerror = () => resolve()
        })
    }
    catch (e) {
        // nothing to clear
    }
}

