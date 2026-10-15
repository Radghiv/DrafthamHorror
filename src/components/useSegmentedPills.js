import { useEffect } from 'react'

// Places the pill of every toggle (.segmented) under its chosen button: the position and size are put on the toggle as --pill-* values, and
// the stylesheet draws the pill and slides it when they change. The chosen button is the one with aria-pressed, aria-checked or (a tab) aria-selected. The first
// time a toggle is placed there is no slide (the pill is just there); after that it glides.
function placePills() {
    document.querySelectorAll('.segmented').forEach(box => {
        const chosen = box.querySelector('button[aria-pressed="true"], button[aria-checked="true"], button[aria-selected="true"]')

        if (!chosen) {
            box.style.setProperty('--pill-opacity', '0')

            return
        }

        box.style.setProperty('--pill-left', chosen.offsetLeft + 'px')
        box.style.setProperty('--pill-top', chosen.offsetTop + 'px')
        box.style.setProperty('--pill-width', chosen.offsetWidth + 'px')
        box.style.setProperty('--pill-height', chosen.offsetHeight + 'px')
        box.style.setProperty('--pill-opacity', '1')

        if (!box.dataset.pill) {
            box.dataset.pill = 'on'

            // two frames later the pill is in place, and from then on it slides
            requestAnimationFrame(() => requestAnimationFrame(() => { box.dataset.pill = 'ready' }))
        }
    })
}

function useSegmentedPills() {
    useEffect(() => {
        let frame = 0

        const schedule = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(placePills)
        }

        placePills()

        // a toggle appears, or another button of it is chosen
        const observer = new MutationObserver(schedule)

        observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-pressed', 'aria-checked', 'aria-selected'] })
        window.addEventListener('resize', schedule)

        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            window.removeEventListener('resize', schedule)
        }
    }, [])
}

export default useSegmentedPills
