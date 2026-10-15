// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

import settingsReducer from '../features/settings/settingsSlice'
import useCardOverlay from './OverlayImage'

window.IS_REACT_ACT_ENVIRONMENT = true

const card = { code: '01001', name: 'Roland Banks', imagesrc: '/bundles/cards/01001.png' }

function Probe() {
    const overlay = useCardOverlay()

    return <div id="probe" onPointerEnter={event => overlay(card, event)} onPointerLeave={() => overlay(null)}>card</div>
}

function setup() {
    const store = configureStore({ reducer: { settings: settingsReducer } })
    const container = document.createElement('div')

    document.body.appendChild(container)

    const root = createRoot(container)

    act(() => { root.render(<Provider store={store}><Probe /></Provider>) })

    return { store, probe: container.querySelector('#probe') }
}

function pointer(type, target, init) {
    const event = new MouseEvent(type, { bubbles: type !== 'pointerenter', clientX: 10, clientY: 10, ...init })

    Object.defineProperty(event, 'pointerType', { value: 'mouse' })
    act(() => { target.dispatchEvent(event) })
}

describe('the hover preview', () => {
    it('opens when the pointer comes in while it is moving', () => {
        const { store, probe } = setup()

        pointer('pointermove', document.body)
        pointer('pointerover', probe)
        pointer('pointerenter', probe)

        expect(store.getState().settings.imagesrc).not.toBe(null)
    })

    it('waits when the card comes up under a pointer that is not moving', async () => {
        const { store, probe } = setup()

        await new Promise(resolve => setTimeout(resolve, 200))
        pointer('pointerover', probe)
        pointer('pointerenter', probe)

        expect(store.getState().settings.imagesrc).toBe(null)
    })
})
