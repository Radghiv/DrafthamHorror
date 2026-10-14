import React, { useState } from 'react'

import { getTheme, setTheme } from '../theme'
import { SunIcon, MoonIcon, AutoFailIcon, ElderSignIcon } from './wizard/Icons'
import { useT, msg } from '../i18n'

const THEMES = [
    { key: 'light', label: msg('Day theme'), icon: <SunIcon /> },
    { key: 'dark', label: msg('Night theme'), icon: <MoonIcon /> },
    { key: 'arkham', label: msg('Arkham theme'), icon: <AutoFailIcon /> },
    { key: 'innsmouth', label: msg('Innsmouth theme'), icon: <ElderSignIcon /> }
]

// Day, night, Arkham (the colors of the game) and Innsmouth (sea blue-green) themes, with its label for the settings panel
function ThemeToggle() {
    const t = useT()

    const [theme, changeTheme] = useState(getTheme())

    function handleClick(key) {
        setTheme(key)
        changeTheme(key)
    }

    return (
        <div className="cols-control">
            <span className="cols-label">{t('Theme')}</span>
            <div className="theme-switch" role="group" aria-label={t('Theme')}>
                {THEMES.map(item => (
                    <button type="button" key={item.key} aria-pressed={theme === item.key} title={t(item.label)} aria-label={t(item.label)}
                        onClick={() => handleClick(item.key)}>
                        {item.icon}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default ThemeToggle
