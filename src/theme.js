import { loadJSON, saveJSON } from './storage'

const THEME_KEY = 'draftham.theme'
const THEMES = ['light', 'dark', 'arkham']

export function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light'
}

export function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
    saveJSON(THEME_KEY, theme)
}

// Applies the stored theme, falling back to the OS preference. Called before the first render to avoid a flash.
export function initTheme() {
    const stored = loadJSON(THEME_KEY, null)
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

    document.documentElement.setAttribute('data-theme', THEMES.includes(stored) ? stored : (prefersDark ? 'dark' : 'light'))
}
