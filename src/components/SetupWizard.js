import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { setSetupStep, confirmCollection } from '../features/settings/settingsSlice'

import CollectionStep from './wizard/CollectionStep'
import DraftRulesStep from './wizard/DraftRulesStep'
import ReviewStep from './wizard/ReviewStep'
import SetupSummary from './wizard/SetupSummary'
import SetupLeftColumn from './wizard/SetupLeftColumn'
import useStartDraft from './wizard/useStartDraft'
import usePhoneLayout from './usePhoneLayout'
import InvestigatorPanel from './InvestigatorPanel'
import AppLogo from './AppLogo'
import SettingsMenu from './SettingsMenu'
import describeSetup from './wizard/describeSetup'
import { Presence } from './usePresence'
import { CheckIcon } from './wizard/Icons'
import { useT, msg } from '../i18n'

const STEPS = [
    { key: 'collection', title: msg('Collection'), heading: msg('Which packs do you own?'), lead: msg('Only cards from the selected packs can be drafted, under the taboo list chosen here. This is remembered, so you only need to change it when your collection does.') },
    { key: 'investigator', title: msg('Investigator'), heading: msg('How do you want to choose the investigator?'), lead: null },
    { key: 'rules', title: msg('Draft Rules'), heading: msg('Build or upgrade, and how the draft works'), lead: null },
    { key: 'review', title: msg('Review'), heading: msg('Ready to draft?'), lead: null }
]

function SetupWizard() {
    const t = useT()
    const settings = useSelector(state => state.settings)
    const tabooData = useSelector(state => state.data.tabooData)
    const collection = useSelector(state => state.collection)

    const dispatch = useDispatch()

    // a phone gets a one-line top bar (the steps open from it) and a bar at the bottom of the screen with the next action
    const phone = usePhoneLayout()
    const { start, canStart, needsInvestigator, needsDeck } = useStartDraft()

    const [stepsOpen, setStepsOpen] = useState(false)
    const topRef = useRef(null)

    const currentIndex = Math.max(0, STEPS.findIndex(step => step.key === settings.setupStep))
    const current = STEPS[currentIndex]
    const info = describeSetup(settings, tabooData, collection)

    // the direction the new step comes from, decided once when the step changes (a later render of the same step must not change it,
    // or the animation would restart)
    const travel = useRef({ index: currentIndex, direction: 'forward' })

    if (travel.current.index !== currentIndex) travel.current = { index: currentIndex, direction: currentIndex > travel.current.index ? 'forward' : 'back' }

    const subtitles = {
        collection: t('{first} · {second}', { first: info.packSummary, second: info.tabooLabel }),
        investigator: info.investigatorName,
        rules: t('{first} · {second}', { first: info.isUpgradeTab ? t('Upgrade') : t('Build Deck'), second: info.draftRules }),
        review: ''
    }

    function goTo(key) {
        // moving on from the collection counts as confirming it, so redrafting can skip it
        if (settings.setupStep === 'collection') dispatch(confirmCollection())
        dispatch(setSetupStep(key))
    }

    function goNext() {
        goTo(STEPS[currentIndex + 1].key)
    }

    // the step menu of the phone closes with a tap outside it or Escape
    useEffect(() => {
        if (!stepsOpen) return undefined

        function handlePointerDown(event) {
            if (topRef.current && !topRef.current.contains(event.target)) setStepsOpen(false)
        }
        function handleKeyDown(event) {
            if (event.key === 'Escape') setStepsOpen(false)
        }

        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [stepsOpen])

    // keyboard and screen reader users land on the new step's heading instead of losing focus
    const headingRef = useRef(null)
    const firstRender = useRef(true)

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false
            return
        }
        if (headingRef.current) headingRef.current.focus()
    }, [current.key])

    let content = null

    if (current.key === 'collection') content = <CollectionStep />
    else if (current.key === 'investigator') content = <InvestigatorPanel />
    else if (current.key === 'rules') content = <DraftRulesStep />
    else content = <ReviewStep />

    const isFirst = currentIndex === 0
    const isLast = currentIndex === STEPS.length - 1

    // the steps, each a button that goes there: the breadcrumbs of a PC and the menu of a phone
    const stepList =
        <ol className="breadcrumbs">
            {STEPS.map((step, index) => {
                const isCurrent = index === currentIndex
                // a step that is passed is done, except the investigator step while there is still no investigator (none chosen from the list, or a deck ID
                // from ArkhamDB that has not been validated)
                const isDone = !isCurrent && (index < currentIndex || (step.key === 'collection' && settings.collectionConfirmed)) && !(step.key === 'investigator' && (needsInvestigator || needsDeck))

                return (
                    <li key={step.key}>
                        <button type="button" className={'step-btn' + (isDone ? ' step-done' : '')} aria-current={isCurrent ? 'step' : undefined}
                            onClick={() => { setStepsOpen(false); goTo(step.key) }}>
                            <span className="step-num">{isDone ? <CheckIcon size={14} /> : index + 1}</span>
                            <span className="step-text">
                                <span className="step-title">{t(step.title)}</span>
                                {subtitles[step.key] ? <span className="step-sub">{subtitles[step.key]}</span> : null}
                            </span>
                        </button>
                    </li>
                )
            })}
        </ol>

    return (
        <div className="wizard">
            {phone ?
                <div className="wizard-top wizard-top-phone" ref={topRef}>
                    <AppLogo onClick={() => dispatch(setSetupStep(settings.collectionConfirmed ? 'investigator' : 'collection'))} />
                    <button type="button" className="phone-step-title" aria-expanded={stepsOpen} aria-controls="phone-step-menu" onClick={() => setStepsOpen(!stepsOpen)}>
                        <span className="phone-step-count">{t('Step {current} of {total}', { current: currentIndex + 1, total: STEPS.length })}</span>
                        <span className="phone-step-name">{t(current.title)}</span>
                        <svg className="phone-step-chevron" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m3 5 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <div className="app-header-controls">
                        <SettingsMenu />
                    </div>
                    <div className="phone-step-line" aria-hidden="true">
                        {STEPS.map((step, index) => <span className={index <= currentIndex ? 'filled' : ''} key={step.key}></span>)}
                    </div>
                    <Presence visible={stepsOpen} exit={140}>
                        <nav className="phone-step-menu" id="phone-step-menu" aria-label={t('Setup steps')}>
                            {stepList}
                        </nav>
                    </Presence>
                </div>
                :
                <div className="wizard-top">
                    <AppLogo onClick={() => dispatch(setSetupStep(settings.collectionConfirmed ? 'investigator' : 'collection'))} />
                    <nav className="wizard-crumbs" aria-label={t('Setup steps')}>
                        {stepList}
                    </nav>
                    <div className="app-header-controls">
                        <SettingsMenu />
                    </div>
                </div>}

            <SetupLeftColumn />

            <section className="panel wizard-main" aria-label={t(current.title)}>
                <div key={'head-' + current.key} className={'step-enter step-enter-' + travel.current.direction}>
                    <p className="eyebrow">{t('Step {current} of {total}', { current: currentIndex + 1, total: STEPS.length })}</p>
                    <h1 className="panel-title" ref={headingRef} tabIndex={-1} style={{outline: 'none'}}>{t(current.heading)}</h1>
                    {current.lead ? <p className="panel-lead">{t(current.lead)}</p> : null}
                </div>

                <div key={'body-' + current.key} className={'step-enter step-enter-' + travel.current.direction + ' step-enter-late'}>
                    {content}
                </div>

                <div className="wizard-actions">
                    {isFirst ? <span></span> :
                        <button type="button" className="btn btn-secondary" onClick={() => goTo(STEPS[currentIndex - 1].key)}>{t('Back')}</button>}
                    {isLast ?
                        (phone ? <button type="button" className="btn btn-primary" onClick={start} disabled={!canStart}>{t('Start draft')}</button> : null) :
                        <button type="button" className="btn btn-primary" onClick={goNext} disabled={current.key === 'investigator' && needsInvestigator}>{current.key === 'collection' ? t('Confirm collection') : t('Continue')}</button>}
                </div>
            </section>

            <SetupSummary />
        </div>
    )
}

export default SetupWizard
