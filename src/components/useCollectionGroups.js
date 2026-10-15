import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import CollectionGroups from '../data/CollectionGroups'
import { buildCollectionGroups } from '../data/PackCatalog'
import useCardName from './useCardName'
import { useT } from '../i18n'

// The groups the collection is chosen from: the cycles of the pack list of ArkhamDB (so new packs appear by themselves), or the built-in
// layout while there is no pack list
function useCollectionGroups() {
    const t = useT()
    const { packName } = useCardName()

    const packs = useSelector(state => state.data.packs)
    const cardData = useSelector(state => state.data.cardData)

    return useMemo(() => packs && cardData ? buildCollectionGroups(packs, cardData, pack => packName(pack.code), t) : CollectionGroups, [packs, cardData, packName, t])
}

export default useCollectionGroups
