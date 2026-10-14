import React, { useEffect, useRef, useState } from 'react'

import { motionScale } from './useMotionScale'

// Keeps something on the screen while it leaves. A thing that is shown with `visible` normally disappears the moment it turns false; here
// it stays for `exitMs` (at 1×, scaled by the animation speed, none at all when the animations are off) with `leaving` true, so the CSS
// can play the exit (the classes called is-leaving in styles.css).
export default function usePresence(visible, exitMs) {
    const [mounted, setMounted] = useState(visible)
    const [leaving, setLeaving] = useState(false)

    useEffect(() => {
        if (visible) {
            setMounted(true)
            setLeaving(false)

            return undefined
        }

        if (!mounted) return undefined

        const wait = exitMs * motionScale()

        if (wait <= 0) {
            setMounted(false)

            return undefined
        }

        setLeaving(true)

        const timer = setTimeout(() => {
            setMounted(false)
            setLeaving(false)
        }, wait)

        return () => clearTimeout(timer)
    }, [visible, mounted, exitMs])

    return { mounted: visible || mounted, leaving: leaving && !visible }
}

// Shows its only child (one element) while `visible`, and keeps showing the last one it was given while it leaves, with the class
// `is-leaving` added. Entering is a CSS animation of the element (it plays when the element is added to the page).
export function Presence(props) {
    const { visible, exit = 200, children } = props

    const { mounted, leaving } = usePresence(visible, exit)
    const last = useRef(children)

    if (visible) last.current = children

    if (!mounted || !last.current) return null

    const child = last.current

    return leaving ? React.cloneElement(child, { className: (child.props.className ? child.props.className + ' ' : '') + 'is-leaving' }) : child
}
