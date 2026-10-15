import { useDispatch, useStore } from 'react-redux'

import { updateImageOverlay } from '../features/settings/settingsSlice'
import { cardImageUrls } from '../data/CardImages'

// How long a finger has to stay on a card to open its preview
const LONG_PRESS = 450

// A preview opened by hovering needs a pointer that really moves. A card that comes up under a resting pointer (a new screen, a redraw, a pick)
// makes the browser say the pointer entered it, but nobody pointed at it: the preview then waits until the pointer has moved a few pixels
// over the card.
const MOVED_RECENTLY = 120
const MOVE_TO_OPEN = 4

let lastPointerMove = 0
let pendingHover = null

if (typeof document !== 'undefined') {
    document.addEventListener('pointermove', event => {
        if (event.pointerType !== 'touch') lastPointerMove = performance.now()
    }, true)
}

function cancelPendingHover() {
    if (pendingHover) {
        document.removeEventListener('pointermove', pendingHover, true)
        pendingHover = null
    }
}

// Calls open (once) with the first movement of the pointer that goes a few pixels from where it was
function whenPointerMoves(startX, startY, open) {
    cancelPendingHover()

    pendingHover = event => {
        if (Math.hypot(event.clientX - startX, event.clientY - startY) < MOVE_TO_OPEN) return

        cancelPendingHover()
        open(event)
    }

    document.addEventListener('pointermove', pendingHover, true)
}

let longPressTimer = null

function cancelLongPress() {
    if (longPressTimer !== null) {
        clearTimeout(longPressTimer)
        longPressTimer = null
    }
}

// A long press ends with the finger lifting, which the browser turns into a click on the card that was pressed: that click must not
// select or draft it. When the finger comes up (or the touch is cancelled) the click that follows is swallowed.
function swallowClickAfterTouch() {
    function swallow(event) {
        event.stopPropagation()
        event.preventDefault()
    }

    function finish() {
        document.removeEventListener('pointerup', finish, true)
        document.removeEventListener('pointercancel', finish, true)

        document.addEventListener('click', swallow, true)

        // a touch that was cancelled produces no click: don't leave the listener around for the next real one
        setTimeout(() => document.removeEventListener('click', swallow, true), 400)
    }

    document.addEventListener('pointerup', finish, true)
    document.addEventListener('pointercancel', finish, true)
}

// True on a screen whose main input can't hover (a phone or a tablet)
export function isTouchScreen() {
    return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(hover: none)').matches
}

// Returns a function that shows (or, without a card, hides) the big card preview. It takes the card, the pointer event that
// triggered it (the hovered element and the pointer height are kept so the preview can be placed beside it) and the side.
// With a mouse or pen the preview follows the hover. On a touch screen there is no hover: pressing and holding the card opens the
// preview in the middle of the screen, where it stays until it is tapped away (a short tap does what it always does).
// Things a tap does nothing on (the rows of the card lists, thumbnails) also pass their click event, on touch screens only: the
// preview then opens at once.
function useCardOverlay() {
    const dispatch = useDispatch()
    const store = useStore()

    function show(card, side, anchor, pinned) {
        const urls = cardImageUrls(card, side)

        if (urls.length > 0) {
            dispatch(updateImageOverlay({ imagesrc: urls, anchor: anchor, code: card.code || card.key, pinned: pinned }))
        }
        else {
            dispatch(updateImageOverlay({ imagesrc: null }))
        }
    }

    function anchorFor(element, clientY) {
        if (!element || !element.getBoundingClientRect) return null

        const rect = element.getBoundingClientRect()

        return { left: rect.left, right: rect.right, y: typeof clientY === 'number' ? clientY : rect.top + rect.height / 2 }
    }

    return function(card, event, side) {
        cancelLongPress()
        cancelPendingHover()

        if (!card) {
            // lifting the finger doesn't close a preview opened by a long press
            if (!store.getState().settings.imagepinned) dispatch(updateImageOverlay({ imagesrc: null }))

            return
        }

        if (event && event.type === 'click') {
            show(card, side, null, true)

            return
        }

        if (event && event.pointerType === 'touch') {
            longPressTimer = setTimeout(() => {
                longPressTimer = null
                swallowClickAfterTouch()
                show(card, side, null, true)
            }, LONG_PRESS)

            return
        }

        const element = event && event.currentTarget

        // the pointer entered without moving: the preview comes when it does (and is still over the card)
        if (event && event.type === 'pointerenter' && element && element.matches && performance.now() - lastPointerMove > MOVED_RECENTLY) {
            whenPointerMoves(event.clientX, event.clientY, moveEvent => {
                if (element.isConnected && element.matches(':hover')) show(card, side, anchorFor(element, moveEvent.clientY), false)
            })

            return
        }

        show(card, side, anchorFor(element, event && event.clientY), false)
    }
}

export default useCardOverlay
