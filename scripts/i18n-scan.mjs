// Finds the texts of the interface: the string literals given to t(...) in src/. Used by the catalog script and by the test that checks the
// dictionaries.
import fs from 'node:fs'
import path from 'node:path'

function listFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name)

        if (entry.isDirectory()) return entry.name === 'locales' ? [] : listFiles(full)

        // the module that defines t() has examples of it in its comments
        if (full.split(path.sep).join('/').endsWith('i18n/index.js')) return []

        return entry.name.endsWith('.js') && !entry.name.endsWith('.test.js') ? [full] : []
    })
}

// the text a string literal stands for: \n and \t, and a backslash before any other character is just that character
function unescape(text) {
    return text.replace(/\\(.)/g, (match, char) => char === 'n' ? '\n' : char === 't' ? '\t' : char)
}

// the keys, sorted, each with the files that use it
export function scanKeys(srcDir) {
    const keys = new Map()
    // t( or msg( then a string literal (the first argument); the lookbehind keeps names like split( or format( out
    const pattern = /(?<![\w.$])(?:t|msg)\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g

    listFiles(srcDir).forEach(file => {
        const source = fs.readFileSync(file, 'utf-8')

        for (const match of source.matchAll(pattern)) {
            const key = unescape(match[2])

            if (!keys.has(key)) keys.set(key, new Set())
            keys.get(key).add(path.relative(srcDir, file).replace(/\\/g, '/'))
        }
    })

    return new Map([...keys.entries()].sort((a, b) => a[0].localeCompare(b[0])))
}
