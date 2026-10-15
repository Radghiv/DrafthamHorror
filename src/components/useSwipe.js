import { useEffect, useRef } from 'react'

// How far (px) and how sideways a movement has to be to count as a swipe; the time is so that a slow drag (selecting, scrolling) isn't one
const MIN_DISTANCE = 70
const SIDEWAYS_RATIO = 2
const MAX_TIME = 700

// 'left', 'right' or null for a movement of the finger from (startX, startY) to (endX, endY) in `time` ms
export function swipeDirection(startX, startY, endX, endY, time) {
    const dx = endX - startX
    const dy = endY - startY

    if (time > MAX_TIME || Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * SIDEWAYS_RATIO) return null

    return dx < 0 ? 'left' : 'right'
}

// What takes the sideways movement for itself: fields, sliders, and anything that scrolls sideways (a swipe there scrolls it)
const KEEP = 'select, input, textarea, .segmented-range, [role="slider"], [data-no-swipe]'

function scrollsSideways(element, boundary) {
    for (let node = element; node && node !== boundary && node.nodeType === 1; node = node.parentElement) {
        if (node.scrollWidth > node.clientWidth + 1 && /(auto|scroll)/.test(window.getComputedStyle(node).overflowX)) return true
    }

    return false
}

// A sideways swipe on the element of `ref`: onSwipe('left') or onSwipe('right'). A finger that starts on `ignore` (a selector; the controls at
// the top, say) or on something that takes the movement for itself is not a swipe. The page keeps scrolling up and down as usual.
function useSwipe(ref, onSwipe, enabled = true, ignore = null) {
    const handler = useRef(onSwipe)

    handler.current = onSwipe

    useEffect(() => {
        const element = ref.current

        if (!element || !enabled) return undefined

        let start = null

        function handleStart(event) {
            start = null

            if (event.touches.length !== 1) return

            const target = event.target

            if (target.closest(KEEP) || (ignore && target.closest(ignore)) || scrollsSideways(target, element)) return

            start = { x: event.touches[0].clientX, y: event.touches[0].clientY, time: Date.now() }
        }

        function handleEnd(event) {
            if (!start || event.changedTouches.length === 0) return

            const touch = event.changedTouches[0]
            const direction = swipeDirection(start.x, start.y, touch.clientX, touch.clientY, Date.now() - start.time)

            start = null

            if (direction) handler.current(direction)
        }

        function handleCancel() {
            start = null
        }

        element.addEventListener('touchstart', handleStart, { passive: true })
        element.addEventListener('touchend', handleEnd, { passive: true })
        element.addEventListener('touchcancel', handleCancel, { passive: true })

        return () => {
            element.removeEventListener('touchstart', handleStart)
            element.removeEventListener('touchend', handleEnd)
            element.removeEventListener('touchcancel', handleCancel)
        }
    }, [ref, enabled, ignore])
}

export default useSwipe
