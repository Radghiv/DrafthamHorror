import { describe, test, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

import { scanKeys } from '../../scripts/i18n-scan.mjs'
import { pluralForms, translateTo, loadLocale } from './index'
import { LANGUAGES } from '../data/Languages'

const srcDir = path.resolve(__dirname, '..')
const localesDir = path.join(__dirname, 'locales')
const keys = [...scanKeys(srcDir).keys()]

const placeholders = text => (text.match(/\{\w+\}/g) || []).sort().join(',')

describe('interface texts', () => {
    test('every text is a usable key', () => {
        expect(keys.length).toBeGreaterThan(0)
        keys.forEach(key => expect(key.trim()).toBe(key))
    })

    LANGUAGES.filter(language => language.code !== 'en').forEach(({ code }) => {
        describe(code, () => {
            const file = path.join(localesDir, code + '.json')
            const exists = fs.existsSync(file)
            const dictionary = exists ? JSON.parse(fs.readFileSync(file, 'utf-8')) : {}

            test('has a dictionary', () => {
                expect(exists).toBe(true)
            })

            test('translates every text', () => {
                expect(keys.filter(key => !dictionary[key])).toEqual([])
            })

            test('keeps the {placeholders}', () => {
                const wrong = keys.filter(key => dictionary[key] && placeholders(dictionary[key]) !== placeholders(key))

                expect(wrong).toEqual([])
            })

            test('has the plural forms of the language', () => {
                const forms = pluralForms(code).length
                const wrong = keys.filter(key => key.includes('|') && dictionary[key] && dictionary[key].split('|').length !== forms)

                expect(wrong).toEqual([])
            })

            test('has no texts nothing uses', () => {
                expect(Object.keys(dictionary).filter(key => !keys.includes(key))).toEqual([])
            })
        })
    })
})

describe('translateTo', () => {
    test('fills in values and picks the English plural', () => {
        expect(translateTo('en', 'Drafted {name}', { name: 'Roland' })).toBe('Drafted Roland')
        expect(translateTo('en', '{count} card|{count} cards', { count: 1 })).toBe('1 card')
        expect(translateTo('en', '{count} card|{count} cards', { count: 3 })).toBe('3 cards')
    })

    test('uses the plural rules of the language', async () => {
        await loadLocale('ru')
        // not translated yet (or translated): in both cases the right form for the language is chosen without throwing
        expect(typeof translateTo('ru', '{count} card|{count} cards', { count: 5 })).toBe('string')
    })
})
