import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { initTheme } from './theme'
import ArkhamDraft from './ArkhamDraft'
import store from './store'
import { Provider } from 'react-redux'

import { fetchCards, fetchTaboo, fetchPacks, fetchTranslations } from './features/data/dataSlice'
import { loadLocale, setCurrentLanguage } from './i18n'

async function start() {
    initTheme()

    // the texts of the saved language are ready before anything is shown
    const language = store.getState().settings.language

    await loadLocale(language)
    setCurrentLanguage(language)

    store.dispatch(fetchCards)
    store.dispatch(fetchTaboo)
    store.dispatch(fetchPacks)
    store.dispatch(fetchTranslations)

    createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <Provider store={store}>
                <ArkhamDraft />
            </Provider>
        </React.StrictMode>
    )
}

start()
