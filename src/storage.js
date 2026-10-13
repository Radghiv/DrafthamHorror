// Thin localStorage wrapper; storage can be unavailable (private mode, blocked site data), so every call is guarded

export function loadJSON(key, fallback) {
    try {
        const raw = window.localStorage.getItem(key)

        return raw === null ? fallback : JSON.parse(raw)
    }
    catch (e) {
        return fallback
    }
}

export function saveJSON(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value))
    }
    catch (e) {
        // ignore, persistence is only a convenience
    }
}

export function removeJSON(key) {
    try {
        window.localStorage.removeItem(key)
    }
    catch (e) {
        // ignore
    }
}
