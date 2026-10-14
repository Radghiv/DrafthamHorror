import { loadJSON, saveJSON } from './storage'

const THEME_KEY = 'draftham.theme'
const THEMES = ['light', 'dark', 'arkham', 'innsmouth']
const DEFAULT_THEME = 'arkham'

export function getTheme() {
    return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME
}

export function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
    saveJSON(THEME_KEY, theme)
}

// Applies the stored theme, falling back to the Arkham theme. Called before the first render to avoid a flash.
export function initTheme() {
    const stored = loadJSON(THEME_KEY, null)

    document.documentElement.setAttribute('data-theme', THEMES.includes(stored) ? stored : DEFAULT_THEME)
}
