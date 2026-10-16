import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeSetting } from '../features/settings/settingsSlice'
import { SEALED_MAX_EXTRA, sealedExtraFor } from '../draft/Sealed'
import useSealedPoolSize, { sealedPoolLabel } from './useSealedPoolSize'
import { useT } from '../i18n'
import SegmentedRange from './SegmentedRange'

// The size of the sealed pool of a small phase (the replacements of level 0, Versatile, the bonus experience), in the settings of its panel: the percentage over the
// cards to pick, which overrides the general one of the setup, and how many cards that comes to. It takes the place of "Cards to select from".
function SealedExtraSetting(props) {
    const { phase } = props

    const t = useT()
    const settings = useSelector(state => state.settings)
    const dispatch = useDispatch()

    const poolSize = useSealedPoolSize(phase, true)

    const extra = sealedExtraFor(settings, phase)
    const overridden = extra !== settings.sealedExtra || (settings.sealedPhaseExtra && typeof settings.sealedPhaseExtra[phase] === 'number')

    return (
        <>
            <div className="fbsetting">
                <label className="fbdraftsettingleft">{t('Extra cards in the pool')}</label>
                <span className="fbdraftsettingslider">
                    <SegmentedRange min="0" max={SEALED_MAX_EXTRA} step="10" value={extra}
                        onChange={event => dispatch(changeSetting('SealedPhaseExtra', { phase: phase, value: event.target.value }))} />
                </span>
                <span className="fbdraftsettingslidervalue sealed-percent-value">{'+' + extra + '%'}</span>
            </div>
            <div className="fbsetting">
                <label className="fbdraftsettingleft"></label>
                <span className="fbdraftsettingcenter sealed-extra-note">
                    {poolSize ? <span className="sealed-pool-preview">{sealedPoolLabel(t, poolSize, phase)}</span> : null}
                    {overridden ?
                        <button type="button" className="link-btn" onClick={() => dispatch(changeSetting('SealedPhaseExtra', { phase: phase, value: null }))}>{t('Use the general setting (+{percent}%)', { percent: settings.sealedExtra })}</button>
                        : null}
                </span>
                <span className="fbdraftsettingright"></span>
            </div>
        </>
    )
}

export default SealedExtraSetting
