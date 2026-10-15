const ARKHAMDB_IMAGES = 'https://www.arkhamdb.com'
const ARKHAMBUILD_IMAGES = 'https://cdn.arkham.build/optimized/'

// the back of a player card
export const PLAYER_CARD_BACK = 'https://cdn.arkham.build/back_player.jpg'

// Image addresses of one side of a card, best first: arkham.build's (card code, plus "b" for the back; WebP at 750x1050, lighter and
// sharper than ArkhamDB's 300x419 PNG), then ArkhamDB's when it has one, for the cards arkham.build lacks. Accepts ArkhamDB cards (code)
// and the app's own card objects (key).
export function cardImageUrls(card, side) {
    if (!card) return []

    const back = side === 'back'
    const code = card.code || card.key
    const path = back ? card.backimagesrc : card.imagesrc

    const urls = []

    if (code) urls.push(ARKHAMBUILD_IMAGES + code + (back ? 'b' : '') + '.webp')
    if (path) urls.push(ARKHAMDB_IMAGES + path)

    return urls
}
