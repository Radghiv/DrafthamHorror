import React, { useState } from 'react'

import { getTheme, setTheme } from '../theme'
import { SunIcon, MoonIcon, AutoFailIcon } from './wizard/Icons'
import { useT, msg } from '../i18n'

const THEMES = [
    { key: 'light', label: msg('Day theme'), icon: <SunIcon /> },
    { key: 'dark', label: msg('Night theme'), icon: <MoonIcon /> },
    { key: 'arkham', label: msg('Arkham theme'), icon: <AutoFailIcon /> }
]

// Day, night and Arkham (the colors of the game) themes
function ThemeToggle() {
    const t = useT()

    const [theme, changeTheme] = useState(getTheme())

    function handleClick(key) {
        setTheme(key)
        changeTheme(key)
    }

    return (
        <div className="theme-switch" role="group" aria-label={t('Theme')}>
            {THEMES.map(item => (
                <button type="button" key={item.key} aria-pressed={theme === item.key} title={t(item.label)} aria-label={t(item.label)}
                    onClick={() => handleClick(item.key)}>
                    {item.icon}
                </button>
            ))}
        </div>
    )
}

export default ThemeToggle
