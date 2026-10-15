// Collection layout: pack codes grouped by cycle, hard coded (also avoids incomplete ArkhamDB entries). A group is of Chapter 1 unless it says
// chapter: 2.
const CollectionGroups = [
    { title: 'Core', codes: ['core', 'core2'], kind: 'core' },
    { title: 'Starter Decks', codes: ['nat', 'har', 'win', 'jac', 'ste'], kind: 'starter' },
    { title: 'The Dunwich Legacy', codes: ['dwl', 'tmm', 'tece', 'bota', 'uau', 'wda', 'litas'] },
    { title: 'The Path to Carcosa', codes: ['ptc', 'eotp', 'tuo', 'apot', 'tpm', 'bsr', 'dca'] },
    { title: 'The Forgotten Age', codes: ['tfa', 'tof', 'tbb', 'hote', 'tcoa', 'tdoy', 'sha'] },
    { title: 'The Circle Undone', codes: ['tcu', 'tsn', 'wos', 'fgg', 'uad', 'icc', 'bbt'] },
    { title: 'The Dream-Eaters', codes: ['tde', 'sfk', 'tsh', 'dsm', 'pnr', 'wgd', 'woc'] },
    { title: 'The Innsmouth Conspiracy', codes: ['tic', 'itd', 'def', 'hhg', 'lif', 'lod', 'itm'] },
    { title: 'Edge of the Earth', codes: ['eoep'] },
    { title: 'The Scarlet Keys', codes: ['tskp'] },
    { title: 'The Feast of Hemlock Vale', codes: ['fhvp'] },
    { title: 'The Drowned City', codes: ['tdcp'] },
    { title: 'Return to Boxes', codes: ['rtnotz', 'rtdwl', 'rtptc', 'rttfa', 'rttcu'], kind: 'return' },
    { title: 'Core 2026', codes: ['core_2026'], chapter: 2, kind: 'core' },
    { title: 'Starter Decks 2026', codes: ['mar', 'tom', 'mig', 'and', 'car'], chapter: 2, kind: 'starter' }
]

export const CORE_CODES = ['core', 'core2', 'core_2026']

export default CollectionGroups
