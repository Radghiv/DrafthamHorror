import { createSlice } from '@reduxjs/toolkit'

import { calculateFilteredCount } from '../settings/settingsSlice'
import { loadJSON } from '../../storage'

export const COLLECTION_STORAGE_KEY = 'draftham.collection'

const defaultCollection = {
    'core': 1, 'core2': 1,
    'dwl': 1, 'tmm': 1, 'tece': 1, 'bota': 1, 'uau': 1, 'wda': 1, 'litas': 1,
    'ptc': 1, 'eotp': 1, 'tuo': 1, 'apot': 1, 'tpm': 1, 'bsr': 1, 'dca': 1,
    'tfa': 1, 'tof': 1, 'tbb': 1, 'hote': 1, 'tcoa': 1, 'tdoy': 1, 'sha': 1,
    'tcu': 1, 'tsn': 1, 'wos': 1, 'fgg': 1, 'uad': 1, 'icc': 1, 'bbt': 1,
    'tde': 1, 'sfk': 1, 'tsh': 1, 'dsm': 1, 'pnr': 1, 'wgd': 1, 'woc': 1,
    'tic': 1, 'itd': 1, 'def': 1, 'hhg': 1, 'lif': 1, 'lod': 1, 'itm': 1,'mar': 1, 'tom': 1, 'mig': 1, 'and': 1, 'car': 1,
    'eoep': 1, 'tskp': 1, 'fhvp': 1, 'tdcp': 1, 'core_2026': 1,
    'rtnotz': 1, 'rtdwl': 1, 'rtptc': 1, 'rttfa': 1, 'rttcu': 1,
    'nat': 1, 'har': 1, 'win': 1, 'jac': 1, 'ste': 1,
    'books' : 0
}

// restore the saved collection
const savedCollection = loadJSON(COLLECTION_STORAGE_KEY, {})
const initialState = { ...defaultCollection }

// packs added later (known from ArkhamDB) are saved too
Object.keys(savedCollection).forEach(code => {
    const value = savedCollection[code]

    if (typeof value === 'boolean' || value === 0 || value === 1) initialState[code] = value
})

const collectionSlice = createSlice({
    name: 'collection',
    initialState,
    reducers: {
        setOff(state, action) { 
            action.payload.forEach(element => {
                state[element] = false
            })
        },
        // packs not seen before (new on ArkhamDB) start selected
        registerPacks(state, action) {
            action.payload.forEach(code => {
                if (!(code in state)) state[code] = 1
            })
        },
        setOn(state, action) {
            action.payload.forEach(element => {
                state[element] = true
            })
        }
    }
})

function changeCollection(name, sets) {
    return function changeInvestigatorThunk(dispatch, getState) {
        if (name === 'Off') dispatch(setOff(sets))
        else dispatch(setOn(sets))

        dispatch(calculateFilteredCount)
    }
}

export const { setOff, setOn, registerPacks } = collectionSlice.actions
export { changeCollection }

export default collectionSlice.reducer