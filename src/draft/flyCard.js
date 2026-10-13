const DURATION = 700
const EASING = 'cubic-bezier(0.5, 0, 0.2, 1)'

// the theme's primary color with an alpha (tokens are 6-digit hex colors, so an 8-digit hex does the job)
function primaryWithAlpha(alpha) {
    const primary = window.getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()

    return /^#[0-9a-f]{6}$/i.test(primary) ? primary + alpha : 'rgba(140, 151, 255, 0.6)'
}

function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

    // fallback: no row to land on (list in a closed drawer, row scrolled out of view...): shrink toward the destination
    function shrinkToward(target) {
        const to = target.getBoundingClientRect()
        const aimX = Math.min(Math.max(to.left + to.width / 2, 40), window.innerWidth - 40)
        const aimY = Math.min(Math.max(to.top + Math.min(to.height / 2, 60), 40), window.innerHeight - 40)
        const dx = aimX - (from.left + from.width / 2)
        const dy = aimY - (from.top + from.height / 2)
        const scale = Math.max(0.05, Math.min(0.12, 36 / from.width))

        const animation = flying.animate(
            [
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scale + ')', opacity: 0.25 }
            ],
            { duration: duration, easing: EASING, fill: 'forwards' }
        )

        animation.onfinish = () => {
            flying.remove()
            target.animate(
                [{ boxShadow: '0 0 0 0 ' + primaryWithAlpha('e6') }, { boxShadow: '0 0 0 14px ' + primaryWithAlpha('00') }],
                { duration: 500, easing: 'ease-out' }
            )
        }
    }

    function land(cardKey) {
        const tab = document.querySelector('.drawer-tab-right')
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
        const to = row ? row.getBoundingClientRect() : null
        const rowInView = to && to.bottom > 0 && to.top < window.innerHeight

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
            lineHeight: to.height + 'px', color: style.color, opacity: '0',
            backgroundColor: window.getComputedStyle(list).backgroundColor
        })
        flying.appendChild(text)

        // the real row appears when the copy has become it
        row.style.opacity = '0'

        const geometry = flying.animate(
            [
                { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px', borderRadius: '14px', boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)' },
                { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px', borderRadius: '4px', boxShadow: '0 0 0 rgba(0, 0, 0, 0)' }
            ],
            { duration: duration, easing: EASING, fill: 'forwards' }
        )

        cardLayer.animate(
            [{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0, offset: 0.75 }, { opacity: 0, offset: 1 }],
            { duration: duration, easing: 'linear', fill: 'forwards' }
        )
        text.animate(
            [{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.4 }, { opacity: 1, offset: 0.85 }, { opacity: 1, offset: 1 }],
            { duration: duration, easing: 'linear', fill: 'forwards' }
        )

        const finish = () => {
            flying.remove()
            row.style.opacity = ''
            row.animate(
                [{ backgroundColor: primaryWithAlpha('73') }, { backgroundColor: primaryWithAlpha('00') }],
                { duration: 600, easing: 'ease-out' }
            )
        }

        geometry.onfinish = finish
        geometry.oncancel = finish
    }

    return { land: land, cancel: () => flying.remove() }
}
