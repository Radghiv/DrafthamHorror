// How the editions of the game in each language call the types of the cards, as they are printed on the cards (taken from the translated
// ArkhamDB sites, whose card API gives these names in English only). Used for the labels over the pictures of the cards.
const TYPE_NAMES = {
    de: { asset: 'Vorteil', event: 'Ereignis', skill: 'Fertigkeit', treachery: 'Verrat', enemy: 'Gegner', weakness: 'Schwäche', basicweakness: 'Grundschwäche' },
    es: { asset: 'Apoyo', event: 'Evento', skill: 'Habilidad', treachery: 'Traición', enemy: 'Enemigo', weakness: 'Debilidad', basicweakness: 'Debilidad básica' },
    fr: { asset: 'Soutien', event: 'Événement', skill: 'Compétence', treachery: 'Traîtrise', enemy: 'Ennemi', weakness: 'Faiblesse', basicweakness: 'Faiblesse de base' },
    it: { asset: 'Supporto', event: 'Evento', skill: 'Abilità', treachery: 'Sventura', enemy: 'Nemico', weakness: 'Debolezza', basicweakness: 'Debolezza base' },
    pl: { asset: 'Atut', event: 'Wydarzenie', skill: 'Umiejętność', treachery: 'Podstęp', enemy: 'Wróg', weakness: 'Osłabienie', basicweakness: 'Podstawowe osłabienie' },
    pt: { asset: 'Ativo', event: 'Evento', skill: 'Perícia', treachery: 'Traição', enemy: 'Inimigo', weakness: 'Fraqueza', basicweakness: 'Fraqueza básica' },
    ko: { asset: '자산', event: '이벤트', skill: '능력', treachery: '음모', enemy: '적', weakness: '약점', basicweakness: '기본 약점' },
    ru: { asset: 'Актив', event: 'Событие', skill: 'Навык', treachery: 'Напасть', enemy: 'Враг', weakness: 'Слабость', basicweakness: 'Базовая слабость' },
    uk: { asset: 'Актив', event: 'Подія', skill: 'Навичка', treachery: 'Напасть', enemy: 'Ворог', weakness: 'Слабкість', basicweakness: 'Базова слабкість' },
    zh: { asset: '支援', event: '事件', skill: '技能', treachery: '詭計', enemy: '敵人', weakness: '弱點', basicweakness: '基礎弱點' }
}

// The English names, which are what the pictures have
const ENGLISH = { asset: 'Asset', event: 'Event', skill: 'Skill', treachery: 'Treachery', enemy: 'Enemy', weakness: 'Weakness', basicweakness: 'Basic Weakness' }

// The name of a type ('asset', 'event', 'skill', 'treachery', 'enemy', 'weakness' or 'basicweakness') in a language, or null when there is
// none or it is the English one
export function typeName(language, type) {
    const names = TYPE_NAMES[language]

    if (!names || !names[type] || names[type].toLowerCase() === ENGLISH[type].toLowerCase()) return null

    return names[type]
}

export default TYPE_NAMES
