import { EXPANSION_SUFFIX } from './Languages'

const PackData = {
    'core': 'Core set',
    'core2': 'Second core set',
    'dwl': 'The Dunwich Legacy',
    'tmm': 'The Miskatonic Museum',
    'tece': 'The Essex County Express',
    'bota': 'Blood on the Altar',
    'uau': 'Undimensioned and Unseen',
    'wda': 'Where Doom Awaits',
    'litas': 'Lost in Time and Space',
    'ptc': 'The Path to Carcosa',
    'eotp': 'Echoes of the Past',
    'tuo': 'The Unspeakable Oath',
    'apot': 'A Phantom of Truth',
    'tpm': 'The Pallid Mask',
    'bsr': 'Black Stars Rise',
    'dca': 'Dim Carcosa',
    'tfa': 'The Forgotten Age',
    'tof': 'Threads of Fate',
    'tbb': 'The Boundary Beyond',
    'hote': 'Heart of the Elders',
    'tcoa': 'The City of Archives',
    'tdoy': 'The Depths of Yoth',
    'sha': 'Shattered Aeons',
    'tcu': 'The Circle Undone',
    'tsn': 'The Secret Name',
    'wos': 'The Wages of Sin',
    'fgg': 'For the Greater Good',
    'uad': 'Union and Disillusion',
    'icc': 'In the Clutches of Chaos',
    'bbt': 'Before the Black Throne',
    'tde': 'The Dream Eaters',
    'sfk': 'The Search for Kadath',
    'tsh': 'A Thousand Shapes of Horror',
    'dsm': 'Dark Side of the Moon',
    'pnr': 'Point of No Return',
    'wgd': 'Where the Gods Dwell',
    'woc': 'Weaver of the Cosmos',
    'tic': 'The Innsmouth Conspiracy',
    'itd': 'In Too Deep',
    'def': 'Devil Reef',
    'hhg': 'Horror in High Gear',
    'lif': 'A Light in the Fog',
    'lod': 'The Lair of Dagon',
    'itm': 'Into the Maelstrom',
    'nat': 'Nathaniel Cho',
    'har': 'Harvey Walters',
    'win': 'Winifred Habbamock',
    'jac': 'Jacqueline Fine',
    'ste': 'Stella Clark',
    'rtnotz': 'Return to the Night of the Zealot',
    'rtdwl': 'Return to the Dunwich Legacy',
    'rtptc': 'Return to the Path to Carcosa',
    'rttfa': 'Return to the Forgotten Age',
    'rttcu': 'Return to the Circle Undone',
    'eoep': 'Edge of the Earth',
    'tskp': 'The Scarlet Keys',
    'fhvp': 'The Feast of Hemlock Vale',
    'tdcp': 'The Drowned City',
    'core_2026': 'Core Set (2026)',
    'mar': 'Marie Lambeau',
    'tom': 'Tommy Muldoon',
    'mig': 'Miguel de la Cruz',
    'and': 'André Patel',
    'car': 'Carolyn Fern'}

// Pack names come from ArkhamDB too: this adds the ones the list above doesn't have (the list stays as the names used when ArkhamDB
// can't be reached). Investigator expansions are shown without that suffix, as their packs always were.
// (language is the one the name is in, when it is a translated one; a pack the translated site hasn't translated keeps the English suffix)
export function displayPackName(name, language) {
    const withoutSuffix = name.replace(/ Investigator Expansion$/, '')

    return EXPANSION_SUFFIX[language] ? withoutSuffix.replace(EXPANSION_SUFFIX[language], '') : withoutSuffix
}

export function registerPackNames(packs) {
    packs.forEach(pack => {
        if (!(pack.code in PackData)) PackData[pack.code] = displayPackName(pack.name)
    })
}

export default PackData
