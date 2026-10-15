import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSelector, useDispatch } from 'react-redux'

import { confirmCollection } from '../features/settings/settingsSlice'
import CollectionStep from './wizard/CollectionStep'
import { Presence } from './usePresence'
import useScrollLock from './useScrollLock'
import { useT } from '../i18n'

// The collection (packs, taboo list, ban list, offline storage) is something you set once and change when your collection does, so it isn't a
// step of the setup: it opens by itself on the first visit and after that from the settings (and from the Edit buttons of the review).
// Done, Escape and a click on the backdrop close it, and closing it confirms the collection. Drawn in document.body, like the Restart dialog.
function CollectionDialog() {
    const t = useT()
    const dispatch = useDispatch()

    const open = useSelector(state => state.settings.collectionOpen)

    const headingRef = useRef(null)

    useScrollLock(open)

    useEffect(() => {
        if (!open) return undefined

        const opener = document.activeElement

        function handleKeyDown(event) {
            if (event.key === 'Escape') dispatch(confirmCollection())
        }

        if (headingRef.current) headingRef.current.focus()
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)

            // back to the button that opened it
            if (opener && opener !== document.body && document.contains(opener) && opener.focus) opener.focus()
        }
    }, [open, dispatch])

    const close = () => dispatch(confirmCollection())

    return createPortal(
        <Presence visible={open} exit={200}>
        <div className="collection-backdrop" onClick={close}>
            <section className="collection-sheet" role="dialog" aria-modal="true" aria-labelledby="collection-title" onClick={event => event.stopPropagation()}>
                <header className="collection-head">
                    <div className="collection-heading">
                        <h2 id="collection-title" ref={headingRef} tabIndex={-1}>{t('Which packs do you own?')}</h2>
                        <p>{t('Only cards from the selected packs can be drafted, under the taboo list chosen here. This is remembered, so you only need to change it when your collection does.')}</p>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={close}>{t('Done')}</button>
                </header>
                <div className="collection-body">
                    <CollectionStep />
                </div>
            </section>
        </div>
        </Presence>,
        document.body)
}

export default CollectionDialog
