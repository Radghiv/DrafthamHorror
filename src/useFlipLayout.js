import { useLayoutEffect, useRef } from 'react'

const DURATION = 500
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

// FLIP animation for the panels of the post-setup layout. When layoutKey changes (the draft finished and the panels are
// re-arranged across the width), panels that already existed glide from their old position to the new one, and new
// panels fade in. Positions are remembered after every render, so "old" is always the layout before the change.
function useFlipLayout(containerRef, layoutKey) {
    const positions = useRef(new WeakMap())
    const lastKey = useRef(layoutKey)

    useLayoutEffect(() => {
        const container = containerRef.current

        if (!container) {
            lastKey.current = layoutKey
            return
        }

        const items = container.querySelectorAll(':scope > .draft-left > *, :scope > .draft-main > *, :scope > .draft-aside > *')
        const keyChanged = lastKey.current !== layoutKey
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const next = new WeakMap()

        items.forEach(element => {
            const rect = element.getBoundingClientRect()
            const point = { x: rect.left + window.scrollX, y: rect.top + window.scrollY }

            next.set(element, point)

            if (!keyChanged || reduceMotion || !element.animate) return

            const previous = positions.current.get(element)

            if (previous) {
                const dx = previous.x - point.x
                const dy = previous.y - point.y

                if (dx !== 0 || dy !== 0) {
                    element.animate(
                        [{ transform: 'translate(' + dx + 'px, ' + dy + 'px)' }, { transform: 'translate(0, 0)' }],
                        { duration: DURATION, easing: EASING }
                    )
                }
            }
            else {
                element.animate(
                    [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
                    { duration: DURATION, easing: EASING }
                )
            }
        })

        positions.current = next
        lastKey.current = layoutKey
    })
}

export default useFlipLayout
