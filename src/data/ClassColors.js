function ColorForClass(classCode)
{
    const factionCodes = [ 'guardian', 'seeker', 'rogue', 'mystic', 'survivor', 'neutral', 'multiclass' ]
    const factionColors = [ '#c8eeff', '#ffe3c2', '#b6ffd7', '#efd2ff', '#ffd1d5', '#e2e2e2', '#fffedf' ]

    let factionIndex = -1

    for (let f = 0; f < 7; f++) {
        if (classCode === factionCodes[f]) factionIndex = f
    }

    return factionColors[factionIndex]
}

// The class colors of Arkham Horror: The Card Game (the ones used on the cards and on ArkhamDB)
const officialColors = {
    guardian: '#2b80c5', seeker: '#ec8426', rogue: '#107116', mystic: '#4331b9',
    survivor: '#cc3038', neutral: '#808080', multiclass: '#c9a24a'
}

export function OfficialColorForClass(classCode)
{
    return officialColors[classCode]
}

// Mixes a #rrggbb color with black: amount 0.5 makes it 50% darker
export function darkenColor(color, amount)
{
    const channel = start => Math.round(parseInt(color.slice(start, start + 2), 16) * (1 - amount)).toString(16).padStart(2, '0')

    return '#' + channel(1) + channel(3) + channel(5)
}

// White or dark text, whichever reads better on the given #rrggbb background
export function readableTextColor(background)
{
    const channel = value => {
        const v = value / 255

        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }

    const r = parseInt(background.slice(1, 3), 16)
    const g = parseInt(background.slice(3, 5), 16)
    const b = parseInt(background.slice(5, 7), 16)
    const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

    // contrast with white is 1.05 / (L + 0.05), with the dark text (#1b1f3a, L about 0.014) it is (L + 0.05) / 0.064
    return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.064 ? '#ffffff' : '#1b1f3a'
}

export default ColorForClass