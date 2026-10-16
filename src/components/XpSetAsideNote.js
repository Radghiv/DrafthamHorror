import React from 'react'
import { useSelector } from 'react-redux'

import { useT } from '../i18n'

// The experience of the upgrade that was not spent and is put aside for later, when there is some, as a note on the screens after the draft (while
// drafting it is in the bar at the bottom, see DraftPanel)
function XpSetAsideNote() {
    const t = useT()
    const xpSetAside = useSelector(state => state.draft.xpSetAside)

    if (!(xpSetAside > 0)) return null

    return <p className="notice xp-aside-note" role="status">{t('XP set aside for later: {xp}', { xp: xpSetAside })}</p>
}

export default XpSetAsideNote
