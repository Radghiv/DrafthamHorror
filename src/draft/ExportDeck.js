import PackData from '../data/PackData'

// Parallel investigators are using the wrong OCTGN id

// ArkhamDB imports an .o8d file by the OCTGN id of each card, and the newest cards (the 2026 content) have none in its data yet: the importer
// can't find them, so they are left out of the file (an empty id could even match the wrong card) and reported instead. The plain text export
// goes by names and has every card.
const hasOctgnId = item => Boolean(item.octgn_id)
const labelOf = item => item.name + (item.subname ? ': ' + item.subname : '')

// The cards of the deck (and its investigator) that an .o8d file can't carry, as { code, name }
export function cardsMissingOctgnIds(cardList, cardData, investigatorData) {
    const names = []

    if (investigatorData && !investigatorData.octgn_id) names.push({ code: investigatorData.code, name: investigatorData.name })

    if (cardData) {
        cardList.forEach(listItem => {
            const card = cardData.find(dataItem => dataItem.code === listItem.key)

            if (card && !card.octgn_id) names.push({ code: card.code, name: labelOf(card) })
        })
    }

    return names
}

function ExportDeck(props) {
    const { fileType, deckTitle, investigatorData, cardList, specialCards, cardData } = props

    if (cardData === undefined || !cardData) return

    const asset = []
    const event = []
    const skill = []
    const treachery = []
    const enemy = []
    const other = []

    cardList.concat(specialCards).forEach(listItem => {
        const card = cardData.filter(dataItem => {
            return listItem.key === dataItem.code
        })[0]

        let dataObject = {
            code: card.code,
            name: listItem.name,
            subname: card.subname,
            count: listItem.count,
            xp: card.xp,
            type_code: card.type_code,
            pack: card.pack_code,
            pack_name: card.pack_name,
            octgn_id: (card.octgn_id ? card.octgn_id : '')
        }

        if (card.type_code === 'event') {
            event.push(dataObject)
        }
        else if (card.type_code === 'skill') {
            skill.push(dataObject)
        }
        else if (card.type_code === 'asset') {
            asset.push(dataObject)
        }
        else if (card.type_code === 'treachery') {
            treachery.push(dataObject)
        }
        else if (card.type_code === 'enemy') {
            enemy.push(dataObject)
        }
        else {
            other.push(dataObject)
        }
    })

    if (fileType === 'OCTGN') {
        const omitted = [asset, event, skill, treachery, enemy, other].flatMap(list => list.filter(item => !hasOctgnId(item)).map(item => ({ code: item.code, name: labelOf(item) })))

        if (!investigatorData.octgn_id) omitted.unshift({ code: investigatorData.code, name: investigatorData.name })

        ExportO8D({
            deckTitle: (deckTitle.length > 0 ? deckTitle : 'Deck'),
            investigator: investigatorData,
            assets: asset.filter(hasOctgnId),
            events: event.filter(hasOctgnId),
            skills: skill.filter(hasOctgnId),
            treacheries: treachery.filter(hasOctgnId),
            enemies: enemy.filter(hasOctgnId),
            others: other.filter(hasOctgnId)
        })

        return { omitted: omitted }
    }

    ExportTXT({
        deckTitle: (deckTitle.length > 0 ? deckTitle : 'Deck'),
        investigator: investigatorData,
        assets: asset,
        events: event,
        skills: skill,
        treacheries: treachery,
        enemies: enemy,
        others: other
    })
}

function ExportO8D(props) {
    var deckTextData = ['<?xml version="1.0" encoding="utf-8" standalone="yes"?>\r\n',
        '<deck game="a6d114c7-2e2a-4896-ad8c-0330605c90bf" sleeveid="0">\r\n',
        '  <section name="Investigator" shared="False">\r\n'
    ]
    // the investigator of the newest content has no id
    const o8dids = (props.investigator.octgn_id || '').split(':').filter(Boolean)

    o8dids.forEach( item => {
        deckTextData.push('    <card qty="1" id="' + item + '">' + props.investigator.name.replace(/["]/g, '&quot;') + '</card>\r\n')
    })

    deckTextData.push('  </section>\r\n')

    if (props.assets.length > 0) {
        deckTextData.push('  <section name="Asset" shared="False">\r\n')

        props.assets.forEach( item => {
            deckTextData.push('    <card qty="' + item.count + '" id="' + item.octgn_id + '">' + item.name.replace(/["]/g, '&quot;') + '</card>\r\n')
        })    

        deckTextData.push('  </section>\r\n')
    }

    if (props.events.length > 0) {
        deckTextData.push('  <section name="Event" shared="False">\r\n')

        props.events.forEach( item => {
            deckTextData.push('    <card qty="' + item.count + '" id="' + item.octgn_id + '">' + item.name.replace(/["]/g, '&quot;') + '</card>\r\n')
        })    

        deckTextData.push('  </section>\r\n')
    }

    if (props.skills.length > 0) {
        deckTextData.push('  <section name="Skill" shared="False">\r\n')

        props.skills.forEach( item => {
            deckTextData.push('    <card qty="' + item.count + '" id="' + item.octgn_id + '">' + item.name.replace(/["]/g, '&quot;') + '</card>\r\n')
        })    

        deckTextData.push('  </section>\r\n')
    }

    if (props.treacheries.length > 0 || props.enemies.length > 0) {
        deckTextData.push('  <section name="Weakness" shared="False">\r\n')

        if (props.treacheries.length > 0) {
            props.treacheries.forEach( item => {
                deckTextData.push('    <card qty="' + item.count + '" id="' + item.octgn_id + '">' + item.name.replace(/["]/g, '&quot;') + '</card>\r\n')
            })    
        }

        if (props.enemies.length > 0) {
            props.enemies.forEach( item => {
                deckTextData.push('    <card qty="' + item.count + '" id="' + item.octgn_id + '">' + item.name.replace(/["]/g, '&quot;') + '</card>\r\n')
            })    
        }

        deckTextData.push('  </section>\r\n')
    }

    if (props.others.length > 0) {
        deckTextData.push('  <section name="Other" shared="False">\r\n')

        props.others.forEach( item => {
            deckTextData.push('    <card qty="' + item.count + '" id="' + item.octgn_id + '">' + item.name.replace(/["]/g, '&quot;') + '</card>\r\n')
        })    

        deckTextData.push('  </section>\r\n')
    }

    deckTextData.push('<notes><![CDATA[]]></notes>\r\n')
    deckTextData.push('</deck>\r\n')

    const element = document.createElement("a")
    const file = new Blob(deckTextData, {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = props.deckTitle.replace(/\s/g, '-') + ".o8d"
    document.body.appendChild(element) // Required for this to work in FireFox
    element.click()
    document.body.removeChild(element)
}

// A line of the plain text export, written like the plain text export of ArkhamDB itself (its template plain.txt.twig), which is what its text
// import reads: "2x Name :Subtitle [level] (Pack)", with the subtitle of a treachery in parentheses instead: "1x Name (Subtitle) (Pack)".
// The import looks the card up by name, subtitle and level; the pack is only there for the reader.
function textLine(item) {
    const subtitle = item.subname ? (item.type_code === 'treachery' ? ' (' + item.subname + ')' : ' :' + item.subname) : ''
    const level = item.xp ? ' [' + item.xp + ']' : ''

    return item.count + 'x ' + item.name + subtitle + level + ' (' + (item.pack_name || PackData[item.pack]) + ')\r\n'
}

// The pattern of the lines that ArkhamDB's text import reads (BuilderController::parseTextImport): a quantity, then a name made only of letters,
// digits, spaces and " - . ' ! (it stops at any other character, a comma for one), then an optional ":subtitle" and a "[level]". It looks the card
// up by what it read, so a card whose line doesn't read back as its own name, subtitle and level is left out.
const TEXT_IMPORT_PATTERN = /^\s*(\d)x?([\p{L}lu\p{N}"\-.'! ]+):?([^[(]*)(?:\[(\d)\])?/u

// What ArkhamDB's text import does with the cards of a deck (given by code): { unreadable, ambiguous }, each a list of { code, name }.
// Unreadable: the line doesn't read back as the card, so the card is left out. Ambiguous: a weakness whose subtitle (written in parentheses, which
// the import skips) is what tells it from the other weaknesses of the same name, so the import can add any of them.
export function textImportIssues(codes, cardData) {
    const unreadable = []
    const ambiguous = []

    if (!cardData) return { unreadable: unreadable, ambiguous: ambiguous }

    new Set(codes).forEach(code => {
        const card = cardData.find(item => item.code === code)

        if (!card) return

        const match = textLine({ ...card, count: 1 }).match(TEXT_IMPORT_PATTERN)
        const reads = Boolean(match) && match[2].trim() === card.name
            && (card.type_code === 'treachery' || (match[3] || '').trim() === (card.subname || '').replace(/\s+/g, ' '))
            && (match[4] || '') === (card.xp > 0 ? String(card.xp) : '')

        if (!reads) {
            unreadable.push({ code: card.code, name: labelOf(card) })
        }
        else if (card.type_code === 'treachery' && card.subname
            && cardData.some(other => other.code !== card.code && other.name === card.name && !other.hidden && !other.duplicate_of_code && (other.xp || 0) === (card.xp || 0) && other.subname !== card.subname)) {
            ambiguous.push({ code: card.code, name: labelOf(card) })
        }
    })

    return { unreadable: unreadable, ambiguous: ambiguous }
}

function ExportTXT(props) {
    const deckTextData = []

    deckTextData.push(props.deckTitle + '\r\n\r\n')
    deckTextData.push(props.investigator.name + '\r\n\r\n')

    // each kind of card with its name in the singular for one card and in the plural for more (as ArkhamDB does)
    const sections = [
        [props.assets, 'Asset', 'Assets'],
        [props.events, 'Event', 'Events'],
        [props.skills, 'Skill', 'Skills'],
        [props.treacheries, 'Treachery', 'Treacheries'],
        [props.enemies, 'Enemy', 'Enemies'],
        [props.others, 'Other', 'Other']
    ]

    sections.forEach(([list, singular, plural]) => {
        if (list.length === 0) return

        deckTextData.push((list.length > 1 ? plural : singular) + '\r\n\r\n')
        list.forEach(item => { deckTextData.push(textLine(item)) })
        deckTextData.push('\r\n')
    })

    const element = document.createElement("a")
    const file = new Blob(deckTextData, {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = props.deckTitle.replace(/\s/g, '-') + ".txt"
    document.body.appendChild(element) // Required for this to work in FireFox
    element.click()
    document.body.removeChild(element)
}

export default ExportDeck