import { peekUndo } from '../features/draftState'
import { cardImageUrls } from '../data/CardImages'

const DURATION = 600

// the theme's primary color with an alpha (tokens are 6-digit hex colors, so an 8-digit hex does the job)
function primaryWithAlpha(alpha) {
    const primary = window.getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()

    return /^#[0-9a-f]{6}$/i.test(primary) ? primary + alpha : 'rgba(140, 151, 255, 0.6)'
}

// The card that the next undo takes out of the Draft List: the one whose count is higher in the list now than in the undo point.
// It is returned as it was in the pool of that moment (null when the pick added no card).
function takenBackCard(cardList, undoPoint) {
    const before = {}

    undoPoint.draft.cardList.forEach(item => { before[item.key] = item.count || 1 })

    const taken = cardList.find(item => (item.count || 1) > (before[item.key] || 0))

    return taken ? undoPoint.draft.draftPool.find(card => card.key === taken.key) || null : null
}

// The reverse of startCardFlight, for Undo: the row of the Draft List turns back into the card and flies to its place among the cards
// to choose from. Call it BEFORE the undo is dispatched (it copies the row, so the copy stays on screen when the row is gone), then call
// land() once the draft has re-rendered (next frame). Returns null when there is nothing to animate: a speed of 0, a pick that added no
// card, or a list that isn't on screen (a closed drawer or sheet). The card is the one the undo takes back, or the one with the key given
// (a card taken out of the Draft List in a sealed draft).
export function prepareCardReturn(speed, key) {
    return (dispatch, getState) => {
        const undoPoint = peekUndo()

        if (!speed || (!undoPoint && key === undefined) || !document.body.animate) return null

        const cardList = getState().draft.cardList
        const card = key !== undefined ? cardList.find(item => item.key === key) : takenBackCard(cardList, undoPoint)
        const list = document.querySelector('#draft-right-panel .settingsDiv')
        const row = card && list ? list.querySelector('[id="' + card.key + '"]') : null

        if (!row) return null

        const from = row.getBoundingClientRect()

        if (from.height === 0 || from.bottom < 0 || from.top > window.innerHeight) return null

        const style = window.getComputedStyle(row)
        const text = row.cloneNode(true)

        text.removeAttribute('id')
        Object.assign(text.style, {
            position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', margin: '0', padding: style.padding, boxSizing: 'border-box',
            display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', pointerEvents: 'none',
            fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight, letterSpacing: style.letterSpacing,
            lineHeight: (from.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) + 'px', color: style.color, backgroundColor: window.getComputedStyle(list).backgroundColor
        })

        // the picture of the card, the first source of the draft (the one it was shown from), under the text
        const urls = cardImageUrls(card)
        const picture = document.createElement('img')

        picture.alt = ''
        picture.src = urls[0] || ''
        Object.assign(picture.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover', opacity: '0', display: urls.length ? 'block' : 'none' })

        const flying = document.createElement('div')

        flying.setAttribute('aria-hidden', 'true')
        Object.assign(flying.style, {
            position: 'fixed', left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px',
            overflow: 'hidden', borderRadius: '4px', zIndex: '1100', pointerEvents: 'none'
        })
        flying.appendChild(picture)
        flying.appendChild(text)
        document.body.appendChild(flying)

        const duration = DURATION / speed
        let finished = false
        let wrap = null
        // a card that is in the pool already (the deck keeps a copy of it) stays where it is while the copy lands on it
        let wrapHidden = false

        function finish() {
            if (finished) return

            finished = true
            flying.remove()

            if (wrap && wrapHidden) wrap.style.opacity = ''
        }

        const wasInPool = Boolean(document.querySelector('.draft-container .draft-card-wrap[data-card-key="' + card.key + '"]'))

        return {
            land: () => {
                wrap = document.querySelector('.draft-container .draft-card-wrap[data-card-key="' + card.key + '"]')

                const target = wrap ? (wrap.querySelector('.draft-card-hit') || wrap) : null
                const to = target ? target.getBoundingClientRect() : null

                // the card isn't on screen: the row just slides away
                if (!to || to.height === 0 || to.bottom < 0 || to.top > window.innerHeight) {
                    wrap = null
                    flying.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-16px)' }], { duration: duration / 2, easing: 'ease-in' }).onfinish = finish
                    return
                }

                // the real card appears when the copy has become it
                if (!wasInPool) {
                    wrap.style.opacity = '0'
                    wrapHidden = true
                }

                const easing = 'cubic-bezier(0.5, 0, 0.2, 1)'

                picture.animate([{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1 }], { duration: duration, easing: 'linear', fill: 'forwards' })
                text.animate([{ opacity: 1 }, { opacity: 1, offset: 0.1 }, { opacity: 0, offset: 0.55 }, { opacity: 0 }], { duration: duration, easing: 'linear', fill: 'forwards' })

                const animation = flying.animate([
                    { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px', borderRadius: '4px', boxShadow: '0 0 0 rgba(0, 0, 0, 0)' },
                    { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px', borderRadius: '14px', boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)' }
                ], { duration: duration, easing: easing, fill: 'forwards' })

                animation.onfinish = () => {
                    finish()
                    target.animate([{ boxShadow: '0 0 0 0 ' + primaryWithAlpha('e6') }, { boxShadow: '0 0 0 14px ' + primaryWithAlpha('00') }], { duration: 500 / speed, easing: 'ease-out' })
                }
            },
            cancel: finish
        }
    }
}
