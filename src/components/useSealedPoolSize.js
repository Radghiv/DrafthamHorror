import { useMemo } from 'react'
import { useSelector, useStore } from 'react-redux'

import { sealedPoolSize } from '../draft/DrawDraft'
import { isSealedXpPhase } from '../draft/Sealed'

// What the sealed pool of a phase would have, { needed, size, extra, legal }, or null (no investigator yet, or enabled is false). It is worked out with the
// filter of the draft, so it follows the setup: the investigator, the collection, the experience.
function useSealedPoolSize(phase, enabled) {
    const store = useStore()

    const settings = useSelector(state => state.settings)
    const draft = useSelector(state => state.draft)
    const collection = useSelector(state => state.collection)
    const cardData = useSelector(state => state.data.cardData)

    // (the settings, the draft and the collection are what the state it reads is made of: when they change the size is worked out again)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => enabled && cardData ? sealedPoolSize(store.getState(), phase) : null, [store, enabled, settings, draft, collection, cardData, phase])
}

// The size of a pool in words ("60 cards"); with "~" when it is an estimate (an upgrade picks as many cards as its experience buys)
export function sealedPoolLabel(t, poolSize, phase) {
    return (isSealedXpPhase(phase) ? '~' : '') + t('{count} card|{count} cards', { count: poolSize.size })
}

export default useSealedPoolSize
