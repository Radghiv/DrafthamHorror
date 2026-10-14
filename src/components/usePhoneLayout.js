import { useState, useEffect } from 'react'

// A phone: a narrow screen, or a short landscape one that can't hover (a phone turned sideways). The phone layout (bottom dock, one
// sheet for the deck, sticky bars; see the .is-phone rules in styles.css) is chosen in JavaScript, with this query, so the components
// that only exist on a phone are not rendered at all elsewhere and a PC keeps exactly its own layout.
export const PHONE_QUERY = '(max-width: 700px), (max-height: 500px) and (orientation: landscape) and (hover: none)'

function matches() {
    return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(PHONE_QUERY).matches
}

function usePhoneLayout() {
    const [phone, setPhone] = useState(matches)

    useEffect(() => {
        if (!window.matchMedia) return undefined

        const query = window.matchMedia(PHONE_QUERY)

        function update() {
            setPhone(query.matches)
        }

        update()
        query.addEventListener('change', update)

        return () => query.removeEventListener('change', update)
    }, [])

    return phone
}

export default usePhoneLayout

// A phone held sideways has no room for a bottom dock: the dock becomes a column on the right and the sheet opens from that edge
export const SIDE_SHEET_QUERY = '(orientation: landscape) and (max-height: 520px)'
