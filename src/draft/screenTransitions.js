import { motionSpeed } from '../data/AnimationSpeed'

// The effects that change one screen into another, made of copies of what is on the screen: the copy stays while the real screen is already
// replaced and fades away (or flies away), so nothing blinks. Each is called BEFORE the state changes, and does nothing at speed 0.

function layer() {
    return document.querySelector('.App') || document.body
}

// A copy of an element, fixed where the element is now, with the given extra styles; null when the element isn't drawn. With `context` (a
// class name) the copy sits in a box with that class, for the rules of the stylesheet that only apply inside a column. With `detached` the copy
// is made but not put on the page (the caller does it, or throws the copy away).
export function copyOf(element, extra, context, detached) {
    if (!element) return null

    const rect = element.getBoundingClientRect()

    if (rect.width === 0 || rect.height === 0) return null

    const copy = element.cloneNode(true)

    copy.removeAttribute('id')
    copy.setAttribute('aria-hidden', 'true')
    copy.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'))
    // a copy must not play the entrance animations again
    copy.querySelectorAll('.investigator-deal, .step-enter').forEach(child => { child.style.animation = 'none' })

    const box = context ? document.createElement('div') : copy
    const placing = {
        position: 'fixed', left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px',
        margin: '0', pointerEvents: 'none', zIndex: '1050', ...extra
    }

    if (context) {
        box.className = context
        box.setAttribute('aria-hidden', 'true')
        Object.assign(placing, { padding: '0', maxWidth: 'none', flex: 'none' })
        Object.assign(copy.style, { width: '100%', height: '100%', margin: '0' })
        box.appendChild(copy)
    }

    Object.assign(box.style, placing)
    if (!detached) layer().appendChild(box)

    return box
}

// A copy of the element that fades out where it is
export function fadeOutCopy(element, speed, duration = 400, context) {
    if (!speed || !document.body.animate) return

    const copy = copyOf(element, undefined, context)

    if (!copy) return

    copy.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration / speed, easing: 'ease-out', fill: 'forwards' }).onfinish = () => copy.remove()
}

// Leaving the draft for the setup screens: the draft screen fades away
export function playLeaveEffect(animationSpeed) {
    fadeOutCopy(document.querySelector('main .draft-layout'), motionSpeed(animationSpeed), 350)
}

// The panels of a paused upgrade draft (level 0 cards, Versatile, resume) fade away when the draft starts again
export function playPanelsLeave(animationSpeed) {
    fadeOutCopy(document.querySelector('.draft-layout:not(.is-complete) > .draft-main'), motionSpeed(animationSpeed), 300, 'draft-layout')
}

// The draft ending: the cards still on the table (and the bar under them) fade away and settle back while the panels of the finished draft arrive
// (see useFlipLayout.js). A pick (or Done) may be the last one, and nobody knows before it is made, so the copy is prepared before every pick;
// play() puts it on the page once the draft is known to be complete, and a pick that doesn't finish the draft just drops it. pickedIndex is the card
// that flies to the Draft List on its own (-1 for Done), so it is left out of the copy. Returns null when there is nothing to prepare.
export function prepareCompletionExit(animationSpeed, pickedIndex) {
    const speed = motionSpeed(animationSpeed)

    if (!speed || !document.body.animate) return null

    const copy = copyOf(document.querySelector('.draft-layout:not(.is-complete) > .draft-main'), undefined, 'draft-layout', true)

    if (!copy) return null

    const picked = copy.querySelectorAll('.draft-card-wrap')[pickedIndex]

    if (picked) picked.style.visibility = 'hidden'

    return {
        play: () => {
            layer().appendChild(copy)
            copy.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.97)' }], { duration: 450 / speed, easing: 'ease-in', fill: 'forwards' }).onfinish = () => copy.remove()
        }
    }
}

// Undoing from the finished draft back to the cards: the panels that only the finished draft has (the export...) fade away
export function playCompletionLeave(animationSpeed) {
    fadeOutCopy(document.querySelector('.draft-layout.is-complete > .draft-main'), motionSpeed(animationSpeed), 350, 'draft-layout is-complete')
}
