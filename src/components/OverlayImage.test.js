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

// a little longer than the delay of the preview
const SETTLED = 260

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

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
    const event = new MouseEvent(type, { bubbles: type !== 'pointerenter' && type !== 'pointerleave', clientX: 10, clientY: 10, ...init })

    Object.defineProperty(event, 'pointerType', { value: 'mouse' })
    act(() => { target.dispatchEvent(event) })
}

describe('the hover preview', () => {
    it('opens once the pointer has settled on the card', async () => {
        const { store, probe } = setup()

        pointer('pointermove', document.body)
        pointer('pointerover', probe)
        pointer('pointerenter', probe)

        // not at once
        expect(store.getState().settings.imagesrc).toBe(null)

        await wait(SETTLED)

        expect(store.getState().settings.imagesrc).not.toBe(null)
    })

    it('does not open for a pointer that only passes over the card', async () => {
        const { store, probe } = setup()

        pointer('pointermove', document.body)
        pointer('pointerover', probe)
        pointer('pointerenter', probe)
        await wait(60)
        // (React turns a pointerout to another place into the pointer leaving)
        pointer('pointerout', probe, { relatedTarget: document.body })

        await wait(SETTLED)

        expect(store.getState().settings.imagesrc).toBe(null)
    })

    it('waits for the pointer to stop while it moves over the card', async () => {
        const { store, probe } = setup()

        pointer('pointermove', document.body)
        pointer('pointerover', probe)
        pointer('pointerenter', probe)

        // moving on the card, with less than the delay between the movements: it keeps waiting
        for (let step = 1; step <= 4; step++) {
            await wait(100)
            pointer('pointermove', probe, { clientX: 10 + step * 20 })
            expect(store.getState().settings.imagesrc).toBe(null)
        }

        await wait(SETTLED)

        expect(store.getState().settings.imagesrc).not.toBe(null)
    })

    it('waits when the card comes up under a pointer that is not moving', async () => {
        const { store, probe } = setup()

        await wait(200)
        pointer('pointerover', probe)
        pointer('pointerenter', probe)

        await wait(SETTLED)

        expect(store.getState().settings.imagesrc).toBe(null)

        // the pointer moves: now it counts, and the preview comes when it has settled
        pointer('pointermove', probe, { clientX: 30 })

        await wait(SETTLED)

        expect(store.getState().settings.imagesrc).not.toBe(null)
    })
})
