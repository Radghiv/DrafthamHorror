import { t } from '../i18n'

// Speeds of the animations (cards turning over, a drafted card flying to the list, the steps of the setup...), chosen with a slider: the position
// is an index into this list and the value a multiplier; 0 skips the animations.
export const ANIMATION_SPEEDS = [0, 0.5, 1, 1.5, 2, 3]

export const DEFAULT_ANIMATION_SPEED = 2

// The speed multiplier for a slider position, 0 when the system asks for reduced motion
export function motionSpeed(position) {
    const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    return reduced ? 0 : (ANIMATION_SPEEDS[position] || 0)
}

export function animationSpeedLabel(position) {
    const factor = ANIMATION_SPEEDS[position]

    return factor === 0 ? t('Off') : factor + '×'
}
