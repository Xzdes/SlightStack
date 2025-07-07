// Файл: core/props-resolver.js (CommonJS, исправленная версия)

const breakpointOrder = ['lg', 'md', 'sm', 'base']; // От большего к меньшему
const stateOrder = ['focus', 'hover']; // Порядок приоритета состояний

/**
 * Парсит ключ пропса (например, 'sm:hover:color') в структурированный объект.
 * @param {string} key - Ключ для парсинга.
 * @returns {Object|null} - Объект вида { prop: 'color', breakpoint: 'sm', state: 'hover' } или null.
 */
function parsePropKey(key) {
    if (!key.includes(':')) {
        return { prop: key, breakpoint: 'base', state: null };
    }

    const parts = key.split(':');
    let prop, breakpoint = 'base', state = null;

    // Последняя часть - всегда имя пропа
    prop = parts.pop();

    // Разбираем оставшиеся части
    for (const part of parts) {
        if (breakpointOrder.includes(part)) {
            breakpoint = part;
        } else if (stateOrder.includes(part)) {
            state = part;
        }
    }
    
    if (parts.filter(p => breakpointOrder.includes(p)).length > 1) {
        console.warn(`[SlightUI-Resolver] Некорректный ключ пропа "${key}". Нельзя использовать несколько брейкпойнтов.`);
        return null;
    }
    if (parts.filter(p => stateOrder.includes(p)).length > 1) {
         console.warn(`[SlightUI-Resolver] Некорректный ключ пропа "${key}". Нельзя использовать несколько состояний.`);
        return null;
    }

    return { prop, breakpoint, state };
}


/**
 * Вычисляет финальный объект пропсов на основе сырых пропсов и текущих состояний.
 * @param {Object} rawProps - "Сырые" пропсы из билдера, например {'sm:color': 'red'}.
 * @param {Object} stateContainer - Контейнер с глобальным реактивным объектом { screenState: { breakpoint: 'md' } }.
 * @param {Object} componentState - Состояние интерактивности { isHovering: true }.
 * @returns {Object} - "Плоский" объект с финальными пропсами для применения к DOM.
 */
function resolveProps(rawProps, stateContainer, componentState) {
    const finalProps = {};
    const rules = [];

    // 1. Парсим все ключи в структурированные правила
    for (const key in rawProps) {
        const parsed = parsePropKey(key);
        if (parsed) {
            rules.push({ ...parsed, value: rawProps[key], originalKey: key });
        } else {
            if (!key.includes(':')) {
                finalProps[key] = rawProps[key];
            }
        }
    }

    // 2. Определяем активные модификаторы
    // [ИЗМЕНЕНИЕ] Получаем screenState из контейнера и делаем проверку на null для безопасности.
    const screenState = stateContainer.screenState || { breakpoint: 'base' };
    const activeBreakpoint = screenState.breakpoint || 'base';
    const activeBreakpointIndex = breakpointOrder.indexOf(activeBreakpoint);
    
    const activeStates = [];
    if (componentState.isFocused) activeStates.push('focus');
    if (componentState.isHovering) activeStates.push('hover');

    // 3. Применяем правила с каскадным приоритетом
    rules.sort((a, b) => {
        const aBP = breakpointOrder.indexOf(a.breakpoint);
        const bBP = breakpointOrder.indexOf(b.breakpoint);
        if (aBP !== bBP) return aBP - bBP;

        const aState = a.state ? stateOrder.indexOf(a.state) : stateOrder.length;
        const bState = b.state ? stateOrder.indexOf(b.state) : stateOrder.length;
        return aState - bState;
    });

    for (const rule of rules) {
        const ruleBreakpointIndex = breakpointOrder.indexOf(rule.breakpoint);
        if (ruleBreakpointIndex < activeBreakpointIndex) {
            continue;
        }
        
        if (rule.state && !activeStates.includes(rule.state)) {
            continue;
        }
        
        finalProps[rule.prop] = rule.value;
    }

    return finalProps;
}

module.exports = {
    resolveProps
};