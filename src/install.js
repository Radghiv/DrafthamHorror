// Installing the app: what the browser lets us know about it. Chrome, Edge and the Android browsers tell the page that it can be installed
// (the event beforeinstallprompt, which comes once and early, so it is caught here when the module is loaded, not when a component shows);
// Safari on an iPhone or iPad has no such thing and the user has to use its Share menu.

let deferredPrompt = null
// the install dialog was shown and closed without installing: the browser doesn't offer it again at once, but its menu still can
let promptDismissed = false
const listeners = new Set()

function notify() {
    listeners.forEach(listener => listener())
}

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', event => {
        // the browser's own bar is replaced by our button
        event.preventDefault()
        deferredPrompt = event
        promptDismissed = false
        notify()
    })

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null
        promptDismissed = false
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

// Whether the install dialog was closed without installing (the browser's menu can still install the app)
export function installPromptDismissed() {
    return promptDismissed
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
    event.prompt()

    const choice = await event.userChoice
    const accepted = Boolean(choice) && choice.outcome === 'accepted'

    promptDismissed = !accepted
    notify()

    return accepted
}
