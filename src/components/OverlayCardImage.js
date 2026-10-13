import React, { useState } from 'react'

// The big card preview image: takes the sources in order, moving on to the next one when an address fails
function OverlayCardImage(props) {
    const { urls, className, style } = props

    const [attempt, setAttempt] = useState({ first: urls[0], index: 0 })

    const index = attempt.first === urls[0] ? attempt.index : 0

    if (index >= urls.length) return null

    return <img className={className || 'overlayImage'} style={style} src={urls[index]} alt="" onError={() => setAttempt({ first: urls[0], index: index + 1 })} />
}

export default OverlayCardImage
