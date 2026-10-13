import React, { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { setSetupStep, confirmCollection } from '../features/settings/settingsSlice'

import CollectionStep from './wizard/CollectionStep'
import DraftRulesStep from './wizard/DraftRulesStep'
import ReviewStep from './wizard/ReviewStep'
import SetupSummary from './wizard/SetupSummary'
import SetupLeftColumn from './wizard/SetupLeftColumn'
import InvestigatorPanel from './InvestigatorPanel'
import describeSetup from './wizard/describeSetup'
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

    const currentIndex = Math.max(0, STEPS.findIndex(step => step.key === settings.setupStep))
    const current = STEPS[currentIndex]
    const info = describeSetup(settings, tabooData, collection)

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

    return (
        <div className="wizard">
            <nav className="wizard-crumbs" aria-label={t('Setup steps')}>
                <ol className="breadcrumbs">
                    {STEPS.map((step, index) => {
                        const isCurrent = index === currentIndex
                        const isDone = !isCurrent && (index < currentIndex || (step.key === 'collection' && settings.collectionConfirmed))

                        return (
                            <li key={step.key}>
                                <button type="button" className={'step-btn' + (isDone ? ' step-done' : '')} aria-current={isCurrent ? 'step' : undefined}
                                    onClick={() => goTo(step.key)}>
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
            </nav>

            <SetupLeftColumn />

            <section className="panel wizard-main" aria-label={t(current.title)}>
                <div>
                    <p className="eyebrow">{t('Step {current} of {total}', { current: currentIndex + 1, total: STEPS.length })}</p>
                    <h1 className="panel-title" ref={headingRef} tabIndex={-1} style={{outline: 'none'}}>{t(current.heading)}</h1>
                    {current.lead ? <p className="panel-lead">{t(current.lead)}</p> : null}
                </div>

                {content}

                <div className="wizard-actions">
                    {isFirst ? <span></span> :
                        <button type="button" className="btn btn-secondary" onClick={() => goTo(STEPS[currentIndex - 1].key)}>{t('Back')}</button>}
                    {isLast ? null :
                        <button type="button" className="btn btn-primary" onClick={goNext}>{current.key === 'collection' ? t('Confirm collection') : t('Continue')}</button>}
                </div>
            </section>

            <SetupSummary hideStart={isLast} />
        </div>
    )
}

export default SetupWizard
