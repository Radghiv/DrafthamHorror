import { ease, mix, runFrames, primaryWithAlpha } from './flyCard'
import { copyOf } from './screenTransitions'
import { motionSpeed } from '../data/AnimationSpeed'

const DURATION = 800

function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// is the element drawn, and at least partly on the screen?
function onScreen(element) {
    if (!element || window.getComputedStyle(element).display === 'none') return false

    const rect = element.getBoundingClientRect()

    return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < window.innerWidth && rect.bottom > 0 && rect.top < window.innerHeight
}

// The flight of an investigator's card from one screen to the draft screen that follows. `backdrop` is the copy of the old screen, which fades
// out (null when there is none), and `source` the copy of the card, fixed where it was and already on the page (null for a screen change
// with no card to fly: the draft screen just fades in). Returns { land, cancel }: land() goes in the next frame after the new screen is drawn.
function launch(source, from, backdrop, speed) {
    const duration = DURATION / speed

    if (backdrop) backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration * 0.55, easing: 'ease-in', fill: 'forwards' }).onfinish = () => backdrop.remove()

    // the draft screen fades in while this is on (see "investigator-flight" in styles.css)
    document.documentElement.classList.add('investigator-flight')

    let stop = null
    let target = null
    let finished = false
    let timer = null

    function finish() {
        if (finished) return

        finished = true
        clearTimeout(timer)
        if (source) source.remove()
        if (backdrop) backdrop.remove()
        document.documentElement.classList.remove('investigator-flight', 'resume-flight')

        if (target) target.style.opacity = ''
    }

    return {
        land: () => {
            if (!source) {
                // long enough for the reveal of the investigator of the new screen (see "resume-flight" in styles.css)
                timer = setTimeout(finish, duration * 1.1)

                return
            }

            // where it goes: the investigator of the left column; with the column in a drawer (or none, on a phone) toward the button that opens it
            const place = document.querySelector('#draft-left-panel .investigator-div')

            if (onScreen(place)) {
                target = place
                target.style.opacity = '0'

                stop = runFrames(duration, t => {
                    // measured on every frame: the page may be scrolling to the top
                    const to = target.getBoundingClientRect()
                    const p = ease(t)

                    source.style.transform = 'translate(' + (to.left - from.left) * p + 'px, ' + (to.top - from.top) * p + 'px) scale(' + mix(1, to.width / from.width, p) + ')'
                    source.style.boxShadow = '0 ' + 16 * (1 - p) + 'px ' + 40 * (1 - p) + 'px rgba(0, 0, 0, ' + 0.5 * (1 - p) + ')'
                }, () => {
                    const arrived = target

                    finish()
                    arrived.animate([{ boxShadow: '0 0 0 0 ' + primaryWithAlpha('e6') }, { boxShadow: '0 0 0 12px ' + primaryWithAlpha('00') }], { duration: 500 / speed, easing: 'ease-out' })
                })

                return
            }

            const button = [document.querySelector('[data-investigator-target]'), document.querySelector('.drawer-tab-left')].find(onScreen)

            if (!button) {
                source.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration / 2, easing: 'ease-in', fill: 'forwards' }).onfinish = finish
                return
            }

            // no column to land on: the card shrinks toward the button that opens it
            const scale = Math.max(0.08, Math.min(0.2, 40 / from.width))

            stop = runFrames(duration, t => {
                const to = button.getBoundingClientRect()
                const p = ease(t)
                const aimX = to.left + to.width / 2 - (from.left + from.width * scale / 2)
                const aimY = to.top + to.height / 2 - (from.top + from.height * scale / 2)

                source.style.transform = 'translate(' + aimX * p + 'px, ' + aimY * p + 'px) scale(' + mix(1, scale, p) + ')'
                source.style.opacity = String(mix(1, 0.3, p))
            }, finish)
        },
        cancel: () => {
            if (stop) stop()
            finish()
        }
    }
}

// The flying card: the element copied and fixed where it is, with the shadow of a lifted card, scaled to its place on every frame
function liftedCopy(element, context) {
    const copy = copyOf(element, { transformOrigin: '0 0', borderRadius: '12px', overflow: 'hidden', zIndex: '1100', boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)' }, context)

    return copy ? { copy: copy, from: element.getBoundingClientRect() } : null
}

// Picking an investigator from the investigator draft: the screen with the other investigators fades away and the card of the picked one
// (its front) flies to the investigator of the left column of the draft screen. Call it BEFORE the pick is dispatched, with the tile that
// was picked: it copies what is on the screen, so the copies stay when the screen is replaced. Returns null when there is nothing to animate.
export default function startInvestigatorFlight(tile, animationSpeed) {
    const speed = motionSpeed(animationSpeed)

    if (!tile || !speed || !document.body.animate || reducedMotion()) return null

    const frame = tile.querySelector('.investigator-image-frame')
    const grid = tile.parentElement

    if (!frame || !grid) return null

    const lifted = liftedCopy(frame)

    if (!lifted) return null

    // the screen the investigator leaves: a copy of the grid, without the picked tile (that one flies)
    const backdrop = copyOf(grid)

    if (backdrop) backdrop.children[Array.prototype.indexOf.call(grid.children, tile)].style.visibility = 'hidden'

    return launch(lifted.copy, lifted.from, backdrop, speed)
}

// Picks up a saved draft with Resume: the setup screen (with the banner) cross-fades into the draft screen, whose investigator turns into place.
// There is no card to fly: the setup may show another investigator than the saved draft. Call it BEFORE the draft is restored.
export function startResumeFlight(animationSpeed) {
    const speed = motionSpeed(animationSpeed)

    if (!speed || !document.body.animate || reducedMotion()) return null

    const backdrop = copyOf(document.getElementById('main-content'))

    if (!backdrop) return null

    document.documentElement.classList.add('resume-flight')

    return launch(null, null, backdrop, speed)
}

// Starting the draft from the setup: the setup screen fades away and the chosen investigator's card (the front, from the left column of the
// setup) flies to the left column of the draft screen. With no card to fly (the investigator is drafted next) the screens just cross-fade.
// Call it BEFORE the draft is started.
export function startSetupFlight(animationSpeed) {
    const speed = motionSpeed(animationSpeed)

    if (!speed || !document.body.animate || reducedMotion()) return null

    const wizard = document.querySelector('.wizard')
    const card = document.querySelector('.wizard-left .investigator-div')

    if (!wizard) return null

    const lifted = card ? liftedCopy(card, 'draft-left') : null
    const backdrop = copyOf(wizard)

    if (backdrop) {
        // the card that flies is not left behind in the copy of the screen
        const left = backdrop.querySelector('.wizard-left .investigator-div')

        if (left && lifted) left.style.visibility = 'hidden'
    }

    if (!backdrop && !lifted) return null

    return launch(lifted ? lifted.copy : null, lifted ? lifted.from : null, backdrop, speed)
}
