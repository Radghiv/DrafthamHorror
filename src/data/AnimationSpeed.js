import { t } from '../i18n'

// Speeds of the draft animations (cards turning over, a drafted card flying to the list), chosen with a slider: the position
// is an index into this list and the value a multiplier; 0 skips the animations.
export const ANIMATION_SPEEDS = [0, 0.5, 1, 1.5, 2, 3]

export const DEFAULT_ANIMATION_SPEED = 2

export function animationSpeedLabel(position) {
    const factor = ANIMATION_SPEEDS[position]

    return factor === 0 ? t('Off') : factor + '×'
}
