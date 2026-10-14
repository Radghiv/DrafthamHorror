import { loadJSON, saveJSON } from './storage'

// Installing the app: what the browser lets us know about it. Chrome, Edge and the Android browsers tell the page that it can be installed
// (the event beforeinstallprompt, which comes once and early, so it is caught here when the module is loaded, not when a component shows);
// Safari on an iPhone or iPad has no such thing and the user has to use its Share menu.

const DISMISSED_KEY = 'draftham.installDismissed'

// after "Later" the reminder waits this long
const REMIND_AFTER = 30 * 24 * 60 * 60 * 1000

let deferredPrompt = null
const listeners = new Set()

function notify() {
    listeners.forEach(listener => listener())
}

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', event => {
        // the browser's own bar is replaced by our reminder
        event.preventDefault()
        deferredPrompt = event
        notify()
    })

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null
        notify()
    })
}

// Calls listener whenever what can be said about the installation changes; returns the function that stops it
export function subscribeToInstall(listener) {
    listeners.add(listener)

    return () => listeners.delete(listener)
}

// Whether the app is running as an installed app (its own window or full screen), where there is nothing to install
export function isInstalled() {
    if (typeof window === 'undefined') return false

    return Boolean((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true)
}

// Whether the browser can install the app with a click on a button of ours
export function canPromptInstall() {
    return deferredPrompt !== null
}

// Safari on an iPhone or iPad: it can install the app, but only from its Share menu
export function isIosSafari() {
    if (typeof window === 'undefined') return false

    const agent = window.navigator.userAgent
    const ios = /iphone|ipad|ipod/i.test(agent) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    const safari = /safari/i.test(agent) && !/crios|fxios|edgios|chrome|android/i.test(agent)

    return ios && safari
}

// Shows the browser's install dialog; true when the user accepts
export async function promptInstall() {
    if (!deferredPrompt) return false

    const event = deferredPrompt

    deferredPrompt = null
    notify()
    event.prompt()

    const choice = await event.userChoice

    return Boolean(choice) && choice.outcome === 'accepted'
}

// Whether the user said "Later" recently
export function installReminderDismissed() {
    const when = loadJSON(DISMISSED_KEY, 0)

    return typeof when === 'number' && Date.now() - when < REMIND_AFTER
}

export function dismissInstallReminder() {
    saveJSON(DISMISSED_KEY, Date.now())
}
