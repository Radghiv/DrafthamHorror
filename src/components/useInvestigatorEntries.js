import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { ownedInvestigatorEntries } from '../data/InvestigatorList'

// The entries of the investigator list (built from the card data) that the collection has
function useInvestigatorEntries() {
    const cardData = useSelector(state => state.data.cardData)
    const collection = useSelector(state => state.collection)

    return useMemo(() => ownedInvestigatorEntries(cardData, collection), [cardData, collection])
}

export default useInvestigatorEntries
