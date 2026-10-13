// Writes src/i18n/catalog.json: every text of the interface, to hand to a translator (or to check what is still missing).
//   node scripts/i18n-catalog.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { scanKeys } from './i18n-scan.mjs'

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const keys = scanKeys(src)

fs.writeFileSync(path.join(src, 'i18n', 'catalog.json'), JSON.stringify(Object.fromEntries([...keys.keys()].map(key => [key, key])), null, 2) + '\n')
console.log(keys.size + ' texts written to src/i18n/catalog.json')
