// Файл: core/vdom/props-resolver.js

const breakpointOrder = ['lg', 'md', 'sm', 'base'];
const stateOrder = ['focus', 'hover'];

function parsePropKey(key) {
    if (!key.includes(':')) {
        return { prop: key, breakpoint: 'base', state: null };
    }
    const parts = key.split(':');
    let prop, breakpoint = 'base', state = null;
    prop = parts.pop();
    for (const part of parts) {
        if (breakpointOrder.includes(part)) {
            breakpoint = part;
        } else if (stateOrder.includes(part)) {
            state = part;
        }
    }
    if (parts.filter(p => breakpointOrder.includes(p)).length > 1) {
        console.warn(`[SlightUI-Resolver] Некорректный ключ пропа "${key}".`);
        return null;
    }
    if (parts.filter(p => stateOrder.includes(p)).length > 1) {
         console.warn(`[SlightUI-Resolver] Некорректный ключ пропа "${key}".`);
        return null;
    }
    return { prop, breakpoint, state };
}

function resolveProps(rawProps, stateContainer, componentState) {
    const finalProps = {};
    const rules = [];
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
    const screenState = stateContainer.screenState || { breakpoint: 'base' };
    const activeBreakpoint = screenState.breakpoint || 'base';
    const activeBreakpointIndex = breakpointOrder.indexOf(activeBreakpoint);
    const activeStates = [];
    if (componentState.isFocused) activeStates.push('focus');
    if (componentState.isHovering) activeStates.push('hover');
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

module.exports = { resolveProps };