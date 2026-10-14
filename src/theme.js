import { loadJSON, saveJSON } from './storage'
import { motionScale } from './components/useMotionScale'

const THEME_KEY = 'draftham.theme'
const THEMES = ['light', 'dark', 'arkham', 'innsmouth']
const DEFAULT_THEME = 'arkham'

export function getTheme() {
    return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME
}

let fadeTimer = null

export function setTheme(theme) {
    const root = document.documentElement
    const scale = motionScale()

    // the colors cross-fade instead of switching at once (the class holds the transitions while they run)
    if (scale > 0) {
        root.classList.add('theme-fade')
        clearTimeout(fadeTimer)
        fadeTimer = setTimeout(() => root.classList.remove('theme-fade'), 400 * scale + 80)
    }

    root.setAttribute('data-theme', theme)
    saveJSON(THEME_KEY, theme)
}

// Applies the stored theme, falling back to the Arkham theme. Called before the first render to avoid a flash.
export function initTheme() {
    const stored = loadJSON(THEME_KEY, null)

    document.documentElement.setAttribute('data-theme', THEMES.includes(stored) ? stored : DEFAULT_THEME)
}
