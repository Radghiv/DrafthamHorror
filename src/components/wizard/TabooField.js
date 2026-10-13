import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { changeSetting, calculateFilteredCount } from '../../features/settings/settingsSlice'
import { useT, useFormatDate, LONG_DATE } from '../../i18n'

// Taboo list in effect, chosen along with the collection
function TabooField() {
    const t = useT()
    const formatDate = useFormatDate()
    const tabooData = useSelector(state => state.data.tabooData)
    const selectedTaboo = useSelector(state => state.settings.selectedTaboo)

    const dispatch = useDispatch()

    function handleChange(event) {
        dispatch(changeSetting('SelectedTaboo', event.target.value))
        dispatch(calculateFilteredCount)
    }

    const options = tabooData ? tabooData.map((item, index) => {
        const date = formatDate(item.date_start, LONG_DATE)

        return <option value={item.id} key={item.id}>{index === tabooData.length - 1 ? t('{date} (latest)', { date: date }) : date}</option>
    }) : []

    return (
        <div className="field">
            <label htmlFor="taboo-list">{t('Taboo list')}</label>
            <select id="taboo-list" name="SelectedTaboo" value={selectedTaboo} onChange={handleChange}>
                <option value="0">{t('None')}</option>
                {options}
            </select>
        </div>
    )
}

export default TabooField
