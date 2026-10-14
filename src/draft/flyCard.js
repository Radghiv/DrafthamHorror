const DURATION = 700

// the theme's primary color with an alpha (tokens are 6-digit hex colors, so an 8-digit hex does the job)
export function primaryWithAlpha(alpha) {
    const primary = window.getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()

    return /^#[0-9a-f]{6}$/i.test(primary) ? primary + alpha : 'rgba(140, 151, 255, 0.6)'
}

function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// the easing curve of the flight, cubic-bezier(0.5, 0, 0.2, 1), as a function of the progress in time
export function ease(x) {
    if (x <= 0) return 0
    if (x >= 1) return 1

    const [x1, y1, x2, y2] = [0.5, 0, 0.2, 1]
    const at = (a, b, t) => 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t

    let low = 0
    let high = 1

    for (let step = 0; step < 24; step++) {
        const middle = (low + high) / 2

        if (at(x1, x2, middle) < x) low = middle
        else high = middle
    }

    return at(y1, y2, (low + high) / 2)
}

// 0 before `start`, 1 after `end`, linear in between
function ramp(t, start, end) {
    return Math.min(1, Math.max(0, (t - start) / (end - start)))
}

export const mix = (a, b, p) => a + (b - a) * p

// Calls draw(t) on every frame with the progress in time (0 to 1), then done(). The flight is driven from here, not by the Web
// Animations API, because its destination moves while it flies (the page scrolls to the top after a pick): draw measures it again each frame.
export function runFrames(duration, draw, done) {
    const startedAt = performance.now()
    let frame = 0

    function step(now) {
        const t = Math.min(1, (now - startedAt) / duration)

        draw(t)

        if (t < 1) frame = requestAnimationFrame(step)
        else done()
    }

    draw(0)
    frame = requestAnimationFrame(step)

    return () => cancelAnimationFrame(frame)
}

// Starts the "card goes into the Draft List" animation. Call it BEFORE the draft is dispatched: it copies the card, so
// the copy stays on screen when the pool is replaced. Then call land(cardKey) once the list has re-rendered (next frame):
// the copy shrinks and turns, smoothly, into the text row of that card in the list.
// Returns null when there is nothing to animate.
export default function startCardFlight(cardElement, speed) {
    // speed 0 skips the animation
    if (!cardElement || !speed || !document.body.animate || reducedMotion()) return null

    const duration = DURATION / speed

    const source = cardElement.querySelector('.draft-card-hit') || cardElement
    const from = source.getBoundingClientRect()

    const cardLayer = source.cloneNode(true)

    cardLayer.removeAttribute('id')
    cardLayer.tabIndex = -1
    Object.assign(cardLayer.style, {
        position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', margin: '0', pointerEvents: 'none', borderColor: 'transparent', boxShadow: 'none'
    })

    cardLayer.querySelectorAll('img').forEach(image => { image.style.objectFit = 'cover' })

    const flying = document.createElement('div')

    flying.setAttribute('aria-hidden', 'true')
    Object.assign(flying.style, {
        position: 'fixed',
        left: from.left + 'px',
        top: from.top + 'px',
        width: from.width + 'px',
        height: from.height + 'px',
        overflow: 'hidden',
        borderRadius: '14px',
        zIndex: '1100',
        pointerEvents: 'none',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)'
    })
    flying.appendChild(cardLayer)
    document.body.appendChild(flying)

    let stop = null

    // the highlight of the place where the flight ends
    function highlight(target, from, to, duration) {
        target.animate([{ [from.property]: from.value }, { [to.property]: to.value }], { duration: duration, easing: 'ease-out' })
    }

    // fallback: no row to land on (list in a closed drawer, row scrolled out of view...): shrink toward the destination
    function shrinkToward(target) {
        const scale = Math.max(0.05, Math.min(0.12, 36 / from.width))

        stop = runFrames(duration, t => {
            // measured on every frame: the page may be scrolling
            const to = target.getBoundingClientRect()
            const aimX = Math.min(Math.max(to.left + to.width / 2, 40), window.innerWidth - 40)
            const aimY = Math.min(Math.max(to.top + Math.min(to.height / 2, 60), 40), window.innerHeight - 40)
            const p = ease(t)

            flying.style.transform = 'translate(' + (aimX - (from.left + from.width / 2)) * p + 'px, ' + (aimY - (from.top + from.height / 2)) * p + 'px) scale(' + mix(1, scale, p) + ')'
            flying.style.opacity = String(mix(1, 0.25, p))
        }, () => {
            flying.remove()
            highlight(target, { property: 'boxShadow', value: '0 0 0 0 ' + primaryWithAlpha('e6') }, { property: 'boxShadow', value: '0 0 0 14px ' + primaryWithAlpha('00') }, 500 / speed)
        })
    }

    // scrollTop: where the page is scrolling to after this pick (default: nowhere), so that the row's final place is known now
    function land(cardKey, scrollTop) {
        const tab = document.querySelector('.drawer-tab-right, [data-fly-target]')
        const tabVisible = tab && window.getComputedStyle(tab).display !== 'none'

        if (tabVisible) {
            shrinkToward(tab)
            return
        }

        const list = document.querySelector('#draft-right-panel .settingsDiv')

        if (!list) {
            flying.remove()
            return
        }

        const row = cardKey ? list.querySelector('[id="' + cardKey + '"]') : null
        const now = row ? row.getBoundingClientRect() : null

        // is the row on screen once the page has finished scrolling? (the list moves with the page)
        const shift = window.scrollY - (scrollTop === undefined ? window.scrollY : scrollTop)
        const rowInView = now && now.bottom + shift > 0 && now.top + shift < window.innerHeight

        if (!row || !rowInView) {
            shrinkToward(list)
            return
        }

        // the text layer: the row itself, copied, on the panel's background
        const style = window.getComputedStyle(row)
        const text = row.cloneNode(true)

        text.removeAttribute('id')
        // plain inline flow, like the real row (a flex container would change how the name and the XP dots are laid out)
        Object.assign(text.style, {
            position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', margin: '0', padding: '0', boxSizing: 'border-box',
            display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', pointerEvents: 'none',
            fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight, letterSpacing: style.letterSpacing,
            lineHeight: now.height + 'px', color: style.color, opacity: '0',
            backgroundColor: window.getComputedStyle(list).backgroundColor
        })
        flying.appendChild(text)

        // the real row appears when the copy has become it
        row.style.opacity = '0'

        let to = now

        stop = runFrames(duration, t => {
            // the row's place is measured on every frame: the page may be scrolling, so the copy lands on the row where it really is
            if (row.isConnected) to = row.getBoundingClientRect()

            const p = ease(t)

            Object.assign(flying.style, {
                left: mix(from.left, to.left, p) + 'px',
                top: mix(from.top, to.top, p) + 'px',
                width: mix(from.width, to.width, p) + 'px',
                height: mix(from.height, to.height, p) + 'px',
                borderRadius: mix(14, 4, p) + 'px',
                boxShadow: '0 ' + 16 * (1 - p) + 'px ' + 40 * (1 - p) + 'px rgba(0, 0, 0, ' + 0.5 * (1 - p) + ')'
            })
            cardLayer.style.opacity = String(1 - ramp(t, 0.3, 0.75))
            text.style.opacity = String(ramp(t, 0.4, 0.85))
        }, () => {
            flying.remove()
            row.style.opacity = ''
            highlight(row, { property: 'backgroundColor', value: primaryWithAlpha('73') }, { property: 'backgroundColor', value: primaryWithAlpha('00') }, 600 / speed)
        })
    }

    return {
        land: land,
        cancel: () => {
            if (stop) stop()
            flying.remove()
        }
    }
}
