import React from 'react'

// A slider whose positions are drawn as segments: one per step, filled up to the knob, with the gaps between them under the positions the
// knob can stop at. It is a normal range input (same props, same keyboard and screen reader behavior) in a wrapper that draws the track
// from --steps and --fill (see "segmented sliders" in styles.css). A slider with many steps is drawn as one continuous bar instead.
const MAX_SEGMENTS = 20

function SegmentedRange(props) {
    const { className, min, max, step, value, ...inputProps } = props

    const low = Number(min)
    const high = Number(max)
    const size = Number(step) || 1
    const steps = Math.max(1, Math.round((high - low) / size))
    const fill = high > low ? Math.min(1, Math.max(0, (Number(value) - low) / (high - low))) : 0

    return (
        <span className={'segmented-range' + (steps > MAX_SEGMENTS ? ' is-continuous' : '') + (className ? ' ' + className : '')} style={{ '--steps': steps, '--fill': fill }}>
            <input type="range" min={min} max={max} step={step} value={value} {...inputProps} />
        </span>
    )
}

export default SegmentedRange
