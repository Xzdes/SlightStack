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

    const dynamicRuleGroups = {};

    for (const rule of rules) {
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

            if (!dynamicRuleGroups[selector]) dynamicRuleGroups[selector] = [];
            dynamicRuleGroups[selector].push(`${cssProp}: ${value};`);

        } else {
            if (rule.state && !activeStates.has(rule.state)) continue;
            finalProps[rule.prop] = rule.value;
        }
    }
    
    for(const selector in dynamicRuleGroups) {
        finalProps.dynamicRules.push(`${selector} { ${dynamicRuleGroups[selector].join(' ')} }`);
    }

    return finalProps;
}

module.exports = { resolveProps };