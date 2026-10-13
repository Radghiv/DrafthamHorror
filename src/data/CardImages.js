const ARKHAMDB_IMAGES = 'https://www.arkhamdb.com'
const ARKHAMBUILD_IMAGES = 'https://cdn.arkham.build/optimized/'

// the back of a player card
export const PLAYER_CARD_BACK = 'https://cdn.arkham.build/back_player.jpg'

// Image addresses of one side of a card, best first: ArkhamDB's when it has one, then arkham.build's (card code, plus "b" for
// the back), which also has cards ArkhamDB lacks. Accepts ArkhamDB cards (code) and the app's own card objects (key).
export function cardImageUrls(card, side) {
    if (!card) return []

    const back = side === 'back'
    const code = card.code || card.key
    const path = back ? card.backimagesrc : card.imagesrc

    const urls = []

    if (path) urls.push(ARKHAMDB_IMAGES + path)
    if (code) urls.push(ARKHAMBUILD_IMAGES + code + (back ? 'b' : '') + '.webp')

    return urls
}
