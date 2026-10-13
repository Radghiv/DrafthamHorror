import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { investigatorEntries } from '../data/InvestigatorList'

// The entries of the investigator list (built from the card data)
function useInvestigatorEntries() {
    const cardData = useSelector(state => state.data.cardData)

    return useMemo(() => investigatorEntries(cardData), [cardData])
}

export default useInvestigatorEntries
