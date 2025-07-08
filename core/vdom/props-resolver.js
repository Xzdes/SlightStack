// Файл: core/vdom/props-resolver.js

const breakpointOrder = ['lg', 'md', 'sm', 'base'];
const stateOrder = ['focus', 'hover', 'group-hover'];
const pseudoClasses = ['first', 'last', 'even', 'odd'];
const pseudoElements = ['before', 'after'];

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
        dynamicRules: [] // Здесь будут храниться CSS-правила
    };
    const rules = [];

    for (const key in rawProps) {
        const parsed = parsePropKey(key);
        if (parsed) {
            rules.push({ ...parsed, value: rawProps[key] });
        } else {
            if (!key.includes(':')) {
                finalProps[key] = rawProps[key];
            }
        }
    }

    const screenState = stateContainer.screenState || { breakpoint: 'base' };
    const activeBreakpoint = screenState.breakpoint || 'base';
    const activeBreakpointIndex = breakpointOrder.indexOf(activeBreakpoint);
    
    const activeStates = new Set();
    if (componentState.isFocused) activeStates.add('focus');
    if (componentState.isHovering) activeStates.add('hover');

    rules.sort((a, b) => {
        const aBP = breakpointOrder.indexOf(a.breakpoint);
        const bBP = breakpointOrder.indexOf(b.breakpoint);
        if (aBP !== bBP) return aBP - bBP;

        const aState = a.state ? stateOrder.indexOf(a.state) : stateOrder.length;
        const bState = b.state ? stateOrder.indexOf(b.state) : stateOrder.length;
        if (aState !== bState) return aState - bState;

        const aPseudo = a.pseudo ? (pseudoClasses.indexOf(a.pseudo) !== -1 ? 0 : 1) : 2;
        const bPseudo = b.pseudo ? (pseudoClasses.indexOf(b.pseudo) !== -1 ? 0 : 1) : 2;
        return aPseudo - bPseudo;
    });

    for (const rule of rules) {
        const ruleBreakpointIndex = breakpointOrder.indexOf(rule.breakpoint);
        if (ruleBreakpointIndex < activeBreakpointIndex) continue;
        
        const cssProp = rule.prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);

        if (rule.pseudo) {
            let selector = '';
            if (rule.state === 'group-hover') selector += '[data-group-hover="true"] ';
            
            selector += `[data-v-scope-id]`;

            if (pseudoClasses.includes(rule.pseudo)) selector += `:${rule.pseudo}-child`;
            if (pseudoElements.includes(rule.pseudo)) selector += `::${rule.pseudo}`;

            let value = typeof rule.value === 'string' && !rule.value.startsWith('"') ? `"${rule.value}"` : rule.value;
            finalProps.dynamicRules.push(`${selector} { ${cssProp}: ${value}; }`);
            continue;
        }

        if (rule.state && !activeStates.has(rule.state)) continue;
        
        finalProps[rule.prop] = rule.value;
    }

    return finalProps;
}

module.exports = { resolveProps };