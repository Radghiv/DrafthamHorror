import React, { useState } from 'react'

// The big card preview image: takes the sources in order, moving on to the next one when an address fails.
// With rotate ('front' or 'back'), a picture that is taller than wide (ArkhamDB has some investigators that way) is turned a quarter, so the
// card always shows horizontally: the front clockwise and the back counterclockwise, like the investigator pictures elsewhere. It then sits in
// a frame (frameClass) with the proportions of a landscape card; onTurn is told whether the picture is turned.
function OverlayCardImage(props) {
    const { urls, className, style, rotate, frameClass, onTurn } = props

    const [attempt, setAttempt] = useState({ first: urls[0], index: 0 })
    const [portrait, setPortrait] = useState(false)

    const index = attempt.first === urls[0] ? attempt.index : 0

    if (index >= urls.length) return null

    const image = (extraClass, extraStyle) => (
        <img className={extraClass || className || 'overlayImage'} style={extraStyle || style} src={urls[index]} alt="" onError={() => setAttempt({ first: urls[0], index: index + 1 })}
            onLoad={rotate ? event => {
                const turned = event.target.naturalHeight > event.target.naturalWidth

                setPortrait(turned)
                if (onTurn) onTurn(turned)
            } : undefined} />
    )

    if (rotate && portrait) {
        return <span className={frameClass || 'overlayFrame'}>{image('rotatedImage ' + (rotate === 'back' ? 'ccw' : 'cw'), undefined)}</span>
    }

    return image()
}

export default OverlayCardImage
