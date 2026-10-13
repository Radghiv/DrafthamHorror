import React, { useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { addBannedCard, removeBannedCard, clearBannedCards, calculateFilteredCount } from '../../features/settings/settingsSlice'
import useCardOverlay from '../OverlayImage'
import useCardName from '../useCardName'
import { useT } from '../../i18n'

const normalize = text => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const PLAYER_CARD_TYPES = ['asset', 'event', 'skill']

// Cards that never show up in the drafts, whatever their level: search a card by name and add it to the list
function BanList() {
    const t = useT()
    const cardData = useSelector(state => state.data.cardData)
    const bannedCards = useSelector(state => state.settings.bannedCards)

    const dispatch = useDispatch()

    const [query, setQuery] = useState('')

    // the suggestions are shown while the search is being used: they close when the focus leaves the search and its list
    const [open, setOpen] = useState(false)

    const doCardOverlay = useCardOverlay()
    const { cardName } = useCardName()

    // every player card name once (the levels of a card share its name), with a normalized copy to search in and the card to
    // preview: its lowest level
    const names = useMemo(() => {
        const byName = new Map()

        if (cardData) {
            cardData.forEach(card => {
                if (PLAYER_CARD_TYPES.includes(card.type_code) && card.faction_code !== 'mythos' && !card.bonded_to) {
                    const known = byName.get(card.name)

                    if (!known || card.xp < known.xp) byName.set(card.name, card)
                }
            })
        }

        return Array.from(byName.values())
            .map(card => ({ name: card.name, display: cardName(card), search: normalize(card.name + ' ' + cardName(card)), card: card }))
            .sort((a, b) => a.display.localeCompare(b.display))
    }, [cardData, cardName])

    const cardsByName = useMemo(() => new Map(names.map(item => [item.name, item.card])), [names])

    // a banned card is kept by its English name; this is how it is shown
    const displayName = name => cardsByName.has(name) ? cardName(cardsByName.get(name)) : name

    // big preview of a card of the list, for the pointer and for the keyboard
    const preview = card => ({
        onPointerEnter: event => doCardOverlay(card, event),
        onPointerLeave: () => doCardOverlay(null),
        onFocus: event => doCardOverlay(card, event),
        onBlur: () => doCardOverlay(null)
    })

    const search = normalize(query.trim())

    const suggestions = !open || search.length < 2 ? [] :
        names.filter(item => item.search.includes(search) && !bannedCards.includes(item.name)).slice(0, 8)

    function ban(name) {
        doCardOverlay(null)
        dispatch(addBannedCard(name))
        dispatch(calculateFilteredCount)
        setQuery('')
    }

    function unban(name) {
        doCardOverlay(null)
        dispatch(removeBannedCard(name))
        dispatch(calculateFilteredCount)
    }

    function clearAll() {
        doCardOverlay(null)
        dispatch(clearBannedCards())
        dispatch(calculateFilteredCount)
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault()

            if (suggestions.length > 0) ban(suggestions[0].name)
        }
        else if (event.key === 'Escape') {
            setQuery('')
            setOpen(false)
        }
    }

    return (
        <div className="field ban-list" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
            <label htmlFor="ban-search">{t('Ban list')}</label>
            <input id="ban-search" type="text" value={query} autoComplete="off" placeholder={t('Search a card to leave out of the drafts...')}
                onChange={event => { setQuery(event.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={handleKeyDown} />

            {suggestions.length > 0 ?
                <ul className="ban-suggestions" aria-label={t('Matching cards')} onMouseDown={event => event.preventDefault()}>
                    {suggestions.map(item => (
                        <li key={item.name}>
                            <button type="button" onClick={() => ban(item.name)} {...preview(item.card)}>{item.display}</button>
                        </li>
                    ))}
                </ul>
                : open && search.length >= 2 ? <p className="field-hint">{t('No card matches "{query}".', { query: query.trim() })}</p> : null}

            {bannedCards.length > 0 ?
                <div className="chips">
                    {bannedCards.map(name => (
                        <button type="button" className="chip" key={name} aria-pressed="true" aria-label={t('Take {name} off the ban list', { name: displayName(name) })} onClick={() => unban(name)}
                            {...preview(cardsByName.get(name))}>
                            <span className="chip-label" data-text={displayName(name)}>{displayName(name)}</span>
                            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3 3 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                        </button>
                    ))}
                    <button type="button" className="link-btn" onClick={clearAll}>{t('Clear the list')}</button>
                </div>
                : null}

            <p className="field-hint">{t('Banned cards never show up in the drafts, at any level. Cards already in a deck you upgrade stay in it.')}</p>
        </div>
    )
}

export default BanList
