import { describe, test, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

import { scanKeys } from '../../scripts/i18n-scan.mjs'
import { pluralForms, translateTo, loadLocale } from './index'
import { LANGUAGES } from '../data/Languages'

const srcDir = path.resolve(__dirname, '..')
const localesDir = path.join(__dirname, 'locales')
const keys = [...scanKeys(srcDir).keys()]

// the placeholders a text uses, each once (a plural key repeats them in every form, and a language with one form has fewer copies)
const placeholders = text => [...new Set(text.match(/\{\w+\}/g) || [])].sort().join(',')

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

    test('loads a dictionary and uses it', async () => {
        await loadLocale('it')

        expect(translateTo('it', 'Start draft')).not.toBe('Start draft')
        expect(translateTo('it', 'Start draft')).toBe(JSON.parse(fs.readFileSync(path.join(localesDir, 'it.json'), 'utf-8'))['Start draft'])
    })

    test('uses the plural rules of the language', async () => {
        await loadLocale('ru')

        const forms = JSON.parse(fs.readFileSync(path.join(localesDir, 'ru.json'), 'utf-8'))['{count} card|{count} cards'].split('|')

        // Russian: one = 1, few = 2-4, many = 5-20
        expect(translateTo('ru', '{count} card|{count} cards', { count: 1 })).toBe(forms[0].replace('{count}', '1'))
        expect(translateTo('ru', '{count} card|{count} cards', { count: 3 })).toBe(forms[1].replace('{count}', '3'))
        expect(translateTo('ru', '{count} card|{count} cards', { count: 5 })).toBe(forms[2].replace('{count}', '5'))
        expect(translateTo('ru', '{count} card|{count} cards', { count: 21 })).toBe(forms[0].replace('{count}', '21'))
    })

    test('shows English for a text without translation', async () => {
        expect(translateTo('it', 'A text that nobody translated')).toBe('A text that nobody translated')
    })
})
