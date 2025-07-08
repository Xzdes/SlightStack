// Файл: core/vdom/props-resolver.js

const breakpointOrder = ['lg', 'md', 'sm', 'base'];
const stateOrder = ['focus', 'hover', 'group-hover'];
const pseudoClasses = ['first', 'last', 'even', 'odd', 'disabled'];
const pseudoElements = ['before', 'after', 'placeholder'];

function parsePropKey(key) {
    if (!key.includes(':')) {
        return { prop: key, breakpoint: 'base', state: null, pseudo: null };
    }
    const parts = key.split(':').filter(Boolean);
    let prop, breakpoint = 'base', state = null, pseudo = null;

    prop = parts.pop();
    
    for (const part of parts) {
        if (breakpointOrder.includes(part)) breakpoint = part;
        else if (stateOrder.includes(part)) state = part;
        else if (pseudoClasses.includes(part) || pseudoElements.includes(part)) pseudo = part;
    }

    return { prop, breakpoint, state, pseudo };
}

function resolveProps(rawProps, stateContainer, componentState) {
    const finalProps = {
        dynamicRules: []
    };
    const rules = [];

    for (const key in rawProps) {
        const parsed = parsePropKey(key);
        if (parsed) {
            rules.push({ ...parsed, value: rawProps[key] });
        } else if (!key.includes(':')) {
            finalProps[key] = rawProps[key];
        }
    }

    const screenState = stateContainer.screenState || { breakpoint: 'base' };
    const activeBreakpoint = screenState.breakpoint || 'base';
    const activeBreakpointIndex = breakpointOrder.indexOf(activeBreakpoint);
    
    const activeStates = new Set();
    if (componentState.isFocused) activeStates.add('focus');
    if (componentState.isHovering) activeStates.add('hover');
    
    // [КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ]
    // Сортируем правила от НАИМЕНЕЕ специфичных к НАИБОЛЕЕ специфичным.
    // Это позволит правильным значениям перезаписывать базовые.
    rules.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // Брейкпойнты (sm > base)
        scoreA += breakpointOrder.length - breakpointOrder.indexOf(a.breakpoint);
        scoreB += breakpointOrder.length - breakpointOrder.indexOf(b.breakpoint);
        
        // Состояния (hover > base)
        if (a.state) scoreA += 10;
        if (b.state) scoreB += 10;

        // Псевдо-селекторы
        if (a.pseudo) scoreA += 100;
        if (b.pseudo) scoreB += 100;
        
        return scoreA - scoreB;
    });

    for (const rule of rules) {
        // Пропускаем правила для неактивных брейкпойнтов
        const ruleBreakpointIndex = breakpointOrder.indexOf(rule.breakpoint);
        if (ruleBreakpointIndex < activeBreakpointIndex) continue;
        
        const isDynamicRule = rule.pseudo || rule.state === 'group-hover';

        if (isDynamicRule) {
            let selector = '';
            if (rule.state === 'group-hover') selector += '[data-group-hover="true"] ';
            selector += `[data-v-scope-id]`;
            if (pseudoClasses.includes(rule.pseudo)) selector += `:${rule.pseudo}-child`;
            else if (rule.state && rule.pseudo !=='disabled') selector += `:${rule.state}`;
            if (pseudoElements.includes(rule.pseudo)) selector += `::${rule.pseudo}`;
            
            const cssProp = rule.prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
            let value = rule.value;
            if(cssProp === 'content' && typeof value === 'string' && !value.startsWith('"')) {
                value = `"${value}"`;
            }
            finalProps.dynamicRules.push(`${selector} { ${cssProp}: ${value}; }`);
        } else {
            // Для обычных пропсов (включая :hover и :focus на сам элемент)
            if (rule.state && !activeStates.has(rule.state)) {
                // Если состояние неактивно, это правило нас не интересует.
                // Базовое правило (без состояния) уже было применено ранее благодаря сортировке.
                continue;
            }
            // Просто перезаписываем значение. Более специфичное правило придет позже и перезапишет это.
            finalProps[rule.prop] = rule.value;
        }
    }

    return finalProps;
}

module.exports = { resolveProps };