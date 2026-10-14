import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { motionSpeed } from '../data/AnimationSpeed'

// Puts the animation speed chosen in the settings on the page as --motion-scale, the factor of the durations of the CSS animations
// (written for 1×, they are multiplied by it: 0.5 at 2×, 0 when the animations are off or reduced motion is asked for)
function useMotionScale() {
    const animationSpeed = useSelector(state => state.settings.animationSpeed)

    useEffect(() => {
        const speed = motionSpeed(animationSpeed)

        document.documentElement.style.setProperty('--motion-scale', speed === 0 ? '0' : String(1 / speed))
    }, [animationSpeed])
}

// The factor right now, for the animations that are started from code
export function motionScale() {
    const value = parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--motion-scale'))

    return Number.isFinite(value) ? value : 1
}

export default useMotionScale
