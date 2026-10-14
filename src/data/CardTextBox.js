import INVESTIGATOR_PHOTOS, { DEFAULT_PHOTO } from './InvestigatorPhotos'

// Where the texts are printed on the picture of a card, as fractions of the picture (measured on the pictures of the cards).
//
// The text area: the sides and the top of the area of the rules text, where the translated text may reach (textBottom), and how far the
// English text is painted over (coverBottom). Assets have a slot icon in the bottom right corner, which the painted area leaves out
// (notchLeft); the area of an enemy is curved below (edgeBottom: where it ends at the sides); on the back of an investigator the text goes
// around the photo (photo: its right edge, the bottom of its left part up to splitX, and the bottom of its right part).
//
// The fields: the one-line texts of the card (kind: its name, subtitle, type or kind of weakness) each in the area where the English one is
// printed, painted over with the color of what is behind it (fill).
const BAR = '#efece0'
const TAB = '#e6e2d6'
const WHITE = '#fafafa'
const INVESTIGATOR = '#eee6d2'

const field = (kind, left, right, top, bottom, fill, align) => ({ kind: kind, left: left, right: right, top: top, bottom: bottom, fill: fill, align: align || 'center' })

// the label of the type, on the tab under the cost of a player card
const PLAYER_TYPE = field('type', 0.035, 0.14, 0.116, 0.136, TAB)

const BOXES = {
    asset: {
        left: 0.032, right: 0.968, top: 0.598, textBottom: 0.865, coverBottom: 0.905, notchLeft: 0.8,
        fields: [field('name', 0.165, 0.745, 0.022, 0.083, BAR), field('subname', 0.265, 0.79, 0.089, 0.107, TAB), PLAYER_TYPE]
    },
    event: {
        left: 0.06, right: 0.94, top: 0.622, textBottom: 0.92, coverBottom: 0.93,
        fields: [field('name', 0.2, 0.8, 0.573, 0.626, BAR), field('type', 0.04, 0.13, 0.116, 0.138, TAB)]
    },
    skill: {
        left: 0.05, right: 0.95, top: 0.625, textBottom: 0.925, coverBottom: 0.935,
        fields: [{ ...field('name', 0.165, 0.95, 0.022, 0.083, BAR, 'left'), pad: 0.025 }, PLAYER_TYPE]
    },
    // weaknesses: their layout is that of the type, with the name of the weakness (and its kind) in a banner above the text
    assetWeakness: {
        left: 0.032, right: 0.968, top: 0.598, textBottom: 0.865, coverBottom: 0.905, notchLeft: 0.8,
        fields: [field('name', 0.165, 0.745, 0.022, 0.083, BAR), field('subname', 0.265, 0.79, 0.089, 0.107, TAB), PLAYER_TYPE, field('weakness', 0.36, 0.64, 0.574, 0.598, WHITE)]
    },
    eventWeakness: {
        left: 0.06, right: 0.94, top: 0.665, textBottom: 0.925, coverBottom: 0.935,
        fields: [field('name', 0.2, 0.8, 0.573, 0.626, WHITE), field('type', 0.04, 0.13, 0.116, 0.138, TAB), field('weakness', 0.33, 0.67, 0.632, 0.657, WHITE)]
    },
    skillWeakness: {
        left: 0.05, right: 0.95, top: 0.685, textBottom: 0.925, coverBottom: 0.935,
        fields: [{ ...field('name', 0.165, 0.95, 0.022, 0.083, BAR, 'left'), pad: 0.025 }, PLAYER_TYPE, field('weakness', 0.33, 0.67, 0.661, 0.686, WHITE)]
    },
    treachery: {
        left: 0.065, right: 0.935, top: 0.674, textBottom: 0.925, coverBottom: 0.935,
        fields: [field('name', 0.2, 0.8, 0.585, 0.626, WHITE), field('type', 0.36, 0.64, 0.537, 0.567, WHITE), field('weakness', 0.36, 0.64, 0.634, 0.663, WHITE)]
    },
    // the text of an enemy is in its upper half, under the name and the numbers
    enemy: {
        left: 0.035, right: 0.965, top: 0.195, textBottom: 0.44, coverBottom: 0.52, edgeBottom: 0.43,
        fields: [field('name', 0.17, 0.83, 0.008, 0.055, WHITE), field('weakness', 0.3, 0.7, 0.063, 0.088, WHITE), field('type', 0.43, 0.57, 0.583, 0.603, WHITE)]
    },
    // investigators are landscape: the text is on the right of the front, and on the back beside and under the photo
    investigatorFront: {
        left: 0.545, right: 0.985, top: 0.205, textBottom: 0.79, coverBottom: 0.8,
        fields: [field('name', 0.11, 0.51, 0.025, 0.098, INVESTIGATOR), field('subname', 0.19, 0.43, 0.113, 0.145, INVESTIGATOR)]
    },
    investigatorBack: {
        left: 0.03, right: 0.975, top: 0.17, textBottom: 0.925, coverBottom: 0.93,
        fields: [field('name', 0.5, 0.95, 0.025, 0.098, INVESTIGATOR), field('subname', 0.58, 0.83, 0.113, 0.145, INVESTIGATOR)]
    }
}

const PHOTO_SPLIT = 0.19

// The text area of the back of an investigator, with the measure of its photo
function investigatorBackBox(card) {
    const [right, leftBottom, rightBottom] = INVESTIGATOR_PHOTOS[card.code] || DEFAULT_PHOTO

    return { ...BOXES.investigatorBack, photo: { right: right, splitX: PHOTO_SPLIT, leftBottom: leftBottom, rightBottom: rightBottom } }
}

// The layout of a card side, or null for one that isn't known: cards that aren't player cards or investigators
function layoutOf(card, side) {
    if (card.type_code === 'investigator') return side === 'back' ? 'investigatorBack' : 'investigatorFront'
    if (card.double_sided) return null

    const weakness = card.subtype_code === 'weakness' || card.subtype_code === 'basicweakness'

    if (card.subtype_code && !weakness) return null

    switch (card.type_code) {
        case 'asset': return weakness ? 'assetWeakness' : 'asset'
        case 'event': return weakness ? 'eventWeakness' : 'event'
        case 'skill': return weakness ? 'skillWeakness' : 'skill'
        case 'treachery': return weakness ? 'treachery' : null
        case 'enemy': return weakness ? 'enemy' : null
        default: return null
    }
}

// The text area of a side of a card ('front' or 'back'), or null when its layout isn't one this knows
export function textBoxFor(card, side) {
    const layout = card ? layoutOf(card, side) : null

    if (layout === 'investigatorBack') return investigatorBackBox(card)

    return layout ? BOXES[layout] : null
}
