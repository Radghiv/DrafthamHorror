// @vitest-environment jsdom
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { describe, it, expect, vi } from 'vitest'

import InstallButton from './InstallButton'

window.IS_REACT_ACT_ENVIRONMENT = true

const store = configureStore({ reducer: { settings: (state = { language: 'en' }) => state } })

describe('install button', () => {
    it('shows when the browser can install the app, opens its dialog, and stays (with the menu hint) if the dialog is closed', async () => {
        const container = document.createElement('div')

        document.body.appendChild(container)
        await act(async () => { createRoot(container).render(<Provider store={store}><InstallButton /></Provider>) })

        // nothing to install with yet
        expect(container.querySelector('.install-btn')).toBeNull()

        const prompt = vi.fn()
        const event = new Event('beforeinstallprompt', { cancelable: true })

        event.prompt = prompt
        event.userChoice = Promise.resolve({ outcome: 'dismissed' })
        await act(async () => { window.dispatchEvent(event) })

        expect(event.defaultPrevented).toBe(true)

        const button = container.querySelector('.install-btn button')

        expect(button).not.toBeNull()
        expect(container.querySelector('.install-tip').textContent).toContain('starts faster and works offline')

        await act(async () => { button.click() })

        expect(prompt).toHaveBeenCalled()

        // closed without installing: the button stays and the tooltip points to the menu of the browser
        expect(container.querySelector('.install-btn')).not.toBeNull()
        expect(container.querySelector('.install-tip').textContent).toContain('install it from its menu')
    })
})
