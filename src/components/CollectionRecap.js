import React from 'react'
import { useSelector } from 'react-redux'

import { summarizeCollection } from '../data/CollectionSummary'
import useCollectionGroups from './useCollectionGroups'
import { useT, msg } from '../i18n'

// What each row of the recap is called
const LABELS = {
    core: msg('Core Set'),
    starter: msg('Starter Decks'),
    expansion: msg('Expansions'),
    return: msg('Return to Boxes'),
    promo: msg('Promos'),
    printplay: msg('Print & Play')
}

// The collection at a glance: for each chapter, how much of each kind of product is selected ("Starter Decks 5/5"). Expansions are counted
// by campaign or cycle, everything else by pack, and the core set as one set.
function CollectionRecap() {
    const t = useT()

    const groups = useCollectionGroups()
    const collection = useSelector(state => state.collection)

    const summary = summarizeCollection(groups, collection)

    return (
        <div className="recap">
            {summary.chapters.map(chapter => (
                <section className="recap-chapter" key={chapter.chapter} aria-label={t('Chapter {number}', { number: chapter.chapter })}>
                    {summary.chapters.length > 1 ? <h3 className="recap-title">{t('Chapter {number}', { number: chapter.chapter })}</h3> : null}
                    <ul className="recap-rows">
                        {chapter.rows.map(row => {
                            const state = row.selected === 0 ? 'none' : row.selected === row.total && row.partial === 0 ? 'full' : 'partial'

                            return (
                                <li className={'recap-row is-' + state} key={row.kind}>
                                    <span className="recap-label">{t(LABELS[row.kind])}</span>
                                    <span className="recap-note">{row.partial > 0 ? t('{count} partial', { count: row.partial }) : null}</span>
                                    <span className="recap-count">{row.selected}/{row.total}</span>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            ))}
        </div>
    )
}

export default CollectionRecap
