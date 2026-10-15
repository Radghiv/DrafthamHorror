import { describe, it, expect } from 'vitest'

import { swipeDirection } from './useSwipe'

describe('swipeDirection', () => {
    it('tells a quick sideways movement from the finger', () => {
        expect(swipeDirection(300, 400, 150, 410, 200)).toBe('left')
        expect(swipeDirection(100, 400, 260, 380, 300)).toBe('right')
    })

    it('ignores short, slow or mostly vertical movements', () => {
        expect(swipeDirection(300, 400, 260, 400, 100)).toBe(null)
        expect(swipeDirection(300, 400, 100, 400, 1500)).toBe(null)
        expect(swipeDirection(300, 300, 200, 500, 300)).toBe(null)
        expect(swipeDirection(300, 400, 180, 480, 300)).toBe(null)
    })
})
