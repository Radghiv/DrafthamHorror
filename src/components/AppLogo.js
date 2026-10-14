import React from 'react'

import logo from '../assets/logo.webp'

// With onClick the logo is a button that takes the user back to the home screen
function AppLogo(props) {
    const { onClick } = props

    const image = <img className="app-logo" src={logo} alt="Draftham Horror" />

    if (!onClick) return image

    return <button type="button" className="app-logo-button" onClick={onClick}>{image}</button>
}

export default AppLogo
