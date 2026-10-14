import React from 'react'

import ICON_GLYPHS from '../data/CardIcons'
import { OfficialColorForClass } from '../data/ClassColors'

// Text with its [icon] tokens turned into the game's icons: the glyphs of the icon font, the classes as a dot in their color, and for a token
// that isn't known its name in a small badge
function withIcons(text) {
    return text.split(/(\[\w+\])/g).filter(part => part !== '').map((part, index) => {
        const match = part.match(/^\[(\w+)\]$/)

        if (!match) return part

        const code = match[1]
        const name = code.replace(/_/g, ' ')

        if (ICON_GLYPHS[code]) return <span className="gameIcon" key={index} role="img" aria-label={name} title={name}>{ICON_GLYPHS[code]}</span>
        if (OfficialColorForClass(code)) return <span className="classIcon" key={index} role="img" aria-label={name} title={name} style={{ backgroundColor: OfficialColorForClass(code) }}></span>

        return <span className="iconToken" key={index} title={name}>{name}</span>
    })
}

// Turns the simple markup of ArkhamDB texts into text: <b> and <i> become bold and italic, [[Trait]] italic, [icon] a small badge
export function formatMarkup(text) {
    const parts = text.replace(/<(\/?)strong>/g, '<$1b>').replace(/<(\/?)em>/g, '<$1i>').split(/(<b>.*?<\/b>|<i>.*?<\/i>|\[\[.*?\]\])/g).filter(part => part !== '')

    return parts.map((part, index) => {
        if (part.startsWith('<b>')) return <b key={index}>{withIcons(part.slice(3, -4).replace(/\[\[(.*?)\]\]/g, '$1'))}</b>
        if (part.startsWith('<i>')) return <i key={index}>{withIcons(part.slice(3, -4))}</i>
        if (part.startsWith('[[')) return <i key={index}>{part.slice(2, -2)}</i>

        return withIcons(part)
    })
}

// One paragraph per line of an ArkhamDB text
export function Paragraphs(props) {
    return props.text.split('\n').filter(line => line.trim() !== '').map((line, index) => <p key={index}>{formatMarkup(line)}</p>)
}
