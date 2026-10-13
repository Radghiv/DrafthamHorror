// The random numbers of the draft. Once a seed is set the sequence is always the same (the same setup and seed deal the same cards,
// which is what makes a draft shareable); without one it is Math.random.

let state = null

// xmur3: turns any text into a 32-bit number
function hashText(text) {
    let hash = 1779033703 ^ text.length

    for (let i = 0; i < text.length; i++) {
        hash = Math.imul(hash ^ text.charCodeAt(i), 3432918353)
        hash = (hash << 13) | (hash >>> 19)
    }

    hash = Math.imul(hash ^ (hash >>> 16), 2246822507)
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909)

    return (hash ^ (hash >>> 16)) >>> 0
}

// A short random seed, easy to read out loud (no letters that look alike)
export function newSeed() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let seed = ''

    for (let i = 0; i < 6; i++) seed += alphabet[Math.floor(Math.random() * alphabet.length)]

    return seed
}

export function seedRandom(seed) {
    state = hashText(String(seed).trim().toUpperCase())
}

// mulberry32
export function random() {
    if (state === null) return Math.random()

    state = (state + 0x6D2B79F5) >>> 0

    let t = state

    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// Where the sequence is, so undoing or resuming a draft carries on from the same point
export function getRandomState() {
    return state
}

export function setRandomState(value) {
    if (value === null || typeof value === 'number') state = value
}
